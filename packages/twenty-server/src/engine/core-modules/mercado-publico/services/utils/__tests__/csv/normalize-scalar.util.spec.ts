import {
  normalizeNullLike,
  normalizeDecimal,
  normalizeDate,
} from 'src/engine/core-modules/mercado-publico/services/utils/csv/normalize-scalar.util';

describe('normalizeNullLike', () => {
  it('should return null for NA', () => {
    expect(normalizeNullLike('NA')).toBeNull();
  });

  it('should return null for na (case-insensitive)', () => {
    expect(normalizeNullLike('na')).toBeNull();
  });

  it('should return null for Na (mixed case)', () => {
    expect(normalizeNullLike('Na')).toBeNull();
  });

  it('should return null for n/a (lowercase)', () => {
    expect(normalizeNullLike('n/a')).toBeNull();
  });

  it('should return null for N/A (uppercase)', () => {
    expect(normalizeNullLike('N/A')).toBeNull();
  });

  it('should return null for null (lowercase)', () => {
    expect(normalizeNullLike('null')).toBeNull();
  });

  it('should return null for NULL (uppercase)', () => {
    expect(normalizeNullLike('NULL')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(normalizeNullLike('')).toBeNull();
  });

  it('should return null for whitespace-only', () => {
    expect(normalizeNullLike('   ')).toBeNull();
  });

  it('should return null for tab-only', () => {
    expect(normalizeNullLike('\t')).toBeNull();
  });

  it('should return trimmed value for non-null-like with whitespace', () => {
    expect(normalizeNullLike('  hello  ')).toBe('hello');
  });

  it('should return original string for non-null-like with content', () => {
    expect(normalizeNullLike('Aceptada')).toBe('Aceptada');
  });

  it('should return numeric string unchanged', () => {
    expect(normalizeNullLike('12345')).toBe('12345');
  });

  it('should return comma decimal string unchanged', () => {
    expect(normalizeNullLike('1,5')).toBe('1,5');
  });

  it('should return date string unchanged', () => {
    expect(normalizeNullLike('1900-01-01')).toBe('1900-01-01');
  });

  it('should not treat 0 as null-like', () => {
    expect(normalizeNullLike('0')).toBe('0');
  });

  it('should not treat false as null-like', () => {
    expect(normalizeNullLike('false')).toBe('false');
  });
});

describe('normalizeDecimal', () => {
  it('should parse comma decimal into number', () => {
    const result = normalizeDecimal('20700794,94');

    expect(result.value).toBe(20700794.94);
    expect(result.parseError).toBeNull();
  });

  it('should parse small comma decimal', () => {
    const result = normalizeDecimal('0,1');

    expect(result.value).toBe(0.1);
    expect(result.parseError).toBeNull();
  });

  it('should parse integer string without comma', () => {
    const result = normalizeDecimal('12345');

    expect(result.value).toBe(12345);
    expect(result.parseError).toBeNull();
  });

  it('should parse negative comma decimal', () => {
    const result = normalizeDecimal('-1,5');

    expect(result.value).toBe(-1.5);
    expect(result.parseError).toBeNull();
  });

  it('should return null value with parseError for non-numeric', () => {
    const result = normalizeDecimal('abc');

    expect(result.value).toBeNull();
    expect(result.parseError).toBe('not_numeric');
  });

  it('should return null value for empty string', () => {
    const result = normalizeDecimal('');

    expect(result.value).toBeNull();
    expect(result.parseError).toBeNull();
  });

  it('should return null value for NA', () => {
    const result = normalizeDecimal('NA');

    expect(result.value).toBeNull();
    expect(result.parseError).toBeNull();
  });

  it('should return null value for na (case-insensitive)', () => {
    const result = normalizeDecimal('na');

    expect(result.value).toBeNull();
    expect(result.parseError).toBeNull();
  });

  it('should return null value for whitespace-only', () => {
    const result = normalizeDecimal('   ');

    expect(result.value).toBeNull();
    expect(result.parseError).toBeNull();
  });

  it('should record parseError for multiple commas', () => {
    const result = normalizeDecimal('1,2,3');

    expect(result.value).toBeNull();
    expect(result.parseError).toBe('multiple_commas');
  });
});

describe('normalizeDate', () => {
  it('should parse YYYY-MM-DD date', () => {
    const result = normalizeDate('2026-06-15');

    expect(result.value).toBeInstanceOf(Date);
    expect(result.value!.getFullYear()).toBe(2026);
    expect(result.value!.getMonth()).toBe(5);
    expect(result.value!.getDate()).toBe(15);
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBeNull();
  });

  it('should mark 1900-01-01 as sentinel with null value', () => {
    const result = normalizeDate('1900-01-01');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(true);
    expect(result.parseError).toBeNull();
  });

  it('should parse date outside file month without assuming file month', () => {
    const result = normalizeDate('2026-05-20');

    expect(result.value).toBeInstanceOf(Date);
    expect(result.value!.getFullYear()).toBe(2026);
    expect(result.value!.getMonth()).toBe(4);
    expect(result.value!.getDate()).toBe(20);
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBeNull();
  });

  it('should return parseError for invalid date string', () => {
    const result = normalizeDate('not-a-date');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBe('invalid_format');
  });

  it('should return parseError for malformed date (wrong separator)', () => {
    const result = normalizeDate('2026/06/15');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBe('invalid_format');
  });

  it('should return null value without error for NA', () => {
    const result = normalizeDate('NA');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBeNull();
  });

  it('should return null value without error for empty', () => {
    const result = normalizeDate('');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBeNull();
  });

  it('should return null value without error for whitespace', () => {
    const result = normalizeDate('   ');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBeNull();
  });

  it('should return null value without error for n/a', () => {
    const result = normalizeDate('n/a');

    expect(result.value).toBeNull();
    expect(result.isSentinel1900).toBe(false);
    expect(result.parseError).toBeNull();
  });
});
