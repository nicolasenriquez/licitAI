import { type DataSource, type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785354861318, { type: 'slow' })
export class MpCompraAgilV2BrowseBackfillSlowInstanceCommand
  implements SlowInstanceCommand
{
  public async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.transaction(async (entityManager) => {
      await entityManager.query(`
        WITH retained AS (
          SELECT
            staging.id,
            jsonb_path_query_first(
              raw.raw_payload,
              '$.** ? (@.codigo == $codigo)',
              jsonb_build_object('codigo', to_jsonb(staging.codigo))
            ) AS record
          FROM mp.stg_api_v2_compra_agil staging
          INNER JOIN mp.raw_api_payload raw
            ON raw.id = staging.raw_api_payload_id
          WHERE raw.source = 'api-v2-compra-agil'
        )
        UPDATE mp.stg_api_v2_compra_agil staging
        SET
          title = COALESCE(staging.title, retained.record->>'nombre'),
          buyer_name = COALESCE(
            staging.buyer_name,
            retained.record #>> '{institucion,organismo_comprador}'
          )
        FROM retained
        WHERE staging.id = retained.id
      `);

      await entityManager.query(`
        INSERT INTO mp.compra_agil (
          codigo,
          title,
          buyer_name,
          estado,
          id_orden_compra,
          id_oc,
          codigo_orden_compra,
          region,
          fecha_publicacion,
          fecha_cierre,
          fecha_ultimo_cambio,
          last_seen_at,
          updated_at
        )
        SELECT DISTINCT ON (codigo)
          codigo,
          title,
          buyer_name,
          estado,
          id_orden_compra,
          id_oc,
          codigo_orden_compra,
          region,
          fecha_publicacion,
          fecha_cierre,
          fecha_ultimo_cambio,
          fetched_at,
          now()
        FROM mp.stg_api_v2_compra_agil
        ORDER BY
          codigo,
          fecha_ultimo_cambio DESC NULLS LAST,
          fetched_at DESC,
          id DESC
        ON CONFLICT (codigo) DO UPDATE
        SET
          title = COALESCE(EXCLUDED.title, mp.compra_agil.title),
          buyer_name = COALESCE(
            EXCLUDED.buyer_name,
            mp.compra_agil.buyer_name
          ),
          estado = COALESCE(EXCLUDED.estado, mp.compra_agil.estado),
          region = COALESCE(EXCLUDED.region, mp.compra_agil.region),
          fecha_publicacion = COALESCE(
            EXCLUDED.fecha_publicacion,
            mp.compra_agil.fecha_publicacion
          ),
          fecha_cierre = COALESCE(
            EXCLUDED.fecha_cierre,
            mp.compra_agil.fecha_cierre
          ),
          fecha_ultimo_cambio = COALESCE(
            EXCLUDED.fecha_ultimo_cambio,
            mp.compra_agil.fecha_ultimo_cambio
          ),
          last_seen_at = GREATEST(
            EXCLUDED.last_seen_at,
            mp.compra_agil.last_seen_at
          ),
          updated_at = now()
      `);

      await entityManager.query(`
        UPDATE mp.gold_detected_process gold
        SET
          title = COALESCE(canonical.title, gold.title),
          buyer_name = COALESCE(canonical.buyer_name, gold.buyer_name),
          published_at = COALESCE(
            canonical.fecha_publicacion,
            gold.published_at
          ),
          closing_at = COALESCE(canonical.fecha_cierre, gold.closing_at),
          updated_at = now()
        FROM mp.compra_agil canonical
        WHERE
          gold.process_type = 'compra_agil'
          AND gold.process_code = canonical.codigo
      `);
    });
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
