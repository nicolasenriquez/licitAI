import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoPersistenceService', () => {
  it('creates a job run without raw_csv_file_id when no file context is provided', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    const mockDataSource = {
      query: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[]) => {
          executedQueries.push({ sql, params });

          return [{ id: 'job-run-row-id' }];
        }),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    const result = await service.createJobRun('csv-file-profile');

    expect(result).toEqual({
      id: 'job-run-row-id',
      jobRunId: expect.any(String),
      startedAt: expect.any(Date),
    });
    expect(executedQueries).toHaveLength(1);
    expect(executedQueries[0]?.sql).not.toContain('raw_csv_file_id');
    expect(executedQueries[0]?.params).toHaveLength(3);
  });

  it('creates a legacy-safe job run when file context is provided but the schema column is unavailable', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    const mockDataSource = {
      query: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[]) => {
          executedQueries.push({ sql, params });

          if (sql.includes('information_schema.columns')) {
            return [{ exists: false }];
          }

          return [{ id: 'job-run-row-id' }];
        }),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    await service.createJobRun('csv-raw-load', {
      rawCsvFileId: 'raw-file-id',
    });

    expect(executedQueries).toHaveLength(2);
    expect(executedQueries[0]?.sql).toContain('information_schema.columns');
    expect(executedQueries[1]?.sql).not.toContain('raw_csv_file_id');
    expect(executedQueries[1]?.params).toEqual([
      'csv-raw-load',
      expect.any(String),
      expect.any(Date),
    ]);
  });

  it('creates a job run with raw_csv_file_id when the schema column exists', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    const mockDataSource = {
      query: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[]) => {
          executedQueries.push({ sql, params });

          if (sql.includes('information_schema.columns')) {
            return [{ exists: true }];
          }

          return [{ id: 'job-run-row-id' }];
        }),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    await service.createJobRun('csv-raw-load', {
      rawCsvFileId: 'raw-file-id',
    });

    expect(executedQueries).toHaveLength(2);
    expect(executedQueries[1]?.sql).toContain('raw_csv_file_id');
    expect(executedQueries[1]?.params[3]).toBe('raw-file-id');
  });

  it('should persist V2 Compra Agil raw payload and list snapshots', async () => {
    const executedSql: string[] = [];
    const mockEntityManager = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        executedSql.push(sql);

        if (sql.includes('INSERT INTO mp.raw_api_payload')) {
          return [{ id: 'raw-api-payload-id' }];
        }

        if (sql.includes('INSERT INTO mp.stg_api_v2_compra_agil')) {
          return [{ id: 'staging-id-1' }, { id: 'staging-id-2' }];
        }

        return [];
      }),
    };
    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockEntityManager);
      }),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    const result = await service.persistV2CompraAgilSnapshot({
      jobRunRecordId: 'job-run-record-id',
      snapshotKind: 'list',
      apiResponse: {
        endpoint: 'list',
        source: 'api-v2-compra-agil',
        requestParams: { ttl_cambio_ms: 5000 },
        requestFingerprint: 'request-fingerprint',
        payloadChecksum: 'payload-checksum',
        schemaFingerprint: 'schema-fingerprint',
        httpStatus: 200,
        fetchedAt: new Date('2026-06-15T00:00:00.000Z'),
        rawPayload: {
          Items: [{ codigo: 'CA-1' }, { codigo: 'CA-2' }],
        },
        compraAgil: [
          {
            codigo: 'CA-1',
            estado: 'publicada',
            orden_compra: { id_orden_compra: 'OC-123' },
          },
          {
            codigo: 'CA-2',
            estado: 'cerrada',
          },
        ],
      },
    });

    expect(result).toEqual({
      rawApiPayloadId: 'raw-api-payload-id',
      recordsFetched: 2,
      recordsStaged: 2,
      recordsCanonicalized: 0,
    });
    expect(mockDataSource.transaction).toHaveBeenCalledTimes(2);
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO mp.raw_api_payload')),
    ).toBe(true);
    expect(
      executedSql.filter((sql) =>
        sql.includes('INSERT INTO mp.stg_api_v2_compra_agil'),
      ),
    ).toHaveLength(1);
    expect(
      executedSql.find((sql) =>
        sql.includes('INSERT INTO mp.stg_api_v2_compra_agil'),
      ),
    ).toContain('ON CONFLICT DO NOTHING');
  });

  it('commits raw evidence before staging fails', async () => {
    const rawEntityManager = {
      query: jest.fn().mockResolvedValue([{ id: 'raw-api-payload-id' }]),
    };
    const stagingError = new Error('staging failed');
    const stagingEntityManager = {
      query: jest.fn().mockRejectedValue(stagingError),
    };
    const mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementationOnce(async (callback) => callback(rawEntityManager))
        .mockImplementationOnce(async (callback) =>
          callback(stagingEntityManager),
        ),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    await expect(
      service.persistV2CompraAgilSnapshot({
        jobRunRecordId: 'job-run-record-id',
        snapshotKind: 'list',
        apiResponse: {
          endpoint: 'list',
          source: 'api-v2-compra-agil',
          requestParams: {},
          requestFingerprint: 'request-fingerprint',
          payloadChecksum: 'payload-checksum',
          schemaFingerprint: 'schema-fingerprint',
          httpStatus: 200,
          fetchedAt: new Date('2026-06-15T00:00:00.000Z'),
          rawPayload: {},
          compraAgil: [{ codigo: 'CA-1' }],
        },
      }),
    ).rejects.toThrow(stagingError);

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(2);
    expect(rawEntityManager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO mp.raw_api_payload'),
      expect.any(Array),
    );
    expect(stagingEntityManager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO mp.stg_api_v2_compra_agil'),
      expect.any(Array),
    );
  });

  it('does not insert raw_csv_file_id into stg_csv_orden_compra rows', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    const mockDataSource = {
      query: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[]) => {
          executedQueries.push({ sql, params });

          return [];
        }),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    await service.insertStgCsvOrdenCompraRows({
      rows: [
        {
          rawCsvRowId: 'raw-row-id',
          sourceDataset: 'oc',
          sourcePeriod: '2026-06',
          codigo: 'OC-1',
          sourceId: 'SRC-1',
          iditem: 'ITEM-1',
          codigoLicitacion: 'LIC-1',
          fechaEnvio: '2026-06-01',
          estado: 'Publicada',
          descripcionTipoOc: null,
          codigoAbreviadoTipoOc: null,
          codigoTipo: null,
          tipoMonedaOc: null,
          montoTotalOcPesosChilenos: null,
          impuestosOc: null,
          unidadCompra: null,
          nombreProveedor: null,
          codigoProductoOnu: null,
          totalLineaNeto: null,
          esCompraAgil: null,
          esTratoDirecto: null,
          formaDePago: null,
          codigoConvenioMarco: null,
          allObservedFields: ['OC-1'],
        },
      ],
    });

    expect(executedQueries).toHaveLength(1);
    expect(executedQueries[0]?.sql).not.toContain('raw_csv_file_id');
    expect(executedQueries[0]?.params).toHaveLength(24);
  });

  it('does not insert raw_csv_file_id into stg_csv_licitacion rows', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
    const mockDataSource = {
      query: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[]) => {
          executedQueries.push({ sql, params });

          return [];
        }),
    };
    const service = new MercadoPublicoPersistenceService(
      mockDataSource as never,
    );

    await service.insertStgCsvLicitacionRows({
      rows: [
        {
          rawCsvRowId: 'raw-row-id',
          sourceDataset: 'licitaciones',
          sourcePeriod: '2026-06',
          codigoExterno: 'LIC-1',
          codigo: 'COD-1',
          codigoitem: 'ITEM-1',
          codigoProveedor: 'P-1',
          rutProveedor: '11111111-1',
          nombreDeLaOferta: 'Oferta A',
          estadoOferta: 'Aceptada',
          ofertaSeleccionada: 'Si',
          cantidadOfertada: '1',
          valorTotalOfertado: '1000',
          tipoDeAdquisicion: 'LP',
          fechaPublicacion: '2026-06-01',
          fechaAdjudicacion: '2026-06-02',
          estado: 'Publicada',
          nombreUnidad: 'Unidad',
          nombreProductoGenerico: 'Producto',
          cantidadAdjudicada: '1',
          montoEstimadoAdjudicado: '1000',
          allObservedFields: ['LIC-1'],
        },
      ],
    });

    expect(executedQueries).toHaveLength(1);
    expect(executedQueries[0]?.sql).not.toContain('raw_csv_file_id');
    expect(executedQueries[0]?.params).toHaveLength(22);
  });
});
