import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785000000000)
export class MpV2DurableDiscoveryHydrationFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'global',
        ADD COLUMN IF NOT EXISTS request_params jsonb NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS records_hydrated integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS records_failed integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pages_discovered integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pages_checkpointed integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS error_stage text NULL,
        ADD COLUMN IF NOT EXISTS error_retryable boolean NULL,
        ADD COLUMN IF NOT EXISTS watermark_before timestamptz NULL,
        ADD COLUMN IF NOT EXISTS watermark_after timestamptz NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_status",
        ADD CONSTRAINT "ck_mp_sync_run_status"
          CHECK (status IN (
            'queued',
            'discovering',
            'hydrating',
            'projecting',
            'reconciling',
            'succeeded',
            'partial_failed',
            'failed',
            'cancelled'
          ))
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.source_watermark (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        source text NOT NULL,
        scope text NOT NULL DEFAULT 'global',
        watermark_at timestamptz NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_source_watermark" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_source_watermark_source_scope" UNIQUE (source, scope)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_run_page (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        sync_run_id uuid NOT NULL,
        page_number integer NOT NULL,
        page_size integer NOT NULL,
        total_pages integer NULL,
        total_results integer NULL,
        request_params jsonb NOT NULL,
        raw_api_payload_id uuid NULL,
        status text NOT NULL DEFAULT 'checkpointed',
        discovered_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_run_page" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_sync_run_page_run_number" UNIQUE (sync_run_id, page_number),
        CONSTRAINT "ck_mp_sync_run_page_status"
          CHECK (status IN ('checkpointed', 'failed')),
        CONSTRAINT "ck_mp_sync_run_page_number_positive"
          CHECK (page_number > 0),
        CONSTRAINT "fk_mp_sync_run_page_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE CASCADE,
        CONSTRAINT "fk_mp_sync_run_page_raw_payload"
          FOREIGN KEY (raw_api_payload_id) REFERENCES mp.raw_api_payload(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_run_item (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        sync_run_id uuid NOT NULL,
        codigo text NOT NULL,
        discovery_page integer NOT NULL,
        raw_api_payload_id uuid NULL,
        payload_checksum text NOT NULL,
        state_id text NULL,
        state_code text NULL,
        state_label text NULL,
        provider_changed_at_raw text NULL,
        provider_changed_at timestamptz NULL,
        status text NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        observation_id uuid NULL,
        error_stage text NULL,
        error_summary text NULL,
        hydrated_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_run_item" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_sync_run_item_run_codigo" UNIQUE (sync_run_id, codigo),
        CONSTRAINT "ck_mp_sync_run_item_status"
          CHECK (status IN ('pending', 'processing', 'succeeded', 'terminal')),
        CONSTRAINT "fk_mp_sync_run_item_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE CASCADE,
        CONSTRAINT "fk_mp_sync_run_item_raw_payload"
          FOREIGN KEY (raw_api_payload_id) REFERENCES mp.raw_api_payload(id) ON DELETE SET NULL,
        CONSTRAINT "fk_mp_sync_run_item_observation"
          FOREIGN KEY (observation_id) REFERENCES mp.v2_observation(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ADD COLUMN IF NOT EXISTS estado_id text NULL,
        ADD COLUMN IF NOT EXISTS estado_glosa text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at_raw text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS observed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS persisted_at timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ADD COLUMN IF NOT EXISTS state_id text NULL,
        ADD COLUMN IF NOT EXISTS state_label text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at_raw text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS observed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS persisted_at timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        ADD COLUMN IF NOT EXISTS raw_state_id text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at_raw text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS observed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS persisted_at timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_item_pending"
        ON mp.sync_run_item (sync_run_id, status, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_page_run_number"
        ON mp.sync_run_page (sync_run_id, page_number)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM mp.sync_run
      WHERE status NOT IN ('queued', 'projecting', 'succeeded', 'failed')
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleRows[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot roll back durable Mercado Publico V2 states while active or partial sync runs exist',
      );
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_page_run_number"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_item_pending"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_run_item`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_run_page`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.source_watermark`);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        DROP COLUMN IF EXISTS raw_state_id,
        DROP COLUMN IF EXISTS persisted_at,
        DROP COLUMN IF EXISTS observed_at,
        DROP COLUMN IF EXISTS provider_changed_at,
        DROP COLUMN IF EXISTS provider_changed_at_raw
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        DROP COLUMN IF EXISTS persisted_at,
        DROP COLUMN IF EXISTS observed_at,
        DROP COLUMN IF EXISTS provider_changed_at,
        DROP COLUMN IF EXISTS provider_changed_at_raw,
        DROP COLUMN IF EXISTS state_label,
        DROP COLUMN IF EXISTS state_id
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        DROP COLUMN IF EXISTS persisted_at,
        DROP COLUMN IF EXISTS observed_at,
        DROP COLUMN IF EXISTS provider_changed_at,
        DROP COLUMN IF EXISTS provider_changed_at_raw,
        DROP COLUMN IF EXISTS estado_glosa,
        DROP COLUMN IF EXISTS estado_id
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_status",
        ADD CONSTRAINT "ck_mp_sync_run_status"
          CHECK (status IN ('queued', 'projecting', 'succeeded', 'failed')),
        DROP COLUMN IF EXISTS watermark_after,
        DROP COLUMN IF EXISTS watermark_before,
        DROP COLUMN IF EXISTS error_retryable,
        DROP COLUMN IF EXISTS error_stage,
        DROP COLUMN IF EXISTS pages_checkpointed,
        DROP COLUMN IF EXISTS pages_discovered,
        DROP COLUMN IF EXISTS records_failed,
        DROP COLUMN IF EXISTS records_hydrated,
        DROP COLUMN IF EXISTS request_params,
        DROP COLUMN IF EXISTS scope
    `);
  }
}
