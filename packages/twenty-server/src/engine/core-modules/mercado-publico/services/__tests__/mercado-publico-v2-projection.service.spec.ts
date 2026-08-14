import {
  type MercadoPublicoV2ProjectionContext,
  MercadoPublicoV2ProjectionService,
} from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

type QueryCall = { sql: string; params: unknown[] };

const buildHarness = () => {
  const queries: QueryCall[] = [];
  const entityManager = {
    query: jest
      .fn()
      .mockImplementation(async (sql: string, params: unknown[] = []) => {
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
    transaction: jest
      .fn()
      .mockImplementation(async (callback) => callback(entityManager)),
  };
  const service = new MercadoPublicoV2ProjectionService(dataSource as never);

  return { service, queries };
};

const buildContext = (
  record: Record<string, unknown>,
  snapshotKind: 'list' | 'detail' = 'detail',
): MercadoPublicoV2ProjectionContext => ({
  syncRunId: 'sync-run-id',
  rawApiPayloadId: 'raw-payload-id',
  snapshotKind,
  response: {
    endpoint: snapshotKind === 'detail' ? 'detail' : 'list',
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
  record: record as never,
});

describe('MercadoPublicoV2ProjectionService', () => {
  it('projects all observed child arrays with stable provider keys', async () => {
    const { service, queries } = buildHarness();

    await service.ingest(
      buildContext({
        codigo: 'CA-CHILDREN',
        documentos: [{ id: 77 }],
        productos_solicitados: [{ codigo_producto: 101 }],
        proveedores_cotizando: [
          {
            id_cotizacion: 501,
            productos_cotizados: [{ codigo_producto: 101 }],
          },
        ],
      }),
    );

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
      null,
      'observation-id',
      'CA-CHILDREN',
      'productos_solicitados',
      '101',
      0,
      expect.any(String),
      JSON.stringify({ codigo_producto: 101 }),
      null,
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
      null,
      'observation-id',
      'CA-CHILDREN',
      'productos_cotizados',
      '501:101',
      0,
      expect.any(String),
      JSON.stringify({ codigo_producto: 101 }),
      '501',
    ]);
  });

  it('persists order references split into id_orden_compra and id_oc', async () => {
    const { service, queries } = buildHarness();

    await service.ingest(
      buildContext({
        codigo: 'CA-ORDER-REFS',
        orden_compra: {
          id_orden_compra: 700,
          id_oc: 701,
        },
      }),
    );

    const compraAgilQuery = queries.find((query) =>
      query.sql.includes('INSERT INTO mp.compra_agil'),
    );

    expect(compraAgilQuery?.params.slice(4, 6)).toEqual(['700', '701']);
    expect(compraAgilQuery?.sql).toContain('id_oc');
  });

  it('projects detail fields into the gold read model', async () => {
    const { service, queries } = buildHarness();

    await service.ingest(
      buildContext({
        codigo: 'CA-DETAIL',
        descripcion: 'Servicio de aseo',
        entrega: {
          direccion_entrega: 'Av. Central 123',
          plazo_entrega_dias: 15,
        },
        fechas: { fecha_cancelacion: '2026-01-02T03:04:05Z' },
        convocatoria: {
          descripcion: 'Primer llamado',
          fecha_cierre_primer_llamado: '2026-01-02T03:04:05Z',
          fecha_cierre_segundo_llamado: null,
        },
        presupuesto: {
          tipo_presupuesto: 'estimado',
          moneda: 'CLP',
          presupuesto_estimado: 150000,
        },
        motivos: {
          motivo_cancelacion: 'Presupuesto insuficiente',
          motivo_desierta: null,
          motivo_seleccion: null,
        },
        resumen: {
          multa_sancion: 0,
          total_ofertas_recibidas: 3,
          total_demandas: 0,
        },
      }),
    );

    const goldQuery = queries.find((query) =>
      query.sql.includes('INSERT INTO mp.gold_detected_process'),
    );

    expect(goldQuery?.sql).toContain('description');
    expect(goldQuery?.sql).toContain('delivery_address');
    expect(goldQuery?.sql).toContain('delivery_days');
    expect(goldQuery?.sql).toContain('cancellation_at');
    expect(goldQuery?.sql).toContain('call_description');
    expect(goldQuery?.sql).toContain('call_first_closing_at');
    expect(goldQuery?.sql).toContain('call_second_closing_at');
    expect(goldQuery?.sql).toContain('budget_type');
    expect(goldQuery?.sql).toContain('budget_estimate');
    expect(goldQuery?.sql).toContain('budget_currency');
    expect(goldQuery?.sql).toContain('cancel_motive');
    expect(goldQuery?.sql).toContain('deserted_motive');
    expect(goldQuery?.sql).toContain('selection_motive');
    expect(goldQuery?.sql).toContain('total_offers');
    expect(goldQuery?.sql).toContain('total_demands');
    expect(goldQuery?.sql).toContain('fine_penalty');
    expect(goldQuery?.params).toEqual(
      expect.arrayContaining([
        'CA-DETAIL',
        'Servicio de aseo',
        'Av. Central 123',
        15,
        new Date('2026-01-02T03:04:05Z'),
        'Primer llamado',
        new Date('2026-01-02T03:04:05Z'),
        null,
        'estimado',
        '150000',
        'CLP',
        'Presupuesto insuficiente',
        null,
        null,
        3,
        0,
        '0',
      ]),
    );
  });

  it('includes detail fields in the semantic history payloads', async () => {
    const queries: QueryCall[] = [];
    const entityManager = {
      query: jest
        .fn()
        .mockImplementation(async (sql: string, params: unknown[] = []) => {
          queries.push({ sql, params });

          if (sql.includes('INSERT INTO mp.v2_observation')) {
            return [{ id: 'observation-id' }];
          }

          if (sql.includes('SELECT') && sql.includes('FROM mp.compra_agil')) {
            return [
              {
                id: 'current-id',
                codigo: 'CA-HISTORY',
                estado: null,
                state_id: null,
                state_label: null,
                title: null,
                buyer_code: null,
                buyer_name: null,
                region: null,
                published_at: null,
                closing_at: null,
                provider_changed_at_raw: null,
                amount: null,
                amount_raw: null,
                currency_source: null,
                document_count: null,
                id_orden_compra: null,
                id_oc: null,
                observation_id: 'old-observation-id',
                semantic_fingerprint: 'old-fingerprint',
              },
            ];
          }

          if (sql.includes('FROM mp.gold_detected_process')) {
            return [
              {
                description: 'Descripción anterior',
                delivery_address: null,
                delivery_days: null,
                cancellation_at: null,
                call_description: null,
                call_first_closing_at: null,
                call_second_closing_at: null,
                budget_type: null,
                budget_estimate: null,
                budget_currency: null,
                cancel_motive: null,
                deserted_motive: null,
                selection_motive: null,
                total_offers: null,
                total_demands: null,
                fine_penalty: null,
              },
            ];
          }

          if (sql.includes('INSERT INTO mp.compra_agil')) {
            return [{ id: 'current-id' }];
          }

          return [];
        }),
    };
    const dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(async (callback) => callback(entityManager)),
    };
    const service = new MercadoPublicoV2ProjectionService(dataSource as never);

    await service.ingest(
      buildContext({
        codigo: 'CA-HISTORY',
        descripcion: 'Servicio de aseo',
        entrega: {
          direccion_entrega: 'Av. Central 123',
          plazo_entrega_dias: 15,
        },
        presupuesto: {
          tipo_presupuesto: 'estimado',
          moneda: 'CLP',
          presupuesto_estimado: 150000,
        },
        resumen: {
          multa_sancion: 0,
          total_ofertas_recibidas: 3,
          total_demandas: 0,
        },
      }),
    );

    const historyQuery = queries.find((query) =>
      query.sql.includes('INSERT INTO mp.v2_history'),
    );

    expect(historyQuery).toBeDefined();
    expect(JSON.parse(historyQuery?.params[5] as string)).toMatchObject({
      description: 'Descripción anterior',
      delivery_days: null,
    });
    expect(JSON.parse(historyQuery?.params[6] as string)).toMatchObject({
      description: 'Servicio de aseo',
      delivery_address: 'Av. Central 123',
      delivery_days: 15,
      budget_estimate: '150000',
      total_offers: 3,
      fine_penalty: '0',
    });
  });

  it('records relation availability snapshots for every observed array', async () => {
    const { service, queries } = buildHarness();

    await service.ingest(
      buildContext({
        codigo: 'CA-EMPTY',
        documentos: [],
        productos_solicitados: [{ codigo_producto: 101 }],
      }),
    );

    const snapshotQuery = queries.find((query) =>
      query.sql.includes('INSERT INTO mp.v2_relation_snapshot'),
    );

    expect(snapshotQuery?.sql).toContain('observation_id');
    expect(snapshotQuery?.sql).toContain('availability');
    expect(snapshotQuery?.sql).toContain('total_count');
    expect(snapshotQuery?.sql).toContain('source_kind');
    expect(snapshotQuery?.params).toEqual([
      'observation-id',
      'CA-EMPTY',
      'documentos',
      'available',
      0,
      'detail',
      'observation-id',
      'CA-EMPTY',
      'productos_solicitados',
      'available',
      1,
      'detail',
      'observation-id',
      'CA-EMPTY',
      'proveedores_cotizando',
      'unavailable',
      0,
      'detail',
      'observation-id',
      'CA-EMPTY',
      'productos_cotizados',
      'unavailable',
      0,
      'detail',
    ]);
  });

  it('marks relations absent from the record as unavailable', async () => {
    const { service, queries } = buildHarness();

    await service.ingest(buildContext({ codigo: 'CA-LIST-ONLY' }, 'list'));

    const snapshotQuery = queries.find((query) =>
      query.sql.includes('INSERT INTO mp.v2_relation_snapshot'),
    );

    expect(snapshotQuery?.params).toEqual([
      'observation-id',
      'CA-LIST-ONLY',
      'documentos',
      'unavailable',
      0,
      'list',
      'observation-id',
      'CA-LIST-ONLY',
      'productos_solicitados',
      'unavailable',
      0,
      'list',
      'observation-id',
      'CA-LIST-ONLY',
      'proveedores_cotizando',
      'unavailable',
      0,
      'list',
      'observation-id',
      'CA-LIST-ONLY',
      'productos_cotizados',
      'unavailable',
      0,
      'list',
    ]);
  });
});
