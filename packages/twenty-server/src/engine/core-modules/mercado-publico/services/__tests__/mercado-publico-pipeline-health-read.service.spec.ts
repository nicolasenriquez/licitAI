import { type DataSource } from 'typeorm';

import { MercadoPublicoPipelineHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-pipeline-health-read.service';

describe('MercadoPublicoPipelineHealthReadService', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoPipelineHealthReadService(
    mockCoreDataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns one entry per supported job name with null fields when no runs exist', async () => {
    mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await service.getPipelineHealth();

    expect(result.jobs).toHaveLength(16);
    for (const job of result.jobs) {
      expect(job.latestStatus).toBeNull();
      expect(job.lastSuccessAt).toBeNull();
      expect(job.lastFailureAt).toBeNull();
      expect(job.lagSinceLastSuccessMs).toBeNull();
      expect(job.failureCount).toBe(0);
      expect(job.freshness).toBeNull();
      expect(job.expectedCadenceMs).toBeNull();
    }
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('returns latest status from most recent run per job', async () => {
    const older = new Date('2026-07-04T08:00:00.000Z');
    const newer = new Date('2026-07-04T10:00:00.000Z');

    mockQuery
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          status: 'failed',
          started_at: newer,
          finished_at: newer,
        },
      ])
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          last_success_at: older,
          last_failure_at: newer,
          failure_count_7d: '1',
        },
      ]);

    const result = await service.getPipelineHealth();

    const entry = result.jobs.find((j) => j.jobName === 'api-v1-oc-by-date');
    expect(entry).toBeDefined();
    expect(entry?.latestStatus).toBe('failed');
  });

  it('returns lastSuccessAt from aggregate query', async () => {
    const successDate = new Date('2026-07-04T09:00:00.000Z');

    mockQuery
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          status: 'success',
          started_at: successDate,
          finished_at: successDate,
        },
      ])
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          last_success_at: successDate,
          last_failure_at: null,
          failure_count_7d: '0',
        },
      ]);

    const result = await service.getPipelineHealth();

    const entry = result.jobs.find((j) => j.jobName === 'api-v1-oc-by-date');
    expect(entry?.lastSuccessAt).toEqual(successDate);
  });

  it('returns lastFailureAt from aggregate query', async () => {
    const failureDate = new Date('2026-07-04T10:00:00.000Z');
    const successDate = new Date('2026-07-04T09:00:00.000Z');

    mockQuery
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          status: 'failed',
          started_at: failureDate,
          finished_at: failureDate,
        },
      ])
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          last_success_at: successDate,
          last_failure_at: failureDate,
          failure_count_7d: '1',
        },
      ]);

    const result = await service.getPipelineHealth();

    const entry = result.jobs.find((j) => j.jobName === 'api-v1-oc-by-date');
    expect(entry?.lastFailureAt).toEqual(failureDate);
    expect(entry?.lastSuccessAt).toEqual(successDate);
    expect(entry?.failureCount).toBe(1);
  });

  it('returns lagSinceLastSuccessMs as now minus lastSuccessAt', async () => {
    const now = new Date('2026-07-04T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    try {
      const successDate = new Date('2026-07-04T10:00:00.000Z');

      mockQuery
        .mockResolvedValueOnce([
          {
            job_name: 'api-v1-oc-by-date',
            status: 'success',
            started_at: successDate,
            finished_at: successDate,
          },
        ])
        .mockResolvedValueOnce([
          {
            job_name: 'api-v1-oc-by-date',
            last_success_at: successDate,
            last_failure_at: null,
            failure_count_7d: '0',
          },
        ]);

      const result = await service.getPipelineHealth();

      const entry = result.jobs.find((j) => j.jobName === 'api-v1-oc-by-date');
      expect(entry?.lagSinceLastSuccessMs).toBe(7_200_000);
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns failure count from aggregate query', async () => {
    mockQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          last_success_at: null,
          last_failure_at: new Date(),
          failure_count_7d: '3',
        },
      ]);

    const result = await service.getPipelineHealth();

    const entry = result.jobs.find((j) => j.jobName === 'api-v1-oc-by-date');
    expect(entry?.failureCount).toBe(3);
  });

  it('passes failure statuses to aggregate query, excluding soft_miss and success', async () => {
    mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.getPipelineHealth();

    const [, aggregateParams] = mockQuery.mock.calls[1];
    expect(aggregateParams).toEqual([
      'failed',
      'retryable_failed',
      'param_error',
    ]);
    expect(aggregateParams).not.toContain('soft_miss');
    expect(aggregateParams).not.toContain('success');
  });

  it('returns null freshness and null expectedCadenceMs in phase 1', async () => {
    mockQuery
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          status: 'success',
          started_at: new Date(),
          finished_at: new Date(),
        },
      ])
      .mockResolvedValueOnce([
        {
          job_name: 'api-v1-oc-by-date',
          last_success_at: new Date(),
          last_failure_at: null,
          failure_count_7d: '0',
        },
      ]);

    const result = await service.getPipelineHealth();

    const entry = result.jobs.find((j) => j.jobName === 'api-v1-oc-by-date');
    expect(entry?.freshness).toBeNull();
    expect(entry?.expectedCadenceMs).toBeNull();
  });

  it('returns generatedAt timestamp close to now', async () => {
    const before = Date.now();
    mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await service.getPipelineHealth();
    const after = Date.now();

    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(after);
  });
});
