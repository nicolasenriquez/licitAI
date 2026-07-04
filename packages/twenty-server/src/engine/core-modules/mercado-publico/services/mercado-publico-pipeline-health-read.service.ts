import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_STATUSES,
  MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_WINDOW_DAYS,
} from 'src/engine/core-modules/mercado-publico/constants/pipeline-health-read.constants';
import { MERCADO_PUBLICO_SUPPORTED_JOB_NAMES } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import {
  type MercadoPublicoPipelineHealth,
  type MercadoPublicoPipelineHealthJobEntry,
} from 'src/engine/core-modules/mercado-publico/types/pipeline-health-read.types';

type StgJobRunLatestRow = {
  job_name: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
};

type StgJobRunAggregateRow = {
  job_name: string;
  last_success_at: Date | null;
  last_failure_at: Date | null;
  failure_count_7d: string;
};

const FAILURE_STATUS_PLACEHOLDERS =
  MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_STATUSES.map(
    (_, i) => `$${i + 1}`,
  ).join(', ');

@Injectable()
export class MercadoPublicoPipelineHealthReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async getPipelineHealth(): Promise<MercadoPublicoPipelineHealth> {
    const latestSql = `
      SELECT DISTINCT ON (job_name)
        job_name,
        status,
        started_at,
        finished_at
      FROM mp.stg_job_run
      ORDER BY job_name, started_at DESC
    `;

    const aggregateSql = `
      SELECT
        job_name,
        MAX(finished_at) FILTER (WHERE status = 'success') AS last_success_at,
        MAX(finished_at) FILTER (WHERE status IN (${FAILURE_STATUS_PLACEHOLDERS})) AS last_failure_at,
        COUNT(*) FILTER (
          WHERE status IN (${FAILURE_STATUS_PLACEHOLDERS})
          AND finished_at >= now() - interval '${MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_WINDOW_DAYS} days'
        )::bigint AS failure_count_7d
      FROM mp.stg_job_run
      GROUP BY job_name
    `;

    const [latestRows, aggregateRows] = await Promise.all([
      this.coreDataSource.query<StgJobRunLatestRow[]>(latestSql),
      this.coreDataSource.query<StgJobRunAggregateRow[]>(aggregateSql, [
        ...MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_STATUSES,
      ]),
    ]);

    const latestByJob = new Map(latestRows.map((row) => [row.job_name, row]));
    const aggregateByJob = new Map(
      aggregateRows.map((row) => [row.job_name, row]),
    );

    const nowMs = Date.now();

    const jobs = MERCADO_PUBLICO_SUPPORTED_JOB_NAMES.map(
      (jobName): MercadoPublicoPipelineHealthJobEntry => {
        const latest = latestByJob.get(jobName) ?? null;
        const aggregate = aggregateByJob.get(jobName) ?? null;

        const lastSuccessAt = aggregate?.last_success_at ?? null;
        const lagSinceLastSuccessMs =
          lastSuccessAt instanceof Date
            ? nowMs - lastSuccessAt.getTime()
            : null;

        return {
          jobName,
          latestStatus: latest?.status ?? null,
          lastSuccessAt,
          lastFailureAt: aggregate?.last_failure_at ?? null,
          lagSinceLastSuccessMs,
          failureCount: Number(aggregate?.failure_count_7d ?? 0),
          freshness: null,
          expectedCadenceMs: null,
        };
      },
    );

    return {
      jobs,
      generatedAt: new Date(nowMs),
    };
  }
}
