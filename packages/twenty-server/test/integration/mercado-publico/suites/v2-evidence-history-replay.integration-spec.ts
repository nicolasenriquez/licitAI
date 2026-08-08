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
import { MpV2ActivasFiltersFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1789000000000-mp-v2-activas-filters';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2EvidenceReplayService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-evidence-replay.service';
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
    await new MpV2ActivasFiltersFastInstanceCommand().up(queryRunner);
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
  fetchedAt = new Date('2026-08-05T12:00:00.000Z'),
): MercadoPublicoApiV2CompraAgilListResponse => {
  const contentFingerprint = records.map((record) => record.codigo).join('-');

  return {
    endpoint: 'list',
    source: 'api-v2-compra-agil',
    requestParams: {
      cambio_desde: '2026-08-01T00:00:00Z',
      numero_pagina: pageNumber,
    },
    requestFingerprint: `request-${pageNumber}-${contentFingerprint}`,
    payloadChecksum: `payload-${pageNumber}-${contentFingerprint}`,
    schemaFingerprint: 'schema-fingerprint',
    httpStatus: 200,
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
      hasNextPage: false,
    },
  };
};

const createRecord = (
  codigo: string,
  overrides: Partial<MercadoPublicoApiV2CompraAgilRecord> = {},
  providerChangedAt: string | null = '2026-08-05T10:00:00Z',
): MercadoPublicoApiV2CompraAgilRecord => ({
  codigo,
  nombre: codigo,
  estado: { codigo: 'publicada', glosa: 'Publicada' },
  fechas: {
    ...(providerChangedAt === null
      ? {}
      : { fecha_ultimo_cambio: providerChangedAt }),
    fecha_publicacion: '2026-08-01T10:00:00',
  },
  institucion: { rut: '60.000.000-0', organismo_comprador: 'Buyer' },
  montos: { moneda: 'CLP', monto_disponible: 1000 },
  documentos: [],
  ...overrides,
});

describe('Mercado Publico V2 evidence, history and replay (db-backed)', () => {
  let dataSource: DataSource;
  let clientService: jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
  let durableSyncService: MercadoPublicoV2DurableSyncService;
  let replayService: MercadoPublicoV2EvidenceReplayService;

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
    durableSyncService = new MercadoPublicoV2DurableSyncService(
      clientService,
      new MercadoPublicoPersistenceService(dataSource),
      dataSource,
      new MercadoPublicoV2ProjectionService(dataSource),
    );
    replayService = new MercadoPublicoV2EvidenceReplayService(
      new MercadoPublicoPersistenceService(dataSource),
      new MercadoPublicoV2ProjectionService(dataSource),
      dataSource,
    );
  });

  afterAll(async () => {
    await truncateTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('shares one blob per identical payload but records one observation per accepted request', async () => {
    await durableSyncService.runFixture(fixture);
    await durableSyncService.runFixture(fixture);

    const blobCount = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.raw_api_payload`,
    );
    const observationCount = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.v2_observation`,
    );
    const distinctBlobReferences = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(DISTINCT raw_api_payload_id)::text AS count FROM mp.v2_observation`,
    );

    expect(blobCount[0]?.count).toBe('1');
    expect(observationCount[0]?.count).toBe('2');
    expect(distinctBlobReferences[0]?.count).toBe('1');
  });

  it('keeps provenance from evidence through staging, current, gold and children', async () => {
    await durableSyncService.runFixture(fixture);

    const observations = await dataSource.query<
      {
        id: string;
        codigo: string;
        source: string;
        snapshot_kind: string;
        request_fingerprint: string;
        semantic_fingerprint: string;
        provider_changed_at_raw: string;
        provider_changed_at: Date | null;
        raw_api_payload_id: string;
      }[]
    >(`SELECT * FROM mp.v2_observation`);
    const observation = observations[0];

    expect(observations).toHaveLength(1);
    expect(observation?.source).toBe('api-v2-compra-agil');
    expect(observation?.snapshot_kind).toBe('list');
    expect(observation?.request_fingerprint).not.toBeNull();
    expect(observation?.semantic_fingerprint).not.toBeNull();
    expect(observation?.provider_changed_at_raw).toBe('not-a-date');
    expect(observation?.provider_changed_at).toBeNull();

    const staging = await dataSource.query<
      { observation_id: string; amount_raw: string }[]
    >(
      `SELECT observation_id, amount_raw FROM mp.stg_api_v2_compra_agil WHERE codigo = 'FIXTURE-CA-001'`,
    );
    const canonical = await dataSource.query<
      { observation_id: string; amount_raw: string }[]
    >(
      `SELECT observation_id, amount_raw FROM mp.compra_agil WHERE codigo = 'FIXTURE-CA-001'`,
    );
    const gold = await dataSource.query<
      { observation_id: string; amount_raw: string }[]
    >(
      `SELECT observation_id, amount_raw FROM mp.gold_detected_process WHERE process_code = 'FIXTURE-CA-001'`,
    );
    const children = await dataSource.query<
      {
        observation_id: string;
        array_name: string;
        provider_key: string;
        ordinal: number;
        element_json: unknown;
      }[]
    >(
      `SELECT observation_id, array_name, provider_key, ordinal, element_json FROM mp.v2_child_evidence`,
    );

    expect(staging).toEqual([
      { observation_id: observation?.id, amount_raw: '1500000' },
    ]);
    expect(canonical).toEqual([
      { observation_id: observation?.id, amount_raw: '1500000' },
    ]);
    expect(gold).toEqual([
      { observation_id: observation?.id, amount_raw: '1500000' },
    ]);
    expect(children).toEqual([
      {
        observation_id: observation?.id,
        array_name: 'documentos',
        provider_key: '77',
        ordinal: 0,
        element_json: { id: 77, nombre: 'Bases técnicas.pdf' },
      },
    ]);
  });

  it('appends history only on semantic change with before/after and source observations', async () => {
    const first = createRecord('CA-HISTORY', {
      nombre: 'Alpha',
    });
    clientService.getList.mockResolvedValueOnce(createResponse([first]));
    clientService.getByCodigo.mockResolvedValueOnce(createResponse([first]));
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const unchanged = createRecord('CA-HISTORY', {
      nombre: 'Alpha',
    });
    clientService.getList.mockResolvedValueOnce(createResponse([unchanged]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([unchanged], 1, 1, new Date('2026-08-06T12:00:00.000Z')),
    );
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const changed = createRecord('CA-HISTORY', {
      nombre: 'Beta',
    });
    clientService.getList.mockResolvedValueOnce(createResponse([changed]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([changed], 1, 1, new Date('2026-08-07T12:00:00.000Z')),
    );
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const historyRows = await dataSource.query<
      {
        codigo: string;
        before_title: string | null;
        after_title: string | null;
        previous_observation_id: string | null;
        new_observation_id: string;
      }[]
    >(
      `
        SELECT
          h.codigo,
          h.before_json::jsonb->>'title' AS before_title,
          h.after_json::jsonb->>'title' AS after_title,
          h.previous_observation_id,
          h.new_observation_id
        FROM mp.v2_history h
      `,
    );
    const observations = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM mp.v2_observation WHERE codigo = 'CA-HISTORY' ORDER BY observed_at ASC`,
    );

    expect(historyRows).toHaveLength(1);
    expect(historyRows[0]).toMatchObject({
      codigo: 'CA-HISTORY',
      before_title: 'Alpha',
      after_title: 'Beta',
      previous_observation_id: observations[1]?.id,
      new_observation_id: observations[2]?.id,
    });
  });

  it('distinguishes observations by codigo, provider change and payload hash even with defective timestamps', async () => {
    const first = createRecord(
      'CA-DEFECTIVE',
      { nombre: 'First' },
      'not-a-date',
    );
    clientService.getList.mockResolvedValueOnce(createResponse([first]));
    clientService.getByCodigo.mockResolvedValueOnce(createResponse([first]));
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const second = createRecord(
      'CA-DEFECTIVE',
      { nombre: 'Second' },
      'not-a-date',
    );
    clientService.getList.mockResolvedValueOnce(createResponse([second]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([second], 1, 1, new Date('2026-08-06T12:00:00.000Z')),
    );
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const third = createRecord('CA-DEFECTIVE', {
      nombre: 'Third',
    });
    clientService.getList.mockResolvedValueOnce(createResponse([third]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([third], 1, 1, new Date('2026-08-07T12:00:00.000Z')),
    );
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const fourth = createRecord('CA-DEFECTIVE', { nombre: 'Fourth' }, null);
    clientService.getList.mockResolvedValueOnce(createResponse([fourth]));
    clientService.getByCodigo.mockResolvedValueOnce(
      createResponse([fourth], 1, 1, new Date('2026-08-08T12:00:00.000Z')),
    );
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const observations = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.v2_observation WHERE codigo = 'CA-DEFECTIVE'`,
    );
    const canonical = await dataSource.query<
      { title: string | null; provider_changed_at_raw: string | null }[]
    >(
      `SELECT title, provider_changed_at_raw FROM mp.compra_agil WHERE codigo = 'CA-DEFECTIVE'`,
    );
    const history = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.v2_history WHERE codigo = 'CA-DEFECTIVE'`,
    );

    expect(observations[0]?.count).toBe('4');
    expect(canonical).toEqual([
      { title: 'Third', provider_changed_at_raw: '2026-08-05T10:00:00Z' },
    ]);
    expect(history[0]?.count).toBe('2');
  });

  it('replays retained evidence without calling the provider and recreates missing projections idempotently', async () => {
    const first = createRecord('CA-REPLAY-1', { nombre: 'Replay one' });
    const second = createRecord('CA-REPLAY-2', { nombre: 'Replay two' });
    clientService.getList.mockResolvedValueOnce(
      createResponse([first, second]),
    );
    clientService.getByCodigo.mockImplementation(async (codigo) =>
      createResponse(
        codigo === 'CA-REPLAY-1'
          ? [first]
          : codigo === 'CA-REPLAY-2'
            ? [second]
            : [],
      ),
    );
    const sourceRun = await durableSyncService.start({
      cambio_desde: '2026-08-01T00:00:00Z',
    });
    const observationsBefore = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.v2_observation`,
    );
    const watermarksBefore = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.source_watermark`,
    );

    await dataSource.query(`DELETE FROM mp.compra_agil`);
    await dataSource.query(`DELETE FROM mp.gold_detected_process`);

    const replayed = await replayService.replay(sourceRun.syncRunId);
    const canonical = await dataSource.query<
      { codigo: string; title: string | null }[]
    >(`SELECT codigo, title FROM mp.compra_agil ORDER BY codigo ASC`);
    const observationsAfter = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.v2_observation`,
    );
    const watermarksAfter = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.source_watermark`,
    );

    expect(replayed).toMatchObject({
      intent: 'replay',
      status: 'succeeded',
      recordsCreated: 2,
      recordsSkipped: 0,
      recordsFailed: 0,
    });
    expect(canonical).toEqual([
      { codigo: 'CA-REPLAY-1', title: 'Replay one' },
      { codigo: 'CA-REPLAY-2', title: 'Replay two' },
    ]);
    expect(observationsAfter[0]?.count).toBe(observationsBefore[0]?.count);
    expect(watermarksAfter[0]?.count).toBe(watermarksBefore[0]?.count);
    expect(clientService.getList).toHaveBeenCalledTimes(1);
    expect(clientService.getByCodigo).toHaveBeenCalledTimes(2);

    const replayedAgain = await replayService.replay(sourceRun.syncRunId);

    expect(replayedAgain).toMatchObject({
      status: 'succeeded',
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 2,
    });
    const historyCount = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.v2_history`,
    );
    expect(historyCount[0]?.count).toBe('0');
  });

  it('backfills missing current rows for active cohort members with retained evidence', async () => {
    const record = createRecord('CA-BACKFILL', { nombre: 'Backfill me' });
    clientService.getList.mockResolvedValueOnce(createResponse([record]));
    clientService.getByCodigo.mockResolvedValueOnce(createResponse([record]));
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });
    await dataSource.query(
      `DELETE FROM mp.compra_agil WHERE codigo = 'CA-BACKFILL'`,
    );

    const backfilled = await replayService.backfill('global');
    const canonical = await dataSource.query<
      { codigo: string; title: string | null }[]
    >(`SELECT codigo, title FROM mp.compra_agil WHERE codigo = 'CA-BACKFILL'`);

    expect(backfilled).toMatchObject({
      intent: 'backfill',
      status: 'succeeded',
      recordsCreated: 1,
      recordsFailed: 0,
    });
    expect(canonical).toEqual([
      { codigo: 'CA-BACKFILL', title: 'Backfill me' },
    ]);
  });

  it('preserves null, empty, zero, decimal, currency and the three time classes', async () => {
    const precise = createRecord(
      'CA-SCALARS',
      {
        nombre: '',
        estado: { codigo: 'publicada', glosa: '' },
        institucion: undefined,
        montos: { moneda: 'USD', monto_disponible: '1000.005' },
        documentos: [],
      },
      'not-a-date',
    );
    const zero = createRecord(
      'CA-ZERO',
      {
        montos: { moneda: '', monto_disponible: '0' },
      },
      null,
    );
    const missing = createRecord(
      'CA-MISSING',
      {
        nombre: undefined,
        institucion: undefined,
      },
      null,
    );
    clientService.getList.mockResolvedValueOnce(
      createResponse([precise, zero, missing]),
    );
    clientService.getByCodigo.mockImplementation(async (codigo) =>
      createResponse(
        codigo === 'CA-SCALARS'
          ? [precise]
          : codigo === 'CA-ZERO'
            ? [zero]
            : codigo === 'CA-MISSING'
              ? [missing]
              : [],
      ),
    );
    await durableSyncService.start({ cambio_desde: '2026-08-01T00:00:00Z' });

    const rows = await dataSource.query<
      {
        codigo: string;
        title: string | null;
        estado: string | null;
        state_label: string | null;
        amount: string | null;
        amount_raw: string | null;
        currency_source: string | null;
        document_count: number | null;
        provider_changed_at_raw: string | null;
        provider_changed_at: Date | null;
        observed_at: Date | null;
        persisted_at: Date | null;
      }[]
    >(
      `
        SELECT
          codigo, title, estado, state_label, amount, amount_raw,
          currency_source, document_count, provider_changed_at_raw,
          provider_changed_at, observed_at, persisted_at
        FROM mp.compra_agil
        WHERE codigo IN ('CA-SCALARS', 'CA-ZERO', 'CA-MISSING')
        ORDER BY codigo ASC
      `,
    );

    expect(rows).toEqual([
      {
        codigo: 'CA-MISSING',
        title: null,
        estado: 'publicada',
        state_label: 'Publicada',
        amount: '1000.00',
        amount_raw: '1000',
        currency_source: 'CLP',
        document_count: 0,
        provider_changed_at_raw: null,
        provider_changed_at: null,
        observed_at: new Date('2026-08-05T12:00:00.000Z'),
        persisted_at: expect.any(Date),
      },
      {
        codigo: 'CA-SCALARS',
        title: '',
        estado: 'publicada',
        state_label: '',
        amount: '1000.01',
        amount_raw: '1000.005',
        currency_source: 'USD',
        document_count: 0,
        provider_changed_at_raw: 'not-a-date',
        provider_changed_at: null,
        observed_at: new Date('2026-08-05T12:00:00.000Z'),
        persisted_at: expect.any(Date),
      },
      {
        codigo: 'CA-ZERO',
        title: 'CA-ZERO',
        estado: 'publicada',
        state_label: 'Publicada',
        amount: '0.00',
        amount_raw: '0',
        currency_source: '',
        document_count: 0,
        provider_changed_at_raw: null,
        provider_changed_at: null,
        observed_at: new Date('2026-08-05T12:00:00.000Z'),
        persisted_at: expect.any(Date),
      },
    ]);
  });
});
