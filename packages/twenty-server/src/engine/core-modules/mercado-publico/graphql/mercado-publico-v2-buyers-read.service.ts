import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  buildMercadoPublicoV2PopulationWhere,
  type MercadoPublicoV2OpportunityFilter,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-filter.util';

export type MercadoPublicoV2BuyerRow = {
  buyer_code: string;
  buyer_name: string | null;
  population: string;
  opportunity_count: string;
  amount_count: string;
  as_of: Date | null;
};

export type MercadoPublicoV2BuyerAggregate = {
  buyerCode: string;
  buyerName: string | null;
  opportunityCount: number;
  buyerCoverage: number;
  amountCoverage: number;
  availability: 'available' | 'partial' | 'unavailable';
  completeness: 'complete' | 'partial';
  asOf: Date | null;
};

export type MercadoPublicoV2BuyerConnection = {
  rows: Array<MercadoPublicoV2BuyerAggregate & { cursor: string }>;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export const encodeMercadoPublicoV2BuyerCursor = (
  row: MercadoPublicoV2BuyerRow,
): string =>
  Buffer.from(JSON.stringify({ buyerCode: row.buyer_code })).toString(
    'base64url',
  );

const decodeBuyerCursor = (value: string): string => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as { buyerCode?: unknown };

    if (typeof parsed.buyerCode !== 'string' || parsed.buyerCode.length === 0) {
      throw new Error('invalid buyer cursor');
    }

    return parsed.buyerCode;
  } catch {
    throw new BadRequestException('Mercado Publico V2 buyer cursor is invalid');
  }
};

const toBuyerAggregate = (
  row: MercadoPublicoV2BuyerRow,
): MercadoPublicoV2BuyerAggregate => {
  const population = Number(row.population);
  const opportunityCount = Number(row.opportunity_count);
  const amountCount = Number(row.amount_count);
  const buyerCoverage = population === 0 ? 0 : opportunityCount / population;
  const amountCoverage =
    opportunityCount === 0 ? 0 : amountCount / opportunityCount;

  return {
    buyerCode: row.buyer_code,
    buyerName: row.buyer_name,
    opportunityCount,
    buyerCoverage,
    amountCoverage,
    availability:
      buyerCoverage === 0
        ? 'unavailable'
        : buyerCoverage === 1
          ? 'available'
          : 'partial',
    completeness:
      buyerCoverage === 1 && amountCoverage === 1 ? 'complete' : 'partial',
    asOf: row.as_of,
  };
};

@Injectable()
export class MercadoPublicoV2BuyersReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listBuyers(
    filter: MercadoPublicoV2OpportunityFilter = {},
    after?: string | null,
    first = 50,
  ): Promise<MercadoPublicoV2BuyerConnection> {
    const limit = Math.min(Math.max(Math.floor(first ?? 50), 1), 100);
    const populationWhere = buildMercadoPublicoV2PopulationWhere(filter);
    const params = [...populationWhere.params];
    const afterClause = after
      ? (() => {
          const buyerCode = decodeBuyerCursor(after);
          params.push(buyerCode);

          return ` AND buyer_code > $${params.length}`;
        })()
      : '';

    const rows = await this.coreDataSource.query<MercadoPublicoV2BuyerRow[]>(
      `
        WITH filtered AS (
          SELECT
            buyer_code,
            buyer_name,
            COALESCE(amount_raw, amount::text) AS amount,
            COALESCE(observed_at, persisted_at, last_seen_at) AS as_of
          FROM mp.gold_detected_process
          ${populationWhere.whereSql}
        ), aggregates AS (
          SELECT
            buyer_code,
            MAX(buyer_name) AS buyer_name,
            (SELECT COUNT(*)::text FROM filtered) AS population,
            COUNT(*)::text AS opportunity_count,
            COUNT(amount)::text AS amount_count,
            MAX(as_of) AS as_of
          FROM filtered
          WHERE buyer_code IS NOT NULL${afterClause}
          GROUP BY buyer_code
        )
        SELECT
          buyer_code,
          buyer_name,
          population,
          opportunity_count,
          amount_count,
          as_of
        FROM aggregates
        ORDER BY buyer_code ASC
        LIMIT $${params.length + 1}
      `,
      [...params, limit + 1],
    );

    const pageRows = rows.slice(0, limit);
    const aggregateRows = pageRows.map((row) => ({
      ...toBuyerAggregate(row),
      cursor: encodeMercadoPublicoV2BuyerCursor(row),
    }));

    return {
      rows: aggregateRows,
      hasNextPage: rows.length > limit,
      startCursor: aggregateRows[0]?.cursor ?? null,
      endCursor: aggregateRows[aggregateRows.length - 1]?.cursor ?? null,
    };
  }
}
