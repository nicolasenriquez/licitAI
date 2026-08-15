import { type DataSource } from 'typeorm';

import {
  encodeMercadoPublicoV2HistoryCursor,
  MercadoPublicoV2HistoryReadService,
  type MercadoPublicoV2HistoryRow,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-history-read.service';

const historyRow = (
  overrides: Partial<MercadoPublicoV2HistoryRow> = {},
): MercadoPublicoV2HistoryRow => ({
  id: '11111111-1111-4111-8111-111111111111',
  codigo: 'FIXTURE-CA-001',
  previous_observation_id: '00000000-0000-0000-0000-000000000010',
  new_observation_id: '00000000-0000-0000-0000-000000000011',
  semantic_fingerprint_before: 'before-fingerprint',
  semantic_fingerprint_after: 'after-fingerprint',
  before_json: {
    title: 'Servicio anterior',
    amount: '1000',
    buyer_code: 'BUYER-001',
  },
  after_json: {
    title: 'Servicio actualizado',
    amount: '1200',
    buyer_code: 'BUYER-001',
  },
  provider_changed_at_raw: '2026-08-10T11:00:00Z',
  provider_changed_at: new Date('2026-08-10T11:00:00Z'),
  observed_at: new Date('2026-08-10T12:00:00Z'),
  normalizer_version: 'mercado-publico-v2-durable-1',
  provider_schema_fingerprint: 'schema-1',
  created_at: new Date('2026-08-10T12:00:01Z'),
  source: 'api-v2-compra-agil',
  endpoint: 'list',
  snapshot_kind: 'list',
  ...overrides,
});

describe('MercadoPublicoV2HistoryReadService', () => {
  it('returns semantic diff and provenance without current snapshot data', async () => {
    const row = historyRow();
    const query = jest.fn().mockResolvedValueOnce([row]);
    const service = new MercadoPublicoV2HistoryReadService({
      query,
    } as unknown as DataSource);

    const result = await service.listHistory('FIXTURE-CA-001', undefined, 10);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      id: row.id,
      codigo: row.codigo,
      changedFields: ['amount', 'title'],
      previousObservationId: row.previous_observation_id,
      newObservationId: row.new_observation_id,
      providerChangedAt: row.provider_changed_at,
      observedAt: row.observed_at,
      normalizerVersion: row.normalizer_version,
      providerSchemaFingerprint: row.provider_schema_fingerprint,
      source: row.source,
      endpoint: row.endpoint,
      snapshotKind: row.snapshot_kind,
    });
    expect(result.rows[0]).not.toHaveProperty('beforeJson');
    expect(result.rows[0]).not.toHaveProperty('afterJson');
    expect(result.rows[0]).not.toHaveProperty('rawPayload');
    expect(query.mock.calls[0][0]).toContain('FROM mp.v2_history');
    expect(query.mock.calls[0][0]).toContain('mp.v2_observation');
    expect(query.mock.calls[0][0]).not.toContain('gold_detected_process');
    expect(query.mock.calls[0][0]).toContain('history.codigo = $1');
    expect(query.mock.calls[0][0]).toContain(
      'ORDER BY history.created_at DESC, history.id DESC',
    );
  });

  it('uses created_at and id keyset pagination', async () => {
    const firstRow = historyRow();
    const cursor = encodeMercadoPublicoV2HistoryCursor(firstRow);
    const query = jest.fn().mockResolvedValueOnce([historyRow()]);
    const service = new MercadoPublicoV2HistoryReadService({
      query,
    } as unknown as DataSource);

    await service.listHistory('FIXTURE-CA-001', cursor, 10);

    expect(query.mock.calls[0][0]).toContain('history.created_at <');
    expect(query.mock.calls[0][0]).toContain(
      '(history.created_at = $2 AND history.id < $3)',
    );
    expect(query.mock.calls[0][1]).toEqual([
      'FIXTURE-CA-001',
      firstRow.created_at.toISOString(),
      firstRow.id,
      11,
    ]);
  });

  it('returns an empty connection without manufacturing an event', async () => {
    const query = jest.fn().mockResolvedValueOnce([]);
    const service = new MercadoPublicoV2HistoryReadService({
      query,
    } as unknown as DataSource);

    await expect(
      service.listHistory('FIXTURE-CA-001', undefined, 10),
    ).resolves.toEqual({
      rows: [],
      hasNextPage: false,
      startCursor: null,
      endCursor: null,
    });
    expect(query.mock.calls[0][0]).not.toContain('gold_detected_process');
  });

  it('rejects a missing opportunity identity before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2HistoryReadService({
      query,
    } as unknown as DataSource);

    await expect(service.listHistory('   ')).rejects.toThrow(
      'Mercado Publico V2 history requires codigo',
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects malformed history cursors before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2HistoryReadService({
      query,
    } as unknown as DataSource);

    await expect(
      service.listHistory('FIXTURE-CA-001', 'not-json'),
    ).rejects.toThrow('Mercado Publico V2 history cursor is invalid');
    expect(query).not.toHaveBeenCalled();
  });
});
