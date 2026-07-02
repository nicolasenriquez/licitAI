import { parseCsvLine } from 'src/engine/core-modules/mercado-publico/services/utils/csv/parse-csv-line.util';

describe('parseCsvLine', () => {
  it('should parse semicolon-delimited line', () => {
    const result = parseCsvLine('OC-1;2026-06-15;Aceptada', ';', null);

    expect(result.parseError).toBeNull();
    expect(result.values).toEqual(['OC-1', '2026-06-15', 'Aceptada']);
  });

  it('should handle quoted field containing delimiter', () => {
    const result = parseCsvLine(
      'X;"Total;IVA";Estado',
      ';',
      '"',
    );

    expect(result.parseError).toBeNull();
    expect(result.values).toEqual(['X', 'Total;IVA', 'Estado']);
  });

  it('should handle escaped double-quotes', () => {
    const result = parseCsvLine(
      'a;"""hello"" world";c',
      ';',
      '"',
    );

    expect(result.parseError).toBeNull();
    expect(result.values).toEqual(['a', '"hello" world', 'c']);
  });

  it('should parse comma-delimited line', () => {
    const result = parseCsvLine('OC-1,2026-06-15,Aceptada', ',', null);

    expect(result.parseError).toBeNull();
    expect(result.values).toEqual(['OC-1', '2026-06-15', 'Aceptada']);
  });

  it('should return error for malformed quote', () => {
    const result = parseCsvLine(
      'a;"unclosed quote;c',
      ';',
      '"',
    );

    expect(result.parseError).not.toBeNull();
    expect(result.values).toBeNull();
  });

  it('should return empty_line for whitespace-only line', () => {
    const result = parseCsvLine('   ', ';', null);

    expect(result.parseError).toBe('empty_line');
    expect(result.values).toBeNull();
  });

  it('should preserve comma decimal value as raw text', () => {
    const result = parseCsvLine(
      'OC-1;"20700794,94";Aceptada',
      ';',
      '"',
    );

    expect(result.parseError).toBeNull();
    expect(result.values).toEqual(['OC-1', '20700794,94', 'Aceptada']);
  });
});
