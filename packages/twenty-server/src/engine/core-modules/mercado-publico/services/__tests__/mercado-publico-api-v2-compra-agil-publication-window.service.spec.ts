import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoApiV2CompraAgilPublicationWindowService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-publication-window.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

describe('MercadoPublicoApiV2CompraAgilPublicationWindowService', () => {
  let service: MercadoPublicoApiV2CompraAgilPublicationWindowService;
  let durableSyncService: jest.Mocked<MercadoPublicoV2DurableSyncService>;

  beforeEach(() => {
    durableSyncService = {
      start: jest.fn().mockResolvedValue({ status: 'succeeded' }),
      resume: jest.fn().mockResolvedValue({ status: 'succeeded' }),
    } as unknown as jest.Mocked<MercadoPublicoV2DurableSyncService>;
    service = new MercadoPublicoApiV2CompraAgilPublicationWindowService(
      durableSyncService,
    );
  });

  it('requires a complete publication window', async () => {
    await expect(service.run({})).rejects.toThrow(BadRequestException);
    await expect(
      service.run({ publicado_desde: '', publicado_hasta: '' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.run({ publicado_desde: '2026-06-01T00:00:00Z' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.run({ publicado_hasta: '2026-06-30T23:59:59Z' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('delegates the validated request to the durable pipeline', async () => {
    await service.run({
      publicado_desde: '2026-06-01T00:00:00Z',
      publicado_hasta: '2026-06-30T23:59:59Z',
      ordenar_por: 'FechaPublicacion',
      max_pages: 3,
      bounded_window: true,
    });

    expect(durableSyncService.start).toHaveBeenCalledWith(
      expect.objectContaining({
        publicado_desde: '2026-06-01T00:00:00Z',
        publicado_hasta: '2026-06-30T23:59:59Z',
        ordenar_por: 'FechaPublicacion',
        max_pages: 3,
        bounded_window: true,
      }),
      'manual',
      'api-v2-compra-agil-by-publication-window',
    );
  });

  it('resumes an explicit durable sync run without validating a new window', async () => {
    await service.run({ sync_run_id: '234e9e80-0ac9-4fea-a23d-74c52d27a6ad' });

    expect(durableSyncService.resume).toHaveBeenCalledWith(
      '234e9e80-0ac9-4fea-a23d-74c52d27a6ad',
    );
    expect(durableSyncService.start).not.toHaveBeenCalled();
  });

  it('rejects the undocumented orden parameter', async () => {
    await expect(
      service.run({
        publicado_desde: '2026-06-01T00:00:00Z',
        publicado_hasta: '2026-06-30T23:59:59Z',
        orden: 'asc',
      }),
    ).rejects.toThrow('does not support "orden"');
  });

  it('passes a local page budget to the durable pipeline', async () => {
    await service.run({
      publicado_desde: '2026-06-01T00:00:00Z',
      publicado_hasta: '2026-06-01T23:59:59Z',
      max_pages: 3,
    });

    expect(durableSyncService.start).toHaveBeenCalledWith(
      expect.objectContaining({ max_pages: 3 }),
      'manual',
      'api-v2-compra-agil-by-publication-window',
    );
  });

  it('resumes the specified durable run without parsing a new window', async () => {
    durableSyncService.resume = jest.fn().mockResolvedValue({
      status: 'succeeded',
    });

    await service.run({ sync_run_id: 'sync-run-id' });

    expect(durableSyncService.resume).toHaveBeenCalledWith('sync-run-id');
    expect(durableSyncService.start).not.toHaveBeenCalled();
  });
});
