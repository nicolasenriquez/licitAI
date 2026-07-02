import * as fs from 'fs';
import { pipeline } from 'stream/promises';

import { Injectable, Logger } from '@nestjs/common';

import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { HashPassThrough } from 'src/engine/core-modules/mercado-publico/services/utils/csv/create-hash-pass-through.util';
import { sniffCsvCompressionType } from 'src/engine/core-modules/mercado-publico/services/utils/csv/sniff-csv-compression-type.util';
import { createDecompressor } from 'src/engine/core-modules/mercado-publico/services/utils/csv/decompress-csv-stream.util';
import { resolveCsvStorageTargetPath } from 'src/engine/core-modules/mercado-publico/services/utils/csv/resolve-csv-storage-target-path.util';
import { buildCsvSourceFileName } from 'src/engine/core-modules/mercado-publico/services/utils/csv/build-csv-source-file-name.util';

export type CsvDownloadInput = {
  jobRunRecordId: string;
  sourceSystem: string;
  sourceDataset: string;
  sourceUrl: string;
  sourcePeriod: string;
  sourceModality?: string;
};

export type CsvDownloadResult = {
  rawCsvFileId: string;
  storagePath: string;
  fileChecksum: string;
  fileSizeBytes: number;
  deduped: boolean;
};

@Injectable()
export class MercadoPublicoCsvDownloadSharedService {
  private readonly logger = new Logger(
    MercadoPublicoCsvDownloadSharedService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
    private readonly secureHttpClientService: SecureHttpClientService,
  ) {}

  async downloadAndPersist(input: CsvDownloadInput): Promise<CsvDownloadResult> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!settings.csvStorageRoot) {
      throw new Error('MERCADO_PUBLICO_CSV_STORAGE_ROOT is not configured');
    }

    const sourceFileName = buildCsvSourceFileName(
      input.sourceUrl,
      input.sourceDataset,
      input.sourcePeriod,
    );

    this.logger.log(
      `Downloading ${input.sourceDataset} for period ${input.sourcePeriod} from ${input.sourceUrl}`,
    );

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: settings.httpTimeoutMs,
    });

    const response = await httpClient.get(input.sourceUrl, {
      responseType: 'stream',
    });

    const contentType = response.headers['content-type'] as string | undefined;
    const compressionType = sniffCsvCompressionType(
      input.sourceUrl,
      contentType,
    );

    const storagePath = await resolveCsvStorageTargetPath(
      settings.csvStorageRoot,
      input.sourceDataset,
      input.sourcePeriod,
      sourceFileName,
      input.sourceModality,
    );

    const rawByteStream = response.data as NodeJS.ReadableStream;
    const compressedHash = new HashPassThrough();
    const decompressor = createDecompressor(compressionType);
    const decompressedMetrics = new HashPassThrough();

    try {
      await pipeline(
        rawByteStream,
        compressedHash,
        decompressor,
        decompressedMetrics,
        fs.createWriteStream(storagePath),
      );
    } catch (error) {
      await fs.promises.rm(storagePath, { force: true }).catch(() => {});
      throw error;
    }

    const fileChecksum = compressedHash.digest;
    const fileSizeBytes = decompressedMetrics.bytes;

    if (fileSizeBytes === 0) {
      await fs.promises.rm(storagePath, { force: true }).catch(() => {});
      throw new Error('Downloaded CSV file is empty');
    }

    const persistenceResult =
      await this.mercadoPublicoPersistenceService.persistCsvDownload({
        jobRunRecordId: input.jobRunRecordId,
        sourceSystem: input.sourceSystem,
        sourceDataset: input.sourceDataset,
        sourceUrl: input.sourceUrl,
        sourceFileName,
        sourcePeriod: input.sourcePeriod,
        sourceModality: input.sourceModality,
        fileChecksum,
        fileSizeBytes,
        compressionType,
      });

    this.logger.log(
      `Downloaded ${input.sourceDataset}/${input.sourcePeriod}: ${fileSizeBytes}B ${compressionType ?? 'uncompressed'} checksum=${fileChecksum} deduped=${persistenceResult.deduped}`,
    );

    return {
      rawCsvFileId: persistenceResult.rawCsvFileId,
      storagePath,
      fileChecksum,
      fileSizeBytes,
      deduped: persistenceResult.deduped,
    };
  }
}
