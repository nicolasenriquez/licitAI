import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007850)
export class MpStgCsvLicitacionFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.stg_csv_licitacion (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        raw_csv_row_id uuid NOT NULL,
        source_dataset text NOT NULL,
        source_period text NOT NULL,
        codigo_externo text NULL,
        codigo text NULL,
        codigoitem text NULL,
        codigo_proveedor text NULL,
        rut_proveedor text NULL,
        nombre_de_la_oferta text NULL,
        estado_oferta text NULL,
        oferta_seleccionada text NULL,
        cantidad_ofertada text NULL,
        valor_total_ofertado text NULL,
        tipo_de_adquisicion text NULL,
        fecha_publicacion text NULL,
        fecha_adjudicacion text NULL,
        estado text NULL,
        nombre_unidad text NULL,
        nombre_producto_generico text NULL,
        cantidad_adjudicada text NULL,
        monto_estimado_adjudicado text NULL,
        all_observed_fields jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_stg_csv_licitacion" PRIMARY KEY (id),
        CONSTRAINT "fk_mp_stg_csv_licitacion_raw_csv_row_id"
          FOREIGN KEY (raw_csv_row_id)
          REFERENCES mp.raw_csv_row(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_stg_csv_licitacion_raw_csv_row_id"
      ON mp.stg_csv_licitacion (raw_csv_row_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.stg_csv_licitacion`);
  }
}
