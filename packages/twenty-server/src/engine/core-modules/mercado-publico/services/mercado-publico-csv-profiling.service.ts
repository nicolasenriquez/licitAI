import * as fs from 'fs';

import { parse } from 'csv-parse';

import { Injectable, Logger } from '@nestjs/common';

import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { detectEncoding } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-encoding.util';
import { detectDelimiter } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-delimiter.util';
import { detectQuotechar } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-quotechar.util';
import { parseCsvHeader } from 'src/engine/core-modules/mercado-publico/services/utils/csv/parse-csv-header.util';
import { computeSchemaFingerprint } from 'src/engine/core-modules/mercado-publico/services/utils/csv/compute-schema-fingerprint.util';
import { resolveCsvStorageTargetPath } from 'src/engine/core-modules/mercado-publico/services/utils/csv/resolve-csv-storage-target-path.util';

export type CsvFileProfileResult = {
  detectedEncoding: 'utf-8' | 'utf-8-sig' | 'latin-1';
  fallbackEncoding: boolean;
  detectedDelimiter: ';' | ',' | '\t' | '|';
  delimiterConfidence: number;
  quotechar: '"' | null;
  headerRaw: string;
  observedColumns: string[];
  columnCount: number;
  schemaFingerprint: string;
  rowCount: number;
};

const PROFILE_SAMPLE_BYTES = 64 * 1024;

@Injectable()
export class MercadoPublicoCsvProfilingService {
  private readonly logger = new Logger(
    MercadoPublicoCsvProfilingService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async profileFileById(
    rawCsvFileId: string,
  ): Promise<CsvFileProfileResult> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!settings.csvStorageRoot) {
      throw new Error('MERCADO_PUBLICO_CSV_STORAGE_ROOT is not configured');
    }

    const fileRow =
      await this.mercadoPublicoPersistenceService.getRawCsvFileById(
        rawCsvFileId,
      );

    if (!fileRow) {
      throw new Error(
        `raw_csv_file row not found for id ${rawCsvFileId}`,
      );
    }

    const filePath = await resolveCsvStorageTargetPath(
      settings.csvStorageRoot,
      fileRow.source_dataset,
      fileRow.source_period,
      fileRow.source_file_name,
      fileRow.source_modality,
      fileRow.file_checksum,
    );
    const legacyFilePath = await resolveCsvStorageTargetPath(
      settings.csvStorageRoot,
      fileRow.source_dataset,
      fileRow.source_period,
      fileRow.source_file_name,
      fileRow.source_modality,
    );
    const readableFilePath = await fs.promises
      .access(filePath)
      .then(() => filePath)
      .catch(() => legacyFilePath);

    this.logger.log(
      `Profiling ${fileRow.source_dataset}/${fileRow.source_period} from ${readableFilePath}`,
    );

    const readStream = fs.createReadStream(readableFilePath, {
      highWaterMark: PROFILE_SAMPLE_BYTES,
    });

    const profile = await this.profileFile(readStream);

    await this.mercadoPublicoPersistenceService.updateCsvFileProfiling({
      rawCsvFileId,
      detectedEncoding: profile.detectedEncoding,
      detectedDelimiter: profile.detectedDelimiter,
      quotechar: profile.quotechar,
      headerRaw: profile.headerRaw,
      observedColumns: profile.observedColumns,
      columnCount: profile.columnCount,
      schemaFingerprint: profile.schemaFingerprint,
      rowCount: profile.rowCount,
    });

    this.logger.log(
      `Profiled ${fileRow.source_dataset}/${fileRow.source_period}: encoding=${profile.detectedEncoding} fallback=${profile.fallbackEncoding} delimiter=${profile.detectedDelimiter} confidence=${profile.delimiterConfidence} quotechar=${profile.quotechar ?? 'none'} columns=${profile.columnCount} rows=${profile.rowCount} fingerprint=${profile.schemaFingerprint}`,
    );

    return profile;
  }

  async profileFile(readStream: fs.ReadStream): Promise<CsvFileProfileResult> {
    const chunks: Buffer[] = [];
    let sampleBytes = 0;

    const headBuffer = await new Promise<Buffer>((resolve, reject) => {
      let settled = false;

      const finish = () => {
        if (settled) return;

        settled = true;
        resolve(Buffer.concat(chunks));
      };

      readStream.on('data', (chunk: Buffer) => {
        const remaining = PROFILE_SAMPLE_BYTES - sampleBytes;

        if (remaining <= 0) {
          return;
        }

        const toTake =
          chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;

        chunks.push(toTake);
        sampleBytes += toTake.length;

        if (sampleBytes >= PROFILE_SAMPLE_BYTES) {
          readStream.destroy();
        }
      });

      readStream.once('end', finish);
      readStream.once('close', finish);
      readStream.once('error', reject);
    });

    if (headBuffer.length === 0) {
      throw new Error('Cannot profile empty file');
    }

    const encodingResult = detectEncoding(headBuffer);
    const decodedText = this.decodeWithEncoding(
      headBuffer,
      encodingResult.encoding,
    );

    const lines = decodedText.split(/\r\n|\n|\r/);

    if (lines.length === 0) {
      throw new Error('Cannot profile file with no lines');
    }

    const headerLine = lines[0];

    const delimiterResult = detectDelimiter(decodedText);
    const quotechar = detectQuotechar(headerLine, delimiterResult.delimiter);
    const observedColumns = parseCsvHeader(
      headerLine,
      delimiterResult.delimiter,
    );
    const schemaFingerprint = computeSchemaFingerprint(headerLine);

    const filePath = readStream.path;

    if (typeof filePath !== 'string') {
      throw new Error('Cannot profile file stream without a string path');
    }

    const rowCount = await this.countLogicalDataRows(
      filePath,
      encodingResult.encoding,
      delimiterResult.delimiter,
      quotechar,
    );

    return {
      detectedEncoding: encodingResult.encoding,
      fallbackEncoding: encodingResult.fallbackUsed,
      detectedDelimiter: delimiterResult.delimiter,
      delimiterConfidence: delimiterResult.confidence,
      quotechar,
      headerRaw: headerLine,
      observedColumns,
      columnCount: observedColumns.length,
      schemaFingerprint,
      rowCount,
    };
  }

  private decodeWithEncoding(
    buffer: Buffer,
    encoding: 'utf-8' | 'utf-8-sig' | 'latin-1',
  ): string {
    if (encoding === 'utf-8-sig') {
      return buffer.subarray(3).toString('utf-8');
    }

    if (encoding === 'latin-1') {
      return buffer.toString('latin1');
    }

    return buffer.toString('utf-8');
  }

  private async countLogicalDataRows(
    filePath: string,
    encoding: 'utf-8' | 'utf-8-sig' | 'latin-1',
    delimiter: string,
    quotechar: string | null,
  ): Promise<number> {
    const nodeEncoding = encoding === 'latin-1' ? 'latin1' : 'utf8';
    const isUtf8Sig = encoding === 'utf-8-sig';

    const parser = parse({
      delimiter,
      quote: quotechar ?? false,
      relaxColumnCount: true,
      relaxQuotes: true,
      bom: isUtf8Sig,
      record_delimiter: ['\r\n', '\n', '\r'],
      from_line: 2,
      encoding: nodeEncoding,
      skip_empty_lines: true,
    });

    const readStream = fs.createReadStream(filePath);

    readStream.pipe(parser);

    let rowCount = 0;

    for await (const _record of parser) {
      rowCount++;
    }

    return rowCount;
  }
}
