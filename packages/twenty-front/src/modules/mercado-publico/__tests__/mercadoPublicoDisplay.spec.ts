import { i18n } from '@lingui/core';

import {
  formatMercadoPublicoAmount,
  formatMercadoPublicoCount,
  formatMercadoPublicoPercent,
  getMercadoPublicoFreshnessLabel,
  getMercadoPublicoStatusLabel,
} from '@/mercado-publico/utils/mercadoPublicoDisplay';

describe('mercadoPublicoDisplay', () => {
  beforeEach(() => {
    i18n.activate('en');
  });

  it('localizes known values and preserves real zero counts', () => {
    expect(getMercadoPublicoStatusLabel('future_state')).toBe('No informado');
    expect(getMercadoPublicoFreshnessLabel('stale')).toBe('Desactualizada');
    expect(formatMercadoPublicoCount(0, (value) => `${value}`)).toBe('0');
    expect(formatMercadoPublicoCount(null)).toBe('No informado');
  });

  it('formats CLP and percentages without inventing values', () => {
    expect(formatMercadoPublicoAmount(1234, 'es-CL')).toContain('$');
    expect(formatMercadoPublicoPercent(99.92, 'es-CL')).toContain('99,92');
    expect(formatMercadoPublicoPercent(null, 'es-CL')).toBe('No informado');
  });
});
