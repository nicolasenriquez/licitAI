import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV2CompraAgilDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-detail-by-codigo.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

describe('MercadoPublicoApiV2CompraAgilDetailByCodigoService', () => {
  let service: MercadoPublicoApiV2CompraAgilDetailByCodigoService;
  let durableSyncService: jest.Mocked<MercadoPublicoV2DurableSyncService>;

  beforeEach(() => {
    durableSyncService = {
      start: jest.fn().mockResolvedValue({
        syncRunId: 'sync-run-id',
        status: 'succeeded',
        recordsDiscovered: 1,
        recordsHydrated: 1,
        recordsFailed: 0,
        pagesCheckpointed: 1,
        watermarkAfter: null,
        observationIds: ['observation-id'],
        recordsProjected: 1,
      }),
    } as unknown as jest.Mocked<MercadoPublicoV2DurableSyncService>;

    service = new MercadoPublicoApiV2CompraAgilDetailByCodigoService(
      durableSyncService,
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
    it('should delegate detail synchronization to the durable V2 pipeline', async () => {
      await service.run({ codigo: 'CA-1' });

      expect(durableSyncService.start).toHaveBeenCalledWith(
        { id: 'CA-1' },
        'manual',
        'api-v2-compra-agil-detail-by-codigo',
      );
    });

    it('should propagate durable synchronization failures', async () => {
      durableSyncService.start.mockRejectedValue(new Error('Network error'));
      await expect(
        service.run({ codigo: 'CA-1' }),
      ).rejects.toThrow();
    });
  });
});
