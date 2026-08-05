import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785354861322)
export class MpCompraAgilV2AnalyticsFieldsFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_api_v2_compra_agil
        ADD COLUMN IF NOT EXISTS buyer_rut text NULL,
        ADD COLUMN IF NOT EXISTS purchase_unit_name text NULL,
        ADD COLUMN IF NOT EXISTS region_name text NULL,
        ADD COLUMN IF NOT EXISTS amount_available_clp numeric(18, 2) NULL,
        ADD COLUMN IF NOT EXISTS call_stage text NULL,
        ADD COLUMN IF NOT EXISTS document_count integer NULL,
        ADD COLUMN IF NOT EXISTS offers_received_count integer NULL
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.compra_agil
        ADD COLUMN IF NOT EXISTS buyer_rut text NULL,
        ADD COLUMN IF NOT EXISTS purchase_unit_name text NULL,
        ADD COLUMN IF NOT EXISTS region_name text NULL,
        ADD COLUMN IF NOT EXISTS amount_available_clp numeric(18, 2) NULL,
        ADD COLUMN IF NOT EXISTS call_stage text NULL,
        ADD COLUMN IF NOT EXISTS document_count integer NULL,
        ADD COLUMN IF NOT EXISTS offers_received_count integer NULL
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.gold_detected_process
        ADD COLUMN IF NOT EXISTS buyer_rut text NULL,
        ADD COLUMN IF NOT EXISTS purchase_unit_name text NULL,
        ADD COLUMN IF NOT EXISTS region_name text NULL,
        ADD COLUMN IF NOT EXISTS amount_available_clp numeric(18, 2) NULL,
        ADD COLUMN IF NOT EXISTS call_stage text NULL,
        ADD COLUMN IF NOT EXISTS document_count integer NULL,
        ADD COLUMN IF NOT EXISTS offers_received_count integer NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.gold_detected_process
        DROP COLUMN IF EXISTS offers_received_count,
        DROP COLUMN IF EXISTS document_count,
        DROP COLUMN IF EXISTS call_stage,
        DROP COLUMN IF EXISTS amount_available_clp,
        DROP COLUMN IF EXISTS region_name,
        DROP COLUMN IF EXISTS purchase_unit_name,
        DROP COLUMN IF EXISTS buyer_rut
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.compra_agil
        DROP COLUMN IF EXISTS offers_received_count,
        DROP COLUMN IF EXISTS document_count,
        DROP COLUMN IF EXISTS call_stage,
        DROP COLUMN IF EXISTS amount_available_clp,
        DROP COLUMN IF EXISTS region_name,
        DROP COLUMN IF EXISTS purchase_unit_name,
        DROP COLUMN IF EXISTS buyer_rut
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_api_v2_compra_agil
        DROP COLUMN IF EXISTS offers_received_count,
        DROP COLUMN IF EXISTS document_count,
        DROP COLUMN IF EXISTS call_stage,
        DROP COLUMN IF EXISTS amount_available_clp,
        DROP COLUMN IF EXISTS region_name,
        DROP COLUMN IF EXISTS purchase_unit_name,
        DROP COLUMN IF EXISTS buyer_rut
    `);
  }
}
