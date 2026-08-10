import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1790000000000)
export class MpV2DetailContractFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        ADD COLUMN IF NOT EXISTS description text NULL,
        ADD COLUMN IF NOT EXISTS delivery_address text NULL,
        ADD COLUMN IF NOT EXISTS delivery_days integer NULL,
        ADD COLUMN IF NOT EXISTS cancellation_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS call_description text NULL,
        ADD COLUMN IF NOT EXISTS call_first_closing_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS call_second_closing_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS budget_type text NULL,
        ADD COLUMN IF NOT EXISTS budget_estimate text NULL,
        ADD COLUMN IF NOT EXISTS budget_currency text NULL,
        ADD COLUMN IF NOT EXISTS cancel_motive text NULL,
        ADD COLUMN IF NOT EXISTS deserted_motive text NULL,
        ADD COLUMN IF NOT EXISTS selection_motive text NULL,
        ADD COLUMN IF NOT EXISTS total_offers integer NULL,
        ADD COLUMN IF NOT EXISTS total_demands integer NULL,
        ADD COLUMN IF NOT EXISTS fine_penalty text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.v2_cohort
        ADD COLUMN IF NOT EXISTS lifecycle_reason text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.v2_child_evidence
        ADD COLUMN IF NOT EXISTS parent_provider_key text NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.v2_relation_snapshot (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        observation_id uuid NOT NULL,
        codigo text NOT NULL,
        relation text NOT NULL,
        availability text NOT NULL,
        total_count integer NOT NULL DEFAULT 0,
        source_kind text NOT NULL,
        projected_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_v2_relation_snapshot" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_v2_relation_snapshot_observation_relation"
          UNIQUE (observation_id, relation),
        CONSTRAINT "ck_mp_v2_relation_snapshot_availability"
          CHECK (availability IN ('available', 'unavailable')),
        CONSTRAINT "ck_mp_v2_relation_snapshot_source_kind"
          CHECK (source_kind IN ('list', 'detail')),
        CONSTRAINT "ck_mp_v2_relation_snapshot_count_non_negative"
          CHECK (total_count >= 0),
        CONSTRAINT "fk_mp_v2_relation_snapshot_observation"
          FOREIGN KEY (observation_id) REFERENCES mp.v2_observation(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_v2_relation_snapshot_codigo_relation"
        ON mp.v2_relation_snapshot (codigo, relation)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_v2_relation_snapshot_codigo_relation"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.v2_relation_snapshot`);
    await queryRunner.query(`
      ALTER TABLE mp.v2_child_evidence
        DROP COLUMN IF EXISTS parent_provider_key
    `);
    await queryRunner.query(`
      ALTER TABLE mp.v2_cohort
        DROP COLUMN IF EXISTS lifecycle_reason
    `);
    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        DROP COLUMN IF EXISTS fine_penalty,
        DROP COLUMN IF EXISTS total_demands,
        DROP COLUMN IF EXISTS total_offers,
        DROP COLUMN IF EXISTS selection_motive,
        DROP COLUMN IF EXISTS deserted_motive,
        DROP COLUMN IF EXISTS cancel_motive,
        DROP COLUMN IF EXISTS budget_currency,
        DROP COLUMN IF EXISTS budget_estimate,
        DROP COLUMN IF EXISTS budget_type,
        DROP COLUMN IF EXISTS call_second_closing_at,
        DROP COLUMN IF EXISTS call_first_closing_at,
        DROP COLUMN IF EXISTS call_description,
        DROP COLUMN IF EXISTS cancellation_at,
        DROP COLUMN IF EXISTS delivery_days,
        DROP COLUMN IF EXISTS delivery_address,
        DROP COLUMN IF EXISTS description
    `);
  }
}
