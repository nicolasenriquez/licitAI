import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-detail-real-sanitized.json';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';

describe('normalizeV2CompraAgilRecord', () => {
  it('normalizes the observed detail budget and dates without requiring list-only fields', () => {
    const normalized = normalizeV2CompraAgilRecord(fixture.samples[0]);

    expect(normalized).toMatchObject({
      amount: '1',
      amountRaw: '1',
      currency: '[string]',
      documentCount: 23,
      publishedAt: new Date('2026-01-02T03:04:05Z'),
      closingAt: new Date('2026-01-02T03:04:05Z'),
      providerChangedAt: new Date('2026-01-02T03:04:05Z'),
    });
  });

  it('preserves empty child arrays as an observed zero count', () => {
    const normalized = normalizeV2CompraAgilRecord(fixture.samples[1]);

    expect(normalized.documentCount).toBe(0);
  });

  it('keeps the observed child-key variants available to the next projection slice', () => {
    const [largeDocuments, withOrder, cancelled] = fixture.samples;

    expect(largeDocuments.documentos).toHaveLength(23);
    expect(largeDocuments.documentos[0]?.id).toBe(1);
    expect(largeDocuments.productos_solicitados?.[0]?.codigo_producto).toBe(1);
    expect(largeDocuments.proveedores_cotizando?.[0]?.id_cotizacion).toBe(1);
    expect(
      largeDocuments.proveedores_cotizando?.[0]?.productos_cotizados?.[0]
        ?.codigo_producto,
    ).toBe(1);
    expect(withOrder.id_orden_compra).toBe(1);
    expect(cancelled.proveedores_cotizando).toEqual([]);
    expect(cancelled.motivos?.motivo_cancelacion).toBe('[string]');
  });

  it('normalizes detail fields from the confirmed contract', () => {
    const normalized = normalizeV2CompraAgilRecord(fixture.samples[0]);

    expect(normalized).toMatchObject({
      description: '[string]',
      deliveryAddress: '[string]',
      deliveryDays: 1,
      cancellationAt: null,
      callDescription: '[string]',
      callFirstClosingAt: new Date('2026-01-02T03:04:05Z'),
      callSecondClosingAt: null,
      budgetType: '[string]',
      budgetEstimate: '1',
      budgetCurrency: '[string]',
      cancelMotive: null,
      desertedMotive: '[string]',
      selectionMotive: null,
      totalOffers: 1,
      totalDemands: 0,
      finePenalty: '1',
    });
  });

  it('keeps absent detail sections null instead of inventing values', () => {
    const normalized = normalizeV2CompraAgilRecord(fixture.samples[1]);

    expect(normalized).toMatchObject({
      description: null,
      deliveryAddress: null,
      deliveryDays: null,
      cancellationAt: null,
      callFirstClosingAt: new Date('2026-01-02T03:04:05Z'),
      callSecondClosingAt: new Date('2026-01-02T03:04:05Z'),
      budgetType: null,
      budgetEstimate: null,
      totalDemands: null,
      finePenalty: null,
    });
    expect(normalized.documentCount).toBe(0);
  });

  it('normalizes cancellation lifecycle fields when present', () => {
    const normalized = normalizeV2CompraAgilRecord(fixture.samples[2]);

    expect(normalized).toMatchObject({
      cancellationAt: new Date('2026-01-02T03:04:05Z'),
      cancelMotive: '[string]',
      desertedMotive: null,
      totalOffers: 0,
      totalDemands: 0,
      finePenalty: '1',
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
      amountRaw: null,
      currency: null,
      documentCount: null,
      description: null,
      deliveryAddress: null,
      deliveryDays: null,
      cancellationAt: null,
      callDescription: null,
      callFirstClosingAt: null,
      callSecondClosingAt: null,
      budgetType: null,
      budgetEstimate: null,
      budgetCurrency: null,
      cancelMotive: null,
      desertedMotive: null,
      selectionMotive: null,
      totalOffers: null,
      totalDemands: null,
      finePenalty: null,
    });
  });

  it('does not turn list query bounds into process dates', () => {
    expect(
      normalizeV2CompraAgilRecord({
        codigo: 'CA-1',
        publicado_desde: '2026-06-01T00:00:00Z',
        publicado_hasta: '2026-06-01T23:59:59Z',
      }),
    ).toMatchObject({ publishedAt: null, closingAt: null });
  });

  it('uses DETAIL call closing dates before LIST date fallbacks', () => {
    const normalized = normalizeV2CompraAgilRecord({
      codigo: 'CA-1',
      fechas: {
        fecha_cierre_primer_llamado: '2026-06-10T10:00:00Z',
        fecha_cierre_segundo_llamado: '2026-06-11T10:00:00Z',
      },
      convocatoria: {
        fecha_cierre_primer_llamado: '2026-06-12T10:00:00Z',
      },
    });

    expect(normalized.callFirstClosingAt).toEqual(
      new Date('2026-06-12T10:00:00Z'),
    );
    expect(normalized.callSecondClosingAt).toEqual(
      new Date('2026-06-11T10:00:00Z'),
    );
  });

  it('keeps a CLP fallback paired with CLP currency', () => {
    expect(
      normalizeV2CompraAgilRecord({
        codigo: 'CA-1',
        presupuesto: { moneda: 'USD', monto_disponible_clp: 120000 },
      }),
    ).toMatchObject({
      amount: '120000',
      amountRaw: '120000',
      currency: 'CLP',
    });
  });
});
