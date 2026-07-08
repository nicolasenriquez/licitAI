import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoCsvRawLoadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-raw-load.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoCsvRawLoadService', () => {
  let service: MercadoPublicoCsvRawLoadService;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockFileMeta = {
    id: 'csv-file-id',
    source_dataset: 'oc',
    source_period: '2026-06',
    source_file_name: '2026-6.csv',
    detected_encoding: 'latin-1',
    detected_delimiter: ';',
    quotechar: '"',
  };

  beforeEach(() => {
    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      finalizeJobRun: jest.fn(),
      getRawCsvFileMetaById: jest.fn().mockResolvedValue(mockFileMeta),
      insertRawCsvRows: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    const configService = {
      getSettings: jest.fn().mockReturnValue({
        csvStorageRoot: '/tmp/csv',
      }),
    } as unknown as jest.Mocked<MercadoPublicoConfigService>;

    service = new MercadoPublicoCsvRawLoadService(
      configService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should throw BadRequestException when raw_csv_file_id is missing', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when raw_csv_file_id is empty', async () => {
      await expect(service.run({ raw_csv_file_id: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('run', () => {
    it('should handle when raw_csv_file row not found', async () => {
      persistenceService.getRawCsvFileMetaById = jest
        .fn()
        .mockResolvedValue(null);

      await expect(
        service.run({ raw_csv_file_id: 'missing-id' }),
      ).rejects.toThrow('raw_csv_file row not found');

      expect(persistenceService.getRawCsvFileMetaById).toHaveBeenCalledWith(
        'missing-id',
      );
      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'csv-raw-load',
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          jobRunRecordId: mockJobRunRecord.id,
          status: 'failed',
          recordsFailed: 1,
        }),
      );
    });

    it('should finalize as failed and rethrow when csvStorageRoot is missing', async () => {
      const configService = {
        getSettings: jest.fn().mockReturnValue({
          csvStorageRoot: undefined,
        }),
      } as unknown as jest.Mocked<MercadoPublicoConfigService>;

      const svc = new MercadoPublicoCsvRawLoadService(
        configService,
        persistenceService,
      );

      await expect(svc.run({ raw_csv_file_id: 'test-id' })).rejects.toThrow(
        'MERCADO_PUBLICO_CSV_STORAGE_ROOT',
      );

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'csv-raw-load',
        { rawCsvFileId: 'csv-file-id' },
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          recordsFailed: 1,
        }),
      );
    });
  });
});
