import { type DataSource } from 'typeorm';

import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoApiQuotaUsageReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-quota-usage-read.service';

type GoldApiQuotaUsageRow = {
  source: string;
  used: number;
  reset_at: Date | null;
  last_429_at: Date | null;
};

class GoldApiQuotaUsageStore {
  private rows: GoldApiQuotaUsageRow[] = [];

  register(rows: GoldApiQuotaUsageRow[]): void {
    this.rows = [...rows];
  }

  query<T>(): T[] {
    const sorted = [...this.rows].sort((a, b) =>
      a.source.localeCompare(b.source),
    );

    return sorted.map((row) => ({
      source: row.source,
      used: row.used,
      reset_at: row.reset_at,
      last_429_at: row.last_429_at,
    })) as T[];
  }
}

describe('MercadoPublicoApiQuotaUsageReadService (integration-shaped)', () => {
  const store = new GoldApiQuotaUsageStore();
  const buildDataSource = () =>
    ({
      query: jest.fn(async () => store.query()),
    }) as unknown as jest.Mocked<DataSource>;

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

  let service: MercadoPublicoApiQuotaUsageReadService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    store.register([]);
    mockDataSource = buildDataSource();
    service = new MercadoPublicoApiQuotaUsageReadService(
      mockDataSource,
      mockConfigService,
    );
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

  it('returns all rows with computed remaining', async () => {
    const resetDate = new Date('2026-07-05T04:00:00.000Z');
    const last429 = new Date('2026-07-04T15:30:00.000Z');

    store.register([
      {
        source: 'api-v1-licitaciones',
        used: 500,
        reset_at: resetDate,
        last_429_at: null,
      },
      {
        source: 'api-v1-oc',
        used: 2000,
        reset_at: resetDate,
        last_429_at: null,
      },
      {
        source: 'api-v2-compra-agil',
        used: 7500,
        reset_at: new Date(),
        last_429_at: last429,
      },
    ]);

    const result = await service.getApiQuotaUsage();

    expect(result.sources).toHaveLength(3);

    const lic = result.sources.find((s) => s.source === 'api-v1-licitaciones');
    expect(lic?.dailyLimit).toBe(10000);
    expect(lic?.remaining).toBe(9500);

    const oc = result.sources.find((s) => s.source === 'api-v1-oc');
    expect(oc?.remaining).toBe(8000);

    const ca = result.sources.find((s) => s.source === 'api-v2-compra-agil');
    expect(ca?.used).toBe(7500);
    expect(ca?.remaining).toBe(2500);
    expect(ca?.last429At).toEqual(last429);

    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('returns empty sources array for an empty table without throwing', async () => {
    const result = await service.getApiQuotaUsage();

    expect(result.sources).toEqual([]);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});
