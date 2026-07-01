import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007830)
export class MpStgApiV2CompraAgilFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.stg_api_v2_compra_agil (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        raw_api_payload_id uuid NOT NULL,
        source text NOT NULL,
        snapshot_kind text NOT NULL,
        codigo text NOT NULL,
        estado text NULL,
        id_orden_compra text NULL,
        id_oc text NULL,
        codigo_orden_compra text NULL,
        publicado_desde text NULL,
        publicado_hasta text NULL,
        cambio_desde text NULL,
        cambio_hasta text NULL,
        fetched_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_stg_api_v2_compra_agil" PRIMARY KEY (id),
        CONSTRAINT "ck_mp_stg_api_v2_compra_agil_snapshot_kind"
          CHECK (snapshot_kind IN ('list', 'detail')),
        CONSTRAINT "fk_mp_stg_api_v2_compra_agil_raw_api_payload_id"
          FOREIGN KEY (raw_api_payload_id)
          REFERENCES mp.raw_api_payload(id)
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.stg_api_v2_compra_agil`);
  }
}
