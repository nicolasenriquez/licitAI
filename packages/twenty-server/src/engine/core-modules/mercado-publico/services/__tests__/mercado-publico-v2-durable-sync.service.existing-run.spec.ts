import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

const record = extractV2CompraAgilListRecords(fixture)[0];

const buildListResponse = (hasNextPage: boolean) => ({
  endpoint: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  requestParams: {},
  requestFingerprint: 'fingerprint-1',
  payloadChecksum: 'checksum-1',
  schemaFingerprint: 'schema-1',
  httpStatus: 200,
  fetchedAt: new Date('2026-08-12T00:00:00Z'),
  rawPayload: {},
  compraAgil: [record],
  pagination: {
    pageNumber: 1,
    pageSize: 50,
    totalPages: 2,
    totalResults: 2,
    hasNextPage,
  },
});

describe('MercadoPublicoV2DurableSyncService existing-run execution', () => {
  const buildRunRow = (
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> => ({
    id: 'run-1',
    intent: 'manual',
    scope: 'global',
    request_params: {},
    watermark_before: null,
    error_stage: null,
    status: 'discovering',
    cancellation_requested_at: null,
    ...overrides,
  });

  const buildService = ({
    query,
    entityManagerQuery,
    getList,
    getByCodigo,
  }: {
    query: jest.Mock;
    entityManagerQuery: jest.Mock;
    getList: jest.Mock;
    getByCodigo: jest.Mock;
  }) => {
    const persistenceService = {
      createJobRun: jest.fn().mockResolvedValue({ id: 'job-run-1' }),
      persistV2CompraAgilSnapshot: jest.fn().mockResolvedValue({
        rawApiPayloadId: 'raw-payload-1',
      }),
      finalizeJobRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;
    const transaction = jest.fn(
      async (
        callback: (manager: { query: typeof entityManagerQuery }) => unknown,
      ) => callback({ query: entityManagerQuery }),
    );
    const client = {
      getList,
      getByCodigo,
    } as unknown as jest.Mocked<MercadoPublicoApiV2CompraAgilClientService>;
    const service = new MercadoPublicoV2DurableSyncService(
      client,
      persistenceService,
      { query, transaction } as never,
      new MercadoPublicoV2ProjectionService({ transaction } as never),
    );

    return service;
  };

  it('executes an existing run without creating a second run', async () => {
    const runRow = buildRunRow({
      error_stage: 'hydrating',
      status: 'partial_failed',
    });
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '0',
            records_hydrated: '0',
            records_failed: '0',
            pages_checkpointed: '1',
          },
        ]);
      }
      if (sql.includes('SELECT id, codigo, status')) {
        return Promise.resolve([
          { id: 'item-1', codigo: 'FIXTURE-CA-001', status: 'pending' },
        ]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([runRow]);
      }

      return Promise.resolve([]);
    });
    const entityManagerQuery = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.v2_observation')) {
        return Promise.resolve([{ id: 'observation-1' }]);
      }

      return Promise.resolve([]);
    });
    const getByCodigo = jest.fn().mockResolvedValue({
      ...buildListResponse(false),
      errorSummary: undefined,
    });
    const service = buildService({
      query,
      entityManagerQuery,
      getList: jest.fn(),
      getByCodigo,
    });

    await service.executeExistingRun('run-1');

    expect(getByCodigo).toHaveBeenCalledWith('FIXTURE-CA-001');
    const runInserts = query.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO mp.sync_run'),
    );

    expect(runInserts).toHaveLength(0);
  });

  it('cancels cooperatively after the current page and keeps its checkpoint', async () => {
    let runRowCalls = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        runRowCalls += 1;

        return Promise.resolve([
          buildRunRow({
            cancellation_requested_at:
              runRowCalls > 1 ? new Date('2026-08-12T00:05:00Z') : null,
          }),
        ]);
      }

      return Promise.resolve([]);
    });
    const entityManagerQuery = jest.fn().mockResolvedValue([]);
    const getList = jest.fn().mockResolvedValue(buildListResponse(true));
    const service = buildService({
      query,
      entityManagerQuery,
      getList,
      getByCodigo: jest.fn(),
    });

    await expect(service.executeExistingRun('run-1')).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(getList).toHaveBeenCalledTimes(1);
    const pageCheckpoints = entityManagerQuery.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO mp.sync_run_page'),
    );

    expect(pageCheckpoints.length).toBeGreaterThan(0);
    const cancelledUpdates = query.mock.calls.filter(
      ([sql]) =>
        sql.includes('UPDATE mp.sync_run') && sql.includes('cancelled'),
    );

    expect(cancelledUpdates.length).toBeGreaterThan(0);
  });

  it('resumes only a discovery-complete run', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '1',
            records_hydrated: '1',
            records_failed: '0',
            pages_checkpointed: '1',
          },
        ]);
      }
      if (sql.includes('SELECT id, codigo, status')) {
        return Promise.resolve([
          { id: 'item-1', codigo: 'FIXTURE-CA-001', status: 'pending' },
        ]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          buildRunRow({ error_stage: 'hydrating', status: 'partial_failed' }),
        ]);
      }

      return Promise.resolve([]);
    });
    const entityManagerQuery = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.v2_observation')) {
        return Promise.resolve([{ id: 'observation-1' }]);
      }

      return Promise.resolve([]);
    });
    const getByCodigo = jest.fn().mockResolvedValue({
      ...buildListResponse(false),
      errorSummary: undefined,
    });
    const service = buildService({
      query,
      entityManagerQuery,
      getList: jest.fn(),
      getByCodigo,
    });

    await expect(service.executeExistingRun('run-1')).resolves.toMatchObject({
      status: 'succeeded',
    });
    expect(getByCodigo).toHaveBeenCalledWith('FIXTURE-CA-001');
  });

  it('rejects resume of a run that failed during discovery', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          buildRunRow({ error_stage: 'discovering', status: 'failed' }),
        ]);
      }

      return Promise.resolve([]);
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn(),
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });

    await expect(service.executeExistingRun('run-1')).rejects.toThrow(
      /rediscover/i,
    );
  });

  it('rejects resume of a terminal run', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          buildRunRow({ error_stage: null, status: 'succeeded' }),
        ]);
      }

      return Promise.resolve([]);
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn(),
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });

    await expect(service.executeExistingRun('run-1')).rejects.toThrow(
      /resume|terminal/i,
    );
  });
});
