import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

export type MercadoPublicoV2OpportunitySort =
  | 'closing_at_desc'
  | 'closing_at_asc'
  | 'published_at_desc'
  | 'published_at_asc'
  | 'amount_desc'
  | 'amount_asc';

export type MercadoPublicoV2OpportunityFilter = {
  search?: string;
  states?: string[];
  region?: number;
  buyer?: string;
  closingAtFrom?: Date;
  closingAtTo?: Date;
  documentCountMin?: number;
  documentCountMax?: number;
  llamado?: number;
  amountMin?: string;
  amountMax?: string;
  currencies?: string[];
  cohortStatus?: 'active' | 'terminal';
};

export type MercadoPublicoV2OpportunityRow = {
  codigo: string;
  title: string | null;
  canonical_state: string | null;
  buyer_name: string | null;
  region: number | null;
  published_at: Date | null;
  closing_at: Date | null;
  amount: string | null;
  currency_source: string | null;
  document_count: number | null;
  llamado: number | null;
  observation_id: string | null;
  normalizer_version: string | null;
  provider_schema_fingerprint: string | null;
  availability: string;
};

export type MercadoPublicoV2OpportunityConnection = {
  rows: MercadoPublicoV2OpportunityRow[];
  totalCount: number;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type MercadoPublicoV2AnalyticsBucket = {
  key: string | null;
  count: number;
};

export type MercadoPublicoV2Analytics = {
  population: number;
  calculatedAt: Date;
  asOf: Date | null;
  freshness: string;
  completeness: 'complete' | 'partial' | 'unavailable';
  availability: 'available' | 'partial' | 'unavailable';
  coverage: {
    closingAt: number;
    state: number;
    region: number;
    buyer: number;
    amount: number;
    currency: number;
    documentCount: number;
    llamado: number;
  };
  stateBuckets: MercadoPublicoV2AnalyticsBucket[];
  regionBuckets: MercadoPublicoV2AnalyticsBucket[];
  currencyBuckets: MercadoPublicoV2AnalyticsBucket[];
  closingDateBuckets: MercadoPublicoV2AnalyticsBucket[];
  documentBuckets: MercadoPublicoV2AnalyticsBucket[];
  llamadoBuckets: MercadoPublicoV2AnalyticsBucket[];
};

type Cursor = {
  sort: MercadoPublicoV2OpportunitySort;
  value: string | null;
  codigo: string;
};

const SORT_COLUMNS: Record<MercadoPublicoV2OpportunitySort, string> = {
  closing_at_desc: 'closing_at',
  closing_at_asc: 'closing_at',
  published_at_desc: 'published_at',
  published_at_asc: 'published_at',
  amount_desc: 'amount',
  amount_asc: 'amount',
};

const SORT_DIRECTIONS: Record<MercadoPublicoV2OpportunitySort, 'ASC' | 'DESC'> =
  {
    closing_at_desc: 'DESC',
    closing_at_asc: 'ASC',
    published_at_desc: 'DESC',
    published_at_asc: 'ASC',
    amount_desc: 'DESC',
    amount_asc: 'ASC',
  };

const isTimestampSort = (sort: MercadoPublicoV2OpportunitySort): boolean =>
  sort === 'closing_at_desc' ||
  sort === 'closing_at_asc' ||
  sort === 'published_at_desc' ||
  sort === 'published_at_asc';

const getSortKeyValue = (
  row: MercadoPublicoV2OpportunityRow,
  sort: MercadoPublicoV2OpportunitySort,
): string | null => {
  if (sort === 'amount_desc' || sort === 'amount_asc') {
    return row.amount;
  }

  const date = sort.startsWith('closing_at')
    ? row.closing_at
    : row.published_at;

  return date?.toISOString() ?? null;
};

export const encodeMercadoPublicoV2OpportunityCursor = (
  row: MercadoPublicoV2OpportunityRow,
  sort: MercadoPublicoV2OpportunitySort,
): string =>
  Buffer.from(
    JSON.stringify({
      sort,
      value: getSortKeyValue(row, sort),
      codigo: row.codigo,
    } satisfies Cursor),
  ).toString('base64url');

const decodeCursor = (
  value: string,
  requestedSort: MercadoPublicoV2OpportunitySort,
): Cursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as Partial<Cursor>;

    const invalid =
      !SORT_COLUMNS[parsed.sort as MercadoPublicoV2OpportunitySort] ||
      parsed.sort !== requestedSort ||
      typeof parsed.codigo !== 'string' ||
      parsed.codigo.length === 0 ||
      (parsed.value !== null && typeof parsed.value !== 'string');

    if (invalid) {
      throw new Error('invalid cursor');
    }

    if (parsed.value !== null) {
      const cursorValue = parsed.value as string;

      const valueIsValid = isTimestampSort(
        parsed.sort as MercadoPublicoV2OpportunitySort,
      )
        ? !Number.isNaN(new Date(cursorValue).getTime())
        : Number.isFinite(Number(cursorValue));

      if (!valueIsValid) {
        throw new Error('invalid cursor value');
      }
    }

    return {
      sort: parsed.sort as MercadoPublicoV2OpportunitySort,
      value: parsed.value ?? null,
      codigo: parsed.codigo as string,
    };
  } catch {
    throw new BadRequestException('Mercado Publico V2 cursor is invalid');
  }
};

const validateFilterRanges = (
  filter: MercadoPublicoV2OpportunityFilter,
): void => {
  for (const field of ['closingAtFrom', 'closingAtTo'] as const) {
    const value = filter[field];

    if (value !== undefined && Number.isNaN(value.getTime())) {
      throw new BadRequestException(
        `Mercado Publico V2 filter: ${field} must be a valid date`,
      );
    }
  }

  if (
    filter.closingAtFrom !== undefined &&
    filter.closingAtTo !== undefined &&
    filter.closingAtFrom > filter.closingAtTo
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: closingAtFrom must not be after closingAtTo',
    );
  }

  for (const field of ['documentCountMin', 'documentCountMax'] as const) {
    const value = filter[field];

    if (value !== undefined && value < 0) {
      throw new BadRequestException(
        `Mercado Publico V2 filter: ${field} must not be negative`,
      );
    }
  }

  if (
    filter.documentCountMin !== undefined &&
    filter.documentCountMax !== undefined &&
    filter.documentCountMin > filter.documentCountMax
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: documentCountMin must not exceed documentCountMax',
    );
  }

  for (const field of ['amountMin', 'amountMax'] as const) {
    const value = filter[field];

    if (
      value !== undefined &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    ) {
      throw new BadRequestException(
        `Mercado Publico V2 filter: ${field} must be a decimal string`,
      );
    }
  }

  if (
    filter.amountMin !== undefined &&
    filter.amountMax !== undefined &&
    Number(filter.amountMin) > Number(filter.amountMax)
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: amountMin must not exceed amountMax',
    );
  }

  if (filter.llamado !== undefined && filter.llamado < 0) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: llamado must not be negative',
    );
  }

  if (
    filter.cohortStatus !== undefined &&
    filter.cohortStatus !== 'active' &&
    filter.cohortStatus !== 'terminal'
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: cohortStatus must be "active" or "terminal"',
    );
  }
};

@Injectable()
export class MercadoPublicoV2ReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listOpportunities(
    filter: MercadoPublicoV2OpportunityFilter = {},
    after?: string | null,
    first = 100,
    sort: MercadoPublicoV2OpportunitySort = 'closing_at_desc',
  ): Promise<MercadoPublicoV2OpportunityConnection> {
    validateFilterRanges(filter);
    const requestedFirst = first ?? 100;
    const limit = Math.min(Math.max(Math.floor(requestedFirst), 1), 100);
    const { whereSql, params } = this.buildWhere(filter, after, sort);
    const { whereSql: countWhereSql, params: countParams } =
      this.buildWhere(filter);
    const countRows = await this.coreDataSource.query<{ total: string }[]>(
      `SELECT count(*)::bigint AS total FROM mp.gold_detected_process${countWhereSql}`,
      countParams,
    );
    const rows = await this.coreDataSource.query<
      MercadoPublicoV2OpportunityRow[]
    >(
      `
        SELECT
          process_code AS codigo,
          title,
          canonical_state,
          buyer_name,
          region,
          published_at,
          closing_at,
          COALESCE(amount_raw, amount::text) AS amount,
          currency_source,
          document_count,
          llamado,
          observation_id,
          normalizer_version,
          provider_schema_fingerprint,
          availability
        FROM mp.gold_detected_process
        ${whereSql}
        ORDER BY mp.gold_detected_process.${SORT_COLUMNS[sort]} ${SORT_DIRECTIONS[sort]} NULLS LAST, mp.gold_detected_process.process_code ASC
        LIMIT $${params.length + 1}
      `,
      [...params, limit + 1],
    );

    const pageRows = rows.slice(0, limit);
    const lastRow = pageRows[pageRows.length - 1];

    return {
      rows: pageRows,
      totalCount: Number(countRows[0]?.total ?? 0),
      hasNextPage: rows.length > limit,
      startCursor: pageRows[0]
        ? encodeMercadoPublicoV2OpportunityCursor(pageRows[0], sort)
        : null,
      endCursor: lastRow
        ? encodeMercadoPublicoV2OpportunityCursor(lastRow, sort)
        : null,
    };
  }

  async getAnalytics(
    filter: MercadoPublicoV2OpportunityFilter = {},
  ): Promise<MercadoPublicoV2Analytics> {
    validateFilterRanges(filter);
    const { whereSql, params } = this.buildWhere(filter);
    const rows = await this.coreDataSource.query<
      MercadoPublicoV2AnalyticsRow[]
    >(
      `
        WITH filtered AS (
          SELECT
            canonical_state,
            region,
            buyer_name,
            amount,
            currency_source,
            document_count,
            llamado,
            closing_at,
            availability,
            COALESCE(observed_at, persisted_at, last_seen_at) AS as_of
          FROM mp.gold_detected_process
          ${whereSql}
        )
        SELECT
          (SELECT count(*)::text FROM filtered) AS population,
          statement_timestamp() AS calculated_at,
          (SELECT MAX(as_of) FROM filtered) AS as_of,
          (
            SELECT CASE
              WHEN count(*) FILTER (WHERE freshness = 'stale') > 0 THEN 'stale'
              WHEN count(*) FILTER (WHERE freshness = 'degraded') > 0 THEN 'degraded'
              WHEN count(*) FILTER (WHERE freshness = 'healthy') > 0 THEN 'healthy'
              ELSE 'unknown'
            END
            FROM mp.gold_pipeline_health
            WHERE job_name ILIKE '%compra-agil%'
          ) AS freshness,
          CASE
            WHEN (SELECT count(*) FROM filtered) = 0 THEN 'complete'
            WHEN (
              SELECT count(*) FILTER (
                WHERE availability = 'available'
                  AND closing_at IS NOT NULL
                  AND canonical_state IS NOT NULL
                  AND region IS NOT NULL
                  AND buyer_name IS NOT NULL
                  AND amount IS NOT NULL
                  AND currency_source IS NOT NULL
                  AND document_count IS NOT NULL
                  AND llamado IS NOT NULL
              )
              FROM filtered
            ) = (SELECT count(*) FROM filtered) THEN 'complete'
            WHEN (
              SELECT count(*) FILTER (
                WHERE availability IN ('unavailable', 'not_applicable')
              )
              FROM filtered
            ) = (SELECT count(*) FROM filtered) THEN 'unavailable'
            ELSE 'partial'
          END AS completeness,
          CASE
            WHEN (SELECT count(*) FROM filtered) = 0 THEN 'available'
            WHEN (
              SELECT count(*) FILTER (
                WHERE availability IN ('unavailable', 'not_applicable')
              )
              FROM filtered
            ) = (SELECT count(*) FROM filtered) THEN 'unavailable'
            WHEN (
              SELECT count(*) FILTER (WHERE availability <> 'available')
              FROM filtered
            ) > 0 THEN 'partial'
            ELSE 'available'
          END AS availability,
          (SELECT (count(*) FILTER (WHERE closing_at IS NOT NULL))::text FROM filtered) AS known_closing_at,
          (SELECT (count(*) FILTER (WHERE canonical_state IS NOT NULL))::text FROM filtered) AS known_state,
          (SELECT (count(*) FILTER (WHERE region IS NOT NULL))::text FROM filtered) AS known_region,
          (SELECT (count(*) FILTER (WHERE buyer_name IS NOT NULL))::text FROM filtered) AS known_buyer,
          (SELECT (count(*) FILTER (WHERE amount IS NOT NULL))::text FROM filtered) AS known_amount,
          (SELECT (count(*) FILTER (WHERE currency_source IS NOT NULL))::text FROM filtered) AS known_currency,
          (SELECT (count(*) FILTER (WHERE document_count IS NOT NULL))::text FROM filtered) AS known_document_count,
          (SELECT (count(*) FILTER (WHERE llamado IS NOT NULL))::text FROM filtered) AS known_llamado,
          (
            SELECT COALESCE(
              jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY count DESC, key ASC NULLS LAST),
              '[]'::jsonb
            )
            FROM (
              SELECT canonical_state AS key, count(*)::integer AS count
              FROM filtered
              GROUP BY canonical_state
            ) buckets
          ) AS state_buckets,
          (
            SELECT COALESCE(
              jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY count DESC, key ASC NULLS LAST),
              '[]'::jsonb
            )
            FROM (
              SELECT region::text AS key, count(*)::integer AS count
              FROM filtered
              GROUP BY region
            ) buckets
          ) AS region_buckets,
          (
            SELECT COALESCE(
              jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY count DESC, key ASC NULLS LAST),
              '[]'::jsonb
            )
            FROM (
              SELECT currency_source AS key, count(*)::integer AS count
              FROM filtered
              GROUP BY currency_source
            ) buckets
          ) AS currency_buckets,
          (
            SELECT COALESCE(
              jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY key ASC NULLS LAST),
              '[]'::jsonb
            )
            FROM (
              SELECT
                to_char(closing_at AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD') AS key,
                count(*)::integer AS count
              FROM filtered
              GROUP BY to_char(closing_at AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD')
            ) buckets
          ) AS closing_date_buckets,
          (
            SELECT COALESCE(
              jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY key ASC NULLS LAST),
              '[]'::jsonb
            )
            FROM (
              SELECT
                CASE
                  WHEN document_count IS NULL THEN NULL
                  WHEN document_count = 0 THEN 'zero'
                  ELSE 'positive'
                END AS key,
                count(*)::integer AS count
              FROM filtered
              GROUP BY
                CASE
                  WHEN document_count IS NULL THEN NULL
                  WHEN document_count = 0 THEN 'zero'
                  ELSE 'positive'
                END
            ) buckets
          ) AS document_buckets,
          (
            SELECT COALESCE(
              jsonb_agg(jsonb_build_object('key', key, 'count', count) ORDER BY key ASC NULLS LAST),
              '[]'::jsonb
            )
            FROM (
              SELECT llamado::text AS key, count(*)::integer AS count
              FROM filtered
              GROUP BY llamado
            ) buckets
          ) AS llamado_buckets
      `,
      params,
    );
    const row = rows[0];

    if (!row) {
      throw new Error('Mercado Publico V2 analytics returned no result');
    }

    return {
      population: Number(row.population),
      calculatedAt: row.calculated_at,
      asOf: row.as_of,
      freshness: row.freshness ?? 'unknown',
      completeness: row.completeness,
      availability: row.availability,
      coverage: {
        closingAt: Number(row.known_closing_at),
        state: Number(row.known_state),
        region: Number(row.known_region),
        buyer: Number(row.known_buyer),
        amount: Number(row.known_amount),
        currency: Number(row.known_currency),
        documentCount: Number(row.known_document_count),
        llamado: Number(row.known_llamado),
      },
      stateBuckets: row.state_buckets,
      regionBuckets: row.region_buckets,
      currencyBuckets: row.currency_buckets,
      closingDateBuckets: row.closing_date_buckets,
      documentBuckets: row.document_buckets,
      llamadoBuckets: row.llamado_buckets,
    };
  }

  async getOpportunity(
    codigo: string,
  ): Promise<MercadoPublicoV2OpportunityRow | null> {
    const rows = await this.coreDataSource.query<
      MercadoPublicoV2OpportunityRow[]
    >(
      `
        SELECT
          process_code AS codigo,
          title,
          canonical_state,
          buyer_name,
          region,
          published_at,
          closing_at,
          COALESCE(amount_raw, amount::text) AS amount,
          currency_source,
          document_count,
          llamado,
          observation_id,
          normalizer_version,
          provider_schema_fingerprint,
          availability
        FROM mp.gold_detected_process
        WHERE process_type = 'compra_agil' AND process_code = $1
      `,
      [codigo],
    );

    return rows[0] ?? null;
  }

  private buildWhere(
    filter: MercadoPublicoV2OpportunityFilter,
    after?: string | null,
    sort: MercadoPublicoV2OpportunitySort = 'closing_at_desc',
  ): { whereSql: string; params: unknown[] } {
    const cohortClause =
      filter.cohortStatus !== undefined
        ? `process_code IN (
            SELECT codigo
            FROM mp.v2_cohort
            WHERE source = 'api-v2-compra-agil'
              AND scope = 'global'
              AND status = $1
          )`
        : `process_code IN (
            SELECT codigo
            FROM mp.v2_cohort
            WHERE source = 'api-v2-compra-agil'
              AND scope = 'global'
              AND status = 'active'
          )`;
    const clauses = ["process_type = 'compra_agil'", cohortClause];
    const params: unknown[] = [];

    if (filter.cohortStatus !== undefined) {
      params.push(filter.cohortStatus);
    }

    if (filter.search?.trim()) {
      params.push(`%${filter.search.trim()}%`);
      clauses.push(
        `(process_code ILIKE $${params.length} OR title ILIKE $${params.length} OR buyer_name ILIKE $${params.length})`,
      );
    }

    if (filter.states && filter.states.length > 0) {
      params.push(filter.states);
      clauses.push(`canonical_state = ANY($${params.length}::text[])`);
    }

    if (filter.region !== undefined) {
      params.push(filter.region);
      clauses.push(`region = $${params.length}`);
    }

    if (filter.buyer?.trim()) {
      params.push(`%${filter.buyer.trim()}%`);
      clauses.push(
        `(buyer_name ILIKE $${params.length} OR buyer_code ILIKE $${params.length})`,
      );
    }

    if (filter.closingAtFrom !== undefined) {
      params.push(filter.closingAtFrom);
      clauses.push(`closing_at >= $${params.length}`);
    }

    if (filter.closingAtTo !== undefined) {
      params.push(filter.closingAtTo);
      clauses.push(`closing_at <= $${params.length}`);
    }

    if (filter.documentCountMin !== undefined) {
      params.push(filter.documentCountMin);
      clauses.push(`document_count >= $${params.length}`);
    }

    if (filter.documentCountMax !== undefined) {
      params.push(filter.documentCountMax);
      clauses.push(`document_count <= $${params.length}`);
    }

    if (filter.llamado !== undefined) {
      params.push(filter.llamado);
      clauses.push(`llamado = $${params.length}`);
    }

    if (filter.amountMin !== undefined) {
      params.push(filter.amountMin);
      clauses.push(`amount >= $${params.length}::numeric`);
    }

    if (filter.amountMax !== undefined) {
      params.push(filter.amountMax);
      clauses.push(`amount <= $${params.length}::numeric`);
    }

    if (filter.currencies && filter.currencies.length > 0) {
      params.push(filter.currencies);
      clauses.push(`currency_source = ANY($${params.length}::text[])`);
    }

    if (after) {
      const cursor = decodeCursor(after, sort);
      const column = SORT_COLUMNS[cursor.sort];
      const direction = SORT_DIRECTIONS[cursor.sort];
      const isTimestamp = isTimestampSort(cursor.sort);

      if (cursor.value === null) {
        params.push(cursor.codigo);
        clauses.push(
          `(${column} IS NULL AND process_code > $${params.length})`,
        );
      } else {
        params.push(cursor.value, cursor.codigo);
        const operand = isTimestamp
          ? `$${params.length - 1}`
          : `$${params.length - 1}::numeric`;

        if (direction === 'ASC') {
          clauses.push(
            `(${column} > ${operand} OR ${column} IS NULL OR (${column} = ${operand} AND process_code > $${params.length}))`,
          );
        } else {
          clauses.push(
            `(${column} < ${operand} OR ${column} IS NULL OR (${column} = ${operand} AND process_code > $${params.length}))`,
          );
        }
      }
    }

    return {
      whereSql: ` WHERE ${clauses.join(' AND ')}`,
      params,
    };
  }
}

type MercadoPublicoV2AnalyticsRow = {
  population: string;
  calculated_at: Date;
  as_of: Date | null;
  freshness: string | null;
  completeness: 'complete' | 'partial' | 'unavailable';
  availability: 'available' | 'partial' | 'unavailable';
  known_closing_at: string;
  known_state: string;
  known_region: string;
  known_buyer: string;
  known_amount: string;
  known_currency: string;
  known_document_count: string;
  known_llamado: string;
  state_buckets: MercadoPublicoV2AnalyticsBucket[];
  region_buckets: MercadoPublicoV2AnalyticsBucket[];
  currency_buckets: MercadoPublicoV2AnalyticsBucket[];
  closing_date_buckets: MercadoPublicoV2AnalyticsBucket[];
  document_buckets: MercadoPublicoV2AnalyticsBucket[];
  llamado_buckets: MercadoPublicoV2AnalyticsBucket[];
};
