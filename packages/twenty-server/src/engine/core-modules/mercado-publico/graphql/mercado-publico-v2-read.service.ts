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
          amount::text AS amount,
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
          amount::text AS amount,
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
