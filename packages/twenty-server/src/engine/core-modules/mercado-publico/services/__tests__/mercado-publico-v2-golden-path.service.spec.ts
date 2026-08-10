import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2GoldenPathService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-golden-path.service';

describe('MercadoPublicoV2GoldenPathService', () => {
  it('is a thin fixture adapter over the durable pipeline', async () => {
    const durableService = {
      runFixture: jest.fn().mockResolvedValue({
        syncRunId: 'sync-run-1',
        observationIds: ['observation-1'],
        recordsProjected: 1,
      }),
      start: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2DurableSyncService>;
    const service = new MercadoPublicoV2GoldenPathService(durableService);

    await expect(service.runFixture(fixture)).resolves.toEqual({
      syncRunId: 'sync-run-1',
      observationIds: ['observation-1'],
      recordsProjected: 1,
    });
    expect(durableService.runFixture).toHaveBeenCalledWith(fixture);
  });
});
