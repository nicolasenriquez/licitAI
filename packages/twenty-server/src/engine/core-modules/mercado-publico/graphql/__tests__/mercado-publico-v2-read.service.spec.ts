import { type DataSource } from 'typeorm';

import {
  encodeMercadoPublicoV2OpportunityCursor,
  MercadoPublicoV2ReadService,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';

describe('MercadoPublicoV2ReadService', () => {
  it('returns a deterministic keyset page and advances by closing date plus codigo', async () => {
    const firstRow = {
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
      observation_id: 'observation-1',
      normalizer_version: 'v1',
      provider_schema_fingerprint: 'schema-1',
      availability: 'available',
    };
    const secondRow = { ...firstRow, codigo: 'CA-2' };
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
    expect(firstPage.endCursor).toBe(
      encodeMercadoPublicoV2OpportunityCursor(firstRow),
    );
    expect(query.mock.calls[0][0]).toContain('FROM mp.v2_cohort');
    expect(query.mock.calls[1][0]).toContain('FROM mp.v2_cohort');

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
      firstRow.closing_at.toISOString(),
      firstRow.codigo,
      2,
    ]);
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

  it('rejects invalid cursor timestamps before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2ReadService({
      query,
    } as unknown as DataSource);
    const cursor = Buffer.from(
      JSON.stringify({ closingAt: 'not-a-date', codigo: 'CA-1' }),
    ).toString('base64url');

    await expect(service.listOpportunities({}, cursor)).rejects.toThrow(
      'cursor is invalid',
    );
    expect(query).not.toHaveBeenCalled();
  });
});
