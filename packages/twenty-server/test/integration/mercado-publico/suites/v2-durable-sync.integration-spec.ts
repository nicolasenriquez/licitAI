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
import { MpV2CohortFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1786000000000-mp-v2-cohort';
import { MpV2EvidenceHistoryReplayFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1787000000000-mp-v2-evidence-history-replay';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

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
    await new MpV2CohortFastInstanceCommand().up(queryRunner);
    await new MpV2EvidenceHistoryReplayFastInstanceCommand().up(queryRunner);
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
      mp.v2_cohort,
      mp.sync_run_item,
      mp.sync_run_page,
      mp.source_watermark,
      mp.v2_history,
      mp.v2_child_evidence,
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
  errorSummary?: 'hard_fail' | 'param_error' | 'soft_miss' | 'retryable_failed',
  fetchedAt = new Date('2026-08-05T12:00:00.000Z'),
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
  fetchedAt,
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
  providerChangedAt: string | null = '2026-08-05T10:00:00Z',
): MercadoPublicoApiV2CompraAgilRecord => ({
  codigo,
  nombre: title,
  estado: state,
  fechas: {
    ...(providerChangedAt === null
      ? {}
      : { fecha_ultimo_cambio: providerChangedAt }),
    fecha_publicacion: '2026-08-01T10:00:00',
  },
  institucion: { rut: '60.000.000-0', organismo_comprador: 'Buyer' },
  montos: { moneda: 'CLP', monto_disponible: 1000 },
  documentos: [],
});

const seedActiveCohortMember = async (
  dataSource: DataSource,
  codigo: string,
): Promise<void> => {
  const syncRuns = await dataSource.query<{ id: string }[]>(
    `
      INSERT INTO mp.sync_run (intent, source, status)
      VALUES ('fixture', 'api-v2-compra-agil', 'succeeded')
      RETURNING id
    `,
  );

  await dataSource.query(
    `
      INSERT INTO mp.v2_cohort (
        source, scope, codigo, status, admitted_sync_run_id
      )
      VALUES ('api-v2-compra-agil', 'global', $1, 'active', $2)
    `,
    [codigo, syncRuns[0].id],
  );
};

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
      dataSource,
      new MercadoPublicoV2ProjectionService(dataSource),
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
    const cohortMembers = await dataSource.query<
      { codigo: string; status: string }[]
    >(
      `SELECT codigo, status FROM mp.v2_cohort WHERE source = 'api-v2-compra-agil' AND scope = 'global'`,
    );

    expect(result.status).toBe('partial_failed');
    expect(clientService.getList).toHaveBeenCalledTimes(2);
    expect(pendingItems).toEqual(
      expect.arrayContaining([
        { codigo: 'CA-1', status: 'pending' },
        { codigo: 'CA-2', status: 'succeeded' },
      ]),
    );
    expect(cohortMembers).toEqual(
      expect.arrayContaining([
        { codigo: 'CA-1', status: 'active' },
        { codigo: 'CA-2', status: 'active' },
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

  it('does not admit a pre-V2 canonical row into the cohort', async () => {
    await dataSource.query(`
      INSERT INTO mp.compra_agil (
        codigo, estado, document_count, created_at, updated_at
      )
      VALUES ('CA-PRE-V2', 'cerrada', 1, now(), now())
    `);
    const record = createRecord('CA-PRE-V2', 'cerrada');
    clientService.getList.mockResolvedValueOnce(createResponse([record]));

    const result = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const items = await dataSource.query<{ codigo: string }[]>(
      `SELECT codigo FROM mp.sync_run_item WHERE sync_run_id = $1`,
      [result.syncRunId],
    );

    expect(result.status).toBe('succeeded');
    expect(items).toEqual([]);
    expect(clientService.getByCodigo).not.toHaveBeenCalled();
  });

  it('hydrates an active cohort member absent from the change pages', async () => {
    await seedActiveCohortMember(dataSource, 'CA-ABSENT-FROM-PAGES');
    const record = createRecord('CA-ABSENT-FROM-PAGES', 'publicada');
    clientService.getList.mockResolvedValueOnce(createResponse([]));
    clientService.getByCodigo.mockResolvedValueOnce(createResponse([record]));

    const result = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const items = await dataSource.query<
      { codigo: string; discovery_page: number; status: string }[]
    >(
      `SELECT codigo, discovery_page, status FROM mp.sync_run_item WHERE sync_run_id = $1`,
      [result.syncRunId],
    );

    expect(result.status).toBe('succeeded');
    expect(items).toEqual([
      {
        codigo: 'CA-ABSENT-FROM-PAGES',
        discovery_page: 0,
        status: 'succeeded',
      },
    ]);
  });

  it('stops freezing a cohort member after terminal verification', async () => {
    await seedActiveCohortMember(dataSource, 'CA-TERMINAL');
    const terminalRecord = createRecord('CA-TERMINAL', 'cancelada');
    clientService.getList.mockResolvedValueOnce(
      createResponse([terminalRecord]),
    );
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([terminalRecord]),
    );

    const firstRun = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const cohortAfterTerminal = await dataSource.query<
      { status: string; terminal_sync_run_id: string }[]
    >(
      `SELECT status, terminal_sync_run_id FROM mp.v2_cohort WHERE codigo = 'CA-TERMINAL'`,
    );

    clientService.getList.mockResolvedValueOnce(createResponse([]));
    const secondRun = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const secondRunItems = await dataSource.query<{ codigo: string }[]>(
      `SELECT codigo FROM mp.sync_run_item WHERE sync_run_id = $1`,
      [secondRun.syncRunId],
    );

    expect(firstRun.status).toBe('succeeded');
    expect(cohortAfterTerminal).toEqual([
      { status: 'terminal', terminal_sync_run_id: firstRun.syncRunId },
    ]);
    expect(secondRunItems).toEqual([]);
    expect(clientService.getByCodigo).toHaveBeenCalledTimes(1);
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
    const knownRecord = createRecord(
      'FIXTURE-CA-001',
      'cerrada',
      'Untrusted update',
    );
    const healthyRecord = createRecord('CA-HEALTHY', 'publicada', 'Healthy');
    clientService.getList.mockResolvedValueOnce(
      createResponse([knownRecord, healthyRecord]),
    );
    clientService.getByCodigo.mockImplementation(async (codigo) =>
      codigo === 'FIXTURE-CA-001'
        ? createResponse([], 1, 1, 'retryable_failed')
        : createResponse([healthyRecord]),
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

  it('fails the run when every detail request is retryable', async () => {
    const record = createRecord('CA-ALL-RETRYABLE', 'publicada');
    clientService.getList.mockResolvedValueOnce(createResponse([record]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([], 1, 1, 'retryable_failed'),
    );

    await expect(
      service.start({ cambio_desde: '2026-08-05T00:00:00Z' }),
    ).rejects.toThrow('all detail requests failed');
    const runs = await dataSource.query<
      { status: string; watermark_after: Date | null }[]
    >(`SELECT status, watermark_after FROM mp.sync_run`);

    expect(runs).toEqual([{ status: 'failed', watermark_after: null }]);
  });

  it('does not let stale observations replace current or gold projections', async () => {
    const firstRecord = createRecord(
      'CA-VERSIONED',
      'publicada',
      'First observation',
      '2026-08-05T10:00:00Z',
    );
    clientService.getList.mockResolvedValueOnce(createResponse([firstRecord]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([firstRecord]),
    );
    await service.start({ cambio_desde: '2026-08-05T00:00:00Z' });

    const staleRecord = createRecord(
      'CA-VERSIONED',
      'cerrada',
      'Stale observation',
      '2026-08-04T10:00:00Z',
    );
    clientService.getList.mockResolvedValueOnce(createResponse([staleRecord]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([staleRecord]),
    );
    await service.start({ cambio_desde: '2026-08-05T00:00:00Z' });

    const equalTimestampRecord = createRecord(
      'CA-VERSIONED',
      'cerrada',
      'Equal timestamp observation',
      '2026-08-05T10:00:00Z',
    );
    clientService.getList.mockResolvedValueOnce(
      createResponse(
        [equalTimestampRecord],
        1,
        1,
        undefined,
        new Date('2026-08-06T12:00:00.000Z'),
      ),
    );
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse(
        [equalTimestampRecord],
        1,
        1,
        undefined,
        new Date('2026-08-06T12:00:00.000Z'),
      ),
    );
    await service.start({ cambio_desde: '2026-08-05T00:00:00Z' });

    const unknownTimestampRecord = createRecord(
      'CA-VERSIONED',
      'publicada',
      'Unknown timestamp observation',
      null,
    );
    clientService.getList.mockResolvedValueOnce(
      createResponse(
        [unknownTimestampRecord],
        1,
        1,
        undefined,
        new Date('2026-08-07T12:00:00.000Z'),
      ),
    );
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse(
        [unknownTimestampRecord],
        1,
        1,
        undefined,
        new Date('2026-08-07T12:00:00.000Z'),
      ),
    );
    await service.start({ cambio_desde: '2026-08-05T00:00:00Z' });

    const projections = await dataSource.query<
      {
        canonical_title: string | null;
        canonical_state: string | null;
        canonical_provider_changed_at: Date | null;
        gold_title: string | null;
        gold_state: string | null;
        gold_provider_changed_at: Date | null;
      }[]
    >(
      `
        SELECT
          canonical.title AS canonical_title,
          canonical.estado AS canonical_state,
          canonical.provider_changed_at AS canonical_provider_changed_at,
          gold.title AS gold_title,
          gold.canonical_state AS gold_state,
          gold.provider_changed_at AS gold_provider_changed_at
        FROM mp.compra_agil canonical
        JOIN mp.gold_detected_process gold
          ON gold.process_type = 'compra_agil'
         AND gold.process_code = canonical.codigo
        WHERE canonical.codigo = 'CA-VERSIONED'
      `,
    );

    expect(projections).toHaveLength(1);
    expect(projections[0]).toMatchObject({
      canonical_title: 'Unknown timestamp observation',
      canonical_state: 'publicada',
      gold_title: 'Unknown timestamp observation',
      gold_state: 'publicada',
    });
    expect(projections[0]?.canonical_provider_changed_at).toBeNull();
    expect(projections[0]?.gold_provider_changed_at).toBeNull();
  });

  it('keeps the previous projection when detail returns another codigo', async () => {
    await service.runFixture(fixture);
    const before = await dataSource.query<{ title: string | null }[]>(
      `SELECT title FROM mp.compra_agil WHERE codigo = 'FIXTURE-CA-001'`,
    );
    const listedRecord = createRecord(
      'FIXTURE-CA-001',
      'cerrada',
      'Untrusted update',
    );
    const mismatchedRecord = createRecord('CA-WRONG-CODE', 'cerrada', 'Wrong');
    clientService.getList.mockResolvedValueOnce(createResponse([listedRecord]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([mismatchedRecord]),
    );

    const result = await service.start({
      cambio_desde: '2026-08-05T00:00:00Z',
    });
    const after = await dataSource.query<{ title: string | null }[]>(
      `SELECT title FROM mp.compra_agil WHERE codigo = 'FIXTURE-CA-001'`,
    );
    const items = await dataSource.query<{ error_summary: string | null }[]>(
      `SELECT error_summary FROM mp.sync_run_item WHERE sync_run_id = $1`,
      [result.syncRunId],
    );

    expect(result.status).toBe('partial_failed');
    expect(after).toEqual(before);
    expect(items).toEqual([{ error_summary: 'detail_codigo_mismatch' }]);
  });

  it.each(['hard_fail', 'param_error'] as const)(
    'aborts immediately on detail %s',
    async (errorSummary) => {
      const record = createRecord(`CA-${errorSummary}`, 'publicada');
      clientService.getList.mockResolvedValueOnce(createResponse([record]));
      clientService.getByCodigo.mockResolvedValueOnce(
        createResponse([], 1, 1, errorSummary),
      );

      await expect(
        service.start({ cambio_desde: '2026-08-05T00:00:00Z' }),
      ).rejects.toThrow('systemic detail configuration failure');
    },
  );

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
