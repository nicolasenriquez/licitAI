import * as fs from 'fs';

import { parse } from 'csv-parse';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import { buildMercadoPublicoUnexpectedErrorSummaryText } from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';
import { computeRowChecksum } from 'src/engine/core-modules/mercado-publico/services/utils/csv/compute-row-checksum.util';
import { resolveCsvStorageTargetPath } from 'src/engine/core-modules/mercado-publico/services/utils/csv/resolve-csv-storage-target-path.util';

type MercadoPublicoCsvRawLoadPayload = {
  raw_csv_file_id: string;
};

type ParsedCsvRecord = {
  record: string[];
  raw: string;
};

type PendingErrorRow = {
  rawCsvFileId: string;
  ingestionJobId: string;
  sourceDataset: string;
  sourceFileName: string;
  sourcePeriod: string;
  rowNumber: number;
  rawRowText: string;
  rawRowJson: null;
  rowChecksum: string;
  parseStatus: 'error';
  parseError: string;
};

type RawCsvFileMeta = NonNullable<
  Awaited<ReturnType<MercadoPublicoPersistenceService['getRawCsvFileMetaById']>>
>;

const BATCH_SIZE = 1000;

const resolveNodeEncoding = (detectedEncoding: string): BufferEncoding => {
  return detectedEncoding === 'latin-1' ? 'latin1' : 'utf8';
};

@Injectable()
export class MercadoPublicoCsvRawLoadService {
  private readonly logger = new Logger(MercadoPublicoCsvRawLoadService.name);

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);
    const fileMeta =
      await this.mercadoPublicoPersistenceService.getRawCsvFileMetaById(
        parsedPayload.raw_csv_file_id,
      );
    const jobRunRecord = fileMeta
      ? await this.mercadoPublicoPersistenceService.createJobRun(
          'csv-raw-load',
          {
            rawCsvFileId: fileMeta.id,
          },
        )
      : await this.mercadoPublicoPersistenceService.createJobRun(
          'csv-raw-load',
        );

    try {
      if (!fileMeta) {
        throw new Error(
          `raw_csv_file row not found for id ${parsedPayload.raw_csv_file_id}`,
        );
      }

      const result = await this.loadRawCsvRows(fileMeta, jobRunRecord.id);

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: 'success',
        finishedAt: new Date(),
        recordsFetched: result.totalLines,
        recordsStaged: result.successCount,
        recordsCanonicalized: 0,
        recordsFailed: result.errorCount,
      });

      this.logger.log(
        `Loaded ${result.successCount} rows (${result.errorCount} errors) from ${parsedPayload.raw_csv_file_id}`,
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
  ): MercadoPublicoCsvRawLoadPayload {
    const rawCsvFileId = payload.raw_csv_file_id;

    if (typeof rawCsvFileId !== 'string' || rawCsvFileId.length === 0) {
      throw new BadRequestException(
        'Mercado Publico CSV raw load payload requires a non-empty "raw_csv_file_id" string (UUID)',
      );
    }

    return {
      raw_csv_file_id: rawCsvFileId,
    };
  }

  private async loadRawCsvRows(
    fileMeta: RawCsvFileMeta,
    ingestionJobId: string,
  ): Promise<{
    totalLines: number;
    successCount: number;
    errorCount: number;
  }> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!settings.csvStorageRoot) {
      throw new Error('MERCADO_PUBLICO_CSV_STORAGE_ROOT is not configured');
    }

    const filePath = await resolveCsvStorageTargetPath(
      settings.csvStorageRoot,
      fileMeta.source_dataset,
      fileMeta.source_period,
      fileMeta.source_file_name,
      fileMeta.source_modality,
      fileMeta.file_checksum,
    );
    const legacyFilePath = await resolveCsvStorageTargetPath(
      settings.csvStorageRoot,
      fileMeta.source_dataset,
      fileMeta.source_period,
      fileMeta.source_file_name,
      fileMeta.source_modality,
    );
    const readableFilePath = await fs.promises
      .access(filePath)
      .then(() => filePath)
      .catch(() => legacyFilePath);

    this.logger.log(
      `Loading raw rows from ${fileMeta.source_dataset}/${fileMeta.source_period} ${readableFilePath}`,
    );

    const nodeEncoding = resolveNodeEncoding(fileMeta.detected_encoding);
    const isUtf8Sig = fileMeta.detected_encoding === 'utf-8-sig';
    const delimiter = fileMeta.detected_delimiter;
    const quotechar = fileMeta.quotechar;

    let totalLines = 0;
    let successCount = 0;
    let errorCount = 0;
    let batch: Parameters<
      typeof this.mercadoPublicoPersistenceService.insertRawCsvRows
    >[0]['rows'] = [];
    const pendingErrorRows: PendingErrorRow[] = [];

    const flushBatch = async () => {
      if (batch.length === 0) {
        return;
      }

      await this.mercadoPublicoPersistenceService.insertRawCsvRows({
        rows: batch,
      });
      batch = [];
    };

    const parser = parse({
      delimiter,
      quote: quotechar ?? false,
      relaxColumnCount: true,
      relaxQuotes: true,
      bom: isUtf8Sig,
      record_delimiter: ['\r\n', '\n', '\r'],
      from_line: 2,
      raw: true,
      encoding: nodeEncoding,
      skip_records_with_error: true,
      on_skip(err, rawText) {
        errorCount++;
        totalLines++;
        pendingErrorRows.push({
          rawCsvFileId: fileMeta.id,
          ingestionJobId,
          sourceDataset: fileMeta.source_dataset,
          sourceFileName: fileMeta.source_file_name,
          sourcePeriod: fileMeta.source_period,
          rowNumber: totalLines,
          rawRowText: rawText ?? '',
          rawRowJson: null,
          rowChecksum: computeRowChecksum(rawText ?? ''),
          parseStatus: 'error',
          parseError: err?.message ?? 'CsvError',
        });
      },
    });

    const readStream = fs.createReadStream(readableFilePath);

    readStream.on('error', (err) => parser.emit('error', err));
    readStream.pipe(parser);

    for await (const parsed of parser as AsyncIterable<ParsedCsvRecord>) {
      while (pendingErrorRows.length > 0) {
        const errorRow = pendingErrorRows.shift()!;

        batch.push(errorRow);

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      }

      totalLines++;
      successCount++;
      const rawRowText = parsed.raw;
      const values = parsed.record;

      batch.push({
        rawCsvFileId: fileMeta.id,
        ingestionJobId,
        sourceDataset: fileMeta.source_dataset,
        sourceFileName: fileMeta.source_file_name,
        sourcePeriod: fileMeta.source_period,
        rowNumber: totalLines,
        rawRowText,
        rawRowJson: values,
        rowChecksum: computeRowChecksum(rawRowText),
        parseStatus: 'success',
        parseError: null,
      });

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    }

    while (pendingErrorRows.length > 0) {
      batch.push(pendingErrorRows.shift()!);
    }

    await flushBatch();

    this.logger.log(
      `Finished loading ${successCount} rows (${errorCount} errors) from ${readableFilePath}`,
    );

    return { totalLines, successCount, errorCount };
  }
}
