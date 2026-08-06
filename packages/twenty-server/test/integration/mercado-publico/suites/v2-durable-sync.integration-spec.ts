import { type DataSource } from 'typeorm';

import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import {
  type MercadoPublicoApiV2CompraAgilListResponse,
  MercadoPublicoApiV2CompraAgilClientService,
} from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { MpCanonicalCompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007880-mp-canonical-compra-agil';
import { MpGoldReadObjectsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007910-mp-gold-read-objects';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpStgApiV2CompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007830-mp-stg-api-v2-compra-agil';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpV2GoldenPathFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784000000000-mp-v2-golden-path';
import { RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784000000010-relax-mp-v2-canonical-state-and-document-count';
import { MpV2DurableDiscoveryHydrationFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1785000000000-mp-v2-durable-discovery-hydration';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

const applyCommands = async (dataSource: DataSource): Promise<void> => {
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(`DROP SCHEMA IF EXISTS mp CASCADE`);
    await new MpSchemaFastInstanceCommand().up(queryRunner);
    await new MpRawApiPayloadFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileFastInstanceCommand().up(queryRunner);
    await new MpRawCsvRowFastInstanceCommand().up(queryRunner);
    await new MpStgJobRunFastInstanceCommand().up(queryRunner);
    await new MpStgApiV2CompraAgilFastInstanceCommand().up(queryRunner);
    await new MpCanonicalCompraAgilFastInstanceCommand().up(queryRunner);
    await new MpGoldReadObjectsFastInstanceCommand().up(queryRunner);
    await new MpV2GoldenPathFastInstanceCommand().up(queryRunner);
    await new RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand().up(
      queryRunner,
    );
    await new MpV2DurableDiscoveryHydrationFastInstanceCommand().up(
      queryRunner,
    );
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

const truncateTables = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`
    TRUNCATE TABLE
      mp.gold_detected_process,
      mp.sync_run_item,
      mp.sync_run_page,
      mp.source_watermark,
      mp.v2_observation,
      mp.sync_run,
      mp.compra_agil,
      mp.stg_api_v2_compra_agil,
      mp.raw_api_payload,
      mp.stg_job_run
    RESTART IDENTITY CASCADE
  `);
};

const createResponse = (
  records: MercadoPublicoApiV2CompraAgilRecord[],
  pageNumber = 1,
  totalPages = 1,
  errorSummary?: 'soft_miss' | 'retryable_failed',
): MercadoPublicoApiV2CompraAgilListResponse => ({
  endpoint: 'list',
  source: 'api-v2-compra-agil',
  requestParams: {
    cambio_desde: '2026-08-01T00:00:00Z',
    numero_pagina: pageNumber,
  },
  requestFingerprint: `request-${pageNumber}-${records.length}-${errorSummary ?? 'ok'}`,
  payloadChecksum: `payload-${pageNumber}-${records.length}-${errorSummary ?? 'ok'}`,
  schemaFingerprint: 'schema-fingerprint',
  httpStatus: errorSummary === undefined ? 200 : 503,
  fetchedAt: new Date('2026-08-05T12:00:00.000Z'),
  rawPayload: {
    items: records,
    paginacion: {
      numero_pagina: pageNumber,
      tamano_pagina: 50,
      total_paginas: totalPages,
      total_resultados: records.length,
    },
  },
  compraAgil: records,
  pagination: {
    pageNumber,
    pageSize: 50,
    totalPages,
    totalResults: records.length,
    hasNextPage: pageNumber < totalPages,
  },
  errorSummary,
  errorMessage: errorSummary === undefined ? undefined : 'provider unavailable',
});

const createRecord = (
  codigo: string,
  state: string | { codigo: string; glosa: string },
  title = codigo,
): MercadoPublicoApiV2CompraAgilRecord => ({
  codigo,
  nombre: title,
  estado: state,
  fechas: {
    fecha_ultimo_cambio: '2026-08-05T10:00:00Z',
    fecha_publicacion: '2026-08-01T10:00:00',
  },
  institucion: { rut: '60.000.000-0', organismo_comprador: 'Buyer' },
  montos: { moneda: 'CLP', monto_disponible: 1000 },
  documentos: [],
});

describe('Mercado Publico V2 durable discovery and hydration (db-backed)', () => {
  let dataSource: DataSource;
  let clientService: jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
  let service: MercadoPublicoV2DurableSyncService;

  beforeAll(async () => {
    jest.useRealTimers();
    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyCommands(dataSource);
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
    clientService = {
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
    service = new MercadoPublicoV2DurableSyncService(
      clientService,
      new MercadoPublicoPersistenceService(dataSource),
      new MercadoPublicoCanonicalRefreshService(dataSource),
      dataSource,
    );
  });

  afterAll(async () => {
    await truncateTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('freezes pages, retains only first-time published records, and resumes pending items', async () => {
    const first = createRecord('CA-1', {
      codigo: 'publicada',
      glosa: 'Publicada',
    });
    const second = createRecord('CA-2', {
      codigo: 'publicada',
      glosa: 'Publicada',
    });
    clientService.getList
      .mockResolvedValueOnce(createResponse([first], 1, 2))
      .mockResolvedValueOnce(createResponse([second], 2, 2));
    clientService.getByCodigo
      .mockResolvedValueOnce(createResponse([], 1, 1, 'retryable_failed'))
      .mockResolvedValueOnce(createResponse([second]));

    const result = await service.start({
      cambio_desde: '2026-08-01T00:00:00Z',
    });
    const pendingItems = await dataSource.query<
      { codigo: string; status: string }[]
    >(`SELECT codigo, status FROM mp.sync_run_item WHERE sync_run_id = $1`, [
      result.syncRunId,
    ]);

    expect(result.status).toBe('partial_failed');
    expect(clientService.getList).toHaveBeenCalledTimes(2);
    expect(pendingItems).toEqual(
      expect.arrayContaining([
        { codigo: 'CA-1', status: 'pending' },
        { codigo: 'CA-2', status: 'succeeded' },
      ]),
    );

    clientService.getByCodigo.mockResolvedValueOnce(createResponse([first]));
    const resumed = await service.resume(result.syncRunId);
    const runRows = await dataSource.query<
      { status: string; watermark_after: Date | null }[]
    >(`SELECT status, watermark_after FROM mp.sync_run WHERE id = $1`, [
      result.syncRunId,
    ]);

    expect(resumed.status).toBe('succeeded');
    expect(clientService.getList).toHaveBeenCalledTimes(2);
    expect(runRows[0]?.status).toBe('succeeded');
    expect(runRows[0]?.watermark_after).not.toBeNull();
  });

  it('keeps a known lifecycle record while excluding a first-time non-published record', async () => {
    const fixtureResult = await service.runFixture(fixture);
    const knownClosed = createRecord(
      'FIXTURE-CA-001',
      { codigo: 'cerrada', glosa: 'Cerrada' },
      'Updated title',
    );
    const unknownClosed = createRecord('CA-UNKNOWN-CLOSED', 'cerrada');
    clientService.getList.mockResolvedValueOnce(
      createResponse([knownClosed, unknownClosed]),
    );
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([knownClosed]),
    );

    const result = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const items = await dataSource.query<{ codigo: string }[]>(
      `SELECT codigo FROM mp.sync_run_item WHERE sync_run_id = $1`,
      [result.syncRunId],
    );

    expect(fixtureResult.status).toBe('succeeded');
    expect(items).toEqual([{ codigo: 'FIXTURE-CA-001' }]);
  });

  it('creates a new run when rediscovering instead of mutating the frozen cohort', async () => {
    const first = await service.runFixture(fixture);
    clientService.getList.mockResolvedValueOnce(
      createResponse([createRecord('FIXTURE-CA-001', 'publicada')]),
    );
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([createRecord('FIXTURE-CA-001', 'publicada')]),
    );

    const rediscovered = await service.rediscover(first.syncRunId);

    expect(rediscovered.syncRunId).not.toBe(first.syncRunId);
    expect(clientService.getList).toHaveBeenCalledTimes(1);
  });

  it('preserves the last valid projection after a detail failure and does not advance watermark', async () => {
    await service.runFixture(fixture);
    const before = await dataSource.query<{ title: string | null }[]>(
      `SELECT title FROM mp.compra_agil WHERE codigo = 'FIXTURE-CA-001'`,
    );
    clientService.getList.mockResolvedValueOnce(
      createResponse([
        createRecord('FIXTURE-CA-001', 'cerrada', 'Untrusted update'),
      ]),
    );
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([], 1, 1, 'retryable_failed'),
    );

    const result = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const after = await dataSource.query<{ title: string | null }[]>(
      `SELECT title FROM mp.compra_agil WHERE codigo = 'FIXTURE-CA-001'`,
    );
    const watermark = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.source_watermark`,
    );

    expect(result.status).toBe('partial_failed');
    expect(after).toEqual(before);
    expect(watermark[0]?.count).toBe('1');
  });

  it('fails a systemic discovery response and leaves the watermark unchanged', async () => {
    clientService.getList.mockResolvedValueOnce(
      createResponse([], 1, 1, 'retryable_failed'),
    );

    await expect(
      service.start({ cambio_desde: '2026-08-01T00:00:00Z' }),
    ).rejects.toThrow();
    const runs = await dataSource.query<
      { status: string; watermark_after: Date | null }[]
    >(`SELECT status, watermark_after FROM mp.sync_run`);
    const watermarks = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.source_watermark`,
    );

    expect(runs).toEqual([{ status: 'failed', watermark_after: null }]);
    expect(watermarks[0]?.count).toBe('0');
  });
});
