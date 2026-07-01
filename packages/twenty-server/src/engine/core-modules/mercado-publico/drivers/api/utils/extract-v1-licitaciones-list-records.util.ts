import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV1LicitacionRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v1-licitacion-record.type';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

const PREFERRED_ARRAY_KEYS = [
  'Listado',
  'Lista',
  'Items',
  'Data',
  'Resultados',
];

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isLicitacionRecord = (
  value: unknown,
): value is MercadoPublicoApiV1LicitacionRecord => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return isNonEmptyString(coerceToNullableString(value.CodigoExterno));
};

const extractRecordArray = (
  value: unknown,
): MercadoPublicoApiV1LicitacionRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isLicitacionRecord);
};

const recursivelyExtractRecords = (
  value: unknown,
): MercadoPublicoApiV1LicitacionRecord[] => {
  const directArrayRecords = extractRecordArray(value);

  if (directArrayRecords.length > 0) {
    return directArrayRecords;
  }

  if (!isObjectRecord(value)) {
    return [];
  }

  for (const preferredArrayKey of PREFERRED_ARRAY_KEYS) {
    const preferredArrayRecords = extractRecordArray(value[preferredArrayKey]);

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

export const extractV1LicitacionesListRecords = (
  payload: unknown,
): MercadoPublicoApiV1LicitacionRecord[] => {
  return recursivelyExtractRecords(payload);
};
