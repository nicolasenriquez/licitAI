import { type DataSource } from 'typeorm';

import { MercadoPublicoProcessDetailReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service';

type AnyRow = Record<string, unknown>;

class InMemoryTableStore {
  private readonly tables = new Map<string, AnyRow[]>();

  register(tableName: string, rows: AnyRow[]): void {
    this.tables.set(tableName, rows);
  }

  query<T = AnyRow>(sql: string, params: unknown[]): T[] {
    const tableName = this.extractTableName(sql);

    if (tableName === null) {
      throw new Error(`Cannot parse table name from SQL: ${sql}`);
    }

    const rows = this.tables.get(tableName) ?? [];
    const filtered = this.filterByParams(rows, sql, params);

    if (sql.toLowerCase().startsWith('select count(*)')) {
      return [{ count: String(filtered.length) } as unknown as T];
    }

    if (sql.toLowerCase().includes('group by')) {
      return this.aggregateGroupBy(sql, filtered, tableName) as unknown as T[];
    }

    return filtered as unknown as T[];
  }

  private extractTableName(sql: string): string | null {
    const fromMatch = sql.match(/FROM\s+([a-z._]+)/i);

    if (!fromMatch) {
      return null;
    }

    return fromMatch[1].replace(/^mp\./, '');
  }

  private filterByParams(
    rows: AnyRow[],
    sql: string,
    params: unknown[],
  ): AnyRow[] {
    const wherePart = sql.match(/WHERE\s+(.+?)(?:GROUP BY|ORDER BY|$)/is);

    if (!wherePart || params.length === 0) {
      return rows;
    }

    const whereClause = wherePart[1].trim();
    const conditions = whereClause
      .split(/\s+AND\s+/)
      .map((c) => c.trim());

    return rows.filter((row) =>
      conditions.every((condition) =>
        this.matchesCondition(row, condition, params),
      ),
    );
  }

  private matchesCondition(
    row: AnyRow,
    condition: string,
    params: unknown[],
  ): boolean {
    const eqMatch = condition
      .trim()
      .match(/^(?:[a-z_]+\.)?([a-z_]+)\s*=\s*\$(\d+)$/i);

    if (eqMatch) {
      const column = this.normalizeColumn(eqMatch[1]);
      const paramIndex = Number(eqMatch[2]) - 1;
      return row[column] === params[paramIndex];
    }

    const orEqMatch = condition.match(/^\((.+)\s+OR\s+(.+)\)$/);

    if (orEqMatch) {
      return (
        this.matchesCondition(row, orEqMatch[1], params) ||
        this.matchesCondition(row, orEqMatch[2], params)
      );
    }

    return true;
  }

  private normalizeColumn(column: string): string {
    switch (column) {
      case 'codigo_externo':
        return 'codigo_externo';
      case 'codigo':
        return 'codigo';
      case 'entity_a_type':
        return 'entity_a_type';
      case 'entity_a_key':
        return 'entity_a_key';
      case 'entity_b_type':
        return 'entity_b_type';
      case 'entity_b_key':
        return 'entity_b_key';
      default:
        return column;
    }
  }

  private aggregateGroupBy(
    sql: string,
    rows: AnyRow[],
    tableName: string,
  ): AnyRow[] {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    if (normalizedSql.includes('GROUP BY match_type')) {
      return this.groupByMatchType(rows);
    }

    if (normalizedSql.includes('GROUP BY s.source')) {
      const sourceCol = tableName.startsWith('stg_csv_') ? 'source_dataset' : 'source';

      return this.groupByColumn(rows, sourceCol, 'last_seen_at', 'fetched_at', 'created_at');
    }

    if (normalizedSql.includes('GROUP BY s.source_dataset')) {
      return this.groupByColumn(rows, 'source_dataset', null, 'fetched_at', 'created_at');
    }

    return rows;
  }

  private groupByMatchType(rows: AnyRow[]): AnyRow[] {
    const byType = new Map<string, number>();

    for (const row of rows) {
      const type = String(row.match_type);
      byType.set(type, (byType.get(type) ?? 0) + 1);
    }

    return Array.from(byType.entries()).map(([match_type, count]) => ({
      match_type,
      count: String(count),
    }));
  }

  private groupByColumn(
    rows: AnyRow[],
    groupCol: string,
    timestampCol: string | null,
    fallbackTimestampCol: string,
    fallbackTimestampCol2: string,
  ): AnyRow[] {
    const bySource = new Map<string, { row_count: number; timestamps: number[] }>();

    for (const row of rows) {
      const key = String(row[groupCol] ?? 'unknown');
      const entry = bySource.get(key) ?? { row_count: 0, timestamps: [] };
      entry.row_count += 1;

      const ts =
        (row[timestampCol ?? fallbackTimestampCol] as Date) ??
        (row[fallbackTimestampCol] as Date) ??
        (row[fallbackTimestampCol2] as Date);

      if (ts instanceof Date && !isNaN(ts.getTime())) {
        entry.timestamps.push(ts.getTime());
      }

      bySource.set(key, entry);
    }

    return Array.from(bySource.entries()).map(
      ([source, { row_count, timestamps }]) => {
        const maxTs =
          timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

        return {
          source,
          row_count: String(row_count),
          last_seen_at: maxTs,
        };
      },
    );
  }
}

describe('MercadoPublicoProcessDetailReadService (integration-shaped)', () => {
  const store = new InMemoryTableStore();

  const buildDataSource = () => ({
    query: jest.fn(async (sql: string, params: unknown[]) =>
      store.query(sql, params),
    ),
  } as unknown as jest.Mocked<DataSource>);

  beforeEach(() => {
    store.register('gold_detected_process', []);
    store.register('licitacion_item', []);
    store.register('licitacion_adjudicacion', []);
    store.register('orden_compra_item', []);
    store.register('compra_agil_producto_solicitado', []);
    store.register('reconciliation_public_market_entities', []);
    store.register('stg_api_v1_licitacion', []);
    store.register('stg_csv_licitacion', []);
    store.register('stg_api_v1_orden_compra', []);
    store.register('stg_csv_orden_compra', []);
    store.register('stg_api_v2_compra_agil', []);
    store.register('raw_api_payload', []);
  });

  it('returns null when gold row does not exist', async () => {
    const dataSource = buildDataSource();
    const service = new MercadoPublicoProcessDetailReadService(dataSource);

    const result = await service.getDetectedProcessDetail(
      'licitacion',
      'UNKNOWN',
    );

    expect(result).toBeNull();
  });

  it('returns complete licitacion detail across all tables', async () => {
    store.register('gold_detected_process', [
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
        last_seen_at: new Date('2026-06-15T12:00:00.000Z'),
      },
    ]);
    store.register('licitacion_item', [
      {
        codigo_externo: 'L1',
        codigoitem: '1001',
        nombre_producto_generico: 'Producto A',
        cantidad: '10',
        monto_estimado: 5000000,
      },
      {
        codigo_externo: 'L1',
        codigoitem: '1002',
        nombre_producto_generico: 'Producto B',
        cantidad: '5',
        monto_estimado: 3000000,
      },
    ]);
    store.register('licitacion_adjudicacion', [
      {
        codigo_externo: 'L1',
        rut_proveedor: '76.123.456-7',
        cantidad_adjudicada: '5',
        monto_adjudicado: 2500000,
      },
    ]);
    store.register('reconciliation_public_market_entities', [
      {
        entity_a_type: 'licitacion',
        entity_a_key: 'L1',
        entity_b_type: 'orden_compra',
        entity_b_key: 'OC1',
        match_type: 'exact_codigo_licitacion',
        match_confidence: 'high',
        matched_at: new Date('2026-06-20T00:00:00.000Z'),
      },
    ]);
    store.register('gold_detected_process', [
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
        last_seen_at: new Date('2026-06-15T12:00:00.000Z'),
      },
    ]);
    store.register('stg_api_v1_licitacion', [
      {
        codigo_externo: 'L1',
        source: 'api-v1-licitaciones',
        fetched_at: new Date('2026-06-15T12:00:00.000Z'),
      },
      {
        codigo_externo: 'L1',
        source: 'api-v1-licitaciones',
        fetched_at: new Date('2026-06-14T12:00:00.000Z'),
      },
    ]);
    store.register('stg_csv_licitacion', [
      {
        codigo_externo: 'L1',
        source_dataset: 'csv-datos-abiertos',
        created_at: new Date('2026-05-20T00:00:00.000Z'),
      },
    ]);

    const dataSource = buildDataSource();
    const service = new MercadoPublicoProcessDetailReadService(dataSource);

    const result = await service.getDetectedProcessDetail('licitacion', 'L1');

    expect(result).not.toBeNull();
    expect(result!.processType).toBe('licitacion');
    expect(result!.processCode).toBe('L1');
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0]).toMatchObject({ code: '1001', name: 'Producto A' });
    expect(result!.items[1]).toMatchObject({ code: '1002', name: 'Producto B' });
    expect(result!.adjudications).toHaveLength(1);
    expect(result!.adjudications![0]).toMatchObject({
      supplierCode: '76.123.456-7',
      amount: 2500000,
    });
    expect(result!.relatedOcs).toHaveLength(1);
    expect(result!.relatedOcs[0]).toMatchObject({
      code: 'OC1',
      matchType: 'exact_codigo_licitacion',
    });
    expect(result!.sourceLineage.length).toBeGreaterThanOrEqual(1);
    expect(result!.reconciliationSummary.exact).toBeGreaterThanOrEqual(1);
  });

  it('returns orden_compra detail with items and source lineage from OC staging tables', async () => {
    store.register('gold_detected_process', [
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
        last_seen_at: new Date('2026-06-15T08:00:00.000Z'),
      },
    ]);
    store.register('orden_compra_item', [
      {
        codigo: 'OC1',
        iditem: 'ID1',
        nombre_producto_generico: 'Producto OC',
        total_linea_neto: 1000000,
      },
    ]);
    store.register('stg_api_v1_orden_compra', [
      {
        codigo: 'OC1',
        source: 'api-v1-oc',
        fetched_at: new Date('2026-06-15T08:00:00.000Z'),
      },
    ]);
    store.register('stg_csv_orden_compra', [
      {
        codigo: 'OC1',
        source_dataset: 'csv-datos-abiertos',
        created_at: new Date('2026-05-20T00:00:00.000Z'),
      },
    ]);

    const dataSource = buildDataSource();
    const service = new MercadoPublicoProcessDetailReadService(dataSource);

    const result = await service.getDetectedProcessDetail(
      'orden_compra',
      'OC1',
    );

    expect(result).not.toBeNull();
    expect(result!.processType).toBe('orden_compra');
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      code: 'ID1',
      name: 'Producto OC',
    });
    expect(result!.adjudications).toBeNull();
    expect(result!.sourceLineage.length).toBeGreaterThanOrEqual(0);
  });

  it('returns compra_agil detail with one source lineage entry', async () => {
    store.register('gold_detected_process', [
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
        last_seen_at: new Date('2026-06-22T12:00:00.000Z'),
      },
    ]);
    store.register('compra_agil_producto_solicitado', [
      {
        codigo: 'CA1',
        codigo_producto: 'CP1',
        ordinal: 1,
        nombre_producto: 'Producto CA',
        cantidad_solicitada: '20',
      },
    ]);
    store.register('stg_api_v2_compra_agil', [
      {
        codigo: 'CA1',
        source: 'api-v2-compra-agil',
        fetched_at: new Date('2026-06-22T12:00:00.000Z'),
      },
    ]);
    store.register('raw_api_payload', [
      {
        id: 'raw-ca1',
        source: 'api-v2-compra-agil',
        codigo: 'CA1',
        fetched_at: new Date('2026-06-22T12:00:00.000Z'),
        raw_payload: {
          payload: {
            items: [
              {
                codigo: 'CA1',
                estado: { codigo: 'publicada', glosa: 'Publicada' },
                institucion: {
                  rut: '60.000.000-0',
                  organismo_comprador: 'Municipalidad Uno',
                },
                documentos: [{ id: 'DOC-1', nombre: 'Bases.pdf' }],
              },
            ],
          },
        },
      },
    ]);

    const dataSource = buildDataSource();
    const service = new MercadoPublicoProcessDetailReadService(dataSource);

    const result = await service.getDetectedProcessDetail(
      'compra_agil',
      'CA1',
    );

    expect(result).not.toBeNull();
    expect(result!.processType).toBe('compra_agil');
    expect(result!.items).toHaveLength(1);
    expect(result!.adjudications).toBeNull();
    expect(result!.sourceLineage.length).toBeGreaterThanOrEqual(0);
    expect(result!.compraAgilSource).toMatchObject({
      state: { code: 'publicada', label: 'Publicada' },
      documents: [{ id: 'DOC-1', name: 'Bases.pdf' }],
    });
  });
});
