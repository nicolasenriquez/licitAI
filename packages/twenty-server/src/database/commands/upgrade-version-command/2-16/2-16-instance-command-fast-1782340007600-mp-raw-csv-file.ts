import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007600)
export class MpRawCsvFileFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.raw_csv_file (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        source_system text NOT NULL,
        source_dataset text NOT NULL,
        source_url text NOT NULL,
        source_file_name text NOT NULL,
        source_period text NOT NULL,
        source_modality text NULL,
        downloaded_at timestamptz NOT NULL DEFAULT now(),
        file_checksum text NOT NULL,
        file_size_bytes bigint NOT NULL,
        compression_type text NULL,
        detected_encoding text NOT NULL,
        detected_delimiter text NOT NULL,
        quotechar text NULL,
        header_raw text NOT NULL,
        observed_columns jsonb NOT NULL,
        column_count integer NOT NULL,
        schema_fingerprint text NOT NULL,
        row_count integer NOT NULL,
        ingestion_job_id uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_raw_csv_file" PRIMARY KEY (id),
        CONSTRAINT "uk_mp_raw_csv_file_dedupe"
          UNIQUE (source_dataset, source_period, file_checksum),
        CONSTRAINT "ck_mp_raw_csv_file_encoding"
          CHECK (detected_encoding IN ('utf-8', 'utf-8-sig', 'latin-1')),
        CONSTRAINT "ck_mp_raw_csv_file_delimiter"
          CHECK (detected_delimiter IN (';', ',', E'\\t', '|')),
        CONSTRAINT "ck_mp_raw_csv_file_column_count"
          CHECK (column_count >= 0),
        CONSTRAINT "ck_mp_raw_csv_file_row_count"
          CHECK (row_count >= 0)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.raw_csv_file`);
  }
}
