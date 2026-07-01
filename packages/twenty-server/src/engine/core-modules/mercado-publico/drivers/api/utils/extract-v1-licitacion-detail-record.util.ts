import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV1LicitacionRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v1-licitacion-record.type';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';
import { extractV1LicitacionesListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v1-licitaciones-list-records.util';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isLicitacionDetailRecord = (
  value: unknown,
): value is MercadoPublicoApiV1LicitacionRecord => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return isNonEmptyString(coerceToNullableString(value.CodigoExterno));
};

export const extractV1LicitacionDetailRecord = (
  codigoExterno: string,
  payload: unknown,
): MercadoPublicoApiV1LicitacionRecord | null => {
  if (!isNonEmptyString(codigoExterno)) {
    return null;
  }

  if (isObjectRecord(payload) && isLicitacionDetailRecord(payload)) {
    const normalizedCodigoExterno = coerceToNullableString(
      payload.CodigoExterno,
    );

    if (normalizedCodigoExterno === codigoExterno) {
      return payload;
    }
  }

  const extractedRecords = extractV1LicitacionesListRecords(payload);

  for (const record of extractedRecords) {
    const normalizedCodigoExterno = coerceToNullableString(
      record.CodigoExterno,
    );

    if (normalizedCodigoExterno === codigoExterno) {
      return record;
    }
  }

  return null;
};
