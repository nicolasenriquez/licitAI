import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import {
  createMercadoPublicoCompraAgilExtractionManifest,
  mapMercadoPublicoErrorSummaryToManifestStatus,
  recordMercadoPublicoCompraAgilManifestPage,
  type MercadoPublicoCompraAgilExtractionManifest,
} from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-compra-agil-extraction-manifest.util';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import {
  buildMercadoPublicoErrorSummaryText,
  buildMercadoPublicoUnexpectedErrorSummaryText,
} from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';

type MercadoPublicoApiV2CompraAgilIncrementalPayload = {
  ttl_cambio_ms?: number;
  cambio_desde?: string;
  cambio_hasta?: string;
  tamano_pagina?: number;
  numero_pagina?: number;
  id?: string;
  q?: string;
  estado?: string;
  region?: number;
  ordenar_por?: string;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilIncrementalService {
  private readonly logger = new Logger(
    MercadoPublicoApiV2CompraAgilIncrementalService.name,
  );

  constructor(
    private readonly mercadoPublicoApiV2CompraAgilClientService: MercadoPublicoApiV2CompraAgilClientService,
    private readonly mercadoPublicoCanonicalRefreshService: MercadoPublicoCanonicalRefreshService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
    @InjectMessageQueue(MessageQueue.mercadoPublicoQueue)
    private readonly mercadoPublicoQueue: MessageQueueService,
    @Optional()
    private readonly mercadoPublicoConfigService?: MercadoPublicoConfigService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );
    let extractionManifest: MercadoPublicoCompraAgilExtractionManifest | undefined;

    try {
      extractionManifest = createMercadoPublicoCompraAgilExtractionManifest({
        jobName: 'api-v2-compra-agil-incremental',
        requestParams: {},
        requestedLocalWindow: payload.requested_local_window,
        fallbackUsed: payload.fallback_used,
        fallbackReason: payload.fallback_reason,
        effectiveDate: payload.effective_date,
      });
      const parsedPayload = this.parsePayload(payload);
      extractionManifest = createMercadoPublicoCompraAgilExtractionManifest({
        jobName: 'api-v2-compra-agil-incremental',
        requestParams: parsedPayload,
        requestedLocalWindow: payload.requested_local_window,
        fallbackUsed: payload.fallback_used,
        fallbackReason: payload.fallback_reason,
        effectiveDate: payload.effective_date,
      });
      const firstPage = parsedPayload.numero_pagina ?? 1;
      const firstApiResponse =
        await this.mercadoPublicoApiV2CompraAgilClientService.getList({
          ...parsedPayload,
          numero_pagina: firstPage,
        });
      const declaredLastPage =
        firstApiResponse.pagination?.totalPages ?? firstPage;
      const lastPage = Math.min(
        declaredLastPage,
        firstPage +
          (this.mercadoPublicoConfigService?.getSettings().compraAgilMaxPages ??
            250) -
          1,
      );
      let recordsFetched = 0;
      let recordsStaged = 0;
      let recordsCanonicalized = 0;
      const listedRecords: MercadoPublicoApiV2CompraAgilRecord[] = [];
      const uniqueCodes = new Set<string>();

      extractionManifest.pagesRequested = lastPage - firstPage + 1;

      for (let page = firstPage; page <= lastPage; page += 1) {
        const apiResponse =
          page === firstPage
            ? firstApiResponse
            : await this.mercadoPublicoApiV2CompraAgilClientService.getList({
                ...parsedPayload,
                numero_pagina: page,
              });

        recordMercadoPublicoCompraAgilManifestPage(
          extractionManifest,
          apiResponse,
          uniqueCodes,
          apiResponse.errorSummary === undefined,
        );

        if (apiResponse.errorSummary !== undefined) {
          const errorSummaryText =
            buildMercadoPublicoErrorSummaryText(apiResponse);
          extractionManifest.status =
            mapMercadoPublicoErrorSummaryToManifestStatus(
              apiResponse.errorSummary,
            );
          extractionManifest.errorSummary = errorSummaryText;

          await this.mercadoPublicoPersistenceService.persistApiFailure({
            jobRunRecordId: jobRunRecord.id,
            source: apiResponse.source,
            endpoint: apiResponse.endpoint,
            requestFingerprint: apiResponse.requestFingerprint,
            payloadChecksum: apiResponse.payloadChecksum,
            requestParams: apiResponse.requestParams,
            httpStatus: apiResponse.httpStatus,
            fetchedAt: apiResponse.fetchedAt,
            rawPayload: apiResponse.rawPayload,
            schemaFingerprint: apiResponse.schemaFingerprint,
            recordsFetched: apiResponse.compraAgil.length,
            errorSummaryText,
          });
          await this.mercadoPublicoPersistenceService.finalizeJobRun({
            jobRunRecordId: jobRunRecord.id,
            status: mapMercadoPublicoErrorSummaryToJobRunStatus(
              apiResponse.errorSummary,
            ),
            finishedAt: new Date(),
            errorSummary: errorSummaryText,
            recordsFetched: recordsFetched + apiResponse.compraAgil.length,
            recordsStaged,
            recordsCanonicalized,
            recordsFailed: 1,
            manifest: extractionManifest,
          });

          throw new MercadoPublicoRecordedJobFailureError(
            errorSummaryText,
            apiResponse.errorSummary === 'retryable_failed',
            apiResponse.errorSummary,
          );
        }

        const persistenceResult =
          await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
            {
              jobRunRecordId: jobRunRecord.id,
              apiResponse,
              snapshotKind: 'list',
            },
          );

        recordsFetched += persistenceResult.recordsFetched;
        recordsStaged += persistenceResult.recordsStaged;
        recordsCanonicalized +=
          persistenceResult.recordsStaged === 0
            ? 0
            : await this.mercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
                persistenceResult.rawApiPayloadId,
              );
        listedRecords.push(...apiResponse.compraAgil);
      }

      const partialSummary =
        lastPage < declaredLastPage
          ? `partial: provider declared ${declaredLastPage} pages; stopped at configured cap ${lastPage - firstPage + 1}`
          : undefined;

      const isPartial = partialSummary !== undefined;
      const hasNoRecords = recordsFetched === 0;

      extractionManifest.status = isPartial
        ? 'partial'
        : hasNoRecords
          ? 'empty'
          : 'complete';
      extractionManifest.errorSummary = partialSummary ?? null;

      if (!isPartial) {
        await this.enqueuePublishedDetailHydration(listedRecords);
        await this.enqueueReconciliationRefresh();
      }

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: isPartial ? 'partial' : hasNoRecords ? 'soft_miss' : 'success',
        finishedAt: new Date(),
        errorSummary: partialSummary,
        recordsFetched,
        recordsStaged,
        recordsCanonicalized,
        recordsFailed: 0,
        manifest: extractionManifest,
      });

      this.logger.log(
        `Ingested ${recordsFetched} V2 Compra Agil records across ${lastPage - firstPage + 1} page(s) with window ${JSON.stringify(parsedPayload)}`,
      );
    } catch (error) {
      if (error instanceof MercadoPublicoRecordedJobFailureError) {
        this.logger.error(error.message);

        throw error;
      }

      const errorSummary = classifyFailure(error);
      const errorSummaryText = buildMercadoPublicoUnexpectedErrorSummaryText(
        errorSummary,
        error,
      );

      if (extractionManifest !== undefined) {
        extractionManifest.status =
          mapMercadoPublicoErrorSummaryToManifestStatus(errorSummary);
        extractionManifest.errorSummary = errorSummaryText;
      }

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: mapMercadoPublicoErrorSummaryToJobRunStatus(errorSummary),
        finishedAt: new Date(),
        errorSummary: errorSummaryText,
        recordsFailed: 1,
        manifest: extractionManifest,
      });

      this.logger.error(errorSummaryText);

      if (error instanceof BadRequestException) {
        throw new MercadoPublicoRecordedJobFailureError(
          errorSummaryText,
          false,
        );
      }

      throw error;
    }
  }

  private async enqueueReconciliationRefresh(): Promise<void> {
    const settings = this.mercadoPublicoConfigService?.getSettings();

    await this.mercadoPublicoQueue.add(
      'MercadoPublicoJob',
      {
        jobName: 'reconciliation-refresh',
        payload: {},
        requestedAt: new Date().toISOString(),
        requestedBy: 'schedule',
      },
      {
        retryLimit: settings?.httpMaxRetries ?? 0,
        backoff: {
          type: 'fixed',
          delay: settings?.httpRetryBackoffMs ?? 0,
        },
      },
    );
  }

  private async enqueuePublishedDetailHydration(
    records: MercadoPublicoApiV2CompraAgilRecord[],
  ): Promise<void> {
    const publishedByCode = new Map<string, string | null>();

    for (const record of records) {
      const code = record.codigo.trim();
      const state =
        typeof record.estado === 'string'
          ? record.estado
          : record.estado?.codigo;

      if (code !== '' && state === 'publicada') {
        publishedByCode.set(
          code,
          record.fecha_ultimo_cambio ??
            record.fechas?.fecha_ultimo_cambio ??
            null,
        );
      }
    }

    const detailChangeDates =
      await this.mercadoPublicoPersistenceService.getV2CompraAgilDetailSnapshotChangeDates(
        [...publishedByCode.keys()],
      );
    const settings = this.mercadoPublicoConfigService?.getSettings();

    for (const [codigo, listChangeDate] of publishedByCode) {
      const hasDetail = detailChangeDates.has(codigo);
      const detailChangeDate = detailChangeDates.get(codigo);
      const shouldHydrate =
        !hasDetail ||
        (listChangeDate !== null && listChangeDate !== detailChangeDate);

      if (!shouldHydrate) {
        continue;
      }

      await this.mercadoPublicoQueue.add(
        'MercadoPublicoJob',
        {
          jobName: 'api-v2-compra-agil-detail-by-codigo',
          payload: { codigo },
          requestedAt: new Date().toISOString(),
          requestedBy: 'schedule',
        },
        {
          retryLimit: settings?.httpMaxRetries ?? 0,
          backoff: {
            type: 'fixed',
            delay: settings?.httpRetryBackoffMs ?? 0,
          },
        },
      );
    }
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilIncrementalPayload {
    const ttlCambioMs = payload.ttl_cambio_ms;
    const cambioDesde = payload.cambio_desde;

    const isPublishedBackfill =
      payload.estado === 'publicada' &&
      ttlCambioMs === undefined &&
      !isNonEmptyString(cambioDesde);

    const cambioHasta = payload.cambio_hasta;
    const hasCambioDesde = isNonEmptyString(cambioDesde);
    const hasCambioHasta = isNonEmptyString(cambioHasta);

    if (
      ttlCambioMs !== undefined &&
      (hasCambioDesde || hasCambioHasta)
    ) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload cannot combine "ttl_cambio_ms" with "cambio_desde" or "cambio_hasta"',
      );
    }

    if (hasCambioDesde !== hasCambioHasta) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload requires both "cambio_desde" and "cambio_hasta"',
      );
    }

    if (
      !isPublishedBackfill &&
      ttlCambioMs === undefined &&
      !isNonEmptyString(cambioDesde)
    ) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload requires a non-empty "ttl_cambio_ms" or "cambio_desde" string unless estado is exactly "publicada"',
      );
    }

    if (typeof ttlCambioMs === 'number' && ttlCambioMs <= 0) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload "ttl_cambio_ms" must be greater than 0',
      );
    }

    return {
      ttl_cambio_ms: typeof ttlCambioMs === 'number' ? ttlCambioMs : undefined,
      cambio_desde: isNonEmptyString(cambioDesde)
        ? (cambioDesde as string)
        : undefined,
      cambio_hasta: hasCambioHasta
        ? (cambioHasta as string)
        : undefined,
      tamano_pagina:
        typeof payload.tamano_pagina === 'number'
          ? payload.tamano_pagina
          : undefined,
      numero_pagina:
        typeof payload.numero_pagina === 'number'
          ? payload.numero_pagina
          : undefined,
      id: isNonEmptyString(payload.id) ? (payload.id as string) : undefined,
      q: isNonEmptyString(payload.q) ? (payload.q as string) : undefined,
      estado: isNonEmptyString(payload.estado)
        ? (payload.estado as string)
        : undefined,
      region: typeof payload.region === 'number' ? payload.region : undefined,
      ordenar_por: isNonEmptyString(payload.ordenar_por)
        ? (payload.ordenar_por as string)
        : undefined,
    };
  }
}
