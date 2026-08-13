import { createHash } from 'crypto';
import { mkdtemp, readFile, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';

import { MercadoPublicoCsvDownloadSharedService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-download-shared.service';

describe('MercadoPublicoCsvDownloadSharedService', () => {
  it('publishes decompressed CSV at checksum-addressed path', async () => {
    const csvStorageRoot = await mkdtemp(join(tmpdir(), 'mp-csv-download-'));
    const contents = Buffer.from('Codigo;Estado\nCA-1;Publicada\n', 'utf8');
    const checksum = createHash('sha256').update(contents).digest('hex');
    const persistenceService = {
      persistCsvDownload: jest.fn().mockResolvedValue({
        rawCsvFileId: 'raw-csv-file-id',
        deduped: false,
      }),
    };
    const service = new MercadoPublicoCsvDownloadSharedService(
      {
        getSettings: jest.fn().mockReturnValue({
          csvStorageRoot,
          httpTimeoutMs: 1000,
        }),
      } as never,
      persistenceService as never,
      {
        getHttpClient: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            headers: {},
            data: Readable.from([contents]),
          }),
        }),
      } as never,
    );

    try {
      const result = await service.downloadAndPersist({
        jobRunRecordId: 'job-run-id',
        sourceSystem: 'mercado-publico',
        sourceDataset: 'oc',
        sourceUrl: 'https://example.com/oc/2026-06.csv',
        sourcePeriod: '2026-06',
      });

      expect(result.storagePath).toContain(`2026-06.${checksum}.csv`);
      await expect(readFile(result.storagePath)).resolves.toEqual(contents);
      await expect(
        readdir(join(csvStorageRoot, 'oc', '2026-06', '_default')),
      ).resolves.toEqual([`2026-06.${checksum}.csv`]);
      expect(persistenceService.persistCsvDownload).toHaveBeenCalledWith(
        expect.objectContaining({ fileChecksum: checksum }),
      );
    } finally {
      await rm(csvStorageRoot, { recursive: true, force: true });
    }
  });
});
