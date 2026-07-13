import crypto from 'crypto';

import { type DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpRawCsvFileDedupeModalityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007920-mp-raw-csv-file-dedupe-modality';
import { MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615520-mp-raw-csv-file-dedupe-nulls-not-distinct';
import { DropRawCsvFileIngestionJobIdFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615514-drop-raw-csv-file-ingestion-job-id';
import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import {
  MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
  MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
  MERCADO_PUBLICO_CSV_OC_DATASET,
  MERCADO_PUBLICO_CSV_SOURCE_SYSTEM,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

const truncateMercadoPublicoTables = async (dataSource: DataSource) => {
  await dataSource.query(`
    TRUNCATE TABLE
      mp.raw_api_payload,
      mp.raw_csv_row,
      mp.raw_csv_file,
      mp.stg_job_run
    RESTART IDENTITY CASCADE
  `);
};

const applyMercadoPublicoRawLayerCommands = async (dataSource: DataSource) => {
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
    await new MpRawCsvFileDedupeModalityFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand().up(
      queryRunner,
    );
    await new MpStgJobRunRawCsvFileLinkSlowInstanceCommand().up(queryRunner);
    await new DropRawCsvFileIngestionJobIdFastInstanceCommand().up(queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

describe('Mercado Publico raw layer persistence (db-backed)', () => {
  let dataSource: DataSource;
  let persistenceService: MercadoPublicoPersistenceService;

  beforeAll(async () => {
    jest.useRealTimers();

    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyMercadoPublicoRawLayerCommands(dataSource);

    persistenceService = new MercadoPublicoPersistenceService(dataSource);
  });

  beforeEach(async () => {
    await truncateMercadoPublicoTables(dataSource);
  });

  afterAll(async () => {
    await truncateMercadoPublicoTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('creates the mp schema and raw-layer tables with dedupe constraints', async () => {
    const [{ schema_exists: schemaExists }] = await dataSource.query<
      { schema_exists: boolean }[]
    >(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_namespace
        WHERE nspname = 'mp'
      ) AS schema_exists
    `);

    expect(schemaExists).toBe(true);

    const tableRows = await dataSource.query<{ table_name: string }[]>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'mp'
        AND table_name IN (
          'raw_api_payload',
          'raw_csv_file',
          'raw_csv_row',
          'stg_job_run'
        )
      ORDER BY table_name
    `);

    expect(tableRows.map((row) => row.table_name)).toEqual([
      'raw_api_payload',
      'raw_csv_file',
      'raw_csv_row',
      'stg_job_run',
    ]);

    const constraintRows = await dataSource.query<{ conname: string }[]>(`
      SELECT conname
      FROM pg_constraint
      WHERE conname IN (
        'uk_mp_raw_api_payload_dedupe',
        'uk_mp_raw_csv_file_dedupe',
        'uk_mp_raw_csv_row_dedupe'
      )
      ORDER BY conname
    `);

    expect(constraintRows.map((row) => row.conname)).toEqual([
      'uk_mp_raw_api_payload_dedupe',
      'uk_mp_raw_csv_file_dedupe',
      'uk_mp_raw_csv_row_dedupe',
    ]);

    const [{ indnullsnotdistinct: nullsNotDistinct }] = await dataSource.query<
      { indnullsnotdistinct: boolean }[]
    >(`
      SELECT pg_index.indnullsnotdistinct
      FROM pg_index
      JOIN pg_constraint ON pg_constraint.conindid = pg_index.indexrelid
      WHERE pg_constraint.conname = 'uk_mp_raw_csv_file_dedupe'
    `);

    expect(nullsNotDistinct).toBe(true);
  });

  it('dedupes raw_api_payload rows by source endpoint fingerprint and checksum', async () => {
    const firstJobRun = await persistenceService.createJobRun(
      'api-v1-licitaciones-by-date',
    );
    const secondJobRun = await persistenceService.createJobRun(
      'api-v1-licitaciones-by-date',
    );
    const fetchedAt = new Date('2026-06-01T12:00:00.000Z');
    const rawPayload = {
      Listado: [
        {
          CodigoExterno: 'LIC-001',
          Codigo: '1',
          CodigoEstado: '5',
          Estado: 'Publicada',
        },
      ],
    };

    await persistenceService.persistApiFailure({
      jobRunRecordId: firstJobRun.id,
      source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
      endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
      requestFingerprint: 'req-fp-1',
      payloadChecksum: 'payload-sha-1',
      requestParams: { fecha: '01062026' },
      httpStatus: 200,
      fetchedAt,
      rawPayload,
      schemaFingerprint: 'shape-sha-1',
      recordsFetched: 1,
      errorSummaryText: 'soft_miss',
    });

    await persistenceService.persistApiFailure({
      jobRunRecordId: secondJobRun.id,
      source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
      endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
      requestFingerprint: 'req-fp-1',
      payloadChecksum: 'payload-sha-1',
      requestParams: { fecha: '01062026' },
      httpStatus: 200,
      fetchedAt,
      rawPayload,
      schemaFingerprint: 'shape-sha-1',
      recordsFetched: 1,
      errorSummaryText: 'soft_miss',
    });

    const rows = await dataSource.query<
      Array<{
        id: string;
        ingestion_job_id: string | null;
        request_params: { fecha: string };
      }>
    >(
      `
        SELECT id, ingestion_job_id, request_params
        FROM mp.raw_api_payload
        WHERE
          source = $1
          AND endpoint = $2
          AND request_fingerprint = $3
          AND payload_checksum = $4
      `,
      [
        MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
        MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
        'req-fp-1',
        'payload-sha-1',
      ],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].ingestion_job_id).toBe(firstJobRun.id);
    expect(rows[0].request_params).toMatchObject({ fecha: '01062026' });
  });

  it('dedupes raw_csv_file and raw_csv_row rows by their raw-layer keys', async () => {
    const firstFile = await persistenceService.persistCsvDownload({
      sourceSystem: MERCADO_PUBLICO_CSV_SOURCE_SYSTEM,
      sourceDataset: MERCADO_PUBLICO_CSV_OC_DATASET,
      sourceUrl: 'https://example.com/oc-2026-06.csv',
      sourceFileName: 'oc-2026-06.csv',
      sourcePeriod: '2026-06',
      sourceModality: null,
      fileChecksum: 'file-sha-1',
      fileSizeBytes: 128,
      compressionType: null,
    });

    const duplicateFile = await persistenceService.persistCsvDownload({
      sourceSystem: MERCADO_PUBLICO_CSV_SOURCE_SYSTEM,
      sourceDataset: MERCADO_PUBLICO_CSV_OC_DATASET,
      sourceUrl: 'https://example.com/oc-2026-06.csv',
      sourceFileName: 'oc-2026-06.csv',
      sourcePeriod: '2026-06',
      sourceModality: null,
      fileChecksum: 'file-sha-1',
      fileSizeBytes: 128,
      compressionType: null,
    });

    expect(firstFile.deduped).toBe(false);
    expect(duplicateFile.deduped).toBe(true);
    expect(duplicateFile.rawCsvFileId).toBe(firstFile.rawCsvFileId);

    const rawLoadJobRun = await persistenceService.createJobRun(
      'csv-raw-load',
      {
        rawCsvFileId: firstFile.rawCsvFileId,
      },
    );

    const sharedRowChecksum = crypto
      .createHash('sha256')
      .update('1;OC-001;ITEM-001')
      .digest('hex');

    await persistenceService.insertRawCsvRows({
      rows: [
        {
          rawCsvFileId: firstFile.rawCsvFileId,
          ingestionJobId: rawLoadJobRun.id,
          sourceDataset: MERCADO_PUBLICO_CSV_OC_DATASET,
          sourceFileName: 'oc-2026-06.csv',
          sourcePeriod: '2026-06',
          rowNumber: 1,
          rawRowText: 'OC-001;ITEM-001',
          rawRowJson: ['OC-001', 'ITEM-001'],
          rowChecksum: sharedRowChecksum,
          parseStatus: 'success',
          parseError: null,
        },
      ],
    });

    await persistenceService.insertRawCsvRows({
      rows: [
        {
          rawCsvFileId: firstFile.rawCsvFileId,
          ingestionJobId: rawLoadJobRun.id,
          sourceDataset: MERCADO_PUBLICO_CSV_OC_DATASET,
          sourceFileName: 'oc-2026-06.csv',
          sourcePeriod: '2026-06',
          rowNumber: 1,
          rawRowText: 'OC-001;ITEM-001',
          rawRowJson: ['OC-001', 'ITEM-001'],
          rowChecksum: sharedRowChecksum,
          parseStatus: 'success',
          parseError: null,
        },
      ],
    });

    const [{ file_count: fileCount }] = await dataSource.query<
      { file_count: string }[]
    >(
      `
        SELECT COUNT(*)::text AS file_count
        FROM mp.raw_csv_file
        WHERE
          source_dataset = $1
          AND source_period = $2
          AND source_modality IS NULL
          AND file_checksum = $3
      `,
      [MERCADO_PUBLICO_CSV_OC_DATASET, '2026-06', 'file-sha-1'],
    );

    const [{ row_count: rowCount }] = await dataSource.query<
      { row_count: string }[]
    >(
      `
        SELECT COUNT(*)::text AS row_count
        FROM mp.raw_csv_row
        WHERE
          raw_csv_file_id = $1
          AND row_number = $2
          AND row_checksum = $3
      `,
      [firstFile.rawCsvFileId, 1, sharedRowChecksum],
    );

    expect(Number(fileCount)).toBe(1);
    expect(Number(rowCount)).toBe(1);
  });
});
