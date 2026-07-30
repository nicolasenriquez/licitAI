import { type QueryRunner } from 'typeorm';

import { MpStgJobRunAddPartialStatusFastInstanceCommand } from './2-16-instance-command-fast-1785354861320-mp-stg-job-run-add-partial-status';

describe('MpStgJobRunAddPartialStatusFastInstanceCommand', () => {
  it('adds partial and restores a safe prior status on downgrade', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const command = new MpStgJobRunAddPartialStatusFastInstanceCommand();

    await command.up({ query } as unknown as QueryRunner);
    await command.down({ query } as unknown as QueryRunner);

    const executedSql = query.mock.calls.map(([sql]: [string]) => sql);

    expect(executedSql[1]).toContain("'partial'");
    expect(executedSql[3]).toContain("SET status = 'failed'");
    expect(executedSql[4]).not.toContain("'partial'");
  });
});
