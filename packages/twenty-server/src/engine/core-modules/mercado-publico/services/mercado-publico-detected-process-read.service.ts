import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_LIMIT,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_PAGE,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_DIRECTION,
  MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_KEY,
  MERCADO_PUBLICO_DETECTED_PROCESS_MAX_LIMIT,
  MERCADO_PUBLICO_DETECTED_PROCESS_SORT_KEYS,
  MERCADO_PUBLICO_DETECTED_PROCESS_TYPES,
  type MercadoPublicoDetectedProcessSortKey,
} from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';
import {
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
};

const SORT_KEY_TO_COLUMN: Record<MercadoPublicoDetectedProcessSortKey, string> =
  {
    lastSeenAt: 'last_seen_at',
    publishedAt: 'published_at',
    closingAt: 'closing_at',
    processCode: 'process_code',
    canonicalState: 'canonical_state',
  };

const SORT_KEY_SET = new Set<string>(
  MERCADO_PUBLICO_DETECTED_PROCESS_SORT_KEYS,
);
const PROCESS_TYPE_SET = new Set<string>(
  MERCADO_PUBLICO_DETECTED_PROCESS_TYPES,
);

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
      publishedAt: row.published_at,
      closingAt: row.closing_at,
      sourcePriority: row.source_priority,
      reconciliationStatus: row.reconciliation_status,
      lastSeenAt: row.last_seen_at,
    };
  }
}
