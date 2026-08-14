import { type QueryRunner } from 'typeorm';

import { MpV2DetailContractFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1790000000000-mp-v2-detail-contract';

describe('MpV2DetailContractFastInstanceCommand', () => {
  const buildQueryRunner = () => {
    const query = jest.fn().mockResolvedValue(undefined);

    return {
      query,
      runner: { query } as unknown as QueryRunner,
    };
  };

  it('extends the gold read model with the confirmed detail contract fields', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2DetailContractFastInstanceCommand().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS description text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS delivery_address text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS delivery_days integer NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS cancellation_at timestamptz NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS call_description text NULL');
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS call_first_closing_at timestamptz NULL',
    );
    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS call_second_closing_at timestamptz NULL',
    );
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS budget_type text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS budget_estimate text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS budget_currency text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS cancel_motive text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS deserted_motive text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS selection_motive text NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS total_offers integer NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS total_demands integer NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS fine_penalty text NULL');
    expect(sql).toContain(
      'ALTER TABLE mp.v2_cohort\n        ADD COLUMN IF NOT EXISTS lifecycle_reason text NULL',
    );
    expect(sql).toContain(
      'ALTER TABLE mp.v2_child_evidence\n        ADD COLUMN IF NOT EXISTS parent_provider_key text NULL',
    );
  });

  it('creates the relation snapshot table with truthful availability semantics', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2DetailContractFastInstanceCommand().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS mp.v2_relation_snapshot');
    expect(sql).toContain(
      'CONSTRAINT "uq_mp_v2_relation_snapshot_observation_relation"',
    );
    expect(sql).toContain(
      "CHECK (availability IN ('available', 'unavailable'))",
    );
    expect(sql).toContain("CHECK (source_kind IN ('list', 'detail'))");
    expect(sql).toContain('CHECK (total_count >= 0)');
    expect(sql).toContain(
      'FOREIGN KEY (observation_id) REFERENCES mp.v2_observation(id) ON DELETE CASCADE',
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS "idx_mp_v2_relation_snapshot_codigo_relation"',
    );
  });

  it('reverts every change without touching unrelated objects', async () => {
    const { query, runner } = buildQueryRunner();

    await new MpV2DetailContractFastInstanceCommand().down(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('DROP TABLE IF EXISTS mp.v2_relation_snapshot');
    expect(sql).toContain('DROP COLUMN IF EXISTS parent_provider_key');
    expect(sql).toContain('DROP COLUMN IF EXISTS lifecycle_reason');
    expect(sql).toContain('DROP COLUMN IF EXISTS description');
    expect(sql).toContain('DROP COLUMN IF EXISTS fine_penalty');
    expect(sql).toContain('DROP COLUMN IF EXISTS budget_estimate');
  });
});
