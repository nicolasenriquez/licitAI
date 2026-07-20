import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  type MercadoPublicoApiCallLogItem,
  type MercadoPublicoListApiCallLogsFilters,
  type MercadoPublicoListApiCallLogsResult,
} from 'src/engine/core-modules/mercado-publico/types/api-call-log-read.types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type RawApiPayloadRow = {
  id: string;
  source: string;
  endpoint: string;
  request_params: unknown;
  http_status: number;
  fetched_at: Date;
  records_fetched: number | null;
  error_summary: string | null;
  ingestion_job_id: string | null;
};

@Injectable()
export class MercadoPublicoApiCallLogReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listApiCallLogs(
    filters: MercadoPublicoListApiCallLogsFilters,
  ): Promise<MercadoPublicoListApiCallLogsResult> {
    const normalized = this.normalizeFilters(filters);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (normalized.source !== null) {
      params.push(normalized.source);
      clauses.push(`source = $${params.length}`);
    }

    if (normalized.endpoint !== null) {
      params.push(normalized.endpoint);
      clauses.push(`endpoint = $${params.length}`);
    }

    if (normalized.httpStatus !== null) {
      params.push(normalized.httpStatus);
      clauses.push(`http_status = $${params.length}`);
    }

    const whereSql =
      clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
    const limitParameter = params.length + 1;
    const offsetParameter = params.length + 2;
    const sql = `
      SELECT
        id,
        source,
        endpoint,
        request_params,
        http_status,
        fetched_at,
        records_fetched,
        error_summary,
        ingestion_job_id
      FROM mp.raw_api_payload
      ${whereSql}
      ORDER BY fetched_at DESC, id DESC
      LIMIT $${limitParameter} OFFSET $${offsetParameter}
    `;

    const rows = await this.coreDataSource.query<RawApiPayloadRow[]>(sql, [
      ...params,
      normalized.limit + 1,
      normalized.offset,
    ]);
    const hasMore = rows.length > normalized.limit;

    return {
      items: rows.slice(0, normalized.limit).map((row) => this.toItem(row)),
      hasMore,
    };
  }

  private normalizeFilters(filters: MercadoPublicoListApiCallLogsFilters) {
    return {
      source: this.normalizeString(filters.source),
      endpoint: this.normalizeString(filters.endpoint),
      httpStatus:
        filters.httpStatus !== undefined && Number.isFinite(filters.httpStatus)
          ? Math.floor(filters.httpStatus)
          : null,
      limit: this.normalizeLimit(filters.limit),
      offset: this.normalizeOffset(filters.offset),
    };
  }

  private normalizeString(value: string | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeLimit(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value) || value < 1) {
      return DEFAULT_LIMIT;
    }

    return Math.min(Math.floor(value), MAX_LIMIT);
  }

  private normalizeOffset(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value) || value < 0) {
      return 0;
    }

    return Math.floor(value);
  }

  private toItem(row: RawApiPayloadRow): MercadoPublicoApiCallLogItem {
    return {
      id: row.id,
      source: row.source,
      endpoint: row.endpoint,
      requestParams: row.request_params ?? null,
      httpStatus: row.http_status,
      fetchedAt: row.fetched_at,
      recordsFetched: row.records_fetched,
      errorSummary: row.error_summary,
      ingestionJobId: row.ingestion_job_id,
    };
  }
}
