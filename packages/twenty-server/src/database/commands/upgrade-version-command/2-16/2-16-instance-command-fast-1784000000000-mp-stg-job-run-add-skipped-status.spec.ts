import { type QueryRunner } from 'typeorm';

import { MpStgJobRunAddSkippedStatusFastInstanceCommand } from './2-16-instance-command-fast-1784000000000-mp-stg-job-run-add-skipped-status';

describe('MpStgJobRunAddSkippedStatusFastInstanceCommand', () => {
  it('normalizes skipped rows before restoring the legacy constraint', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpStgJobRunAddSkippedStatusFastInstanceCommand().down(queryRunner);

    const executedSql = query.mock.calls.map(([sql]: [string]) => sql);

    expect(executedSql[1]).toContain("to_regclass('mp.stg_job_run')");
    expect(executedSql[1]).toContain("SET status = 'soft_miss'");
    expect(executedSql[1]).toContain("WHERE status = 'skipped'");
    expect(executedSql[2]).toContain("'retryable_failed'\n        ))");
  });
});
