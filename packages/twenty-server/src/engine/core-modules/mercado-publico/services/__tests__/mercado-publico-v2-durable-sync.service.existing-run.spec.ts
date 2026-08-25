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
      persistApiFailure: jest.fn().mockResolvedValue(undefined),
      finalizeJobRun: jest.fn(),
      recordPipelineHealth: jest.fn().mockResolvedValue(undefined),
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
    const projectionService = {
      ingest: jest.fn().mockResolvedValue({
        observationId: 'detail-observation-1',
        created: true,
        applied: true,
        semanticChanged: false,
        skipped: false,
      }),
      ingestWithEntityManager: jest.fn().mockResolvedValue({
        observationId: 'list-observation-1',
        created: true,
        applied: true,
        semanticChanged: false,
        skipped: false,
      }),
    };
    const service = new MercadoPublicoV2DurableSyncService(
      client,
      {
        getSettings: () => ({ httpMaxRetries: 3, httpRetryBackoffMs: 0 }),
      } as never,
      persistenceService,
      { query, transaction } as never,
      projectionService as unknown as MercadoPublicoV2ProjectionService,
    );

    return service;
  };

  it('executes an existing run without creating a second run', async () => {
    const runRow = buildRunRow({
      error_stage: 'hydrating',
      status: 'partial_failed',
    });
    let pendingItemReads = 0;
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
      if (sql.includes('SELECT id, codigo')) {
        pendingItemReads += 1;

        return Promise.resolve(
          pendingItemReads === 1
            ? [
                {
                  id: 'item-1',
                  codigo: 'FIXTURE-CA-001',
                  attempts: 0,
                  status: 'pending',
                },
              ]
            : [],
        );
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
      sql.includes('INSERT INTO mp.sync_run ('),
    );

    expect(runInserts).toHaveLength(0);
  });

  it('fences an expired attempt after a slow provider request', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (
        sql.includes('SELECT id') &&
        sql.includes('FROM mp.sync_run_attempt')
      ) {
        return Promise.resolve([{ id: 'attempt-1' }]);
      }
      if (
        sql.includes('SELECT id, intent, scope, request_params') &&
        sql.includes('FROM mp.sync_run')
      ) {
        return Promise.resolve([
          buildRunRow({ status: 'queued', request_params: { max_pages: 1 } }),
        ]);
      }
      if (sql.includes('SELECT records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '1',
            records_hydrated: '0',
            records_failed: '0',
            records_deferred: '0',
            records_projected: '0',
            pages_checkpointed: '1',
            discovery_complete: true,
          },
        ]);
      }

      return Promise.resolve([]);
    });
    const getList = jest.fn().mockResolvedValue(buildListResponse(false));
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList,
      getByCodigo: jest.fn(),
    });
    const persistenceService = (
      service as unknown as {
        mercadoPublicoPersistenceService: jest.Mocked<MercadoPublicoPersistenceService>;
      }
    ).mercadoPublicoPersistenceService;

    await expect(
      service.executeExistingRun('run-1', 'attempt-1'),
    ).rejects.toThrow(/attempt.*active|stale/i);

    expect(getList).toHaveBeenCalledTimes(1);
    expect(
      persistenceService.persistV2CompraAgilSnapshot,
    ).not.toHaveBeenCalled();
    expect(persistenceService.finalizeJobRun).not.toHaveBeenCalled();
  });

  it('returns the cancelled result without hydrating when a queued run was cancelled', async () => {
    const runRow = buildRunRow({
      error_stage: 'queued',
      status: 'cancelled',
    });
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '0',
            records_hydrated: '0',
            records_failed: '0',
            records_projected: '0',
            pages_checkpointed: '0',
          },
        ]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([runRow]);
      }

      return Promise.resolve([]);
    });
    const entityManagerQuery = jest.fn().mockResolvedValue([]);
    const service = buildService({
      query,
      entityManagerQuery,
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });

    await expect(service.executeExistingRun('run-1')).resolves.toMatchObject({
      syncRunId: 'run-1',
      status: 'cancelled',
    });
    expect(
      query.mock.calls.some(([sql]) => sql.includes('UPDATE mp.sync_run_item')),
    ).toBe(false);
  });

  it('resumes the run already owned by an execution key', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('WHERE execution_key')) {
        return Promise.resolve([{ id: 'run-1' }]);
      }
      if (sql.includes('records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '1',
            records_hydrated: '1',
            records_failed: '0',
            records_projected: '1',
            pages_checkpointed: '1',
          },
        ]);
      }
      if (sql.includes('SELECT id, codigo')) {
        return Promise.resolve([]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          buildRunRow({ error_stage: 'hydrating', status: 'partial_failed' }),
        ]);
      }

      return Promise.resolve([]);
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });

    await expect(
      service.startOrResume(
        {},
        'manual',
        'api-v2-compra-agil-by-publication-window',
        '4a88c929-8420-4a9e-8b78-c11a90ee0bd9',
      ),
    ).resolves.toMatchObject({ syncRunId: 'run-1', status: 'succeeded' });

    expect(
      query.mock.calls.filter(([sql]) =>
        sql.includes('INSERT INTO mp.sync_run'),
      ),
    ).toHaveLength(0);
  });

  it('preserves cancellation while resuming hydration', async () => {
    const service = buildService({
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
          return Promise.resolve([
            buildRunRow({ error_stage: 'hydrating', status: 'partial_failed' }),
          ]);
        }

        return Promise.resolve([]);
      }),
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });
    const syncService = service as unknown as {
      hydrate: jest.Mock;
      cancelRun: jest.Mock;
      finishRun: jest.Mock;
    };

    jest.spyOn(syncService, 'hydrate').mockResolvedValue('cancelled');
    jest.spyOn(syncService, 'cancelRun').mockResolvedValue({
      status: 'cancelled',
    });
    jest.spyOn(syncService, 'finishRun').mockResolvedValue({
      status: 'succeeded',
    });

    await expect(service.resume('run-1')).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(syncService.cancelRun).toHaveBeenCalledWith(
      expect.objectContaining({ syncRunId: 'run-1' }),
      'job-run-1',
      'hydrating',
    );
    expect(syncService.finishRun).not.toHaveBeenCalled();
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

  it('checkpoints only the configured page budget before pausing discovery', async () => {
    const getList = jest.fn().mockResolvedValue(buildListResponse(true));
    const query = jest.fn().mockResolvedValue([]);
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList,
      getByCodigo: jest.fn(),
    });

    await expect(
      (
        service as unknown as {
          discover: (
            context: {
              syncRunId: string;
              scope: string;
              requestParams: { tamano_pagina: number };
              maxPages: number;
            },
            jobRunRecordId: string,
          ) => Promise<unknown>;
        }
      ).discover(
        {
          syncRunId: 'run-1',
          scope: 'global',
          requestParams: { tamano_pagina: 50 },
          maxPages: 1,
        },
        'job-run-1',
      ),
    ).resolves.toBe('page_budget_reached');

    expect(getList).toHaveBeenCalledTimes(1);
    expect(getList).toHaveBeenCalledWith(
      expect.objectContaining({ numero_pagina: 1 }),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('completion_reason = $2'),
      ['run-1', 'page_budget_reached', false],
    );
  });

  it('advances the watermark on a first unfiltered global run without a change window', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '1',
            records_hydrated: '1',
            records_failed: '0',
            records_deferred: '0',
            records_projected: '1',
            pages_checkpointed: '1',
            discovery_complete: true,
          },
        ]);
      }
      if (sql.includes('MAX(provider_changed_at)')) {
        return Promise.resolve([
          { max_provider_changed_at: new Date('2026-08-14T12:00:00.000Z') },
        ]);
      }

      return Promise.resolve([]);
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });

    await expect(
      (
        service as unknown as {
          finishRun: (
            context: {
              syncRunId: string;
              intent: string;
              scope: string;
              requestParams: Record<string, unknown>;
              maxPages: undefined;
              watermarkBefore: null;
              status: string;
              cancellationRequestedAt: null;
            },
            jobRunRecordId: string,
          ) => Promise<{ status: string; watermarkAfter: Date | null }>;
        }
      ).finishRun(
        {
          syncRunId: 'run-1',
          intent: 'scheduled',
          scope: 'global',
          requestParams: { tamano_pagina: 50, numero_pagina: 1 },
          maxPages: undefined,
          watermarkBefore: null,
          status: 'hydrating',
          cancellationRequestedAt: null,
        },
        'job-run-1',
      ),
    ).resolves.toMatchObject({
      status: 'succeeded',
      watermarkAfter: new Date('2026-08-14T12:00:00.000Z'),
    });

    expect(
      query.mock.calls.some(([sql]: [string]) =>
        sql.includes('INSERT INTO mp.source_watermark'),
      ),
    ).toBe(true);
  });

  it('finishes a bounded window successfully with partial coverage', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT id, intent, scope, request_params')) {
        return Promise.resolve([
          buildRunRow({
            request_params: {
              tamano_pagina: 50,
              max_pages: 3,
            },
            status: 'queued',
          }),
        ]);
      }
      if (sql.includes('records_discovered')) {
        return Promise.resolve([
          {
            records_discovered: '0',
            records_hydrated: '0',
            records_failed: '0',
            records_deferred: '0',
            records_projected: '0',
            pages_checkpointed: '1',
            discovery_complete: false,
          },
        ]);
      }
      if (sql.includes('SELECT job_name')) {
        return Promise.resolve([
          { job_name: 'api-v2-compra-agil-incremental' },
        ]);
      }

      return Promise.resolve([]);
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList: jest.fn(),
      getByCodigo: jest.fn(),
    });
    const syncService = service as unknown as {
      discover: jest.Mock;
      hydrate: jest.Mock;
    };

    jest
      .spyOn(syncService, 'discover')
      .mockResolvedValue('page_budget_reached');
    jest.spyOn(syncService, 'hydrate').mockResolvedValue('completed');

    const persistenceService = (
      service as unknown as {
        mercadoPublicoPersistenceService: jest.Mocked<MercadoPublicoPersistenceService>;
      }
    ).mercadoPublicoPersistenceService;

    await expect(service.executeExistingRun('run-1')).resolves.toMatchObject({
      status: 'succeeded',
      watermarkAfter: null,
    });
    expect(syncService.hydrate).toHaveBeenCalled();
    expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
      expect.objectContaining({
        jobRunRecordId: 'job-run-1',
        status: 'success',
        recordsFailed: 0,
      }),
    );
    expect(persistenceService.recordPipelineHealth).toHaveBeenCalledWith({
      jobName: 'api-v2-compra-agil-incremental',
      succeeded: true,
    });
  });

  it('resumes only a discovery-complete run', async () => {
    let pendingItemReads = 0;
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
      if (sql.includes('SELECT id, codigo')) {
        pendingItemReads += 1;

        return Promise.resolve(
          pendingItemReads === 1
            ? [
                {
                  id: 'item-1',
                  codigo: 'FIXTURE-CA-001',
                  attempts: 0,
                  status: 'pending',
                },
              ]
            : [],
        );
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

  it('keeps a retryable discovery failure resumable from the failed page', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run_page')) {
        return Promise.resolve([{ max_page: '1' }]);
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          buildRunRow({
            status: 'partial_failed',
            error_stage: 'discovering',
            error_retryable: true,
          }),
        ]);
      }

      return Promise.resolve([]);
    });
    const getList = jest.fn().mockResolvedValueOnce({
      ...buildListResponse(false),
      httpStatus: 504,
      errorSummary: 'retryable_failed',
      compraAgil: [],
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList,
      getByCodigo: jest.fn(),
    });

    await expect(service.executeExistingRun('run-1')).rejects.toThrow(
      /retryable_failed/,
    );

    expect(getList).toHaveBeenCalledWith(
      expect.objectContaining({ numero_pagina: 2 }),
    );
    const failUpdate = query.mock.calls.find(([sql]) =>
      sql.includes(
        "status = CASE WHEN $3 THEN 'partial_failed' ELSE 'failed' END",
      ),
    );

    expect(failUpdate).toBeDefined();
    expect(failUpdate[1]).toEqual([
      'run-1',
      'discovering',
      true,
      'retryable_failed: durable discovering failed',
    ]);
  });

  it('deferred retryable hydration failures exhaust per item', async () => {
    let pendingItemReads = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT id, codigo')) {
        const attempts = pendingItemReads;
        pendingItemReads += 1;

        return Promise.resolve(
          attempts < 4
            ? [
                {
                  id: 'item-1',
                  codigo: 'FIXTURE-CA-001',
                  attempts,
                  status: 'pending',
                },
              ]
            : [],
        );
      }
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([
          buildRunRow({ error_stage: 'hydrating', status: 'partial_failed' }),
        ]);
      }

      return Promise.resolve([]);
    });
    const getByCodigo = jest.fn().mockResolvedValue({
      ...buildListResponse(false),
      httpStatus: 504,
      errorSummary: 'retryable_failed',
      compraAgil: [],
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList: jest.fn(),
      getByCodigo,
    });

    await expect(
      (
        service as unknown as {
          hydrate: (
            context: { syncRunId: string },
            jobRunRecordId: string,
          ) => Promise<unknown>;
        }
      ).hydrate({ syncRunId: 'run-1' }, 'job-run-1'),
    ).resolves.toBe('completed');

    expect(getByCodigo).toHaveBeenCalledTimes(4);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SET status = $2'),
      ['item-1', 'deferred', 'retryable_failed', 'raw-payload-1'],
    );
  });

  it('fails terminally on a non-retryable discovery failure', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT') && sql.includes('FROM mp.sync_run')) {
        return Promise.resolve([buildRunRow({ status: 'discovering' })]);
      }

      return Promise.resolve([]);
    });
    const getList = jest.fn().mockResolvedValue({
      ...buildListResponse(false),
      httpStatus: 400,
      errorSummary: 'param_error',
      compraAgil: [],
    });
    const service = buildService({
      query,
      entityManagerQuery: jest.fn().mockResolvedValue([]),
      getList,
      getByCodigo: jest.fn(),
    });

    await expect(service.executeExistingRun('run-1')).rejects.toThrow(
      /param_error/,
    );

    const failUpdate = query.mock.calls.find(([sql]) =>
      sql.includes('error_retryable = $3'),
    );

    expect(failUpdate).toBeDefined();
    expect(failUpdate[1]).toEqual([
      'run-1',
      'discovering',
      false,
      'hard_fail: durable discovering failed',
    ]);
  });
});
