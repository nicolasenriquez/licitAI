import { type DataSource } from 'typeorm';

import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoApiQuotaUsageReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-quota-usage-read.service';

describe('MercadoPublicoApiQuotaUsageReadService', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  const mockConfigService = {
    getSettings: jest.fn().mockReturnValue({
      apiDailyLimit: 10000,
      httpTimeoutMs: 30000,
      httpMaxRetries: 3,
      httpRetryBackoffMs: 1000,
      quotaTimezone: 'America/Santiago',
      csvDownloadEnabled: false,
    }),
  } as unknown as jest.Mocked<MercadoPublicoConfigService>;

  const service = new MercadoPublicoApiQuotaUsageReadService(
    mockCoreDataSource,
    mockConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService.getSettings.mockReturnValue({
      apiDailyLimit: 10000,
      httpTimeoutMs: 30000,
      httpMaxRetries: 3,
      httpRetryBackoffMs: 1000,
      quotaTimezone: 'America/Santiago',
      csvDownloadEnabled: false,
    });
  });

  it('returns daily quota usage with source, dailyLimit, used, remaining', async () => {
    const resetDate = new Date('2026-07-05T04:00:00.000Z');

    mockQuery.mockResolvedValueOnce([
      {
        source: 'api-v1-licitaciones',
        used: 150,
        reset_at: resetDate,
        last_429_at: null,
      },
      {
        source: 'api-v1-oc',
        used: 200,
        reset_at: resetDate,
        last_429_at: null,
      },
    ]);

    const result = await service.getApiQuotaUsage();

    expect(result.sources).toHaveLength(2);
    expect(result.generatedAt).toBeInstanceOf(Date);

    const v1Lic = result.sources.find(
      (s) => s.source === 'api-v1-licitaciones',
    );
    expect(v1Lic).toBeDefined();
    expect(v1Lic?.dailyLimit).toBe(10000);
    expect(v1Lic?.used).toBe(150);
    expect(v1Lic?.remaining).toBe(9850);
    expect(v1Lic?.resetAt).toEqual(resetDate);
    expect(v1Lic?.last429At).toBeNull();

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('computes remaining as max(0, dailyLimit - used)', async () => {
    mockQuery.mockResolvedValueOnce([
      {
        source: 'api-v1-oc',
        used: 10001,
        reset_at: new Date(),
        last_429_at: null,
      },
    ]);

    const result = await service.getApiQuotaUsage();

    expect(result.sources[0].remaining).toBe(0);
  });

  it('returns last429At when 429 observed', async () => {
    const last429 = new Date('2026-07-04T15:30:00.000Z');

    mockQuery.mockResolvedValueOnce([
      {
        source: 'api-v2-compra-agil',
        used: 5000,
        reset_at: new Date(),
        last_429_at: last429,
      },
    ]);

    const result = await service.getApiQuotaUsage();

    expect(result.sources[0].last429At).toEqual(last429);
  });

  it('returns null last429At when no 429 observed', async () => {
    mockQuery.mockResolvedValueOnce([
      {
        source: 'api-v1-licitaciones',
        used: 0,
        reset_at: null,
        last_429_at: null,
      },
    ]);

    const result = await service.getApiQuotaUsage();

    expect(result.sources[0].last429At).toBeNull();
    expect(result.sources[0].resetAt).toBeNull();
  });
});
