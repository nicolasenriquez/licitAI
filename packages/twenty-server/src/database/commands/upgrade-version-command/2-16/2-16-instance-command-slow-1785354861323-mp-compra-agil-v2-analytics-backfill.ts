import { type DataSource, type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785354861323, { type: 'slow' })
export class MpCompraAgilV2AnalyticsBackfillSlowInstanceCommand
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
          buyer_rut = COALESCE(
            staging.buyer_rut,
            NULLIF(BTRIM(retained.record #>> '{institucion,rut}'), '')
          ),
          purchase_unit_name = COALESCE(
            staging.purchase_unit_name,
            NULLIF(BTRIM(retained.record #>> '{institucion,unidad_compra}'), '')
          ),
          region_name = COALESCE(
            staging.region_name,
            NULLIF(BTRIM(retained.record #>> '{institucion,nombre_region}'), '')
          ),
          amount_available_clp = COALESCE(
            staging.amount_available_clp,
            CASE
              WHEN jsonb_typeof(retained.record #> '{montos,monto_disponible_clp}') = 'number'
                THEN (retained.record #>> '{montos,monto_disponible_clp}')::numeric
              ELSE NULL
            END
          ),
          call_stage = COALESCE(
            staging.call_stage,
            CASE
              WHEN lower(retained.record #>> '{convocatoria,descripcion}') LIKE '%primer llamado%'
                OR lower(retained.record #>> '{convocatoria,descripcion}') LIKE '%1er llamado%'
                OR lower(retained.record #>> '{convocatoria,descripcion}') LIKE '%first call%'
                THEN 'first_call'
              WHEN lower(retained.record #>> '{convocatoria,descripcion}') LIKE '%segundo llamado%'
                OR lower(retained.record #>> '{convocatoria,descripcion}') LIKE '%2do llamado%'
                OR lower(retained.record #>> '{convocatoria,descripcion}') LIKE '%second call%'
                THEN 'second_call'
              ELSE NULL
            END
          ),
          document_count = COALESCE(
            staging.document_count,
            CASE
              WHEN jsonb_typeof(retained.record -> 'documentos') = 'array'
                THEN jsonb_array_length(retained.record -> 'documentos')
              ELSE NULL
            END
          ),
          offers_received_count = COALESCE(
            staging.offers_received_count,
            CASE
              WHEN jsonb_typeof(retained.record #> '{resumen,total_ofertas_recibidas}') = 'number'
                AND retained.record #>> '{resumen,total_ofertas_recibidas}' ~ '^[0-9]+$'
                THEN (retained.record #>> '{resumen,total_ofertas_recibidas}')::integer
              ELSE NULL
            END
          )
        FROM retained
        WHERE staging.id = retained.id
      `);

      await entityManager.query(`
        INSERT INTO mp.compra_agil (
          codigo,
          title,
          buyer_name,
          buyer_rut,
          purchase_unit_name,
          region_name,
          amount_available_clp,
          call_stage,
          document_count,
          offers_received_count,
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
          buyer_rut,
          purchase_unit_name,
          region_name,
          amount_available_clp,
          call_stage,
          document_count,
          offers_received_count,
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
          buyer_name = COALESCE(EXCLUDED.buyer_name, mp.compra_agil.buyer_name),
          buyer_rut = COALESCE(EXCLUDED.buyer_rut, mp.compra_agil.buyer_rut),
          purchase_unit_name = COALESCE(
            EXCLUDED.purchase_unit_name,
            mp.compra_agil.purchase_unit_name
          ),
          region_name = COALESCE(EXCLUDED.region_name, mp.compra_agil.region_name),
          amount_available_clp = COALESCE(
            EXCLUDED.amount_available_clp,
            mp.compra_agil.amount_available_clp
          ),
          call_stage = COALESCE(EXCLUDED.call_stage, mp.compra_agil.call_stage),
          document_count = COALESCE(
            EXCLUDED.document_count,
            mp.compra_agil.document_count
          ),
          offers_received_count = COALESCE(
            EXCLUDED.offers_received_count,
            mp.compra_agil.offers_received_count
          ),
          estado = COALESCE(EXCLUDED.estado, mp.compra_agil.estado),
          id_orden_compra = COALESCE(
            EXCLUDED.id_orden_compra,
            mp.compra_agil.id_orden_compra
          ),
          id_oc = COALESCE(EXCLUDED.id_oc, mp.compra_agil.id_oc),
          codigo_orden_compra = COALESCE(
            EXCLUDED.codigo_orden_compra,
            mp.compra_agil.codigo_orden_compra
          ),
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
          buyer_rut = COALESCE(canonical.buyer_rut, gold.buyer_rut),
          purchase_unit_name = COALESCE(
            canonical.purchase_unit_name,
            gold.purchase_unit_name
          ),
          region_name = COALESCE(canonical.region_name, gold.region_name),
          amount_available_clp = COALESCE(
            canonical.amount_available_clp,
            gold.amount_available_clp
          ),
          call_stage = COALESCE(canonical.call_stage, gold.call_stage),
          document_count = COALESCE(
            canonical.document_count,
            gold.document_count
          ),
          offers_received_count = COALESCE(
            canonical.offers_received_count,
            gold.offers_received_count
          ),
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
