import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { normalizeV2CompraAgilDate } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-date.util';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

export type NormalizedV2CompraAgilRecord = {
  title: string | null;
  stateCode: string | null;
  stateLabel: string | null;
  buyerCode: string | null;
  buyerName: string | null;
  region: number | null;
  publishedAt: Date | null;
  closingAt: Date | null;
  providerChangedAt: Date | null;
  providerChangedAtRaw: string | null;
  stateId: string | null;
  amount: string | null;
  currency: string | null;
  documentCount: number | null;
};

const toDecimalString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  return coerceToNullableString(value);
};

export const normalizeV2CompraAgilRecord = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): NormalizedV2CompraAgilRecord => {
  const state = record.estado;
  const stateCode =
    typeof state === 'string' ? state : coerceToNullableString(state?.codigo);
  const stateId =
    typeof state === 'object' ? coerceToNullableString(state?.id_estado) : null;
  const stateLabel =
    typeof state === 'object'
      ? coerceToNullableString(state?.glosa)
      : stateCode;
  const institution = record.institucion;
  const dates = record.fechas;
  const providerChangedAt = normalizeV2CompraAgilDate(
    dates?.fecha_ultimo_cambio,
  );
  const amount =
    record.montos?.monto_disponible ?? record.montos?.monto_disponible_clp;

  return {
    title: coerceToNullableString(record.nombre),
    stateCode,
    stateLabel,
    buyerCode: coerceToNullableString(institution?.rut),
    buyerName: coerceToNullableString(institution?.organismo_comprador),
    region:
      typeof institution?.region === 'number'
        ? institution.region
        : typeof record.region === 'number'
          ? record.region
          : null,
    publishedAt: normalizeV2CompraAgilDate(
      dates?.fecha_publicacion ?? record.publicado_desde,
    ).value,
    closingAt: normalizeV2CompraAgilDate(
      dates?.fecha_cierre ?? record.publicado_hasta,
    ).value,
    providerChangedAt: providerChangedAt.value,
    providerChangedAtRaw: providerChangedAt.raw,
    stateId,
    amount: toDecimalString(amount),
    currency: coerceToNullableString(record.montos?.moneda),
    documentCount: Array.isArray(record.documentos)
      ? record.documentos.length
      : null,
  };
};
