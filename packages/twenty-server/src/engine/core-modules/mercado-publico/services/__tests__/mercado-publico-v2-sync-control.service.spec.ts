import { ConflictException } from '@nestjs/common';

import {
  MercadoPublicoV2SyncControlService,
  buildMercadoPublicoV2SyncCommandFingerprint,
} from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

const IDEMPOTENCY_KEY = '11111111-1111-4111-8111-111111111111';
const queueConfig = {
  getSettings: () => ({ httpMaxRetries: 3, httpRetryBackoffMs: 1000 }),
};

const buildInput = (overrides: Record<string, unknown> = {}) =>
  ({
    workspaceId: 'workspace-1',
    actorUserWorkspaceId: 'user-workspace-1',
    action: 'start',
    idempotencyKey: IDEMPOTENCY_KEY,
    confirmed: true,
    ...overrides,
  }) as Parameters<MercadoPublicoV2SyncControlService['submitCommand']>[0];

const transactionUsing = (query: jest.Mock) =>
  jest.fn(
    async (
      runInTransaction: (entityManager: { query: jest.Mock }) => unknown,
    ) => runInTransaction({ query }),
  );

describe('MercadoPublicoV2SyncControlService', () => {
  it('loads safe latest-run counts and timeline through the core user workspace table', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'run-1',
          status: 'partial_failed',
          records_discovered: '3',
          records_hydrated: '2',
          records_failed: '1',
          records_deferred: '1',
          records_projected: '2',
          discovery_complete: true,
          completion_reason: 'page_budget_reached',
          created_at: null,
          updated_at: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          event_type: 'run_created',
          created_at: new Date('2026-08-13T00:00:00.000Z'),
          operator_name: 'Operator',
        },
      ])
      .mockResolvedValueOnce([
        {
          request_started_at: new Date('2026-08-13T00:00:01.000Z'),
          endpoint: '/compra-agil',
          http_status: 429,
          latency_ms: 212,
          attempt_number: 1,
          retryable: true,
          failure_class: 'rate_limit',
        },
      ]);
    const service = new MercadoPublicoV2SyncControlService(
      { query } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(service.getLatestRun('workspace-1')).resolves.toMatchObject({
      canResume: true,
      recordsDiscovered: 3,
      recordsHydrated: 2,
      recordsFailed: 1,
      recordsDeferred: 1,
      recordsProjected: 2,
      discoveryComplete: true,
      completionReason: 'page_budget_reached',
      safeSummary: 'La ejecución no se completó.',
      timeline: [{ operatorName: 'Operator' }],
      httpAttempts: [
        { endpoint: '/compra-agil', httpStatus: 429, retryable: true },
      ],
    });
    expect(query.mock.calls[0][0]).not.toContain('error_summary');
    expect(query.mock.calls[1][0]).toContain('core."userWorkspace"');
    expect(query.mock.calls[1][0]).toContain(
      'concat_ws(\' \', u."firstName", u."lastName")',
    );
  });

  it('rejects resume for a discovery-incomplete cancellation', async () => {
    const latestRunQuery = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'run-1',
          status: 'cancelled',
          error_stage: 'discovering',
          discovery_complete: false,
          records_discovered: '1',
          records_hydrated: '0',
          records_failed: '0',
          created_at: null,
          updated_at: null,
        },
      ])
      .mockResolvedValueOnce([]);
    latestRunQuery.mockResolvedValueOnce([]);
    const latestRunService = new MercadoPublicoV2SyncControlService(
      { query: latestRunQuery } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(
      latestRunService.getLatestRun('workspace-1'),
    ).resolves.toMatchObject({
      canResume: false,
    });

    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(
      service.submitCommand(
        buildInput({ action: 'resume', confirmed: undefined }),
      ),
    ).rejects.toThrow(ConflictException);

    const resumeUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('WITH resumable_run'),
    );

    expect(resumeUpdate?.[0]).toContain('discovery_complete = true');
    expect(resumeUpdate?.[0]).toContain("error_stage = 'hydrating'");
  });

  it('preserves item attempt checkpoints when resuming hydration', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('WITH resumable_run')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await service.submitCommand(
      buildInput({ action: 'resume', confirmed: undefined }),
    );

    const requeueUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('UPDATE mp.sync_run_item'),
    );

    expect(requeueUpdate?.[0]).not.toContain('attempts = 0');
  });

  it('rejects a malformed idempotency key before touching the database', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(
      service.submitCommand(buildInput({ idempotencyKey: 'not-a-uuid' })),
    ).rejects.toThrow(/valid UUID/);

    expect(query).not.toHaveBeenCalled();
  });

  it('persists the selected page budget with a new run', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await service.submitCommand(buildInput({ maxPages: 2 }));

    const runInsert = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO mp.sync_run ('),
    );

    const storedParams = JSON.parse(runInsert?.[1][1] as string) as Record<
      string,
      unknown
    >;

    expect(storedParams).toMatchObject({ max_pages: 2 });
  });

  it('persists a frozen watermark window when an operator starts without a page budget', async () => {
    const watermarkAt = new Date('2026-08-14T12:00:00.000Z');
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }
      if (sql.includes('FROM mp.source_watermark')) {
        return Promise.resolve([{ watermark_at: watermarkAt }]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await service.submitCommand(buildInput());

    const runInsert = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO mp.sync_run ('),
    );

    const storedParams = JSON.parse(runInsert?.[1][1] as string) as Record<
      string,
      unknown
    >;

    expect(storedParams).toMatchObject({
      cambio_desde: expect.any(String),
      cambio_hasta: expect.any(String),
    });
    expect(storedParams).not.toHaveProperty('max_pages');
    expect(storedParams.cambio_desde).not.toBe(storedParams.cambio_hasta);
    expect(runInsert?.[1][2]).toEqual(watermarkAt);
  });

  it('returns the saved result when an operator replays the same key and request', async () => {
    const savedResult = { state: 'queued', syncRunId: 'run-1' };
    const existingCommand = {
      id: 'command-1',
      state: 'succeeded',
      request_fingerprint: buildMercadoPublicoV2SyncCommandFingerprint({
        action: 'start',
        confirmed: true,
      }),
      result: savedResult,
    };
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('FROM mp.sync_command')) {
        return Promise.resolve([existingCommand]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    const result = await service.submitCommand(buildInput());

    expect(result).toEqual(savedResult);
    const insertCalls = query.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO mp.sync_command'),
    );

    expect(insertCalls).toHaveLength(0);
  });

  it('rejects a changed request for an existing key with a conflict', async () => {
    const existingCommand = {
      id: 'command-1',
      state: 'succeeded',
      request_fingerprint: 'fingerprint-a',
      result: { state: 'queued' },
    };
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('FROM mp.sync_command')) {
        return Promise.resolve([existingCommand]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(
      service.submitCommand(
        buildInput({ idempotencyKey: IDEMPOTENCY_KEY, confirmed: true }),
      ),
    ).rejects.toThrow(/409|conflict/i);
  });

  it('preserves conflict semantics when a changed request loses the insert race', async () => {
    let commandReads = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('FROM mp.sync_command')) {
        commandReads += 1;

        return Promise.resolve(
          commandReads === 1
            ? []
            : [
                {
                  id: 'command-1',
                  state: 'pending',
                  request_fingerprint: 'different-fingerprint',
                  sync_run_id: null,
                  result: null,
                },
              ],
        );
      }
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(service.submitCommand(buildInput())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('reuses a same-workspace active run and returns its safe status', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return Promise.resolve([]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          {
            id: 'run-active',
            status: 'hydrating',
            control_workspace_id: 'workspace-1',
          },
        ]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    const result = await service.submitCommand(buildInput());

    expect(result).toMatchObject({ state: 'reused', syncRunId: 'run-active' });
    const auditCalls = query.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO mp.sync_run_audit'),
    );

    expect(auditCalls.length).toBeGreaterThan(0);
    expect(auditCalls.some(([sql]) => sql.includes('reused'))).toBe(true);
  });

  it('returns only global_sync_active when a foreign workspace owns the run', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return Promise.resolve([]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          {
            id: 'run-foreign',
            status: 'discovering',
            control_workspace_id: 'workspace-2',
          },
        ]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    const result = await service.submitCommand(buildInput());

    expect(result).toMatchObject({ state: 'global_sync_active' });
    expect(result).not.toHaveProperty('syncRunId');
    expect(JSON.stringify(result)).not.toContain('run-foreign');
    expect(JSON.stringify(result)).not.toContain('workspace-2');
  });

  it('creates exactly one run under concurrent global starts', async () => {
    const insertRun = jest.fn().mockResolvedValueOnce([]);
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return insertRun();
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          {
            id: 'run-active',
            status: 'queued',
            control_workspace_id: 'workspace-1',
          },
        ]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(service.submitCommand(buildInput())).resolves.toMatchObject({
      state: 'reused',
    });
    expect(insertRun).toHaveBeenCalledTimes(1);
  });

  it('reports queued and keeps the command dispatchable when enqueue fails', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }

      return Promise.resolve([]);
    });
    const messageQueueService = {
      add: jest.fn().mockRejectedValue(new Error('redis unavailable')),
    } as unknown as jest.Mocked<MessageQueueService>;
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      messageQueueService,
      queueConfig as never,
      {} as never,
    );

    const result = await service.submitCommand(buildInput());

    expect(result).toMatchObject({ state: 'queued' });
    const commandFailedCalls = query.mock.calls.filter(([sql]) =>
      sql.includes("state = 'failed'"),
    );

    expect(commandFailedCalls).toHaveLength(0);
    expect(result).not.toHaveProperty('error');
  });

  it('claims a command, creates its attempt, and writes its heartbeat in one transaction', async () => {
    const managerQuery = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT id, workspace_id, action, state, sync_run_id')) {
        return Promise.resolve([
          {
            id: 'command-1',
            workspace_id: 'workspace-1',
            action: 'start',
            state: 'pending',
            sync_run_id: 'run-1',
          },
        ]);
      }
      if (sql.includes("SET state = 'claimed'")) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('COALESCE(MAX(attempt_number)')) {
        return Promise.resolve([{ next_attempt: '1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run_attempt')) {
        return Promise.resolve([{ id: 'attempt-1' }]);
      }

      return Promise.resolve([]);
    });
    const coreQuery = jest.fn(() => {
      throw new Error('claim must use the transaction manager');
    });
    const transaction = transactionUsing(managerQuery);
    const service = new MercadoPublicoV2SyncControlService(
      { query: coreQuery, transaction } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await expect(
      service.claimCommand('command-1', 'worker-1'),
    ).resolves.toMatchObject({
      kind: 'claimed',
      attemptId: 'attempt-1',
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(coreQuery).not.toHaveBeenCalled();
    expect(
      managerQuery.mock.calls.some(([sql]) =>
        sql.includes('SET heartbeat_at = now()'),
      ),
    ).toBe(true);
  });

  it('keeps the command pending while queue attempts remain and fails on the final attempt', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('UPDATE mp.sync_command')) {
        return Promise.resolve([
          { workspace_id: 'workspace-1', sync_run_id: 'run-1' },
        ]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await service.finalizeCommand({
      commandId: 'command-1',
      attemptId: 'attempt-1',
      attemptNumber: 2,
      status: 'retryable_failed',
    });

    const pendingUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('UPDATE mp.sync_command'),
    );

    expect(pendingUpdate?.[1]).toEqual([
      'command-1',
      'pending',
      null,
      'attempt-1',
    ]);
    expect(pendingUpdate?.[0]).toContain(
      "finished_at = CASE WHEN $2 = 'pending' THEN NULL ELSE now() END",
    );

    await service.finalizeCommand({
      commandId: 'command-1',
      attemptId: 'attempt-2',
      attemptNumber: 4,
      status: 'retryable_failed',
    });

    const commandUpdates = query.mock.calls.filter(([sql]: [string]) =>
      sql.includes('UPDATE mp.sync_command'),
    );
    const failedUpdate = commandUpdates[commandUpdates.length - 1];

    expect(failedUpdate?.[1]).toEqual([
      'command-1',
      'failed',
      null,
      'attempt-2',
    ]);
  });

  it('defers a rate-limited command until the provider quota reset', async () => {
    const retryAt = new Date(Date.now() + 60_000);
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('UPDATE mp.sync_command')) {
        return Promise.resolve([
          { workspace_id: 'workspace-1', sync_run_id: 'run-1' },
        ]);
      }

      return Promise.resolve([]);
    });
    const add = jest.fn().mockResolvedValue({});
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      { add } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await service.deferCommand({
      commandId: 'command-1',
      attemptId: 'attempt-1',
      retryAt,
    });

    expect(add).toHaveBeenCalledWith(
      'mercado-publico-v2-sync-command',
      { commandId: 'command-1' },
      expect.objectContaining({ retryLimit: 0 }),
    );
    const deferredDelay = add.mock.calls[0]?.[2]?.delay as number;

    expect(deferredDelay).toBeGreaterThanOrEqual(0);
    expect(deferredDelay).toBeLessThanOrEqual(
      retryAt.getTime() - Date.now() + 1000,
    );
    const attemptUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('UPDATE mp.sync_run_attempt'),
    );

    expect(attemptUpdate?.[0]).toContain("state = 'failed'");
    expect(attemptUpdate?.[1]).toContain('attempt-1');
  });

  it('appends audit events and never mutates existing audit rows', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run (')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: transactionUsing(query) } as never,
      {
        add: jest.fn().mockResolvedValue({}),
      } as unknown as MessageQueueService,
      queueConfig as never,
      {} as never,
    );

    await service.submitCommand(buildInput());

    const auditStatements = query.mock.calls
      .map(([sql]) => sql as string)
      .filter((sql) => sql.includes('mp.sync_run_audit'));

    expect(auditStatements.length).toBeGreaterThan(0);
    expect(auditStatements.every((sql) => sql.includes('INSERT'))).toBe(true);
    expect(
      auditStatements.some(
        (sql) => sql.includes('UPDATE') || sql.includes('DELETE'),
      ),
    ).toBe(false);
  });

  it('settles only successful focused recovery runs', async () => {
    let claimCalls = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('ORDER BY updated_at ASC')) {
        return Promise.resolve([
          { id: 'item-1', codigo: 'CA-DEFERRED-001' },
          { id: 'item-2', codigo: 'CA-DEFERRED-002' },
        ]);
      }
      if (sql.includes('RETURNING codigo')) {
        claimCalls += 1;

        return Promise.resolve([
          { codigo: claimCalls === 1 ? 'CA-DEFERRED-001' : 'CA-DEFERRED-002' },
        ]);
      }
      if (sql.includes('RETURNING original.sync_run_id')) {
        return Promise.resolve([{ sync_run_id: 'original-run-1' }]);
      }

      return Promise.resolve([]);
    });
    const dataSource = {
      query,
      transaction: jest
        .fn()
        .mockImplementation(async (callback) => callback({ query })),
    };
    const start = jest
      .fn()
      .mockResolvedValueOnce({
        status: 'succeeded',
        syncRunId: 'recovery-run-1',
      })
      .mockResolvedValueOnce({
        status: 'partial_failed',
        syncRunId: 'recovery-run-2',
      });
    const service = new MercadoPublicoV2SyncControlService(
      dataSource as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      { start } as never,
    );

    await expect(service.recoverDeferredHydrations()).resolves.toBe(2);

    expect(start).toHaveBeenCalledTimes(2);
    expect(start).toHaveBeenCalledWith({ id: 'CA-DEFERRED-001' }, 'recovery');
    expect(start).toHaveBeenCalledWith({ id: 'CA-DEFERRED-002' }, 'recovery');
    const dueQuery = query.mock.calls.find(([sql]: [string]) =>
      sql.includes('make_interval(secs => pow(2, LEAST(attempts, 12))'),
    );

    expect(dueQuery?.[0]).toContain("status = 'deferred'");
    expect(dueQuery?.[0]).toContain("snapshot_kind = 'detail'");
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    const settledItemQuery = query.mock.calls.find(([sql]: [string]) =>
      sql.includes('UPDATE mp.sync_run_item original'),
    );
    const refreshedRunQuery = query.mock.calls.find(([sql]: [string]) =>
      sql.includes('UPDATE mp.sync_run run'),
    );

    expect(settledItemQuery?.[1]).toEqual(['item-1', 'recovery-run-1']);
    expect(refreshedRunQuery?.[0]).toContain('records_deferred');
    expect(refreshedRunQuery?.[0]).toContain("run.status = 'partial_failed'");
    expect(refreshedRunQuery?.[1]).toEqual(['original-run-1']);
  });

  it('does not dispatch a deferred item whose observation is already fresher', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const start = jest.fn();
    const service = new MercadoPublicoV2SyncControlService(
      { query } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
      { start } as never,
    );

    await expect(service.recoverDeferredHydrations()).resolves.toBe(0);

    expect(start).not.toHaveBeenCalled();
  });
});
