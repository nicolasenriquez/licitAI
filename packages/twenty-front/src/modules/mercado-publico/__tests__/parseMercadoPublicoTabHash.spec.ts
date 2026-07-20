import { parseMercadoPublicoTabHash } from '@/modules/mercado-publico/utils/parseMercadoPublicoTabHash';

describe('parseMercadoPublicoTabHash', () => {
  it('should return compra-agil for undefined hash', () => {
    expect(parseMercadoPublicoTabHash(undefined)).toBe('compra-agil');
  });

  it('should return compra-agil for empty string', () => {
    expect(parseMercadoPublicoTabHash('')).toBe('compra-agil');
  });

  it('should return compra-agil for unknown hash', () => {
    expect(parseMercadoPublicoTabHash('unknown')).toBe('compra-agil');
  });

  it('should return compra-agil for hash starting with compra-agil', () => {
    expect(parseMercadoPublicoTabHash('compra-agil')).toBe('compra-agil');
  });

  it('should return licitaciones for valid hash', () => {
    expect(parseMercadoPublicoTabHash('licitaciones')).toBe('licitaciones');
  });

  it('should return centro-de-control for valid hash', () => {
    expect(parseMercadoPublicoTabHash('centro-de-control')).toBe(
      'centro-de-control',
    );
  });
});
