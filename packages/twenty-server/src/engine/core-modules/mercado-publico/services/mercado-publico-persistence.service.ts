import crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type EntityManager } from 'typeorm';

import { type MercadoPublicoApiV1LicitacionesByDateResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { type MercadoPublicoApiV1OcByDateResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';
import { type MercadoPublicoApiV2CompraAgilListResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';
import {
  type MercadoPublicoJobName,
  type MercadoPublicoJobRunStatus,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

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

type PersistMercadoPublicoV1LicitacionesSnapshotInput = {
  jobRunRecordId: string;
  apiResponse: MercadoPublicoApiV1LicitacionesByDateResponse;
  snapshotKind: SnapshotKind;
};

type PersistMercadoPublicoV1LicitacionesSnapshotResult = {
  rawApiPayloadId: string;
  recordsFetched: number;
  recordsStaged: number;
  recordsCanonicalized: number;
};

type PersistMercadoPublicoV1OrdenesDeCompraSnapshotInput = {
  jobRunRecordId: string;
  apiResponse: MercadoPublicoApiV1OcByDateResponse;
  snapshotKind: SnapshotKind;
};

type PersistMercadoPublicoV1OrdenesDeCompraSnapshotResult = {
  rawApiPayloadId: string;
  recordsFetched: number;
  recordsStaged: number;
  recordsCanonicalized: number;
};

type PersistMercadoPublicoV2CompraAgilSnapshotInput = {
  jobRunRecordId: string;
  apiResponse: MercadoPublicoApiV2CompraAgilListResponse;
  snapshotKind: SnapshotKind;
};

type PersistMercadoPublicoV2CompraAgilSnapshotResult = {
  rawApiPayloadId: string;
  recordsFetched: number;
  recordsStaged: number;
  recordsCanonicalized: number;
};

@Injectable()
export class MercadoPublicoPersistenceService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async createJobRun(
    jobName: MercadoPublicoJobName,
  ): Promise<MercadoPublicoJobRunRecord> {
    const startedAt = new Date();
    const jobRunId = crypto.randomUUID();
    const insertedJobRunRows = await this.coreDataSource.query<
      { id: string }[]
    >(
      `
        INSERT INTO mp.stg_job_run (
          job_name,
          job_run_id,
          status,
          started_at
        )
        VALUES ($1, $2, 'failed', $3)
        RETURNING id
      `,
      [jobName, jobRunId, startedAt],
    );

    return {
      id: insertedJobRunRows[0].id,
      jobRunId,
      startedAt,
    };
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

  async persistV1LicitacionesSnapshot(
    input: PersistMercadoPublicoV1LicitacionesSnapshotInput,
  ): Promise<PersistMercadoPublicoV1LicitacionesSnapshotResult> {
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
        recordsFetched: input.apiResponse.licitaciones.length,
      });

      await this.insertV1LicitacionesStagingRows(
        entityManager,
        rawApiPayloadId,
        input.apiResponse,
        input.snapshotKind,
      );

      return {
        rawApiPayloadId,
        recordsFetched: input.apiResponse.licitaciones.length,
        recordsStaged: input.apiResponse.licitaciones.length,
        recordsCanonicalized: 0,
      };
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

  private async insertV1LicitacionesStagingRows(
    entityManager: EntityManager,
    rawApiPayloadId: string,
    apiResponse: MercadoPublicoApiV1LicitacionesByDateResponse,
    snapshotKind: SnapshotKind,
  ): Promise<void> {
    for (const licitacion of apiResponse.licitaciones) {
      await entityManager.query(
        `
          INSERT INTO mp.stg_api_v1_licitacion (
            raw_api_payload_id,
            source,
            snapshot_kind,
            codigo_externo,
            codigo,
            codigo_estado,
            estado,
            codigo_tipo,
            nombre,
            fecha_publicacion,
            fecha_cierre,
            fecha_adjudicacion,
            codigo_organismo,
            nombre_organismo,
            fetched_at
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
            $11,
            $12,
            $13,
            $14,
            $15
          )
        `,
        [
          rawApiPayloadId,
          apiResponse.source,
          snapshotKind,
          coerceToNullableString(licitacion.CodigoExterno),
          coerceToNullableString(licitacion.Codigo),
          coerceToNullableString(licitacion.CodigoEstado),
          coerceToNullableString(licitacion.Estado),
          coerceToNullableString(licitacion.CodigoTipo),
          coerceToNullableString(licitacion.Nombre),
          coerceToNullableString(licitacion.FechaPublicacion),
          coerceToNullableString(licitacion.FechaCierre),
          coerceToNullableString(licitacion.FechaAdjudicacion),
          coerceToNullableString(licitacion.CodigoOrganismo),
          coerceToNullableString(licitacion.NombreOrganismo),
          apiResponse.fetchedAt,
        ],
      );
    }
  }

  async persistV1OrdenesDeCompraSnapshot(
    input: PersistMercadoPublicoV1OrdenesDeCompraSnapshotInput,
  ): Promise<PersistMercadoPublicoV1OrdenesDeCompraSnapshotResult> {
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
        recordsFetched: input.apiResponse.ordenesDeCompra.length,
      });

      await this.insertV1OrdenesDeCompraStagingRows(
        entityManager,
        rawApiPayloadId,
        input.apiResponse,
        input.snapshotKind,
      );

      return {
        rawApiPayloadId,
        recordsFetched: input.apiResponse.ordenesDeCompra.length,
        recordsStaged: input.apiResponse.ordenesDeCompra.length,
        recordsCanonicalized: 0,
      };
    });
  }

  private async insertV1OrdenesDeCompraStagingRows(
    entityManager: EntityManager,
    rawApiPayloadId: string,
    apiResponse: MercadoPublicoApiV1OcByDateResponse,
    snapshotKind: SnapshotKind,
  ): Promise<void> {
    for (const oc of apiResponse.ordenesDeCompra) {
      await entityManager.query(
        `
          INSERT INTO mp.stg_api_v1_orden_compra (
            raw_api_payload_id,
            source,
            snapshot_kind,
            codigo,
            codigo_estado,
            estado,
            estado_proveedor,
            codigo_licitacion,
            fecha_envio,
            monto_total_oc,
            tipo_moneda_oc,
            nombre_proveedor,
            fetched_at
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
            $11,
            $12,
            $13
          )
        `,
        [
          rawApiPayloadId,
          apiResponse.source,
          snapshotKind,
          coerceToNullableString(oc.Codigo),
          coerceToNullableString(oc.CodigoEstado),
          coerceToNullableString(oc.Estado),
          coerceToNullableString(oc.EstadoProveedor),
          coerceToNullableString(oc.CodigoLicitacion),
          coerceToNullableString(oc.FechaEnvio),
          coerceToNullableString(oc.MontoTotalOC),
          coerceToNullableString(oc.TipoMonedaOC),
          coerceToNullableString(oc.NombreProveedor),
          apiResponse.fetchedAt,
        ],
      );
    }
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
    for (const compraAgilItem of apiResponse.compraAgil) {
      const ordenCompra = compraAgilItem.orden_compra;

      await entityManager.query(
        `
          INSERT INTO mp.stg_api_v2_compra_agil (
            raw_api_payload_id,
            source,
            snapshot_kind,
            codigo,
            estado,
            id_orden_compra,
            id_oc,
            codigo_orden_compra,
            publicado_desde,
            publicado_hasta,
            cambio_desde,
            cambio_hasta,
            fetched_at
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
            $11,
            $12,
            $13
          )
        `,
        [
          rawApiPayloadId,
          apiResponse.source,
          snapshotKind,
          coerceToNullableString(compraAgilItem.codigo),
          coerceToNullableString(compraAgilItem.estado),
          coerceToNullableString(ordenCompra?.id_orden_compra),
          coerceToNullableString(ordenCompra?.id_oc),
          coerceToNullableString(ordenCompra?.codigo_orden_compra),
          coerceToNullableString(compraAgilItem.publicado_desde),
          coerceToNullableString(compraAgilItem.publicado_hasta),
          coerceToNullableString(compraAgilItem.cambio_desde),
          coerceToNullableString(compraAgilItem.cambio_hasta),
          apiResponse.fetchedAt,
        ],
      );
    }
  }
}
