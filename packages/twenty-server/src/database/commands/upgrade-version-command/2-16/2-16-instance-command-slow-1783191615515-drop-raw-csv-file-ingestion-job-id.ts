import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1783191615515, { type: 'slow' })
export class DropRawCsvFileIngestionJobIdSlowInstanceCommand
  implements SlowInstanceCommand
{
  public async runDataMigration(_dataSource: DataSource): Promise<void> {
    return;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      DROP CONSTRAINT IF EXISTS "fk_mp_raw_csv_file_ingestion_job_id"
    `);

    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      DROP COLUMN IF EXISTS ingestion_job_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      ADD COLUMN IF NOT EXISTS ingestion_job_id uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_mp_raw_csv_file_ingestion_job_id'
        ) THEN
          ALTER TABLE mp.raw_csv_file
          ADD CONSTRAINT "fk_mp_raw_csv_file_ingestion_job_id"
            FOREIGN KEY (ingestion_job_id)
            REFERENCES mp.stg_job_run(id)
            ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }
}
