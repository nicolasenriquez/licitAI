import { type DataSource } from 'typeorm';

import { MercadoPublicoV2DetailReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-detail-read.service';

const detailRow = {
  codigo: 'CA-1',
  title: 'Servicio',
  state: 'publicada',
  buyer_code: '1-9',
  buyer_name: 'Municipio',
  region: 13,
  published_at: new Date('2026-08-01T10:00:00.000Z'),
  closing_at: new Date('2026-08-30T10:00:00.000Z'),
  amount: '1000',
  currency_source: 'CLP',
  document_count: 2,
  llamado: 1,
  availability: 'available',
  description: 'Descripción',
  delivery_address: 'Av. Central',
  delivery_days: 5,
  cancellation_at: null,
  call_description: 'Primer llamado',
  call_first_closing_at: null,
  call_second_closing_at: null,
  budget_type: 'estimado',
  budget_estimate: '1000',
  budget_currency: 'CLP',
  cancel_motive: null,
  deserted_motive: null,
  selection_motive: null,
  total_offers: 2,
  total_demands: 0,
  fine_penalty: '0',
  observation_id: 'observation-1',
  normalizer_version: 'normalizer-1',
  provider_schema_fingerprint: 'schema-1',
  lifecycle_reason: 'new_published',
  snapshot_kind: 'detail',
  source: 'api-v2-compra-agil',
  endpoint: 'detail',
  observed_at: new Date('2026-08-01T10:00:00.000Z'),
  provider_changed_at: null,
  freshness_status: 'fresh' as const,
  freshness_error: null,
  freshness_as_of: new Date('2026-08-01T10:00:00.000Z'),
};

describe('MercadoPublicoV2DetailReadService', () => {
  it('reads structured detail, lifecycle, and provenance', async () => {
    const query = jest.fn().mockResolvedValueOnce([detailRow]);
    const service = new MercadoPublicoV2DetailReadService({
      query,
    } as unknown as DataSource);

    const result = await service.getOpportunityDetail('CA-1');

    expect(result).toMatchObject({
      codigo: 'CA-1',
      description: 'Descripción',
      lifecycleReason: 'new_published',
      detailFreshness: { status: 'fresh' },
      provenance: {
        observationId: 'observation-1',
        snapshotKind: 'detail',
        normalizerVersion: 'normalizer-1',
      },
    });
  });

  it('derives freshness from the latest relevant sync item', async () => {
    const query = jest.fn().mockResolvedValueOnce([detailRow]);
    const service = new MercadoPublicoV2DetailReadService({
      query,
    } as unknown as DataSource);

    await service.getOpportunityDetail('CA-1');

    const [sql] = query.mock.calls[0];
    const latestDetailItemSubquery = sql.slice(
      sql.indexOf('LEFT JOIN LATERAL'),
    );

    expect(sql).toContain('INNER JOIN mp.sync_run AS run');
    expect(sql).toContain("run.source = 'api-v2-compra-agil'");
    expect(sql).toContain('ORDER BY item.updated_at DESC NULLS LAST');
    expect(latestDetailItemSubquery).not.toContain(
      'item.sync_run_id = observation.sync_run_id',
    );
    expect(latestDetailItemSubquery).not.toContain(
      'item.error_summary IS NOT NULL',
    );
  });

  it('uses independent relation cursors and preserves zero availability', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([detailRow])
      .mockResolvedValueOnce([
        {
          availability: 'available',
          total_count: 2,
          source_kind: 'detail',
          projected_at: new Date('2026-08-01T10:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          provider_key: '1',
          ordinal: 0,
          element_json: { id: 1, nombre: 'Bases' },
          provider_json: null,
        },
        {
          provider_key: '2',
          ordinal: 1,
          element_json: { id: 2, nombre: 'Anexos' },
          provider_json: null,
        },
      ]);
    const service = new MercadoPublicoV2DetailReadService({
      query,
    } as unknown as DataSource);

    const result = await service.listOpportunityRelation({
      codigo: 'CA-1',
      relation: 'documents',
      first: 1,
    });

    expect(result?.edges).toHaveLength(1);
    expect(result?.edges[0]?.node.name).toBe('Bases');
    expect(result?.availability).toMatchObject({
      availability: 'available',
      reason: 'published',
      totalCount: 2,
    });
    expect(result?.hasNextPage).toBe(true);
  });

  it('explains why relation evidence is unavailable', async () => {
    const detailSourceQuery = jest
      .fn()
      .mockResolvedValueOnce([detailRow])
      .mockResolvedValueOnce([
        {
          availability: 'unavailable',
          total_count: 0,
          source_kind: 'detail',
          projected_at: new Date('2026-08-01T10:00:00.000Z'),
        },
      ]);
    const detailSourceService = new MercadoPublicoV2DetailReadService({
      query: detailSourceQuery,
    } as unknown as DataSource);

    const detailResult = await detailSourceService.listOpportunityRelation({
      codigo: 'CA-1',
      relation: 'offers',
    });

    expect(detailResult?.availability).toMatchObject({
      availability: 'unavailable',
      reason: 'not_published_by_provider',
      sourceKind: 'detail',
    });

    const listSourceQuery = jest
      .fn()
      .mockResolvedValueOnce([detailRow])
      .mockResolvedValueOnce([
        {
          availability: 'unavailable',
          total_count: 0,
          source_kind: 'list',
          projected_at: new Date('2026-08-01T10:00:00.000Z'),
        },
      ]);
    const listSourceService = new MercadoPublicoV2DetailReadService({
      query: listSourceQuery,
    } as unknown as DataSource);

    const listResult = await listSourceService.listOpportunityRelation({
      codigo: 'CA-1',
      relation: 'offers',
    });

    expect(listResult?.availability).toMatchObject({
      availability: 'unavailable',
      reason: 'not_observed_in_source',
      sourceKind: 'list',
    });
  });

  it('redacts payload only through explicit payload read', async () => {
    const query = jest.fn().mockResolvedValueOnce([
      {
        codigo: 'CA-1',
        observation_id: 'observation-1',
        payload_checksum: 'source-checksum',
        raw_payload: { codigo: 'CA-1', ticket: 'secret' },
      },
    ]);
    const service = new MercadoPublicoV2DetailReadService({
      query,
    } as unknown as DataSource);

    const result =
      await service.getSanitizedOpportunityPayload('observation-1');

    expect(result).toMatchObject({
      codigo: 'CA-1',
      redacted: true,
      payload: { codigo: 'CA-1', ticket: '[REDACTED]' },
    });
    expect(result?.sourcePayloadChecksum).not.toBe(
      result?.sanitizedPayloadChecksum,
    );
  });
});
