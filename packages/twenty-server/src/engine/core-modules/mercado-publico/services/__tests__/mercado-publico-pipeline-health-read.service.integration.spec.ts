import { type DataSource } from 'typeorm';

import { MercadoPublicoPipelineHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-pipeline-health-read.service';

type StgJobRunRow = {
  job_name: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
};

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

class StgJobRunStore {
  private rows: StgJobRunRow[] = [];

  register(rows: StgJobRunRow[]): void {
    this.rows = [...rows];
  }

  query<T>(sql: string, params: unknown[]): T[] {
    if (sql.includes('DISTINCT ON')) {
      return this.latestPerJob() as T[];
    }

    if (sql.includes('GROUP BY')) {
      return this.aggregatePerJob(params) as T[];
    }

    throw new Error(`Unrecognized query: ${sql.substring(0, 80)}`);
  }

  private latestPerJob(): StgJobRunLatestRow[] {
    const sorted = [...this.rows].sort(
      (a, b) => b.started_at.getTime() - a.started_at.getTime(),
    );
    const seen = new Set<string>();

    return sorted
      .filter((row) => {
        if (seen.has(row.job_name)) {
          return false;
        }

        seen.add(row.job_name);

        return true;
      })
      .map((row) => ({
        job_name: row.job_name,
        status: row.status,
        started_at: row.started_at,
        finished_at: row.finished_at,
      }));
  }

  private aggregatePerJob(params: unknown[]): StgJobRunAggregateRow[] {
    const failureStatuses = params as string[];
    const nowMs = Date.now();
    const cutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;

    const groups = new Map<string, StgJobRunRow[]>();

    for (const row of this.rows) {
      const group = groups.get(row.job_name);

      if (group) {
        group.push(row);
      } else {
        groups.set(row.job_name, [row]);
      }
    }

    return Array.from(groups.entries()).map(([jobName, groupRows]) => {
      const successRows = groupRows.filter(
        (r) => r.status === 'success' && r.finished_at !== null,
      );
      const recentFailureRows = groupRows.filter(
        (r) =>
          failureStatuses.includes(r.status) &&
          r.finished_at !== null &&
          r.finished_at.getTime() >= cutoffMs,
      );
      const allFailureRows = groupRows.filter(
        (r) => failureStatuses.includes(r.status) && r.finished_at !== null,
      );

      const lastSuccessAt =
        successRows.length > 0
          ? successRows.reduce((max, r) =>
              r.finished_at!.getTime() > max.finished_at!.getTime() ? r : max,
            ).finished_at
          : null;

      const lastFailureAt =
        allFailureRows.length > 0
          ? allFailureRows.reduce((max, r) =>
              r.finished_at!.getTime() > max.finished_at!.getTime() ? r : max,
            ).finished_at
          : null;

      return {
        job_name: jobName,
        last_success_at: lastSuccessAt,
        last_failure_at: lastFailureAt,
        failure_count_7d: String(recentFailureRows.length),
      };
    });
  }
}

describe('MercadoPublicoPipelineHealthReadService (integration-shaped)', () => {
  const store = new StgJobRunStore();
  const buildDataSource = () =>
    ({
      query: jest.fn(async (sql: string, params: unknown[]) =>
        store.query(sql, params ?? []),
      ),
    }) as unknown as jest.Mocked<DataSource>;

  let service: MercadoPublicoPipelineHealthReadService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    store.register([]);
    mockDataSource = buildDataSource();
    service = new MercadoPublicoPipelineHealthReadService(mockDataSource);
  });

  it('aggregates per-job status with mixed runs across multiple jobs', async () => {
    const now = new Date('2026-07-04T12:00:00.000Z');
    const recent = new Date('2026-07-04T10:00:00.000Z');
    const older = new Date('2026-07-04T08:00:00.000Z');

    store.register([
      {
        job_name: 'api-v1-oc-by-date',
        status: 'success',
        started_at: older,
        finished_at: older,
      },
      {
        job_name: 'api-v1-oc-by-date',
        status: 'failed',
        started_at: recent,
        finished_at: recent,
      },
      {
        job_name: 'api-v1-licitaciones-by-date',
        status: 'success',
        started_at: recent,
        finished_at: recent,
      },
      {
        job_name: 'csv-canonical-refresh',
        status: 'retryable_failed',
        started_at: now,
        finished_at: now,
      },
    ]);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    try {
      const result = await service.getPipelineHealth();

      const ocEntry = result.jobs.find(
        (j) => j.jobName === 'api-v1-oc-by-date',
      );
      expect(ocEntry).toBeDefined();
      expect(ocEntry?.latestStatus).toBe('failed');
      expect(ocEntry?.lastSuccessAt).toEqual(older);
      expect(ocEntry?.lastFailureAt).toEqual(recent);
      expect(ocEntry?.failureCount).toBe(1);

      const licEntry = result.jobs.find(
        (j) => j.jobName === 'api-v1-licitaciones-by-date',
      );
      expect(licEntry?.latestStatus).toBe('success');
      expect(licEntry?.failureCount).toBe(0);

      const csvEntry = result.jobs.find(
        (j) => j.jobName === 'csv-canonical-refresh',
      );
      expect(csvEntry?.latestStatus).toBe('retryable_failed');
      expect(csvEntry?.failureCount).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('excludes failures older than 7 days from failure count', async () => {
    const now = new Date('2026-07-04T12:00:00.000Z');
    const oldFailure = new Date('2026-06-20T12:00:00.000Z');
    const recentFailure = new Date('2026-07-03T10:00:00.000Z');

    store.register([
      {
        job_name: 'api-v1-oc-by-date',
        status: 'failed',
        started_at: oldFailure,
        finished_at: oldFailure,
      },
      {
        job_name: 'api-v1-oc-by-date',
        status: 'failed',
        started_at: recentFailure,
        finished_at: recentFailure,
      },
      {
        job_name: 'api-v1-oc-by-date',
        status: 'success',
        started_at: recentFailure,
        finished_at: recentFailure,
      },
    ]);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    try {
      const result = await service.getPipelineHealth();

      const entry = result.jobs.find(
        (j) => j.jobName === 'api-v1-oc-by-date',
      );
      expect(entry?.failureCount).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('reports lagSinceLastSuccessMs for each job', async () => {
    const now = new Date('2026-07-04T12:00:00.000Z');
    const olderSuccess = new Date('2026-07-04T10:00:00.000Z');
    const recentSuccess = new Date('2026-07-04T11:00:00.000Z');

    store.register([
      {
        job_name: 'api-v1-oc-by-date',
        status: 'success',
        started_at: olderSuccess,
        finished_at: olderSuccess,
      },
      {
        job_name: 'api-v1-licitaciones-by-date',
        status: 'success',
        started_at: recentSuccess,
        finished_at: recentSuccess,
      },
    ]);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    try {
      const result = await service.getPipelineHealth();

      const ocEntry = result.jobs.find(
        (j) => j.jobName === 'api-v1-oc-by-date',
      );
      expect(ocEntry?.lagSinceLastSuccessMs).toBe(7_200_000);

      const licEntry = result.jobs.find(
        (j) => j.jobName === 'api-v1-licitaciones-by-date',
      );
      expect(licEntry?.lagSinceLastSuccessMs).toBe(3_600_000);
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns null entry for jobs with zero runs without throwing', async () => {
    store.register([
      {
        job_name: 'api-v1-oc-by-date',
        status: 'success',
        started_at: new Date(),
        finished_at: new Date(),
      },
    ]);

    const result = await service.getPipelineHealth();

    const licEntry = result.jobs.find(
      (j) => j.jobName === 'api-v1-licitaciones-by-date',
    );
    expect(licEntry).toBeDefined();
    expect(licEntry?.latestStatus).toBeNull();
    expect(licEntry?.lastSuccessAt).toBeNull();
    expect(licEntry?.failureCount).toBe(0);
  });

  it('handles a single run per job with no freshness signal gracefully', async () => {
    store.register([
      {
        job_name: 'api-v1-oc-by-date',
        status: 'success',
        started_at: new Date(),
        finished_at: new Date(),
      },
      {
        job_name: 'csv-file-profile',
        status: 'param_error',
        started_at: new Date(),
        finished_at: new Date(),
      },
    ]);

    const result = await service.getPipelineHealth();

    const ocEntry = result.jobs.find(
      (j) => j.jobName === 'api-v1-oc-by-date',
    );
    expect(ocEntry?.latestStatus).toBe('success');
    expect(ocEntry?.freshness).toBeNull();

    const csvEntry = result.jobs.find(
      (j) => j.jobName === 'csv-file-profile',
    );
    expect(csvEntry?.latestStatus).toBe('param_error');
    expect(csvEntry?.freshness).toBeNull();
    expect(csvEntry?.failureCount).toBe(1);

    for (const job of result.jobs) {
      expect(job.expectedCadenceMs).toBeNull();
    }
  });
});
