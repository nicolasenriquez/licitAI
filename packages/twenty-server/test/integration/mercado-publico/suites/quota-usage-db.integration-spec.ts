import { type DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpGoldReadObjectsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007910-mp-gold-read-objects';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import { MercadoPublicoApiQuotaUsageReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-quota-usage-read.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';

const TRUNCATE_TABLES = `
  mp.gold_api_quota_usage
`;

describe('Mercado Publico quota usage (db-backed)', () => {
  let dataSource: DataSource;
  let service: MercadoPublicoApiQuotaUsageReadService;
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

  beforeAll(async () => {
    jest.useRealTimers();

    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`DROP SCHEMA IF EXISTS mp CASCADE`);
      await new MpSchemaFastInstanceCommand().up(queryRunner);
      await new MpGoldReadObjectsFastInstanceCommand().up(queryRunner);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    service = new MercadoPublicoApiQuotaUsageReadService(
      dataSource,
      mockConfigService,
    );
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE ${TRUNCATE_TABLES} RESTART IDENTITY CASCADE`,
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

  afterAll(async () => {
    await dataSource.query(
      `TRUNCATE TABLE ${TRUNCATE_TABLES} RESTART IDENTITY CASCADE`,
    );

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('returns all three source entries with computed remaining', async () => {
    const resetAt = new Date('2026-07-06T04:00:00.000Z');

    await dataSource.query(
      `
        INSERT INTO mp.gold_api_quota_usage (source, used, reset_at, last_429_at)
        VALUES
          ('api-v1-licitaciones', 500, $1, NULL),
          ('api-v1-oc', 200, $2, NULL),
          ('api-v2-compra-agil', 0, $3, NULL)
      `,
      [resetAt, resetAt, resetAt],
    );

    const result = await service.getApiQuotaUsage();

    expect(result.sources).toHaveLength(3);
    expect(result.generatedAt).toBeInstanceOf(Date);

    const licSrc = result.sources.find(
      (s) => s.source === 'api-v1-licitaciones',
    );

    expect(licSrc).toBeDefined();
    expect(licSrc!.dailyLimit).toBe(10000);
    expect(licSrc!.used).toBe(500);
    expect(licSrc!.remaining).toBe(9500);
    expect(licSrc!.last429At).toBeNull();

    const ocSrc = result.sources.find((s) => s.source === 'api-v1-oc');

    expect(ocSrc!.remaining).toBe(9800);

    const caSrc = result.sources.find((s) => s.source === 'api-v2-compra-agil');

    expect(caSrc!.remaining).toBe(10000);
    expect(caSrc!.used).toBe(0);
  });

  it('returns last429At when a 429 response was tracked', async () => {
    const last429 = new Date('2026-07-04T15:30:00.000Z');
    const resetAt = new Date('2026-07-05T04:00:00.000Z');

    await dataSource.query(
      `
        INSERT INTO mp.gold_api_quota_usage (source, used, reset_at, last_429_at)
        VALUES ('api-v1-licitaciones', 9900, $1, $2)
      `,
      [resetAt, last429],
    );

    const result = await service.getApiQuotaUsage();

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].last429At).toBeInstanceOf(Date);
    expect(result.sources[0].last429At!.getTime()).toBe(last429.getTime());
  });

  it('returns null last429At when no 429 ever tracked', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.gold_api_quota_usage (source, used, reset_at, last_429_at)
        VALUES ('api-v1-licitaciones', 100, NULL, NULL)
      `,
    );

    const result = await service.getApiQuotaUsage();

    expect(result.sources[0].last429At).toBeNull();
  });

  it('returns remaining zero when used exceeds dailyLimit', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.gold_api_quota_usage (source, used, reset_at, last_429_at)
        VALUES ('api-v1-licitaciones', 12000, NULL, NULL)
      `,
    );

    const result = await service.getApiQuotaUsage();

    expect(result.sources[0].used).toBe(12000);
    expect(result.sources[0].remaining).toBe(0);
  });

  it('returns empty sources when no quota data exists', async () => {
    const result = await service.getApiQuotaUsage();

    expect(result.sources).toHaveLength(0);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('returns resetAt populated when write path set it', async () => {
    const resetAt = new Date('2026-07-07T04:00:00.000Z');

    await dataSource.query(
      `
        INSERT INTO mp.gold_api_quota_usage (source, used, reset_at, last_429_at)
        VALUES ('api-v1-licitaciones', 1, $1, NULL)
      `,
      [resetAt],
    );

    const result = await service.getApiQuotaUsage();

    expect(result.sources[0].resetAt).toBeInstanceOf(Date);
    expect(result.sources[0].resetAt!.getTime()).toBe(resetAt.getTime());
  });
});
