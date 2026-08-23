import { setTimeout as sleep } from 'node:timers/promises';

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
  isHistoricalV2CompraAgilSyncIntent,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';
import { createJsonSha256 } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { extractV2CompraAgilPagination } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-pagination.util';
import { getNextQuotaResetAt } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/get-next-quota-reset-at.util';
import {
  getHttpFailureStatus,
  getTransportFailureCode,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/get-transport-failure-metadata.util';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_DETAIL_BY_CODIGO_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  type MercadoPublicoJobName,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';
import { type CompraAgilListParams } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';

const WATERMARK_OVERLAP_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 50;
const MAX_BOUNDED_PAGES = 50;
const HYDRATION_BATCH_SIZE = 100;

export type MercadoPublicoV2SyncIntent =
  | 'scheduled'
  | 'manual'
  | 'replay'
  | 'backfill'
  | 'reconcile'
  | 'fixture'
  | 'recovery';

export type MercadoPublicoV2DurableSyncResult = {
  syncRunId: string;
  status: 'succeeded' | 'partial_failed' | 'failed' | 'cancelled';
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
  intent: MercadoPublicoV2SyncIntent;
  scope: string;
  requestParams: CompraAgilListParams;
  maxPages: number | undefined;
  watermarkBefore: Date | null;
  status: string;
  cancellationRequestedAt: Date | null;
};

type SyncRunItem = {
  id: string;
  codigo: string;
  attempts: number;
  status:
    | 'pending'
    | 'processing'
    | 'succeeded'
    | 'lifecycle_terminal'
    | 'failed'
    | 'deferred';
};

type CurrentDetailRow = {
  codigo: string;
  provider_changed_at: Date | string | null;
  state_id: string | null;
  state_code: string | null;
};

type HydrationPlan = {
  required: boolean;
  reason:
    | 'missing_detail_observation'
    | 'provider_change'
    | 'state_drift'
    | 'unchanged_detail'
    | 'frozen_active_cohort'
    | `lifecycle_${MercadoPublicoV2LifecycleClassification['reason']}`;
};

type SyncRunRow = {
  id: string;
  intent: MercadoPublicoV2SyncIntent;
  scope: string;
  request_params: Record<string, unknown>;
  watermark_before: Date | null;
  error_stage: string | null;
  error_retryable: boolean | null;
  status: string;
  cancellation_requested_at: Date | null;
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

const getMaxPages = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_BOUNDED_PAGES
  ) {
    throw new Error(
      `Mercado Publico V2 max pages must be an integer between 1 and ${MAX_BOUNDED_PAGES}`,
    );
  }

  return value;
};

const isGlobalIncrementalWindow = (params: CompraAgilListParams): boolean =>
  (params.cambio_desde === undefined) === (params.cambio_hasta === undefined) &&
  params.id === undefined &&
  params.q === undefined &&
  params.estado === undefined &&
  params.region === undefined &&
  params.publicado_desde === undefined &&
  params.publicado_hasta === undefined;

export const buildCompraAgilRequestParams = (
  payload: Record<string, unknown>,
  watermarkBefore: Date | null,
): CompraAgilListParams => {
  const hasExplicitId = getNonEmptyString(payload.id) !== undefined;
  const explicitChangeStart = getNonEmptyString(payload.cambio_desde);
  const explicitChangeEnd = getNonEmptyString(payload.cambio_hasta);
  const explicitPublicationStart = getNonEmptyString(payload.publicado_desde);
  const explicitPublicationEnd = getNonEmptyString(payload.publicado_hasta);

  if (payload.orden !== undefined) {
    throw new Error('Mercado Publico V2 durable sync does not support "orden"');
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
    (hasExplicitId || watermarkBefore === null
      ? undefined
      : new Date(
          watermarkBefore.getTime() - WATERMARK_OVERLAP_MS,
        ).toISOString());
  const pageSize =
    typeof payload.tamano_pagina === 'number'
      ? payload.tamano_pagina
      : DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new Error(
      'Mercado Publico V2 durable page size must be between 1 and 50',
    );
  }

  const usesWatermarkWindow =
    !hasExplicitId &&
    explicitChangeStart === undefined &&
    watermarkBefore !== null;

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
    ordenar_por:
      getNonEmptyString(payload.ordenar_por) ?? 'FechaUltimaModificacion',
    tamano_pagina: pageSize,
    numero_pagina: 1,
  };
};

@Injectable()
export class MercadoPublicoV2DurableSyncService {
  private readonly logger = new Logger(MercadoPublicoV2DurableSyncService.name);

  constructor(
    private readonly mercadoPublicoApiV2CompraAgilClientService: MercadoPublicoApiV2CompraAgilClientService,
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
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
    return this.startNewRun(payload, intent, jobName);
  }

  async startOrResume(
    payload: Record<string, unknown>,
    intent: MercadoPublicoV2SyncIntent,
    jobName: MercadoPublicoJobName,
    executionKey?: string,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const existingSyncRunId =
      executionKey === undefined
        ? null
        : await this.findSyncRunByExecutionKey(executionKey);

    if (existingSyncRunId !== null) {
      return this.executeExistingRun(existingSyncRunId);
    }

    return this.startNewRun(payload, intent, jobName, executionKey);
  }

  private async startNewRun(
    payload: Record<string, unknown>,
    intent: MercadoPublicoV2SyncIntent,
    jobName: MercadoPublicoJobName,
    executionKey?: string,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const context = await this.createSyncRun(intent, payload, executionKey);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(jobName);
    let stage: 'discovering' | 'hydrating' = 'discovering';

    try {
      await this.updateSyncRunStatus(context.syncRunId, 'discovering');
      context.status = 'discovering';
      const discovery = await this.discover(context, jobRunRecord.id);

      if (discovery === 'cancelled') {
        return this.cancelRun(context, jobRunRecord.id, 'discovering');
      }

      if (discovery === 'page_budget_reached') {
        await this.updateSyncRunStatus(context.syncRunId, 'hydrating');
        context.status = 'hydrating';

        return this.hydrateOrFinish(context, jobRunRecord.id);
      }

      await this.freezeActiveCohort(context);
      stage = 'hydrating';
      await this.updateSyncRunStatus(context.syncRunId, 'hydrating');
      context.status = 'hydrating';

      return this.hydrateOrFinish(context, jobRunRecord.id);
    } catch (error) {
      await this.failRun(context, jobRunRecord.id, error, stage);

      throw error;
    }
  }

  async resume(syncRunId: string): Promise<MercadoPublicoV2DurableSyncResult> {
    const context = await this.loadSyncRun(syncRunId);

    if (context.status === 'cancelled' && context.error_stage === 'queued') {
      return this.getCancelledRunResult(context);
    }

    if (
      context.status === 'queued' ||
      context.status === 'discovering' ||
      (context.status === 'partial_failed' &&
        context.error_stage === 'discovering' &&
        context.error_retryable)
    ) {
      return this.executeExistingRun(syncRunId);
    }

    if (
      context.error_stage === 'discovering' &&
      !(context.status === 'partial_failed' && context.error_retryable)
    ) {
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
      context.status = 'hydrating';
      return this.hydrateOrFinish(context, jobRunRecord.id);
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

  async executeExistingRun(
    syncRunId: string,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const context = await this.loadSyncRun(syncRunId);

    if (context.status === 'cancelled' && context.error_stage === 'queued') {
      return this.getCancelledRunResult(context);
    }

    if (
      (context.status === 'failed' || context.status === 'cancelled') &&
      context.error_stage === 'discovering'
    ) {
      throw new Error(
        `Mercado Publico V2 sync run ${syncRunId} failed during discovery and must be rediscovered`,
      );
    }

    if (
      ![
        'queued',
        'discovering',
        'hydrating',
        'projecting',
        'reconciling',
        'partial_failed',
        'cancelled',
      ].includes(context.status)
    ) {
      throw new Error(
        `Mercado Publico V2 sync run ${syncRunId} is terminal and cannot be resumed`,
      );
    }

    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );

    try {
      if (context.status === 'queued') {
        await this.updateSyncRunStatus(syncRunId, 'discovering');
        context.status = 'discovering';
        const discovery = await this.discover(context, jobRunRecord.id);

        if (discovery === 'cancelled') {
          return this.cancelRun(context, jobRunRecord.id, 'discovering');
        }

        if (discovery === 'page_budget_reached') {
          await this.updateSyncRunStatus(syncRunId, 'hydrating');
          context.status = 'hydrating';

          return await this.hydrateOrFinish(context, jobRunRecord.id);
        }

        await this.freezeActiveCohort(context);
        await this.updateSyncRunStatus(syncRunId, 'hydrating');
        context.status = 'hydrating';

        return await this.hydrateOrFinish(context, jobRunRecord.id);
      }

      if (
        context.status === 'discovering' ||
        (context.status === 'partial_failed' &&
          context.error_stage === 'discovering' &&
          context.error_retryable)
      ) {
        await this.updateSyncRunStatus(syncRunId, 'discovering');
        context.status = 'discovering';
        const nextPage = await this.getNextDiscoveryPage(syncRunId);
        const discovery = await this.discover(
          context,
          jobRunRecord.id,
          nextPage,
        );

        if (discovery === 'cancelled') {
          return this.cancelRun(context, jobRunRecord.id, 'discovering');
        }

        if (discovery === 'page_budget_reached') {
          await this.updateSyncRunStatus(syncRunId, 'hydrating');
          context.status = 'hydrating';

          return await this.hydrateOrFinish(context, jobRunRecord.id);
        }

        await this.freezeActiveCohort(context);
        await this.updateSyncRunStatus(syncRunId, 'hydrating');
        context.status = 'hydrating';

        return await this.hydrateOrFinish(context, jobRunRecord.id);
      }

      await this.resetProcessingItems(syncRunId);
      await this.updateSyncRunStatus(syncRunId, 'hydrating');
      context.status = 'hydrating';

      return await this.hydrateOrFinish(context, jobRunRecord.id);
    } catch (error) {
      const stage =
        context.status === 'hydrating' ? 'hydrating' : 'discovering';

      await this.failRun(context, jobRunRecord.id, error, stage);

      throw error;
    }
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
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_run_item
          SET status = 'succeeded', hydrated_at = now(), updated_at = now()
          WHERE sync_run_id = $1
            AND status = 'pending'
            AND observation_id IS NOT NULL
        `,
        [context.syncRunId],
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
    executionKey?: string,
  ): Promise<SyncRunContext> {
    const scope = getNonEmptyString(payload.scope) ?? 'global';
    const watermarkBefore = await this.readWatermark(scope);
    const requestParams = buildCompraAgilRequestParams(
      payload,
      watermarkBefore,
    );
    const maxPages = getMaxPages(payload.max_pages ?? payload.maxPages);
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_run (
          intent, source, scope, status, request_params, watermark_before,
          execution_key
        )
        VALUES ($1, $2, $3, 'queued', $4::jsonb, $5, $6::uuid)
        RETURNING id
      `,
      [
        intent,
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        scope,
        JSON.stringify({
          ...requestParams,
          ...(maxPages === undefined ? {} : { max_pages: maxPages }),
        }),
        watermarkBefore,
        executionKey ?? null,
      ],
    );

    return {
      syncRunId: rows[0].id,
      intent,
      scope,
      requestParams,
      maxPages,
      watermarkBefore,
      status: 'queued',
      cancellationRequestedAt: null,
    };
  }

  private async findSyncRunByExecutionKey(
    executionKey: string,
  ): Promise<string | null> {
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        SELECT id
        FROM mp.sync_run
        WHERE execution_key = $1::uuid
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [executionKey],
    );

    return rows[0]?.id ?? null;
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

  private async readQuotaResetAt(): Promise<Date | null> {
    const rows = await this.coreDataSource.query<{ reset_at: Date | null }[]>(
      `
        SELECT reset_at
        FROM mp.gold_api_quota_usage
        WHERE source = $1
      `,
      [MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE],
    );

    return getDate(rows[0]?.reset_at);
  }

  private async throwIfQuotaExhausted(
    response: MercadoPublicoApiV2CompraAgilListResponse,
    stage: 'discovering' | 'hydrating',
  ): Promise<void> {
    if (
      response.errorSummary !== 'retryable_failed' ||
      response.httpStatus !== 429 ||
      response.retryAfterSeconds !== undefined
    ) {
      return;
    }

    const recordedResetAt = await this.readQuotaResetAt();

    throw new MercadoPublicoRecordedJobFailureError(
      this.buildProviderError(response, stage),
      true,
      recordedResetAt ??
        getNextQuotaResetAt(
          this.mercadoPublicoConfigService.getSettings().quotaTimezone,
        ),
    );
  }

  private async loadSyncRun(
    syncRunId: string,
  ): Promise<SyncRunContext & SyncRunRow> {
    const rows = await this.coreDataSource.query<SyncRunRow[]>(
      `
        SELECT id, intent, scope, request_params, watermark_before, error_stage,
                error_retryable, status, cancellation_requested_at
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
      intent: row.intent,
      requestParams: this.toCompraAgilListParams(row.request_params),
      maxPages: getMaxPages(row.request_params.max_pages),
      watermarkBefore: getDate(row.watermark_before),
      cancellationRequestedAt: getDate(row.cancellation_requested_at),
    };
  }

  private toCompraAgilListParams(
    value: Record<string, unknown>,
  ): CompraAgilListParams {
    const {
      max_pages: _maxPages,
      maxPages: _legacyMaxPages,
      bounded_window: _boundedWindow,
      ...requestParams
    } = value;

    return {
      ...requestParams,
      tamano_pagina:
        typeof value.tamano_pagina === 'number'
          ? value.tamano_pagina
          : DEFAULT_PAGE_SIZE,
      numero_pagina: 1,
    } as CompraAgilListParams;
  }

  private async freezeActiveCohort(context: SyncRunContext): Promise<void> {
    if (
      context.intent !== 'reconcile' ||
      context.requestParams.id !== undefined
    ) {
      return;
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.sync_run_item (
          sync_run_id, codigo, discovery_page, payload_checksum, status,
          hydration_required, hydration_reason
        )
        SELECT $1, codigo, 0, 'cohort-freeze', 'pending', true,
               'frozen_active_cohort'
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
    startPageNumber = 1,
  ): Promise<'completed' | 'cancelled' | 'page_budget_reached'> {
    const pageSize = context.requestParams.tamano_pagina ?? DEFAULT_PAGE_SIZE;
    let pageNumber = startPageNumber;

    while (true) {
      let response: MercadoPublicoApiV2CompraAgilListResponse;

      try {
        response =
          await this.mercadoPublicoApiV2CompraAgilClientService.getList({
            ...context.requestParams,
            numero_pagina: pageNumber,
          });
      } finally {
        await this.touchHeartbeat(context.syncRunId);
      }

      if (response.errorSummary !== undefined) {
        await this.persistApiFailure(jobRunRecordId, response);
        await this.throwIfQuotaExhausted(response, 'discovering');

        if (response.errorSummary === 'retryable_failed') {
          await this.waitBeforeRetry(response.retryAfterSeconds);
        }
        throw new MercadoPublicoRecordedJobFailureError(
          this.buildProviderError(response, 'discovering'),
          response.errorSummary === 'retryable_failed',
        );
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

      if (
        context.maxPages !== undefined &&
        pageNumber - startPageNumber + 1 >= context.maxPages
      ) {
        await this.completeDiscovery(context.syncRunId, 'page_budget_reached');

        return 'page_budget_reached';
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

      if (await this.hasCancellationRequest(context.syncRunId)) {
        return 'cancelled';
      }
    }

    await this.completeDiscovery(context.syncRunId, 'exhausted');

    return 'completed';
  }

  private async checkpointPage(
    context: SyncRunContext,
    response: MercadoPublicoApiV2CompraAgilListResponse,
    rawApiPayloadId: string,
  ): Promise<void> {
    const codes = response.compraAgil.map((record) => record.codigo);
    const knownCodes = await this.readActiveCohortCodes(context, codes);
    const currentDetailsByCode = await this.readCurrentDetailsByCode(codes);
    const pageNumber = response.pagination?.pageNumber ?? 1;
    const pageSize =
      response.pagination?.pageSize ?? response.compraAgil.length;

    await this.coreDataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `
          INSERT INTO mp.sync_run_page (
            sync_run_id, page_number, page_size, total_pages, total_results,
            records_returned, request_params, raw_api_payload_id, status,
            completed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'checkpointed', now())
          ON CONFLICT (sync_run_id, page_number) DO NOTHING
        `,
        [
          context.syncRunId,
          pageNumber,
          pageSize,
          response.pagination?.totalPages ?? null,
          response.pagination?.totalResults ?? null,
          response.compraAgil.length,
          JSON.stringify(response.requestParams),
          rawApiPayloadId,
        ],
      );

      for (const record of response.compraAgil) {
        const targetedSync = context.requestParams.id === record.codigo;
        const classification = classifyV2CompraAgilLifecycle(
          record,
          knownCodes.has(record.codigo) || targetedSync,
          {
            includeHistoricalTerminal: isHistoricalV2CompraAgilSyncIntent(
              context.intent,
            ),
          },
        );

        const projectionResult =
          await this.mercadoPublicoV2ProjectionService.ingestWithEntityManager(
            entityManager,
            {
              syncRunId: context.syncRunId,
              rawApiPayloadId,
              response,
              record,
              snapshotKind: 'list',
            },
          );

        if (
          classification.includeInRun &&
          classification.reason === 'new_published'
        ) {
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
        const hydrationPlan = classification.includeInRun
          ? this.getHydrationPlan(
              record,
              currentDetailsByCode.get(record.codigo),
            )
          : {
              required: false,
              reason: `lifecycle_${classification.reason}`,
            };

        await entityManager.query(
          `
            INSERT INTO mp.sync_run_item (
              sync_run_id, codigo, discovery_page, raw_api_payload_id,
              payload_checksum, state_id, state_code, state_label,
              provider_changed_at_raw, provider_changed_at, status,
              hydration_required, hydration_reason
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (sync_run_id, codigo) DO UPDATE SET
              discovery_page = EXCLUDED.discovery_page,
              raw_api_payload_id = EXCLUDED.raw_api_payload_id,
              payload_checksum = EXCLUDED.payload_checksum,
              state_id = EXCLUDED.state_id,
              state_code = EXCLUDED.state_code,
              state_label = EXCLUDED.state_label,
              provider_changed_at_raw = EXCLUDED.provider_changed_at_raw,
              provider_changed_at = EXCLUDED.provider_changed_at,
              hydration_required = EXCLUDED.hydration_required,
              hydration_reason = EXCLUDED.hydration_reason
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
            classification.includeInRun ? 'pending' : 'succeeded',
            hydrationPlan.required,
            hydrationPlan.reason,
          ],
        );

        await entityManager.query(
          `
            UPDATE mp.sync_run_item
            SET observation_id = $3, updated_at = now()
            WHERE sync_run_id = $1 AND codigo = $2
          `,
          [context.syncRunId, record.codigo, projectionResult.observationId],
        );
      }
    });

    await this.updateSyncRunCounters(context.syncRunId);
  }

  private async readCurrentDetailsByCode(
    codes: string[],
  ): Promise<Map<string, CurrentDetailRow>> {
    if (codes.length === 0) {
      return new Map();
    }

    const rows = await this.coreDataSource.query<CurrentDetailRow[]>(
      `
        SELECT c.codigo, c.provider_changed_at, c.state_id,
               c.estado AS state_code
        FROM mp.compra_agil c
        INNER JOIN mp.v2_observation o ON o.id = c.observation_id
        WHERE c.codigo = ANY($1::text[])
          AND o.snapshot_kind = 'detail'
      `,
      [codes],
    );

    return new Map(rows.map((row) => [row.codigo, row]));
  }

  private getHydrationPlan(
    record: MercadoPublicoApiV2CompraAgilRecord,
    currentDetail: CurrentDetailRow | undefined,
  ): HydrationPlan {
    const normalized = normalizeV2CompraAgilRecord(record);

    if (currentDetail === undefined) {
      return { required: true, reason: 'missing_detail_observation' };
    }

    const currentChangedAt = getDate(currentDetail.provider_changed_at);

    if (
      normalized.providerChangedAt === null ||
      currentChangedAt === null ||
      normalized.providerChangedAt.getTime() !== currentChangedAt.getTime()
    ) {
      return { required: true, reason: 'provider_change' };
    }

    if (
      normalized.stateId !== currentDetail.state_id ||
      normalized.stateCode !== currentDetail.state_code
    ) {
      return { required: true, reason: 'state_drift' };
    }

    return { required: false, reason: 'unchanged_detail' };
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
  ): Promise<'completed' | 'cancelled'> {
    await this.completeCarryForwardItems(context.syncRunId);
    const maxAttempts =
      this.mercadoPublicoConfigService.getSettings().httpMaxRetries + 1;
    let isFirstItem = true;

    while (true) {
      const items = await this.coreDataSource.query<SyncRunItem[]>(
        `
          SELECT id, codigo, attempts, status
          FROM mp.sync_run_item
          WHERE sync_run_id = $1
            AND status = 'pending'
            AND hydration_required = true
          ORDER BY attempts ASC, discovery_page ASC, id ASC
          LIMIT ${HYDRATION_BATCH_SIZE}
        `,
        [context.syncRunId],
      );

      if (items.length === 0) {
        return 'completed';
      }

      for (const item of items) {
        if (
          !isFirstItem &&
          (await this.hasCancellationRequest(context.syncRunId))
        ) {
          return 'cancelled';
        }
        isFirstItem = false;

        if (item.attempts >= maxAttempts) {
          await this.markItemDeferred(item.id, 'retryable_failed: exhausted');
          await this.updateSyncRunCounters(context.syncRunId);
          continue;
        }

        await this.coreDataSource.query(
          `
            UPDATE mp.sync_run_item
            SET status = 'processing', attempts = attempts + 1, updated_at = now()
            WHERE id = $1 AND status = 'pending'
          `,
          [item.id],
        );

        const attemptNumber = item.attempts + 1;
        const requestStartedAt = new Date();
        let response: MercadoPublicoApiV2CompraAgilListResponse;

        try {
          response =
            await this.mercadoPublicoApiV2CompraAgilClientService.getByCodigo(
              item.codigo,
            );
        } catch (error) {
          const failure = classifyFailure(error);
          const transportCode = getTransportFailureCode(error);

          await this.recordItemAttempt({
            context,
            item,
            attemptNumber,
            requestStartedAt,
            httpStatus: getHttpFailureStatus(error),
            transportErrorCode: transportCode,
            failureClass: failure,
            retryable: failure === 'retryable_failed',
          });

          if (failure === 'hard_fail' || failure === 'param_error') {
            throw error;
          }

          if (
            failure === 'retryable_failed' &&
            item.attempts + 1 < maxAttempts
          ) {
            await this.markItemPending(
              item.id,
              `retryable_failed: detail request failed: ${transportCode}`,
              'hydrating',
            );
            await this.waitBeforeRetry();
          } else if (failure === 'retryable_failed') {
            await this.markItemDeferred(
              item.id,
              `retryable_failed: detail request failed: ${transportCode}`,
            );
          } else {
            await this.markItemFailed(
              item.id,
              `${failure}: detail request failed: ${transportCode}`,
            );
          }
          await this.updateSyncRunCounters(context.syncRunId);
          continue;
        } finally {
          await this.touchHeartbeat(context.syncRunId);
        }

        const persistenceResult =
          await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
            {
              jobRunRecordId,
              apiResponse: response,
              snapshotKind: 'detail',
              errorSummaryText:
                response.errorSummary === undefined
                  ? undefined
                  : this.buildProviderError(response, 'provider'),
            },
          );

        await this.recordItemAttempt({
          context,
          item,
          attemptNumber,
          requestStartedAt,
          httpStatus: response.httpStatus,
          providerErrorCode: response.errorCode,
          providerErrorMessage: response.errorMessage,
          failureClass: response.errorSummary,
          retryable: response.errorSummary === 'retryable_failed',
          retryAfterSeconds: response.retryAfterSeconds,
          rawApiPayloadId: persistenceResult.rawApiPayloadId,
        });

        if (
          response.errorSummary !== undefined ||
          response.compraAgil.length === 0
        ) {
          if (
            response.errorSummary === 'hard_fail' ||
            response.errorSummary === 'param_error'
          ) {
            throw new Error('systemic detail configuration failure');
          }

          if (
            response.errorSummary === 'retryable_failed' &&
            item.attempts + 1 < maxAttempts
          ) {
            await this.markItemPending(
              item.id,
              'retryable_failed',
              'hydrating',
              persistenceResult.rawApiPayloadId,
            );
            await this.throwIfQuotaExhausted(response, 'hydrating');
            await this.waitBeforeRetry(response.retryAfterSeconds);
          } else if (response.errorSummary === 'retryable_failed') {
            await this.markItemDeferred(
              item.id,
              'retryable_failed',
              persistenceResult.rawApiPayloadId,
            );
          } else {
            await this.markItemFailed(
              item.id,
              response.errorSummary ?? 'soft_miss',
              persistenceResult.rawApiPayloadId,
            );
          }
          await this.updateSyncRunCounters(context.syncRunId);
          continue;
        }

        const detailRecord = response.compraAgil.find(
          (record) => record.codigo === item.codigo,
        );

        if (detailRecord === undefined) {
          await this.markItemFailed(
            item.id,
            'detail_codigo_mismatch',
            persistenceResult.rawApiPayloadId,
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
        const lifecycle = classifyV2CompraAgilLifecycle(detailRecord, true, {
          includeHistoricalTerminal: isHistoricalV2CompraAgilSyncIntent(
            context.intent,
          ),
        });
        const terminal = lifecycle.terminal;
        await this.markItemSucceeded(
          item.id,
          persistenceResult.rawApiPayloadId,
          observationId,
          terminal,
        );

        if (terminal) {
          await this.markCohortTerminal(context, item.codigo, lifecycle.reason);
        }

        await this.updateSyncRunCounters(context.syncRunId);
      }
    }
  }

  private async waitBeforeRetry(retryAfterSeconds?: number): Promise<void> {
    const delayMs =
      retryAfterSeconds === undefined
        ? this.mercadoPublicoConfigService.getSettings().httpRetryBackoffMs
        : retryAfterSeconds * 1000;

    // ponytail: serial requests protect provider quota; use delayed jobs if queue latency breaches SLO.
    await sleep(delayMs);
  }

  private async completeCarryForwardItems(syncRunId: string): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item item
        SET status = 'succeeded',
            raw_api_payload_id = observation.raw_api_payload_id,
            observation_id = observation.id,
            error_stage = NULL,
            error_summary = NULL,
            updated_at = now()
        FROM mp.compra_agil current
        INNER JOIN mp.v2_observation observation
          ON observation.id = current.observation_id
        WHERE item.sync_run_id = $1
          AND item.status = 'pending'
          AND item.hydration_required = false
          AND item.codigo = current.codigo
          AND observation.snapshot_kind = 'detail'
      `,
      [syncRunId],
    );
    await this.updateSyncRunCounters(syncRunId);
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
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = $2,
            raw_api_payload_id = $3,
            observation_id = $4,
            error_stage = NULL,
            error_summary = NULL,
            hydrated_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [
        itemId,
        terminal ? 'lifecycle_terminal' : 'succeeded',
        rawApiPayloadId,
        observationId,
      ],
    );
  }

  private async markItemPending(
    itemId: string,
    errorSummary: string,
    errorStage: 'hydrating' | 'projecting',
    rawApiPayloadId?: string,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'pending',
            error_stage = $2,
            error_summary = $3,
            raw_api_payload_id = COALESCE($4, raw_api_payload_id),
            updated_at = now()
        WHERE id = $1
      `,
      [itemId, errorStage, errorSummary, rawApiPayloadId ?? null],
    );
  }

  private async markItemFailed(
    itemId: string,
    errorSummary: string,
    rawApiPayloadId?: string,
  ): Promise<void> {
    await this.setItemTerminalStatus(
      itemId,
      'failed',
      errorSummary,
      rawApiPayloadId,
    );
  }

  private async markItemDeferred(
    itemId: string,
    errorSummary: string,
    rawApiPayloadId?: string,
  ): Promise<void> {
    await this.setItemTerminalStatus(
      itemId,
      'deferred',
      errorSummary,
      rawApiPayloadId,
    );
  }

  private async setItemTerminalStatus(
    itemId: string,
    status: 'failed' | 'deferred',
    errorSummary: string,
    rawApiPayloadId?: string,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = $2,
            error_stage = 'hydrating',
            error_summary = $3,
            raw_api_payload_id = COALESCE($4, raw_api_payload_id),
            updated_at = now()
        WHERE id = $1
      `,
      [itemId, status, errorSummary, rawApiPayloadId ?? null],
    );
  }

  private async recordItemAttempt(input: {
    context: SyncRunContext;
    item: SyncRunItem;
    attemptNumber: number;
    requestStartedAt: Date;
    httpStatus: number | null;
    transportErrorCode?: string;
    providerErrorCode?: string;
    providerErrorMessage?: string;
    failureClass?: string;
    retryable: boolean;
    retryAfterSeconds?: number;
    rawApiPayloadId?: string | null;
  }): Promise<void> {
    try {
      const requestFinishedAt = new Date();
      const latencyMs = Math.max(
        0,
        requestFinishedAt.getTime() - input.requestStartedAt.getTime(),
      );

      await this.coreDataSource.query(
        `
          INSERT INTO mp.sync_run_item_attempt (
            sync_run_id, sync_run_item_id, attempt_number, endpoint,
            request_started_at, request_finished_at, latency_ms,
            http_status, transport_error_code, provider_error_code,
            provider_error_message, failure_class, retryable,
            retry_after_seconds, raw_api_payload_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `,
        [
          input.context.syncRunId,
          input.item.id,
          input.attemptNumber,
          MERCADO_PUBLICO_API_V2_COMPRA_AGIL_DETAIL_BY_CODIGO_ENDPOINT,
          input.requestStartedAt,
          requestFinishedAt,
          latencyMs,
          input.httpStatus ?? null,
          input.transportErrorCode ?? null,
          input.providerErrorCode ?? null,
          input.providerErrorMessage ?? null,
          input.failureClass ?? null,
          input.retryable,
          input.retryAfterSeconds ?? null,
          input.rawApiPayloadId ?? null,
        ],
      );
    } catch (error) {
      // ponytail: attempt telemetry is best-effort so hydration never depends on it.
      // ceiling: attempt rows can be lost on DB failure.
      // trigger: promote to a hard dependency when alerting or accounting reads this
      // table; the debt recovery worker is the first consumer.
      this.logger.warn(
        `Failed to record attempt ${input.attemptNumber} for Mercado Publico V2 item ${input.item.codigo}: ${(error as Error).message}`,
      );
    }
  }

  private async completeDiscovery(
    syncRunId: string,
    completionReason: 'exhausted' | 'page_budget_reached',
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET discovery_complete = $3,
            completion_reason = $2,
            updated_at = now()
        WHERE id = $1
      `,
      [syncRunId, completionReason, completionReason === 'exhausted'],
    );
  }

  private async updateSyncRunStatus(
    syncRunId: string,
    status: 'discovering' | 'hydrating' | 'projecting',
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = $2,
            error_stage = NULL,
            error_retryable = NULL,
            error_summary = NULL,
            finished_at = NULL,
            updated_at = now()
        WHERE id = $1
      `,
      [syncRunId, status],
    );
  }

  private async hydrateOrFinish(
    context: SyncRunContext,
    jobRunRecordId: string,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const hydration = await this.hydrate(context, jobRunRecordId);

    if (hydration === 'cancelled') {
      return this.cancelRun(context, jobRunRecordId, 'hydrating');
    }

    return this.finishRun(context, jobRunRecordId);
  }

  private async getNextDiscoveryPage(syncRunId: string): Promise<number> {
    const rows = await this.coreDataSource.query<{ max_page: string | null }[]>(
      `
        SELECT MAX(page_number)::text AS max_page
        FROM mp.sync_run_page
        WHERE sync_run_id = $1
      `,
      [syncRunId],
    );
    const maxPage = Number.parseInt(rows[0]?.max_page ?? '', 10);

    return Number.isNaN(maxPage) ? 1 : maxPage + 1;
  }

  private async hasCancellationRequest(syncRunId: string): Promise<boolean> {
    const rows = await this.coreDataSource.query<
      { cancellation_requested_at: Date | null }[]
    >(
      `
        SELECT cancellation_requested_at
        FROM mp.sync_run
        WHERE id = $1
      `,
      [syncRunId],
    );

    return getDate(rows[0]?.cancellation_requested_at) !== null;
  }

  private async resetProcessingItems(syncRunId: string): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'pending', updated_at = now()
        WHERE sync_run_id = $1 AND status = 'processing'
      `,
      [syncRunId],
    );
  }

  private async touchHeartbeat(syncRunId: string): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET heartbeat_at = now(), updated_at = now()
        WHERE id = $1
      `,
      [syncRunId],
    );
  }

  private async cancelRun(
    context: SyncRunContext,
    jobRunRecordId: string,
    stage: 'discovering' | 'hydrating',
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    await this.updateSyncRunCounters(context.syncRunId);
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = 'cancelled', error_stage = $2, finished_at = now(), updated_at = now()
        WHERE id = $1
      `,
      [context.syncRunId, stage],
    );
    const counts = await this.coreDataSource.query<
      {
        records_discovered?: string;
        records_hydrated?: string;
        records_failed?: string;
        records_projected?: string;
        pages_checkpointed?: string;
      }[]
    >(
      `
        SELECT records_discovered, records_hydrated, records_failed,
               records_projected, pages_checkpointed
        FROM mp.sync_run
        WHERE id = $1
      `,
      [context.syncRunId],
    );
    const count = counts[0] ?? {};

    await this.mercadoPublicoPersistenceService.finalizeJobRun({
      jobRunRecordId,
      status: 'failed',
      finishedAt: new Date(),
      errorSummary: 'cancelled',
      recordsFailed: 0,
    });
    this.logger.log(
      `Mercado Publico V2 sync ${context.syncRunId} cancelled cooperatively`,
    );

    return {
      syncRunId: context.syncRunId,
      status: 'cancelled',
      recordsDiscovered: Number(count.records_discovered ?? 0),
      recordsHydrated: Number(count.records_hydrated ?? 0),
      recordsFailed: Number(count.records_failed ?? 0),
      pagesCheckpointed: Number(count.pages_checkpointed ?? 0),
      watermarkAfter: null,
      observationIds: [],
      recordsProjected: Number(count.records_projected ?? 0),
    };
  }

  private async getCancelledRunResult(
    context: SyncRunContext,
  ): Promise<MercadoPublicoV2DurableSyncResult> {
    const counts = await this.coreDataSource.query<
      {
        records_discovered: string;
        records_hydrated: string;
        records_failed: string;
        records_projected: string;
        pages_checkpointed: string;
      }[]
    >(
      `
        SELECT records_discovered, records_hydrated, records_failed,
               records_projected, pages_checkpointed
        FROM mp.sync_run
        WHERE id = $1
      `,
      [context.syncRunId],
    );
    const count = counts[0] ?? {};

    return {
      syncRunId: context.syncRunId,
      status: 'cancelled',
      recordsDiscovered: Number(count.records_discovered ?? 0),
      recordsHydrated: Number(count.records_hydrated ?? 0),
      recordsFailed: Number(count.records_failed ?? 0),
      pagesCheckpointed: Number(count.pages_checkpointed ?? 0),
      watermarkAfter: null,
      observationIds: [],
      recordsProjected: Number(count.records_projected ?? 0),
    };
  }

  private async updateSyncRunCounters(syncRunId: string): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET records_discovered = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND discovery_page > 0
            ),
            provider_records_seen = (
              SELECT COALESCE(SUM(records_returned), 0)
              FROM mp.sync_run_page
              WHERE sync_run_id = $1
            ),
            records_hydration_required = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND hydration_required = true
            ),
            records_hydration_skipped = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND hydration_required = false
            ),
            records_hydrated = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND hydrated_at IS NOT NULL
            ),
            records_failed = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1
                AND status = 'failed'
            ),
            records_deferred = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1
                AND status = 'deferred'
            ),
            records_projected = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND observation_id IS NOT NULL
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
        records_deferred: string;
        records_projected: string;
        pages_checkpointed: string;
        discovery_complete: boolean;
      }[]
    >(
      `
        SELECT records_discovered, records_hydrated, records_failed,
               records_deferred, records_projected, pages_checkpointed,
               discovery_complete
        FROM mp.sync_run
        WHERE id = $1
      `,
      [context.syncRunId],
    );
    const count = counts[0];
    const recordsFailed = Number(count.records_failed);
    const recordsDeferred = Number(count.records_deferred);
    const status =
      recordsFailed > 0 || recordsDeferred > 0 ? 'partial_failed' : 'succeeded';
    const watermarkAfter =
      count.discovery_complete === true &&
      context.maxPages === undefined &&
      isGlobalIncrementalWindow(context.requestParams)
        ? await this.advanceWatermark(context)
        : null;

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
          ? recordsFailed > 0
            ? 'partial_failed: one or more detail requests failed'
            : 'partial_failed: one or more detail requests were deferred for recovery'
          : undefined,
    });
    const jobRunRows = await this.coreDataSource.query<{ job_name: string }[]>(
      `
        SELECT job_name
        FROM mp.stg_job_run
        WHERE id = $1
      `,
      [jobRunRecordId],
    );
    const jobName = jobRunRows[0]?.job_name;

    if (jobName !== undefined) {
      await this.mercadoPublicoPersistenceService.recordPipelineHealth({
        jobName,
        succeeded: status === 'succeeded',
      });
    }

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
      recordsProjected: Number(count.records_projected ?? 0),
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
          AND discovery_page > 0
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
    const retryable =
      error instanceof MercadoPublicoRecordedJobFailureError
        ? error.retryable
        : classifyFailure(error) === 'retryable_failed';
    const errorSummary = `${
      retryable ? 'retryable_failed' : classifyFailure(error)
    }: durable ${stage} failed`;

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = CASE WHEN $3 THEN 'partial_failed' ELSE 'failed' END,
            error_stage = $2, error_retryable = $3,
            error_summary = $4,
            finished_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [context.syncRunId, stage, retryable, errorSummary],
    );
    await this.mercadoPublicoPersistenceService.finalizeJobRun({
      jobRunRecordId,
      status: retryable ? 'retryable_failed' : 'failed',
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
