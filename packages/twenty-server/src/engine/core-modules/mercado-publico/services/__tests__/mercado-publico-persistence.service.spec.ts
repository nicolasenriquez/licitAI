import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoPersistenceService', () => {
  it('should persist raw payload and list snapshots without canonical writes', async () => {
    const executedSql: string[] = [];
    const mockEntityManager = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        executedSql.push(sql);

        if (sql.includes('INSERT INTO mp.raw_api_payload')) {
          return [{ id: 'raw-api-payload-id' }];
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

    const result = await service.persistV1LicitacionesSnapshot({
      jobRunRecordId: 'job-run-record-id',
      snapshotKind: 'list',
      apiResponse: {
        endpoint: 'by-date',
        source: 'api-v1-licitaciones',
        requestParams: { fecha: '15062026' },
        requestFingerprint: 'request-fingerprint',
        payloadChecksum: 'payload-checksum',
        schemaFingerprint: 'schema-fingerprint',
        httpStatus: 200,
        fetchedAt: new Date('2026-06-15T00:00:00.000Z'),
        rawPayload: {
          Listado: [{ CodigoExterno: 'L1' }, { CodigoExterno: 'L2' }],
        },
        licitaciones: [
          {
            CodigoExterno: 'L1',
            Codigo: '1',
            CodigoEstado: '5',
            Estado: 'Publicada',
          },
          {
            CodigoExterno: 'L2',
            Codigo: '2',
            CodigoEstado: '6',
            Estado: 'Cerrada',
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
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO mp.raw_api_payload')),
    ).toBe(true);
    expect(
      executedSql.filter((sql) =>
        sql.includes('INSERT INTO mp.stg_api_v1_licitacion'),
      ),
    ).toHaveLength(2);
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO mp.licitacion')),
    ).toBe(false);
  });

  it('should persist OC raw payload and list snapshots', async () => {
    const executedSql: string[] = [];
    const mockEntityManager = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        executedSql.push(sql);

        if (sql.includes('INSERT INTO mp.raw_api_payload')) {
          return [{ id: 'raw-api-payload-id' }];
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

    const result = await service.persistV1OrdenesDeCompraSnapshot({
      jobRunRecordId: 'job-run-record-id',
      snapshotKind: 'list',
      apiResponse: {
        endpoint: 'by-date',
        source: 'api-v1-oc',
        requestParams: { fecha: '15062026' },
        requestFingerprint: 'request-fingerprint',
        payloadChecksum: 'payload-checksum',
        schemaFingerprint: 'schema-fingerprint',
        httpStatus: 200,
        fetchedAt: new Date('2026-06-15T00:00:00.000Z'),
        rawPayload: {
          Listado: [{ Codigo: 'OC-1' }, { Codigo: 'OC-2' }],
        },
        ordenesDeCompra: [
          {
            Codigo: 'OC-1',
            CodigoEstado: '4',
            Estado: 'Enviada a proveedor',
          },
          {
            Codigo: 'OC-2',
            CodigoEstado: '6',
            Estado: 'Aceptada',
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
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO mp.raw_api_payload')),
    ).toBe(true);
    expect(
      executedSql.filter((sql) =>
        sql.includes('INSERT INTO mp.stg_api_v1_orden_compra'),
      ),
    ).toHaveLength(2);
  });

  it('should persist V2 Compra Agil raw payload and list snapshots', async () => {
    const executedSql: string[] = [];
    const mockEntityManager = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        executedSql.push(sql);

        if (sql.includes('INSERT INTO mp.raw_api_payload')) {
          return [{ id: 'raw-api-payload-id' }];
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
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO mp.raw_api_payload')),
    ).toBe(true);
    expect(
      executedSql.filter((sql) =>
        sql.includes('INSERT INTO mp.stg_api_v2_compra_agil'),
      ),
    ).toHaveLength(2);
  });
});
