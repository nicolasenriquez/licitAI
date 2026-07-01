import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV1OcByStateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-by-state.service';
import { MercadoPublicoApiV1OrdenesDeCompraClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoApiV1OcByStateService', () => {
  let service: MercadoPublicoApiV1OcByStateService;
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
    endpoint: 'by-state',
    source: 'api-v1-oc',
    requestParams: { estado: '6' },
    requestFingerprint: 'fp',
    payloadChecksum: 'cs',
    schemaFingerprint: 'sf',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: {},
    ordenesDeCompra: [
      { Codigo: 'OC-1', CodigoEstado: 6, Estado: 'Aceptada' },
      { Codigo: 'OC-2', CodigoEstado: 6, Estado: 'Aceptada' },
    ],
    errorSummary: undefined,
  };

  beforeEach(() => {
    clientService = {
      getByDate: jest.fn(),
      getByEstado: jest.fn(),
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

    service = new MercadoPublicoApiV1OcByStateService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should throw BadRequestException when estado is missing', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when estado is empty', async () => {
      await expect(service.run({ estado: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('run', () => {
    it('should persist and canonicalize OC on success', async () => {
      clientService.getByEstado.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ estado: '6' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v1-oc-by-state',
      );
      expect(clientService.getByEstado).toHaveBeenCalledWith('6');
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
          recordsCanonicalized: 2,
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

      await expect(service.run({ estado: '6' })).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retryable_failed',
        }),
      );
    });

    it('should handle transport failure', async () => {
      clientService.getByEstado.mockRejectedValue(new Error('Network error'));

      await expect(service.run({ estado: '6' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
