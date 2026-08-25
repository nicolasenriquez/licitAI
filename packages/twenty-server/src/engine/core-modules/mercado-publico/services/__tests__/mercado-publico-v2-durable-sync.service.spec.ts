import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import axios from 'axios';

import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

const syncConfig = {
  getSettings: () => ({ httpMaxRetries: 3, httpRetryBackoffMs: 0 }),
};
const listRecord = fixture.payload.items[0];

describe('MercadoPublicoV2DurableSyncService', () => {
  it('publishes LIST canonical and gold rows in the page checkpoint transaction', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const transactionalSql: string[] = [];
    const entityManagerQuery = jest.fn().mockImplementation((sql: string) => {
      transactionalSql.push(sql);

      if (sql.includes('INSERT INTO mp.v2_observation')) {
        return Promise.resolve([{ id: 'list-observation-1' }]);
      }
      if (sql.includes('INSERT INTO mp.compra_agil')) {
        return Promise.resolve([{ id: 'compra-agil-1' }]);
      }

      return Promise.resolve([]);
    });
    const transaction = jest.fn(
      async (
        callback: (manager: { query: typeof entityManagerQuery }) => unknown,
      ) => callback({ query: entityManagerQuery }),
    );
    const dataSource = { query, transaction };
    const getByCodigo = jest.fn();
    const service = new MercadoPublicoV2DurableSyncService(
      { getByCodigo } as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {} as MercadoPublicoPersistenceService,
      dataSource as never,
      new MercadoPublicoV2ProjectionService(dataSource as never),
    );
    const response = {
      endpoint: 'list',
      source: 'api-v2-compra-agil' as const,
      requestParams: { numero_pagina: 1, tamano_pagina: 50 },
      requestFingerprint: 'list-fingerprint',
      payloadChecksum: 'list-checksum',
      schemaFingerprint: 'list-schema',
      httpStatus: 200,
      fetchedAt: new Date('2026-08-12T00:00:00Z'),
      rawPayload: fixture,
      compraAgil: [listRecord],
      pagination: {
        pageNumber: 1,
        pageSize: 50,
        totalPages: 1,
        totalResults: 1,
        hasNextPage: false,
      },
    };

    await (
      service as unknown as {
        checkpointPage: (
          context: Record<string, unknown>,
          pageResponse: typeof response,
          rawApiPayloadId: string,
        ) => Promise<void>;
      }
    ).checkpointPage(
      {
        syncRunId: 'sync-run-1',
        intent: 'manual',
        scope: 'global',
        requestParams: {},
      },
      response,
      'raw-list-1',
    );

    const checkpointIndex = transactionalSql.findIndex((sql) =>
      sql.includes('INSERT INTO mp.sync_run_page'),
    );
    const observationIndex = transactionalSql.findIndex((sql) =>
      sql.includes('INSERT INTO mp.v2_observation'),
    );
    const canonicalIndex = transactionalSql.findIndex((sql) =>
      sql.includes('INSERT INTO mp.compra_agil'),
    );
    const goldIndex = transactionalSql.findIndex((sql) =>
      sql.includes('INSERT INTO mp.gold_detected_process'),
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(checkpointIndex).toBeLessThan(observationIndex);
    expect(observationIndex).toBeLessThan(canonicalIndex);
    expect(canonicalIndex).toBeLessThan(goldIndex);
    expect(entityManagerQuery).toHaveBeenCalledWith(
      expect.stringContaining('SET observation_id = $3'),
      ['sync-run-1', listRecord.codigo, 'list-observation-1'],
    );
    expect(getByCodigo).not.toHaveBeenCalled();
  });

  it('rejects the page transaction when LIST projection fails', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const transactionalSql: string[] = [];
    const entityManagerQuery = jest.fn().mockImplementation((sql: string) => {
      transactionalSql.push(sql);

      if (sql.includes('INSERT INTO mp.v2_observation')) {
        return Promise.resolve([{ id: 'list-observation-1' }]);
      }
      if (sql.includes('INSERT INTO mp.compra_agil')) {
        return Promise.resolve([{ id: 'compra-agil-1' }]);
      }
      if (sql.includes('INSERT INTO mp.gold_detected_process')) {
        throw new Error('projection failed');
      }

      return Promise.resolve([]);
    });
    let rolledBack = false;
    const transaction = jest.fn(
      async (
        callback: (manager: { query: typeof entityManagerQuery }) => unknown,
      ) => {
        try {
          return await callback({ query: entityManagerQuery });
        } catch (error) {
          rolledBack = true;
          throw error;
        }
      },
    );
    const dataSource = { query, transaction };
    const service = new MercadoPublicoV2DurableSyncService(
      {} as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {} as MercadoPublicoPersistenceService,
      dataSource as never,
      new MercadoPublicoV2ProjectionService(dataSource as never),
    );
    const response = {
      endpoint: 'list',
      source: 'api-v2-compra-agil' as const,
      requestParams: { numero_pagina: 1, tamano_pagina: 50 },
      requestFingerprint: 'list-fingerprint',
      payloadChecksum: 'list-checksum',
      schemaFingerprint: 'list-schema',
      httpStatus: 200,
      fetchedAt: new Date('2026-08-12T00:00:00Z'),
      rawPayload: fixture,
      compraAgil: [listRecord],
      pagination: {
        pageNumber: 1,
        pageSize: 50,
        totalPages: 1,
        totalResults: 1,
        hasNextPage: false,
      },
    };

    await expect(
      (
        service as unknown as {
          checkpointPage: (
            context: Record<string, unknown>,
            pageResponse: typeof response,
            rawApiPayloadId: string,
          ) => Promise<void>;
        }
      ).checkpointPage(
        {
          syncRunId: 'sync-run-1',
          intent: 'manual',
          scope: 'global',
          requestParams: {},
        },
        response,
        'raw-list-1',
      ),
    ).rejects.toThrow('projection failed');

    expect(rolledBack).toBe(true);
    expect(
      transactionalSql.some((sql) =>
        sql.includes('INSERT INTO mp.sync_run_page'),
      ),
    ).toBe(true);
    expect(
      transactionalSql.some((sql) =>
        sql.includes('INSERT INTO mp.v2_observation'),
      ),
    ).toBe(true);
  });

  it('runs the fixture through frozen page and item checkpoints', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO mp.sync_run')) {
        return Promise.resolve([{ id: 'sync-run-1' }]);
      }
      if (sql.includes('SELECT id, codigo')) {
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
            records_projected: '1',
            pages_checkpointed: '1',
          },
        ]);
      }
      if (sql.includes('SELECT job_name')) {
        return Promise.resolve([
          { job_name: 'api-v2-compra-agil-incremental' },
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
      if (sql.includes('INSERT INTO mp.compra_agil')) {
        return Promise.resolve([{ id: 'compra-agil-1' }]);
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
      recordPipelineHealth: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;
    const transaction = jest.fn(
      async (
        callback: (manager: { query: typeof entityManagerQuery }) => unknown,
      ) => callback({ query: entityManagerQuery }),
    );
    const service = new MercadoPublicoV2DurableSyncService(
      {} as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
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
    expect(persistenceService.recordPipelineHealth).toHaveBeenCalledWith({
      jobName: 'api-v2-compra-agil-incremental',
      succeeded: true,
    });
  });

  it('marks a terminal cohort with its lifecycle reason', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new MercadoPublicoV2DurableSyncService(
      {} as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {} as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await (
      service as unknown as {
        markCohortTerminal: (
          context: { syncRunId: string; scope: string },
          codigo: string,
          lifecycleReason: string,
        ) => Promise<void>;
      }
    ).markCohortTerminal(
      { syncRunId: 'sync-run-1', scope: 'global' },
      'CA-TERMINAL-001',
      'terminal_cancelled',
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('lifecycle_reason = $5'),
      [
        'sync-run-1',
        'api-v2-compra-agil',
        'global',
        'CA-TERMINAL-001',
        'terminal_cancelled',
      ],
    );
  });

  it('persists an empty detail payload before failing the item', async () => {
    let pendingItemReads = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
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

      return Promise.resolve([]);
    });
    const persistV2CompraAgilSnapshot = jest.fn().mockResolvedValue({
      rawApiPayloadId: 'raw-empty-detail',
    });
    const response = {
      endpoint: 'detail',
      source: 'api-v2-compra-agil',
      requestParams: { id: 'FIXTURE-CA-001' },
      requestFingerprint: 'detail-fingerprint',
      payloadChecksum: 'detail-checksum',
      schemaFingerprint: 'detail-schema',
      httpStatus: 200,
      fetchedAt: new Date('2026-08-12T00:00:00Z'),
      rawPayload: { data: [] },
      compraAgil: [],
    };
    const service = new MercadoPublicoV2DurableSyncService(
      {
        getByCodigo: jest.fn().mockResolvedValue(response),
      } as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {
        persistV2CompraAgilSnapshot,
      } as unknown as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await (
      service as unknown as {
        hydrate: (
          context: { syncRunId: string },
          jobRunRecordId: string,
        ) => Promise<unknown>;
      }
    ).hydrate({ syncRunId: 'sync-run-1' }, 'job-run-1');

    expect(persistV2CompraAgilSnapshot).toHaveBeenCalledWith({
      jobRunRecordId: 'job-run-1',
      apiResponse: response,
      snapshotKind: 'detail',
      errorSummaryText: undefined,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SET status = $2'),
      ['item-1', 'failed', 'soft_miss', 'raw-empty-detail'],
    );
    const failureUpdate = query.mock.calls.find(
      ([sql]) =>
        sql.includes('SET status = $2') &&
        sql.includes("error_stage = 'hydrating'"),
    );

    expect(failureUpdate?.[0]).not.toContain('observation_id');
  });

  it('checks cancellation before completing after the final hydration item', async () => {
    let pendingItemReads = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
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
      if (sql.includes('SELECT cancellation_requested_at')) {
        return Promise.resolve([
          { cancellation_requested_at: new Date('2026-08-12T00:05:00Z') },
        ]);
      }

      return Promise.resolve([]);
    });
    const response = {
      endpoint: 'detail',
      source: 'api-v2-compra-agil',
      requestParams: { id: 'FIXTURE-CA-001' },
      requestFingerprint: 'detail-fingerprint',
      payloadChecksum: 'detail-checksum',
      schemaFingerprint: 'detail-schema',
      httpStatus: 200,
      fetchedAt: new Date('2026-08-12T00:00:00Z'),
      rawPayload: { data: [] },
      compraAgil: [],
    };
    const service = new MercadoPublicoV2DurableSyncService(
      {
        getByCodigo: jest.fn().mockResolvedValue(response),
      } as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {
        persistV2CompraAgilSnapshot: jest.fn().mockResolvedValue({
          rawApiPayloadId: 'raw-empty-detail',
        }),
      } as unknown as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(
      (
        service as unknown as {
          hydrate: (
            context: { syncRunId: string },
            jobRunRecordId: string,
          ) => Promise<unknown>;
        }
      ).hydrate({ syncRunId: 'sync-run-1' }, 'job-run-1'),
    ).resolves.toBe('cancelled');
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
      syncConfig as never,
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
      syncConfig as never,
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
      syncConfig as never,
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

  it('freezes the active cohort only for reconcile intents', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new MercadoPublicoV2DurableSyncService(
      {} as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {} as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );
    const invoke = (intent: string) =>
      (
        service as unknown as {
          freezeActiveCohort: (context: {
            syncRunId: string;
            intent: string;
            scope: string;
            requestParams: Record<string, unknown>;
          }) => Promise<void>;
        }
      ).freezeActiveCohort({
        syncRunId: 'sync-run-1',
        intent,
        scope: 'global',
        requestParams: {},
      });

    await invoke('manual');

    expect(
      query.mock.calls.filter(([sql]: [string]) =>
        sql.includes('INSERT INTO mp.sync_run_item'),
      ),
    ).toHaveLength(0);

    await invoke('reconcile');

    expect(
      query.mock.calls.filter(([sql]: [string]) =>
        sql.includes('INSERT INTO mp.sync_run_item'),
      ),
    ).toHaveLength(1);
  });

  it('defers a 429 without Retry-After until the quota reset', async () => {
    let pendingItemReads = 0;
    const resetAt = new Date('2026-08-15T04:00:00.000Z');
    const query = jest.fn().mockImplementation((sql: string) => {
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
      if (sql.includes('FROM mp.gold_api_quota_usage')) {
        return Promise.resolve([{ reset_at: resetAt }]);
      }

      return Promise.resolve([]);
    });
    const persistV2CompraAgilSnapshot = jest.fn().mockResolvedValue({
      rawApiPayloadId: 'raw-429',
    });
    const response = {
      endpoint: 'detail',
      source: 'api-v2-compra-agil',
      requestParams: { codigo: 'FIXTURE-CA-001' },
      requestFingerprint: 'fingerprint-429',
      payloadChecksum: 'checksum-429',
      schemaFingerprint: 'schema-429',
      httpStatus: 429,
      fetchedAt: new Date('2026-08-12T00:00:00Z'),
      rawPayload: { status: 429 },
      compraAgil: [],
      errorSummary: 'retryable_failed',
    };
    const service = new MercadoPublicoV2DurableSyncService(
      {
        getByCodigo: jest.fn().mockResolvedValue(response),
      } as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {
        persistV2CompraAgilSnapshot,
      } as unknown as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(
      (
        service as unknown as {
          hydrate: (
            context: { syncRunId: string },
            jobRunRecordId: string,
          ) => Promise<unknown>;
        }
      ).hydrate({ syncRunId: 'sync-run-1' }, 'job-run-1'),
    ).rejects.toMatchObject({ retryable: true, retryAt: resetAt });

    expect(persistV2CompraAgilSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ snapshotKind: 'detail' }),
    );
  });

  it('preserves the transport error code when a detail request fails', async () => {
    let pendingItemReads = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
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

      return Promise.resolve([]);
    });
    const axiosError = new axios.AxiosError('timeout of 1000ms exceeded');
    axiosError.code = 'ECONNABORTED';
    const service = new MercadoPublicoV2DurableSyncService(
      {
        getByCodigo: jest.fn().mockRejectedValue(axiosError),
      } as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {} as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(
      (
        service as unknown as {
          hydrate: (
            context: { syncRunId: string },
            jobRunRecordId: string,
          ) => Promise<unknown>;
        }
      ).hydrate({ syncRunId: 'sync-run-1' }, 'job-run-1'),
    ).resolves.toBe('completed');

    const pendingUpdate = query.mock.calls.find(
      ([sql]: [string]) =>
        sql.includes('error_summary = $3') &&
        sql.includes("status = 'pending'"),
    );

    expect(pendingUpdate?.[1]).toEqual([
      'item-1',
      'hydrating',
      'retryable_failed: detail request failed: ECONNABORTED',
      null,
    ]);

    const attemptInsert = query.mock.calls.find(([sql]: [string]) =>
      sql.includes('INSERT INTO mp.sync_run_item_attempt'),
    );

    expect(attemptInsert?.[1]).toEqual([
      'sync-run-1',
      'item-1',
      1,
      'detail-by-codigo',
      expect.any(Date),
      expect.any(Date),
      expect.any(Number),
      null,
      'ECONNABORTED',
      null,
      null,
      'retryable_failed',
      true,
      null,
      null,
    ]);
  });

  it('persists an append-only attempt row for a retryable detail response', async () => {
    let pendingItemReads = 0;
    const query = jest.fn().mockImplementation((sql: string) => {
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

      return Promise.resolve([]);
    });
    const persistV2CompraAgilSnapshot = jest.fn().mockResolvedValue({
      rawApiPayloadId: 'raw-503',
    });
    const response = {
      endpoint: 'detail-by-codigo',
      source: 'api-v2-compra-agil',
      requestParams: { codigo: 'FIXTURE-CA-001' },
      requestFingerprint: 'fingerprint-503',
      payloadChecksum: 'checksum-503',
      schemaFingerprint: 'schema-503',
      httpStatus: 503,
      fetchedAt: new Date('2026-08-12T00:00:00Z'),
      rawPayload: { status: 503 },
      compraAgil: [],
      errorSummary: 'retryable_failed',
    };
    const service = new MercadoPublicoV2DurableSyncService(
      {
        getByCodigo: jest.fn().mockResolvedValue(response),
      } as unknown as MercadoPublicoApiV2CompraAgilClientService,
      syncConfig as never,
      {
        persistV2CompraAgilSnapshot,
      } as unknown as MercadoPublicoPersistenceService,
      { query } as never,
      {} as MercadoPublicoV2ProjectionService,
    );

    await expect(
      (
        service as unknown as {
          hydrate: (
            context: { syncRunId: string },
            jobRunRecordId: string,
          ) => Promise<unknown>;
        }
      ).hydrate({ syncRunId: 'sync-run-1' }, 'job-run-1'),
    ).resolves.toBe('completed');

    const attemptInsert = query.mock.calls.find(([sql]: [string]) =>
      sql.includes('INSERT INTO mp.sync_run_item_attempt'),
    );

    expect(attemptInsert?.[1]).toEqual([
      'sync-run-1',
      'item-1',
      1,
      'detail-by-codigo',
      expect.any(Date),
      expect.any(Date),
      expect.any(Number),
      503,
      null,
      null,
      null,
      'retryable_failed',
      true,
      null,
      'raw-503',
    ]);
  });
});
