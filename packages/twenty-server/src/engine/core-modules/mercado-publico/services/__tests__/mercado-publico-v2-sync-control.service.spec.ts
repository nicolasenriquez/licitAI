import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

const IDEMPOTENCY_KEY = '11111111-1111-4111-8111-111111111111';

const buildInput = (overrides: Record<string, unknown> = {}) =>
  ({
    workspaceId: 'workspace-1',
    actorUserWorkspaceId: 'user-workspace-1',
    action: 'start',
    idempotencyKey: IDEMPOTENCY_KEY,
    confirmed: true,
    ...overrides,
  }) as Parameters<
    MercadoPublicoV2SyncControlService['submitCommand']
  >[0];

describe('MercadoPublicoV2SyncControlService', () => {
  it('returns the saved result when an operator replays the same key and request', async () => {
    const savedResult = { state: 'queued', syncRunId: 'run-1' };
    const existingCommand = {
      id: 'command-1',
      state: 'succeeded',
      request_fingerprint: 'fingerprint-a',
      result: savedResult,
    };
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('FROM mp.sync_command')) {
        return Promise.resolve([existingCommand]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: jest.fn() } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
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
      { query, transaction: jest.fn() } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
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
      if (sql.includes('INSERT INTO mp.sync_run')) {
        const error = new Error('duplicate key value violates unique constraint') as Error & {
          code: string;
        };

        error.code = '23505';

        return Promise.reject(error);
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
      { query, transaction: jest.fn() } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
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
      if (sql.includes('INSERT INTO mp.sync_run')) {
        const error = new Error('duplicate key value violates unique constraint') as Error & {
          code: string;
        };

        error.code = '23505';

        return Promise.reject(error);
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
      { query, transaction: jest.fn() } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
    );

    const result = await service.submitCommand(buildInput());

    expect(result).toMatchObject({ state: 'global_sync_active' });
    expect(result).not.toHaveProperty('syncRunId');
    expect(JSON.stringify(result)).not.toContain('run-foreign');
    expect(JSON.stringify(result)).not.toContain('workspace-2');
  });

  it('creates exactly one run under concurrent global starts', async () => {
    const insertRun = jest
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('unique violation'), { code: '23505' }),
      );
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run')) {
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
      { query, transaction: jest.fn() } as never,
      { add: jest.fn() } as unknown as MessageQueueService,
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
      if (sql.includes('INSERT INTO mp.sync_run')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }

      return Promise.resolve([]);
    });
    const messageQueueService = {
      add: jest.fn().mockRejectedValue(new Error('redis unavailable')),
    } as unknown as jest.Mocked<MessageQueueService>;
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: jest.fn() } as never,
      messageQueueService,
    );

    const result = await service.submitCommand(buildInput());

    expect(result).toMatchObject({ state: 'queued' });
    const commandFailedCalls = query.mock.calls.filter(([sql]) =>
      sql.includes("state = 'failed'"),
    );

    expect(commandFailedCalls).toHaveLength(0);
    expect(result).not.toHaveProperty('error');
  });

  it('appends audit events and never mutates existing audit rows', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_command')) {
        return Promise.resolve([{ id: 'command-1' }]);
      }
      if (sql.includes('INSERT INTO mp.sync_run')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2SyncControlService(
      { query, transaction: jest.fn() } as never,
      { add: jest.fn().mockResolvedValue({}) } as unknown as MessageQueueService,
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
