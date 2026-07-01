import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV1OcDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-detail-by-codigo.service';
import { MercadoPublicoApiV1OrdenesDeCompraClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoApiV1OcDetailByCodigoService', () => {
  let service: MercadoPublicoApiV1OcDetailByCodigoService;
  let clientService: jest.Mocked<MercadoPublicoApiV1OrdenesDeCompraClientService>;
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
    source: 'api-v1-oc',
    requestParams: { codigo: 'OC-1' },
    requestFingerprint: 'fingerprint-1',
    payloadChecksum: 'checksum-1',
    schemaFingerprint: 'schema-1',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: { Codigo: 'OC-1' },
    ordenesDeCompra: [{ Codigo: 'OC-1', CodigoEstado: 6, Estado: 'Aceptada' }],
    errorSummary: undefined,
  };

  beforeEach(() => {
    clientService = {
      getByDate: jest.fn(),
      getByEstado: jest.fn(),
      getByCodigo: jest.fn(),
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
      refreshV1OrdenesDeCompraFromApiSnapshot: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<MercadoPublicoCanonicalRefreshService>;

    service = new MercadoPublicoApiV1OcDetailByCodigoService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should throw BadRequestException when codigo is missing', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when codigo is empty', async () => {
      await expect(service.run({ codigo: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when codigo is not a string', async () => {
      await expect(service.run({ codigo: 123 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('run', () => {
    it('should create job run, call client, persist, and finalize on success', async () => {
      clientService.getByCodigo.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ codigo: 'OC-1' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v1-oc-detail-by-codigo',
      );

      expect(clientService.getByCodigo).toHaveBeenCalledWith('OC-1');

      expect(
        persistenceService.persistV1OrdenesDeCompraSnapshot,
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

      clientService.getByCodigo.mockResolvedValue(errorResponse);

      await expect(
        service.run({ codigo: 'OC-NONEXIST' }),
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

      clientService.getByCodigo.mockRejectedValue(networkError);

      await expect(
        service.run({ codigo: 'OC-1' }),
      ).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
