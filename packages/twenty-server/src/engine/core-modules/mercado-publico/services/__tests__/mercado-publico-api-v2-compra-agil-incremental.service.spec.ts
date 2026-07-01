import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV2CompraAgilIncrementalService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-incremental.service';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoApiV2CompraAgilIncrementalService', () => {
  let service: MercadoPublicoApiV2CompraAgilIncrementalService;
  let clientService: jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockPersistenceResult = {
    rawApiPayloadId: 'raw-payload-id',
    recordsFetched: 3,
    recordsStaged: 0,
    recordsCanonicalized: 0,
  };

  const mockApiSuccessResponse = {
    endpoint: 'list',
    source: 'api-v2-compra-agil',
    requestParams: { ttl_cambio_ms: 5000 },
    requestFingerprint: 'fp',
    payloadChecksum: 'cs',
    schemaFingerprint: 'sf',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: {},
    compraAgil: [
      { codigo: 'CA-1', estado: 'publicada' },
      { codigo: 'CA-2', estado: 'cerrada' },
      { codigo: 'CA-3', estado: 'publicada' },
    ],
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

    service = new MercadoPublicoApiV2CompraAgilIncrementalService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should throw BadRequestException when neither ttl_cambio_ms nor cambio_desde provided', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when ttl_cambio_ms is zero', async () => {
      await expect(service.run({ ttl_cambio_ms: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when cambio_desde is empty', async () => {
      await expect(service.run({ cambio_desde: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('run', () => {
    it('should persist and canonicalize on success with ttl_cambio_ms', async () => {
      clientService.getList.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ ttl_cambio_ms: 5000 });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v2-compra-agil-incremental',
      );
      expect(clientService.getList).toHaveBeenCalledWith(
        expect.objectContaining({ ttl_cambio_ms: 5000 }),
      );
      expect(
        persistenceService.persistV2CompraAgilSnapshot,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          snapshotKind: 'list',
        }),
      );
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 3,
          recordsCanonicalized: 0,
          recordsFailed: 0,
        }),
      );
    });

    it('should pass cambio_desde and cambio_hasta to client when provided', async () => {
      clientService.getList.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({
        cambio_desde: '2026-06-01T00:00:00Z',
        cambio_hasta: '2026-06-30T00:00:00Z',
      });

      expect(clientService.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          cambio_desde: '2026-06-01T00:00:00Z',
          cambio_hasta: '2026-06-30T00:00:00Z',
        }),
      );
    });

    it('should record failure when api returns errorSummary', async () => {
      clientService.getList.mockResolvedValue({
        ...mockApiSuccessResponse,
        httpStatus: 500,
        errorSummary: 'retryable_failed',
        errorMessage: 'Server error',
        compraAgil: [],
      } as any);

      await expect(service.run({ ttl_cambio_ms: 5000 })).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retryable_failed',
        }),
      );
    });

    it('should handle transport failure', async () => {
      clientService.getList.mockRejectedValue(new Error('Network error'));

      await expect(service.run({ cambio_desde: '2026-06-01T00:00:00Z' })).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
