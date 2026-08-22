import crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type EntityManager } from 'typeorm';

import { type MercadoPublicoApiV2CompraAgilListResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';
import { getV2CompraAgilOrderReferences } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';
import { type MercadoPublicoJobRunStatus } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export type MercadoPublicoJobRunRecord = {
  id: string;
  jobRunId: string;
  startedAt: Date;
};

type FinalizeMercadoPublicoJobRunInput = {
  jobRunRecordId: string;
  status: MercadoPublicoJobRunStatus;
  finishedAt: Date;
  errorSummary?: string;
  recordsFetched?: number;
  recordsStaged?: number;
  recordsCanonicalized?: number;
  recordsFailed?: number;
};

type CreateMercadoPublicoJobRunInput = {
  rawCsvFileId?: string;
};

type PersistMercadoPublicoApiFailureInput = {
  jobRunRecordId: string;
  source: string;
  endpoint: string;
  requestFingerprint: string;
  payloadChecksum: string;
  requestParams: Record<string, unknown>;
  httpStatus: number;
  fetchedAt: Date;
  rawPayload: unknown;
  schemaFingerprint: string;
  recordsFetched: number;
  errorSummaryText: string;
};

type SnapshotKind = 'list' | 'detail';

type PersistMercadoPublicoV2CompraAgilSnapshotInput = {
  jobRunRecordId: string;
  apiResponse: MercadoPublicoApiV2CompraAgilListResponse;
  snapshotKind: SnapshotKind;
  errorSummaryText?: string;
};

type PersistMercadoPublicoV2CompraAgilSnapshotResult = {
  rawApiPayloadId: string;
  recordsFetched: number;
  recordsStaged: number;
  recordsCanonicalized: number;
};

type PersistMercadoPublicoCsvDownloadInput = {
  jobRunRecordId: string;
  sourceSystem: string;
  sourceDataset: string;
  sourceUrl: string;
  sourceFileName: string;
  sourcePeriod: string;
  sourceModality?: string | null;
  fileChecksum: string;
  fileSizeBytes: number;
  compressionType: string | null;
};

type PersistMercadoPublicoCsvDownloadResult = {
  rawCsvFileId: string;
  deduped: boolean;
};

type RawCsvFileRow = {
  id: string;
  source_system: string;
  source_dataset: string;
  source_url: string;
  source_file_name: string;
  source_period: string;
  source_modality: string | null;
  file_checksum: string;
  file_size_bytes: number;
  compression_type: string | null;
};

type UpdateCsvFileProfilingInput = {
  rawCsvFileId: string;
  detectedEncoding: string;
  detectedDelimiter: string;
  quotechar: string | null;
  headerRaw: string;
  observedColumns: string[];
  columnCount: number;
  schemaFingerprint: string;
  rowCount: number;
};

type RawCsvFileMeta = {
  id: string;
  source_dataset: string;
  source_period: string;
  source_modality: string | null;
  source_file_name: string;
  file_checksum: string;
  detected_encoding: string;
  detected_delimiter: string;
  quotechar: string | null;
};

type InsertRawCsvRowInput = {
  rawCsvFileId: string;
  ingestionJobId: string;
  sourceDataset: string;
  sourceFileName: string;
  sourcePeriod: string;
  rowNumber: number;
  rawRowText: string;
  rawRowJson: unknown;
  rowChecksum: string;
  parseStatus: 'success' | 'error';
  parseError: string | null;
};

type InsertStgCsvOrdenCompraRowInput = {
  rawCsvRowId: string;
  sourceDataset: string;
  sourcePeriod: string;
  codigo: string | null;
  sourceId: string | null;
  iditem: string | null;
  codigoLicitacion: string | null;
  fechaEnvio: string | null;
  estado: string | null;
  descripcionTipoOc: string | null;
  codigoAbreviadoTipoOc: string | null;
  codigoTipo: string | null;
  tipoMonedaOc: string | null;
  montoTotalOcPesosChilenos: string | null;
  impuestosOc: string | null;
  unidadCompra: string | null;
  nombreProveedor: string | null;
  codigoProductoOnu: string | null;
  totalLineaNeto: string | null;
  esCompraAgil: string | null;
  esTratoDirecto: string | null;
  formaDePago: string | null;
  codigoConvenioMarco: string | null;
  allObservedFields: unknown;
};

type InsertStgCsvLicitacionRowInput = {
  rawCsvRowId: string;
  sourceDataset: string;
  sourcePeriod: string;
  codigoExterno: string | null;
  codigo: string | null;
  codigoitem: string | null;
  codigoProveedor: string | null;
  rutProveedor: string | null;
  nombreDeLaOferta: string | null;
  estadoOferta: string | null;
  ofertaSeleccionada: string | null;
  cantidadOfertada: string | null;
  valorTotalOfertado: string | null;
  tipoDeAdquisicion: string | null;
  fechaPublicacion: string | null;
  fechaAdjudicacion: string | null;
  estado: string | null;
  nombreUnidad: string | null;
  nombreProductoGenerico: string | null;
  cantidadAdjudicada: string | null;
  montoEstimadoAdjudicado: string | null;
  allObservedFields: unknown;
};

type RawCsvRowForStaging = {
  id: string;
  row_number: number;
  raw_row_json: string[] | null;
  parse_status: string;
};

const STAGING_INSERT_BATCH_SIZE = 500;

@Injectable()
export class MercadoPublicoPersistenceService {
  private hasStgJobRunRawCsvFileIdColumn: boolean | null = null;

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async createJobRun(
    jobName: string,
    input: CreateMercadoPublicoJobRunInput = {},
  ): Promise<MercadoPublicoJobRunRecord> {
    const startedAt = new Date();
    const jobRunId = crypto.randomUUID();
    const shouldLinkRawCsvFile =
      typeof input.rawCsvFileId === 'string' &&
      (await this.stgJobRunSupportsRawCsvFileId());
    const insertedJobRunRows = await this.coreDataSource.query<
      { id: string }[]
    >(
      shouldLinkRawCsvFile
        ? `
            INSERT INTO mp.stg_job_run (
              job_name,
              job_run_id,
              status,
              started_at,
              raw_csv_file_id
            )
            VALUES ($1, $2, 'failed', $3, $4)
            RETURNING id
          `
        : `
            INSERT INTO mp.stg_job_run (
              job_name,
              job_run_id,
              status,
              started_at
            )
            VALUES ($1, $2, 'failed', $3)
            RETURNING id
          `,
      shouldLinkRawCsvFile
        ? [jobName, jobRunId, startedAt, input.rawCsvFileId]
        : [jobName, jobRunId, startedAt],
    );

    return {
      id: insertedJobRunRows[0].id,
      jobRunId,
      startedAt,
    };
  }

  private async stgJobRunSupportsRawCsvFileId(): Promise<boolean> {
    if (this.hasStgJobRunRawCsvFileIdColumn !== null) {
      return this.hasStgJobRunRawCsvFileIdColumn;
    }

    const [row] = await this.coreDataSource.query<{ exists: boolean }[]>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'mp'
            AND table_name = 'stg_job_run'
            AND column_name = 'raw_csv_file_id'
        ) AS exists
      `,
    );

    this.hasStgJobRunRawCsvFileIdColumn = row?.exists ?? false;

    return this.hasStgJobRunRawCsvFileIdColumn;
  }

  async finalizeJobRun(
    input: FinalizeMercadoPublicoJobRunInput,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.stg_job_run
        SET
          status = $2,
          finished_at = $3,
          records_fetched = $4,
          records_staged = $5,
          records_canonicalized = $6,
          records_failed = $7,
          error_summary = $8
        WHERE id = $1
      `,
      [
        input.jobRunRecordId,
        input.status,
        input.finishedAt,
        input.recordsFetched ?? null,
        input.recordsStaged ?? null,
        input.recordsCanonicalized ?? null,
        input.recordsFailed ?? null,
        input.errorSummary ?? null,
      ],
    );
  }

  async recordPipelineHealth(input: {
    jobName: string;
    succeeded: boolean;
  }): Promise<void> {
    // Execution health is distinct from source coverage in mp.sync_run.
    await this.coreDataSource.query(
      `
        INSERT INTO mp.gold_pipeline_health (
          job_name,
          latest_status,
          last_success_at,
          last_failure_at,
          failure_count,
          freshness
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (job_name) DO UPDATE SET
          latest_status = EXCLUDED.latest_status,
          last_success_at = EXCLUDED.last_success_at,
          last_failure_at = EXCLUDED.last_failure_at,
          failure_count = mp.gold_pipeline_health.failure_count + EXCLUDED.failure_count,
          freshness = EXCLUDED.freshness,
          updated_at = now()
      `,
      [
        input.jobName,
        input.succeeded ? 'success' : 'failed',
        input.succeeded ? new Date() : null,
        input.succeeded ? null : new Date(),
        input.succeeded ? 0 : 1,
        input.succeeded ? 'healthy' : 'degraded',
      ],
    );
  }

  async persistApiFailure(
    input: PersistMercadoPublicoApiFailureInput,
  ): Promise<void> {
    await this.coreDataSource.transaction(async (entityManager) => {
      await this.insertRawApiPayload(entityManager, {
        jobRunRecordId: input.jobRunRecordId,
        source: input.source,
        endpoint: input.endpoint,
        requestFingerprint: input.requestFingerprint,
        payloadChecksum: input.payloadChecksum,
        requestParams: input.requestParams,
        httpStatus: input.httpStatus,
        fetchedAt: input.fetchedAt,
        rawPayload: input.rawPayload,
        schemaFingerprint: input.schemaFingerprint,
        errorSummary: input.errorSummaryText,
        recordsFetched: input.recordsFetched,
      });
    });
  }

  private async insertRawApiPayload(
    entityManager: EntityManager,
    input: {
      jobRunRecordId: string;
      source: string;
      endpoint: string;
      requestFingerprint: string;
      payloadChecksum: string;
      requestParams: Record<string, unknown>;
      httpStatus: number;
      fetchedAt: Date;
      rawPayload: unknown;
      schemaFingerprint: string;
      errorSummary?: string;
      recordsFetched?: number;
    },
  ): Promise<string> {
    const insertedRawApiPayloadRows = await entityManager.query<
      { id: string }[]
    >(
      `
        INSERT INTO mp.raw_api_payload (
          source,
          endpoint,
          request_fingerprint,
          payload_checksum,
          request_params,
          http_status,
          fetched_at,
          raw_payload,
          schema_fingerprint,
          ingestion_job_id,
          error_summary,
          records_fetched
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::jsonb,
          $6,
          $7,
          $8::jsonb,
          $9,
          $10,
          $11,
          $12
        )
        ON CONFLICT (
          source,
          endpoint,
          request_fingerprint,
          payload_checksum
        ) DO NOTHING
        RETURNING id
      `,
      [
        input.source,
        input.endpoint,
        input.requestFingerprint,
        input.payloadChecksum,
        JSON.stringify(input.requestParams),
        input.httpStatus,
        input.fetchedAt,
        JSON.stringify(input.rawPayload),
        input.schemaFingerprint,
        input.jobRunRecordId,
        input.errorSummary ?? null,
        input.recordsFetched ?? null,
      ],
    );

    if (insertedRawApiPayloadRows.length > 0) {
      return insertedRawApiPayloadRows[0].id;
    }

    const existingRawApiPayloadRows = await entityManager.query<
      { id: string }[]
    >(
      `
        SELECT id
        FROM mp.raw_api_payload
        WHERE
          source = $1
          AND endpoint = $2
          AND request_fingerprint = $3
          AND payload_checksum = $4
        LIMIT 1
      `,
      [
        input.source,
        input.endpoint,
        input.requestFingerprint,
        input.payloadChecksum,
      ],
    );

    return existingRawApiPayloadRows[0].id;
  }

  async persistV2CompraAgilSnapshot(
    input: PersistMercadoPublicoV2CompraAgilSnapshotInput,
  ): Promise<PersistMercadoPublicoV2CompraAgilSnapshotResult> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const rawApiPayloadId = await this.insertRawApiPayload(entityManager, {
        jobRunRecordId: input.jobRunRecordId,
        source: input.apiResponse.source,
        endpoint: input.apiResponse.endpoint,
        requestFingerprint: input.apiResponse.requestFingerprint,
        payloadChecksum: input.apiResponse.payloadChecksum,
        requestParams: input.apiResponse.requestParams,
        httpStatus: input.apiResponse.httpStatus,
        fetchedAt: input.apiResponse.fetchedAt,
        rawPayload: input.apiResponse.rawPayload,
        schemaFingerprint: input.apiResponse.schemaFingerprint,
        errorSummary: input.errorSummaryText,
        recordsFetched: input.apiResponse.compraAgil.length,
      });

      await this.insertV2CompraAgilStagingRows(
        entityManager,
        rawApiPayloadId,
        input.apiResponse,
        input.snapshotKind,
      );

      return {
        rawApiPayloadId,
        recordsFetched: input.apiResponse.compraAgil.length,
        recordsStaged: input.apiResponse.compraAgil.length,
        recordsCanonicalized: 0,
      };
    });
  }

  private async insertV2CompraAgilStagingRows(
    entityManager: EntityManager,
    rawApiPayloadId: string,
    apiResponse: MercadoPublicoApiV2CompraAgilListResponse,
    snapshotKind: SnapshotKind,
  ): Promise<void> {
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const flushBatch = async () => {
      if (placeholders.length === 0) {
        return;
      }

      await entityManager.query(
        `
          INSERT INTO mp.stg_api_v2_compra_agil (
            raw_api_payload_id,
            source,
            snapshot_kind,
            codigo,
            estado,
            estado_id,
            estado_glosa,
            id_orden_compra,
            id_oc,
            codigo_orden_compra,
            publicado_desde,
            publicado_hasta,
            cambio_desde,
            cambio_hasta,
            fetched_at,
            provider_changed_at_raw,
            provider_changed_at,
            observed_at,
            persisted_at,
            title,
            buyer_code,
            buyer_name,
            region,
            published_at,
            closing_at,
            amount,
            amount_raw,
            currency_source,
            document_count
          )
          VALUES ${placeholders.join(', ')}
        `,
        params,
      );

      placeholders.length = 0;
      params.length = 0;
      paramIndex = 1;
    };

    for (const compraAgilItem of apiResponse.compraAgil) {
      const orderReferences = getV2CompraAgilOrderReferences(compraAgilItem);

      const normalized = normalizeV2CompraAgilRecord(compraAgilItem);
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16}, $${paramIndex + 17}, $${paramIndex + 18}, $${paramIndex + 19}, $${paramIndex + 20}, $${paramIndex + 21}, $${paramIndex + 22}, $${paramIndex + 23}, $${paramIndex + 24}, $${paramIndex + 25}, $${paramIndex + 26}, $${paramIndex + 27}, $${paramIndex + 28})`,
      );
      params.push(
        rawApiPayloadId,
        apiResponse.source,
        snapshotKind,
        coerceToNullableString(compraAgilItem.codigo),
        normalized.stateCode,
        normalized.stateId,
        normalized.stateLabel,
        orderReferences.idOrdenCompra,
        orderReferences.idOc,
        orderReferences.codigoOrdenCompra,
        coerceToNullableString(compraAgilItem.publicado_desde),
        coerceToNullableString(compraAgilItem.publicado_hasta),
        coerceToNullableString(compraAgilItem.cambio_desde),
        coerceToNullableString(compraAgilItem.cambio_hasta),
        apiResponse.fetchedAt,
        normalized.providerChangedAtRaw,
        normalized.providerChangedAt,
        apiResponse.fetchedAt,
        new Date(),
        normalized.title,
        normalized.buyerCode,
        normalized.buyerName,
        normalized.region,
        normalized.publishedAt,
        normalized.closingAt,
        normalized.amount,
        normalized.amountRaw,
        normalized.currency,
        normalized.documentCount,
      );
      paramIndex += 29;

      if (placeholders.length >= STAGING_INSERT_BATCH_SIZE) {
        await flushBatch();
      }
    }

    await flushBatch();
  }

  async persistCsvDownload(
    input: PersistMercadoPublicoCsvDownloadInput,
  ): Promise<PersistMercadoPublicoCsvDownloadResult> {
    const now = new Date();

    return this.coreDataSource.transaction(async (entityManager) => {
      const insertedRows = await entityManager.query<{ id: string }[]>(
        `
          INSERT INTO mp.raw_csv_file (
            source_system,
            source_dataset,
            source_url,
            source_file_name,
            source_period,
            source_modality,
            downloaded_at,
            file_checksum,
            file_size_bytes,
            compression_type,
            detected_encoding,
            detected_delimiter,
            quotechar,
            header_raw,
            observed_columns,
            column_count,
            schema_fingerprint,
            row_count
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            'latin-1',
            ';',
            NULL,
            '',
            '[]'::jsonb,
            0,
            '',
            0
          )
          ON CONFLICT (source_dataset, source_period, source_modality, file_checksum) DO NOTHING
          RETURNING id
        `,
        [
          input.sourceSystem,
          input.sourceDataset,
          input.sourceUrl,
          input.sourceFileName,
          input.sourcePeriod,
          input.sourceModality ?? null,
          now,
          input.fileChecksum,
          input.fileSizeBytes,
          input.compressionType,
        ],
      );

      if (insertedRows.length > 0) {
        return { rawCsvFileId: insertedRows[0].id, deduped: false };
      }

      const existingRows = await entityManager.query<{ id: string }[]>(
        `
          SELECT id
          FROM mp.raw_csv_file
          WHERE
            source_dataset = $1
            AND source_period = $2
            AND source_modality IS NOT DISTINCT FROM $3
            AND file_checksum = $4
          LIMIT 1
        `,
        [
          input.sourceDataset,
          input.sourcePeriod,
          input.sourceModality ?? null,
          input.fileChecksum,
        ],
      );

      return { rawCsvFileId: existingRows[0].id, deduped: true };
    });
  }

  async getRawCsvFileById(rawCsvFileId: string): Promise<RawCsvFileRow | null> {
    const rows = await this.coreDataSource.query<RawCsvFileRow[]>(
      `
        SELECT
          id,
          source_system,
          source_dataset,
          source_url,
          source_file_name,
          source_period,
          source_modality,
          file_checksum,
          file_size_bytes,
          compression_type
        FROM mp.raw_csv_file
        WHERE id = $1
      `,
      [rawCsvFileId],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  async updateCsvFileProfiling(
    input: UpdateCsvFileProfilingInput,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.raw_csv_file
        SET
          detected_encoding = $2,
          detected_delimiter = $3,
          quotechar = $4,
          header_raw = $5,
          observed_columns = $6::jsonb,
          column_count = $7,
          schema_fingerprint = $8,
          row_count = $9
        WHERE id = $1
      `,
      [
        input.rawCsvFileId,
        input.detectedEncoding,
        input.detectedDelimiter,
        input.quotechar,
        input.headerRaw,
        JSON.stringify(input.observedColumns),
        input.columnCount,
        input.schemaFingerprint,
        input.rowCount,
      ],
    );
  }

  async getRawCsvFileMetaById(
    rawCsvFileId: string,
  ): Promise<RawCsvFileMeta | null> {
    const rows = await this.coreDataSource.query<RawCsvFileMeta[]>(
      `
        SELECT
          id,
          source_dataset,
          source_period,
          source_modality,
          source_file_name,
          file_checksum,
          detected_encoding,
          detected_delimiter,
          quotechar
        FROM mp.raw_csv_file
        WHERE id = $1
      `,
      [rawCsvFileId],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  async insertRawCsvRows(input: {
    rows: InsertRawCsvRowInput[];
  }): Promise<void> {
    if (input.rows.length === 0) {
      return;
    }

    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const row of input.rows) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}::jsonb, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10})`,
      );
      params.push(
        row.rawCsvFileId,
        row.ingestionJobId,
        row.sourceDataset,
        row.sourceFileName,
        row.sourcePeriod,
        row.rowNumber,
        row.rawRowText,
        row.rawRowJson ? JSON.stringify(row.rawRowJson) : null,
        row.rowChecksum,
        row.parseStatus,
        row.parseError,
      );
      paramIndex += 11;
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.raw_csv_row (
          raw_csv_file_id,
          ingestion_job_id,
          source_dataset,
          source_file_name,
          source_period,
          row_number,
          raw_row_text,
          raw_row_json,
          row_checksum,
          parse_status,
          parse_error
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (raw_csv_file_id, row_number, row_checksum) DO NOTHING
      `,
      params,
    );
  }

  async insertStgCsvOrdenCompraRows(input: {
    rows: InsertStgCsvOrdenCompraRowInput[];
  }): Promise<void> {
    if (input.rows.length === 0) {
      return;
    }

    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const row of input.rows) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16}, $${paramIndex + 17}, $${paramIndex + 18}, $${paramIndex + 19}, $${paramIndex + 20}, $${paramIndex + 21}, $${paramIndex + 22}, $${paramIndex + 23})`,
      );
      params.push(
        row.rawCsvRowId,
        row.sourceDataset,
        row.sourcePeriod,
        row.codigo,
        row.sourceId,
        row.iditem,
        row.codigoLicitacion,
        row.fechaEnvio,
        row.estado,
        row.descripcionTipoOc,
        row.codigoAbreviadoTipoOc,
        row.codigoTipo,
        row.tipoMonedaOc,
        row.montoTotalOcPesosChilenos,
        row.impuestosOc,
        row.unidadCompra,
        row.nombreProveedor,
        row.codigoProductoOnu,
        row.totalLineaNeto,
        row.esCompraAgil,
        row.esTratoDirecto,
        row.formaDePago,
        row.codigoConvenioMarco,
        row.allObservedFields ? JSON.stringify(row.allObservedFields) : null,
      );
      paramIndex += 24;
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.stg_csv_orden_compra (
          raw_csv_row_id,
          source_dataset,
          source_period,
          codigo,
          source_id,
          iditem,
          codigo_licitacion,
          fecha_envio,
          estado,
          descripcion_tipo_oc,
          codigo_abreviado_tipo_oc,
          codigo_tipo,
          tipo_moneda_oc,
          monto_total_oc_pesos_chilenos,
          impuestos_oc,
          unidad_compra,
          nombre_proveedor,
          codigo_producto_onu,
          total_linea_neto,
          es_compra_agil,
          es_trato_directo,
          forma_de_pago,
          codigo_convenio_marco,
          all_observed_fields
        )
        VALUES ${placeholders.join(', ')}
      `,
      params,
    );
  }

  async insertStgCsvLicitacionRows(input: {
    rows: InsertStgCsvLicitacionRowInput[];
  }): Promise<void> {
    if (input.rows.length === 0) {
      return;
    }

    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const row of input.rows) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16}, $${paramIndex + 17}, $${paramIndex + 18}, $${paramIndex + 19}, $${paramIndex + 20}, $${paramIndex + 21})`,
      );
      params.push(
        row.rawCsvRowId,
        row.sourceDataset,
        row.sourcePeriod,
        row.codigoExterno,
        row.codigo,
        row.codigoitem,
        row.codigoProveedor,
        row.rutProveedor,
        row.nombreDeLaOferta,
        row.estadoOferta,
        row.ofertaSeleccionada,
        row.cantidadOfertada,
        row.valorTotalOfertado,
        row.tipoDeAdquisicion,
        row.fechaPublicacion,
        row.fechaAdjudicacion,
        row.estado,
        row.nombreUnidad,
        row.nombreProductoGenerico,
        row.cantidadAdjudicada,
        row.montoEstimadoAdjudicado,
        row.allObservedFields ? JSON.stringify(row.allObservedFields) : null,
      );
      paramIndex += 22;
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.stg_csv_licitacion (
          raw_csv_row_id,
          source_dataset,
          source_period,
          codigo_externo,
          codigo,
          codigoitem,
          codigo_proveedor,
          rut_proveedor,
          nombre_de_la_oferta,
          estado_oferta,
          oferta_seleccionada,
          cantidad_ofertada,
          valor_total_ofertado,
          tipo_de_adquisicion,
          fecha_publicacion,
          fecha_adjudicacion,
          estado,
          nombre_unidad,
          nombre_producto_generico,
          cantidad_adjudicada,
          monto_estimado_adjudicado,
          all_observed_fields
        )
        VALUES ${placeholders.join(', ')}
      `,
      params,
    );
  }

  async deleteStgCsvOrdenCompraRowsByRawFileId(
    rawCsvFileId: string,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        DELETE FROM mp.stg_csv_orden_compra
        WHERE raw_csv_row_id IN (
          SELECT id FROM mp.raw_csv_row WHERE raw_csv_file_id = $1
        )
      `,
      [rawCsvFileId],
    );
  }

  async deleteStgCsvLicitacionRowsByRawFileId(
    rawCsvFileId: string,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        DELETE FROM mp.stg_csv_licitacion
        WHERE raw_csv_row_id IN (
          SELECT id FROM mp.raw_csv_row WHERE raw_csv_file_id = $1
        )
      `,
      [rawCsvFileId],
    );
  }

  async getRawCsvFileObservedColumns(rawCsvFileId: string): Promise<string[]> {
    const rows = await this.coreDataSource.query<
      { observed_columns: string[] }[]
    >(
      `
        SELECT observed_columns
        FROM mp.raw_csv_file
        WHERE id = $1
      `,
      [rawCsvFileId],
    );

    if (rows.length === 0) {
      return [];
    }

    const columns = rows[0]?.observed_columns;

    return Array.isArray(columns) ? columns : [];
  }

  async countRawCsvRowsByFileId(rawCsvFileId: string): Promise<number> {
    const rows = await this.coreDataSource.query<{ count: string }[]>(
      `
        SELECT COUNT(*)::text AS count
        FROM mp.raw_csv_row
        WHERE raw_csv_file_id = $1
      `,
      [rawCsvFileId],
    );

    return Number(rows[0]?.count ?? 0);
  }

  async getRawCsvRowsPageByFileId(
    rawCsvFileId: string,
    rowNumberExclusiveStart: number,
    limit: number,
  ): Promise<RawCsvRowForStaging[]> {
    return this.coreDataSource.query<RawCsvRowForStaging[]>(
      `
        SELECT
          id,
          row_number,
          raw_row_json,
          parse_status
        FROM mp.raw_csv_row
        WHERE
          raw_csv_file_id = $1
          AND parse_status = 'success'
          AND row_number > $2
        ORDER BY row_number ASC
        LIMIT $3
      `,
      [rawCsvFileId, rowNumberExclusiveStart, limit],
    );
  }
}
