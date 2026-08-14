import { type QueryRunner } from 'typeorm';

import { MpV2SyncOperationsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1791000000000-mp-v2-sync-operations';

describe('MpV2SyncOperationsFastInstanceCommand', () => {
  const buildQueryRunner = (incompatibleCount = '0') => {
    const query = jest.fn().mockImplementation((statement: string) => {
      if (statement.includes('incompatible_count')) {
        return Promise.resolve([{ incompatible_count: incompatibleCount }]);
      }

      return Promise.resolve(undefined);
    });

    return {
      query,
      runner: { query } as unknown as QueryRunner,
    };
  };

  it('creates the durable control schema and one-active-run index', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2SyncOperationsFastInstanceCommand().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('ALTER TABLE mp.sync_run');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS mp.sync_operator');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS mp.sync_command');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS mp.sync_run_attempt');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS mp.sync_run_audit');
    expect(sql).toContain(
      'UNIQUE (workspace_id, idempotency_key)',
    );
    expect(sql).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uq_mp_sync_run_active_v2_source_scope"',
    );
    expect(sql).toContain("status IN ('queued', 'discovering', 'hydrating', 'projecting', 'reconciling')");
  });

  it('blocks rollback when any G3 data exists', async () => {
    const { query, runner } = buildQueryRunner('1');

    await expect(
      new MpV2SyncOperationsFastInstanceCommand().down(runner),
    ).rejects.toThrow('while control data exists');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('drops only G3 objects when rollback is safe', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2SyncOperationsFastInstanceCommand().down(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('DROP TABLE IF EXISTS mp.sync_run_audit');
    expect(sql).toContain('DROP TABLE IF EXISTS mp.sync_run_attempt');
    expect(sql).toContain('DROP TABLE IF EXISTS mp.sync_command');
    expect(sql).toContain('DROP TABLE IF EXISTS mp.sync_operator');
    expect(sql).toContain('DROP COLUMN IF EXISTS control_workspace_id');
  });
});
