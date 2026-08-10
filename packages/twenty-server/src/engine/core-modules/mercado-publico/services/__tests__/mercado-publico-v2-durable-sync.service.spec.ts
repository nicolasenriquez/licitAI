import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

describe('MercadoPublicoV2DurableSyncService', () => {
  it('runs the fixture through frozen page and item checkpoints', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_run')) {
        return Promise.resolve([{ id: 'sync-run-1' }]);
      }
      if (sql.includes('SELECT id, codigo, status')) {
        return Promise.resolve([
          { id: 'item-1', codigo: 'FIXTURE-CA-001', status: 'pending' },
        ]);
      }
      if (sql.includes('SELECT records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '1',
            records_hydrated: '1',
            records_failed: '0',
            pages_checkpointed: '1',
          },
        ]);
      }
      if (sql.includes('SELECT observation_id')) {
        return Promise.resolve([{ observation_id: 'observation-1' }]);
      }

      return Promise.resolve([]);
    });
    const entityManagerQuery = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.v2_observation')) {
        return Promise.resolve([{ id: 'observation-1' }]);
      }

      return Promise.resolve([]);
    });
    const persistenceService = {
      createJobRun: jest.fn().mockResolvedValue({ id: 'job-run-1' }),
      persistV2CompraAgilSnapshot: jest.fn().mockResolvedValue({
        rawApiPayloadId: 'raw-payload-1',
        recordsFetched: 1,
        recordsStaged: 1,
        recordsCanonicalized: 0,
      }),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;
    const transaction = jest.fn(
      async (
        callback: (manager: { query: typeof entityManagerQuery }) => unknown,
      ) => callback({ query: entityManagerQuery }),
    );
    const service = new MercadoPublicoV2DurableSyncService(
      {} as unknown as MercadoPublicoApiV2CompraAgilClientService,
      persistenceService,
      { query, transaction } as never,
      new MercadoPublicoV2ProjectionService({ transaction } as never),
    );

    await expect(service.runFixture(fixture)).resolves.toMatchObject({
      syncRunId: 'sync-run-1',
      status: 'succeeded',
      observationIds: ['observation-1'],
      recordsProjected: 1,
    });
    expect(persistenceService.persistV2CompraAgilSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ snapshotKind: 'list' }),
    );
    expect(entityManagerQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO mp.v2_observation'),
      expect.any(Array),
    );
  });

  it('requires rediscovery after a discovery failure', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: 'sync-run-1',
        intent: 'scheduled',
        scope: 'global',
        request_params: {},
        watermark_before: null,
        error_stage: 'discovering',
      },
    ]);
    const persistenceService = {
      createJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;
    const service = new MercadoPublicoV2DurableSyncService(
      {} as unknown as MercadoPublicoApiV2CompraAgilClientService,
      persistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(service.resume('sync-run-1')).rejects.toThrow(
      'failed during discovery and must be rediscovered',
    );
    expect(persistenceService.createJobRun).not.toHaveBeenCalled();
  });

  it('builds a complete UTC change window from a watermark', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT watermark_at')) {
        return Promise.resolve([
          { watermark_at: new Date('2026-06-01T12:00:00Z') },
        ]);
      }
      if (sql.includes('INSERT INTO mp.sync_run')) {
        return Promise.resolve([{ id: 'sync-run-1' }]);
      }

      return Promise.resolve([]);
    });
    const service = new MercadoPublicoV2DurableSyncService(
      {} as MercadoPublicoApiV2CompraAgilClientService,
      {} as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(
      (
        service as unknown as {
          createSyncRun: (
            intent: 'scheduled',
            payload: Record<string, unknown>,
          ) => Promise<unknown>;
        }
      ).createSyncRun('scheduled', { ttl_cambio_ms: 60000 }),
    ).resolves.toEqual(
      expect.objectContaining({
        requestParams: expect.objectContaining({
          cambio_desde: '2026-06-01T11:55:00.000Z',
          cambio_hasta: expect.stringMatching(/Z$/),
          ttl_cambio_ms: undefined,
        }),
      }),
    );
  });

  it('rejects incomplete explicit ranges before creating a sync run', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new MercadoPublicoV2DurableSyncService(
      {} as MercadoPublicoApiV2CompraAgilClientService,
      {} as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(
      (
        service as unknown as {
          createSyncRun: (
            intent: 'scheduled',
            payload: Record<string, unknown>,
          ) => Promise<unknown>;
        }
      ).createSyncRun('scheduled', {
        cambio_desde: '2026-06-01T00:00:00Z',
      }),
    ).rejects.toThrow('requires both cambio_desde and cambio_hasta');
  });
});
