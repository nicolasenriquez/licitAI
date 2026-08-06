import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV2CompraAgilIncrementalService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-incremental.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

describe('MercadoPublicoApiV2CompraAgilIncrementalService', () => {
  let service: MercadoPublicoApiV2CompraAgilIncrementalService;
  let durableSyncService: jest.Mocked<MercadoPublicoV2DurableSyncService>;

  beforeEach(() => {
    durableSyncService = {
      start: jest.fn().mockResolvedValue({ status: 'succeeded' }),
    } as unknown as jest.Mocked<MercadoPublicoV2DurableSyncService>;
    service = new MercadoPublicoApiV2CompraAgilIncrementalService(
      durableSyncService,
    );
  });

  it('requires a relative or absolute change window', async () => {
    await expect(service.run({})).rejects.toThrow(BadRequestException);
    await expect(service.run({ ttl_cambio_ms: 0 })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.run({ cambio_desde: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('delegates the validated request to the durable pipeline', async () => {
    await service.run({
      cambio_desde: '2026-06-01T00:00:00Z',
      cambio_hasta: '2026-06-30T00:00:00Z',
      tamano_pagina: 50,
    });

    expect(durableSyncService.start).toHaveBeenCalledWith(
      expect.objectContaining({
        cambio_desde: '2026-06-01T00:00:00Z',
        cambio_hasta: '2026-06-30T00:00:00Z',
        tamano_pagina: 50,
      }),
      'scheduled',
    );
  });
});
