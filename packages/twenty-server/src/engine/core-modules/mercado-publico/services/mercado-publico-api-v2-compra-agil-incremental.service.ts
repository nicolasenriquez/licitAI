import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
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
  orden?: string;
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
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );

    try {
      const apiResponse =
        await this.mercadoPublicoApiV2CompraAgilClientService.getList(
          parsedPayload,
        );

      if (apiResponse.errorSummary !== undefined) {
        const errorSummaryText =
          buildMercadoPublicoErrorSummaryText(apiResponse);

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
          recordsFetched: apiResponse.compraAgil.length,
          recordsFailed: 1,
        });

        throw new MercadoPublicoRecordedJobFailureError(
          errorSummaryText,
          apiResponse.errorSummary === 'retryable_failed',
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
      const recordsCanonicalized =
        await this.mercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
          persistenceResult.rawApiPayloadId,
        );

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'success',
        finishedAt: new Date(),
        recordsFetched: persistenceResult.recordsFetched,
        recordsStaged: persistenceResult.recordsStaged,
        recordsCanonicalized,
        recordsFailed: 0,
      });

      this.logger.log(
        `Ingested ${persistenceResult.recordsFetched} V2 Compra Agil records with window ${JSON.stringify(parsedPayload)}`,
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

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: mapMercadoPublicoErrorSummaryToJobRunStatus(errorSummary),
        finishedAt: new Date(),
        errorSummary: errorSummaryText,
        recordsFailed: 1,
      });

      this.logger.error(errorSummaryText);

      throw error;
    }
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilIncrementalPayload {
    const ttlCambioMs = payload.ttl_cambio_ms;
    const cambioDesde = payload.cambio_desde;

    if (ttlCambioMs === undefined && !isNonEmptyString(cambioDesde)) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload requires a non-empty "ttl_cambio_ms" or "cambio_desde" string',
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
      cambio_hasta: isNonEmptyString(payload.cambio_hasta)
        ? (payload.cambio_hasta as string)
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
      orden: isNonEmptyString(payload.orden)
        ? (payload.orden as string)
        : undefined,
    };
  }
}
