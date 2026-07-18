import { validateCompraAgilListParams } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';

describe('validateCompraAgilListParams', () => {
  it('should return no errors when params are within documented bounds', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 25,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should return no errors when tamano_pagina is exactly 10', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 10,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should return error when tamano_pagina is below 10', () => {
    expect(
      validateCompraAgilListParams({ tamano_pagina: 9, numero_pagina: 1 }),
    ).toEqual([{ field: 'tamano_pagina', code: 'out_of_range' }]);

    expect(
      validateCompraAgilListParams({ tamano_pagina: 1, numero_pagina: 1 }),
    ).toEqual([{ field: 'tamano_pagina', code: 'out_of_range' }]);
  });

  it('should return no errors when tamano_pagina is exactly 50', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 50,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should return error when tamano_pagina exceeds 50', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 51,
      numero_pagina: 1,
    });

    expect(errors).toEqual([{ field: 'tamano_pagina', code: 'exceeds_max' }]);
  });

  it('should return error when tamano_pagina is zero or negative', () => {
    expect(
      validateCompraAgilListParams({ tamano_pagina: 0, numero_pagina: 1 }),
    ).toEqual([{ field: 'tamano_pagina', code: 'out_of_range' }]);

    expect(
      validateCompraAgilListParams({ tamano_pagina: -5, numero_pagina: 1 }),
    ).toEqual([{ field: 'tamano_pagina', code: 'out_of_range' }]);
  });

  it('should return error when numero_pagina is zero', () => {
    expect(
      validateCompraAgilListParams({ tamano_pagina: 25, numero_pagina: 0 }),
    ).toEqual([{ field: 'numero_pagina', code: 'must_start_at_1' }]);
  });

  it('should return error when numero_pagina is negative', () => {
    expect(
      validateCompraAgilListParams({ tamano_pagina: 25, numero_pagina: -1 }),
    ).toEqual([{ field: 'numero_pagina', code: 'must_start_at_1' }]);
  });

  it('should return error when both id and q are provided', () => {
    const errors = validateCompraAgilListParams({
      id: 'ABC123',
      q: 'search text',
      tamano_pagina: 25,
      numero_pagina: 1,
    });

    expect(errors).toEqual([{ field: 'id_q', code: 'mutually_exclusive' }]);
  });

  it('should return no errors when only id is provided', () => {
    const errors = validateCompraAgilListParams({
      id: 'ABC123',
      tamano_pagina: 25,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should return no errors when only q is provided', () => {
    const errors = validateCompraAgilListParams({
      q: 'search text',
      tamano_pagina: 25,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should return no errors when neither id nor q is provided', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 25,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should accumulate multiple errors', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 100,
      numero_pagina: 0,
      id: 'X',
      q: 'Y',
    });

    expect(errors).toHaveLength(3);
    expect(errors).toContainEqual({
      field: 'tamano_pagina',
      code: 'exceeds_max',
    });
    expect(errors).toContainEqual({
      field: 'numero_pagina',
      code: 'must_start_at_1',
    });
    expect(errors).toContainEqual({
      field: 'id_q',
      code: 'mutually_exclusive',
    });
  });

  it('should return no errors for default empty params', () => {
    const errors = validateCompraAgilListParams({});

    expect(errors).toEqual([]);
  });
});
