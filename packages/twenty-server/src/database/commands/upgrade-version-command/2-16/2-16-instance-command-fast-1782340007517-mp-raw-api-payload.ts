import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007517)
export class MpRawApiPayloadFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.raw_api_payload (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        source text NOT NULL,
        endpoint text NOT NULL,
        request_fingerprint text NOT NULL,
        payload_checksum text NOT NULL,
        request_params jsonb NOT NULL,
        http_status integer NOT NULL,
        fetched_at timestamptz NOT NULL DEFAULT now(),
        raw_payload jsonb NOT NULL,
        schema_fingerprint text NOT NULL,
        ingestion_job_id uuid NULL,
        error_summary text NULL,
        records_fetched integer NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_raw_api_payload" PRIMARY KEY (id),
        CONSTRAINT "uk_mp_raw_api_payload_dedupe"
          UNIQUE (source, endpoint, request_fingerprint, payload_checksum),
        CONSTRAINT "ck_mp_raw_api_payload_http_status_range"
          CHECK (http_status >= 100 AND http_status < 600)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.raw_api_payload`);
  }
}
