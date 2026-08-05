import { isNonEmptyString } from '@sniptt/guards';

import {
  type MercadoPublicoApiV2CompraAgilPagination,
  type MercadoPublicoApiV2CompraAgilRecord,
} from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
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

export type MercadoPublicoV2CompraAgilCanonicalFields = {
  buyerRut: string | null;
  purchaseUnitName: string | null;
  regionName: string | null;
  amountAvailableClp: number | null;
  callStage: 'first_call' | 'second_call' | null;
  documentCount: number | null;
  offersReceivedCount: number | null;
};

const extractCallStage = (
  value: unknown,
): MercadoPublicoV2CompraAgilCanonicalFields['callStage'] => {
  const normalized = coerceToNullableString(value)
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (normalized === undefined || normalized === null) {
    return null;
  }

  if (/(?:primer|1(?:er|ro)?|first)\s+llamad/.test(normalized)) {
    return 'first_call';
  }

  if (/(?:segundo|2do|second)\s+llamad/.test(normalized)) {
    return 'second_call';
  }

  return null;
};

const extractFiniteNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const extractNonNegativeInteger = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;
};

export const extractV2CompraAgilCanonicalFields = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): MercadoPublicoV2CompraAgilCanonicalFields => {
  return {
    buyerRut: coerceToNullableString(record.institucion?.rut),
    purchaseUnitName: coerceToNullableString(record.institucion?.unidad_compra),
    regionName: coerceToNullableString(record.institucion?.nombre_region),
    amountAvailableClp: extractFiniteNumber(
      record.montos?.monto_disponible_clp,
    ),
    callStage: extractCallStage(record.convocatoria?.descripcion),
    documentCount: Array.isArray(record.documentos)
      ? record.documentos.length
      : null,
    offersReceivedCount: extractNonNegativeInteger(
      record.resumen?.total_ofertas_recibidas,
    ),
  };
};

const extractRecordArray = (
  value: unknown,
): MercadoPublicoApiV2CompraAgilRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isV2CompraAgilRecord).map(normalizeV2CompraAgilRecord);
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

export const findV2CompraAgilRawRecord = (
  payload: unknown,
  codigo: string,
): MercadoPublicoApiV2CompraAgilRecord | null => {
  if (isV2CompraAgilRecord(payload) && payload.codigo === codigo) {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const value of payload) {
      const record = findV2CompraAgilRawRecord(value, codigo);

      if (record !== null) {
        return record;
      }
    }

    return null;
  }

  if (!isObjectRecord(payload)) {
    return null;
  }

  for (const value of Object.values(payload)) {
    const record = findV2CompraAgilRawRecord(value, codigo);

    if (record !== null) {
      return record;
    }
  }

  return null;
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

export const extractV2CompraAgilPagination = (
  payload: unknown,
): MercadoPublicoApiV2CompraAgilPagination | null => {
  if (!isObjectRecord(payload)) {
    return null;
  }

  const envelope = isObjectRecord(payload.payload) ? payload.payload : payload;
  const pagination = isObjectRecord(envelope.paginacion)
    ? envelope.paginacion
    : null;

  if (pagination === null) {
    return null;
  }

  const page = coerceToNullableInteger(pagination.numero_pagina);
  const pageSize = coerceToNullableInteger(pagination.tamano_pagina);
  const totalPages = coerceToNullableInteger(pagination.total_paginas);
  const totalResults = coerceToNullableInteger(pagination.total_resultados);

  if (
    page === null ||
    pageSize === null ||
    totalPages === null ||
    totalResults === null
  ) {
    return null;
  }

  return { page, pageSize, totalPages, totalResults };
};
