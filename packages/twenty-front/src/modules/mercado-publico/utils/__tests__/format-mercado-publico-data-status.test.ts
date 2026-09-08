import {
  formatMercadoPublicoAvailability,
  formatMercadoPublicoFreshness,
  formatMercadoPublicoFreshnessSummary,
} from '@/mercado-publico/utils/format-mercado-publico-data-status';

const translate = ({ message }: { message: string }) => message;

describe('Mercado Publico data status formatters', () => {
  it.each([
    ['available', 'Disponible'],
    ['partial', 'Información parcial'],
    ['unavailable', 'Aún no disponible'],
    ['not_applicable', 'No aplica'],
    ['unknown', 'No informado por fuente'],
  ])('formats availability %s', (availability, expected) => {
    expect(formatMercadoPublicoAvailability(availability, translate)).toBe(
      expected,
    );
  });

  it.each([
    ['healthy', 'Al día'],
    ['fresh', 'Al día'],
    ['stale', 'Desactualizada'],
    ['degraded', 'Degradada'],
    ['unknown', null],
  ])('formats freshness %s', (freshness, expected) => {
    expect(formatMercadoPublicoFreshness(freshness, translate)).toBe(expected);
  });

  it('uses a subdued age for healthy data and an actionable stale label', () => {
    const asOf = '2026-09-07T15:00:00.000Z';
    const now = new Date('2026-09-07T15:08:00.000Z').getTime();

    expect(
      formatMercadoPublicoFreshnessSummary('healthy', asOf, translate, now),
    ).toBe('Actualizado hace 8 min');
    expect(
      formatMercadoPublicoFreshnessSummary('stale', asOf, translate, now),
    ).toBe('Datos desactualizados · Revisar');
  });
});
