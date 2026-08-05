import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  MERCADO_PUBLICO_COMPRA_AGIL_CALL_STAGES,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_LIMIT,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_PAGE,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_DIRECTION,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_KEY,
  MERCADO_PUBLICO_DETECTED_PROCESS_MAX_LIMIT,
  MERCADO_PUBLICO_DETECTED_PROCESS_SORT_KEYS,
  MERCADO_PUBLICO_DETECTED_PROCESS_TYPES,
  type MercadoPublicoCompraAgilCallStage,
  type MercadoPublicoDetectedProcessSortKey,
} from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';
import {
  type MercadoPublicoCompraAgilAnalytics,
  type MercadoPublicoCompraAgilBusinessFilters,
  type MercadoPublicoDetectedProcessItem,
  type MercadoPublicoListDetectedProcessesFilters,
  type MercadoPublicoListDetectedProcessesResult,
} from 'src/engine/core-modules/mercado-publico/types/detected-process-read.types';

type GoldDetectedProcessRow = {
  process_type: string;
  process_code: string;
  title: string | null;
  canonical_state: string | null;
  raw_state_code: string | null;
  raw_state_label: string | null;
  buyer_code: string | null;
  buyer_name: string | null;
  buyer_rut: string | null;
  purchase_unit_name: string | null;
  region_name: string | null;
  amount_available_clp: number | string | null;
  call_stage: MercadoPublicoCompraAgilCallStage | null;
  document_count: number | null;
  offers_received_count: number | null;
  published_at: Date | null;
  closing_at: Date | null;
  source_priority: string | null;
  reconciliation_status: string | null;
  last_seen_at: Date;
};

type NormalizedFilters = {
  processTypes: string[];
  states: string[];
  buyerCode: string | null;
  publishedFrom: Date | null;
  publishedTo: Date | null;
  changedSince: Date | null;
  page: number;
  limit: number;
  sortKey: MercadoPublicoDetectedProcessSortKey;
  sortDirection: 'asc' | 'desc';
  search: string | null;
  regionName: string | null;
  closingFrom: Date | null;
  closingTo: Date | null;
  hasDocuments: boolean | null;
  callStages: MercadoPublicoCompraAgilCallStage[];
  amountMin: number | null;
  amountMax: number | null;
  buyerRut: string | null;
};

type CompraAgilAnalyticsRow = {
  total_found: number | string | null;
  closing_next_24_hours: number | string | null;
  known_amount_available_clp: number | string | null;
  positive_document_count: number | string | null;
  closing_by_day: unknown;
  regions: unknown;
  top_buyers: unknown;
  amount_bands: unknown;
  call_stages: unknown;
  document_availability: unknown;
  filtered_population: number | string | null;
  calculated_at: Date | string | null;
  timezone: string;
  complete_population: boolean;
  closing_at_coverage: number | string | null;
  region_name_coverage: number | string | null;
  buyer_identity_coverage: number | string | null;
  amount_available_clp_coverage: number | string | null;
  call_stage_coverage: number | string | null;
  document_count_coverage: number | string | null;
  offers_received_count_coverage: number | string | null;
};

const SORT_KEY_TO_COLUMN: Record<MercadoPublicoDetectedProcessSortKey, string> =
  {
    lastSeenAt: 'last_seen_at',
    publishedAt: 'published_at',
    closingAt: 'closing_at',
    amountAvailableClp: 'amount_available_clp',
    processCode: 'process_code',
    canonicalState: 'canonical_state',
  };

const SORT_KEY_SET = new Set<string>(
  MERCADO_PUBLICO_DETECTED_PROCESS_SORT_KEYS,
);
const PROCESS_TYPE_SET = new Set<string>(
  MERCADO_PUBLICO_DETECTED_PROCESS_TYPES,
);
const CALL_STAGE_SET = new Set<string>(MERCADO_PUBLICO_COMPRA_AGIL_CALL_STAGES);

const ANALYTICS_TIMEZONE = 'America/Santiago';

const asNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const asNullableNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const asJsonArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

@Injectable()
export class MercadoPublicoDetectedProcessReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listDetectedProcesses(
    filters: MercadoPublicoListDetectedProcessesFilters,
  ): Promise<MercadoPublicoListDetectedProcessesResult> {
    const normalized = this.normalizeFilters(filters);

    const { whereSql, whereParams } = this.buildWhereClause(normalized);

    const sortColumn = SORT_KEY_TO_COLUMN[normalized.sortKey];

    const countSql = `SELECT count(*)::bigint AS total FROM mp.gold_detected_process${whereSql}`;
    const countResult = await this.coreDataSource.query<{ total: string }[]>(
      countSql,
      whereParams,
    );
    const total = Number(countResult[0]?.total ?? 0);

    const offset = (normalized.page - 1) * normalized.limit;

    const listSql = `
      SELECT
        process_type,
        process_code,
        title,
        canonical_state,
        raw_state_code,
        raw_state_label,
        buyer_code,
        buyer_name,
        buyer_rut,
        purchase_unit_name,
        region_name,
        amount_available_clp,
        call_stage,
        document_count,
        offers_received_count,
        published_at,
        closing_at,
        source_priority,
        reconciliation_status,
        last_seen_at
      FROM mp.gold_detected_process
      ${whereSql}
      ORDER BY ${sortColumn} ${normalized.sortDirection.toUpperCase()}, process_type ASC, process_code ASC
      LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
    `;

    const listParams = [...whereParams, normalized.limit, offset];
    const rows = await this.coreDataSource.query<GoldDetectedProcessRow[]>(
      listSql,
      listParams,
    );

    return {
      items: rows.map((row) => this.toItem(row)),
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }

  async getCompraAgilAnalytics(
    filters: MercadoPublicoCompraAgilBusinessFilters,
  ): Promise<MercadoPublicoCompraAgilAnalytics> {
    const normalized = this.normalizeBusinessFilters(filters);
    const { whereSql, whereParams } = this.buildWhereClause({
      processTypes: ['compra_agil'],
      states: [],
      buyerCode: null,
      publishedFrom: null,
      publishedTo: null,
      changedSince: null,
      page: 1,
      limit: MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_LIMIT,
      sortKey: MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_KEY,
      sortDirection: MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_DIRECTION,
      ...normalized,
    });

    const [row] = await this.coreDataSource.query<CompraAgilAnalyticsRow[]>(
      `
      WITH filtered AS (
        SELECT
          process_code,
          buyer_name,
          buyer_code,
          buyer_rut,
          region_name,
          amount_available_clp,
          call_stage,
          document_count,
          offers_received_count,
          closing_at
        FROM mp.gold_detected_process
        ${whereSql}
      ),
      summary AS (
        SELECT
          COUNT(*)::integer AS total_found,
          COUNT(*) FILTER (
            WHERE closing_at >= now()
              AND closing_at < now() + INTERVAL '24 hours'
          )::integer AS closing_next_24_hours,
          CASE
            WHEN COUNT(amount_available_clp) = 0 THEN NULL
            ELSE SUM(amount_available_clp)::double precision
          END AS known_amount_available_clp,
          COUNT(*) FILTER (WHERE document_count > 0)::integer
            AS positive_document_count
        FROM filtered
      ),
      closing_days AS (
        SELECT day::date AS day
        FROM generate_series(
          (now() AT TIME ZONE '${ANALYTICS_TIMEZONE}')::date,
          (now() AT TIME ZONE '${ANALYTICS_TIMEZONE}')::date + 6,
          INTERVAL '1 day'
        ) AS days(day)
      ),
      closing_by_day AS (
        SELECT
          to_char(days.day, 'YYYY-MM-DD') AS date,
          COUNT(filtered.process_code)::integer AS count
        FROM closing_days days
        LEFT JOIN filtered
          ON filtered.closing_at IS NOT NULL
          AND (filtered.closing_at AT TIME ZONE '${ANALYTICS_TIMEZONE}')::date = days.day
        GROUP BY days.day
      ),
      regions AS (
        SELECT region_name, COUNT(*)::integer AS count
        FROM filtered
        WHERE region_name IS NOT NULL
        GROUP BY region_name
        ORDER BY count DESC, region_name ASC
        LIMIT 5
      ),
      buyers AS (
        SELECT
          COALESCE(NULLIF(BTRIM(buyer_rut), ''), NULLIF(BTRIM(buyer_code), ''))
            AS buyer_key,
          MAX(buyer_name) FILTER (WHERE buyer_name IS NOT NULL) AS buyer_name,
          COUNT(*)::integer AS count
        FROM filtered
        WHERE COALESCE(
          NULLIF(BTRIM(buyer_rut), ''),
          NULLIF(BTRIM(buyer_code), '')
        ) IS NOT NULL
        GROUP BY buyer_key
        ORDER BY count DESC, buyer_key ASC
        LIMIT 5
      ),
      amount_band_definitions (band, ordinal) AS (
        VALUES
          ('under_100k', 1),
          ('100k_to_500k', 2),
          ('500k_to_1m', 3),
          ('1m_to_3m', 4),
          ('over_3m', 5)
      ),
      amount_bands AS (
        SELECT
          definitions.band,
          definitions.ordinal,
          COUNT(filtered.process_code)::integer AS count
        FROM amount_band_definitions definitions
        LEFT JOIN filtered
          ON CASE
            WHEN filtered.amount_available_clp < 100000 THEN 'under_100k'
            WHEN filtered.amount_available_clp < 500000 THEN '100k_to_500k'
            WHEN filtered.amount_available_clp < 1000000 THEN '500k_to_1m'
            WHEN filtered.amount_available_clp <= 3000000 THEN '1m_to_3m'
            WHEN filtered.amount_available_clp > 3000000 THEN 'over_3m'
          END = definitions.band
        GROUP BY definitions.band, definitions.ordinal
        ORDER BY definitions.ordinal
      ),
      call_stage_definitions (call_stage, ordinal) AS (
        VALUES ('first_call', 1), ('second_call', 2)
      ),
      call_stages AS (
        SELECT
          definitions.call_stage,
          COUNT(filtered.process_code)::integer AS count
        FROM call_stage_definitions definitions
        LEFT JOIN filtered ON filtered.call_stage = definitions.call_stage
        GROUP BY definitions.call_stage, definitions.ordinal
        ORDER BY definitions.ordinal
      ),
      document_availability_definitions (has_documents, ordinal) AS (
        VALUES (true, 1), (false, 2)
      ),
      document_availability AS (
        SELECT
          definitions.has_documents,
          COUNT(filtered.process_code)::integer AS count
        FROM document_availability_definitions definitions
        LEFT JOIN filtered
          ON (filtered.document_count > 0) = definitions.has_documents
        GROUP BY definitions.has_documents, definitions.ordinal
        ORDER BY definitions.ordinal
      ),
      coverage AS (
        SELECT
          COUNT(*)::integer AS filtered_population,
          COUNT(closing_at)::integer AS closing_at_coverage,
          COUNT(*) FILTER (
            WHERE COALESCE(
              NULLIF(BTRIM(buyer_rut), ''),
              NULLIF(BTRIM(buyer_code), '')
            ) IS NOT NULL
          )::integer AS buyer_identity_coverage,
          COUNT(region_name)::integer AS region_name_coverage,
          COUNT(amount_available_clp)::integer AS amount_available_clp_coverage,
          COUNT(call_stage)::integer AS call_stage_coverage,
          COUNT(document_count)::integer AS document_count_coverage,
          COUNT(offers_received_count)::integer AS offers_received_count_coverage
        FROM filtered
      )
      SELECT
        summary.total_found,
        summary.closing_next_24_hours,
        summary.known_amount_available_clp,
        summary.positive_document_count,
        COALESCE(
          (SELECT json_agg(closing_by_day ORDER BY closing_by_day.date)
           FROM closing_by_day),
          '[]'::json
        ) AS closing_by_day,
        COALESCE(
          (SELECT json_agg(regions ORDER BY regions.count DESC, regions.region_name ASC)
           FROM regions),
          '[]'::json
        ) AS regions,
        COALESCE(
          (SELECT json_agg(buyers ORDER BY buyers.count DESC, buyers.buyer_key ASC)
           FROM buyers),
          '[]'::json
        ) AS top_buyers,
        COALESCE(
          (SELECT json_agg(
             json_build_object('band', amount_bands.band, 'count', amount_bands.count)
             ORDER BY amount_bands.ordinal
           )
           FROM amount_bands),
          '[]'::json
        ) AS amount_bands,
        COALESCE(
          (SELECT json_agg(call_stages ORDER BY call_stages.call_stage)
           FROM call_stages),
          '[]'::json
        ) AS call_stages,
        COALESCE(
          (SELECT json_agg(document_availability ORDER BY document_availability.has_documents DESC)
           FROM document_availability),
          '[]'::json
        ) AS document_availability,
        coverage.filtered_population,
        now() AS calculated_at,
        '${ANALYTICS_TIMEZONE}' AS timezone,
        true AS complete_population,
        coverage.closing_at_coverage,
        coverage.region_name_coverage,
        coverage.buyer_identity_coverage,
        coverage.amount_available_clp_coverage,
        coverage.call_stage_coverage,
        coverage.document_count_coverage,
        coverage.offers_received_count_coverage
      FROM summary
      CROSS JOIN coverage
    `,
      whereParams,
    );

    return this.toAnalyticsResult(row);
  }

  private normalizeFilters(
    filters: MercadoPublicoListDetectedProcessesFilters,
  ): NormalizedFilters {
    const processTypes = (filters.processTypes ?? []).filter((value) =>
      PROCESS_TYPE_SET.has(value),
    );

    const states = (filters.states ?? []).filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );

    const buyerCode =
      typeof filters.buyerCode === 'string' &&
      filters.buyerCode.trim().length > 0
        ? filters.buyerCode.trim()
        : null;

    const sortKeyCandidate = filters.sort?.key;

    if (sortKeyCandidate !== undefined && !SORT_KEY_SET.has(sortKeyCandidate)) {
      throw new Error(
        `Unknown Mercado Publico detected process sort key: ${sortKeyCandidate}`,
      );
    }

    const sortKey: MercadoPublicoDetectedProcessSortKey =
      sortKeyCandidate ?? MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_KEY;
    const sortDirection =
      filters.sort?.direction ??
      MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_DIRECTION;

    const page = this.coercePositiveInteger(
      filters.page,
      MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_PAGE,
    );
    const limit = this.coerceBoundedInteger(
      filters.limit,
      MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_LIMIT,
      MERCADO_PUBLICO_DETECTED_PROCESS_MAX_LIMIT,
    );

    return {
      ...this.normalizeBusinessFilters(filters),
      processTypes,
      states,
      buyerCode,
      publishedFrom: filters.publishedFrom ?? null,
      publishedTo: filters.publishedTo ?? null,
      changedSince: filters.changedSince ?? null,
      page,
      limit,
      sortKey,
      sortDirection,
    };
  }

  private normalizeBusinessFilters(
    filters: MercadoPublicoCompraAgilBusinessFilters,
  ): Pick<
    NormalizedFilters,
    | 'search'
    | 'regionName'
    | 'closingFrom'
    | 'closingTo'
    | 'hasDocuments'
    | 'callStages'
    | 'amountMin'
    | 'amountMax'
    | 'buyerRut'
  > {
    const normalizeString = (value: string | undefined): string | null => {
      const normalized = value?.trim();

      return normalized ? normalized : null;
    };

    const normalizeNumber = (value: number | undefined): number | null => {
      return value !== undefined && Number.isFinite(value) ? value : null;
    };

    return {
      search: normalizeString(filters.search),
      regionName: normalizeString(filters.regionName),
      closingFrom: filters.closingFrom ?? null,
      closingTo: filters.closingTo ?? null,
      hasDocuments: filters.hasDocuments ?? null,
      callStages: (filters.callStages ?? []).filter(
        (value): value is MercadoPublicoCompraAgilCallStage =>
          CALL_STAGE_SET.has(value),
      ),
      amountMin: normalizeNumber(filters.amountMin),
      amountMax: normalizeNumber(filters.amountMax),
      buyerRut: normalizeString(filters.buyerRut),
    };
  }

  private coercePositiveInteger(value: number | undefined, fallback: number) {
    if (value === undefined || !Number.isFinite(value) || value < 1) {
      return fallback;
    }

    return Math.floor(value);
  }

  private coerceBoundedInteger(
    value: number | undefined,
    fallback: number,
    max: number,
  ) {
    const safe = this.coercePositiveInteger(value, fallback);

    return Math.min(safe, max);
  }

  private buildWhereClause(normalized: NormalizedFilters): {
    whereSql: string;
    whereParams: unknown[];
  } {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (normalized.processTypes.length > 0) {
      params.push(normalized.processTypes);
      clauses.push(`process_type = ANY($${params.length}::text[])`);
    }

    if (normalized.states.length > 0) {
      params.push(normalized.states);
      clauses.push(`canonical_state = ANY($${params.length}::text[])`);
    }

    if (normalized.buyerCode !== null) {
      params.push(normalized.buyerCode);
      clauses.push(`buyer_code = $${params.length}`);
    }

    if (normalized.publishedFrom !== null) {
      params.push(normalized.publishedFrom);
      clauses.push(`published_at >= $${params.length}`);
    }

    if (normalized.publishedTo !== null) {
      params.push(normalized.publishedTo);
      clauses.push(`published_at <= $${params.length}`);
    }

    if (normalized.changedSince !== null) {
      params.push(normalized.changedSince);
      clauses.push(`last_seen_at >= $${params.length}`);
    }

    if (normalized.search !== null) {
      params.push(`%${normalized.search}%`);
      clauses.push(
        `(process_code ILIKE $${params.length} OR title ILIKE $${params.length} OR buyer_name ILIKE $${params.length} OR purchase_unit_name ILIKE $${params.length})`,
      );
    }

    if (normalized.regionName !== null) {
      params.push(normalized.regionName);
      clauses.push(`region_name = $${params.length}`);
    }

    if (normalized.closingFrom !== null) {
      params.push(normalized.closingFrom);
      clauses.push(`closing_at >= $${params.length}`);
    }

    if (normalized.closingTo !== null) {
      params.push(normalized.closingTo);
      clauses.push(`closing_at <= $${params.length}`);
    }

    if (normalized.hasDocuments === true) {
      clauses.push('document_count > 0');
    }

    if (normalized.hasDocuments === false) {
      clauses.push('document_count = 0');
    }

    if (normalized.callStages.length > 0) {
      params.push(normalized.callStages);
      clauses.push(`call_stage = ANY($${params.length}::text[])`);
    }

    if (normalized.amountMin !== null) {
      params.push(normalized.amountMin);
      clauses.push(`amount_available_clp >= $${params.length}`);
    }

    if (normalized.amountMax !== null) {
      params.push(normalized.amountMax);
      clauses.push(`amount_available_clp <= $${params.length}`);
    }

    if (normalized.buyerRut !== null) {
      params.push(normalized.buyerRut);
      clauses.push(`buyer_rut = $${params.length}`);
    }

    const whereSql =
      clauses.length === 0 ? '' : ` WHERE ${clauses.join(' AND ')}`;

    return { whereSql, whereParams: params };
  }

  private toItem(
    row: GoldDetectedProcessRow,
  ): MercadoPublicoDetectedProcessItem {
    return {
      processType:
        row.process_type as MercadoPublicoDetectedProcessItem['processType'],
      processCode: row.process_code,
      title: row.title,
      canonicalState: row.canonical_state,
      rawStateCode: row.raw_state_code,
      rawStateLabel: row.raw_state_label,
      buyerCode: row.buyer_code,
      buyerName: row.buyer_name,
      buyerRut: row.buyer_rut ?? null,
      purchaseUnitName: row.purchase_unit_name ?? null,
      regionName: row.region_name ?? null,
      amountAvailableClp: asNullableNumber(row.amount_available_clp),
      callStage: row.call_stage ?? null,
      documentCount: row.document_count ?? null,
      offersReceivedCount: row.offers_received_count ?? null,
      publishedAt: row.published_at,
      closingAt: row.closing_at,
      sourcePriority: row.source_priority,
      reconciliationStatus: row.reconciliation_status,
      lastSeenAt: row.last_seen_at,
    };
  }

  private toAnalyticsResult(
    row: CompraAgilAnalyticsRow | undefined,
  ): MercadoPublicoCompraAgilAnalytics {
    const calculatedAt =
      row?.calculated_at instanceof Date
        ? row.calculated_at
        : typeof row?.calculated_at === 'string'
          ? new Date(row.calculated_at)
          : new Date(0);

    return {
      summary: {
        totalFound: asNumber(row?.total_found),
        closingNext24Hours: asNumber(row?.closing_next_24_hours),
        knownAmountAvailableClp: asNullableNumber(
          row?.known_amount_available_clp,
        ),
        positiveDocumentCount: asNumber(row?.positive_document_count),
      },
      closingByDay: asJsonArray<{ date: string; count: number }>(
        row?.closing_by_day,
      ).map((bucket) => ({
        date: bucket.date,
        count: asNumber(bucket.count),
      })),
      regions: asJsonArray<{ region_name: string; count: number }>(
        row?.regions,
      ).map((bucket) => ({
        regionName: bucket.region_name,
        count: asNumber(bucket.count),
      })),
      topBuyers: asJsonArray<{
        buyer_key: string;
        buyer_name: string | null;
        count: number;
      }>(row?.top_buyers).map((bucket) => ({
        buyerKey: bucket.buyer_key,
        buyerName: bucket.buyer_name,
        count: asNumber(bucket.count),
      })),
      amountBands: asJsonArray<{ band: string; count: number }>(
        row?.amount_bands,
      ).map((bucket) => ({
        band: bucket.band,
        count: asNumber(bucket.count),
      })),
      callStages: asJsonArray<{
        call_stage: MercadoPublicoCompraAgilCallStage;
        count: number;
      }>(row?.call_stages).map((bucket) => ({
        callStage: bucket.call_stage,
        count: asNumber(bucket.count),
      })),
      documentAvailability: asJsonArray<{
        has_documents: boolean;
        count: number;
      }>(row?.document_availability).map((bucket) => ({
        hasDocuments: bucket.has_documents,
        count: asNumber(bucket.count),
      })),
      metadata: {
        filteredPopulation: asNumber(row?.filtered_population),
        calculatedAt,
        timezone: row?.timezone ?? ANALYTICS_TIMEZONE,
        completePopulation: row?.complete_population ?? true,
        coverage: {
          closingAt: asNumber(row?.closing_at_coverage),
          regionName: asNumber(row?.region_name_coverage),
          buyerIdentity: asNumber(row?.buyer_identity_coverage),
          amountAvailableClp: asNumber(row?.amount_available_clp_coverage),
          callStage: asNumber(row?.call_stage_coverage),
          documentCount: asNumber(row?.document_count_coverage),
          offersReceivedCount: asNumber(row?.offers_received_count_coverage),
        },
      },
    };
  }
}
