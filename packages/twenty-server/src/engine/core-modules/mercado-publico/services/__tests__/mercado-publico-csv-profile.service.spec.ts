import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoCsvProfileService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profile.service';
import { MercadoPublicoCsvProfilingService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profiling.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoCsvProfileService', () => {
  let service: MercadoPublicoCsvProfileService;
  let profilingService: jest.Mocked<MercadoPublicoCsvProfilingService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockProfileResult = {
    detectedEncoding: 'latin-1' as const,
    fallbackEncoding: true,
    detectedDelimiter: ';' as const,
    delimiterConfidence: 0.95,
    quotechar: '"' as const,
    headerRaw: 'Codigo;Fecha;Estado',
    observedColumns: ['Codigo', 'Fecha', 'Estado'],
    columnCount: 3,
    schemaFingerprint: 'abc123def',
    rowCount: 10,
  };

  beforeEach(() => {
    profilingService = {
      profileFileById: jest.fn().mockResolvedValue(mockProfileResult),
      profileFile: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoCsvProfilingService>;

    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    service = new MercadoPublicoCsvProfileService(
      profilingService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should throw BadRequestException when raw_csv_file_id is missing', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when raw_csv_file_id is empty', async () => {
      await expect(
        service.run({ raw_csv_file_id: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('run', () => {
    it('should profile file on success', async () => {
      await service.run({
        raw_csv_file_id: 'test-file-id',
      });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'csv-file-profile',
      );
      expect(profilingService.profileFileById).toHaveBeenCalledWith(
        'test-file-id',
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 10,
          recordsFailed: 0,
        }),
      );
    });

    it('should handle profiling service error', async () => {
      profilingService.profileFileById.mockRejectedValue(
        new Error('File not found'),
      );

      await expect(
        service.run({ raw_csv_file_id: 'bad-id' }),
      ).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
