import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007700)
export class MpRawCsvRowFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.raw_csv_row (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        raw_csv_file_id uuid NOT NULL,
        ingestion_job_id uuid NULL,
        source_dataset text NOT NULL,
        source_file_name text NOT NULL,
        source_period text NOT NULL,
        row_number integer NOT NULL,
        raw_row_text text NOT NULL,
        raw_row_json jsonb NULL,
        row_checksum text NOT NULL,
        parse_status text NOT NULL DEFAULT 'pending',
        parse_error text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_raw_csv_row" PRIMARY KEY (id),
        CONSTRAINT "uk_mp_raw_csv_row_dedupe"
          UNIQUE (raw_csv_file_id, row_number, row_checksum),
        CONSTRAINT "ck_mp_raw_csv_row_parse_status"
          CHECK (parse_status IN ('success', 'error', 'pending')),
        CONSTRAINT "fk_mp_raw_csv_row_raw_csv_file_id"
          FOREIGN KEY (raw_csv_file_id)
          REFERENCES mp.raw_csv_file(id)
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.raw_csv_row`);
  }
}
