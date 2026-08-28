import { validateCompraAgilListParams } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';

describe('validateCompraAgilListParams', () => {
  it('should return no errors when params are within documented bounds', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 25,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should return no errors when tamano_pagina is exactly 50', () => {
    const errors = validateCompraAgilListParams({
      tamano_pagina: 50,
      numero_pagina: 1,
    });

    expect(errors).toEqual([]);
  });

  it('should accept a one-record smoke-test page', () => {
    expect(
      validateCompraAgilListParams({ tamano_pagina: 1, numero_pagina: 1 }),
    ).toEqual([]);
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

  it('should reject fractional page and region values', () => {
    expect(
      validateCompraAgilListParams({
        tamano_pagina: 10.5,
        numero_pagina: 1.5,
        region: 13.5,
      }),
    ).toEqual([
      { field: 'tamano_pagina', code: 'out_of_range' },
      { field: 'numero_pagina', code: 'must_start_at_1' },
      { field: 'region', code: 'out_of_range' },
    ]);
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

  it('should reject combining ttl_cambio_ms with a change range', () => {
    expect(
      validateCompraAgilListParams({
        ttl_cambio_ms: 5000,
        cambio_desde: '2026-06-01T00:00:00Z',
        cambio_hasta: '2026-06-30T23:59:59Z',
      }),
    ).toEqual([{ field: 'cambio', code: 'mutually_exclusive' }]);
  });

  it('should require both bounds for change and publication ranges', () => {
    expect(
      validateCompraAgilListParams({
        cambio_desde: '2026-06-01T00:00:00Z',
      }),
    ).toContainEqual({
      field: 'cambio_desde/cambio_hasta',
      code: 'range_requires_both',
    });

    expect(
      validateCompraAgilListParams({
        publicado_hasta: '2026-06-30T23:59:59Z',
      }),
    ).toContainEqual({
      field: 'publicado_desde/publicado_hasta',
      code: 'range_requires_both',
    });
  });

  it('should reject malformed and impossible ISO-8601 date-times', () => {
    expect(
      validateCompraAgilListParams({
        publicado_desde: '2026-06-01',
        publicado_hasta: '2026-02-30T23:59:59Z',
      }),
    ).toEqual([
      { field: 'publicado_desde', code: 'invalid_iso8601' },
      { field: 'publicado_hasta', code: 'invalid_iso8601' },
    ]);
  });

  it('should reject a range whose start is after its end', () => {
    expect(
      validateCompraAgilListParams({
        cambio_desde: '2026-06-30T23:59:59Z',
        cambio_hasta: '2026-06-01T00:00:00Z',
      }),
    ).toEqual([
      { field: 'cambio_desde/cambio_hasta', code: 'range_start_after_end' },
    ]);
  });

  it('should accept ISO-8601 date-times with an explicit offset', () => {
    expect(
      validateCompraAgilListParams({
        publicado_desde: '2026-06-01T00:00:00-04:00',
        publicado_hasta: '2026-06-30T23:59:59-04:00',
      }),
    ).toEqual([]);
  });

  it('should accept only official ordering values', () => {
    expect(
      validateCompraAgilListParams({ ordenar_por: 'FechaPublicacion' }),
    ).toEqual([]);

    expect(validateCompraAgilListParams({ ordenar_por: 'created_at' })).toEqual(
      [{ field: 'ordenar_por', code: 'unsupported_value' }],
    );
  });

  it('should reject the undocumented orden parameter', () => {
    expect(validateCompraAgilListParams({ orden: 'asc' } as never)).toEqual([
      { field: 'orden', code: 'unsupported_parameter' },
    ]);
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
