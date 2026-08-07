import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1787000000000)
export class MpV2EvidenceHistoryReplayFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.v2_observation
        DROP CONSTRAINT IF EXISTS "uq_mp_v2_observation_run_code_checksum",
        ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'api-v2-compra-agil',
        ADD COLUMN IF NOT EXISTS endpoint text NULL,
        ADD COLUMN IF NOT EXISTS snapshot_kind text NULL,
        ADD COLUMN IF NOT EXISTS request_fingerprint text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at_raw text NULL,
        ADD COLUMN IF NOT EXISTS provider_changed_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS semantic_fingerprint text NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_v2_observation_codigo_changed_at"
        ON mp.v2_observation (codigo, provider_changed_at DESC NULLS LAST, observed_at DESC)
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ADD COLUMN IF NOT EXISTS observation_id uuid NULL,
        ADD COLUMN IF NOT EXISTS amount_raw text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ADD CONSTRAINT "fk_mp_stg_api_v2_compra_agil_observation"
          FOREIGN KEY (observation_id) REFERENCES mp.v2_observation(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_stg_api_v2_compra_agil_observation"
        ON mp.stg_api_v2_compra_agil (observation_id)
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ADD COLUMN IF NOT EXISTS amount_raw text NULL,
        ADD COLUMN IF NOT EXISTS semantic_fingerprint text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        ADD COLUMN IF NOT EXISTS amount_raw text NULL,
        ADD COLUMN IF NOT EXISTS semantic_fingerprint text NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.v2_history (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo text NOT NULL,
        previous_observation_id uuid NULL,
        new_observation_id uuid NOT NULL,
        semantic_fingerprint_before text NULL,
        semantic_fingerprint_after text NOT NULL,
        before_json jsonb NULL,
        after_json jsonb NOT NULL,
        provider_changed_at_raw text NULL,
        provider_changed_at timestamptz NULL,
        observed_at timestamptz NOT NULL,
        normalizer_version text NOT NULL,
        provider_schema_fingerprint text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_v2_history" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_v2_history_codigo_observation"
          UNIQUE (codigo, new_observation_id),
        CONSTRAINT "ck_mp_v2_history_fingerprints_differ"
          CHECK (
            semantic_fingerprint_before IS DISTINCT FROM semantic_fingerprint_after
          ),
        CONSTRAINT "fk_mp_v2_history_previous_observation"
          FOREIGN KEY (previous_observation_id)
          REFERENCES mp.v2_observation(id) ON DELETE SET NULL,
        CONSTRAINT "fk_mp_v2_history_new_observation"
          FOREIGN KEY (new_observation_id)
          REFERENCES mp.v2_observation(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_v2_history_codigo_created"
        ON mp.v2_history (codigo, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.v2_child_evidence (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        observation_id uuid NOT NULL,
        codigo text NOT NULL,
        array_name text NOT NULL,
        provider_key text NULL,
        ordinal integer NOT NULL,
        element_checksum text NOT NULL,
        element_json jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_v2_child_evidence" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_v2_child_evidence_observation_array_ordinal"
          UNIQUE (observation_id, array_name, ordinal),
        CONSTRAINT "ck_mp_v2_child_evidence_ordinal_non_negative"
          CHECK (ordinal >= 0),
        CONSTRAINT "fk_mp_v2_child_evidence_observation"
          FOREIGN KEY (observation_id) REFERENCES mp.v2_observation(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_v2_child_evidence_codigo_array"
        ON mp.v2_child_evidence (codigo, array_name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_v2_child_evidence_codigo_array"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.v2_child_evidence`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_v2_history_codigo_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.v2_history`);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        DROP COLUMN IF EXISTS semantic_fingerprint,
        DROP COLUMN IF EXISTS amount_raw
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        DROP COLUMN IF EXISTS semantic_fingerprint,
        DROP COLUMN IF EXISTS amount_raw
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_stg_api_v2_compra_agil_observation"`,
    );
    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        DROP CONSTRAINT IF EXISTS "fk_mp_stg_api_v2_compra_agil_observation",
        DROP COLUMN IF EXISTS amount_raw,
        DROP COLUMN IF EXISTS observation_id
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_v2_observation_codigo_changed_at"`,
    );
    await queryRunner.query(`
      ALTER TABLE mp.v2_observation
        DROP COLUMN IF EXISTS semantic_fingerprint,
        DROP COLUMN IF EXISTS provider_changed_at,
        DROP COLUMN IF EXISTS provider_changed_at_raw,
        DROP COLUMN IF EXISTS request_fingerprint,
        DROP COLUMN IF EXISTS snapshot_kind,
        DROP COLUMN IF EXISTS endpoint,
        DROP COLUMN IF EXISTS source,
        ADD CONSTRAINT "uq_mp_v2_observation_run_code_checksum"
          UNIQUE (sync_run_id, codigo, payload_checksum)
    `);
  }
}
