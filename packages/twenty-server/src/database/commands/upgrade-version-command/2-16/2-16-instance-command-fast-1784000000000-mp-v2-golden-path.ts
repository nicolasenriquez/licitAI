import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784000000000)
export class MpV2GoldenPathFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_run (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        intent text NOT NULL,
        source text NOT NULL,
        status text NOT NULL,
        started_at timestamptz NOT NULL DEFAULT now(),
        finished_at timestamptz NULL,
        records_discovered integer NOT NULL DEFAULT 0,
        records_projected integer NOT NULL DEFAULT 0,
        error_summary text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_run" PRIMARY KEY (id),
        CONSTRAINT "ck_mp_sync_run_status"
          CHECK (status IN ('queued', 'projecting', 'succeeded', 'failed'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.v2_observation (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        sync_run_id uuid NOT NULL,
        raw_api_payload_id uuid NOT NULL,
        codigo text NOT NULL,
        payload_checksum text NOT NULL,
        provider_schema_fingerprint text NOT NULL,
        normalizer_version text NOT NULL,
        observed_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_v2_observation" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_v2_observation_run_code_checksum"
          UNIQUE (sync_run_id, codigo, payload_checksum),
        CONSTRAINT "fk_mp_v2_observation_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE CASCADE,
        CONSTRAINT "fk_mp_v2_observation_raw_payload"
          FOREIGN KEY (raw_api_payload_id) REFERENCES mp.raw_api_payload(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ADD COLUMN IF NOT EXISTS title text NULL,
        ADD COLUMN IF NOT EXISTS buyer_code text NULL,
        ADD COLUMN IF NOT EXISTS buyer_name text NULL,
        ADD COLUMN IF NOT EXISTS region integer NULL,
        ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS closing_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS amount numeric(18, 2) NULL,
        ADD COLUMN IF NOT EXISTS currency_source text NULL,
        ADD COLUMN IF NOT EXISTS document_count integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ADD COLUMN IF NOT EXISTS title text NULL,
        ADD COLUMN IF NOT EXISTS buyer_code text NULL,
        ADD COLUMN IF NOT EXISTS buyer_name text NULL,
        ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS closing_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS amount numeric(18, 2) NULL,
        ADD COLUMN IF NOT EXISTS currency_source text NULL,
        ADD COLUMN IF NOT EXISTS document_count integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS observation_id uuid NULL,
        ADD COLUMN IF NOT EXISTS normalizer_version text NULL,
        ADD COLUMN IF NOT EXISTS provider_schema_fingerprint text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        ADD COLUMN IF NOT EXISTS region integer NULL,
        ADD COLUMN IF NOT EXISTS amount numeric(18, 2) NULL,
        ADD COLUMN IF NOT EXISTS currency_source text NULL,
        ADD COLUMN IF NOT EXISTS document_count integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS observation_id uuid NULL,
        ADD COLUMN IF NOT EXISTS normalizer_version text NULL,
        ADD COLUMN IF NOT EXISTS provider_schema_fingerprint text NULL,
        ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'available'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_gold_detected_process_v2_keyset"
        ON mp.gold_detected_process (closing_at DESC, process_code ASC)
        WHERE process_type = 'compra_agil'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_gold_detected_process_v2_keyset"`,
    );
    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        DROP COLUMN IF EXISTS region,
        DROP COLUMN IF EXISTS availability,
        DROP COLUMN IF EXISTS provider_schema_fingerprint,
        DROP COLUMN IF EXISTS normalizer_version,
        DROP COLUMN IF EXISTS observation_id,
        DROP COLUMN IF EXISTS document_count,
        DROP COLUMN IF EXISTS currency_source,
        DROP COLUMN IF EXISTS amount
    `);
    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        DROP COLUMN IF EXISTS provider_schema_fingerprint,
        DROP COLUMN IF EXISTS normalizer_version,
        DROP COLUMN IF EXISTS observation_id,
        DROP COLUMN IF EXISTS document_count,
        DROP COLUMN IF EXISTS currency_source,
        DROP COLUMN IF EXISTS amount,
        DROP COLUMN IF EXISTS closing_at,
        DROP COLUMN IF EXISTS published_at,
        DROP COLUMN IF EXISTS buyer_name,
        DROP COLUMN IF EXISTS buyer_code,
        DROP COLUMN IF EXISTS title
    `);
    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        DROP COLUMN IF EXISTS document_count,
        DROP COLUMN IF EXISTS currency_source,
        DROP COLUMN IF EXISTS amount,
        DROP COLUMN IF EXISTS closing_at,
        DROP COLUMN IF EXISTS published_at,
        DROP COLUMN IF EXISTS region,
        DROP COLUMN IF EXISTS buyer_name,
        DROP COLUMN IF EXISTS buyer_code,
        DROP COLUMN IF EXISTS title
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.v2_observation`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_run`);
  }
}
