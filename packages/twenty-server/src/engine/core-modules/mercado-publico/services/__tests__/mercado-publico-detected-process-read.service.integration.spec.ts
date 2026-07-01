import { type DataSource } from 'typeorm';

import { MercadoPublicoDetectedProcessReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-detected-process-read.service';

type GoldRow = {
  process_type: string;
  process_code: string;
  title: string | null;
  canonical_state: string | null;
  raw_state_code: string | null;
  raw_state_label: string | null;
  buyer_code: string | null;
  buyer_name: string | null;
  published_at: Date | null;
  closing_at: Date | null;
  source_priority: string | null;
  reconciliation_status: string | null;
  last_seen_at: Date;
};

const COMPARATOR_BY_COLUMN: Record<
  string,
  (row: GoldRow, value: unknown) => boolean
> = {
  process_type: (row, value) =>
    Array.isArray(value) && value.includes(row.process_type),
  canonical_state: (row, value) =>
    Array.isArray(value) && value.includes(row.canonical_state),
  buyer_code: (row, value) => row.buyer_code === value,
  published_at: (row, value) => compareDate(row.published_at, value, '>='),
  closing_at: (row, value) => compareDate(row.closing_at, value, '>='),
  last_seen_at: (row, value) => compareDate(row.last_seen_at, value, '>='),
};

const COMPARATOR_BY_COLUMN_LTE: Record<
  string,
  (row: GoldRow, value: unknown) => boolean
> = {
  published_at: (row, value) => compareDate(row.published_at, value, '<='),
  closing_at: (row, value) => compareDate(row.closing_at, value, '<='),
  last_seen_at: (row, value) => compareDate(row.last_seen_at, value, '<='),
};

function compareDate(
  rowValue: Date | null,
  filterValue: unknown,
  op: '>=' | '<=',
): boolean {
  if (rowValue === null || rowValue === undefined) {
    return false;
  }
  if (!(filterValue instanceof Date)) {
    return false;
  }
  const rowTime = rowValue.getTime();
  const filterTime = filterValue.getTime();
  return op === '>=' ? rowTime >= filterTime : rowTime <= filterTime;
}

class InMemoryGoldTable {
  private readonly rows: GoldRow[];

  constructor(rows: GoldRow[]) {
    this.rows = rows;
  }

  query<T = GoldRow | { total: string }>(sql: string, params: unknown[]): T[] {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    if (normalizedSql.startsWith('SELECT count(*)::bigint AS total')) {
      const filtered = this.applyFilters(normalizedSql, params);
      return [{ total: String(filtered.length) } as unknown as T];
    }

    if (normalizedSql.startsWith('SELECT')) {
      return this.runListQuery<T>(normalizedSql, params);
    }

    throw new Error(`Unsupported SQL: ${normalizedSql}`);
  }

  private runListQuery<T>(sql: string, params: unknown[]): T[] {
    const filtered = this.applyFilters(sql, params);

    const orderByMatch = sql.match(/ORDER BY ([a-z_]+) (ASC|DESC)/i);
    const direction = orderByMatch?.[2]?.toUpperCase() === 'ASC' ? 1 : -1;
    const sortColumn = orderByMatch?.[1] as keyof GoldRow | undefined;

    const sorted = [...filtered].sort((a, b) => {
      if (sortColumn === undefined) {
        return 0;
      }
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === null && bValue === null) {
        return 0;
      }
      if (aValue === null) {
        return 1;
      }
      if (bValue === null) {
        return -1;
      }
      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * direction;
      }
      return String(aValue).localeCompare(String(bValue)) * direction;
    });

    sorted.sort((a, b) => {
      if (a.process_type === b.process_type) {
        return a.process_code.localeCompare(b.process_code);
      }
      return 0;
    });

    const limitMatch = sql.match(/LIMIT \$(\d+) OFFSET \$(\d+)/);
    const limit = limitMatch ? Number(params[Number(limitMatch[1]) - 1]) : 200;
    const offset = limitMatch ? Number(params[Number(limitMatch[2]) - 1]) : 0;

    return sorted.slice(offset, offset + limit) as unknown as T[];
  }

  private applyFilters(sql: string, params: unknown[]): GoldRow[] {
    const whereMatch = sql.match(/WHERE (.+?)(?:ORDER BY|$)/);

    if (whereMatch === null) {
      return [...this.rows];
    }

    const whereClause = whereMatch[1].trim();
    const predicates = whereClause.split(' AND ');

    return this.rows.filter((row) =>
      predicates.every((predicate) =>
        this.applyPredicate(row, predicate, params),
      ),
    );
  }

  private applyPredicate(
    row: GoldRow,
    predicate: string,
    params: unknown[],
  ): boolean {
    const anyMatch = predicate.match(/^([a-z_]+) = ANY\(\$(\d+)::text\[\]\)$/);

    if (anyMatch !== null) {
      const [, column, indexString] = anyMatch;
      const value = params[Number(indexString) - 1];
      const comparator = COMPARATOR_BY_COLUMN[column];

      return comparator?.(row, value) ?? false;
    }

    const gteMatch = predicate.match(/^([a-z_]+) >= \$(\d+)$/);

    if (gteMatch !== null) {
      const [, column, indexString] = gteMatch;
      const value = params[Number(indexString) - 1];
      const comparator = COMPARATOR_BY_COLUMN[column];

      return comparator?.(row, value) ?? false;
    }

    const lteMatch = predicate.match(/^([a-z_]+) <= \$(\d+)$/);

    if (lteMatch !== null) {
      const [, column, indexString] = lteMatch;
      const value = params[Number(indexString) - 1];
      const comparator = COMPARATOR_BY_COLUMN_LTE[column];

      return comparator?.(row, value) ?? false;
    }

    const eqMatch = predicate.match(/^([a-z_]+) = \$(\d+)$/);

    if (eqMatch !== null) {
      const [, column, indexString] = eqMatch;
      const value = params[Number(indexString) - 1];
      const comparator = COMPARATOR_BY_COLUMN[column];

      return comparator?.(row, value) ?? false;
    }

    return false;
  }
}

const buildDataSource = (rows: GoldRow[]) => {
  const table = new InMemoryGoldTable(rows);

  return {
    query: jest.fn(async (sql: string, params: unknown[]) =>
      table.query(sql, params),
    ),
  } as unknown as jest.Mocked<DataSource>;
};

describe('MercadoPublicoDetectedProcessReadService (integration-shaped)', () => {
  const seedRows: GoldRow[] = [
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
    {
      process_type: 'licitacion',
      process_code: 'L2',
      title: 'Licitacion Dos',
      canonical_state: 'cerrada',
      raw_state_code: '6',
      raw_state_label: 'Cerrada',
      buyer_code: 'BUY-1',
      buyer_name: 'Municipalidad Uno',
      published_at: new Date('2026-05-01T00:00:00.000Z'),
      closing_at: new Date('2026-05-20T00:00:00.000Z'),
      source_priority: 'csv',
      reconciliation_status: 'unmatched',
      last_seen_at: new Date('2026-05-21T00:00:00.000Z'),
    },
    {
      process_type: 'orden_compra',
      process_code: 'OC1',
      title: 'Orden Uno',
      canonical_state: 'aceptada',
      raw_state_code: '7',
      raw_state_label: 'Aceptada',
      buyer_code: 'BUY-2',
      buyer_name: 'Servicio Dos',
      published_at: new Date('2026-06-05T00:00:00.000Z'),
      closing_at: new Date('2026-06-25T00:00:00.000Z'),
      source_priority: 'api',
      reconciliation_status: 'candidate',
      last_seen_at: new Date('2026-06-15T08:00:00.000Z'),
    },
    {
      process_type: 'compra_agil',
      process_code: 'CA1',
      title: 'Compra Agil Uno',
      canonical_state: 'publicada',
      raw_state_code: null,
      raw_state_label: null,
      buyer_code: 'BUY-1',
      buyer_name: 'Municipalidad Uno',
      published_at: new Date('2026-06-20T00:00:00.000Z'),
      closing_at: new Date('2026-07-01T00:00:00.000Z'),
      source_priority: 'api',
      reconciliation_status: 'manual_review_required',
      last_seen_at: new Date('2026-06-22T12:00:00.000Z'),
    },
  ];

  it('filters by processTypes, states, buyerCode, and date ranges', async () => {
    const dataSource = buildDataSource(seedRows);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const result = await service.listDetectedProcesses({
      processTypes: ['licitacion', 'orden_compra'],
      states: ['publicada', 'aceptada'],
      buyerCode: 'BUY-1',
      publishedFrom: new Date('2026-06-01T00:00:00.000Z'),
      publishedTo: new Date('2026-06-30T00:00:00.000Z'),
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      processType: 'licitacion',
      processCode: 'L1',
      canonicalState: 'publicada',
      buyerCode: 'BUY-1',
      sourcePriority: 'api',
      reconciliationStatus: 'exact',
    });
  });

  it('orders by lastSeenAt desc by default and breaks ties by processCode', async () => {
    const dataSource = buildDataSource(seedRows);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const result = await service.listDetectedProcesses({});

    expect(result.total).toBe(4);
    expect(result.items.map((item) => item.processCode)).toEqual([
      'CA1',
      'L1',
      'OC1',
      'L2',
    ]);
  });

  it('respects explicit sort key and direction', async () => {
    const dataSource = buildDataSource(seedRows);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const result = await service.listDetectedProcesses({
      sort: { key: 'publishedAt', direction: 'asc' },
    });

    expect(result.items.map((item) => item.processCode)).toEqual([
      'L2',
      'OC1',
      'L1',
      'CA1',
    ]);
  });

  it('respects limit and offset for pagination', async () => {
    const dataSource = buildDataSource(seedRows);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const firstPage = await service.listDetectedProcesses({
      limit: 2,
      page: 1,
    });
    const secondPage = await service.listDetectedProcesses({
      limit: 2,
      page: 2,
    });

    expect(firstPage.total).toBe(4);
    expect(firstPage.items.map((item) => item.processCode)).toEqual([
      'CA1',
      'L1',
    ]);
    expect(secondPage.items.map((item) => item.processCode)).toEqual([
      'OC1',
      'L2',
    ]);
  });

  it('filters by changedSince on last_seen_at', async () => {
    const dataSource = buildDataSource(seedRows);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const result = await service.listDetectedProcesses({
      changedSince: new Date('2026-06-15T09:00:00.000Z'),
    });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.processCode)).toEqual(['CA1', 'L1']);
  });

  it('exposes sourcePriority and reconciliationStatus as stored', async () => {
    const dataSource = buildDataSource(seedRows);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const result = await service.listDetectedProcesses({
      processTypes: ['orden_compra'],
    });

    expect(result.items[0]).toMatchObject({
      processType: 'orden_compra',
      processCode: 'OC1',
      sourcePriority: 'api',
      reconciliationStatus: 'candidate',
    });
  });

  it('returns an empty page when the table is empty', async () => {
    const dataSource = buildDataSource([]);
    const service = new MercadoPublicoDetectedProcessReadService(dataSource);

    const result = await service.listDetectedProcesses({});

    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 50 });
  });
});
