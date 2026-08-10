import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784000000010)
export class RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        DROP CONSTRAINT IF EXISTS "ck_mp_compra_agil_estado"
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ALTER COLUMN document_count DROP DEFAULT,
        ALTER COLUMN document_count DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ALTER COLUMN document_count DROP DEFAULT,
        ALTER COLUMN document_count DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        ALTER COLUMN document_count DROP DEFAULT,
        ALTER COLUMN document_count DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM (
        SELECT document_count
        FROM mp.stg_api_v2_compra_agil
        WHERE document_count IS NULL
        UNION ALL
        SELECT document_count
        FROM mp.compra_agil
        WHERE document_count IS NULL
        UNION ALL
        SELECT document_count
        FROM mp.gold_detected_process
        WHERE document_count IS NULL
        UNION ALL
        SELECT NULL::integer
        FROM mp.compra_agil
        WHERE estado IS NOT NULL
          AND estado NOT IN (
            'publicada',
            'cerrada',
            'desierta',
            'cancelada',
            'proveedor_seleccionado',
            'oc_emitida'
          )
        ) incompatible
    `)) as { incompatible_count: string }[];
    const incompatibleCount = incompatibleRows[0]?.incompatible_count ?? '0';

    if (Number(incompatibleCount) > 0) {
      throw new Error(
        'Cannot restore Mercado Publico V2 constraints while unknown states or unavailable document counts exist',
      );
    }

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ALTER COLUMN document_count SET DEFAULT 0,
        ALTER COLUMN document_count SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ALTER COLUMN document_count SET DEFAULT 0,
        ALTER COLUMN document_count SET NOT NULL,
        ADD CONSTRAINT "ck_mp_compra_agil_estado"
          CHECK (
            estado IS NULL OR estado IN (
              'publicada',
              'cerrada',
              'desierta',
              'cancelada',
              'proveedor_seleccionado',
              'oc_emitida'
            )
          )
    `);

    await queryRunner.query(`
      ALTER TABLE mp.gold_detected_process
        ALTER COLUMN document_count SET DEFAULT 0,
        ALTER COLUMN document_count SET NOT NULL
    `);
  }
}
