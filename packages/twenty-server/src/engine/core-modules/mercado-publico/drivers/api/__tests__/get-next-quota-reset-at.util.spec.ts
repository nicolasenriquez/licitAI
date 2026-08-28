import { getNextQuotaResetAt } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/get-next-quota-reset-at.util';

describe('getNextQuotaResetAt', () => {
  it('returns the next midnight in the given timezone as UTC', () => {
    const resetAt = getNextQuotaResetAt(
      'America/Santiago',
      new Date('2026-08-14T12:00:00.000Z'),
    );

    expect(resetAt.toISOString()).toBe('2026-08-15T04:00:00.000Z');
  });

  it('handles daylight saving boundaries when crossing midnight', () => {
    const resetAt = getNextQuotaResetAt(
      'America/Santiago',
      new Date('2026-09-06T20:00:00.000Z'),
    );

    expect(resetAt.toISOString()).toBe('2026-09-07T03:00:00.000Z');
  });

  it('returns a UTC-aligned midnight for a UTC timezone', () => {
    const resetAt = getNextQuotaResetAt(
      'UTC',
      new Date('2026-08-14T12:00:00.000Z'),
    );

    expect(resetAt.toISOString()).toBe('2026-08-15T00:00:00.000Z');
  });
});
