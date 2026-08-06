import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  MercadoPublicoApiV2CompraAgilClientService,
  type MercadoPublicoApiV2CompraAgilListResponse,
} from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import {
  classifyV2CompraAgilLifecycle,
  getV2CompraAgilProviderOrderId,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';
import { createJsonSha256 } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { extractV2CompraAgilPagination } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-pagination.util';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { type CompraAgilListParams } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';

const WATERMARK_OVERLAP_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 50;
const NORMALIZER_VERSION = 'mercado-publico-v2-durable-1';

export type MercadoPublicoV2SyncIntent =
  | 'scheduled'
  | 'manual'
  | 'replay'
  | 'backfill'
  | 'reconcile'
  | 'fixture';

export type MercadoPublicoV2DurableSyncResult = {
  syncRunId: string;
  status: 'succeeded' | 'partial_failed' | 'failed';
  recordsDiscovered: number;
  recordsHydrated: number;
  recordsFailed: number;
  pagesCheckpointed: number;
  watermarkAfter: Date | null;
  observationIds: string[];
  recordsProjected: number;
};

type SyncRunContext = {
  syncRunId: string;
  scope: string;
  requestParams: CompraAgilListParams;
  watermarkBefore: Date | null;
};

type SyncRunItem = {
  id: string;
  codigo: string;
  status: 'pending' | 'processing' | 'succeeded' | 'terminal';
};

type SyncRunRow = {
  id: string;
  intent: MercadoPublicoV2SyncIntent;
  scope: string;
  request_params: Record<string, unknown>;
  watermark_before: Date | null;
};

const getNonEmptyString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
};

const getDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

@Injectable()
export class MercadoPublicoV2DurableSyncService {
  private readonly logger = new Logger(MercadoPublicoV2DurableSyncService.name);

  constructor(
    private readonly mercadoPublicoApiV2CompraAgilClientService: MercadoPublicoApiV2CompraAgilClientService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
    private readonly mercadoPublicoCanonicalRefreshService: MercadoPublicoCanonicalRefreshService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async start(
    payload: Record<string, unknown>,
    intent: MercadoPublicoV2SyncIntent = 'scheduled',
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const context = await this.createSyncRun(intent, payload);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );
    let stage: 'discovering' | 'hydrating' = 'discovering';

    try {
      await this.updateSyncRunStatus(context.syncRunId, 'discovering');
      await this.discover(context, jobRunRecord.id);
      stage = 'hydrating';
      await this.updateSyncRunStatus(context.syncRunId, 'hydrating');
      await this.hydrate(context, jobRunRecord.id);

      return this.finishRun(context, jobRunRecord.id);
    } catch (error) {
      await this.failRun(context, jobRunRecord.id, error, stage);

      throw error;
    }
  }

  async resume(syncRunId: string): Promise<MercadoPublicoV2DurableSyncResult> {
    const context = await this.loadSyncRun(syncRunId);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );

    try {
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_run_item
          SET status = 'pending', updated_at = now()
          WHERE sync_run_id = $1 AND status = 'processing'
        `,
        [syncRunId],
      );
      await this.updateSyncRunStatus(syncRunId, 'hydrating');
      await this.hydrate(context, jobRunRecord.id);

      return this.finishRun(context, jobRunRecord.id);
    } catch (error) {
      await this.failRun(context, jobRunRecord.id, error, 'hydrating');

      throw error;
    }
  }

  async rediscover(
    syncRunId: string,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const sourceRun = await this.loadSyncRun(syncRunId);

    return this.start(
      { ...sourceRun.request_params, scope: sourceRun.scope },
      sourceRun.intent,
    );
  }

  async runFixture(
    payload: unknown,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const requestParams = { fixture: 'mercado-publico-v2-issue-20' };
    const rawRecords = extractV2CompraAgilListRecords(payload);
    const pagination = extractV2CompraAgilPagination(
      payload,
      1,
      rawRecords.length || DEFAULT_PAGE_SIZE,
      rawRecords.length,
    );
    const fetchedAt = new Date();
    const response: MercadoPublicoApiV2CompraAgilListResponse = {
      endpoint: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
      source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(payload),
      schemaFingerprint: createJsonSha256(payload),
      httpStatus: 200,
      fetchedAt,
      rawPayload: payload,
      compraAgil: rawRecords,
      pagination,
    };
    const context = await this.createSyncRun('fixture', requestParams);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );

    try {
      const persistenceResult =
        await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
          {
            jobRunRecordId: jobRunRecord.id,
            apiResponse: response,
            snapshotKind: 'list',
          },
        );

      await this.checkpointPage(
        context,
        response,
        persistenceResult.rawApiPayloadId,
      );
      await this.mercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
        persistenceResult.rawApiPayloadId,
      );
      await this.projectPendingItems(
        context.syncRunId,
        response.compraAgil,
        persistenceResult.rawApiPayloadId,
      );

      return this.finishRun(context, jobRunRecord.id);
    } catch (error) {
      await this.failRun(context, jobRunRecord.id, error, 'projecting');

      throw error;
    }
  }

  private async createSyncRun(
    intent: MercadoPublicoV2SyncIntent,
    payload: Record<string, unknown>,
  ): Promise<SyncRunContext> {
    const scope = getNonEmptyString(payload.scope) ?? 'global';
    const watermarkBefore = await this.readWatermark(scope);
    const requestParams = this.buildRequestParams(payload, watermarkBefore);
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_run (
          intent, source, scope, status, request_params, watermark_before
        )
        VALUES ($1, $2, $3, 'queued', $4::jsonb, $5)
        RETURNING id
      `,
      [
        intent,
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        scope,
        JSON.stringify(requestParams),
        watermarkBefore,
      ],
    );

    return {
      syncRunId: rows[0].id,
      scope,
      requestParams,
      watermarkBefore,
    };
  }

  private buildRequestParams(
    payload: Record<string, unknown>,
    watermarkBefore: Date | null,
  ): CompraAgilListParams {
    const explicitChangeStart = getNonEmptyString(payload.cambio_desde);
    const derivedChangeStart =
      explicitChangeStart ??
      (watermarkBefore === null
        ? undefined
        : new Date(
            watermarkBefore.getTime() - WATERMARK_OVERLAP_MS,
          ).toISOString());
    const pageSize =
      typeof payload.tamano_pagina === 'number'
        ? payload.tamano_pagina
        : DEFAULT_PAGE_SIZE;

    if (pageSize < 1 || pageSize > 50) {
      throw new Error(
        'Mercado Publico V2 durable page size must be between 1 and 50',
      );
    }

    return {
      cambio_desde: derivedChangeStart,
      cambio_hasta: getNonEmptyString(payload.cambio_hasta),
      ttl_cambio_ms:
        typeof payload.ttl_cambio_ms === 'number'
          ? payload.ttl_cambio_ms
          : undefined,
      publicado_desde: getNonEmptyString(payload.publicado_desde),
      publicado_hasta: getNonEmptyString(payload.publicado_hasta),
      estado: getNonEmptyString(payload.estado),
      region: typeof payload.region === 'number' ? payload.region : undefined,
      id: getNonEmptyString(payload.id),
      q: getNonEmptyString(payload.q),
      ordenar_por: getNonEmptyString(payload.ordenar_por),
      orden: getNonEmptyString(payload.orden),
      tamano_pagina: pageSize,
      numero_pagina: 1,
    };
  }

  private async readWatermark(scope: string): Promise<Date | null> {
    const rows = await this.coreDataSource.query<
      { watermark_at: Date | null }[]
    >(
      `
        SELECT watermark_at
        FROM mp.source_watermark
        WHERE source = $1 AND scope = $2
      `,
      [MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE, scope],
    );

    return getDate(rows[0]?.watermark_at);
  }

  private async loadSyncRun(
    syncRunId: string,
  ): Promise<SyncRunContext & SyncRunRow> {
    const rows = await this.coreDataSource.query<SyncRunRow[]>(
      `
        SELECT id, intent, scope, request_params, watermark_before
        FROM mp.sync_run
        WHERE id = $1
      `,
      [syncRunId],
    );

    const row = rows[0];

    if (row === undefined) {
      throw new Error(`Mercado Publico V2 sync run ${syncRunId} was not found`);
    }

    return {
      ...row,
      syncRunId: row.id,
      requestParams: this.toCompraAgilListParams(row.request_params),
      watermarkBefore: getDate(row.watermark_before),
    };
  }

  private toCompraAgilListParams(
    value: Record<string, unknown>,
  ): CompraAgilListParams {
    return {
      ...value,
      tamano_pagina:
        typeof value.tamano_pagina === 'number'
          ? value.tamano_pagina
          : DEFAULT_PAGE_SIZE,
      numero_pagina: 1,
    } as CompraAgilListParams;
  }

  private async discover(
    context: SyncRunContext,
    jobRunRecordId: string,
  ): Promise<void> {
    const pageSize = context.requestParams.tamano_pagina ?? DEFAULT_PAGE_SIZE;
    let pageNumber = 1;

    while (true) {
      const response =
        await this.mercadoPublicoApiV2CompraAgilClientService.getList({
          ...context.requestParams,
          numero_pagina: pageNumber,
        });

      if (response.errorSummary !== undefined) {
        await this.persistApiFailure(jobRunRecordId, response);
        throw new Error(this.buildProviderError(response, 'discovering'));
      }

      const persistenceResult =
        await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
          {
            jobRunRecordId,
            apiResponse: response,
            snapshotKind: 'list',
          },
        );

      await this.checkpointPage(
        context,
        response,
        persistenceResult.rawApiPayloadId,
      );

      const pagination = response.pagination;
      const hasNextPage =
        pagination?.hasNextPage === true && response.compraAgil.length > 0;

      if (
        pagination?.hasNextPage === true &&
        response.compraAgil.length === 0
      ) {
        throw new Error(
          'Mercado Publico V2 discovery returned an empty page before pagination completed',
        );
      }

      if (!hasNextPage) {
        break;
      }

      pageNumber += 1;

      if (
        pagination?.totalPages !== null &&
        pagination?.totalPages !== undefined &&
        pageNumber > pagination.totalPages
      ) {
        break;
      }

      if (pagination === undefined && response.compraAgil.length < pageSize) {
        break;
      }
    }
  }

  private async checkpointPage(
    context: SyncRunContext,
    response: MercadoPublicoApiV2CompraAgilListResponse,
    rawApiPayloadId: string,
  ): Promise<void> {
    const codes = response.compraAgil.map((record) => record.codigo);
    const knownRows =
      codes.length === 0
        ? []
        : await this.coreDataSource.query<{ codigo: string }[]>(
            `
              SELECT codigo
              FROM mp.compra_agil
              WHERE codigo = ANY($1::text[])
            `,
            [codes],
          );
    const knownCodes = new Set(knownRows.map((row) => row.codigo));
    const pageNumber = response.pagination?.pageNumber ?? 1;
    const pageSize =
      response.pagination?.pageSize ?? response.compraAgil.length;

    await this.coreDataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `
          INSERT INTO mp.sync_run_page (
            sync_run_id, page_number, page_size, total_pages, total_results,
            request_params, raw_api_payload_id, status, completed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 'checkpointed', now())
          ON CONFLICT (sync_run_id, page_number) DO NOTHING
        `,
        [
          context.syncRunId,
          pageNumber,
          pageSize,
          response.pagination?.totalPages ?? null,
          response.pagination?.totalResults ?? null,
          JSON.stringify(response.requestParams),
          rawApiPayloadId,
        ],
      );

      for (const record of response.compraAgil) {
        const classification = classifyV2CompraAgilLifecycle(
          record,
          knownCodes.has(record.codigo),
        );

        if (!classification.includeInCohort) {
          continue;
        }

        const normalized = normalizeV2CompraAgilRecord(record);

        await entityManager.query(
          `
            INSERT INTO mp.sync_run_item (
              sync_run_id, codigo, discovery_page, raw_api_payload_id,
              payload_checksum, state_id, state_code, state_label,
              provider_changed_at_raw, provider_changed_at, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
            ON CONFLICT (sync_run_id, codigo) DO NOTHING
          `,
          [
            context.syncRunId,
            record.codigo,
            pageNumber,
            rawApiPayloadId,
            createJsonSha256(record),
            normalized.stateId,
            normalized.stateCode,
            normalized.stateLabel,
            normalized.providerChangedAtRaw,
            normalized.providerChangedAt,
          ],
        );
      }
    });

    await this.updateSyncRunCounters(context.syncRunId);
  }

  private async hydrate(
    context: SyncRunContext,
    jobRunRecordId: string,
  ): Promise<void> {
    const items = await this.coreDataSource.query<SyncRunItem[]>(
      `
        SELECT id, codigo, status
        FROM mp.sync_run_item
        WHERE sync_run_id = $1 AND status = 'pending'
        ORDER BY discovery_page ASC, id ASC
      `,
      [context.syncRunId],
    );

    for (const item of items) {
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_run_item
          SET status = 'processing', attempts = attempts + 1, updated_at = now()
          WHERE id = $1 AND status = 'pending'
        `,
        [item.id],
      );

      let response: MercadoPublicoApiV2CompraAgilListResponse;

      try {
        response =
          await this.mercadoPublicoApiV2CompraAgilClientService.getByCodigo(
            item.codigo,
          );
      } catch (error) {
        await this.markItemPending(
          item.id,
          `${classifyFailure(error)}: detail request failed`,
          'hydrating',
        );

        await this.updateSyncRunCounters(context.syncRunId);
        continue;
      }

      if (
        response.errorSummary !== undefined ||
        response.compraAgil.length === 0
      ) {
        if (response.errorSummary !== undefined) {
          await this.persistApiFailure(jobRunRecordId, response);
        }

        await this.markItemPending(
          item.id,
          response.errorSummary ?? 'soft_miss',
          'hydrating',
        );
        await this.updateSyncRunCounters(context.syncRunId);
        continue;
      }

      const persistenceResult =
        await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
          {
            jobRunRecordId,
            apiResponse: response,
            snapshotKind: 'detail',
          },
        );

      await this.mercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
        persistenceResult.rawApiPayloadId,
      );
      const detailRecord =
        response.compraAgil.find((record) => record.codigo === item.codigo) ??
        response.compraAgil[0];
      const observationId = await this.recordObservationAndProjection(
        context.syncRunId,
        persistenceResult.rawApiPayloadId,
        response,
        detailRecord,
      );
      const terminal = classifyV2CompraAgilLifecycle(
        detailRecord,
        true,
      ).terminal;

      await this.markItemSucceeded(
        item.id,
        persistenceResult.rawApiPayloadId,
        observationId,
        terminal,
        detailRecord,
      );

      await this.updateSyncRunCounters(context.syncRunId);
    }
  }

  private async projectPendingItems(
    syncRunId: string,
    records: MercadoPublicoApiV2CompraAgilRecord[],
    rawApiPayloadId: string,
  ): Promise<void> {
    const items = await this.coreDataSource.query<SyncRunItem[]>(
      `
        SELECT id, codigo, status
        FROM mp.sync_run_item
        WHERE sync_run_id = $1 AND status = 'pending'
        ORDER BY discovery_page ASC, id ASC
      `,
      [syncRunId],
    );
    const recordsByCode = new Map(
      records.map((record) => [record.codigo, record]),
    );

    for (const item of items) {
      const record = recordsByCode.get(item.codigo);

      if (record === undefined) {
        await this.markItemPending(
          item.id,
          'fixture record missing',
          'projecting',
        );
        continue;
      }

      const observationId = await this.recordObservationAndProjection(
        syncRunId,
        rawApiPayloadId,
        {
          endpoint: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
          source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
          requestParams: { fixture: 'mercado-publico-v2-issue-20' },
          requestFingerprint: createJsonSha256({ fixture: true }),
          payloadChecksum: createJsonSha256(record),
          schemaFingerprint: createJsonSha256(record),
          httpStatus: 200,
          fetchedAt: new Date(),
          rawPayload: record,
          compraAgil: [record],
        },
        record,
      );

      await this.markItemSucceeded(
        item.id,
        rawApiPayloadId,
        observationId,
        false,
        record,
      );
    }
  }

  private async recordObservationAndProjection(
    syncRunId: string,
    rawApiPayloadId: string,
    response: MercadoPublicoApiV2CompraAgilListResponse,
    record: MercadoPublicoApiV2CompraAgilRecord,
  ): Promise<string> {
    const normalized = normalizeV2CompraAgilRecord(record);
    const observedAt = response.fetchedAt;
    const observationRows = await this.coreDataSource.transaction(
      async (entityManager) => {
        const rows = await entityManager.query<{ id: string }[]>(
          `
            INSERT INTO mp.v2_observation (
              sync_run_id, raw_api_payload_id, codigo, payload_checksum,
              provider_schema_fingerprint, normalizer_version, observed_at
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
            createJsonSha256(record),
            response.schemaFingerprint,
            NORMALIZER_VERSION,
            observedAt,
          ],
        );
        const observationId = rows[0].id;
        const providerOrderId = getV2CompraAgilProviderOrderId(record);

        await entityManager.query(
          `
            INSERT INTO mp.compra_agil (
              codigo, estado, state_id, state_label, id_orden_compra, region, title,
              buyer_code, buyer_name, published_at, closing_at, amount,
              currency_source, document_count, observation_id,
              normalizer_version, provider_schema_fingerprint,
              provider_changed_at_raw, provider_changed_at, observed_at,
              persisted_at, last_seen_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18, $19, $20, now(), $20, now())
            ON CONFLICT (codigo) DO UPDATE SET
              estado = COALESCE(EXCLUDED.estado, mp.compra_agil.estado),
              state_id = COALESCE(EXCLUDED.state_id, mp.compra_agil.state_id),
              state_label = COALESCE(EXCLUDED.state_label, mp.compra_agil.state_label),
              id_orden_compra = COALESCE(EXCLUDED.id_orden_compra, mp.compra_agil.id_orden_compra),
              region = COALESCE(EXCLUDED.region, mp.compra_agil.region),
              title = COALESCE(EXCLUDED.title, mp.compra_agil.title),
              buyer_code = COALESCE(EXCLUDED.buyer_code, mp.compra_agil.buyer_code),
              buyer_name = COALESCE(EXCLUDED.buyer_name, mp.compra_agil.buyer_name),
              published_at = COALESCE(EXCLUDED.published_at, mp.compra_agil.published_at),
              closing_at = COALESCE(EXCLUDED.closing_at, mp.compra_agil.closing_at),
              amount = COALESCE(EXCLUDED.amount, mp.compra_agil.amount),
              currency_source = COALESCE(EXCLUDED.currency_source, mp.compra_agil.currency_source),
              document_count = EXCLUDED.document_count,
              observation_id = EXCLUDED.observation_id,
              normalizer_version = EXCLUDED.normalizer_version,
              provider_schema_fingerprint = EXCLUDED.provider_schema_fingerprint,
              provider_changed_at_raw = EXCLUDED.provider_changed_at_raw,
              provider_changed_at = COALESCE(EXCLUDED.provider_changed_at, mp.compra_agil.provider_changed_at),
              observed_at = GREATEST(COALESCE(mp.compra_agil.observed_at, EXCLUDED.observed_at), EXCLUDED.observed_at),
              persisted_at = now(),
              last_seen_at = GREATEST(mp.compra_agil.last_seen_at, EXCLUDED.last_seen_at),
              updated_at = now()
          `,
          [
            record.codigo,
            normalized.stateCode,
            normalized.stateId,
            normalized.stateLabel,
            providerOrderId,
            normalized.region,
            normalized.title,
            normalized.buyerCode,
            normalized.buyerName,
            normalized.publishedAt,
            normalized.closingAt,
            normalized.amount,
            normalized.currency,
            normalized.documentCount,
            observationId,
            NORMALIZER_VERSION,
            response.schemaFingerprint,
            normalized.providerChangedAtRaw,
            normalized.providerChangedAt,
            observedAt,
          ],
        );

        await entityManager.query(
          `
            INSERT INTO mp.gold_detected_process (
              process_type, process_code, title, canonical_state, raw_state_code,
              raw_state_id, raw_state_label, buyer_code, buyer_name, region, published_at,
              closing_at, amount, currency_source, document_count,
              observation_id, normalizer_version, provider_schema_fingerprint,
              availability, source_priority, provider_changed_at_raw,
              provider_changed_at, observed_at, persisted_at, last_seen_at,
              created_at, updated_at
            )
            VALUES ('compra_agil', $1, $2, $3, $3, $4, $5, $6, $7, $8, $9,
              $10, $11, $12, $13, $14, $15, $16, 'available', 'api-v2', $17,
              $18, $19, now(), $19, now(), now())
            ON CONFLICT (process_type, process_code) DO UPDATE SET
              title = COALESCE(EXCLUDED.title, mp.gold_detected_process.title),
              canonical_state = COALESCE(EXCLUDED.canonical_state, mp.gold_detected_process.canonical_state),
              raw_state_code = EXCLUDED.raw_state_code,
              raw_state_id = EXCLUDED.raw_state_id,
              raw_state_label = COALESCE(EXCLUDED.raw_state_label, mp.gold_detected_process.raw_state_label),
              buyer_code = COALESCE(EXCLUDED.buyer_code, mp.gold_detected_process.buyer_code),
              buyer_name = COALESCE(EXCLUDED.buyer_name, mp.gold_detected_process.buyer_name),
              region = COALESCE(EXCLUDED.region, mp.gold_detected_process.region),
              published_at = COALESCE(EXCLUDED.published_at, mp.gold_detected_process.published_at),
              closing_at = COALESCE(EXCLUDED.closing_at, mp.gold_detected_process.closing_at),
              amount = COALESCE(EXCLUDED.amount, mp.gold_detected_process.amount),
              currency_source = COALESCE(EXCLUDED.currency_source, mp.gold_detected_process.currency_source),
              document_count = EXCLUDED.document_count,
              observation_id = EXCLUDED.observation_id,
              normalizer_version = EXCLUDED.normalizer_version,
              provider_schema_fingerprint = EXCLUDED.provider_schema_fingerprint,
              provider_changed_at_raw = EXCLUDED.provider_changed_at_raw,
              provider_changed_at = COALESCE(EXCLUDED.provider_changed_at, mp.gold_detected_process.provider_changed_at),
              observed_at = GREATEST(COALESCE(mp.gold_detected_process.observed_at, EXCLUDED.observed_at), EXCLUDED.observed_at),
              persisted_at = now(),
              last_seen_at = GREATEST(mp.gold_detected_process.last_seen_at, EXCLUDED.last_seen_at),
              updated_at = now()
          `,
          [
            record.codigo,
            normalized.title,
            normalized.stateCode,
            normalized.stateId,
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
            response.schemaFingerprint,
            normalized.providerChangedAtRaw,
            normalized.providerChangedAt,
            observedAt,
          ],
        );

        return rows;
      },
    );

    return observationRows[0].id;
  }

  private async markItemSucceeded(
    itemId: string,
    rawApiPayloadId: string,
    observationId: string,
    terminal: boolean,
    record: MercadoPublicoApiV2CompraAgilRecord,
  ): Promise<void> {
    const normalized = normalizeV2CompraAgilRecord(record);

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = $2,
            raw_api_payload_id = $3,
            observation_id = $4,
            state_id = $5,
            state_code = $6,
            state_label = $7,
            provider_changed_at_raw = $8,
            provider_changed_at = $9,
            error_stage = NULL,
            error_summary = NULL,
            hydrated_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [
        itemId,
        terminal ? 'terminal' : 'succeeded',
        rawApiPayloadId,
        observationId,
        normalized.stateId,
        normalized.stateCode,
        normalized.stateLabel,
        normalized.providerChangedAtRaw,
        normalized.providerChangedAt,
      ],
    );
  }

  private async markItemPending(
    itemId: string,
    errorSummary: string,
    errorStage: 'hydrating' | 'projecting',
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'pending', error_stage = $2, error_summary = $3, updated_at = now()
        WHERE id = $1
      `,
      [itemId, errorStage, errorSummary],
    );
  }

  private async updateSyncRunStatus(
    syncRunId: string,
    status: 'discovering' | 'hydrating' | 'projecting',
  ): Promise<void> {
    await this.coreDataSource.query(
      `UPDATE mp.sync_run SET status = $2, updated_at = now() WHERE id = $1`,
      [syncRunId, status],
    );
  }

  private async updateSyncRunCounters(syncRunId: string): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET records_discovered = (
              SELECT COUNT(*) FROM mp.sync_run_item WHERE sync_run_id = $1
            ),
            records_hydrated = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND status IN ('succeeded', 'terminal')
            ),
            records_failed = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND status = 'pending' AND error_summary IS NOT NULL
            ),
            records_projected = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND status IN ('succeeded', 'terminal')
            ),
            pages_discovered = (
              SELECT COUNT(*) FROM mp.sync_run_page WHERE sync_run_id = $1
            ),
            pages_checkpointed = (
              SELECT COUNT(*) FROM mp.sync_run_page
              WHERE sync_run_id = $1 AND status = 'checkpointed'
            ),
            updated_at = now()
        WHERE id = $1
      `,
      [syncRunId],
    );
  }

  private async finishRun(
    context: SyncRunContext,
    jobRunRecordId: string,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    await this.updateSyncRunCounters(context.syncRunId);
    const counts = await this.coreDataSource.query<
      {
        records_discovered: string;
        records_hydrated: string;
        records_failed: string;
        pages_checkpointed: string;
      }[]
    >(
      `
        SELECT records_discovered, records_hydrated, records_failed, pages_checkpointed
        FROM mp.sync_run
        WHERE id = $1
      `,
      [context.syncRunId],
    );
    const count = counts[0];
    const recordsFailed = Number(count.records_failed);
    const status = recordsFailed > 0 ? 'partial_failed' : 'succeeded';
    const watermarkAfter =
      status === 'succeeded' ? await this.advanceWatermark(context) : null;

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = $2,
            watermark_after = $3,
            finished_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [context.syncRunId, status, watermarkAfter],
    );
    await this.mercadoPublicoPersistenceService.finalizeJobRun({
      jobRunRecordId,
      status: status === 'succeeded' ? 'success' : 'failed',
      finishedAt: new Date(),
      recordsFetched: Number(count.records_discovered),
      recordsCanonicalized: Number(count.records_hydrated),
      recordsFailed,
      errorSummary:
        status === 'partial_failed'
          ? 'partial_failed: one or more detail requests failed'
          : undefined,
    });

    this.logger.log(
      `Mercado Publico V2 sync ${context.syncRunId} finished as ${status}`,
    );
    const observationRows = await this.coreDataSource.query<
      { observation_id: string }[]
    >(
      `
        SELECT observation_id
        FROM mp.sync_run_item
        WHERE sync_run_id = $1 AND observation_id IS NOT NULL
        ORDER BY discovery_page ASC, id ASC
      `,
      [context.syncRunId],
    );

    return {
      syncRunId: context.syncRunId,
      status,
      recordsDiscovered: Number(count.records_discovered),
      recordsHydrated: Number(count.records_hydrated),
      recordsFailed,
      pagesCheckpointed: Number(count.pages_checkpointed),
      watermarkAfter,
      observationIds: observationRows.map((row) => row.observation_id),
      recordsProjected: Number(count.records_hydrated),
    };
  }

  private async advanceWatermark(
    context: SyncRunContext,
  ): Promise<Date | null> {
    const rows = await this.coreDataSource.query<
      { max_provider_changed_at: Date | null }[]
    >(
      `
        SELECT MAX(provider_changed_at) AS max_provider_changed_at
        FROM mp.sync_run_item
        WHERE sync_run_id = $1
      `,
      [context.syncRunId],
    );
    const candidate = getDate(rows[0]?.max_provider_changed_at);
    const watermarkAfter =
      candidate === null ||
      (context.watermarkBefore !== null && candidate < context.watermarkBefore)
        ? context.watermarkBefore
        : candidate;

    await this.coreDataSource.query(
      `
        INSERT INTO mp.source_watermark (source, scope, watermark_at, updated_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (source, scope) DO UPDATE
        SET watermark_at = EXCLUDED.watermark_at, updated_at = now()
      `,
      [
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        context.scope,
        watermarkAfter,
      ],
    );

    return watermarkAfter;
  }

  private async failRun(
    context: SyncRunContext,
    jobRunRecordId: string,
    error: unknown,
    stage: 'discovering' | 'hydrating' | 'projecting',
  ): Promise<void> {
    const errorSummary = `${classifyFailure(error)}: durable ${stage} failed`;

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = 'failed', error_stage = $2, error_retryable = $3,
            error_summary = $4, finished_at = now(), updated_at = now()
        WHERE id = $1
      `,
      [context.syncRunId, stage, false, errorSummary],
    );
    await this.mercadoPublicoPersistenceService.finalizeJobRun({
      jobRunRecordId,
      status: 'failed',
      finishedAt: new Date(),
      errorSummary,
      recordsFailed: 1,
    });
  }

  private async persistApiFailure(
    jobRunRecordId: string,
    response: MercadoPublicoApiV2CompraAgilListResponse,
  ): Promise<void> {
    await this.mercadoPublicoPersistenceService.persistApiFailure({
      jobRunRecordId,
      source: response.source,
      endpoint: response.endpoint,
      requestFingerprint: response.requestFingerprint,
      payloadChecksum: response.payloadChecksum,
      requestParams: response.requestParams,
      httpStatus: response.httpStatus,
      fetchedAt: response.fetchedAt,
      rawPayload: response.rawPayload,
      schemaFingerprint: response.schemaFingerprint,
      recordsFetched: response.compraAgil.length,
      errorSummaryText: this.buildProviderError(response, 'provider'),
    });
  }

  private buildProviderError(
    response: MercadoPublicoApiV2CompraAgilListResponse,
    stage: string,
  ): string {
    const summary = response.errorSummary ?? 'hard_fail';
    const code = response.errorCode ?? 'provider_error';

    return `${summary}: ${stage}: ${code}`;
  }
}
