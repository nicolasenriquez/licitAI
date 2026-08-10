import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

describe('MercadoPublicoV2ProjectionService', () => {
  it('projects all observed child arrays with stable provider keys', async () => {
    const queries: Array<{ sql: string; params: unknown[] }> = [];
    const entityManager = {
      query: jest.fn().mockImplementation(async (sql: string, params: unknown[] = []) => {
        queries.push({ sql, params });

        if (sql.includes('INSERT INTO mp.v2_observation')) {
          return [{ id: 'observation-id' }];
        }

        if (sql.includes('INSERT INTO mp.compra_agil')) {
          return [{ id: 'current-id' }];
        }

        return [];
      }),
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) =>
        callback(entityManager),
      ),
    };
    const service = new MercadoPublicoV2ProjectionService(dataSource as never);

    await service.ingest({
      syncRunId: 'sync-run-id',
      rawApiPayloadId: 'raw-payload-id',
      snapshotKind: 'detail',
      response: {
        endpoint: 'detail',
        source: 'api-v2-compra-agil',
        requestParams: {},
        requestFingerprint: 'request-fingerprint',
        payloadChecksum: 'payload-checksum',
        schemaFingerprint: 'schema-fingerprint',
        httpStatus: 200,
        fetchedAt: new Date('2026-08-10T12:00:00.000Z'),
        rawPayload: {},
        compraAgil: [],
      },
      record: {
        codigo: 'CA-CHILDREN',
        documentos: [{ id: 77 }],
        productos_solicitados: [{ codigo_producto: 101 }],
        proveedores_cotizando: [
          {
            id_cotizacion: 501,
            productos_cotizados: [{ codigo_producto: 101 }],
          },
        ],
      },
    });

    const childQuery = queries.find((query) =>
      query.sql.includes('INSERT INTO mp.v2_child_evidence'),
    );

    expect(childQuery?.params).toEqual([
      'observation-id',
      'CA-CHILDREN',
      'documentos',
      '77',
      0,
      expect.any(String),
      JSON.stringify({ id: 77 }),
      'observation-id',
      'CA-CHILDREN',
      'productos_solicitados',
      '101',
      0,
      expect.any(String),
      JSON.stringify({ codigo_producto: 101 }),
      'observation-id',
      'CA-CHILDREN',
      'proveedores_cotizando',
      '501',
      0,
      expect.any(String),
      JSON.stringify({
        id_cotizacion: 501,
        productos_cotizados: [{ codigo_producto: 101 }],
      }),
      'observation-id',
      'CA-CHILDREN',
      'productos_cotizados',
      '501:101',
      0,
      expect.any(String),
      JSON.stringify({ codigo_producto: 101 }),
    ]);
  });
});
