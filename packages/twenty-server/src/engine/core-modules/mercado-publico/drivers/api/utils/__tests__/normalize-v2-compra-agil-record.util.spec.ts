import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';

describe('normalizeV2CompraAgilRecord', () => {
  it('preserves list fields and source nullability', () => {
    expect(
      normalizeV2CompraAgilRecord({
        codigo: 'CA-1',
        nombre: 'Servicio',
        estado: { codigo: 'publicada', glosa: 'Publicada' },
        institucion: {
          rut: '60-0',
          region: 13,
          organismo_comprador: 'Municipio',
        },
        fechas: {
          fecha_publicacion: '2026-06-01T09:30:00',
          fecha_cierre: '2026-06-30T12:00:00-04:00',
        },
        montos: { moneda: 'CLP', monto_disponible: 1500000 },
        documentos: [{ id: 1 }],
      }),
    ).toMatchObject({
      title: 'Servicio',
      stateCode: 'publicada',
      stateLabel: 'Publicada',
      buyerCode: '60-0',
      buyerName: 'Municipio',
      region: 13,
      amount: '1500000',
      currency: 'CLP',
      documentCount: 1,
    });
  });

  it('does not invent unavailable fields', () => {
    expect(normalizeV2CompraAgilRecord({ codigo: 'CA-1' })).toEqual({
      title: null,
      stateCode: null,
      stateLabel: null,
      buyerCode: null,
      buyerName: null,
      region: null,
      publishedAt: null,
      closingAt: null,
      providerChangedAt: null,
      providerChangedAtRaw: null,
      stateId: null,
      amount: null,
      currency: null,
      documentCount: null,
    });
  });

  it('distinguishes unavailable documents from an empty document list', () => {
    expect(
      normalizeV2CompraAgilRecord({ codigo: 'CA-1', documentos: [] })
        .documentCount,
    ).toBe(0);
  });

  it('preserves valid and invalid provider change timestamps separately', () => {
    expect(
      normalizeV2CompraAgilRecord({
        codigo: 'CA-1',
        estado: { id_estado: 2, codigo: 'publicada', glosa: 'Publicada' },
        fechas: { fecha_ultimo_cambio: '2026-06-01T12:00:00Z' },
      }),
    ).toMatchObject({
      stateId: '2',
      providerChangedAtRaw: '2026-06-01T12:00:00Z',
      providerChangedAt: new Date('2026-06-01T12:00:00.000Z'),
    });
  });
});
