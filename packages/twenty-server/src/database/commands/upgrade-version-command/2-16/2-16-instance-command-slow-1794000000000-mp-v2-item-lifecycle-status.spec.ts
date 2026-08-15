import { type DataSource, type QueryRunner } from 'typeorm';

import { MpV2ItemLifecycleStatusSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1794000000000-mp-v2-item-lifecycle-status';

describe('MpV2ItemLifecycleStatusSlowInstanceCommand', () => {
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

  it('drops the legacy status check and adds the deferred counter in the schema phase', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2ItemLifecycleStatusSlowInstanceCommand().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_status"');
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS records_deferred integer NOT NULL DEFAULT 0',
    );
    expect(sql).not.toContain('lifecycle_terminal');
  });

  it('backfills legacy terminal rows and restores the status check', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new MpV2ItemLifecycleStatusSlowInstanceCommand().runDataMigration({
      query,
    } as unknown as DataSource);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain(
      "WHEN error_summary IS NULL THEN 'lifecycle_terminal'",
    );
    expect(sql).toContain(
      "WHEN error_summary LIKE 'retryable_failed%' THEN 'deferred'",
    );
    expect(sql).toContain("ELSE 'failed'");
    expect(sql).toContain("status IN (\n            'pending',");
    expect(sql).toContain("'lifecycle_terminal',");
    expect(sql).toContain("'deferred'");
  });

  it('blocks rollback while split-status rows exist', async () => {
    const { query, runner } = buildQueryRunner('4');

    await expect(
      new MpV2ItemLifecycleStatusSlowInstanceCommand().down(runner),
    ).rejects.toThrow('while split-status rows exist');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('restores the legacy status check and drops the counter when rollback is safe', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2ItemLifecycleStatusSlowInstanceCommand().down(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain(
      "CHECK (status IN ('pending', 'processing', 'succeeded', 'terminal'))",
    );
    expect(sql).toContain('DROP COLUMN IF EXISTS records_deferred');
  });
});
