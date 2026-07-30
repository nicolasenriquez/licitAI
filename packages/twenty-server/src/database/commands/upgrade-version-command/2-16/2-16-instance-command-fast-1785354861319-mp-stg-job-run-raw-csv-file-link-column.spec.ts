import { type QueryRunner } from 'typeorm';

import { MpStgJobRunRawCsvFileLinkColumnFastInstanceCommand } from './2-16-instance-command-fast-1785354861319-mp-stg-job-run-raw-csv-file-link-column';

describe('MpStgJobRunRawCsvFileLinkColumnFastInstanceCommand', () => {
  it('creates the nullable link column before slow data migration', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const command = new MpStgJobRunRawCsvFileLinkColumnFastInstanceCommand();

    await command.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ADD COLUMN IF NOT EXISTS raw_csv_file_id uuid NULL',
      ),
    );
  });
});
