import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007910)
export class MpGoldReadObjectsFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.gold_detected_process (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        process_type text NOT NULL,
        process_code text NOT NULL,
        title text NULL,
        canonical_state text NULL,
        raw_state_code text NULL,
        raw_state_label text NULL,
        buyer_code text NULL,
        buyer_name text NULL,
        published_at timestamptz NULL,
        closing_at timestamptz NULL,
        source_priority text NULL,
        reconciliation_status text NULL,
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_gold_detected_process" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_gold_detected_process_process_type_process_code"
          UNIQUE (process_type, process_code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.gold_pipeline_health (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        job_name text NOT NULL,
        latest_status text NULL,
        last_success_at timestamptz NULL,
        last_failure_at timestamptz NULL,
        lag_since_last_success_ms bigint NULL,
        failure_count integer NOT NULL DEFAULT 0,
        freshness text NULL,
        expected_cadence_ms bigint NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_gold_pipeline_health" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_gold_pipeline_health_job_name" UNIQUE (job_name),
        CONSTRAINT "ck_mp_gold_pipeline_health_freshness"
          CHECK (
            freshness IS NULL OR freshness IN ('healthy', 'degraded', 'stale')
          )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.gold_api_quota_usage (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        source text NOT NULL,
        daily_limit integer NULL,
        used integer NOT NULL DEFAULT 0,
        remaining integer NULL,
        reset_at timestamptz NULL,
        last_429_at timestamptz NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_gold_api_quota_usage" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_gold_api_quota_usage_source" UNIQUE (source)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.gold_csv_file_health (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        source_dataset text NOT NULL,
        source_period text NOT NULL,
        source_file_name text NOT NULL,
        file_checksum text NOT NULL,
        detected_encoding text NULL,
        detected_delimiter text NULL,
        schema_fingerprint text NULL,
        row_count integer NULL,
        parse_status text NULL,
        last_loaded_at timestamptz NULL,
        freshness text NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_gold_csv_file_health" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_gold_csv_file_health_dataset_period_checksum"
          UNIQUE (source_dataset, source_period, file_checksum)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.gold_conciliacion_licitacion_oc (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo_externo text NOT NULL,
        codigo_licitacion_oc text NULL,
        codigo_oc text NULL,
        match_type text NOT NULL,
        match_confidence text NOT NULL,
        review_status text NOT NULL DEFAULT 'pending',
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_gold_conciliacion_licitacion_oc" PRIMARY KEY (id),
        CONSTRAINT "ck_mp_gold_conciliacion_licitacion_oc_match_type"
          CHECK (
            match_type IN (
              'exact_codigo_externo',
              'exact_codigo_licitacion',
              'exact_compra_agil_id_orden_compra',
              'csv_api_same_business_key',
              'candidate_supplier_amount',
              'candidate_item_amount',
              'unmatched',
              'manual_review_required'
            )
          )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.gold_conciliacion_licitacion_oc`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.gold_csv_file_health`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.gold_api_quota_usage`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.gold_pipeline_health`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.gold_detected_process`);
  }
}
