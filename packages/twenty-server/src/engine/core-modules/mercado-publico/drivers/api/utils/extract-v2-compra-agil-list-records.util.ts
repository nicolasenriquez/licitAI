import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

const PREFERRED_ARRAY_KEYS = [
  'Items',
  'Data',
  'Resultados',
  'Listado',
  'Lista',
];

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isV2CompraAgilRecord = (
  value: unknown,
): value is MercadoPublicoApiV2CompraAgilRecord => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return isNonEmptyString(coerceToNullableString(value.codigo));
};

const extractRecordArray = (
  value: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isV2CompraAgilRecord);
};

const recursivelyExtractRecords = (
  value: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  const directArrayRecords = extractRecordArray(value);

  if (directArrayRecords.length > 0) {
    return directArrayRecords;
  }

  if (!isObjectRecord(value)) {
    return [];
  }

  for (const preferredArrayKey of PREFERRED_ARRAY_KEYS) {
    const preferredArrayRecords = extractRecordArray(
      value[preferredArrayKey],
    );

    if (preferredArrayRecords.length > 0) {
      return preferredArrayRecords;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nestedRecords = recursivelyExtractRecords(nestedValue);

    if (nestedRecords.length > 0) {
      return nestedRecords;
    }
  }

  return [];
};

export const extractV2CompraAgilListRecords = (
  payload: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  const records = recursivelyExtractRecords(payload);

  if (records.length > 0) {
    return records;
  }

  if (isV2CompraAgilRecord(payload)) {
    return [payload];
  }

  return [];
};
