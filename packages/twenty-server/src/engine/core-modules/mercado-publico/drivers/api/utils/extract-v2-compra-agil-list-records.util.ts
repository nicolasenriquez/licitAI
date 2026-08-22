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

const isV2CompraAgilRecord = (
  value: unknown,
): value is MercadoPublicoApiV2CompraAgilRecord => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return isNonEmptyString(value.codigo);
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

  const invalidIndices = items.flatMap((item, index) =>
    isV2CompraAgilRecord(item) ? [] : [index],
  );

  if (invalidIndices.length > 0) {
    return {
      records: [],
      errorCode: 'invalid_list_items',
      errorMessage: `Compra Agil V2 LIST contract invalid: itemCount=${items.length}; invalidItemCount=${invalidIndices.length}; invalidIndices=[${invalidIndices.join(',')}]`,
    };
  }

  return { records: items };
};

export const decodeV2CompraAgilDetailPayload = (
  payload: unknown,
): MercadoPublicoV2CompraAgilDecodeResult => {
  if (!isObjectRecord(payload) || !isV2CompraAgilRecord(payload.payload)) {
    return invalidEnvelope('detail');
  }

  return { records: [payload.payload] };
};

export const extractV2CompraAgilListRecords = (
  payload: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  return decodeV2CompraAgilListPayload(payload).records;
};
