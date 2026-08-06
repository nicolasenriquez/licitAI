import { extractV2CompraAgilPagination } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-pagination.util';

describe('extractV2CompraAgilPagination', () => {
  it('reads the provider pagination envelope', () => {
    expect(
      extractV2CompraAgilPagination(
        {
          payload: {
            paginacion: {
              numero_pagina: 2,
              tamano_pagina: 50,
              total_paginas: 4,
              total_resultados: 175,
            },
          },
        },
        1,
        15,
        50,
      ),
    ).toEqual({
      pageNumber: 2,
      pageSize: 50,
      totalPages: 4,
      totalResults: 175,
      hasNextPage: true,
    });
  });

  it('uses request metadata and page fullness when the envelope is absent', () => {
    expect(extractV2CompraAgilPagination({}, 3, 50, 4)).toEqual({
      pageNumber: 3,
      pageSize: 50,
      totalPages: null,
      totalResults: null,
      hasNextPage: false,
    });
    expect(extractV2CompraAgilPagination({}, 3, 50, 50).hasNextPage).toBe(true);
  });
});
