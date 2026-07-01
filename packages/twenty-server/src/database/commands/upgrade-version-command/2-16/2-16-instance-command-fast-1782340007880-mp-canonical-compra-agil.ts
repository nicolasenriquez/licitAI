import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007880)
export class MpCanonicalCompraAgilFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.compra_agil (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo text NOT NULL,
        estado text NULL,
        id_orden_compra text NULL,
        id_oc text NULL,
        codigo_orden_compra text NULL,
        region integer NULL,
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_compra_agil" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_compra_agil_codigo" UNIQUE (codigo),
        CONSTRAINT "ck_mp_compra_agil_estado"
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
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.compra_agil_producto_solicitado (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo text NOT NULL,
        codigo_producto text NOT NULL,
        ordinal integer NOT NULL,
        nombre_producto text NULL,
        cantidad_solicitada text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_compra_agil_producto_solicitado" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_compra_agil_producto_solicitado_natural_key"
          UNIQUE (codigo, codigo_producto, ordinal),
        CONSTRAINT "fk_mp_compra_agil_producto_solicitado_codigo"
          FOREIGN KEY (codigo)
          REFERENCES mp.compra_agil(codigo)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.compra_agil_cotizacion (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo text NOT NULL,
        rut_proveedor text NOT NULL,
        id_cotizacion text NOT NULL,
        monto_cotizado numeric(18, 2) NULL,
        raw_monto_cotizado text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_compra_agil_cotizacion" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_compra_agil_cotizacion_natural_key"
          UNIQUE (codigo, rut_proveedor, id_cotizacion),
        CONSTRAINT "fk_mp_compra_agil_cotizacion_codigo"
          FOREIGN KEY (codigo)
          REFERENCES mp.compra_agil(codigo)
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.compra_agil_cotizacion`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.compra_agil_producto_solicitado`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.compra_agil`);
  }
}
