import { Temporal } from 'temporal-polyfill';

import { serializeMercadoPublicoDateEndOfDay } from '@/mercado-publico/hooks/mercadoPublicoQueryHelpers';

describe('serializeMercadoPublicoDateEndOfDay', () => {
  it('keeps the full selected Chilean calendar day, including a DST transition', () => {
    const value = serializeMercadoPublicoDateEndOfDay(
      '2026-04-04',
      'America/Santiago',
    );
    const zoned = Temporal.Instant.from(value as string).toZonedDateTimeISO(
      'America/Santiago',
    );

    expect(zoned.toPlainDate().toString()).toBe('2026-04-04');
    expect(zoned.toPlainTime().toString()).toBe('23:59:59.999');
  });

  it('preserves full timestamp input', () => {
    expect(
      serializeMercadoPublicoDateEndOfDay(
        '2026-04-04T12:00:00.000Z',
        'America/Santiago',
      ),
    ).toBe('2026-04-04T12:00:00.000Z');
  });
});
