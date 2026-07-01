import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007820)
export class MpStgApiV1OrdenCompraFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.stg_api_v1_orden_compra (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        raw_api_payload_id uuid NOT NULL,
        source text NOT NULL,
        snapshot_kind text NOT NULL,
        codigo text NOT NULL,
        codigo_estado text NULL,
        estado text NULL,
        estado_proveedor text NULL,
        codigo_licitacion text NULL,
        fecha_envio text NULL,
        monto_total_oc text NULL,
        tipo_moneda_oc text NULL,
        nombre_proveedor text NULL,
        fetched_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_stg_api_v1_orden_compra" PRIMARY KEY (id),
        CONSTRAINT "ck_mp_stg_api_v1_orden_compra_snapshot_kind"
          CHECK (snapshot_kind IN ('list', 'detail')),
        CONSTRAINT "fk_mp_stg_api_v1_orden_compra_raw_api_payload_id"
          FOREIGN KEY (raw_api_payload_id)
          REFERENCES mp.raw_api_payload(id)
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.stg_api_v1_orden_compra`);
  }
}
