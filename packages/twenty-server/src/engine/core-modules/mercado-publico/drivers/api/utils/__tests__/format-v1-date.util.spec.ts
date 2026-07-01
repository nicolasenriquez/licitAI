import { formatV1Date } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/format-v1-date.util';

describe('formatV1Date', () => {
  it('should format first day of year as ddmmaaaa', () => {
    expect(formatV1Date(new Date(Date.UTC(2026, 0, 1)))).toBe('01012026');
  });

  it('should format single-digit day and month with leading zeros', () => {
    expect(formatV1Date(new Date(Date.UTC(2026, 2, 7)))).toBe('07032026');
  });

  it('should format double-digit day and month without extra padding', () => {
    expect(formatV1Date(new Date(Date.UTC(2026, 11, 31)))).toBe('31122026');
  });

  it('should format mid-month date', () => {
    expect(formatV1Date(new Date(Date.UTC(2026, 5, 15)))).toBe('15062026');
  });

  it('should format february 29 in leap year', () => {
    expect(formatV1Date(new Date(Date.UTC(2024, 1, 29)))).toBe('29022024');
  });

  it('should format march 1 in non-leap year', () => {
    expect(formatV1Date(new Date(Date.UTC(2023, 2, 1)))).toBe('01032023');
  });

  it('should throw when input is invalid date', () => {
    expect(() => formatV1Date(new Date('invalid'))).toThrow(RangeError);
  });
});
