import { type DataSource } from 'typeorm';

import {
  encodeMercadoPublicoV2BuyerCursor,
  MercadoPublicoV2BuyersReadService,
  type MercadoPublicoV2BuyerRow,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-buyers-read.service';

const buyerRow = (
  overrides: Partial<MercadoPublicoV2BuyerRow> = {},
): MercadoPublicoV2BuyerRow => ({
  buyer_code: 'BUYER-001',
  buyer_name: 'Municipalidad de Ejemplo',
  population: '2',
  buyer_count: '1',
  opportunity_count: '1',
  amount_count: '1',
  as_of: new Date('2026-08-10T12:00:00Z'),
  ...overrides,
});

describe('MercadoPublicoV2BuyersReadService', () => {
  it('groups the filtered V2 population by buyer code and declares coverage', async () => {
    const query = jest.fn().mockResolvedValueOnce([buyerRow()]);
    const service = new MercadoPublicoV2BuyersReadService({
      query,
    } as unknown as DataSource);

    const result = await service.listBuyers(
      {
        states: ['publicada'],
        region: 13,
      },
      undefined,
      10,
    );

    expect(result.rows[0]).toMatchObject({
      buyerCode: 'BUYER-001',
      buyerName: 'Municipalidad de Ejemplo',
      opportunityCount: 1,
      buyerCoverage: 0.5,
      amountCoverage: 1,
      availability: 'partial',
      completeness: 'partial',
      asOf: new Date('2026-08-10T12:00:00Z'),
    });
    expect(result.rows[0]).not.toHaveProperty('monetaryTotal');
    expect(result.rows[0]).not.toHaveProperty('amountTotal');

    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain('FROM mp.gold_detected_process');
    expect(sql).toContain('FROM mp.v2_cohort');
    expect(sql).toContain('GROUP BY buyer_code');
    expect(sql).toContain('COUNT(buyer_code)');
    expect(sql).toContain('buyer_code IS NOT NULL');
    expect(sql).not.toMatch(/SUM\s*\(/i);
    expect(query.mock.calls[0][1]).toEqual([['publicada'], 13, 11]);
  });

  it('keeps rows without buyer code in population but excludes them from aggregates', async () => {
    const query = jest.fn().mockResolvedValueOnce([]);
    const service = new MercadoPublicoV2BuyersReadService({
      query,
    } as unknown as DataSource);

    const result = await service.listBuyers({ region: 13 });

    expect(result.rows).toEqual([]);
    expect(query.mock.calls[0][0]).toContain(
      '(SELECT COUNT(*)::text FROM filtered) AS population',
    );
    expect(query.mock.calls[0][0]).toContain('buyer_code IS NOT NULL');
  });

  it('reports partial coverage without turning missing values into zero facts', async () => {
    const query = jest.fn().mockResolvedValueOnce([
      buyerRow({
        population: '4',
        buyer_count: '2',
        opportunity_count: '2',
        amount_count: '0',
        as_of: null,
      }),
    ]);
    const service = new MercadoPublicoV2BuyersReadService({
      query,
    } as unknown as DataSource);

    const result = await service.listBuyers();

    expect(result.rows[0]).toMatchObject({
      buyerCoverage: 0.5,
      amountCoverage: 0,
      availability: 'unavailable',
      completeness: 'partial',
      asOf: null,
    });
  });

  it('uses buyer code keyset pagination', async () => {
    const firstRow = buyerRow();
    const query = jest.fn().mockResolvedValueOnce([firstRow]);
    const service = new MercadoPublicoV2BuyersReadService({
      query,
    } as unknown as DataSource);

    await service.listBuyers(
      {},
      encodeMercadoPublicoV2BuyerCursor(firstRow),
      10,
    );

    expect(query.mock.calls[0][0]).toContain('buyer_code > $1');
    expect(query.mock.calls[0][1]).toEqual(['BUYER-001', 11]);
  });

  it('rejects malformed buyer cursors before querying', async () => {
    const query = jest.fn();
    const service = new MercadoPublicoV2BuyersReadService({
      query,
    } as unknown as DataSource);

    await expect(service.listBuyers({}, 'not-json')).rejects.toThrow(
      'Mercado Publico V2 buyer cursor is invalid',
    );
    expect(query).not.toHaveBeenCalled();
  });
});
