import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV2CompraAgilPublicationWindowService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-publication-window.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

describe('MercadoPublicoApiV2CompraAgilPublicationWindowService', () => {
  let service: MercadoPublicoApiV2CompraAgilPublicationWindowService;
  let durableSyncService: jest.Mocked<MercadoPublicoV2DurableSyncService>;

  beforeEach(() => {
    durableSyncService = {
      start: jest.fn().mockResolvedValue({ status: 'succeeded' }),
    } as unknown as jest.Mocked<MercadoPublicoV2DurableSyncService>;
    service = new MercadoPublicoApiV2CompraAgilPublicationWindowService(
      durableSyncService,
    );
  });

  it('requires a publication window bound', async () => {
    await expect(service.run({})).rejects.toThrow(BadRequestException);
    await expect(
      service.run({ publicado_desde: '', publicado_hasta: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('delegates the validated request to the durable pipeline', async () => {
    await service.run({
      publicado_desde: '2026-06-01T00:00:00Z',
      publicado_hasta: '2026-06-30T23:59:59Z',
    });

    expect(durableSyncService.start).toHaveBeenCalledWith(
      expect.objectContaining({
        publicado_desde: '2026-06-01T00:00:00Z',
        publicado_hasta: '2026-06-30T23:59:59Z',
      }),
      'manual',
      'api-v2-compra-agil-by-publication-window',
    );
  });
});
