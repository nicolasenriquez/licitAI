import { MercadoPublicoApiV1LicitacionDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitacion-detail-by-codigo.service';
import { MercadoPublicoApiV1LicitacionesClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoApiV1LicitacionDetailByCodigoService', () => {
  let service: MercadoPublicoApiV1LicitacionDetailByCodigoService;
  let clientService: jest.Mocked<MercadoPublicoApiV1LicitacionesClientService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockPersistenceResult = {
    rawApiPayloadId: 'raw-payload-id',
    recordsFetched: 1,
    recordsStaged: 1,
    recordsCanonicalized: 0,
  };

  const mockApiSuccessResponse = {
    endpoint: 'detail-by-codigo',
    source: 'api-v1-licitaciones',
    requestParams: { codigo: 'LIC-123' },
    requestFingerprint: 'fingerprint-1',
    payloadChecksum: 'checksum-1',
    schemaFingerprint: 'schema-1',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: { CodigoExterno: 'LIC-123' },
    licitaciones: [{ CodigoExterno: 'LIC-123' }],
    errorSummary: undefined,
  };

  beforeEach(() => {
    clientService = {
      getByDate: jest.fn(),
      getByCodigoExterno: jest.fn(),
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
      refreshV1LicitacionesFromApiSnapshot: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<MercadoPublicoCanonicalRefreshService>;

    service = new MercadoPublicoApiV1LicitacionDetailByCodigoService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should record and reject when codigoExterno is missing', async () => {
      await expect(service.run({})).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'param_error', recordsFailed: 1 }),
      );
    });

    it('should record and reject when codigoExterno is empty', async () => {
      await expect(service.run({ codigoExterno: '' })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });

    it('should record and reject when codigoExterno is not a string', async () => {
      await expect(service.run({ codigoExterno: 123 })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });
  });

  describe('run', () => {
    it('should create job run, call client, persist, and finalize on success', async () => {
      clientService.getByCodigoExterno.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ codigoExterno: 'LIC-123' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v1-licitacion-detail-by-codigo',
      );

      expect(clientService.getByCodigoExterno).toHaveBeenCalledWith('LIC-123');

      expect(
        persistenceService.persistV1LicitacionesSnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshotKind: 'detail',
        }),
      );

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          jobRunRecordId: 'job-run-id',
          status: 'success',
        }),
      );
    });

    it('should record soft miss when api returns errorSummary', async () => {
      const errorResponse = {
        ...mockApiSuccessResponse,
        httpStatus: 404,
        errorSummary: 'soft_miss',
        errorMessage: 'Not found',
      } as any;

      clientService.getByCodigoExterno.mockResolvedValue(errorResponse);

      await expect(
        service.run({ codigoExterno: 'LIC-NONEXIST' }),
      ).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'soft_miss',
        }),
      );
    });

    it('should handle unexpected error with transport failure classification', async () => {
      const networkError = new Error('Network error');

      clientService.getByCodigoExterno.mockRejectedValue(networkError);

      await expect(service.run({ codigoExterno: 'LIC-123' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
