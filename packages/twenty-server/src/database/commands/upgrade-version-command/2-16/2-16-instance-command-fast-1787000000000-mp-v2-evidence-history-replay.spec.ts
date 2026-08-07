import { type QueryRunner } from 'typeorm';

import { MpV2EvidenceHistoryReplayFastInstanceCommand } from './2-16-instance-command-fast-1787000000000-mp-v2-evidence-history-replay';

describe('MpV2EvidenceHistoryReplayFastInstanceCommand', () => {
  it('removes the observation dedupe constraint and adds provenance columns', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2EvidenceHistoryReplayFastInstanceCommand().up(queryRunner);

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain(
      'DROP CONSTRAINT IF EXISTS "uq_mp_v2_observation_run_code_checksum"',
    );
    expect(executedSql).toContain('ADD COLUMN IF NOT EXISTS source text');
    expect(executedSql).toContain('ADD COLUMN IF NOT EXISTS snapshot_kind');
    expect(executedSql).toContain(
      'ADD COLUMN IF NOT EXISTS provider_changed_at timestamptz NULL',
    );
    expect(executedSql).toContain('CREATE TABLE IF NOT EXISTS mp.v2_history');
    expect(executedSql).toContain(
      'CONSTRAINT "ck_mp_v2_history_fingerprints_differ"',
    );
    expect(executedSql).toContain(
      'CREATE TABLE IF NOT EXISTS mp.v2_child_evidence',
    );
    expect(executedSql).toContain(
      'ADD COLUMN IF NOT EXISTS observation_id uuid NULL',
    );
    expect(executedSql).toContain('ADD COLUMN IF NOT EXISTS amount_raw text');
  });

  it('restores the observation dedupe constraint and drops new objects on down', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2EvidenceHistoryReplayFastInstanceCommand().down(queryRunner);

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain('DROP TABLE IF EXISTS mp.v2_child_evidence');
    expect(executedSql).toContain('DROP TABLE IF EXISTS mp.v2_history');
    expect(executedSql).toContain(
      'ADD CONSTRAINT "uq_mp_v2_observation_run_code_checksum"',
    );
    expect(executedSql).toContain('DROP COLUMN IF EXISTS observation_id');
  });
});
