import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';

export type MercadoPublicoV2CompraAgilDecodeResult = {
  records: MercadoPublicoApiV2CompraAgilRecord[];
  errorCode?: string;
  errorMessage?: string;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const OBJECT_FIELDS = [
  'institucion',
  'fechas',
  'convocatoria',
  'montos',
  'presupuesto',
  'entrega',
  'resumen',
  'motivos',
  'flags',
  'orden_compra',
] as const;

const ARRAY_FIELDS = [
  'documentos',
  'productos_solicitados',
  'proveedores_cotizando',
] as const;

type RecordValidation = {
  valid: boolean;
  invalidPaths: string[];
};

const validateV2CompraAgilRecord = (
  value: unknown,
  path: string,
): RecordValidation => {
  if (!isObjectRecord(value)) {
    return { valid: false, invalidPaths: [path] };
  }

  let valid = isNonEmptyString(value.codigo);
  const invalidPaths: string[] = [];

  for (const field of OBJECT_FIELDS) {
    const fieldValue = value[field];

    if (
      fieldValue !== undefined &&
      fieldValue !== null &&
      !isObjectRecord(fieldValue)
    ) {
      valid = false;
      invalidPaths.push(`${path}.${field}`);
    }
  }

  if (
    value.estado !== undefined &&
    value.estado !== null &&
    typeof value.estado !== 'string' &&
    !isObjectRecord(value.estado)
  ) {
    valid = false;
    invalidPaths.push(`${path}.estado`);
  }

  for (const field of ARRAY_FIELDS) {
    const fieldValue = value[field];

    if (fieldValue === undefined || fieldValue === null) {
      continue;
    }

    if (!Array.isArray(fieldValue)) {
      valid = false;
      invalidPaths.push(`${path}.${field}`);
      continue;
    }

    for (const [index, item] of fieldValue.entries()) {
      if (!isObjectRecord(item)) {
        valid = false;
        invalidPaths.push(`${path}.${field}[${index}]`);
      }
    }
  }

  if (Array.isArray(value.proveedores_cotizando)) {
    for (const [
      providerIndex,
      provider,
    ] of value.proveedores_cotizando.entries()) {
      if (!isObjectRecord(provider)) {
        continue;
      }

      const quotedProducts = provider.productos_cotizados;

      if (quotedProducts === undefined || quotedProducts === null) {
        continue;
      }

      if (!Array.isArray(quotedProducts)) {
        valid = false;
        invalidPaths.push(
          `${path}.proveedores_cotizando[${providerIndex}].productos_cotizados`,
        );
        continue;
      }

      for (const [productIndex, product] of quotedProducts.entries()) {
        if (!isObjectRecord(product)) {
          valid = false;
          invalidPaths.push(
            `${path}.proveedores_cotizando[${providerIndex}].productos_cotizados[${productIndex}]`,
          );
        }
      }
    }
  }

  return { valid, invalidPaths };
};

const invalidEnvelope = (
  endpoint: 'list' | 'detail',
): MercadoPublicoV2CompraAgilDecodeResult => ({
  records: [],
  errorCode: `invalid_${endpoint}_envelope`,
  errorMessage: `Compra Agil V2 ${endpoint.toUpperCase()} contract invalid: envelope does not match the documented shape`,
});

export const decodeV2CompraAgilListPayload = (
  payload: unknown,
): MercadoPublicoV2CompraAgilDecodeResult => {
  if (!isObjectRecord(payload) || !isObjectRecord(payload.payload)) {
    return invalidEnvelope('list');
  }

  const items = payload.payload.items;

  if (!Array.isArray(items)) {
    return invalidEnvelope('list');
  }

  const validations = items.map((item, index) =>
    validateV2CompraAgilRecord(item, `[${index}]`),
  );
  const invalidIndices = validations.flatMap((validation, index) =>
    validation.valid ? [] : [index],
  );

  if (invalidIndices.length > 0) {
    const invalidPaths = validations.flatMap(
      (validation) => validation.invalidPaths,
    );
    const invalidPathSummary =
      invalidPaths.length === 0
        ? ''
        : `; invalidPaths=[${invalidPaths.join(',')}]`;

    return {
      records: [],
      errorCode: 'invalid_list_items',
      errorMessage: `Compra Agil V2 LIST contract invalid: itemCount=${items.length}; invalidItemCount=${invalidIndices.length}; invalidIndices=[${invalidIndices.join(',')}]${invalidPathSummary}`,
    };
  }

  return { records: items as MercadoPublicoApiV2CompraAgilRecord[] };
};

export const decodeV2CompraAgilDetailPayload = (
  payload: unknown,
): MercadoPublicoV2CompraAgilDecodeResult => {
  if (
    !isObjectRecord(payload) ||
    !validateV2CompraAgilRecord(payload.payload, 'payload').valid
  ) {
    return invalidEnvelope('detail');
  }

  return {
    records: [payload.payload as MercadoPublicoApiV2CompraAgilRecord],
  };
};

export const extractV2CompraAgilListRecords = (
  payload: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  return decodeV2CompraAgilListPayload(payload).records;
};
