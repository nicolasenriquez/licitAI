import { type QueryRunner } from 'typeorm';

import { MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand } from './2-16-instance-command-fast-1783191615520-mp-raw-csv-file-dedupe-nulls-not-distinct';

describe('MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand', () => {
  it('preflights duplicates before replacing the constraint', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ duplicate_group_count: '0' }])
      .mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand().up(
      queryRunner,
    );

    expect(query).toHaveBeenCalledTimes(3);
    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain('GROUP BY');
    expect(executedSql).toContain('source_modality');
    expect(executedSql).toContain('UNIQUE NULLS NOT DISTINCT');
  });

  it('fails closed before dropping the constraint when duplicates exist', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([{ duplicate_group_count: '1' }]);
    const queryRunner = { query } as unknown as QueryRunner;

    await expect(
      new MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand().up(
        queryRunner,
      ),
    ).rejects.toThrow('1 duplicate raw CSV file groups exist');

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).not.toContain('DROP CONSTRAINT');
  });

  it('restores standard uniqueness on down', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand().down(
      queryRunner,
    );

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1]?.[0]).toContain(
      'UNIQUE (source_dataset, source_period, source_modality, file_checksum)',
    );
  });
});