import { type DataSource } from 'typeorm';

import { MercadoPublicoQuotaTrackerService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-quota-tracker.service';

describe('MercadoPublicoQuotaTrackerService', () => {
  let queryCalls: Array<{ sql: string; params: unknown[] }>;

  const mockDataSource = {
    query: jest.fn(async (sql: string, params: unknown[]) => {
      queryCalls.push({ sql, params });

      return [{ upserted: 1 }];
    }),
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoQuotaTrackerService(mockDataSource);

  beforeEach(() => {
    jest.clearAllMocks();
    queryCalls = [];
  });

  it('upserts quota usage on first 429 with timezone-aware reset', async () => {
    await service.record429('api-v1-licitaciones', 'America/Santiago');

    expect(queryCalls).toHaveLength(1);
    expect(queryCalls[0].sql).toContain('INSERT INTO mp.gold_api_quota_usage');
    expect(queryCalls[0].params).toEqual([
      'api-v1-licitaciones',
      'America/Santiago',
    ]);
  });

  it('increments used counter before the current reset window expires', async () => {
    await service.record429('api-v1-oc', 'America/Santiago');

    expect(queryCalls).toHaveLength(1);
    expect(queryCalls[0].sql).toContain('ON CONFLICT (source) DO UPDATE');
    expect(queryCalls[0].sql).toContain(
      'ELSE mp.gold_api_quota_usage.used + 1',
    );
    expect(queryCalls[0].params[0]).toBe('api-v1-oc');
  });

  it('resets used counter to 1 after the stored reset boundary passes', async () => {
    await service.record429('api-v1-oc', 'America/Santiago');

    expect(queryCalls).toHaveLength(1);
    expect(queryCalls[0].sql).toContain(
      'WHEN mp.gold_api_quota_usage.reset_at <= now() THEN 1',
    );
    expect(queryCalls[0].params[0]).toBe('api-v1-oc');
  });

  it('swallows DB errors without throwing', async () => {
    (mockDataSource.query as jest.Mock).mockRejectedValueOnce(
      new Error('connection refused'),
    );

    await expect(
      service.record429('api-v2-compra-agil', 'America/Santiago'),
    ).resolves.toBeUndefined();
  });
});
