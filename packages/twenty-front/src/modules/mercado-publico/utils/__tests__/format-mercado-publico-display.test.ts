import {
  formatMercadoPublicoAmount,
  formatMercadoPublicoDate,
  formatMercadoPublicoDateInput,
  formatMercadoPublicoRelativeDate,
  formatMercadoPublicoRegion,
} from '@/mercado-publico/utils/format-mercado-publico-display';

describe('Mercado Publico display formatters', () => {
  it('formats CLP with Chilean separators and currency', () => {
    expect(formatMercadoPublicoAmount('1000000', 'CLP')).toBe('$1.000.000 CLP');
  });

  it('keeps a clear fallback for non-CLP amounts without conversion', () => {
    expect(formatMercadoPublicoAmount('10', 'USD')).toBe(
      '10 USD · CLP no disponible',
    );
  });

  it('maps Chilean regions and keeps an unknown numeric fallback', () => {
    expect(formatMercadoPublicoRegion(13)).toBe('Metropolitana');
    expect(formatMercadoPublicoRegion(99)).toBe('Región 99');
  });

  it('formats URL date values for applied filter labels', () => {
    expect(formatMercadoPublicoDateInput('2026-09-07')).toBe('07/09/2026');
  });

  it('formats dates in Santiago with the Mercado Público display contract', () => {
    expect(formatMercadoPublicoDate('2026-09-07T15:04:00.000Z')).toBe(
      '07/09/2026 · 12:04',
    );
  });

  it('uses Santiago calendar days for relative closing labels', () => {
    const now = new Date('2026-09-07T15:00:00.000Z').getTime();

    expect(
      formatMercadoPublicoRelativeDate('2026-09-07T23:00:00.000Z', now),
    ).toBe('Cierra hoy');
    expect(
      formatMercadoPublicoRelativeDate('2026-09-08T15:00:00.000Z', now),
    ).toBe('Cierra mañana');
    expect(
      formatMercadoPublicoRelativeDate('2026-09-06T15:00:00.000Z', now),
    ).toBe('Cierre vencido');
  });

  it('keeps explicit fallbacks for missing amounts and dates', () => {
    expect(formatMercadoPublicoAmount(null, 'CLP')).toBe('Monto no disponible');
    expect(formatMercadoPublicoDate(null)).toBe('Fecha no disponible');
    expect(formatMercadoPublicoRelativeDate(null)).toBe('Cierre no disponible');
  });
});
