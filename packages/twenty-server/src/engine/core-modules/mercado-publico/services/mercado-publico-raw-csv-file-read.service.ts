import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

import { Injectable, NotFoundException } from '@nestjs/common';

import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { resolveCsvStoragePath } from 'src/engine/core-modules/mercado-publico/services/utils/csv/resolve-csv-storage-target-path.util';

@Injectable()
export class MercadoPublicoRawCsvFileReadService {
  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async open(rawCsvFileId: string) {
    const csvStorageRoot =
      this.mercadoPublicoConfigService.getSettings().csvStorageRoot;

    if (!csvStorageRoot) {
      throw new NotFoundException('CSV evidence is not configured');
    }

    const fileMeta =
      await this.mercadoPublicoPersistenceService.getRawCsvFileMetaById(
        rawCsvFileId,
      );

    if (!fileMeta) {
      throw new NotFoundException('CSV evidence was not found');
    }

    const filePath = resolveCsvStoragePath(
      csvStorageRoot,
      fileMeta.source_dataset,
      fileMeta.source_period,
      fileMeta.source_file_name,
      fileMeta.source_modality,
    );

    let fileStats;

    try {
      fileStats = await stat(filePath);
    } catch {
      throw new NotFoundException('CSV evidence was not found');
    }

    if (!fileStats.isFile()) {
      throw new NotFoundException('CSV evidence was not found');
    }

    return {
      fileName: fileMeta.source_file_name,
      stream: createReadStream(filePath),
    };
  }
}
