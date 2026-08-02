import { isNonEmptyString } from '@sniptt/guards';

import { DateTime } from 'luxon';

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

const isValidIsoDateTime = (value: string): boolean => {
  return (
    ISO_DATE_TIME_PATTERN.test(value) &&
    DateTime.fromISO(value, { setZone: true }).isValid
  );
};

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
};

export type CompraAgilValidationError = {
  field: string;
  code: string;
};

export const validateCompraAgilListParams = (
  params: CompraAgilListParams,
): CompraAgilValidationError[] => {
  const errors: CompraAgilValidationError[] = [];

  const validateDateRange = (
    from: string | undefined,
    to: string | undefined,
    field: string,
  ): void => {
    const hasFrom = isNonEmptyString(from);
    const hasTo = isNonEmptyString(to);

    if (hasFrom !== hasTo) {
      errors.push({ field, code: 'range_requires_both' });
    }

    if (hasFrom && !isValidIsoDateTime(from)) {
      errors.push({ field: field.split('/')[0], code: 'invalid_iso8601' });
    }

    if (hasTo && !isValidIsoDateTime(to)) {
      errors.push({ field: field.split('/')[1], code: 'invalid_iso8601' });
    }

    if (hasFrom && hasTo) {
      const parsedFrom = DateTime.fromISO(from, { setZone: true });
      const parsedTo = DateTime.fromISO(to, { setZone: true });

      if (parsedFrom.isValid && parsedTo.isValid && parsedFrom > parsedTo) {
        errors.push({ field, code: 'range_start_after_end' });
      }
    }
  };

  if (
    params.id !== undefined &&
    params.id !== '' &&
    params.q !== undefined &&
    params.q !== ''
  ) {
    errors.push({ field: 'id_q', code: 'mutually_exclusive' });
  }

  const hasCambioDesde = isNonEmptyString(params.cambio_desde);
  const hasCambioHasta = isNonEmptyString(params.cambio_hasta);
  const hasTtlCambio = params.ttl_cambio_ms !== undefined;

  if (hasTtlCambio && (hasCambioDesde || hasCambioHasta)) {
    errors.push({ field: 'cambio', code: 'mutually_exclusive' });
  }

  validateDateRange(
    params.cambio_desde,
    params.cambio_hasta,
    'cambio_desde/cambio_hasta',
  );
  validateDateRange(
    params.publicado_desde,
    params.publicado_hasta,
    'publicado_desde/publicado_hasta',
  );

  if (
    params.ttl_cambio_ms !== undefined &&
    (!Number.isInteger(params.ttl_cambio_ms) || params.ttl_cambio_ms <= 0)
  ) {
    errors.push({
      field: 'ttl_cambio_ms',
      code: 'must_be_positive_integer',
    });
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

  if (
    params.ordenar_por !== undefined &&
    params.ordenar_por !== 'FechaUltimaModificacion' &&
    params.ordenar_por !== 'FechaPublicacion'
  ) {
    errors.push({ field: 'ordenar_por', code: 'unsupported_value' });
  }

  return errors;
};
