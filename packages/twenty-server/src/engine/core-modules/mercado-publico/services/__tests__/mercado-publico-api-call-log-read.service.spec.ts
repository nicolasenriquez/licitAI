import { type DataSource } from 'typeorm';

import { MercadoPublicoApiCallLogReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-call-log-read.service';

describe('MercadoPublicoApiCallLogReadService', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies all filters and selects no raw payload data', async () => {
    const fetchedAt = new Date('2026-06-15T12:00:00.000Z');
    const requestParams = { fecha: '2026-06-15' };
    const service = new MercadoPublicoApiCallLogReadService(mockCoreDataSource);

    mockQuery.mockResolvedValueOnce([
      {
        id: 'call-1',
        source: 'api-v2-compra-agil',
        endpoint: 'list',
        request_params: requestParams,
        http_status: 200,
        fetched_at: fetchedAt,
        records_fetched: 10,
        error_summary: null,
        ingestion_job_id: 'job-1',
      },
    ]);

    const result = await service.listApiCallLogs({
      source: ' api-v2-compra-agil ',
      endpoint: ' list ',
      httpStatus: 200,
      limit: 20,
      offset: 40,
    });

    expect(result).toEqual({
      items: [
        {
          id: 'call-1',
          source: 'api-v2-compra-agil',
          endpoint: 'list',
          requestParams,
          httpStatus: 200,
          fetchedAt,
          recordsFetched: 10,
          errorSummary: null,
          ingestionJobId: 'job-1',
        },
      ],
      hasMore: false,
    });

    const [sql, params] = mockQuery.mock.calls[0];

    expect(sql).toContain('FROM mp.raw_api_payload');
    expect(sql).toContain('source = $1');
    expect(sql).toContain('endpoint = $2');
    expect(sql).toContain('http_status = $3');
    expect(sql).toContain('ORDER BY fetched_at DESC, id DESC');
    expect(sql).toContain('LIMIT $4 OFFSET $5');
    expect(sql).not.toContain('raw_payload');
    expect(params).toEqual(['api-v2-compra-agil', 'list', 200, 21, 40]);
  });

  it('maps nullable fields and reports hasMore from the extra row', async () => {
    const service = new MercadoPublicoApiCallLogReadService(mockCoreDataSource);
    const fetchedAt = new Date('2026-06-15T12:00:00.000Z');
    mockQuery.mockResolvedValueOnce([
      {
        id: 'call-1',
        source: 'source',
        endpoint: 'endpoint',
        request_params: null,
        http_status: 500,
        fetched_at: fetchedAt,
        records_fetched: null,
        error_summary: 'provider failed',
        ingestion_job_id: null,
      },
      {
        id: 'call-2',
        source: 'source',
        endpoint: 'endpoint',
        request_params: {},
        http_status: 200,
        fetched_at: new Date('2026-06-14T12:00:00.000Z'),
        records_fetched: 1,
        error_summary: null,
        ingestion_job_id: null,
      },
    ]);

    const result = await service.listApiCallLogs({ limit: 1 });

    expect(result.items).toEqual([
      {
        id: 'call-1',
        source: 'source',
        endpoint: 'endpoint',
        requestParams: null,
        httpStatus: 500,
        fetchedAt,
        recordsFetched: null,
        errorSummary: 'provider failed',
        ingestionJobId: null,
      },
    ]);
    expect(result.hasMore).toBe(true);
    expect(mockQuery.mock.calls[0][1]).toEqual([2, 0]);
  });

  it('uses safe default and maximum pagination without writes or unbounded reads', async () => {
    const service = new MercadoPublicoApiCallLogReadService(mockCoreDataSource);
    mockQuery.mockResolvedValueOnce([]);

    await service.listApiCallLogs({
      source: '   ',
      endpoint: '',
      httpStatus: Number.NaN,
      limit: 9999,
      offset: -1,
    });

    const [sql, params] = mockQuery.mock.calls[0];

    expect(sql).not.toMatch(/\bWHERE\b/);
    expect(sql).toContain('LIMIT $1 OFFSET $2');
    expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/i);
    expect(params).toEqual([201, 0]);
  });
});
