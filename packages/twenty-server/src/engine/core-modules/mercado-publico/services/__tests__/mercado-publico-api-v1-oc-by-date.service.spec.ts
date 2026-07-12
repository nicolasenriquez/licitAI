import { MercadoPublicoApiV1OcByDateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-by-date.service';
import { MercadoPublicoApiV1OrdenesDeCompraClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoApiV1OcByDateService', () => {
  let service: MercadoPublicoApiV1OcByDateService;
  let clientService: jest.Mocked<MercadoPublicoApiV1OrdenesDeCompraClientService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockPersistenceResult = {
    rawApiPayloadId: 'raw-payload-id',
    recordsFetched: 2,
    recordsStaged: 2,
    recordsCanonicalized: 0,
  };

  const mockApiSuccessResponse = {
    endpoint: 'by-date',
    source: 'api-v1-oc',
    requestParams: { fecha: '15062026' },
    requestFingerprint: 'fp',
    payloadChecksum: 'cs',
    schemaFingerprint: 'sf',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: {},
    ordenesDeCompra: [
      { Codigo: 'OC-1', Estado: 'Aceptada' },
      { Codigo: 'OC-2' },
    ],
    errorSummary: undefined,
  };

  beforeEach(() => {
    clientService = {
      getByDate: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoApiV1OrdenesDeCompraClientService>;

    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      persistV1OrdenesDeCompraSnapshot: jest
        .fn()
        .mockResolvedValue(mockPersistenceResult),
      persistApiFailure: jest.fn(),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    const canonicalRefreshService = {
      refreshV1OrdenesDeCompraFromApiSnapshot: jest.fn().mockResolvedValue(2),
    } as unknown as jest.Mocked<MercadoPublicoCanonicalRefreshService>;

    service = new MercadoPublicoApiV1OcByDateService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should record and reject when date is missing', async () => {
      await expect(service.run({})).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'param_error', recordsFailed: 1 }),
      );
    });

    it('should record and reject when date is empty', async () => {
      await expect(service.run({ date: '' })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });
  });

  describe('run', () => {
    it('should persist and canonicalize OC on success', async () => {
      clientService.getByDate.mockResolvedValue(mockApiSuccessResponse as any);

      await service.run({ date: '2026-06-15' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v1-oc-by-date',
      );
      expect(
        persistenceService.persistV1OrdenesDeCompraSnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshotKind: 'list',
        }),
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 2,
          recordsStaged: 2,
          recordsCanonicalized: 2,
          recordsFailed: 0,
        }),
      );
    });

    it('should record failure when api returns errorSummary', async () => {
      clientService.getByDate.mockResolvedValue({
        ...mockApiSuccessResponse,
        httpStatus: 500,
        errorSummary: 'retryable_failed',
        errorMessage: 'Server error',
      } as any);

      await expect(service.run({ date: '2026-06-15' })).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retryable_failed',
        }),
      );
    });

    it('should handle transport failure', async () => {
      clientService.getByDate.mockRejectedValue(new Error('Network error'));

      await expect(service.run({ date: '2026-06-15' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
