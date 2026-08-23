import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';

export type MercadoPublicoV2ContractIssue = {
  code: 'duplicate_codigo' | 'invalid_field';
  indices: number[];
  paths?: string[];
};

export type MercadoPublicoV2CompraAgilDecodeResult = {
  records: MercadoPublicoApiV2CompraAgilRecord[];
  recordsFetched: number | null;
  recordsAccepted: number | null;
  recordsRejected: number | null;
  contractIssues: MercadoPublicoV2ContractIssue[];
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

  const hasValidCodigo = isNonEmptyString(value.codigo);
  let valid = hasValidCodigo;
  const invalidPaths: string[] = [];

  if (!hasValidCodigo) {
    invalidPaths.push(`${path}.codigo`);
  }

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
  recordsFetched: null,
  recordsAccepted: null,
  recordsRejected: null,
  contractIssues: [],
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
  const firstIndexByCodigo = new Map<string, number>();
  const duplicateCodigoIndices = new Set<number>();

  for (const [index, item] of items.entries()) {
    if (!validations[index].valid || !isObjectRecord(item)) {
      continue;
    }

    const codigo = item.codigo;

    if (!isNonEmptyString(codigo)) {
      continue;
    }

    const firstIndex = firstIndexByCodigo.get(codigo);

    if (firstIndex === undefined) {
      firstIndexByCodigo.set(codigo, index);
      continue;
    }

    duplicateCodigoIndices.add(firstIndex);
    duplicateCodigoIndices.add(index);
  }

  if (invalidIndices.length > 0 || duplicateCodigoIndices.size > 0) {
    const invalidPaths = validations.flatMap(
      (validation) => validation.invalidPaths,
    );
    const rejectedIndices = [
      ...new Set([...invalidIndices, ...duplicateCodigoIndices]),
    ].sort((left, right) => left - right);
    const contractIssues: MercadoPublicoV2ContractIssue[] = [];

    if (invalidIndices.length > 0) {
      contractIssues.push({
        code: 'invalid_field',
        indices: invalidIndices,
        ...(invalidPaths.length === 0 ? {} : { paths: invalidPaths }),
      });
    }

    if (duplicateCodigoIndices.size > 0) {
      contractIssues.push({
        code: 'duplicate_codigo',
        indices: [...duplicateCodigoIndices].sort(
          (left, right) => left - right,
        ),
      });
    }

    const invalidPathSummary =
      invalidPaths.length === 0
        ? ''
        : `; invalidPaths=[${invalidPaths.join(',')}]`;
    const duplicateCodigoSummary =
      duplicateCodigoIndices.size === 0
        ? ''
        : `; duplicateCodigoIndices=[${[...duplicateCodigoIndices].sort((left, right) => left - right).join(',')}]`;

    return {
      records: [],
      recordsFetched: items.length,
      recordsAccepted: 0,
      recordsRejected: items.length,
      contractIssues,
      errorCode: 'invalid_list_items',
      errorMessage: `Compra Agil V2 LIST contract invalid: itemCount=${items.length}; invalidItemCount=${rejectedIndices.length}; invalidIndices=[${rejectedIndices.join(',')}]${invalidPathSummary}${duplicateCodigoSummary}`,
    };
  }

  return {
    records: items as MercadoPublicoApiV2CompraAgilRecord[],
    recordsFetched: items.length,
    recordsAccepted: items.length,
    recordsRejected: 0,
    contractIssues: [],
  };
};

export const decodeV2CompraAgilDetailPayload = (
  payload: unknown,
): MercadoPublicoV2CompraAgilDecodeResult => {
  if (!isObjectRecord(payload) || !('payload' in payload)) {
    return invalidEnvelope('detail');
  }

  const validation = validateV2CompraAgilRecord(payload.payload, 'payload');

  if (!validation.valid) {
    return {
      records: [],
      recordsFetched: 1,
      recordsAccepted: 0,
      recordsRejected: 1,
      contractIssues: [
        {
          code: 'invalid_field',
          indices: [0],
          ...(validation.invalidPaths.length === 0
            ? {}
            : { paths: validation.invalidPaths }),
        },
      ],
      errorCode: 'invalid_detail_envelope',
      errorMessage:
        'Compra Agil V2 DETAIL contract invalid: payload does not match the documented shape',
    };
  }

  return {
    records: [payload.payload as MercadoPublicoApiV2CompraAgilRecord],
    recordsFetched: 1,
    recordsAccepted: 1,
    recordsRejected: 0,
    contractIssues: [],
  };
};

export const extractV2CompraAgilListRecords = (
  payload: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  return decodeV2CompraAgilListPayload(payload).records;
};
