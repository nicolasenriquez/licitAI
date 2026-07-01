import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007840)
export class MpStgCsvOrdenCompraFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.stg_csv_orden_compra (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        raw_csv_row_id uuid NOT NULL,
        source_dataset text NOT NULL,
        source_period text NOT NULL,
        codigo text NULL,
        source_id text NULL,
        iditem text NULL,
        codigo_licitacion text NULL,
        fecha_envio text NULL,
        estado text NULL,
        descripcion_tipo_oc text NULL,
        codigo_abreviado_tipo_oc text NULL,
        codigo_tipo text NULL,
        tipo_moneda_oc text NULL,
        monto_total_oc_pesos_chilenos text NULL,
        impuestos_oc text NULL,
        unidad_compra text NULL,
        nombre_proveedor text NULL,
        codigo_producto_onu text NULL,
        total_linea_neto text NULL,
        es_compra_agil text NULL,
        es_trato_directo text NULL,
        forma_de_pago text NULL,
        codigo_convenio_marco text NULL,
        all_observed_fields jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_stg_csv_orden_compra" PRIMARY KEY (id),
        CONSTRAINT "fk_mp_stg_csv_orden_compra_raw_csv_row_id"
          FOREIGN KEY (raw_csv_row_id)
          REFERENCES mp.raw_csv_row(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_stg_csv_orden_compra_raw_csv_row_id"
      ON mp.stg_csv_orden_compra (raw_csv_row_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.stg_csv_orden_compra`);
  }
}
