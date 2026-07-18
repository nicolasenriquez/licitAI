import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784100000000)
export class MpCompraAgilV2DatesFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ADD COLUMN IF NOT EXISTS raw_fecha_publicacion text NULL,
        ADD COLUMN IF NOT EXISTS raw_fecha_cierre text NULL,
        ADD COLUMN IF NOT EXISTS raw_fecha_ultimo_cambio text NULL,
        ADD COLUMN IF NOT EXISTS fecha_publicacion timestamptz NULL,
        ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz NULL,
        ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio timestamptz NULL,
        ADD COLUMN IF NOT EXISTS region integer NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ADD COLUMN IF NOT EXISTS fecha_publicacion timestamptz NULL,
        ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz NULL,
        ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        DROP COLUMN IF EXISTS fecha_ultimo_cambio,
        DROP COLUMN IF EXISTS fecha_cierre,
        DROP COLUMN IF EXISTS fecha_publicacion
    `);

    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        DROP COLUMN IF EXISTS region,
        DROP COLUMN IF EXISTS fecha_ultimo_cambio,
        DROP COLUMN IF EXISTS fecha_cierre,
        DROP COLUMN IF EXISTS fecha_publicacion,
        DROP COLUMN IF EXISTS raw_fecha_ultimo_cambio,
        DROP COLUMN IF EXISTS raw_fecha_cierre,
        DROP COLUMN IF EXISTS raw_fecha_publicacion
    `);
  }
}
