import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import {
  MercadoPublicoApiV1LicitacionesClientService,
} from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import {
  buildMercadoPublicoErrorSummaryText,
  buildMercadoPublicoUnexpectedErrorSummaryText,
} from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';

type MercadoPublicoApiV1LicitacionesByStatePayload = {
  estado: string;
};

@Injectable()
export class MercadoPublicoApiV1LicitacionesByStateService {
  private readonly logger = new Logger(
    MercadoPublicoApiV1LicitacionesByStateService.name,
  );

  constructor(
    private readonly mercadoPublicoApiV1LicitacionesClientService: MercadoPublicoApiV1LicitacionesClientService,
    private readonly mercadoPublicoCanonicalRefreshService: MercadoPublicoCanonicalRefreshService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v1-licitaciones-by-state',
      );

    try {
      const apiResponse =
        await this.mercadoPublicoApiV1LicitacionesClientService.getByEstado(
          parsedPayload.estado,
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
          recordsFetched: apiResponse.licitaciones.length,
          errorSummaryText,
        });
        await this.mercadoPublicoPersistenceService.finalizeJobRun({
          jobRunRecordId: jobRunRecord.id,
          status: mapMercadoPublicoErrorSummaryToJobRunStatus(
            apiResponse.errorSummary,
          ),
          finishedAt: new Date(),
          errorSummary: errorSummaryText,
          recordsFetched: apiResponse.licitaciones.length,
          recordsFailed: 1,
        });

        throw new MercadoPublicoRecordedJobFailureError(errorSummaryText);
      }

      const persistenceResult =
        await this.mercadoPublicoPersistenceService.persistV1LicitacionesSnapshot(
          {
            jobRunRecordId: jobRunRecord.id,
            apiResponse,
            snapshotKind: 'list',
          },
        );
      const recordsCanonicalized =
        await this.mercadoPublicoCanonicalRefreshService.refreshV1LicitacionesFromApiSnapshot(
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
        `Ingested ${persistenceResult.recordsFetched} V1 licitaciones for estado ${apiResponse.requestParams.estado}`,
      );
    } catch (error) {
      if (error instanceof MercadoPublicoRecordedJobFailureError) {
        this.logger.error(error.message);

        throw error;
      }

      const errorSummary = classifyFailure(error);
      const errorSummaryText =
        buildMercadoPublicoUnexpectedErrorSummaryText(errorSummary, error);

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
  ): MercadoPublicoApiV1LicitacionesByStatePayload {
    const estado = payload.estado;

    if (!isNonEmptyString(estado)) {
      throw new BadRequestException(
        'Mercado Publico V1 licitaciones by-state payload requires a non-empty "estado" string',
      );
    }

    return {
      estado,
    };
  }
}
