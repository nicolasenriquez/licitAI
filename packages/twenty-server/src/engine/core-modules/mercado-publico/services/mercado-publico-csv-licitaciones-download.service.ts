import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoCsvDownloadSharedService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-download-shared.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import { buildMercadoPublicoUnexpectedErrorSummaryText } from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';
import { MERCADO_PUBLICO_CSV_LICITACIONES_DATASET } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

type MercadoPublicoCsvLicitacionesDownloadPayload = {
  source_period: string;
  source_modality?: string;
};

@Injectable()
export class MercadoPublicoCsvLicitacionesDownloadService {
  private readonly logger = new Logger(
    MercadoPublicoCsvLicitacionesDownloadService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoCsvDownloadSharedService: MercadoPublicoCsvDownloadSharedService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'csv-licitaciones-download',
      );

    try {
      const parsedPayload = this.parsePayload(payload);
      const settings = this.mercadoPublicoConfigService.getSettings();

      if (!settings.csvDownloadEnabled) {
        await this.mercadoPublicoPersistenceService.finalizeJobRun({
          jobRunRecordId: jobRunRecord.id,
          status: 'success',
          finishedAt: new Date(),
          recordsFetched: 0,
          recordsFailed: 0,
        });

        this.logger.log(
          `CSV licitaciones download skipped (csvDownloadEnabled=false) for period ${parsedPayload.source_period}`,
        );

        return;
      }

      if (!isNonEmptyString(settings.csvLicitacionesSourceUrl)) {
        throw new BadRequestException(
          'MERCADO_PUBLICO_CSV_LICITACIONES_SOURCE_URL is not configured',
        );
      }

      const result =
        await this.mercadoPublicoCsvDownloadSharedService.downloadAndPersist({
          sourceSystem: 'datos-abiertos',
          sourceDataset: MERCADO_PUBLICO_CSV_LICITACIONES_DATASET,
          sourceUrl: settings.csvLicitacionesSourceUrl,
          sourcePeriod: parsedPayload.source_period,
          sourceModality: parsedPayload.source_modality,
        });

      await this.mercadoPublicoPersistenceService.linkJobRunToRawCsvFile(
        jobRunRecord.id,
        result.rawCsvFileId,
      );

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'success',
        finishedAt: new Date(),
        recordsFetched: 1,
        recordsStaged: 0,
        recordsCanonicalized: 0,
        recordsFailed: 0,
      });

      this.logger.log(
        `Downloaded licitaciones CSV ${parsedPayload.source_period}: ${result.fileSizeBytes}B deduped=${result.deduped}`,
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
  ): MercadoPublicoCsvLicitacionesDownloadPayload {
    if (!isNonEmptyString(payload.source_period)) {
      throw new BadRequestException(
        'Mercado Publico CSV licitaciones download payload requires a non-empty "source_period" string (e.g. "2026-06")',
      );
    }

    return {
      source_period: payload.source_period as string,
      source_modality: isNonEmptyString(payload.source_modality)
        ? (payload.source_modality as string)
        : undefined,
    };
  }
}
