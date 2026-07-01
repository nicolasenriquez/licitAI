import { normalizeLicitacionType } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-licitacion-type.util';

describe('normalizeLicitacionType', () => {
  it('should map known licitacion type codes to canonical values', () => {
    expect(normalizeLicitacionType('LP')).toBe('licitacion_publica');
    expect(normalizeLicitacionType(' le ')).toBe('licitacion_especial');
  });

  it('should preserve unknown and blank raw types as unknown_raw_type', () => {
    expect(normalizeLicitacionType('ZZ')).toBe('unknown_raw_type');
    expect(normalizeLicitacionType('')).toBe('unknown_raw_type');
    expect(normalizeLicitacionType(null)).toBe('unknown_raw_type');
  });
});
