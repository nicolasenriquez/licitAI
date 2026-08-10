import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { createJsonSha256 } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { redactMercadoPublicoRequestParams } from 'src/engine/core-modules/mercado-publico/utils/redact-mercado-publico-request-params.util';

export type MercadoPublicoV2ChildRelation =
  | 'documents'
  | 'items'
  | 'offers'
  | 'quotedProducts';

type MercadoPublicoV2RelationArrayName =
  | 'documentos'
  | 'productos_solicitados'
  | 'proveedores_cotizando'
  | 'productos_cotizados';

type MercadoPublicoV2DetailRow = {
  codigo: string;
  title: string | null;
  state: string | null;
  buyerCode: string | null;
  buyerName: string | null;
  region: number | null;
  publishedAt: Date | null;
  closingAt: Date | null;
  amount: string | null;
  currency: string | null;
  documentCount: number | null;
  llamado: number | null;
  availability: string;
  description: string | null;
  deliveryAddress: string | null;
  deliveryDays: number | null;
  cancellationAt: Date | null;
  callDescription: string | null;
  callFirstClosingAt: Date | null;
  callSecondClosingAt: Date | null;
  budgetType: string | null;
  budgetEstimate: string | null;
  budgetCurrency: string | null;
  cancelMotive: string | null;
  desertedMotive: string | null;
  selectionMotive: string | null;
  totalOffers: number | null;
  totalDemands: number | null;
  finePenalty: string | null;
  observationId: string | null;
  normalizerVersion: string | null;
  providerSchemaFingerprint: string | null;
  lifecycleReason: string | null;
  snapshotKind: string | null;
  source: string | null;
  endpoint: string | null;
  observedAt: Date | null;
  providerChangedAt: Date | null;
  freshnessStatus: 'fresh' | 'stale' | 'unavailable';
  freshnessError: string | null;
  freshnessAsOf: Date | null;
};

export type MercadoPublicoV2Detail = MercadoPublicoV2DetailRow & {
  detailFreshness: {
    status: 'fresh' | 'stale' | 'unavailable';
    lastError: string | null;
    asOf: Date | null;
  };
  provenance: {
    observationId: string | null;
    normalizerVersion: string | null;
    providerSchemaFingerprint: string | null;
    snapshotKind: string | null;
    source: string | null;
    endpoint: string | null;
    observedAt: Date | null;
    providerChangedAt: Date | null;
  };
};

export type MercadoPublicoV2RelationAvailability = {
  availability: 'available' | 'unavailable';
  totalCount: number | null;
  sourceKind: 'list' | 'detail' | null;
  asOf: Date | null;
};

export type MercadoPublicoV2RelationNode = {
  id: string | null;
  name: string | null;
  productCode: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: string | null;
  totalAmount: string | null;
  providerId: string | null;
  providerName: string | null;
  providerRut: string | null;
  providerKey: string | null;
  ordinal: number;
};

export type MercadoPublicoV2RelationEdge = {
  cursor: string;
  node: MercadoPublicoV2RelationNode;
};

export type MercadoPublicoV2RelationConnection = {
  edges: MercadoPublicoV2RelationEdge[];
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  availability: MercadoPublicoV2RelationAvailability;
};

export type MercadoPublicoV2SanitizedPayload = {
  codigo: string;
  observationId: string;
  payload: unknown;
  sourcePayloadChecksum: string;
  sanitizedPayloadChecksum: string;
  redacted: boolean;
};

type DetailQueryRow = {
  codigo: string;
  title: string | null;
  state: string | null;
  buyer_code: string | null;
  buyer_name: string | null;
  region: number | null;
  published_at: Date | null;
  closing_at: Date | null;
  amount: string | null;
  currency_source: string | null;
  document_count: number | null;
  llamado: number | null;
  availability: string;
  description: string | null;
  delivery_address: string | null;
  delivery_days: number | null;
  cancellation_at: Date | null;
  call_description: string | null;
  call_first_closing_at: Date | null;
  call_second_closing_at: Date | null;
  budget_type: string | null;
  budget_estimate: string | null;
  budget_currency: string | null;
  cancel_motive: string | null;
  deserted_motive: string | null;
  selection_motive: string | null;
  total_offers: number | null;
  total_demands: number | null;
  fine_penalty: string | null;
  observation_id: string | null;
  normalizer_version: string | null;
  provider_schema_fingerprint: string | null;
  lifecycle_reason: string | null;
  snapshot_kind: string | null;
  source: string | null;
  endpoint: string | null;
  observed_at: Date | null;
  provider_changed_at: Date | null;
  freshness_status: 'fresh' | 'stale' | 'unavailable';
  freshness_error: string | null;
  freshness_as_of: Date | null;
};

type RelationSnapshotQueryRow = {
  availability: 'available' | 'unavailable';
  total_count: number;
  source_kind: 'list' | 'detail';
  projected_at: Date;
};

type ChildEvidenceQueryRow = {
  provider_key: string | null;
  ordinal: number;
  element_json: unknown;
  provider_json: unknown;
};

type RawPayloadQueryRow = {
  codigo: string;
  observation_id: string;
  payload_checksum: string;
  raw_payload: unknown;
};

type ChildCursor = {
  relation: MercadoPublicoV2ChildRelation;
  observationId: string;
  ordinal: number;
};

const RELATION_ARRAY_NAMES: Record<
  MercadoPublicoV2ChildRelation,
  MercadoPublicoV2RelationArrayName
> = {
  documents: 'documentos',
  items: 'productos_solicitados',
  offers: 'proveedores_cotizando',
  quotedProducts: 'productos_cotizados',
};

const encodeChildCursor = (
  relation: MercadoPublicoV2ChildRelation,
  observationId: string,
  ordinal: number,
): string =>
  Buffer.from(
    JSON.stringify({ relation, observationId, ordinal } satisfies ChildCursor),
  ).toString('base64url');

const decodeChildCursor = (
  value: string,
  relation: MercadoPublicoV2ChildRelation,
  observationId: string,
): ChildCursor => {
  try {
    const cursor = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as Partial<ChildCursor>;

    if (
      cursor.relation !== relation ||
      cursor.observationId !== observationId ||
      !Number.isInteger(cursor.ordinal) ||
      cursor.ordinal === undefined ||
      cursor.ordinal < 0
    ) {
      throw new Error('invalid child cursor');
    }

    return cursor as ChildCursor;
  } catch {
    throw new BadRequestException('Mercado Publico V2 child cursor is invalid');
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toDate = (value: Date | string | null): Date | null => {
  if (value === null) return null;
  if (value instanceof Date) return value;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapDetail = (row: DetailQueryRow): MercadoPublicoV2Detail => {
  const detailFreshness = {
    status: row.freshness_status,
    lastError: row.freshness_error,
    asOf: toDate(row.freshness_as_of),
  };

  return {
    codigo: row.codigo,
    title: row.title,
    state: row.state,
    buyerCode: row.buyer_code,
    buyerName: row.buyer_name,
    region: row.region,
    publishedAt: toDate(row.published_at),
    closingAt: toDate(row.closing_at),
    amount: row.amount,
    currency: row.currency_source,
    documentCount: row.document_count,
    llamado: row.llamado,
    availability: row.availability,
    description: row.description,
    deliveryAddress: row.delivery_address,
    deliveryDays: row.delivery_days,
    cancellationAt: toDate(row.cancellation_at),
    callDescription: row.call_description,
    callFirstClosingAt: toDate(row.call_first_closing_at),
    callSecondClosingAt: toDate(row.call_second_closing_at),
    budgetType: row.budget_type,
    budgetEstimate: row.budget_estimate,
    budgetCurrency: row.budget_currency,
    cancelMotive: row.cancel_motive,
    desertedMotive: row.deserted_motive,
    selectionMotive: row.selection_motive,
    totalOffers: row.total_offers,
    totalDemands: row.total_demands,
    finePenalty: row.fine_penalty,
    observationId: row.observation_id,
    normalizerVersion: row.normalizer_version,
    providerSchemaFingerprint: row.provider_schema_fingerprint,
    lifecycleReason: row.lifecycle_reason,
    snapshotKind: row.snapshot_kind,
    source: row.source,
    endpoint: row.endpoint,
    observedAt: toDate(row.observed_at),
    providerChangedAt: toDate(row.provider_changed_at),
    freshnessStatus: row.freshness_status,
    freshnessError: row.freshness_error,
    freshnessAsOf: toDate(row.freshness_as_of),
    detailFreshness,
    provenance: {
      observationId: row.observation_id,
      normalizerVersion: row.normalizer_version,
      providerSchemaFingerprint: row.provider_schema_fingerprint,
      snapshotKind: row.snapshot_kind,
      source: row.source,
      endpoint: row.endpoint,
      observedAt: toDate(row.observed_at),
      providerChangedAt: toDate(row.provider_changed_at),
    },
  };
};

const mapRelationNode = (
  relation: MercadoPublicoV2ChildRelation,
  row: ChildEvidenceQueryRow,
): MercadoPublicoV2RelationNode => {
  const element = asRecord(row.element_json) ?? {};
  const provider = asRecord(row.provider_json);
  const providerId = asString(
    provider?.id_cotizacion ??
      (relation === 'offers'
        ? element.id_cotizacion
        : row.provider_key?.split(':')[0]),
  );
  const providerName = asString(provider?.razon_social);

  return {
    id: asString(
      element.id ?? element.id_cotizacion ?? element.codigo_producto,
    ),
    name: asString(element.nombre ?? element.nombre_producto),
    productCode: asString(element.codigo_producto),
    description: asString(element.descripcion),
    quantity: asNumber(element.cantidad),
    unit: asString(element.unidad_medida),
    unitPrice: asString(element.precio_unitario),
    totalAmount: asString(
      element.monto_total_producto ??
        (relation === 'offers' ? element.monto_total : null),
    ),
    providerId,
    providerName,
    providerRut: asString(provider?.rut_proveedor ?? element.rut_proveedor),
    providerKey: row.provider_key,
    ordinal: row.ordinal,
  };
};

@Injectable()
export class MercadoPublicoV2DetailReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async getOpportunityDetail(
    codigo: string,
  ): Promise<MercadoPublicoV2Detail | null> {
    const rows = await this.coreDataSource.query<DetailQueryRow[]>(
      `
        SELECT
          gold.process_code AS codigo,
          gold.title,
          gold.canonical_state AS state,
          gold.buyer_code,
          gold.buyer_name,
          gold.region,
          gold.published_at,
          gold.closing_at,
          COALESCE(gold.amount_raw, gold.amount::text) AS amount,
          gold.currency_source,
          gold.document_count,
          gold.llamado,
          gold.availability,
          gold.description,
          gold.delivery_address,
          gold.delivery_days,
          gold.cancellation_at,
          gold.call_description,
          gold.call_first_closing_at,
          gold.call_second_closing_at,
          gold.budget_type,
          gold.budget_estimate,
          gold.budget_currency,
          gold.cancel_motive,
          gold.deserted_motive,
          gold.selection_motive,
          gold.total_offers,
          gold.total_demands,
          gold.fine_penalty,
          gold.observation_id,
          gold.normalizer_version,
          gold.provider_schema_fingerprint,
          cohort.lifecycle_reason,
          observation.snapshot_kind,
          observation.source,
          observation.endpoint,
          observation.observed_at,
          observation.provider_changed_at,
          CASE
            WHEN gold.observation_id IS NULL THEN 'unavailable'
            WHEN detail_error.error_summary IS NOT NULL THEN 'stale'
            ELSE 'fresh'
          END AS freshness_status,
          detail_error.error_summary AS freshness_error,
          COALESCE(observation.observed_at, gold.observed_at) AS freshness_as_of
        FROM mp.gold_detected_process AS gold
        LEFT JOIN mp.v2_observation AS observation
          ON observation.id = gold.observation_id
        LEFT JOIN mp.v2_cohort AS cohort
          ON cohort.source = 'api-v2-compra-agil'
         AND cohort.scope = 'global'
         AND cohort.codigo = gold.process_code
        LEFT JOIN LATERAL (
          SELECT item.error_summary
          FROM mp.sync_run_item AS item
          WHERE item.sync_run_id = observation.sync_run_id
            AND item.codigo = gold.process_code
            AND item.error_summary IS NOT NULL
          ORDER BY item.updated_at DESC NULLS LAST
          LIMIT 1
        ) AS detail_error ON TRUE
        WHERE gold.process_type = 'compra_agil'
          AND gold.process_code = $1
      `,
      [codigo],
    );

    return rows[0] ? mapDetail(rows[0]) : null;
  }

  async listOpportunityRelation(input: {
    codigo: string;
    observationId?: string;
    relation: MercadoPublicoV2ChildRelation;
    after?: string;
    first?: number;
  }): Promise<MercadoPublicoV2RelationConnection | null> {
    const detail = await this.getOpportunityDetail(input.codigo);

    if (!detail) return null;

    const observationId = input.observationId ?? detail.observationId;

    if (!observationId) {
      return this.unavailableRelation();
    }

    const relation = input.relation;
    const arrayName = RELATION_ARRAY_NAMES[relation];
    const limit = Math.min(Math.max(Math.floor(input.first ?? 100), 1), 100);
    const after = input.after
      ? decodeChildCursor(input.after, relation, observationId).ordinal
      : undefined;
    const snapshotRows = await this.coreDataSource.query<
      RelationSnapshotQueryRow[]
    >(
      `
        SELECT availability, total_count, source_kind, projected_at
        FROM mp.v2_relation_snapshot
        WHERE observation_id = $1 AND codigo = $2 AND relation = $3
      `,
      [observationId, input.codigo, arrayName],
    );
    const snapshot = snapshotRows[0];

    if (!snapshot || snapshot.availability === 'unavailable') {
      return {
        edges: [],
        hasNextPage: false,
        startCursor: null,
        endCursor: null,
        availability: snapshot
          ? {
              availability: 'unavailable',
              totalCount: null,
              sourceKind: snapshot.source_kind,
              asOf: toDate(snapshot.projected_at),
            }
          : {
              availability: 'unavailable',
              totalCount: null,
              sourceKind: null,
              asOf: null,
            },
      };
    }

    const childRows = await this.coreDataSource.query<ChildEvidenceQueryRow[]>(
      `
        SELECT
          child.provider_key,
          child.ordinal,
          child.element_json,
          provider.element_json AS provider_json
        FROM mp.v2_child_evidence AS child
        LEFT JOIN mp.v2_child_evidence AS provider
          ON provider.observation_id = child.observation_id
         AND provider.codigo = child.codigo
         AND provider.array_name = 'proveedores_cotizando'
         AND provider.provider_key = child.parent_provider_key
        WHERE child.observation_id = $1
          AND child.codigo = $2
          AND child.array_name = $3
          AND ($4::integer IS NULL OR child.ordinal > $4::integer)
        ORDER BY child.ordinal ASC
        LIMIT $5
      `,
      [observationId, input.codigo, arrayName, after ?? null, limit + 1],
    );
    const pageRows = childRows.slice(0, limit);
    const edges = pageRows.map((row) => ({
      cursor: encodeChildCursor(relation, observationId, row.ordinal),
      node: mapRelationNode(relation, row),
    }));

    return {
      edges,
      hasNextPage: childRows.length > limit,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
      availability: {
        availability: 'available',
        totalCount: snapshot.total_count,
        sourceKind: snapshot.source_kind,
        asOf: toDate(snapshot.projected_at),
      },
    };
  }

  async getSanitizedOpportunityPayload(
    observationId: string,
  ): Promise<MercadoPublicoV2SanitizedPayload | null> {
    const rows = await this.coreDataSource.query<RawPayloadQueryRow[]>(
      `
        SELECT
          observation.codigo,
          observation.id AS observation_id,
          payload.payload_checksum,
          payload.raw_payload
        FROM mp.v2_observation AS observation
        INNER JOIN mp.raw_api_payload AS payload
          ON payload.id = observation.raw_api_payload_id
        WHERE observation.id = $1
      `,
      [observationId],
    );
    const row = rows[0];

    if (!row) return null;

    const payload = redactMercadoPublicoRequestParams(row.raw_payload);

    return {
      codigo: row.codigo,
      observationId: row.observation_id,
      payload,
      sourcePayloadChecksum: row.payload_checksum,
      sanitizedPayloadChecksum: createJsonSha256(payload),
      redacted: JSON.stringify(payload) !== JSON.stringify(row.raw_payload),
    };
  }

  async getSanitizedOpportunityPayloadByCodigo(
    codigo: string,
  ): Promise<MercadoPublicoV2SanitizedPayload | null> {
    const detail = await this.getOpportunityDetail(codigo);

    return detail?.observationId
      ? this.getSanitizedOpportunityPayload(detail.observationId)
      : null;
  }

  private unavailableRelation(): MercadoPublicoV2RelationConnection {
    return {
      edges: [],
      hasNextPage: false,
      startCursor: null,
      endCursor: null,
      availability: {
        availability: 'unavailable',
        totalCount: null,
        sourceKind: null,
        asOf: null,
      },
    };
  }
}
