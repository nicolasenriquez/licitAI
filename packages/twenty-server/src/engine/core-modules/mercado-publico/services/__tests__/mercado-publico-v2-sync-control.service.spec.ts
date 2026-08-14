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
      ]);
    const service = new MercadoPublicoV2SyncControlService(
      { query } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
    );

    await expect(service.getLatestRun('workspace-1')).resolves.toMatchObject({
      canResume: true,
      recordsDiscovered: 3,
      recordsHydrated: 2,
      recordsFailed: 1,
      safeSummary: 'La ejecución no se completó.',
      timeline: [{ operatorName: 'Operator' }],
    });
    expect(query.mock.calls[0][0]).not.toContain('error_summary');
    expect(query.mock.calls[1][0]).toContain('core."userWorkspace"');
    expect(query.mock.calls[1][0]).toContain(
      'concat_ws(\' \', u."firstName", u."lastName")',
    );
  });

  it('offers resume for a discovery cancellation and restores the discovery stage', async () => {
    const latestRunQuery = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'run-1',
          status: 'cancelled',
          error_stage: 'discovering',
          records_discovered: '1',
          records_hydrated: '0',
          records_failed: '0',
          created_at: null,
          updated_at: null,
        },
      ])
      .mockResolvedValueOnce([]);
    const latestRunService = new MercadoPublicoV2SyncControlService(
      { query: latestRunQuery } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
      queueConfig as never,
    );

    await expect(
      latestRunService.getLatestRun('workspace-1'),
    ).resolves.toMatchObject({
      canResume: true,
    });

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
    );

    await expect(
      service.submitCommand(
        buildInput({ action: 'resume', confirmed: undefined }),
      ),
    ).resolves.toMatchObject({ state: 'queued', syncRunId: 'run-1' });

    const resumeUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('WITH resumable_run'),
    );

    expect(resumeUpdate?.[0]).toContain(
      "WHEN r.error_stage = 'discovering' THEN 'discovering'",
    );
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
    );

    await service.submitCommand(buildInput({ maxPages: 2 }));

    const runInsert = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO mp.sync_run ('),
    );

    expect(runInsert?.[1]).toContain(JSON.stringify({ max_pages: 2 }));
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
    );

    await expect(
      service.submitCommand(
        buildInput({ idempotencyKey: IDEMPOTENCY_KEY, confirmed: true }),
      ),
    ).rejects.toThrow(/409|conflict/i);
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

  it('keeps retryable provider failures terminal after the worker attempt', async () => {
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
    );

    await service.finalizeCommand({
      commandId: 'command-1',
      attemptId: 'attempt-1',
      status: 'retryable_failed',
    });

    const commandUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('UPDATE mp.sync_command'),
    );
    expect(commandUpdate?.[1]).toEqual(['command-1', 'failed', null]);
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
});
