import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import {
  MercadoPublicoApiV2CompraAgilClientService,
} from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import {
  buildMercadoPublicoErrorSummaryText,
  buildMercadoPublicoUnexpectedErrorSummaryText,
} from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';

type MercadoPublicoApiV2CompraAgilDetailByCodigoPayload = {
  codigo: string;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilDetailByCodigoService {
  private readonly logger = new Logger(
    MercadoPublicoApiV2CompraAgilDetailByCodigoService.name,
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
        'api-v2-compra-agil-detail-by-codigo',
      );

    try {
      const apiResponse =
        await this.mercadoPublicoApiV2CompraAgilClientService.getByCodigo(
          parsedPayload.codigo,
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

        throw new MercadoPublicoRecordedJobFailureError(errorSummaryText);
      }

      const recordsFetched = apiResponse.compraAgil.length;
      let recordsCanonicalized = 0;
      let rawApiPayloadId: string | undefined;

      if (recordsFetched > 0) {
        const persistenceResult =
          await this.mercadoPublicoPersistenceService.persistV2CompraAgilSnapshot(
            {
              jobRunRecordId: jobRunRecord.id,
              apiResponse,
              snapshotKind: 'detail',
            },
          );

        rawApiPayloadId = persistenceResult.rawApiPayloadId;
        recordsCanonicalized =
          await this.mercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
            persistenceResult.rawApiPayloadId,
          );
      }

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'success',
        finishedAt: new Date(),
        recordsFetched,
        recordsStaged: recordsFetched,
        recordsCanonicalized,
        recordsFailed: recordsCanonicalized === 0 && recordsFetched === 0 ? 1 : 0,
      });

      if (recordsFetched === 0) {
        this.logger.log(
          `No detail record found for Compra Agil codigo ${parsedPayload.codigo} (soft miss)`,
        );

        return;
      }

      this.logger.log(
        `Ingested V2 Compra Agil detail for codigo ${parsedPayload.codigo}`,
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
  ): MercadoPublicoApiV2CompraAgilDetailByCodigoPayload {
    const codigo = payload.codigo;

    if (!isNonEmptyString(codigo)) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil detail-by-codigo payload requires a non-empty "codigo" string',
      );
    }

    return {
      codigo,
    };
  }
}
