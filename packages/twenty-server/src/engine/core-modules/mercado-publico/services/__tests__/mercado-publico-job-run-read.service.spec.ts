import { type DataSource } from 'typeorm';

import { MercadoPublicoJobRunReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-run-read.service';

describe('MercadoPublicoJobRunReadService', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies filters, uses bounded parameters, and maps all fields', async () => {
    const startedFrom = new Date('2026-06-01T00:00:00.000Z');
    const startedTo = new Date('2026-06-30T23:59:59.000Z');
    const startedAt = new Date('2026-06-15T12:00:00.000Z');
    const finishedAt = new Date('2026-06-15T12:05:00.000Z');
    const createdAt = new Date('2026-06-15T12:00:01.000Z');
    const service = new MercadoPublicoJobRunReadService(mockCoreDataSource);

    mockQuery.mockResolvedValueOnce([
      {
        id: 'job-1',
        job_name: 'csv-oc-download',
        job_run_id: 'run-1',
        status: 'skipped',
        started_at: startedAt,
        finished_at: finishedAt,
        records_fetched: null,
        records_staged: 0,
        records_canonicalized: null,
        records_failed: 0,
        error_summary: 'skipped by configuration',
        raw_csv_file_id: null,
        created_at: createdAt,
      },
    ]);

    const result = await service.listJobRuns({
      statuses: ['skipped'],
      jobName: ' csv-oc-download ',
      startedFrom,
      startedTo,
      limit: 25,
      offset: 50,
    });

    expect(result).toEqual({
      items: [
        {
          id: 'job-1',
          jobName: 'csv-oc-download',
          jobRunId: 'run-1',
          status: 'skipped',
          startedAt,
          finishedAt,
          recordsFetched: null,
          recordsStaged: 0,
          recordsCanonicalized: null,
          recordsFailed: 0,
          errorSummary: 'skipped by configuration',
          rawCsvFileId: null,
          createdAt,
        },
      ],
      hasMore: false,
    });

    const [sql, params] = mockQuery.mock.calls[0];

    expect(sql).toContain('FROM mp.stg_job_run');
    expect(sql).toContain('status = ANY($1::text[])');
    expect(sql).toContain('job_name = $2');
    expect(sql).toContain('started_at >= $3');
    expect(sql).toContain('started_at <= $4');
    expect(sql).toContain('ORDER BY started_at DESC, id DESC');
    expect(sql).toContain('LIMIT $5 OFFSET $6');
    expect(params).toEqual([
      ['skipped'],
      'csv-oc-download',
      startedFrom,
      startedTo,
      26,
      50,
    ]);
  });

  it('returns only the requested page and reports hasMore from the extra row', async () => {
    const service = new MercadoPublicoJobRunReadService(mockCoreDataSource);
    const rows = [1, 2, 3].map((index) => ({
      id: `job-${index}`,
      job_name: 'job',
      job_run_id: `run-${index}`,
      status: 'success',
      started_at: new Date(`2026-06-0${index}T00:00:00.000Z`),
      finished_at: null,
      records_fetched: index,
      records_staged: null,
      records_canonicalized: null,
      records_failed: null,
      error_summary: null,
      raw_csv_file_id: undefined,
      created_at: new Date(`2026-06-0${index}T00:00:01.000Z`),
    }));
    mockQuery.mockResolvedValueOnce(rows);

    const result = await service.listJobRuns({ limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.id)).toEqual(['job-1', 'job-2']);
    expect(result.hasMore).toBe(true);

    const [sql, params] = mockQuery.mock.calls[0];

    expect(sql).toContain('LIMIT $1 OFFSET $2');
    expect(params).toEqual([3, 0]);
    expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/i);
  });

  it('clamps invalid pagination and ignores blank or unknown filters', async () => {
    const service = new MercadoPublicoJobRunReadService(mockCoreDataSource);
    mockQuery.mockResolvedValueOnce([]);

    await service.listJobRuns({
      statuses: ['success', 'unknown' as never],
      jobName: '   ',
      limit: 9999,
      offset: -10,
    });

    const [sql, params] = mockQuery.mock.calls[0];

    expect(sql).not.toContain('job_name =');
    expect(sql).toContain('status = ANY($1::text[])');
    expect(params).toEqual([['success'], 201, 0]);
  });
});
