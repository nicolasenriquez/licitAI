import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007890)
export class MpReconciliationPublicMarketEntitiesFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.reconciliation_public_market_entities (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        entity_a_source text NOT NULL,
        entity_a_type text NOT NULL,
        entity_a_key text NOT NULL,
        entity_b_source text NOT NULL,
        entity_b_type text NOT NULL,
        entity_b_key text NOT NULL,
        match_type text NOT NULL,
        match_confidence text NOT NULL,
        matched_by text NULL,
        matched_at timestamptz NOT NULL DEFAULT now(),
        review_status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_reconciliation_public_market_entities" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_reconciliation_public_market_entities_natural_key"
          UNIQUE (
            entity_a_source,
            entity_a_type,
            entity_a_key,
            entity_b_source,
            entity_b_type,
            entity_b_key,
            match_type
          ),
        CONSTRAINT "ck_mp_reconciliation_public_market_entities_match_type"
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
          ),
        CONSTRAINT "ck_mp_reconciliation_public_market_entities_match_confidence"
          CHECK (
            match_confidence IN ('high', 'medium', 'low', 'unknown')
          ),
        CONSTRAINT "ck_mp_reconciliation_public_market_entities_review_status"
          CHECK (
            review_status IN ('pending', 'confirmed', 'rejected')
          )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS mp.reconciliation_public_market_entities`,
    );
  }
}
