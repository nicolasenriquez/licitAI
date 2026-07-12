import { MercadoPublicoCsvLicitacionesDownloadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-licitaciones-download.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoCsvDownloadSharedService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-download-shared.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoCsvLicitacionesDownloadService', () => {
  let service: MercadoPublicoCsvLicitacionesDownloadService;
  let sharedService: jest.Mocked<MercadoPublicoCsvDownloadSharedService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockDownloadResult = {
    rawCsvFileId: 'csv-file-id',
    storagePath: '/tmp/licitaciones/2026-06/data.csv',
    fileChecksum: 'def456',
    fileSizeBytes: 2048,
    deduped: false,
  };

  beforeEach(() => {
    sharedService = {
      downloadAndPersist: jest.fn().mockResolvedValue(mockDownloadResult),
    } as unknown as jest.Mocked<MercadoPublicoCsvDownloadSharedService>;

    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      linkJobRunToRawCsvFile: jest.fn(),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    const configService = {
      getSettings: jest.fn().mockReturnValue({
        csvDownloadEnabled: true,
        csvLicitacionesSourceUrl:
          'https://example.com/licitaciones/2026-06.csv',
      }),
    } as unknown as jest.Mocked<MercadoPublicoConfigService>;

    service = new MercadoPublicoCsvLicitacionesDownloadService(
      configService,
      sharedService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should record and reject when source_period is missing', async () => {
      await expect(service.run({})).rejects.toBeInstanceOf(
        MercadoPublicoRecordedJobFailureError,
      );
    });

    it('should record and reject when source_period is empty', async () => {
      await expect(service.run({ source_period: '' })).rejects.toBeInstanceOf(
        MercadoPublicoRecordedJobFailureError,
      );
    });
  });

  describe('run', () => {
    it('should download and persist licitaciones CSV on success', async () => {
      await service.run({ source_period: '2026-06' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'csv-licitaciones-download',
      );
      expect(sharedService.downloadAndPersist).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceDataset: 'licitaciones',
          sourcePeriod: '2026-06',
        }),
      );
      expect(persistenceService.linkJobRunToRawCsvFile).toHaveBeenCalledWith(
        mockJobRunRecord.id,
        mockDownloadResult.rawCsvFileId,
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 1,
          recordsFailed: 0,
        }),
      );
    });

    it('should skip download when csvDownloadEnabled is false', async () => {
      const configService = {
        getSettings: jest.fn().mockReturnValue({
          csvDownloadEnabled: false,
          csvLicitacionesSourceUrl:
            'https://example.com/licitaciones/2026-06.csv',
        }),
      } as unknown as jest.Mocked<MercadoPublicoConfigService>;

      const disabledService = new MercadoPublicoCsvLicitacionesDownloadService(
        configService,
        sharedService,
        persistenceService,
      );

      await disabledService.run({ source_period: '2026-06' });

      expect(sharedService.downloadAndPersist).not.toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 0,
          recordsFailed: 0,
        }),
      );
    });

    it('should handle shared service throwing an error', async () => {
      sharedService.downloadAndPersist.mockRejectedValue(
        new Error('Network error'),
      );

      await expect(service.run({ source_period: '2026-06' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });

    it('should pass source_modality when provided', async () => {
      await service.run({
        source_period: '2026-06',
        source_modality: 'semestre-1',
      });

      expect(sharedService.downloadAndPersist).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceModality: 'semestre-1',
        }),
      );
    });
  });
});
