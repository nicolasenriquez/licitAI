import { type QueryRunner } from 'typeorm';

import { MpV2EvidenceRollbackCompatibilityFastInstanceCommand } from './2-16-instance-command-fast-1788000000000-mp-v2-evidence-rollback-compatibility';

describe('MpV2EvidenceRollbackCompatibilityFastInstanceCommand', () => {
  it('deduplicates retained observations before the old unique constraint returns', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2EvidenceRollbackCompatibilityFastInstanceCommand().down(
      queryRunner,
    );

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain('mp_v2_observation_duplicates');
    expect(executedSql).toContain('PARTITION BY sync_run_id, codigo, payload_checksum');
    expect(executedSql).toContain('UPDATE mp.sync_run_item');
    expect(executedSql).toContain('DELETE FROM mp.v2_observation');
  });
});
