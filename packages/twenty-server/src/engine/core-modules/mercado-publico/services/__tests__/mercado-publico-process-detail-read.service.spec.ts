import { type DataSource } from 'typeorm';

import { MercadoPublicoProcessDetailReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service';

const makeGoldRow = (
  overrides: Partial<{
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
    last_seen_at: Date;
  }> = {},
) => ({
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
  ...overrides,
});

const LIC_ITEM_ROW = {
  codigoitem: '1001',
  nombre_producto_generico: 'Producto A',
  cantidad: '10',
  monto_estimado: 5000000,
};
const LIC_ADJ_ROW = {
  rut_proveedor: '76.123.456-7',
  cantidad_adjudicada: '5',
  monto_adjudicado: 2500000,
};
const RELATED_OC_ROW = {
  entity_b_key: 'OC1',
  entity_a_key: 'L1',
  canonical_state: 'aceptada',
  match_type: 'exact_codigo_licitacion',
  match_confidence: 'high',
};
const SRC_LINEAGE_API_ROW = {
  source: 'api-v1-licitaciones',
  row_count: '3',
  last_seen_at: new Date('2026-06-15T12:00:00.000Z'),
};
const SRC_LINEAGE_CSV_ROW = {
  source: 'csv-datos-abiertos',
  row_count: '2',
  last_seen_at: new Date('2026-05-20T00:00:00.000Z'),
};
const RECON_COUNT_ROW = {
  match_type: 'exact_codigo_externo',
  count: '1',
};

describe('MercadoPublicoProcessDetailReadService (unit)', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoProcessDetailReadService(
    mockCoreDataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when gold row is not found', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const result = await service.getDetectedProcessDetail(
      'licitacion',
      'UNKNOWN',
    );

    expect(result).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('returns null for unknown processType', async () => {
    const result = await service.getDetectedProcessDetail('unknown_type', 'X');

    expect(result).toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns licitacion detail with items, adjudications, related OCs, source lineage, and reconciliation', async () => {
    mockQuery
      .mockResolvedValueOnce([makeGoldRow()])
      .mockResolvedValueOnce([LIC_ITEM_ROW])
      .mockResolvedValueOnce([LIC_ADJ_ROW])
      .mockResolvedValueOnce([RELATED_OC_ROW])
      .mockResolvedValueOnce([SRC_LINEAGE_API_ROW])
      .mockResolvedValueOnce([SRC_LINEAGE_CSV_ROW])
      .mockResolvedValueOnce([RECON_COUNT_ROW]);

    const result = await service.getDetectedProcessDetail('licitacion', 'L1');

    expect(result).not.toBeNull();
    expect(result!.processType).toBe('licitacion');
    expect(result!.processCode).toBe('L1');
    expect(result!.title).toBe('Licitacion Uno');
    expect(result!.canonicalState).toBe('publicada');
    expect(result!.rawState).toEqual({ code: '5', label: 'Publicada' });
    expect(result!.buyer).toEqual({ code: 'BUY-1', name: 'Municipalidad Uno' });
    expect(result!.dates.publishedAt).toEqual(
      new Date('2026-06-10T00:00:00.000Z'),
    );
    expect(result!.dates.closingAt).toEqual(
      new Date('2026-06-30T00:00:00.000Z'),
    );
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toEqual({
      code: '1001',
      name: 'Producto A',
      description: null,
      quantity: '10',
      unit: null,
      amount: 5000000,
    });
    expect(result!.adjudications).toHaveLength(1);
    expect(result!.adjudications![0]).toEqual({
      supplierCode: '76.123.456-7',
      quantity: '5',
      amount: 2500000,
    });
    expect(result!.relatedOcs).toHaveLength(1);
    expect(result!.relatedOcs[0]).toEqual({
      code: 'OC1',
      canonicalState: 'aceptada',
      matchType: 'exact_codigo_licitacion',
      matchConfidence: 'high',
    });
    expect(result!.sourceLineage).toHaveLength(2);
    expect(result!.sourceLineage[0]).toEqual({
      source: 'api-v1-licitaciones',
      rowCount: 3,
      lastSeenAt: new Date('2026-06-15T12:00:00.000Z'),
    });
    expect(result!.sourceLineage[1]).toEqual({
      source: 'csv-datos-abiertos',
      rowCount: 2,
      lastSeenAt: new Date('2026-05-20T00:00:00.000Z'),
    });
    expect(result!.reconciliationSummary).toEqual({
      exact: 1,
      candidate: 0,
      unmatched: 0,
      manualReviewRequired: 0,
    });
    expect(result!.sourcePriority).toBe('api');
    expect(result!.lastSeenAt).toEqual(new Date('2026-06-15T12:00:00.000Z'));
    expect(mockQuery).toHaveBeenCalledTimes(7);
  });

  it('returns orden_compra detail with items, null adjudications, and related OCs', async () => {
    const ocGoldRow = makeGoldRow({
      process_type: 'orden_compra',
      process_code: 'OC1',
      title: 'Orden Uno',
      canonical_state: 'aceptada',
      raw_state_code: '7',
      raw_state_label: 'Aceptada',
      buyer_code: 'BUY-2',
      buyer_name: 'Servicio Dos',
    });

    mockQuery
      .mockResolvedValueOnce([ocGoldRow])
      .mockResolvedValueOnce([
        {
          iditem: 'ID1',
          nombre_producto_generico: 'Producto OC',
          total_linea_neto: 1000000,
        },
      ])
      .mockResolvedValueOnce([RELATED_OC_ROW])
      .mockResolvedValueOnce([SRC_LINEAGE_API_ROW])
      .mockResolvedValueOnce([SRC_LINEAGE_CSV_ROW])
      .mockResolvedValueOnce([RECON_COUNT_ROW]);

    const result = await service.getDetectedProcessDetail(
      'orden_compra',
      'OC1',
    );

    expect(result).not.toBeNull();
    expect(result!.processType).toBe('orden_compra');
    expect(result!.items).toHaveLength(1);
    expect(result!.adjudications).toBeNull();
    expect(result!.relatedOcs).toHaveLength(1);
    expect(result!.sourceLineage).toHaveLength(2);
    expect(mockQuery).toHaveBeenCalledTimes(6);
  });

  it('returns compra_agil detail with items, null adjudications, and related OCs', async () => {
    const caGoldRow = makeGoldRow({
      process_type: 'compra_agil',
      process_code: 'CA1',
      title: 'Compra Agil Uno',
      canonical_state: 'publicada',
    });

    mockQuery
      .mockResolvedValueOnce([caGoldRow])
      .mockResolvedValueOnce([
        {
          raw_payload: {
            payload: {
              items: [
                {
                  codigo: 'CA1',
                  estado: {
                    id_estado: 2,
                    codigo: 'publicada',
                    glosa: 'Publicada',
                  },
                  fechas: {
                    fecha_ultimo_cambio: '2026-06-20T12:00:00Z',
                    fecha_cierre_primer_llamado: '2026-06-21T12:00:00Z',
                  },
                  institucion: {
                    rut: '60.000.000-0',
                    organismo_comprador: 'Municipalidad Uno',
                  },
                  documentos: [{ id: 9, nombre: 'Bases.pdf' }],
                  productos_solicitados: [
                    {
                      codigo_producto: 'CP1',
                      nombre: 'Producto CA',
                      descripcion: 'Detalle',
                      cantidad: 20,
                      unidad_medida: 'EA',
                    },
                  ],
                  links: { detalle: '/v2/compra-agil/CA1' },
                },
              ],
            },
          },
        },
      ])
      .mockResolvedValueOnce([RELATED_OC_ROW])
      .mockResolvedValueOnce([SRC_LINEAGE_API_ROW])
      .mockResolvedValueOnce([RECON_COUNT_ROW]);

    const result = await service.getDetectedProcessDetail('compra_agil', 'CA1');

    expect(result).not.toBeNull();
    expect(result!.processType).toBe('compra_agil');
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      code: 'CP1',
      description: 'Detalle',
      unit: 'EA',
    });
    expect(result!.adjudications).toBeNull();
    expect(result!.relatedOcs).toHaveLength(1);
    expect(result!.sourceLineage).toHaveLength(1);
    expect(result!.compraAgilSource).toMatchObject({
      sourcePath: '/v2/compra-agil/CA1',
      state: { id: '2', code: 'publicada', label: 'Publicada' },
      institution: {
        rut: '60.000.000-0',
        buyerName: 'Municipalidad Uno',
      },
      documents: [{ id: '9', name: 'Bases.pdf' }],
    });
    expect(mockQuery).toHaveBeenCalledTimes(5);
  });

  it('returns empty arrays for items, relatedOcs, and sourceLineage when data is missing', async () => {
    mockQuery
      .mockResolvedValueOnce([
        makeGoldRow({
          title: null,
          canonical_state: null,
          raw_state_code: null,
          raw_state_label: null,
          buyer_code: null,
          buyer_name: null,
          published_at: null,
          closing_at: null,
          source_priority: null,
        }),
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.getDetectedProcessDetail(
      'licitacion',
      'L_EMPTY',
    );

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
    expect(result!.adjudications).toEqual([]);
    expect(result!.relatedOcs).toEqual([]);
    expect(result!.sourceLineage).toEqual([]);
    expect(result!.reconciliationSummary).toEqual({
      exact: 0,
      candidate: 0,
      unmatched: 0,
      manualReviewRequired: 0,
    });
  });

  it('aggregates exact match type variants into single counter', async () => {
    mockQuery
      .mockResolvedValueOnce([makeGoldRow()])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { match_type: 'exact_codigo_externo', count: '2' },
        { match_type: 'exact_codigo_licitacion', count: '3' },
        { match_type: 'csv_api_same_business_key', count: '1' },
        { match_type: 'candidate_supplier_amount', count: '1' },
        { match_type: 'candidate_item_amount', count: '1' },
        { match_type: 'unmatched', count: '4' },
        { match_type: 'manual_review_required', count: '2' },
      ]);

    const result = await service.getDetectedProcessDetail('licitacion', 'L1');

    expect(result!.reconciliationSummary).toEqual({
      exact: 6,
      candidate: 2,
      unmatched: 4,
      manualReviewRequired: 2,
    });
  });

  it('filters source lineage entries with zero rowCount', async () => {
    mockQuery
      .mockResolvedValueOnce([makeGoldRow()])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { source: 'api-v1-licitaciones', row_count: '0', last_seen_at: null },
      ])
      .mockResolvedValueOnce([SRC_LINEAGE_CSV_ROW])
      .mockResolvedValueOnce([]);

    const result = await service.getDetectedProcessDetail('licitacion', 'L1');

    expect(result!.sourceLineage).toHaveLength(1);
    expect(result!.sourceLineage[0].source).toBe('csv-datos-abiertos');
  });
});
