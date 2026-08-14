import { type QueryRunner } from 'typeorm';

import { MpV2DurableHydrationRecoveryFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1792000000000-mp-v2-durable-hydration-recovery';

describe('MpV2DurableHydrationRecoveryFastInstanceCommand', () => {
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

  it('adds durable execution and hydration planning columns', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2DurableHydrationRecoveryFastInstanceCommand().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS execution_key uuid NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS hydration_required boolean');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS hydration_reason text NULL');
    expect(sql).toContain('idx_mp_sync_run_execution_key');
    expect(sql).toContain('idx_mp_sync_run_item_pending_hydration');
  });

  it('blocks rollback after durable execution or hydration decisions exist', async () => {
    const { query, runner } = buildQueryRunner('1');

    await expect(
      new MpV2DurableHydrationRecoveryFastInstanceCommand().down(runner),
    ).rejects.toThrow('while execution or hydration decisions exist');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('removes only recovery schema when rollback is safe', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2DurableHydrationRecoveryFastInstanceCommand().down(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('DROP INDEX IF EXISTS "idx_mp_sync_run_execution_key"');
    expect(sql).toContain('DROP COLUMN IF EXISTS hydration_required');
    expect(sql).toContain('DROP COLUMN IF EXISTS execution_key');
  });
});
