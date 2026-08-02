import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
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

type MercadoPublicoApiV2CompraAgilPublicationWindowPayload = {
  publicado_desde?: string;
  publicado_hasta?: string;
  tamano_pagina?: number;
  numero_pagina?: number;
  id?: string;
  q?: string;
  estado?: string;
  region?: number;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilPublicationWindowService {
  private readonly logger = new Logger(
    MercadoPublicoApiV2CompraAgilPublicationWindowService.name,
  );

  constructor(
    private readonly mercadoPublicoApiV2CompraAgilClientService: MercadoPublicoApiV2CompraAgilClientService,
    private readonly mercadoPublicoCanonicalRefreshService: MercadoPublicoCanonicalRefreshService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
    @Optional()
    private readonly mercadoPublicoConfigService?: MercadoPublicoConfigService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-by-publication-window',
      );
    let extractionManifest: MercadoPublicoCompraAgilExtractionManifest | undefined;

    try {
      extractionManifest = createMercadoPublicoCompraAgilExtractionManifest({
        jobName: 'api-v2-compra-agil-by-publication-window',
        requestParams: {},
        requestedLocalWindow: payload.requested_local_window,
        fallbackUsed: payload.fallback_used,
        fallbackReason: payload.fallback_reason,
        effectiveDate: payload.effective_date,
      });
      const parsedPayload = this.parsePayload(payload);
      extractionManifest = createMercadoPublicoCompraAgilExtractionManifest({
        jobName: 'api-v2-compra-agil-by-publication-window',
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
        `Ingested ${recordsFetched} V2 Compra Agil records across ${lastPage - firstPage + 1} page(s) with publication window ${JSON.stringify(parsedPayload)}`,
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

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilPublicationWindowPayload {
    const publicadoDesde = payload.publicado_desde;
    const publicadoHasta = payload.publicado_hasta;
    const hasPublicadoDesde = isNonEmptyString(publicadoDesde);
    const hasPublicadoHasta = isNonEmptyString(publicadoHasta);

    if (!hasPublicadoDesde && !hasPublicadoHasta) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil publication-window payload requires non-empty "publicado_desde" and "publicado_hasta" strings',
      );
    }

    if (hasPublicadoDesde !== hasPublicadoHasta) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil publication-window payload requires both "publicado_desde" and "publicado_hasta"',
      );
    }

    return {
      publicado_desde: hasPublicadoDesde
        ? (publicadoDesde as string)
        : undefined,
      publicado_hasta: hasPublicadoHasta
        ? (publicadoHasta as string)
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
    };
  }
}
