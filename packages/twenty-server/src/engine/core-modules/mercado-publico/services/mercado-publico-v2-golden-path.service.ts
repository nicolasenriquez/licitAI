import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { type CompraAgilListParams } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';
import { createJsonSha256 } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import {
  MercadoPublicoApiV2CompraAgilClientService,
  type MercadoPublicoApiV2CompraAgilListResponse,
} from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

const NORMALIZER_VERSION = 'mercado-publico-v2-golden-path-1';

export type MercadoPublicoV2SyncRunResult = {
  syncRunId: string;
  observationIds: string[];
  recordsProjected: number;
};

@Injectable()
export class MercadoPublicoV2GoldenPathService {
  constructor(
    private readonly mercadoPublicoApiV2CompraAgilClientService: MercadoPublicoApiV2CompraAgilClientService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
    private readonly mercadoPublicoCanonicalRefreshService: MercadoPublicoCanonicalRefreshService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async runProduction(
    payload: Record<string, unknown>,
  ): Promise<MercadoPublicoV2SyncRunResult> {
    const response =
      await this.mercadoPublicoApiV2CompraAgilClientService.getList(
        payload as CompraAgilListParams,
      );

    return this.runResponse(response, 'manual');
  }

  async runFixture(payload: unknown): Promise<MercadoPublicoV2SyncRunResult> {
    const fetchedAt = new Date();
    const compraAgil = extractV2CompraAgilListRecords(payload);
    const requestParams = { fixture: 'mercado-publico-v2-issue-19' };

    return this.runResponse(
      {
        endpoint: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
        source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        requestParams,
        requestFingerprint: createJsonSha256(requestParams),
        payloadChecksum: createJsonSha256(payload),
        schemaFingerprint: createJsonSha256(payload),
        httpStatus: 200,
        fetchedAt,
        rawPayload: payload,
        compraAgil,
      },
      'fixture',
    );
  }

  private async runResponse(
    apiResponse: MercadoPublicoApiV2CompraAgilListResponse,
    intent: 'manual' | 'fixture',
  ): Promise<MercadoPublicoV2SyncRunResult> {
    if (apiResponse.errorSummary !== undefined) {
      throw new Error(apiResponse.errorMessage ?? apiResponse.errorSummary);
    }

    const syncRunId = await this.createSyncRun(intent);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );

    try {
      const persistenceResult =
        await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
          {
            jobRunRecordId: jobRunRecord.id,
            apiResponse,
            snapshotKind: 'list',
          },
        );

      await this.mercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
        persistenceResult.rawApiPayloadId,
      );

      const observationIds = await this.recordObservationsAndProjection(
        syncRunId,
        persistenceResult.rawApiPayloadId,
        apiResponse,
      );

      await this.updateSyncRun(
        syncRunId,
        'succeeded',
        apiResponse.compraAgil.length,
      );
      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'success',
        finishedAt: new Date(),
        recordsFetched: apiResponse.compraAgil.length,
        recordsStaged: persistenceResult.recordsStaged,
        recordsCanonicalized: observationIds.length,
        recordsFailed: 0,
      });

      return {
        syncRunId,
        observationIds,
        recordsProjected: observationIds.length,
      };
    } catch (error) {
      await this.updateSyncRun(
        syncRunId,
        'failed',
        apiResponse.compraAgil.length,
        error instanceof Error ? error.message : 'V2 sync failed',
      );
      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'failed',
        finishedAt: new Date(),
        errorSummary: error instanceof Error ? error.message : 'V2 sync failed',
        recordsFetched: apiResponse.compraAgil.length,
        recordsFailed: 1,
      });

      throw error;
    }
  }

  private async createSyncRun(intent: 'manual' | 'fixture'): Promise<string> {
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_run (intent, source, status)
        VALUES ($1, $2, 'projecting')
        RETURNING id
      `,
      [intent, MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE],
    );

    return rows[0].id;
  }

  private async updateSyncRun(
    syncRunId: string,
    status: 'succeeded' | 'failed',
    recordCount: number,
    errorSummary?: string,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = $2,
            records_discovered = $3,
            records_projected = CASE WHEN $2 = 'succeeded' THEN $3 ELSE 0 END,
            error_summary = $4,
            finished_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [syncRunId, status, recordCount, errorSummary ?? null],
    );
  }

  private async recordObservationsAndProjection(
    syncRunId: string,
    rawApiPayloadId: string,
    apiResponse: MercadoPublicoApiV2CompraAgilListResponse,
  ): Promise<string[]> {
    const observationIds: string[] = [];

    for (const record of apiResponse.compraAgil) {
      const normalized = normalizeV2CompraAgilRecord(record);
      const recordChecksum = createJsonSha256(record);
      const observationRows = await this.coreDataSource.query<{ id: string }[]>(
        `
          INSERT INTO mp.v2_observation (
            sync_run_id,
            raw_api_payload_id,
            codigo,
            payload_checksum,
            provider_schema_fingerprint,
            normalizer_version,
            observed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (sync_run_id, codigo, payload_checksum)
          DO UPDATE SET observed_at = EXCLUDED.observed_at
          RETURNING id
        `,
        [
          syncRunId,
          rawApiPayloadId,
          record.codigo,
          recordChecksum,
          apiResponse.schemaFingerprint,
          NORMALIZER_VERSION,
          apiResponse.fetchedAt,
        ],
      );
      const observationId = observationRows[0].id;
      observationIds.push(observationId);

      await this.coreDataSource.query(
        `
          UPDATE mp.compra_agil
          SET title = COALESCE($2, title),
              buyer_code = COALESCE($3, buyer_code),
              buyer_name = COALESCE($4, buyer_name),
              region = COALESCE($5, region),
              published_at = COALESCE($6, published_at),
              closing_at = COALESCE($7, closing_at),
              amount = COALESCE($8, amount),
              currency_source = COALESCE($9, currency_source),
              document_count = GREATEST(document_count, $10),
              observation_id = $11,
              normalizer_version = $12,
              provider_schema_fingerprint = $13,
              updated_at = now()
          WHERE codigo = $1
        `,
        [
          record.codigo,
          normalized.title,
          normalized.buyerCode,
          normalized.buyerName,
          normalized.region,
          normalized.publishedAt,
          normalized.closingAt,
          normalized.amount,
          normalized.currency,
          normalized.documentCount,
          observationId,
          NORMALIZER_VERSION,
          apiResponse.schemaFingerprint,
        ],
      );

      await this.coreDataSource.query(
        `
          INSERT INTO mp.gold_detected_process (
            process_type,
            process_code,
            title,
            canonical_state,
            raw_state_label,
            buyer_code,
            buyer_name,
            region,
            published_at,
            closing_at,
            amount,
            currency_source,
            document_count,
            observation_id,
            normalizer_version,
            provider_schema_fingerprint,
            availability,
            source_priority,
            last_seen_at,
            created_at,
            updated_at
          )
          VALUES ('compra_agil', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'available', 'api-v2', $16, now(), now())
          ON CONFLICT (process_type, process_code) DO UPDATE
          SET title = COALESCE(EXCLUDED.title, mp.gold_detected_process.title),
              canonical_state = COALESCE(EXCLUDED.canonical_state, mp.gold_detected_process.canonical_state),
              raw_state_label = COALESCE(EXCLUDED.raw_state_label, mp.gold_detected_process.raw_state_label),
              buyer_code = COALESCE(EXCLUDED.buyer_code, mp.gold_detected_process.buyer_code),
              buyer_name = COALESCE(EXCLUDED.buyer_name, mp.gold_detected_process.buyer_name),
              region = COALESCE(EXCLUDED.region, mp.gold_detected_process.region),
              published_at = COALESCE(EXCLUDED.published_at, mp.gold_detected_process.published_at),
              closing_at = COALESCE(EXCLUDED.closing_at, mp.gold_detected_process.closing_at),
              amount = COALESCE(EXCLUDED.amount, mp.gold_detected_process.amount),
              currency_source = COALESCE(EXCLUDED.currency_source, mp.gold_detected_process.currency_source),
              document_count = GREATEST(mp.gold_detected_process.document_count, EXCLUDED.document_count),
              observation_id = EXCLUDED.observation_id,
              normalizer_version = EXCLUDED.normalizer_version,
              provider_schema_fingerprint = EXCLUDED.provider_schema_fingerprint,
              availability = EXCLUDED.availability,
              last_seen_at = GREATEST(mp.gold_detected_process.last_seen_at, EXCLUDED.last_seen_at),
              updated_at = now()
        `,
        [
          record.codigo,
          normalized.title,
          normalized.stateCode,
          normalized.stateLabel,
          normalized.buyerCode,
          normalized.buyerName,
          normalized.region,
          normalized.publishedAt,
          normalized.closingAt,
          normalized.amount,
          normalized.currency,
          normalized.documentCount,
          observationId,
          NORMALIZER_VERSION,
          apiResponse.schemaFingerprint,
          apiResponse.fetchedAt,
        ],
      );
    }

    return observationIds;
  }
}
