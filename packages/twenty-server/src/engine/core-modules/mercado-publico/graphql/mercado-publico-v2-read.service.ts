import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

export type MercadoPublicoV2OpportunityFilter = {
  search?: string;
  states?: string[];
  region?: number;
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
  closingAt: string | null;
  codigo: string;
};

export const encodeMercadoPublicoV2OpportunityCursor = (
  row: MercadoPublicoV2OpportunityRow,
): string =>
  Buffer.from(
    JSON.stringify({
      closingAt: row.closing_at?.toISOString() ?? null,
      codigo: row.codigo,
    } satisfies Cursor),
  ).toString('base64url');

const decodeCursor = (value: string): Cursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as Partial<Cursor>;

    if (
      (parsed.closingAt !== null && typeof parsed.closingAt !== 'string') ||
      typeof parsed.codigo !== 'string' ||
      parsed.codigo.length === 0
    ) {
      throw new Error('invalid cursor');
    }

    return { closingAt: parsed.closingAt ?? null, codigo: parsed.codigo };
  } catch {
    throw new BadRequestException('Mercado Publico V2 cursor is invalid');
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
    after?: string,
    first = 50,
  ): Promise<MercadoPublicoV2OpportunityConnection> {
    const requestedFirst = first ?? 50;
    const limit = Math.min(Math.max(Math.floor(requestedFirst), 1), 100);
    const { whereSql, params } = this.buildWhere(filter, after);
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
          observation_id,
          normalizer_version,
          provider_schema_fingerprint,
          availability
        FROM mp.gold_detected_process
        ${whereSql}
        ORDER BY closing_at DESC NULLS LAST, process_code ASC
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
        ? encodeMercadoPublicoV2OpportunityCursor(pageRows[0])
        : null,
      endCursor: lastRow
        ? encodeMercadoPublicoV2OpportunityCursor(lastRow)
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
    after?: string,
  ): { whereSql: string; params: unknown[] } {
    const clauses = [
      "process_type = 'compra_agil'",
      "canonical_state = 'publicada'",
    ];
    const params: unknown[] = [];

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

    if (after) {
      const cursor = decodeCursor(after);

      if (cursor.closingAt === null) {
        params.push(cursor.codigo);
        clauses.push(
          `(closing_at IS NULL AND process_code > $${params.length})`,
        );
      } else {
        params.push(cursor.closingAt, cursor.codigo);
        clauses.push(
          `(closing_at < $${params.length - 1} OR closing_at IS NULL OR (closing_at = $${params.length - 1} AND process_code > $${params.length}))`,
        );
      }
    }

    return {
      whereSql: ` WHERE ${clauses.join(' AND ')}`,
      params,
    };
  }
}
