import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-detail-real-sanitized.json';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';

describe('normalizeV2CompraAgilRecord', () => {
  it('normalizes the observed detail budget and dates without requiring list-only fields', () => {
    const normalized = normalizeV2CompraAgilRecord(fixture.samples[0]);

    expect(normalized).toMatchObject({
      amount: '1',
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
});
