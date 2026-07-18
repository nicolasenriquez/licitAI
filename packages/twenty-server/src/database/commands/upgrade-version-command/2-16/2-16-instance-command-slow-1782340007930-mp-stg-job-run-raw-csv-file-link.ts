import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007930, { type: 'slow' })
export class MpStgJobRunRawCsvFileLinkSlowInstanceCommand
  implements SlowInstanceCommand
{
  async runDataMigration(dataSource: DataSource): Promise<void> {
    // up() has already added mp.stg_job_run.raw_csv_file_id before this phase runs.
    // Only the two backfills belong in runDataMigration per AGENTS upgrade rules:
    // the file-level link for download jobs, and the row-level link for raw-load jobs.

    await dataSource.query(`
      UPDATE mp.stg_job_run jr
      SET raw_csv_file_id = linked_files.raw_csv_file_id
      FROM (
        SELECT
          ingestion_job_id,
          MIN(id::text)::uuid AS raw_csv_file_id
        FROM mp.raw_csv_file
        WHERE ingestion_job_id IS NOT NULL
        GROUP BY ingestion_job_id
        HAVING COUNT(DISTINCT id) = 1
      ) linked_files
      WHERE
        jr.id = linked_files.ingestion_job_id
        AND jr.job_name IN ('csv-oc-download', 'csv-licitaciones-download')
        AND jr.raw_csv_file_id IS NULL
    `);

    await dataSource.query(`
      UPDATE mp.stg_job_run jr
      SET raw_csv_file_id = linked_rows.raw_csv_file_id
      FROM (
        SELECT
          ingestion_job_id,
          MIN(raw_csv_file_id::text)::uuid AS raw_csv_file_id
        FROM mp.raw_csv_row
        WHERE ingestion_job_id IS NOT NULL
        GROUP BY ingestion_job_id
        HAVING COUNT(DISTINCT raw_csv_file_id) = 1
      ) linked_rows
      WHERE
        jr.id = linked_rows.ingestion_job_id
        AND jr.job_name = 'csv-raw-load'
        AND jr.raw_csv_file_id IS NULL
    `);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.stg_job_run
      ADD COLUMN IF NOT EXISTS raw_csv_file_id uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_mp_stg_job_run_raw_csv_file_id'
        ) THEN
          ALTER TABLE mp.stg_job_run
          ADD CONSTRAINT "fk_mp_stg_job_run_raw_csv_file_id"
            FOREIGN KEY (raw_csv_file_id)
            REFERENCES mp.raw_csv_file(id)
            ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      DROP CONSTRAINT IF EXISTS "fk_mp_stg_job_run_raw_csv_file_id"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      DROP COLUMN IF EXISTS raw_csv_file_id
    `);
  }
}
