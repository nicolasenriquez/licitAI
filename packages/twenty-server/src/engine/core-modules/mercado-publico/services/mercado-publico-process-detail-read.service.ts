import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { findV2CompraAgilRawRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';

import { MERCADO_PUBLICO_DETECTED_PROCESS_TYPES } from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';
import {
  type MercadoPublicoDetectedProcessDetail,
  type MercadoPublicoProcessDetailItem,
  type MercadoPublicoProcessDetailAdjudication,
  type MercadoPublicoProcessDetailRelatedOc,
  type MercadoPublicoProcessDetailSourceLineageEntry,
  type MercadoPublicoProcessDetailReconciliationSummary,
  type MercadoPublicoCompraAgilSourceDetail,
} from 'src/engine/core-modules/mercado-publico/types/process-detail-read.types';

type GoldRow = {
  process_type: string;
  process_code: string;
  title: string | null;
  canonical_state: string | null;
  raw_state_code: string | null;
  raw_state_label: string | null;
  buyer_code: string | null;
  buyer_name: string | null;
  published_at: Date | null;
  closing_at: Date | null;
  source_priority: string | null;
  last_seen_at: Date;
};

type LicitacionItemRow = {
  codigoitem: string;
  nombre_producto_generico: string | null;
  cantidad: string | null;
  monto_estimado: number | null;
};

type OrdenCompraItemRow = {
  iditem: string;
  nombre_producto_generico: string | null;
  total_linea_neto: number | null;
};

type CompraAgilItemRow = {
  codigo_producto: string;
  nombre_producto: string | null;
  cantidad_solicitada: string | null;
};

type AdjudicacionRow = {
  rut_proveedor: string;
  cantidad_adjudicada: string | null;
  monto_adjudicado: number | null;
};

type ReconciliationCountRow = {
  match_type: string;
  count: string;
};

type RelatedOcRow = {
  entity_b_key: string;
  entity_a_key: string;
  canonical_state: string | null;
  match_type: string;
  match_confidence: string;
};

type SourceLineageRow = Record<string, unknown> & {
  row_count: string;
  last_seen_at: Date | null;
};

type CompraAgilRawRow = { raw_payload: unknown };

const nullableString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

const nullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const PROCESS_TYPE_SET = new Set<string>(
  MERCADO_PUBLICO_DETECTED_PROCESS_TYPES,
);

const LICITACION_ITEM_SQL = `
  SELECT
    codigoitem,
    nombre_producto_generico,
    cantidad,
    monto_estimado
  FROM mp.licitacion_item
  WHERE codigo_externo = $1
  ORDER BY codigoitem ASC
`;

const ORDEN_COMPRA_ITEM_SQL = `
  SELECT
    iditem,
    nombre_producto_generico,
    total_linea_neto
  FROM mp.orden_compra_item
  WHERE codigo = $1
  ORDER BY iditem ASC
`;

const COMPRA_AGIL_ITEM_SQL = `
  SELECT
    codigo_producto,
    nombre_producto,
    cantidad_solicitada
  FROM mp.compra_agil_producto_solicitado
  WHERE codigo = $1
  ORDER BY ordinal ASC, codigo_producto ASC
`;

const LICITACION_ADJUDICACION_SQL = `
  SELECT
    rut_proveedor,
    cantidad_adjudicada,
    monto_adjudicado
  FROM mp.licitacion_adjudicacion
  WHERE codigo_externo = $1
  ORDER BY rut_proveedor ASC
`;

@Injectable()
export class MercadoPublicoProcessDetailReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async getDetectedProcessDetail(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoDetectedProcessDetail | null> {
    if (!PROCESS_TYPE_SET.has(processType)) {
      return null;
    }

    const goldRows = await this.coreDataSource.query<GoldRow[]>(
      `SELECT
        process_type,
        process_code,
        title,
        canonical_state,
        raw_state_code,
        raw_state_label,
        buyer_code,
        buyer_name,
        published_at,
        closing_at,
        source_priority,
        last_seen_at
      FROM mp.gold_detected_process
      WHERE process_type = $1 AND process_code = $2`,
      [processType, processCode],
    );

    if (goldRows.length === 0) {
      return null;
    }

    const gold = goldRows[0];

    const items = await this.resolveItems(processType, processCode);
    const adjudications = await this.resolveAdjudications(
      processType,
      processCode,
    );
    const relatedOcs = await this.resolveRelatedOcs(processType, processCode);
    const sourceLineage = await this.resolveSourceLineage(
      processType,
      processCode,
    );
    const reconciliationSummary = await this.resolveReconciliationSummary(
      processType,
      processCode,
    );
    const compraAgilSource = await this.resolveCompraAgilSource(
      processType,
      processCode,
    );

    return {
      processType:
        gold.process_type as MercadoPublicoDetectedProcessDetail['processType'],
      processCode: gold.process_code,
      title: gold.title,
      canonicalState: gold.canonical_state,
      rawState: {
        code: gold.raw_state_code,
        label: gold.raw_state_label,
      },
      buyer: {
        code: gold.buyer_code,
        name: gold.buyer_name,
      },
      dates: {
        publishedAt: gold.published_at,
        closingAt: gold.closing_at,
      },
      items,
      adjudications,
      relatedOcs,
      sourceLineage,
      reconciliationSummary,
      compraAgilSource,
      sourcePriority: gold.source_priority,
      lastSeenAt: gold.last_seen_at,
    };
  }

  private async resolveCompraAgilSource(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoCompraAgilSourceDetail | null> {
    if (processType !== 'compra_agil') {
      return null;
    }

    const rows = await this.coreDataSource.query<CompraAgilRawRow[]>(
      `
        SELECT raw.raw_payload
        FROM mp.raw_api_payload raw
        INNER JOIN mp.stg_api_v2_compra_agil staging
          ON staging.raw_api_payload_id = raw.id
        WHERE
          raw.source = 'api-v2-compra-agil'
          AND staging.codigo = $1
        ORDER BY
          staging.fecha_ultimo_cambio DESC NULLS LAST,
          raw.fetched_at DESC,
          raw.id DESC
        LIMIT 1
      `,
      [processCode],
    );
    const record = findV2CompraAgilRawRecord(rows[0]?.raw_payload, processCode);

    if (record === null) {
      return null;
    }

    const state = typeof record.estado === 'object' ? record.estado : undefined;

    return {
      sourcePath: nullableString(record.links?.detalle),
      state: {
        id: nullableString(state?.id_estado),
        code:
          nullableString(state?.codigo) ??
          (typeof record.estado === 'string' ? record.estado : null),
        label: nullableString(state?.glosa),
      },
      additionalDates: {
        lastChangedAt: nullableString(record.fechas?.fecha_ultimo_cambio),
        firstCallClosingAt: nullableString(
          record.fechas?.fecha_cierre_primer_llamado,
        ),
        secondCallClosingAt: nullableString(
          record.fechas?.fecha_cierre_segundo_llamado,
        ),
      },
      amounts: {
        currency: nullableString(record.montos?.moneda),
        available: nullableNumber(record.montos?.monto_disponible),
        availableClp: nullableNumber(record.montos?.monto_disponible_clp),
      },
      reasons: {
        deserted: nullableString(record.motivos?.motivo_desierta),
        selection: nullableString(record.motivos?.motivo_seleccion),
        cancellation: nullableString(record.motivos?.motivo_cancelacion),
      },
      offersReceived: nullableNumber(record.resumen?.total_ofertas_recibidas),
      documents: (record.documentos ?? [])
        .map((document) => ({
          id: nullableString(document.id),
          name: nullableString(document.nombre),
        }))
        .filter(
          (document): document is { id: string; name: string | null } =>
            document.id !== null,
        ),
      institution: {
        rut: nullableString(record.institucion?.rut),
        regionName: nullableString(record.institucion?.nombre_region),
        purchaseUnit: nullableString(record.institucion?.unidad_compra),
        buyerName: nullableString(record.institucion?.organismo_comprador),
      },
      call: {
        description: nullableString(record.convocatoria?.descripcion),
        state: nullableString(record.convocatoria?.estado_convocatoria),
      },
    };
  }

  private async resolveItems(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoProcessDetailItem[]> {
    let sql: string | null = null;

    switch (processType) {
      case 'licitacion':
        sql = LICITACION_ITEM_SQL;
        break;
      case 'orden_compra':
        sql = ORDEN_COMPRA_ITEM_SQL;
        break;
      case 'compra_agil':
        sql = COMPRA_AGIL_ITEM_SQL;
        break;
      default:
        return [];
    }

    const rows = await this.coreDataSource.query(sql, [processCode]);

    switch (processType) {
      case 'licitacion':
        return (rows as LicitacionItemRow[]).map((row) =>
          this.toLicitacionItem(row),
        );
      case 'orden_compra':
        return (rows as OrdenCompraItemRow[]).map((row) =>
          this.toOrdenCompraItem(row),
        );
      case 'compra_agil':
        return (rows as CompraAgilItemRow[]).map((row) =>
          this.toCompraAgilItem(row),
        );
      default:
        return [];
    }
  }

  private toLicitacionItem(
    row: LicitacionItemRow,
  ): MercadoPublicoProcessDetailItem {
    return {
      code: row.codigoitem,
      name: row.nombre_producto_generico,
      quantity: row.cantidad,
      amount: row.monto_estimado,
    };
  }

  private toOrdenCompraItem(
    row: OrdenCompraItemRow,
  ): MercadoPublicoProcessDetailItem {
    return {
      code: row.iditem,
      name: row.nombre_producto_generico,
      quantity: null,
      amount: row.total_linea_neto,
    };
  }

  private toCompraAgilItem(
    row: CompraAgilItemRow,
  ): MercadoPublicoProcessDetailItem {
    return {
      code: row.codigo_producto,
      name: row.nombre_producto,
      quantity: row.cantidad_solicitada,
      amount: null,
    };
  }

  private toLicitacionAdjudication(
    row: AdjudicacionRow,
  ): MercadoPublicoProcessDetailAdjudication {
    return {
      supplierCode: row.rut_proveedor,
      quantity: row.cantidad_adjudicada,
      amount: row.monto_adjudicado,
    };
  }

  private async resolveAdjudications(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoProcessDetailAdjudication[] | null> {
    if (processType !== 'licitacion') {
      return null;
    }

    const rows = await this.coreDataSource.query<AdjudicacionRow[]>(
      LICITACION_ADJUDICACION_SQL,
      [processCode],
    );

    return rows.map((row) => this.toLicitacionAdjudication(row));
  }

  private async resolveRelatedOcs(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoProcessDetailRelatedOc[]> {
    const sql = this.buildRelatedOcsSql(processType);

    const rows = await this.coreDataSource.query<RelatedOcRow[]>(sql, [
      processCode,
    ]);

    return rows.map((row) => this.toRelatedOc(row, processType));
  }

  private buildRelatedOcsSql(processType: string): string {
    switch (processType) {
      case 'licitacion':
        return `
          SELECT
            r.entity_b_key,
            g.canonical_state,
            r.match_type,
            r.match_confidence
          FROM mp.reconciliation_public_market_entities r
          LEFT JOIN mp.gold_detected_process g
            ON g.process_type = r.entity_b_type AND g.process_code = r.entity_b_key
          WHERE r.entity_a_type = 'licitacion'
            AND r.entity_a_key = $1
            AND r.entity_b_type = 'orden_compra'
          ORDER BY r.matched_at DESC
        `;
      case 'compra_agil':
        return `
          SELECT
            r.entity_b_key,
            g.canonical_state,
            r.match_type,
            r.match_confidence
          FROM mp.reconciliation_public_market_entities r
          LEFT JOIN mp.gold_detected_process g
            ON g.process_type = r.entity_b_type AND g.process_code = r.entity_b_key
          WHERE r.entity_a_type = 'compra_agil'
            AND r.entity_a_key = $1
            AND r.entity_b_type = 'orden_compra'
          ORDER BY r.matched_at DESC
        `;
      case 'orden_compra':
        return `
          SELECT
            r.entity_a_key,
            g.canonical_state,
            r.match_type,
            r.match_confidence
          FROM mp.reconciliation_public_market_entities r
          LEFT JOIN mp.gold_detected_process g
            ON g.process_type = r.entity_a_type AND g.process_code = r.entity_a_key
          WHERE r.entity_b_type = 'orden_compra'
            AND r.entity_b_key = $1
          ORDER BY r.matched_at DESC
        `;
      default:
        // ponytail: no related OCs for unknown process types
        return `
          SELECT
            NULL::text AS entity_b_key,
            NULL::text AS canonical_state,
            NULL::text AS match_type,
            NULL::text AS match_confidence
          WHERE FALSE
        `;
    }
  }

  private toRelatedOc(
    row: RelatedOcRow,
    processType: string,
  ): MercadoPublicoProcessDetailRelatedOc {
    const code =
      processType === 'orden_compra' ? row.entity_a_key : row.entity_b_key;

    return {
      code,
      canonicalState: row.canonical_state,
      matchType: row.match_type,
      matchConfidence: row.match_confidence,
    };
  }

  private async resolveSourceLineage(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoProcessDetailSourceLineageEntry[]> {
    const queries = this.buildSourceLineageQueries(processType, processCode);

    const results = await Promise.all(
      queries.map(async ({ sql, source, params }) => {
        const rows = await this.coreDataSource.query<SourceLineageRow[]>(
          sql,
          params,
        );
        const row = rows[0] ?? { row_count: '0', last_seen_at: null };

        return {
          source,
          rowCount: Number(row.row_count) || 0,
          lastSeenAt: row.last_seen_at ?? null,
        };
      }),
    );

    return results.filter((entry) => entry.rowCount > 0);
  }

  private buildSourceLineageQueries(
    processType: string,
    processCode: string,
  ): Array<{ sql: string; source: string; params: unknown[] }> {
    switch (processType) {
      case 'licitacion':
        return [
          {
            sql: `
              SELECT
                s.source,
                count(*)::bigint AS row_count,
                max(s.fetched_at) AS last_seen_at
              FROM mp.stg_api_v1_licitacion s
              WHERE s.codigo_externo = $1
              GROUP BY s.source
            `,
            source: 'api-v1-licitaciones',
            params: [processCode],
          },
          {
            sql: `
              SELECT
                s.source_dataset AS source,
                count(*)::bigint AS row_count,
                max(s.created_at) AS last_seen_at
              FROM mp.stg_csv_licitacion s
              WHERE s.codigo_externo = $1
              GROUP BY s.source_dataset
            `,
            source: 'csv-datos-abiertos',
            params: [processCode],
          },
        ];
      case 'orden_compra':
        return [
          {
            sql: `
              SELECT
                s.source,
                count(*)::bigint AS row_count,
                max(s.fetched_at) AS last_seen_at
              FROM mp.stg_api_v1_orden_compra s
              WHERE s.codigo = $1
              GROUP BY s.source
            `,
            source: 'api-v1-oc',
            params: [processCode],
          },
          {
            sql: `
              SELECT
                s.source_dataset AS source,
                count(*)::bigint AS row_count,
                max(s.created_at) AS last_seen_at
              FROM mp.stg_csv_orden_compra s
              WHERE s.codigo = $1
              GROUP BY s.source_dataset
            `,
            source: 'csv-datos-abiertos',
            params: [processCode],
          },
        ];
      case 'compra_agil':
        return [
          {
            sql: `
              SELECT
                s.source,
                count(*)::bigint AS row_count,
                max(s.fetched_at) AS last_seen_at
              FROM mp.stg_api_v2_compra_agil s
              WHERE s.codigo = $1
              GROUP BY s.source
            `,
            source: 'api-v2-compra-agil',
            params: [processCode],
          },
        ];
      default:
        return [];
    }
  }

  private async resolveReconciliationSummary(
    processType: string,
    processCode: string,
  ): Promise<MercadoPublicoProcessDetailReconciliationSummary> {
    const rows = await this.coreDataSource.query<ReconciliationCountRow[]>(
      `SELECT match_type, count(*)::bigint AS count
      FROM mp.reconciliation_public_market_entities
      WHERE (entity_a_type = $1 AND entity_a_key = $2)
         OR (entity_b_type = $1 AND entity_b_key = $2)
      GROUP BY match_type`,
      [processType, processCode],
    );

    const byType = new Map<string, number>();

    for (const row of rows) {
      byType.set(row.match_type, Number(row.count));
    }

    return {
      exact:
        (byType.get('exact_codigo_externo') || 0) +
        (byType.get('exact_codigo_licitacion') || 0) +
        (byType.get('exact_compra_agil_id_orden_compra') || 0) +
        (byType.get('csv_api_same_business_key') || 0),
      candidate:
        (byType.get('candidate_supplier_amount') || 0) +
        (byType.get('candidate_item_amount') || 0),
      unmatched: byType.get('unmatched') || 0,
      manualReviewRequired: byType.get('manual_review_required') || 0,
    };
  }
}
