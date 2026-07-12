import { MercadoPublicoApiV2CompraAgilDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-detail-by-codigo.service';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoApiV2CompraAgilDetailByCodigoService', () => {
  let service: MercadoPublicoApiV2CompraAgilDetailByCodigoService;
  let clientService: jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
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
    source: 'api-v2-compra-agil',
    requestParams: { codigo: 'CA-1' },
    requestFingerprint: 'fp',
    payloadChecksum: 'cs',
    schemaFingerprint: 'sf',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: {},
    compraAgil: [{ codigo: 'CA-1', estado: 'publicada' }],
    errorSummary: undefined,
  };

  beforeEach(() => {
    clientService = {
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;

    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      persistV2CompraAgilSnapshot: jest
        .fn()
        .mockResolvedValue(mockPersistenceResult),
      persistApiFailure: jest.fn(),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    const canonicalRefreshService = {
      refreshV2CompraAgilFromApiSnapshot: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<MercadoPublicoCanonicalRefreshService>;

    service = new MercadoPublicoApiV2CompraAgilDetailByCodigoService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should record and reject when codigo is missing', async () => {
      await expect(service.run({})).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'param_error', recordsFailed: 1 }),
      );
    });

    it('should record and reject when codigo is empty', async () => {
      await expect(service.run({ codigo: '' })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });

    it('should record and reject when codigo is not a string', async () => {
      await expect(service.run({ codigo: 123 })).rejects.toThrow(
        MercadoPublicoRecordedJobFailureError,
      );
    });
  });

  describe('run', () => {
    it('should create job run, call client, persist, and finalize on success', async () => {
      clientService.getByCodigo.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ codigo: 'CA-1' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v2-compra-agil-detail-by-codigo',
      );
      expect(clientService.getByCodigo).toHaveBeenCalledWith('CA-1');
      expect(
        persistenceService.persistV2CompraAgilSnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshotKind: 'detail',
        }),
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          jobRunRecordId: 'job-run-id',
          status: 'success',
          recordsFailed: 0,
        }),
      );
    });

    it('should finalize with recordsFailed 1 when no detail record found (soft miss)', async () => {
      clientService.getByCodigo.mockResolvedValue({
        ...mockApiSuccessResponse,
        compraAgil: [],
      } as any);

      await service.run({ codigo: 'CA-NONEXIST' });

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 0,
          recordsFailed: 1,
        }),
      );
    });

    it('should record soft miss when api returns errorSummary', async () => {
      clientService.getByCodigo.mockResolvedValue({
        ...mockApiSuccessResponse,
        httpStatus: 404,
        errorSummary: 'soft_miss',
        errorMessage: 'Not found',
        compraAgil: [],
      } as any);

      await expect(service.run({ codigo: 'CA-NONEXIST' })).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'soft_miss',
        }),
      );
    });

    it('should handle transport failure', async () => {
      clientService.getByCodigo.mockRejectedValue(new Error('Network error'));

      await expect(service.run({ codigo: 'CA-1' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
