import { normalizeV2CompraAgilDate } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-date.util';

describe('normalizeV2CompraAgilDate', () => {
  it('preserves the raw value and respects an explicit ISO offset', () => {
    const result = normalizeV2CompraAgilDate('2026-06-30T12:00:00-04:00');

    expect(result.raw).toBe('2026-06-30T12:00:00-04:00');
    expect(result.value?.toISOString()).toBe('2026-06-30T16:00:00.000Z');
  });

  it('interprets offset-free ISO input in America/Santiago', () => {
    const result = normalizeV2CompraAgilDate('2026-06-01T09:30:00');

    expect(result.raw).toBe('2026-06-01T09:30:00');
    expect(result.value?.toISOString()).toBe('2026-06-01T13:30:00.000Z');
  });

  it.each([['not-a-date'], [null]])(
    'keeps invalid or null input auditable without a timestamp',
    (input) => {
      const result = normalizeV2CompraAgilDate(input);

      expect(result.value).toBeNull();
      expect(result.raw).toBe(input);
    },
  );
});
