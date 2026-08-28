import {
  formatMercadoPublicoAvailability,
  formatMercadoPublicoFreshness,
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
});
