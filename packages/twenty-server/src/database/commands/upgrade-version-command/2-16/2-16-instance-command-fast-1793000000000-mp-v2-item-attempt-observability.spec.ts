import { type QueryRunner } from 'typeorm';

import { MpV2ItemAttemptObservabilityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1793000000000-mp-v2-item-attempt-observability';

describe('MpV2ItemAttemptObservabilityFastInstanceCommand', () => {
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

  it('creates the attempt table and additive observability columns', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2ItemAttemptObservabilityFastInstanceCommand().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS mp.sync_run_item_attempt');
    expect(sql).toContain(
      'UNIQUE (sync_run_item_id, attempt_number)',
    );
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS records_returned integer NOT NULL DEFAULT 0',
    );
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS provider_records_seen integer NOT NULL DEFAULT 0',
    );
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS discovery_complete boolean NOT NULL DEFAULT false',
    );
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS completion_reason text NULL',
    );
  });

  it('blocks rollback while attempt evidence exists', async () => {
    const { query, runner } = buildQueryRunner('4');

    await expect(
      new MpV2ItemAttemptObservabilityFastInstanceCommand().down(runner),
    ).rejects.toThrow('while attempt rows exist');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('drops only observability objects when rollback is safe', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2ItemAttemptObservabilityFastInstanceCommand().down(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('DROP TABLE IF EXISTS mp.sync_run_item_attempt');
    expect(sql).toContain('DROP COLUMN IF EXISTS completion_reason');
    expect(sql).toContain('DROP COLUMN IF EXISTS discovery_complete');
    expect(sql).toContain('DROP COLUMN IF EXISTS records_hydration_skipped');
    expect(sql).toContain('DROP COLUMN IF EXISTS records_hydration_required');
    expect(sql).toContain('DROP COLUMN IF EXISTS provider_records_seen');
    expect(sql).toContain('DROP COLUMN IF EXISTS records_returned');
  });
});
