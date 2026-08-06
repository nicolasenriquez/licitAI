import { type DataSource } from 'typeorm';

import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import { MercadoPublicoV2GoldenPathService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-golden-path.service';

describe('MercadoPublicoV2GoldenPathService', () => {
  it('uses one durable sync run, evidence row, normalizer and gold projection', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_run')) {
        return Promise.resolve([{ id: 'sync-run-1' }]);
      }

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
        recordsCanonicalized: 1,
      }),
      finalizeJobRun: jest.fn(),
    };
    const canonicalRefreshService = {
      refreshV2CompraAgilFromApiSnapshot: jest.fn().mockResolvedValue(1),
    };
    const service = new MercadoPublicoV2GoldenPathService(
      {} as never,
      persistenceService as never,
      canonicalRefreshService as never,
      { query } as unknown as DataSource,
    );

    const result = await service.runFixture(fixture);

    expect(result).toEqual({
      syncRunId: 'sync-run-1',
      observationIds: ['observation-1'],
      recordsProjected: 1,
    });
    expect(persistenceService.persistV2CompraAgilSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        jobRunRecordId: 'job-run-1',
        snapshotKind: 'list',
      }),
    );
    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes('INSERT INTO mp.v2_observation'),
      ),
    ).toBe(true);
    const goldProjectionCall = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO mp.gold_detected_process'),
    );

    expect(goldProjectionCall?.[1]).toEqual(
      expect.arrayContaining([
        'FIXTURE-CA-001',
        'Servicio de mantención preventiva',
      ]),
    );
    expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', recordsCanonicalized: 1 }),
    );
  });
});
