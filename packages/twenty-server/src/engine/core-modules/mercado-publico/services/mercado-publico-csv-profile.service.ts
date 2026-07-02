import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoCsvProfilingService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profiling.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import {
  buildMercadoPublicoUnexpectedErrorSummaryText,
} from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';

type MercadoPublicoCsvProfilePayload = {
  raw_csv_file_id: string;
};

@Injectable()
export class MercadoPublicoCsvProfileService {
  private readonly logger = new Logger(
    MercadoPublicoCsvProfileService.name,
  );

  constructor(
    private readonly mercadoPublicoCsvProfilingService: MercadoPublicoCsvProfilingService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'csv-file-profile',
      );

    try {
      const profile =
        await this.mercadoPublicoCsvProfilingService.profileFileById(
          parsedPayload.raw_csv_file_id,
        );

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'success',
        finishedAt: new Date(),
        recordsFetched: profile.rowCount,
        recordsStaged: 0,
        recordsCanonicalized: 0,
        recordsFailed: 0,
      });

      this.logger.log(
        `Profiled file ${parsedPayload.raw_csv_file_id}: encoding=${profile.detectedEncoding} columns=${profile.columnCount} rows=${profile.rowCount}`,
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
  ): MercadoPublicoCsvProfilePayload {
    const rawCsvFileId = payload.raw_csv_file_id;

    if (typeof rawCsvFileId !== 'string' || rawCsvFileId.length === 0) {
      throw new BadRequestException(
        'Mercado Publico CSV profile payload requires a non-empty "raw_csv_file_id" string (UUID)',
      );
    }

    return {
      raw_csv_file_id: rawCsvFileId,
    };
  }
}
