import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785354861319)
export class MpStgJobRunRawCsvFileLinkColumnFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      ADD COLUMN IF NOT EXISTS raw_csv_file_id uuid NULL
    `);
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    // The following slow command owns the foreign key and column cleanup.
    return Promise.resolve();
  }
}
