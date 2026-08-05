import { redactMercadoPublicoRequestParams } from 'src/engine/core-modules/mercado-publico/utils/redact-mercado-publico-request-params.util';

describe('redactMercadoPublicoRequestParams', () => {
  it('redacts sensitive keys at any depth and recurses into arrays', () => {
    const result = redactMercadoPublicoRequestParams({
      ticket: 'abc123',
      query: { token: 'x', lista: [{ valor: 1 }] },
    });

    expect(result).toEqual({
      ticket: '[REDACTED]',
      query: { token: '[REDACTED]', lista: [{ valor: 1 }] },
    });
  });

  it('redacts val/value fields under a sensitive key marker', () => {
    const result = redactMercadoPublicoRequestParams({
      params: { key: 'authorization', val: 'secret' },
    });

    expect(result).toEqual({
      params: { key: 'authorization', val: '[REDACTED]' },
    });
  });

  it('passes through primitives, nulls and plain names untouched', () => {
    expect(redactMercadoPublicoRequestParams(null)).toBeNull();
    expect(redactMercadoPublicoRequestParams('plain')).toBe('plain');
    expect(
      redactMercadoPublicoRequestParams({ key: 'rut', val: '1-9' }),
    ).toEqual({
      key: 'rut',
      val: '1-9',
    });
  });
});
