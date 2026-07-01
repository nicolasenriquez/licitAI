import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007870)
export class MpCanonicalOrdenCompraFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.orden_compra (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo text NOT NULL,
        codigo_licitacion text NULL,
        canonical_state text NOT NULL DEFAULT 'unknown_raw_state',
        raw_state_code text NULL,
        raw_state_label text NULL,
        raw_provider_state text NULL,
        fecha_envio date NULL,
        is_sentinel_1900_envio boolean NOT NULL DEFAULT false,
        tipo_moneda_oc text NULL,
        monto_total_oc numeric(18, 2) NULL,
        raw_monto_total_oc text NULL,
        impuestos_oc numeric(18, 2) NULL,
        nombre_proveedor text NULL,
        codigo_abreviado_tipo_oc text NULL,
        descripcion_tipo_oc text NULL,
        es_compra_agil boolean NULL,
        raw_es_compra_agil text NULL,
        source_priority text NULL,
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_orden_compra" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_orden_compra_codigo" UNIQUE (codigo),
        CONSTRAINT "ck_mp_orden_compra_canonical_state"
          CHECK (
            canonical_state IN (
              'enviada_a_proveedor',
              'en_proceso',
              'aceptada',
              'cancelada',
              'recepcion_conforme',
              'pendiente_de_recepcionar',
              'recepcionada_parcialmente',
              'recepcion_conforme_incompleta',
              'unknown_raw_state'
            )
          )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.orden_compra_item (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        iditem text NOT NULL,
        codigo text NOT NULL,
        nombre_producto_generico text NULL,
        total_linea_neto numeric(18, 2) NULL,
        raw_total_linea_neto text NULL,
        codigo_producto_onu text NULL,
        forma_de_pago text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_orden_compra_item" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_orden_compra_item_iditem" UNIQUE (iditem),
        CONSTRAINT "fk_mp_orden_compra_item_codigo"
          FOREIGN KEY (codigo)
          REFERENCES mp.orden_compra(codigo)
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.orden_compra_item`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.orden_compra`);
  }
}
