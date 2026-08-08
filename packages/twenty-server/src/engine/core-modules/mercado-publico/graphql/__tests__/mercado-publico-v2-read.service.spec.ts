import { type DataSource } from 'typeorm';

import {
  encodeMercadoPublicoV2OpportunityCursor,
  MercadoPublicoV2ReadService,
  type MercadoPublicoV2OpportunityRow,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';

const buildRow = (
  overrides: Partial<MercadoPublicoV2OpportunityRow> = {},
): MercadoPublicoV2OpportunityRow => ({
  codigo: 'CA-1',
  title: 'Primera',
  canonical_state: 'publicada',
  buyer_name: 'Municipio',
  region: 13,
  published_at: null,
  closing_at: new Date('2026-06-30T12:00:00.000Z'),
  amount: '1000',
  currency_source: 'CLP',
  document_count: 1,
  llamado: null,
  observation_id: 'observation-1',
  normalizer_version: 'v1',
  provider_schema_fingerprint: 'schema-1',
  availability: 'available',
  ...overrides,
});

const encodeCursor = (
  row: MercadoPublicoV2OpportunityRow,
  sort:
    | 'closing_at_desc'
    | 'closing_at_asc'
    | 'published_at_desc'
    | 'published_at_asc'
    | 'amount_desc'
    | 'amount_asc' = 'closing_at_desc',
): string => encodeMercadoPublicoV2OpportunityCursor(row, sort);

describe('MercadoPublicoV2ReadService', () => {
  it('returns a deterministic keyset page and advances by closing date plus codigo', async () => {
    const firstRow = buildRow();
    const secondRow = buildRow({ codigo: 'CA-2' });
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([firstRow, secondRow]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);

    const firstPage = await service.listOpportunities({}, undefined, 1);

    expect(firstPage.rows).toEqual([firstRow]);
    expect(firstPage.totalCount).toBe(2);
    expect(firstPage.hasNextPage).toBe(true);
    expect(firstPage.endCursor).toBe(encodeCursor(firstRow));
    expect(query.mock.calls[0][0]).toContain('FROM mp.v2_cohort');
    expect(query.mock.calls[1][0]).toContain('FROM mp.v2_cohort');
    expect(query.mock.calls[1][0]).toContain(
      'ORDER BY mp.gold_detected_process.closing_at DESC NULLS LAST, mp.gold_detected_process.process_code ASC',
    );

    query
      .mockReset()
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([secondRow]);

    const nextPage = await service.listOpportunities(
      {},
      firstPage.endCursor ?? undefined,
      1,
    );

    expect(nextPage.rows).toEqual([secondRow]);
    expect(nextPage.totalCount).toBe(2);
    expect(query.mock.calls[0][1]).toEqual([]);
    expect(query.mock.calls[1][1]).toEqual([
      firstRow.closing_at!.toISOString(),
      firstRow.codigo,
      2,
    ]);
  });

  it('clamps first to the 1..100 page size', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: '1' }])
      .mockResolvedValueOnce([buildRow()]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);

    await service.listOpportunities({}, undefined, 500);

    expect(query.mock.calls[1][1]).toEqual([101]);
  });

  it('adds filter clauses in the parameterized WHERE', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: '0' }])
      .mockResolvedValueOnce([]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);

    await service.listOpportunities({
      search: 'santiago',
      states: ['publicada', 'cerrada'],
      region: 13,
      buyer: 'serviu',
      closingAtFrom: new Date('2026-06-01T00:00:00.000Z'),
      closingAtTo: new Date('2026-07-01T00:00:00.000Z'),
      documentCountMin: 1,
      documentCountMax: 5,
      llamado: 2,
      amountMin: '100',
      amountMax: '1000000',
      currencies: ['CLP', 'UF'],
      cohortStatus: 'active',
    });

    const countSql = query.mock.calls[0][0] as string;
    const countParams = query.mock.calls[0][1] as unknown[];
    const pageSql = query.mock.calls[1][0] as string;
    const pageParams = query.mock.calls[1][1] as unknown[];

    expect(countSql).toContain('status = $1');
    expect(countParams[0]).toBe('active');
    expect(countSql).toContain(
      'process_code ILIKE $2 OR title ILIKE $2 OR buyer_name ILIKE $2',
    );
    expect(countParams[1]).toBe('%santiago%');
    expect(countSql).toContain('canonical_state = ANY($3::text[])');
    expect(countParams[2]).toEqual(['publicada', 'cerrada']);
    expect(countSql).toContain('region = $4');
    expect(countSql).toContain('buyer_name ILIKE $5 OR buyer_code ILIKE $5');
    expect(countSql).toContain('closing_at >= $6');
    expect(countSql).toContain('closing_at <= $7');
    expect(countSql).toContain('document_count >= $8');
    expect(countSql).toContain('document_count <= $9');
    expect(countSql).toContain('llamado = $10');
    expect(countSql).toContain('amount >= $11::numeric');
    expect(countSql).toContain('amount <= $12::numeric');
    expect(countSql).toContain('currency_source = ANY($13::text[])');
    expect(pageParams[10]).toBe('100');
    expect(pageParams[11]).toBe('1000000');
    expect(pageSql).toContain('LIMIT $14');
    expect(pageParams[13]).toBe(101);
  });

  it('rejects invalid ranges before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);

    await expect(
      service.listOpportunities({
        closingAtFrom: new Date('2026-07-01T00:00:00.000Z'),
        closingAtTo: new Date('2026-06-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('closingAtFrom must not be after closingAtTo');
    await expect(
      service.listOpportunities({ documentCountMin: 3, documentCountMax: 1 }),
    ).rejects.toThrow('documentCountMin must not exceed documentCountMax');
    await expect(
      service.listOpportunities({ documentCountMin: -1 }),
    ).rejects.toThrow('documentCountMin must not be negative');
    await expect(
      service.listOpportunities({ amountMin: '9000', amountMax: '1000' }),
    ).rejects.toThrow('amountMin must not exceed amountMax');
    await expect(
      service.listOpportunities({ amountMin: 'not-a-number' }),
    ).rejects.toThrow('amountMin must be a decimal string');
    await expect(
      service.listOpportunities({ cohortStatus: 'paused' as 'active' }),
    ).rejects.toThrow('cohortStatus must be "active" or "terminal"');
    expect(query).not.toHaveBeenCalled();
  });

  it('builds asc keyset predicates with NULLS LAST semantics', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([buildRow()]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);
    const cursor = encodeCursor(
      buildRow({ closing_at: null }),
      'closing_at_asc',
    );

    await service.listOpportunities({}, cursor, 10, 'closing_at_asc');

    expect(query.mock.calls[1][0]).toContain(
      'ORDER BY mp.gold_detected_process.closing_at ASC NULLS LAST, mp.gold_detected_process.process_code ASC',
    );
    expect(query.mock.calls[1][0]).toContain(
      '(closing_at IS NULL AND process_code > $1)',
    );
    expect(query.mock.calls[1][1]).toEqual(['CA-1', 11]);
  });

  it('keeps NULL sort values after non-NULL asc cursor values', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([buildRow()]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);
    const cursor = encodeCursor(buildRow(), 'closing_at_asc');

    await service.listOpportunities({}, cursor, 10, 'closing_at_asc');

    expect(query.mock.calls[1][0]).toContain(
      '(closing_at > $1 OR closing_at IS NULL OR (closing_at = $1 AND process_code > $2))',
    );
    expect(query.mock.calls[1][1]).toEqual([
      buildRow().closing_at!.toISOString(),
      'CA-1',
      11,
    ]);
  });

  it('builds desc keyset predicates for amount sorts', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([buildRow({ amount: '1000' })]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);
    const cursor = encodeCursor(buildRow({ amount: '1000' }), 'amount_desc');

    await service.listOpportunities({}, cursor, 10, 'amount_desc');

    expect(query.mock.calls[1][0]).toContain(
      'ORDER BY mp.gold_detected_process.amount DESC NULLS LAST, mp.gold_detected_process.process_code ASC',
    );
    expect(query.mock.calls[1][0]).toContain(
      '(amount < $1::numeric OR amount IS NULL OR (amount = $1::numeric AND process_code > $2))',
    );
    expect(query.mock.calls[1][1]).toEqual(['1000', 'CA-1', 11]);
  });

  it('rejects cursors whose sort does not match the requested sort', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);
    const cursor = encodeCursor(buildRow(), 'closing_at_asc');

    await expect(
      service.listOpportunities({}, cursor, 10, 'closing_at_desc'),
    ).rejects.toThrow('cursor is invalid');
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects malformed cursors before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);

    await expect(service.listOpportunities({}, 'invalid')).rejects.toThrow(
      'cursor is invalid',
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects invalid cursor values before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);
    const timestampCursor = Buffer.from(
      JSON.stringify({
        sort: 'closing_at_desc',
        value: 'not-a-date',
        codigo: 'CA-1',
      }),
    ).toString('base64url');
    const amountCursor = Buffer.from(
      JSON.stringify({ sort: 'amount_desc', value: 'abc', codigo: 'CA-1' }),
    ).toString('base64url');

    await expect(
      service.listOpportunities({}, timestampCursor),
    ).rejects.toThrow('cursor is invalid');
    await expect(
      service.listOpportunities({}, amountCursor, 10, 'amount_desc'),
    ).rejects.toThrow('cursor is invalid');
    expect(query).not.toHaveBeenCalled();
  });

  it('calculates full-population analytics with the shared filter contract', async () => {
    const query = jest.fn().mockResolvedValueOnce([
      {
        population: '2',
        calculated_at: new Date('2026-08-08T12:00:00.000Z'),
        as_of: new Date('2026-08-08T11:00:00.000Z'),
        freshness: 'healthy',
        completeness: 'partial',
        availability: 'available',
        known_closing_at: '2',
        known_state: '2',
        known_region: '1',
        known_buyer: '2',
        known_amount: '1',
        known_currency: '1',
        known_document_count: '2',
        known_llamado: '1',
        state_buckets: [{ key: 'publicada', count: 2 }],
        region_buckets: [
          { key: '13', count: 1 },
          { key: null, count: 1 },
        ],
        currency_buckets: [
          { key: 'CLP', count: 1 },
          { key: null, count: 1 },
        ],
        closing_date_buckets: [{ key: '2026-08-08', count: 2 }],
        document_buckets: [
          { key: 'positive', count: 1 },
          { key: 'zero', count: 1 },
        ],
        llamado_buckets: [
          { key: '1', count: 1 },
          { key: null, count: 1 },
        ],
      },
    ]);
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);

    const analytics = await service.getAnalytics({
      region: 13,
      states: ['publicada'],
    });

    expect(analytics.population).toBe(2);
    expect(analytics.coverage).toEqual({
      closingAt: 2,
      state: 2,
      region: 1,
      buyer: 2,
      amount: 1,
      currency: 1,
      documentCount: 2,
      llamado: 1,
    });
    expect(analytics.stateBuckets).toEqual([{ key: 'publicada', count: 2 }]);
    expect(query.mock.calls[0][0]).toContain('WITH filtered AS');
    expect(query.mock.calls[0][0]).toContain('FROM mp.v2_cohort');
    expect(query.mock.calls[0][0]).not.toContain(
      'ORDER BY mp.gold_detected_process',
    );
    expect(query.mock.calls[0][0]).not.toContain('LIMIT');
    expect(query.mock.calls[0][1]).toEqual([['publicada'], 13]);
  });
});
