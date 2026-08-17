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
  amountRaw: string | null;
  currency: string | null;
  documentCount: number | null;
  description: string | null;
  deliveryAddress: string | null;
  deliveryDays: number | null;
  cancellationAt: Date | null;
  callDescription: string | null;
  callFirstClosingAt: Date | null;
  callSecondClosingAt: Date | null;
  budgetType: string | null;
  budgetEstimate: string | null;
  budgetCurrency: string | null;
  cancelMotive: string | null;
  desertedMotive: string | null;
  selectionMotive: string | null;
  totalOffers: number | null;
  totalDemands: number | null;
  finePenalty: string | null;
};

const coerceToText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  return null;
};

const toDecimalString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return coerceToNullableString(value);
};

const toIntegerOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
};

export const normalizeV2CompraAgilRecord = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): NormalizedV2CompraAgilRecord => {
  const state = record.estado;
  const stateCode =
    typeof state === 'string' ? state : coerceToText(state?.codigo);
  const stateId =
    typeof state === 'object' ? coerceToText(state?.id_estado) : null;
  const stateLabel =
    typeof state === 'object' ? coerceToText(state?.glosa) : stateCode;
  const institution = record.institucion;
  const dates = record.fechas;
  const providerChangedAt = normalizeV2CompraAgilDate(
    dates?.fecha_ultimo_cambio ?? record.fecha_ultimo_cambio,
  );
  const sourceAmount =
    record.presupuesto?.monto_disponible ?? record.montos?.monto_disponible;
  const clpAmount =
    record.presupuesto?.monto_disponible_clp ??
    record.montos?.monto_disponible_clp;
  const amount = sourceAmount ?? clpAmount;
  const delivery = record.entrega;
  const call = record.convocatoria;
  const budget = record.presupuesto;
  const motives = record.motivos;
  const summary = record.resumen;
  const currency =
    sourceAmount !== null && sourceAmount !== undefined
      ? coerceToText(budget?.moneda ?? record.montos?.moneda)
      : clpAmount !== null && clpAmount !== undefined
        ? 'CLP'
        : null;

  return {
    title: coerceToText(record.nombre),
    stateCode,
    stateLabel,
    buyerCode: coerceToText(institution?.rut),
    buyerName: coerceToText(institution?.organismo_comprador),
    region:
      typeof institution?.region === 'number'
        ? institution.region
        : typeof record.region === 'number'
          ? record.region
          : null,
    publishedAt: normalizeV2CompraAgilDate(
      dates?.fecha_publicacion ?? record.fecha_publicacion,
    ).value,
    closingAt: normalizeV2CompraAgilDate(
      dates?.fecha_cierre ?? record.fecha_cierre,
    ).value,
    providerChangedAt: providerChangedAt.value,
    providerChangedAtRaw: providerChangedAt.raw,
    stateId,
    amount: toDecimalString(clpAmount ?? (currency === 'CLP' ? amount : null)),
    amountRaw: toDecimalString(amount),
    currency,
    documentCount: Array.isArray(record.documentos)
      ? record.documentos.length
      : null,
    description: coerceToText(record.descripcion),
    deliveryAddress: coerceToText(delivery?.direccion_entrega),
    deliveryDays: toIntegerOrNull(delivery?.plazo_entrega_dias),
    cancellationAt: normalizeV2CompraAgilDate(dates?.fecha_cancelacion).value,
    callDescription: coerceToText(call?.descripcion),
    callFirstClosingAt: normalizeV2CompraAgilDate(
      call?.fecha_cierre_primer_llamado,
    ).value,
    callSecondClosingAt: normalizeV2CompraAgilDate(
      call?.fecha_cierre_segundo_llamado,
    ).value,
    budgetType: coerceToText(budget?.tipo_presupuesto),
    budgetEstimate: toDecimalString(budget?.presupuesto_estimado),
    budgetCurrency: coerceToText(budget?.moneda),
    cancelMotive: coerceToText(motives?.motivo_cancelacion),
    desertedMotive: coerceToText(motives?.motivo_desierta),
    selectionMotive: coerceToText(motives?.motivo_seleccion),
    totalOffers: toIntegerOrNull(summary?.total_ofertas_recibidas),
    totalDemands: toIntegerOrNull(summary?.total_demandas),
    finePenalty: toDecimalString(summary?.multa_sancion),
  };
};
