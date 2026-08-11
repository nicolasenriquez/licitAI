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
  type MercadoPublicoV2LifecycleClassification,
  classifyV2CompraAgilLifecycle,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';
import { createJsonSha256 } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { extractV2CompraAgilPagination } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-pagination.util';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  type MercadoPublicoJobName,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';
import { type CompraAgilListParams } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';

const WATERMARK_OVERLAP_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 50;

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
  error_stage: string | null;
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
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly mercadoPublicoV2ProjectionService: MercadoPublicoV2ProjectionService,
  ) {}

  async start(
    payload: Record<string, unknown>,
    intent: MercadoPublicoV2SyncIntent = 'scheduled',
    jobName: MercadoPublicoJobName = 'api-v2-compra-agil-incremental',
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const context = await this.createSyncRun(intent, payload);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(jobName);
    let stage: 'discovering' | 'hydrating' = 'discovering';

    try {
      await this.updateSyncRunStatus(context.syncRunId, 'discovering');
      await this.freezeActiveCohort(context);
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

    if (context.error_stage === 'discovering') {
      throw new Error(
        `Mercado Publico V2 sync run ${syncRunId} failed during discovery and must be rediscovered`,
      );
    }

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
    const explicitChangeEnd = getNonEmptyString(payload.cambio_hasta);
    const explicitPublicationStart = getNonEmptyString(payload.publicado_desde);
    const explicitPublicationEnd = getNonEmptyString(payload.publicado_hasta);

    if (payload.orden !== undefined) {
      throw new Error(
        'Mercado Publico V2 durable sync does not support "orden"',
      );
    }

    if (
      (explicitChangeStart === undefined) !==
      (explicitChangeEnd === undefined)
    ) {
      throw new Error(
        'Mercado Publico V2 durable sync requires both cambio_desde and cambio_hasta when either is provided',
      );
    }

    if (
      (explicitPublicationStart === undefined) !==
      (explicitPublicationEnd === undefined)
    ) {
      throw new Error(
        'Mercado Publico V2 durable sync requires both publicado_desde and publicado_hasta when either is provided',
      );
    }

    const executionStartedAt = new Date().toISOString();
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

    const usesWatermarkWindow =
      explicitChangeStart === undefined && watermarkBefore !== null;

    return {
      cambio_desde: derivedChangeStart,
      cambio_hasta:
        explicitChangeEnd ??
        (usesWatermarkWindow ? executionStartedAt : undefined),
      ttl_cambio_ms:
        !usesWatermarkWindow && typeof payload.ttl_cambio_ms === 'number'
          ? payload.ttl_cambio_ms
          : undefined,
      publicado_desde: explicitPublicationStart,
      publicado_hasta: explicitPublicationEnd,
      estado: getNonEmptyString(payload.estado),
      region: typeof payload.region === 'number' ? payload.region : undefined,
      id: getNonEmptyString(payload.id),
      q: getNonEmptyString(payload.q),
      ordenar_por: getNonEmptyString(payload.ordenar_por),
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
        SELECT id, intent, scope, request_params, watermark_before, error_stage
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

  private async freezeActiveCohort(context: SyncRunContext): Promise<void> {
    await this.coreDataSource.query(
      `
        INSERT INTO mp.sync_run_item (
          sync_run_id, codigo, discovery_page, payload_checksum, status
        )
        SELECT $1, codigo, 0, 'cohort-freeze', 'pending'
        FROM mp.v2_cohort
        WHERE source = $2
          AND scope = $3
          AND status = 'active'
        ON CONFLICT (sync_run_id, codigo) DO NOTHING
      `,
      [
        context.syncRunId,
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        context.scope,
      ],
    );
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
    const knownCodes = await this.readActiveCohortCodes(context, codes);
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

        if (classification.reason === 'new_published') {
          await entityManager.query(
            `
              INSERT INTO mp.v2_cohort (
                source, scope, codigo, status, admitted_sync_run_id
              )
              VALUES ($1, $2, $3, 'active', $4)
              ON CONFLICT DO NOTHING
            `,
            [
              MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
              context.scope,
              record.codigo,
              context.syncRunId,
            ],
          );
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
            ON CONFLICT (sync_run_id, codigo) DO UPDATE SET
              discovery_page = EXCLUDED.discovery_page,
              raw_api_payload_id = EXCLUDED.raw_api_payload_id,
              payload_checksum = EXCLUDED.payload_checksum
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

  private async readActiveCohortCodes(
    context: SyncRunContext,
    codes: string[],
  ): Promise<Set<string>> {
    if (codes.length === 0) {
      return new Set();
    }

    const rows = await this.coreDataSource.query<{ codigo: string }[]>(
      `
        SELECT codigo
        FROM mp.v2_cohort
        WHERE source = $1
          AND scope = $2
          AND status = 'active'
          AND codigo = ANY($3::text[])
      `,
      [MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE, context.scope, codes],
    );

    return new Set(rows.map((row) => row.codigo));
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
    let successfulDetails = 0;
    let retryableRequestFailures = 0;

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
        const failure = classifyFailure(error);

        if (failure === 'hard_fail' || failure === 'param_error') {
          throw error;
        }

        if (failure === 'retryable_failed') {
          retryableRequestFailures += 1;
        }

        await this.markItemPending(
          item.id,
          `${failure}: detail request failed`,
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

          if (
            response.errorSummary === 'hard_fail' ||
            response.errorSummary === 'param_error'
          ) {
            throw new Error('systemic detail configuration failure');
          }

          if (response.errorSummary === 'retryable_failed') {
            retryableRequestFailures += 1;
          }
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

      const detailRecord = response.compraAgil.find(
        (record) => record.codigo === item.codigo,
      );

      if (detailRecord === undefined) {
        await this.markItemPending(
          item.id,
          'detail_codigo_mismatch',
          'hydrating',
        );
        await this.updateSyncRunCounters(context.syncRunId);
        continue;
      }

      const observationId = await this.recordObservationAndProjection(
        context.syncRunId,
        persistenceResult.rawApiPayloadId,
        response,
        detailRecord,
        'detail',
      );
      const lifecycle = classifyV2CompraAgilLifecycle(detailRecord, true);
      const terminal = lifecycle.terminal;
      successfulDetails += 1;

      await this.markItemSucceeded(
        item.id,
        persistenceResult.rawApiPayloadId,
        observationId,
        terminal,
        detailRecord,
      );

      if (terminal) {
        await this.markCohortTerminal(context, item.codigo, lifecycle.reason);
      }

      await this.updateSyncRunCounters(context.syncRunId);
    }

    if (
      items.length > 0 &&
      successfulDetails === 0 &&
      retryableRequestFailures === items.length
    ) {
      throw new Error('all detail requests failed');
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
        'list',
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
    snapshotKind: 'list' | 'detail',
  ): Promise<string> {
    const result = await this.mercadoPublicoV2ProjectionService.ingest({
      syncRunId,
      rawApiPayloadId,
      response,
      record,
      snapshotKind,
    });

    return result.observationId;
  }

  private async markCohortTerminal(
    context: SyncRunContext,
    codigo: string,
    lifecycleReason: MercadoPublicoV2LifecycleClassification['reason'],
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.v2_cohort
        SET status = 'terminal',
            terminal_sync_run_id = $1,
            terminal_at = now(),
            lifecycle_reason = $5,
            updated_at = now()
        WHERE source = $2
          AND scope = $3
          AND codigo = $4
          AND status = 'active'
      `,
      [
        context.syncRunId,
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        context.scope,
        codigo,
        lifecycleReason,
      ],
    );
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
