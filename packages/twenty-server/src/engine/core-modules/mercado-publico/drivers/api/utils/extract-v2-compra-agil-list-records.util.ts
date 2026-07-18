import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

const PREFERRED_ARRAY_KEYS = [
  'items',
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

const coerceToNullableInteger = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const nullableString = coerceToNullableString(value);

  if (nullableString === null) {
    return null;
  }

  const numericValue =
    typeof value === 'number' ? value : Number(nullableString);

  return Number.isInteger(numericValue) ? numericValue : null;
};

const extractRecordArray = (
  value: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isV2CompraAgilRecord).map(normalizeV2CompraAgilRecord);
};

const normalizeV2CompraAgilRecord = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): MercadoPublicoApiV2CompraAgilRecord => {
  const estado =
    typeof record.estado === 'string'
      ? record.estado
      : (coerceToNullableString(record.estado?.codigo) ??
        coerceToNullableString(record.estado?.glosa) ??
        undefined);
  const fechas = record.fechas;
  const institucion = record.institucion;
  const region = coerceToNullableInteger(institucion?.region) ?? record.region;
  const fechaPublicacion =
    coerceToNullableString(fechas?.fecha_publicacion) ??
    coerceToNullableString(record.fecha_publicacion);
  const fechaCierre =
    coerceToNullableString(fechas?.fecha_cierre) ??
    coerceToNullableString(record.fecha_cierre);
  const fechaUltimoCambio =
    coerceToNullableString(fechas?.fecha_ultimo_cambio) ??
    coerceToNullableString(record.fecha_ultimo_cambio);

  return {
    ...record,
    estado,
    ...(region !== undefined ? { region } : {}),
    ...(fechaPublicacion !== null
      ? { fecha_publicacion: fechaPublicacion }
      : {}),
    ...(fechaCierre !== null ? { fecha_cierre: fechaCierre } : {}),
    ...(fechaUltimoCambio !== null
      ? { fecha_ultimo_cambio: fechaUltimoCambio }
      : {}),
  };
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

  if (isV2CompraAgilRecord(value)) {
    return [normalizeV2CompraAgilRecord(value)];
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

export const extractV2CompraAgilListRecords = (
  payload: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  const records = recursivelyExtractRecords(payload);

  if (records.length > 0) {
    return records;
  }

  if (isV2CompraAgilRecord(payload)) {
    return [normalizeV2CompraAgilRecord(payload)];
  }

  return [];
};
