import { MercadoPublicoApiV1LicitacionesByStateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitaciones-by-state.service';
import { MercadoPublicoApiV1LicitacionesClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoApiV1LicitacionesByStateService', () => {
  let service: MercadoPublicoApiV1LicitacionesByStateService;
  let clientService: jest.Mocked<MercadoPublicoApiV1LicitacionesClientService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockPersistenceResult = {
    rawApiPayloadId: 'raw-payload-id',
    recordsFetched: 3,
    recordsStaged: 3,
    recordsCanonicalized: 0,
  };

  const mockApiSuccessResponse = {
    endpoint: 'by-state',
    source: 'api-v1-licitaciones',
    requestParams: { estado: 'publicada' },
    requestFingerprint: 'fp',
    payloadChecksum: 'cs',
    schemaFingerprint: 'sf',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: {},
    licitaciones: [
      { CodigoExterno: 'L1', CodigoEstado: 5, Estado: 'Publicada' },
      { CodigoExterno: 'L2', CodigoEstado: 5, Estado: 'Publicada' },
      { CodigoExterno: 'L3', CodigoEstado: 5, Estado: 'Publicada' },
    ],
    errorSummary: undefined,
  };

  beforeEach(() => {
    clientService = {
      getByDate: jest.fn(),
      getByCodigoExterno: jest.fn(),
      getByEstado: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoApiV1LicitacionesClientService>;

    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      persistV1LicitacionesSnapshot: jest
        .fn()
        .mockResolvedValue(mockPersistenceResult),
      persistApiFailure: jest.fn(),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    const canonicalRefreshService = {
      refreshV1LicitacionesFromApiSnapshot: jest.fn().mockResolvedValue(3),
    } as unknown as jest.Mocked<MercadoPublicoCanonicalRefreshService>;

    service = new MercadoPublicoApiV1LicitacionesByStateService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('payload validation', () => {
    it('should record a parameter error when estado is missing', async () => {
      await expect(service.run({})).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });

    it('should record a parameter error when estado is empty', async () => {
      await expect(service.run({ estado: '' })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });

    it('should record a parameter error when estado is a numeric API code', async () => {
      await expect(service.run({ estado: '5' })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
      expect(clientService.getByEstado).not.toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'param_error',
          recordsFailed: 1,
        }),
      );
    });
  });

  describe('run', () => {
    it('should persist and canonicalize licitaciones on success', async () => {
      clientService.getByEstado.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ estado: 'publicada' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v1-licitaciones-by-state',
      );
      expect(clientService.getByEstado).toHaveBeenCalledWith('publicada');
      expect(
        persistenceService.persistV1LicitacionesSnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshotKind: 'list',
        }),
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 3,
          recordsCanonicalized: 3,
          recordsFailed: 0,
        }),
      );
    });

    it('should record failure when api returns errorSummary', async () => {
      clientService.getByEstado.mockResolvedValue({
        ...mockApiSuccessResponse,
        httpStatus: 500,
        errorSummary: 'retryable_failed',
        errorMessage: 'Server error',
      } as any);

      await expect(service.run({ estado: 'publicada' })).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retryable_failed',
        }),
      );
    });

    it('should handle transport failure', async () => {
      clientService.getByEstado.mockRejectedValue(new Error('Network error'));

      await expect(service.run({ estado: 'publicada' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
