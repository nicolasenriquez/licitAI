import { parseRetryAfterSeconds } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/parse-retry-after-seconds.util';

describe('parseRetryAfterSeconds', () => {
  it('parses delta-seconds from a provider header', () => {
    expect(parseRetryAfterSeconds('120')).toBe(120);
  });

  it('parses an HTTP date relative to the current time', () => {
    const nowMs = Date.parse('Wed, 01 Jan 2025 00:00:00 GMT');

    expect(parseRetryAfterSeconds('Wed, 01 Jan 2025 00:01:30 GMT', nowMs)).toBe(
      90,
    );
  });

  it('rejects malformed and negative values', () => {
    expect(parseRetryAfterSeconds('not-a-date')).toBeNull();
    expect(parseRetryAfterSeconds(-1)).toBeNull();
  });
});
