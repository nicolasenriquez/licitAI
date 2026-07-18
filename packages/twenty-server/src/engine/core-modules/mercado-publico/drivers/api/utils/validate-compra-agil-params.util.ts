export type CompraAgilListParams = {
  id?: string;
  q?: string;
  tamano_pagina?: number;
  numero_pagina?: number;
  ttl_cambio_ms?: number;
  cambio_desde?: string;
  cambio_hasta?: string;
  publicado_desde?: string;
  publicado_hasta?: string;
  estado?: string;
  region?: number;
  ordenar_por?: string;
  orden?: string;
};

export type CompraAgilValidationError = {
  field: string;
  code: string;
};

export const validateCompraAgilListParams = (
  params: CompraAgilListParams,
): CompraAgilValidationError[] => {
  const errors: CompraAgilValidationError[] = [];

  if (
    params.id !== undefined &&
    params.id !== '' &&
    params.q !== undefined &&
    params.q !== ''
  ) {
    errors.push({ field: 'id_q', code: 'mutually_exclusive' });
  }

  if (params.tamano_pagina !== undefined) {
    if (params.tamano_pagina < 10) {
      errors.push({ field: 'tamano_pagina', code: 'out_of_range' });
    } else if (params.tamano_pagina > 50) {
      errors.push({ field: 'tamano_pagina', code: 'exceeds_max' });
    }
  }

  if (params.numero_pagina !== undefined && params.numero_pagina < 1) {
    errors.push({ field: 'numero_pagina', code: 'must_start_at_1' });
  }

  return errors;
};
