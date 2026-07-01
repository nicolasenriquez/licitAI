import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007860)
export class MpCanonicalLicitacionFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.licitacion (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo_externo text NOT NULL,
        codigo text NULL,
        title text NULL,
        canonical_state text NOT NULL DEFAULT 'unknown_raw_state',
        raw_state_code text NULL,
        raw_state_label text NULL,
        codigo_tipo text NULL,
        canonical_type text NULL DEFAULT 'unknown_raw_type',
        buyer_code text NULL,
        buyer_name text NULL,
        fecha_publicacion date NULL,
        fecha_cierre date NULL,
        fecha_adjudicacion date NULL,
        is_sentinel_1900_publicacion boolean NOT NULL DEFAULT false,
        is_sentinel_1900_cierre boolean NOT NULL DEFAULT false,
        source_priority text NULL,
        reconciliation_status text NULL,
        source_attribution jsonb NULL,
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_licitacion" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_licitacion_codigo_externo" UNIQUE (codigo_externo),
        CONSTRAINT "ck_mp_licitacion_canonical_state"
          CHECK (
            canonical_state IN (
              'publicada',
              'cerrada',
              'desierta',
              'adjudicada',
              'revocada',
              'suspendida',
              'unknown_raw_state'
            )
          )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.licitacion_item (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo_externo text NOT NULL,
        codigoitem text NOT NULL,
        nombre_producto_generico text NULL,
        cantidad text NULL,
        moneda text NULL,
        monto_estimado numeric(18, 2) NULL,
        raw_monto_estimado text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_licitacion_item" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_licitacion_item_codigo_externo_codigoitem"
          UNIQUE (codigo_externo, codigoitem),
        CONSTRAINT "fk_mp_licitacion_item_codigo_externo"
          FOREIGN KEY (codigo_externo)
          REFERENCES mp.licitacion(codigo_externo)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.licitacion_oferta (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo_externo text NOT NULL,
        codigoitem text NOT NULL,
        codigo_proveedor text NULL,
        rut_proveedor text NULL,
        nombre_de_la_oferta text NOT NULL,
        estado_oferta text NULL,
        cantidad_ofertada text NULL,
        moneda_oferta text NULL,
        valor_total_ofertado numeric(18, 2) NULL,
        raw_valor_total_ofertado text NULL,
        is_oferta_seleccionada boolean NULL,
        raw_oferta_seleccionada text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_licitacion_oferta" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_licitacion_oferta_natural_key"
          UNIQUE NULLS NOT DISTINCT (
            codigo_externo,
            codigoitem,
            codigo_proveedor,
            nombre_de_la_oferta
          ),
        CONSTRAINT "fk_mp_licitacion_oferta_codigo_externo_codigoitem"
          FOREIGN KEY (codigo_externo, codigoitem)
          REFERENCES mp.licitacion_item(codigo_externo, codigoitem)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.licitacion_adjudicacion (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        codigo_externo text NOT NULL,
        codigoitem text NULL,
        rut_proveedor text NOT NULL,
        cantidad_adjudicada text NULL,
        monto_adjudicado numeric(18, 2) NULL,
        raw_monto_adjudicado text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_licitacion_adjudicacion" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_licitacion_adjudicacion_natural_key"
          UNIQUE NULLS NOT DISTINCT (codigo_externo, codigoitem, rut_proveedor)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.licitacion_adjudicacion`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.licitacion_oferta`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.licitacion_item`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.licitacion`);
  }
}
