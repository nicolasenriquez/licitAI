import { type DataSource, type EntityManager } from 'typeorm';

import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';

describe('MercadoPublicoCanonicalRefreshService', () => {
  const mockEntityManager = {
    query: jest.fn(),
  } as unknown as jest.Mocked<EntityManager>;

  const mockCoreDataSource = {
    transaction: jest.fn(
      async (callback: (entityManager: EntityManager) => unknown) =>
        callback(mockEntityManager),
    ),
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoCanonicalRefreshService(mockCoreDataSource);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh canonical licitaciones from distinct staging rows', async () => {
    mockEntityManager.query
      .mockResolvedValueOnce([
        {
          id: 'stg-row-id',
          source: 'api-v1-licitaciones',
          codigo_externo: 'L1',
          codigo: '1001',
          codigo_estado: '5',
          estado: 'Publicada',
          codigo_tipo: 'LP',
          nombre: 'Licitacion Uno',
          fecha_publicacion: '2026-06-15',
          fecha_cierre: '1900-01-01',
          fecha_adjudicacion: null,
          codigo_organismo: 'BUY-1',
          nombre_organismo: 'Municipalidad Uno',
          fetched_at: new Date('2026-06-16T12:00:00.000Z'),
          created_at: new Date('2026-06-16T12:00:01.000Z'),
        },
      ])
      .mockResolvedValueOnce([]);

    const refreshedCount =
      await service.refreshV1LicitacionesFromApiSnapshot('raw-api-payload-id');

    expect(refreshedCount).toBe(1);
    expect(mockEntityManager.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT DISTINCT ON (codigo_externo)'),
      ['raw-api-payload-id'],
    );

    const [upsertSql, upsertParams] = mockEntityManager.query.mock.calls[1];

    expect(upsertSql).toContain('INSERT INTO mp.licitacion');
    expect(upsertParams).toEqual([
      'L1',
      '1001',
      'Licitacion Uno',
      'publicada',
      '5',
      'Publicada',
      'LP',
      'licitacion_publica',
      'BUY-1',
      'Municipalidad Uno',
      '2026-06-15',
      null,
      null,
      false,
      true,
      'api-v1-licitaciones',
      new Date('2026-06-16T12:00:00.000Z'),
      true,
      true,
      true,
      true,
      false,
    ]);
  });

  it('should preserve sparse rows without forcing unknown overwrites', async () => {
    mockEntityManager.query
      .mockResolvedValueOnce([
        {
          id: 'stg-row-id',
          source: 'api-v1-licitaciones',
          codigo_externo: 'L2',
          codigo: null,
          codigo_estado: null,
          estado: null,
          codigo_tipo: null,
          nombre: null,
          fecha_publicacion: null,
          fecha_cierre: null,
          fecha_adjudicacion: null,
          codigo_organismo: null,
          nombre_organismo: null,
          fetched_at: new Date('2026-06-17T12:00:00.000Z'),
          created_at: new Date('2026-06-17T12:00:01.000Z'),
        },
      ])
      .mockResolvedValueOnce([]);

    await service.refreshV1LicitacionesFromApiSnapshot('raw-api-payload-id');

    const [, upsertParams] = mockEntityManager.query.mock.calls[1];

    expect(upsertParams[3]).toBeNull();
    expect(upsertParams[7]).toBe('unknown_raw_type');
    expect(upsertParams[17]).toBe(false);
    expect(upsertParams[18]).toBe(false);
    expect(upsertParams[19]).toBe(false);
    expect(upsertParams[20]).toBe(false);
    expect(upsertParams[21]).toBe(false);
  });

  describe('refreshV2CompraAgilFromApiSnapshot', () => {
    it('should refresh canonical Compra Agil from distinct staging rows', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([
          {
            id: 'stg-row-id',
            source: 'api-v2-compra-agil',
            snapshot_kind: 'list',
            codigo: 'CA-1',
            estado: 'publicada',
            id_orden_compra: 'OC-123',
            id_oc: null,
            codigo_orden_compra: null,
            publicado_desde: null,
            publicado_hasta: null,
            cambio_desde: null,
            cambio_hasta: null,
            fetched_at: new Date('2026-06-16T12:00:00.000Z'),
            created_at: new Date('2026-06-16T12:00:01.000Z'),
          },
        ])
        .mockResolvedValueOnce([]);

      const refreshedCount =
        await service.refreshV2CompraAgilFromApiSnapshot('raw-api-payload-id');

      expect(refreshedCount).toBe(1);
      expect(mockEntityManager.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT DISTINCT ON (codigo)'),
        ['raw-api-payload-id'],
      );

      const [upsertSql, upsertParams] = mockEntityManager.query.mock.calls[1];

      expect(upsertSql).toContain('INSERT INTO mp.compra_agil');
      expect(upsertParams).toEqual([
        'CA-1',
        'publicada',
        'OC-123',
        null,
        null,
        null,
        new Date('2026-06-16T12:00:00.000Z'),
      ]);
    });

    it('should preserve non-null canonical fields against null staging values', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([
          {
            id: 'stg-row-id',
            source: 'api-v2-compra-agil',
            snapshot_kind: 'detail',
            codigo: 'CA-1',
            estado: null,
            id_orden_compra: null,
            id_oc: null,
            codigo_orden_compra: null,
            publicado_desde: null,
            publicado_hasta: null,
            cambio_desde: null,
            cambio_hasta: null,
            fetched_at: new Date('2026-06-17T12:00:00.000Z'),
            created_at: new Date('2026-06-17T12:00:01.000Z'),
          },
        ])
        .mockResolvedValueOnce([]);

      const refreshedCount =
        await service.refreshV2CompraAgilFromApiSnapshot('raw-api-payload-id');

      expect(refreshedCount).toBe(1);

      const [, upsertParams] = mockEntityManager.query.mock.calls[1];

      expect(upsertParams[1]).toBeNull();
      expect(upsertParams[2]).toBeNull();
      expect(upsertParams[3]).toBeNull();
      expect(upsertParams[4]).toBeNull();
    });
  });

  describe('refreshLicitacionItemsFromCsvSnapshot', () => {
    it('should refresh canonical licitacion items from distinct csv staging rows', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([
          {
            id: 'stg-row-id',
            codigo_externo: 'L1',
            codigoitem: 'ITEM-1',
            nombre_producto_generico: 'Producto X',
            cantidad: '100',
          },
        ])
        .mockResolvedValueOnce([]);

      const refreshedCount =
        await service.refreshLicitacionItemsFromCsvSnapshot(
          'raw-csv-file-id',
        );

      expect(refreshedCount).toBe(1);
      expect(mockEntityManager.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT DISTINCT ON (codigo_externo, codigoitem)'),
        ['raw-csv-file-id'],
      );
      expect(mockEntityManager.query.mock.calls[0]?.[0]).toContain(
        'JOIN mp.raw_csv_row raw_row',
      );

      const [upsertSql, upsertParams] = mockEntityManager.query.mock.calls[1];

      expect(upsertSql).toContain('INSERT INTO mp.licitacion_item');
      expect(upsertParams).toEqual([
        'L1',
        'ITEM-1',
        'Producto X',
        '100',
      ]);
    });
  });

  describe('refreshLicitacionOfertasFromCsvSnapshot', () => {
    it('should refresh canonical licitacion ofertas from distinct csv staging rows', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([
          {
            id: 'stg-row-id',
            codigo_externo: 'L1',
            codigoitem: 'ITEM-1',
            codigo_proveedor: 'PROV-1',
            rut_proveedor: '12345678-9',
            nombre_de_la_oferta: 'Oferta A',
            estado_oferta: 'Aceptada',
            cantidad_ofertada: '50',
            valor_total_ofertado: '1000000,50',
            oferta_seleccionada: 'Si',
          },
        ])
        .mockResolvedValueOnce([]);

      const refreshedCount =
        await service.refreshLicitacionOfertasFromCsvSnapshot(
          'raw-csv-file-id',
        );

      expect(refreshedCount).toBe(1);
      expect(mockEntityManager.query.mock.calls[0]?.[0]).toContain(
        'JOIN mp.raw_csv_row raw_row',
      );

      const [upsertSql, upsertParams] = mockEntityManager.query.mock.calls[1];

      expect(upsertSql).toContain('INSERT INTO mp.licitacion_oferta');
      expect(upsertParams).toEqual([
        'L1',
        'ITEM-1',
        'PROV-1',
        '12345678-9',
        'Oferta A',
        'Aceptada',
        '50',
        '1000000,50',
        true,
        'Si',
      ]);
    });
  });

  describe('refreshLicitacionAdjudicacionesFromCsvSnapshot', () => {
    it('should refresh canonical licitacion adjudicaciones from distinct csv staging rows', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([
          {
            id: 'stg-row-id',
            codigo_externo: 'L1',
            codigoitem: 'ITEM-1',
            rut_proveedor: '12345678-9',
            cantidad_adjudicada: '100',
            monto_estimado_adjudicado: '5000000',
          },
        ])
        .mockResolvedValueOnce([]);

      const refreshedCount =
        await service.refreshLicitacionAdjudicacionesFromCsvSnapshot(
          'raw-csv-file-id',
        );

      expect(refreshedCount).toBe(1);
      expect(mockEntityManager.query.mock.calls[0]?.[0]).toContain(
        'JOIN mp.raw_csv_row raw_row',
      );

      const [upsertSql, upsertParams] = mockEntityManager.query.mock.calls[1];

      expect(upsertSql).toContain('INSERT INTO mp.licitacion_adjudicacion');
      expect(upsertParams).toEqual([
        'L1',
        'ITEM-1',
        '12345678-9',
        '100',
        '5000000',
      ]);
    });
  });

  describe('refreshOrdenCompraItemsFromCsvSnapshot', () => {
    it('should refresh canonical OC items from distinct csv staging rows', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([
          {
            id: 'stg-row-id',
            iditem: 'ITEM-OC-1',
            codigo: 'OC-123',
            total_linea_neto: '500000,50',
            codigo_producto_onu: 'UNSPSC-123',
            forma_de_pago: 'Transferencia',
          },
        ])
        .mockResolvedValueOnce([]);

      const refreshedCount =
        await service.refreshOrdenCompraItemsFromCsvSnapshot(
          'raw-csv-file-id',
        );

      expect(refreshedCount).toBe(1);
      expect(mockEntityManager.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT DISTINCT ON (iditem)'),
        ['raw-csv-file-id'],
      );
      expect(mockEntityManager.query.mock.calls[0]?.[0]).toContain(
        'JOIN mp.raw_csv_row raw_row',
      );

      const [upsertSql, upsertParams] = mockEntityManager.query.mock.calls[1];

      expect(upsertSql).toContain('INSERT INTO mp.orden_compra_item');
      expect(upsertParams).toEqual([
        'ITEM-OC-1',
        'OC-123',
        '500000,50',
        'UNSPSC-123',
        'Transferencia',
      ]);
    });
  });
});
