import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007810)
export class MpStgApiV1LicitacionFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.stg_api_v1_licitacion (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        raw_api_payload_id uuid NOT NULL,
        source text NOT NULL,
        snapshot_kind text NOT NULL,
        codigo_externo text NOT NULL,
        codigo text NULL,
        codigo_estado text NULL,
        estado text NULL,
        codigo_tipo text NULL,
        nombre text NULL,
        fecha_publicacion text NULL,
        fecha_cierre text NULL,
        fecha_adjudicacion text NULL,
        codigo_organismo text NULL,
        nombre_organismo text NULL,
        fetched_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_stg_api_v1_licitacion" PRIMARY KEY (id),
        CONSTRAINT "ck_mp_stg_api_v1_licitacion_snapshot_kind"
          CHECK (snapshot_kind IN ('list', 'detail')),
        CONSTRAINT "fk_mp_stg_api_v1_licitacion_raw_api_payload_id"
          FOREIGN KEY (raw_api_payload_id)
          REFERENCES mp.raw_api_payload(id)
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.stg_api_v1_licitacion`);
  }
}
