import { type DataSource } from 'typeorm';

import { MercadoPublicoDetectedProcessReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-detected-process-read.service';
import { type MercadoPublicoListDetectedProcessesFilters } from 'src/engine/core-modules/mercado-publico/types/detected-process-read.types';

type CompraAgilBusinessFilters = {
  search: string;
  regionName: string;
  closingFrom: Date;
  closingTo: Date;
  hasDocuments: boolean;
  callStages: string[];
  amountMin: number;
  amountMax: number;
  buyerRut: string;
};

type MercadoPublicoCompraAgilAnalyticsReader = {
  getCompraAgilAnalytics: (
    filters: CompraAgilBusinessFilters,
  ) => Promise<unknown>;
};

const COMPRA_AGIL_BUSINESS_FILTERS: CompraAgilBusinessFilters = {
  search: 'mantención',
  regionName: 'Metropolitana',
  closingFrom: new Date('2026-06-01T00:00:00.000Z'),
  closingTo: new Date('2026-06-30T23:59:59.000Z'),
  hasDocuments: true,
  callStages: ['first_call'],
  amountMin: 100_000,
  amountMax: 1_000_000,
  buyerRut: '60.000.000-0',
};

describe('MercadoPublicoDetectedProcessReadService', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoDetectedProcessReadService(
    mockCoreDataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty result when gold table is empty', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    const result = await service.listDetectedProcesses({});

    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 50 });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toBe(
      'SELECT count(*)::bigint AS total FROM mp.gold_detected_process',
    );
    expect(countParams).toEqual([]);
  });

  it('applies all supported filters and orders by default last_seen_at desc', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '1' }]).mockResolvedValueOnce([
      {
        process_type: 'licitacion',
        process_code: 'L1',
        title: 'Licitacion Uno',
        canonical_state: 'publicada',
        raw_state_code: '5',
        raw_state_label: 'Publicada',
        buyer_code: 'BUY-1',
        buyer_name: 'Municipalidad Uno',
        published_at: new Date('2026-06-10T00:00:00.000Z'),
        closing_at: new Date('2026-06-30T00:00:00.000Z'),
        source_priority: 'api',
        reconciliation_status: 'exact',
        last_seen_at: new Date('2026-06-15T12:00:00.000Z'),
      },
    ]);

    const result = await service.listDetectedProcesses({
      processTypes: ['licitacion', 'orden_compra'],
      states: ['publicada', 'cerrada'],
      buyerCode: 'BUY-1',
      publishedFrom: new Date('2026-06-01T00:00:00.000Z'),
      publishedTo: new Date('2026-06-30T23:59:59.000Z'),
      changedSince: new Date('2026-06-15T00:00:00.000Z'),
      page: 2,
      limit: 25,
    });

    expect(result).toEqual({
      total: 1,
      page: 2,
      limit: 25,
      items: [
        {
          processType: 'licitacion',
          processCode: 'L1',
          title: 'Licitacion Uno',
          canonicalState: 'publicada',
          rawStateCode: '5',
          rawStateLabel: 'Publicada',
          buyerCode: 'BUY-1',
          buyerName: 'Municipalidad Uno',
          buyerRut: null,
          purchaseUnitName: null,
          regionName: null,
          amountAvailableClp: null,
          callStage: null,
          documentCount: null,
          offersReceivedCount: null,
          publishedAt: new Date('2026-06-10T00:00:00.000Z'),
          closingAt: new Date('2026-06-30T00:00:00.000Z'),
          sourcePriority: 'api',
          reconciliationStatus: 'exact',
          lastSeenAt: new Date('2026-06-15T12:00:00.000Z'),
        },
      ],
    });

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toBe(
      [
        'SELECT count(*)::bigint AS total FROM mp.gold_detected_process',
        'WHERE process_type = ANY($1::text[])',
        'AND canonical_state = ANY($2::text[])',
        'AND buyer_code = $3',
        'AND published_at >= $4',
        'AND published_at <= $5',
        'AND last_seen_at >= $6',
      ].join(' '),
    );
    expect(countParams).toEqual([
      ['licitacion', 'orden_compra'],
      ['publicada', 'cerrada'],
      'BUY-1',
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-30T23:59:59.000Z'),
      new Date('2026-06-15T00:00:00.000Z'),
    ]);

    const [listSql, listParams] = mockQuery.mock.calls[1];
    expect(listSql).toContain('FROM mp.gold_detected_process');
    expect(listSql).toContain('ORDER BY last_seen_at DESC');
    expect(listSql).toContain('process_type ASC, process_code ASC');
    expect(listSql).toContain('LIMIT $7 OFFSET $8');
    expect(listParams).toEqual([
      ['licitacion', 'orden_compra'],
      ['publicada', 'cerrada'],
      'BUY-1',
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-30T23:59:59.000Z'),
      new Date('2026-06-15T00:00:00.000Z'),
      25,
      25,
    ]);
  });

  it('applies Compra Agil business filters before pagination', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '1' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({
      processTypes: ['compra_agil'],
      ...COMPRA_AGIL_BUSINESS_FILTERS,
    } as unknown as MercadoPublicoListDetectedProcessesFilters);

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toContain('process_code');
    expect(countSql).toContain('title');
    expect(countSql).toContain('buyer_name');
    expect(countSql).toContain('purchase_unit_name');
    expect(countSql).toContain('region_name');
    expect(countSql).toContain('closing_at');
    expect(countSql).toContain('document_count');
    expect(countSql).toContain('call_stage');
    expect(countSql).toContain('amount_available_clp');
    expect(countSql).toContain('buyer_rut');
    expect(countParams).toEqual(
      expect.arrayContaining([
        ['compra_agil'],
        'Metropolitana',
        COMPRA_AGIL_BUSINESS_FILTERS.closingFrom,
        COMPRA_AGIL_BUSINESS_FILTERS.closingTo,
        ['first_call'],
        100_000,
        1_000_000,
        '60.000.000-0',
      ]),
    );
  });

  it('whitelists amount sorting for Compra Agil list reads', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({
      processTypes: ['compra_agil'],
      ...COMPRA_AGIL_BUSINESS_FILTERS,
      page: 2,
      limit: 10,
      sort: { key: 'amountAvailableClp', direction: 'desc' },
    } as unknown as MercadoPublicoListDetectedProcessesFilters);

    const [listSql, listParams] = mockQuery.mock.calls[1];
    expect(listSql).toContain('ORDER BY amount_available_clp DESC');
    expect(listParams).toEqual(expect.arrayContaining([10, 10]));
  });

  it('keeps analytics population independent from list pagination and order', async () => {
    mockQuery.mockResolvedValue([]);

    const analyticsReader =
      service as unknown as MercadoPublicoCompraAgilAnalyticsReader;
    const listFilters = {
      processTypes: ['compra_agil'],
      ...COMPRA_AGIL_BUSINESS_FILTERS,
    };

    await service.listDetectedProcesses({
      ...listFilters,
      page: 1,
      limit: 10,
      sort: { key: 'processCode', direction: 'asc' },
    } as unknown as MercadoPublicoListDetectedProcessesFilters);
    const firstAnalyticsResult = await analyticsReader.getCompraAgilAnalytics(
      COMPRA_AGIL_BUSINESS_FILTERS,
    );

    await service.listDetectedProcesses({
      ...listFilters,
      page: 3,
      limit: 200,
      sort: { key: 'lastSeenAt', direction: 'desc' },
    } as unknown as MercadoPublicoListDetectedProcessesFilters);
    const secondAnalyticsResult = await analyticsReader.getCompraAgilAnalytics(
      COMPRA_AGIL_BUSINESS_FILTERS,
    );

    const firstAnalyticsCall = mockQuery.mock.calls[2];
    const secondAnalyticsCall = mockQuery.mock.calls[5];
    const firstAnalyticsSql = firstAnalyticsCall[0] as string;
    const firstAnalyticsParams = firstAnalyticsCall[1] as unknown[];

    expect(firstAnalyticsParams).toEqual(
      expect.arrayContaining([
        'Metropolitana',
        COMPRA_AGIL_BUSINESS_FILTERS.closingFrom,
        COMPRA_AGIL_BUSINESS_FILTERS.closingTo,
        ['first_call'],
        100_000,
        1_000_000,
        '60.000.000-0',
      ]),
    );
    expect(secondAnalyticsCall[1]).toEqual(firstAnalyticsParams);
    expect(secondAnalyticsResult).toEqual(firstAnalyticsResult);
    expect(firstAnalyticsSql).not.toMatch(/LIMIT \$\d+/);
    expect(firstAnalyticsSql).not.toMatch(/OFFSET \$\d+/);
  });

  it('drops unknown processTypes values silently', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({
      processTypes: ['licitacion', 'unknown_type' as never],
    });

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toContain('process_type = ANY($1::text[])');
    expect(countParams).toEqual([['licitacion']]);
  });

  it('clamps limit to the maximum allowed value', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({ limit: 9999 });

    const [, listParams] = mockQuery.mock.calls[1];
    expect(listParams).toEqual([200, 0]);
  });

  it('falls back to default page and limit on invalid input', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({
      page: -3 as unknown as number,
      limit: Number.NaN,
    });

    const [, listParams] = mockQuery.mock.calls[1];
    expect(listParams).toEqual([50, 0]);
  });

  it('uses a whitelisted sort key when provided', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({
      sort: { key: 'publishedAt', direction: 'asc' },
    });

    const [listSql, listParams] = mockQuery.mock.calls[1];
    expect(listSql).toContain('ORDER BY published_at ASC');
    expect(listParams).toEqual([50, 0]);
  });

  it('rejects unknown sort keys', async () => {
    await expect(
      service.listDetectedProcesses({
        sort: { key: 'unknown' as never, direction: 'asc' },
      }),
    ).rejects.toThrow(
      'Unknown Mercado Publico detected process sort key: unknown',
    );

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('skips empty arrays and blank buyerCode', async () => {
    mockQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);

    await service.listDetectedProcesses({
      processTypes: [],
      states: [],
      buyerCode: '   ',
    });

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toBe(
      'SELECT count(*)::bigint AS total FROM mp.gold_detected_process',
    );
    expect(countParams).toEqual([]);
  });
});
