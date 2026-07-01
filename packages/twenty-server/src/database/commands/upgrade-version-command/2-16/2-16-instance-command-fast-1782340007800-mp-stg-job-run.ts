import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007800)
export class MpStgJobRunFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.stg_job_run (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        job_name text NOT NULL,
        job_run_id text NOT NULL,
        status text NOT NULL,
        started_at timestamptz NOT NULL,
        finished_at timestamptz NULL,
        records_fetched integer NULL,
        records_staged integer NULL,
        records_canonicalized integer NULL,
        records_failed integer NULL,
        error_summary text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_stg_job_run" PRIMARY KEY (id),
        CONSTRAINT "uk_mp_stg_job_run_name_run_id"
          UNIQUE (job_name, job_run_id),
        CONSTRAINT "ck_mp_stg_job_run_status"
          CHECK (
            status IN (
              'success',
              'failed',
              'soft_miss',
              'param_error',
              'retryable_failed'
            )
          )
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_mp_raw_api_payload_ingestion_job_id'
        ) THEN
          ALTER TABLE mp.raw_api_payload
          ADD CONSTRAINT "fk_mp_raw_api_payload_ingestion_job_id"
            FOREIGN KEY (ingestion_job_id)
            REFERENCES mp.stg_job_run(id)
            ON DELETE SET NULL;
        END IF;
      END
      $$;
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

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_mp_raw_csv_row_ingestion_job_id'
        ) THEN
          ALTER TABLE mp.raw_csv_row
          ADD CONSTRAINT "fk_mp_raw_csv_row_ingestion_job_id"
            FOREIGN KEY (ingestion_job_id)
            REFERENCES mp.stg_job_run(id)
            ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.raw_csv_row
      DROP CONSTRAINT IF EXISTS "fk_mp_raw_csv_row_ingestion_job_id"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.raw_csv_file
      DROP CONSTRAINT IF EXISTS "fk_mp_raw_csv_file_ingestion_job_id"
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.raw_api_payload
      DROP CONSTRAINT IF EXISTS "fk_mp_raw_api_payload_ingestion_job_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.stg_job_run`);
  }
}
