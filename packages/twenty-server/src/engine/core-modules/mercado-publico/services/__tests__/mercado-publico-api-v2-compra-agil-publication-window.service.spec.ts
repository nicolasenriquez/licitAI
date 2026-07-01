import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV2CompraAgilPublicationWindowService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-publication-window.service';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoApiV2CompraAgilPublicationWindowService', () => {
  let service: MercadoPublicoApiV2CompraAgilPublicationWindowService;
  let clientService: jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-id',
    jobRunId: 'run-1',
    startedAt: new Date(),
  };

  const mockPersistenceResult = {
    rawApiPayloadId: 'raw-payload-id',
    recordsFetched: 2,
    recordsStaged: 0,
    recordsCanonicalized: 0,
  };

  const mockApiSuccessResponse = {
    endpoint: 'list',
    source: 'api-v2-compra-agil',
    requestParams: { publicado_desde: '2026-06-01T00:00:00Z' },
    requestFingerprint: 'fp',
    payloadChecksum: 'cs',
    schemaFingerprint: 'sf',
    httpStatus: 200,
    fetchedAt: new Date(),
    rawPayload: {},
    compraAgil: [
      { codigo: 'CA-1', estado: 'publicada' },
      { codigo: 'CA-2', estado: 'cerrada' },
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

    service = new MercadoPublicoApiV2CompraAgilPublicationWindowService(
      clientService,
      canonicalRefreshService,
      persistenceService,
    );
  });

  describe('parsePayload', () => {
    it('should throw BadRequestException when both publicado_desde and publicado_hasta are missing', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when both are empty strings', async () => {
      await expect(
        service.run({ publicado_desde: '', publicado_hasta: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('run', () => {
    it('should persist and canonicalize on success with publicado_desde only', async () => {
      clientService.getList.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({ publicado_desde: '2026-06-01T00:00:00Z' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'api-v2-compra-agil-by-publication-window',
      );
      expect(clientService.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          publicado_desde: '2026-06-01T00:00:00Z',
        }),
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
          recordsFetched: 2,
          recordsCanonicalized: 0,
          recordsFailed: 0,
        }),
      );
    });

    it('should pass both publicado_desde and publicado_hasta when both provided', async () => {
      clientService.getList.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({
        publicado_desde: '2026-06-01T00:00:00Z',
        publicado_hasta: '2026-06-30T23:59:59Z',
      });

      expect(clientService.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          publicado_desde: '2026-06-01T00:00:00Z',
          publicado_hasta: '2026-06-30T23:59:59Z',
        }),
      );
    });

    it('should pass only publicado_hasta when publicado_desde is not provided', async () => {
      clientService.getList.mockResolvedValue(
        mockApiSuccessResponse as any,
      );

      await service.run({
        publicado_hasta: '2026-06-30T23:59:59Z',
      });

      expect(clientService.getList).toHaveBeenCalledWith(
        expect.objectContaining({
          publicado_hasta: '2026-06-30T23:59:59Z',
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

      await expect(
        service.run({ publicado_desde: '2026-06-01T00:00:00Z' }),
      ).rejects.toThrow();

      expect(persistenceService.persistApiFailure).toHaveBeenCalled();
      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retryable_failed',
        }),
      );
    });

    it('should handle transport failure', async () => {
      clientService.getList.mockRejectedValue(new Error('Network error'));

      await expect(
        service.run({ publicado_desde: '2026-06-01T00:00:00Z' }),
      ).rejects.toThrow();

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});
