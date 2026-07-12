import crypto from 'crypto';

import { type DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpStgApiV1LicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007810-mp-stg-api-v1-licitacion';
import { MpStgApiV1OrdenCompraFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007820-mp-stg-api-v1-orden-compra';
import { MpStgApiV2CompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007830-mp-stg-api-v2-compra-agil';
import { MpStgCsvOrdenCompraFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007840-mp-stg-csv-orden-compra';
import { MpStgCsvLicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007850-mp-stg-csv-licitacion';
import { MpCanonicalLicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007860-mp-canonical-licitacion';
import { MpCanonicalOrdenCompraFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007870-mp-canonical-orden-compra';
import { MpCanonicalCompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007880-mp-canonical-compra-agil';
import { MpReconciliationPublicMarketEntitiesFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007890-mp-reconciliation-public-market-entities';
import { MpReconciliationEventFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007900-mp-reconciliation-event';
import { MpGoldReadObjectsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007910-mp-gold-read-objects';
import { MpRawCsvFileDedupeModalityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007920-mp-raw-csv-file-dedupe-modality';
import { DropRawCsvFileIngestionJobIdFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615514-drop-raw-csv-file-ingestion-job-id';
import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import {
  MERCADO_PUBLICO_RECONCILIATION_MATCHED_BY,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V2_COMPRA_AGIL,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_MEDIUM,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_LOW,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_UNKNOWN,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoReconciliationService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-reconciliation.service';

const ALL_RECONCILIATION_TABLES = `
  mp.licitacion_adjudicacion,
  mp.licitacion_oferta,
  mp.licitacion_item,
  mp.licitacion,
  mp.orden_compra_item,
  mp.orden_compra,
  mp.compra_agil_cotizacion,
  mp.compra_agil_producto_solicitado,
  mp.compra_agil,
  mp.stg_csv_orden_compra,
  mp.stg_csv_licitacion,
  mp.stg_api_v2_compra_agil,
  mp.stg_api_v1_orden_compra,
  mp.stg_api_v1_licitacion,
  mp.reconciliation_public_market_entities,
  mp.reconciliation_event,
  mp.gold_detected_process,
  mp.gold_pipeline_health,
  mp.gold_api_quota_usage,
  mp.gold_csv_file_health,
  mp.gold_conciliacion_licitacion_oc,
  mp.raw_csv_row,
  mp.raw_csv_file,
  mp.raw_api_payload,
  mp.stg_job_run
`;

const truncateMercadoPublicoTables = async (dataSource: DataSource) => {
  await dataSource.query(
    `TRUNCATE TABLE ${ALL_RECONCILIATION_TABLES} RESTART IDENTITY CASCADE`,
  );
};

const applyMercadoPublicoReconciliationCommands = async (
  dataSource: DataSource,
) => {
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
    await new MpStgApiV1LicitacionFastInstanceCommand().up(queryRunner);
    await new MpStgApiV1OrdenCompraFastInstanceCommand().up(queryRunner);
    await new MpStgApiV2CompraAgilFastInstanceCommand().up(queryRunner);
    await new MpStgCsvOrdenCompraFastInstanceCommand().up(queryRunner);
    await new MpStgCsvLicitacionFastInstanceCommand().up(queryRunner);
    await new MpCanonicalLicitacionFastInstanceCommand().up(queryRunner);
    await new MpCanonicalOrdenCompraFastInstanceCommand().up(queryRunner);
    await new MpCanonicalCompraAgilFastInstanceCommand().up(queryRunner);
    await new MpReconciliationPublicMarketEntitiesFastInstanceCommand().up(
      queryRunner,
    );
    await new MpReconciliationEventFastInstanceCommand().up(queryRunner);
    await new MpGoldReadObjectsFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileDedupeModalityFastInstanceCommand().up(queryRunner);
    await new DropRawCsvFileIngestionJobIdFastInstanceCommand().up(queryRunner);
    await new MpStgJobRunRawCsvFileLinkSlowInstanceCommand().up(queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

const makeUuid = () => crypto.randomUUID();

const makeFetchedAt = () => new Date('2026-07-01T12:00:00.000Z');

const makeFingerprint = () => crypto.randomBytes(16).toString('hex');

/**
 * Insert a minimal raw_api_payload row for staging FK references.
 */
const insertRawApiPayload = async (
  dataSource: DataSource,
  input: {
    id: string;
    source: string;
    endpoint: string;
    rawPayload: Record<string, unknown>;
  },
) => {
  const fingerprint = makeFingerprint();
  const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(input.rawPayload))
    .digest('hex');
  const schemaFingerprint = crypto.randomBytes(16).toString('hex');

  await dataSource.query(
    `
      INSERT INTO mp.raw_api_payload (
        id,
        source,
        endpoint,
        request_fingerprint,
        payload_checksum,
        request_params,
        http_status,
        fetched_at,
        raw_payload,
        schema_fingerprint,
        records_fetched
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::jsonb, $10, $11)
    `,
    [
      input.id,
      input.source,
      input.endpoint,
      fingerprint,
      checksum,
      JSON.stringify({}),
      200,
      makeFetchedAt(),
      JSON.stringify(input.rawPayload),
      schemaFingerprint,
      1,
    ],
  );
};

/**
 * Insert a minimal raw_csv_file + raw_csv_row row combo for staging FK references.
 */
const insertRawCsvFile = async (
  dataSource: DataSource,
  input: {
    fileId: string;
    sourceDataset: string;
    sourcePeriod: string;
    fileName: string;
    checksum: string;
  },
) => {
  await dataSource.query(
    `
      INSERT INTO mp.raw_csv_file (
        id,
        source_system,
        source_dataset,
        source_url,
        source_file_name,
        source_period,
        downloaded_at,
        file_checksum,
        file_size_bytes,
        detected_encoding,
        detected_delimiter,
        quotechar,
        header_raw,
        observed_columns,
        column_count,
        schema_fingerprint,
        row_count
      )
      VALUES ($1, 'datos-abiertos', $2, 'https://example.com/test.csv', $3, $4, '2026-06-01T00:00:00Z', $5, 128, 'utf-8', ';', '"', 'col1;col2', '["col1","col2"]'::jsonb, 2, 'fp-1', 1)
    `,
    [
      input.fileId,
      input.sourceDataset,
      input.fileName,
      input.sourcePeriod,
      input.checksum,
    ],
  );
};

const insertRawCsvRow = async (
  dataSource: DataSource,
  input: {
    rowId: string;
    fileId: string;
    sourceDataset: string;
    sourcePeriod: string;
    fileName: string;
    rowNumber: number;
    rawRowText: string;
    rawRowJson: Record<string, string>;
  },
) => {
  const rowChecksum = crypto
    .createHash('sha256')
    .update(input.rawRowText)
    .digest('hex');

  await dataSource.query(
    `
      INSERT INTO mp.raw_csv_row (
        id,
        raw_csv_file_id,
        source_dataset,
        source_file_name,
        source_period,
        row_number,
        raw_row_text,
        raw_row_json,
        row_checksum,
        parse_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, 'success')
    `,
    [
      input.rowId,
      input.fileId,
      input.sourceDataset,
      input.fileName,
      input.sourcePeriod,
      input.rowNumber,
      input.rawRowText,
      JSON.stringify(input.rawRowJson),
      rowChecksum,
    ],
  );
};

const insertJobRun = async (
  dataSource: DataSource,
  input: {
    id: string;
    jobName: string;
    status: string;
    rawCsvFileId?: string | null;
  },
) => {
  const jobRunId = makeUuid();

  await dataSource.query(
    `
      INSERT INTO mp.stg_job_run (
        id,
        job_name,
        job_run_id,
        status,
        started_at,
        finished_at,
        raw_csv_file_id,
        records_fetched,
        records_staged,
        records_canonicalized,
        records_failed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 1, 1, 0)
    `,
    [
      input.id,
      input.jobName,
      jobRunId,
      input.status,
      new Date('2026-06-30T12:00:00.000Z'),
      input.status === 'success' ? new Date('2026-06-30T12:05:00.000Z') : null,
      input.rawCsvFileId ?? null,
    ],
  );
};

describe('Mercado Publico reconciliation refresh (db-backed)', () => {
  let dataSource: DataSource;
  let reconciliationService: MercadoPublicoReconciliationService;

  beforeAll(async () => {
    jest.useRealTimers();

    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyMercadoPublicoReconciliationCommands(dataSource);

    reconciliationService = new MercadoPublicoReconciliationService(dataSource);
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

  // -- exact_codigo_externo --
  it('records exact_codigo_externo when API and CSV licitacion share CodigoExterno', async () => {
    const apiPayloadId = makeUuid();
    const csvFileId = makeUuid();
    const csvRowId = makeUuid();
    const apiJobRunId = makeUuid();
    const csvJobRunId = makeUuid();

    await insertRawApiPayload(dataSource, {
      id: apiPayloadId,
      source: 'api-v1-licitaciones',
      endpoint: 'by-date',
      rawPayload: { Listado: [] },
    });
    await insertJobRun(dataSource, {
      id: apiJobRunId,
      jobName: 'api-v1-licitaciones-by-date',
      status: 'success',
    });
    await insertJobRun(dataSource, {
      id: csvJobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
    });

    await insertRawCsvFile(dataSource, {
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'licitaciones-2026-06.csv',
      checksum: 'sha-csv-001',
    });
    await insertRawCsvRow(dataSource, {
      rowId: csvRowId,
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'licitaciones-2026-06.csv',
      rowNumber: 1,
      rawRowText: 'L1;col2',
      rawRowJson: { codigo_externo: 'L1', col2: 'val2' },
    });

    await dataSource.query(
      `
        INSERT INTO mp.stg_api_v1_licitacion (
          id, raw_api_payload_id, source, snapshot_kind,
          codigo_externo, codigo, codigo_estado, estado,
          fetched_at
        )
        VALUES ($1, $2, $3, 'list', 'L1', '1', '5', 'Publicada', $4)
      `,
      [
        makeUuid(),
        apiPayloadId,
        MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
        makeFetchedAt(),
      ],
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_csv_licitacion (
          id, raw_csv_row_id, source_dataset, source_period,
          codigo_externo, created_at
        )
        VALUES ($1, $2, 'licitaciones', '2026-06', 'L1', now())
      `,
      [makeUuid(), csvRowId],
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.exactCodigoExterno).toBe(1);
    expect(result.csvApiSameBusinessKey).toBe(0);
    expect(result.exactCodigoLicitacion).toBe(0);
    expect(result.exactCompraAgilIdOrdenCompra).toBe(0);
    expect(result.total).toBe(1);

    const [reconRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE match_type = 'exact_codigo_externo'`,
    );

    expect(reconRow).toBeDefined();
    expect(reconRow.entity_a_source).toBe(
      MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
    );
    expect(reconRow.entity_a_type).toBe('licitacion');
    expect(reconRow.entity_a_key).toBe('L1');
    expect(reconRow.entity_b_source).toBe(
      MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
    );
    expect(reconRow.entity_b_type).toBe('licitacion');
    expect(reconRow.entity_b_key).toBe('L1');
    expect(reconRow.match_confidence).toBe(
      MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE,
    );
    expect(reconRow.review_status).toBe('pending');
  });

  it('records csv_api_same_business_key when API and CSV OC share Codigo', async () => {
    const apiPayloadId = makeUuid();
    const csvFileId = makeUuid();
    const csvRowId = makeUuid();
    const apiJobRunId = makeUuid();
    const csvJobRunId = makeUuid();

    await insertRawApiPayload(dataSource, {
      id: apiPayloadId,
      source: 'api-v1-oc',
      endpoint: 'by-date',
      rawPayload: { Listado: [] },
    });
    await insertJobRun(dataSource, {
      id: apiJobRunId,
      jobName: 'api-v1-oc-by-date',
      status: 'success',
    });
    await insertJobRun(dataSource, {
      id: csvJobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
    });

    await insertRawCsvFile(dataSource, {
      fileId: csvFileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      fileName: 'oc-2026-06.csv',
      checksum: 'sha-csv-oc-001',
    });
    await insertRawCsvRow(dataSource, {
      rowId: csvRowId,
      fileId: csvFileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      fileName: 'oc-2026-06.csv',
      rowNumber: 1,
      rawRowText: 'OC-1;col2',
      rawRowJson: { codigo: 'OC-1' },
    });

    await dataSource.query(
      `
        INSERT INTO mp.stg_api_v1_orden_compra (
          id, raw_api_payload_id, source, snapshot_kind,
          codigo, fetched_at
        )
        VALUES ($1, $2, $3, 'list', 'OC-1', $4)
      `,
      [
        makeUuid(),
        apiPayloadId,
        MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
        makeFetchedAt(),
      ],
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_csv_orden_compra (
          id, raw_csv_row_id, source_dataset, source_period,
          codigo, created_at
        )
        VALUES ($1, $2, 'oc', '2026-06', 'OC-1', now())
      `,
      [makeUuid(), csvRowId],
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.csvApiSameBusinessKey).toBe(1);
    expect(result.total).toBe(1);

    const [reconRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE match_type = 'csv_api_same_business_key'`,
    );

    expect(reconRow).toBeDefined();
    expect(reconRow.entity_a_key).toBe('OC-1');
    expect(reconRow.entity_b_key).toBe('OC-1');
  });

  it('records exact_codigo_licitacion when OC.CodigoLicitacion matches licitacion.CodigoExterno', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('L1', 'publicada')
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.orden_compra (codigo, codigo_licitacion, canonical_state)
        VALUES ('OC-1', 'L1', 'aceptada')
      `,
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.exactCodigoLicitacion).toBe(1);
    expect(result.total).toBe(1);

    const [reconRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE match_type = 'exact_codigo_licitacion'`,
    );

    expect(reconRow).toBeDefined();
    expect(reconRow.entity_a_key).toBe('L1');
    expect(reconRow.entity_b_key).toBe('OC-1');
  });

  it('records exact_compra_agil_id_orden_compra via id_orden_compra', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.compra_agil (codigo, id_orden_compra, id_oc)
        VALUES ('CA-1', 'OC-123', NULL)
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.orden_compra (codigo, canonical_state)
        VALUES ('OC-123', 'aceptada')
      `,
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.exactCompraAgilIdOrdenCompra).toBe(1);
    expect(result.total).toBe(1);

    const [reconRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE match_type = 'exact_compra_agil_id_orden_compra'`,
    );

    expect(reconRow).toBeDefined();
    expect(reconRow.entity_a_key).toBe('CA-1');
    expect(reconRow.entity_b_key).toBe('OC-123');
  });

  it('records exact_compra_agil_id_orden_compra via id_oc fallback when id_orden_compra is null', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.compra_agil (codigo, id_orden_compra, id_oc)
        VALUES ('CA-2', NULL, 'OC-456')
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.orden_compra (codigo, canonical_state)
        VALUES ('OC-456', 'aceptada')
      `,
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.exactCompraAgilIdOrdenCompra).toBe(1);
    expect(result.total).toBe(1);
  });

  it('does NOT match when both id_orden_compra and id_oc are null', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.compra_agil (codigo, id_orden_compra, id_oc)
        VALUES ('CA-3', NULL, NULL)
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.orden_compra (codigo, canonical_state)
        VALUES ('OC-789', 'aceptada')
      `,
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.exactCompraAgilIdOrdenCompra).toBe(0);
    expect(result.total).toBe(0);
  });

  it('does NOT join Compra Agil to licitacion via CodigoLicitacion', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('L10', 'publicada')
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.compra_agil (codigo, codigo_orden_compra, id_orden_compra, id_oc)
        VALUES ('CA-10', 'L10', NULL, NULL)
      `,
    );

    const result = await reconciliationService.refreshAllExactReconciliation();

    expect(result.exactCodigoLicitacion).toBe(0);
    expect(result.total).toBe(0);

    const rows = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE entity_a_type = 'compra_agil' AND entity_b_type = 'licitacion'`,
    );

    expect(rows).toHaveLength(0);
  });

  // -- heuristic: candidate_supplier_amount --
  it('records candidate_supplier_amount when nombre_proveedor matches with exact amount ratio=0', async () => {
    const apiPayloadId = makeUuid();
    const csvFileId = makeUuid();
    const csvRowId = makeUuid();
    const apiJobRunId = makeUuid();
    const csvJobRunId = makeUuid();

    await insertRawApiPayload(dataSource, {
      id: apiPayloadId,
      source: 'api-v1-oc',
      endpoint: 'by-state',
      rawPayload: { Listado: [] },
    });
    await insertJobRun(dataSource, {
      id: apiJobRunId,
      jobName: 'api-v1-oc-by-state',
      status: 'success',
    });
    await insertJobRun(dataSource, {
      id: csvJobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
    });

    await insertRawCsvFile(dataSource, {
      fileId: csvFileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      fileName: 'oc-2026-06.csv',
      checksum: 'sha-heur-001',
    });
    await insertRawCsvRow(dataSource, {
      rowId: csvRowId,
      fileId: csvFileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      fileName: 'oc-2026-06.csv',
      rowNumber: 1,
      rawRowText: 'OC-H1;Acme;1000',
      rawRowJson: {
        codigo: 'OC-H1',
        nombre_proveedor: 'Acme',
        monto_total_oc: '1000',
      },
    });

    await dataSource.query(
      `
        INSERT INTO mp.stg_api_v1_orden_compra (
          id, raw_api_payload_id, source, snapshot_kind,
          codigo, nombre_proveedor, monto_total_oc, fetched_at
        )
        VALUES ($1, $2, $3, 'list', 'OC-H1-API', 'Acme', '1000', $4)
      `,
      [
        makeUuid(),
        apiPayloadId,
        MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
        makeFetchedAt(),
      ],
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_csv_orden_compra (
          id, raw_csv_row_id, source_dataset, source_period,
          codigo, nombre_proveedor, monto_total_oc_pesos_chilenos, created_at
        )
        VALUES ($1, $2, 'oc', '2026-06', 'OC-H1-CSV', 'Acme', '1000', now())
      `,
      [makeUuid(), csvRowId],
    );

    const result =
      await reconciliationService.refreshAllHeuristicReconciliation();

    expect(result.candidates).toBeGreaterThanOrEqual(1);

    const [reconRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE match_type = 'candidate_supplier_amount'`,
    );

    expect(reconRow).toBeDefined();
    expect(reconRow.entity_a_key).toBe('OC-H1-API');
    expect(reconRow.entity_b_key).toBe('OC-H1-CSV');
    expect(reconRow.match_confidence).toBe(
      MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_MEDIUM,
    );
  });

  // -- heuristic: candidate_item_amount --
  it('records candidate_item_amount when canonical licitacion_item matches CSV by codigoitem+amount', async () => {
    const csvFileId = makeUuid();
    const csvRowId = makeUuid();
    const csvJobRunId = makeUuid();

    await insertJobRun(dataSource, {
      id: csvJobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
    });
    await insertRawCsvFile(dataSource, {
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'lic-2026-06.csv',
      checksum: 'sha-item-001',
    });
    await insertRawCsvRow(dataSource, {
      rowId: csvRowId,
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'lic-2026-06.csv',
      rowNumber: 1,
      rawRowText: 'L-ITEM;ITEM-1;5000',
      rawRowJson: {
        codigo_externo: 'L-ITEM',
        codigoitem: 'ITEM-1',
        monto_estimado_adjudicado: '5000',
      },
    });

    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('L-ITEM', 'publicada')
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.licitacion_item (
          codigo_externo, codigoitem, monto_estimado
        )
        VALUES ('L-ITEM', 'ITEM-1', 5000.00)
      `,
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_csv_licitacion (
          id, raw_csv_row_id, source_dataset, source_period,
          codigo_externo, codigoitem, monto_estimado_adjudicado, created_at
        )
        VALUES ($1, $2, 'licitaciones', '2026-06', 'L-ITEM', 'ITEM-1', '5000', now())
      `,
      [makeUuid(), csvRowId],
    );

    const result =
      await reconciliationService.refreshAllHeuristicReconciliation();

    expect(result.candidates).toBeGreaterThanOrEqual(1);

    const [reconRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_public_market_entities WHERE match_type = 'candidate_item_amount'`,
    );

    expect(reconRow).toBeDefined();
    expect(reconRow.match_confidence).toBe(
      MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_LOW,
    );
  });

  // -- heuristic: unmatched --
  it('records unmatched when canonical row has no reconciliation links', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('ORPHAN-1', 'publicada')
      `,
    );
    // Insert another canonical row that WILL get an exact match, so unmatched sees only the orphan
    const apiPayloadId = makeUuid();
    const csvFileId = makeUuid();
    const csvRowId = makeUuid();
    const apiJobRunId = makeUuid();
    const csvJobRunId = makeUuid();

    await insertRawApiPayload(dataSource, {
      id: apiPayloadId,
      source: 'api-v1-licitaciones',
      endpoint: 'by-date',
      rawPayload: { Listado: [] },
    });
    await insertJobRun(dataSource, {
      id: apiJobRunId,
      jobName: 'api-v1-licitaciones-by-date',
      status: 'success',
    });
    await insertJobRun(dataSource, {
      id: csvJobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
    });
    await insertRawCsvFile(dataSource, {
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'lic-2026-06.csv',
      checksum: 'sha-matched-001',
    });
    await insertRawCsvRow(dataSource, {
      rowId: csvRowId,
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'lic-2026-06.csv',
      rowNumber: 1,
      rawRowText: 'MATCHED-1',
      rawRowJson: { codigo_externo: 'MATCHED-1' },
    });

    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('MATCHED-1', 'publicada')
      `,
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_api_v1_licitacion (
          id, raw_api_payload_id, source, snapshot_kind,
          codigo_externo, fetched_at
        )
        VALUES ($1, $2, $3, 'list', 'MATCHED-1', $4)
      `,
      [
        makeUuid(),
        apiPayloadId,
        MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
        makeFetchedAt(),
      ],
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_csv_licitacion (
          id, raw_csv_row_id, source_dataset, source_period,
          codigo_externo, created_at
        )
        VALUES ($1, $2, 'licitaciones', '2026-06', 'MATCHED-1', now())
      `,
      [makeUuid(), csvRowId],
    );

    // Run exact first (creates exact_codigo_externo for MATCHED-1), then heuristic
    await reconciliationService.refreshAllExactReconciliation();
    const result =
      await reconciliationService.refreshAllHeuristicReconciliation();

    expect(result.unmatched).toBeGreaterThanOrEqual(1);

    const unmatchedRows = await dataSource.query<
      Array<{ entity_a_key: string; entity_a_type: string }>
    >(
      `SELECT entity_a_key, entity_a_type FROM mp.reconciliation_public_market_entities WHERE match_type = 'unmatched'`,
    );

    const orphanRow = unmatchedRows.find((r) => r.entity_a_key === 'ORPHAN-1');
    expect(orphanRow).toMatchObject({
      entity_a_type: 'licitacion',
    });

    // Verify gold_detected_process was updated
    const goldRows = await dataSource.query<
      Array<{ process_code: string; reconciliation_status: string }>
    >(
      `SELECT process_code, reconciliation_status FROM mp.gold_detected_process WHERE process_code = 'ORPHAN-1'`,
    );

    expect(goldRows).toHaveLength(1);
    expect(goldRows[0].reconciliation_status).toBe('unmatched');
  });

  // -- state_mismatch event --
  it('emits reconciliation_event for state mismatch', async () => {
    const apiPayloadId = makeUuid();
    const csvFileId = makeUuid();
    const csvRowId = makeUuid();
    const apiJobRunId = makeUuid();
    const csvJobRunId = makeUuid();

    await insertRawApiPayload(dataSource, {
      id: apiPayloadId,
      source: 'api-v1-licitaciones',
      endpoint: 'by-date',
      rawPayload: { Listado: [] },
    });
    await insertJobRun(dataSource, {
      id: apiJobRunId,
      jobName: 'api-v1-licitaciones-by-date',
      status: 'success',
    });
    await insertJobRun(dataSource, {
      id: csvJobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
    });
    await insertRawCsvFile(dataSource, {
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'lic-2026-06.csv',
      checksum: 'sha-mismatch-001',
    });
    await insertRawCsvRow(dataSource, {
      rowId: csvRowId,
      fileId: csvFileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-06',
      fileName: 'lic-2026-06.csv',
      rowNumber: 1,
      rawRowText: 'SM-1',
      rawRowJson: { codigo_externo: 'SM-1' },
    });

    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('SM-1', 'publicada')
      `,
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_api_v1_licitacion (
          id, raw_api_payload_id, source, snapshot_kind,
          codigo_externo, codigo_estado, estado, fetched_at, codigo
        )
        VALUES ($1, $2, $3, 'list', 'SM-1', '5', 'Publicada', $4, '100')
      `,
      [
        makeUuid(),
        apiPayloadId,
        MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
        makeFetchedAt(),
      ],
    );

    await dataSource.query(
      `
        INSERT INTO mp.stg_csv_licitacion (
          id, raw_csv_row_id, source_dataset, source_period,
          codigo_externo, created_at
        )
        VALUES ($1, $2, 'licitaciones', '2026-06', 'SM-1', now())
      `,
      [makeUuid(), csvRowId],
    );

    // Create exact_codigo_externo to establish the CSV-API link
    await reconciliationService.refreshAllExactReconciliation();
    // Now run heuristic, which should detect the state_mismatch
    const result =
      await reconciliationService.refreshAllHeuristicReconciliation();

    expect(result.events).toBeGreaterThanOrEqual(1);

    const [eventRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_event WHERE event_type = 'state_mismatch' AND entity_key = 'SM-1'`,
    );

    expect(eventRow).toBeDefined();
    expect(eventRow.event_type).toBe('state_mismatch');
  });

  // -- source_period_rerun_mismatch event --
  it('emits source_period_rerun_mismatch when same period has differing file checksums', async () => {
    const fileIdOlder = makeUuid();
    const fileIdNewer = makeUuid();

    await insertRawCsvFile(dataSource, {
      fileId: fileIdOlder,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      fileName: 'oc-2026-06-v1.csv',
      checksum: 'checksum-older',
    });
    await insertRawCsvFile(dataSource, {
      fileId: fileIdNewer,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      fileName: 'oc-2026-06-v2.csv',
      checksum: 'checksum-newer',
    });

    const result =
      await reconciliationService.refreshAllHeuristicReconciliation();

    expect(result.events).toBeGreaterThanOrEqual(1);

    const [eventRow] = await dataSource.query<Array<Record<string, unknown>>>(
      `SELECT * FROM mp.reconciliation_event WHERE event_type = 'source_period_rerun_mismatch'`,
    );

    expect(eventRow).toBeDefined();
    expect(eventRow.entity_type).toBe('orden_compra');
    expect(eventRow.entity_key).toBe('2026-06');
    expect(eventRow.source_a).toBe(MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV);
    expect(eventRow.source_b).toBe(MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV);
  });

  // -- idempotency --
  it('deduplicates reconciliation_event on rerun by fingerprint', async () => {
    const fileIdA = makeUuid();
    const fileIdB = makeUuid();

    await insertRawCsvFile(dataSource, {
      fileId: fileIdA,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-05',
      fileName: 'lic-2026-05-v1.csv',
      checksum: 'sha-ver-a',
    });
    await insertRawCsvFile(dataSource, {
      fileId: fileIdB,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-05',
      fileName: 'lic-2026-05-v2.csv',
      checksum: 'sha-ver-b',
    });

    await reconciliationService.refreshAllHeuristicReconciliation();

    const [{ count: firstCount }] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.reconciliation_event WHERE event_type = 'source_period_rerun_mismatch'`,
    );

    expect(Number(firstCount)).toBe(1);

    await reconciliationService.refreshAllHeuristicReconciliation();

    const [{ count: secondCount }] = await dataSource.query<
      { count: string }[]
    >(
      `SELECT COUNT(*)::text AS count FROM mp.reconciliation_event WHERE event_type = 'source_period_rerun_mismatch'`,
    );

    expect(Number(secondCount)).toBe(1);
  });

  it('deduplicates reconciliation_public_market_entities on rerun', async () => {
    await dataSource.query(
      `
        INSERT INTO mp.licitacion (codigo_externo, canonical_state)
        VALUES ('DEDUP-1', 'publicada')
      `,
    );
    await dataSource.query(
      `
        INSERT INTO mp.orden_compra (codigo, codigo_licitacion, canonical_state)
        VALUES ('DEDUP-OC-1', 'DEDUP-1', 'aceptada')
      `,
    );

    await reconciliationService.refreshAllExactReconciliation();

    const [{ count: firstCount }] = await dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM mp.reconciliation_public_market_entities WHERE match_type = 'exact_codigo_licitacion'`,
    );

    expect(Number(firstCount)).toBe(1);

    await reconciliationService.refreshAllExactReconciliation();

    const [{ count: secondCount }] = await dataSource.query<
      { count: string }[]
    >(
      `SELECT COUNT(*)::text AS count FROM mp.reconciliation_public_market_entities WHERE match_type = 'exact_codigo_licitacion'`,
    );

    expect(Number(secondCount)).toBe(1);
  });
});
