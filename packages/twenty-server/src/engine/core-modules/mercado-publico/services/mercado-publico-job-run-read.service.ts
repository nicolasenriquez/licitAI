import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  MERCADO_PUBLICO_JOB_RUN_STATUSES,
  type MercadoPublicoJobRunStatus,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import {
  type MercadoPublicoJobRunItem,
  type MercadoPublicoListJobRunsFilters,
  type MercadoPublicoListJobRunsResult,
} from 'src/engine/core-modules/mercado-publico/types/job-run-read.types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type StgJobRunRow = {
  id: string;
  job_name: string;
  job_run_id: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  records_fetched: number | null;
  records_staged: number | null;
  records_canonicalized: number | null;
  records_failed: number | null;
  error_summary: string | null;
  raw_csv_file_id: string | null;
  created_at: Date;
};

const JOB_RUN_STATUS_SET = new Set<string>(MERCADO_PUBLICO_JOB_RUN_STATUSES);

@Injectable()
export class MercadoPublicoJobRunReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listJobRuns(
    filters: MercadoPublicoListJobRunsFilters,
  ): Promise<MercadoPublicoListJobRunsResult> {
    const normalized = this.normalizeFilters(filters);
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (normalized.statuses.length > 0) {
      params.push(normalized.statuses);
      clauses.push(`status = ANY($${params.length}::text[])`);
    }

    if (normalized.jobName !== null) {
      params.push(normalized.jobName);
      clauses.push(`job_name = $${params.length}`);
    }

    if (normalized.startedFrom !== null) {
      params.push(normalized.startedFrom);
      clauses.push(`started_at >= $${params.length}`);
    }

    if (normalized.startedTo !== null) {
      params.push(normalized.startedTo);
      clauses.push(`started_at <= $${params.length}`);
    }

    const whereSql =
      clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
    const limitParameter = params.length + 1;
    const offsetParameter = params.length + 2;
    const sql = `
      SELECT
        id,
        job_name,
        job_run_id,
        status,
        started_at,
        finished_at,
        records_fetched,
        records_staged,
        records_canonicalized,
        records_failed,
        error_summary,
        raw_csv_file_id,
        created_at
      FROM mp.stg_job_run
      ${whereSql}
      ORDER BY started_at DESC, id DESC
      LIMIT $${limitParameter} OFFSET $${offsetParameter}
    `;

    const rows = await this.coreDataSource.query<StgJobRunRow[]>(sql, [
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

  private normalizeFilters(filters: MercadoPublicoListJobRunsFilters) {
    const statuses = (filters.statuses ?? []).filter((status) =>
      JOB_RUN_STATUS_SET.has(status),
    );
    const jobName = this.normalizeString(filters.jobName);

    return {
      statuses,
      jobName,
      startedFrom: filters.startedFrom ?? null,
      startedTo: filters.startedTo ?? null,
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

  private toItem(row: StgJobRunRow): MercadoPublicoJobRunItem {
    return {
      id: row.id,
      jobName: row.job_name,
      jobRunId: row.job_run_id,
      status: row.status as MercadoPublicoJobRunStatus,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      recordsFetched: row.records_fetched,
      recordsStaged: row.records_staged,
      recordsCanonicalized: row.records_canonicalized,
      recordsFailed: row.records_failed,
      errorSummary: row.error_summary,
      rawCsvFileId: row.raw_csv_file_id ?? null,
      createdAt: row.created_at,
    };
  }
}
