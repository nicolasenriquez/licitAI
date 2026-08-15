import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

export type MercadoPublicoV2LifecycleClassification = {
  includeInCohort: boolean;
  terminal: boolean;
  reason:
    | 'new_published'
    | 'known_follow_up'
    | 'terminal_cancelled'
    | 'terminal_deserted_second_call'
    | 'terminal_selected_with_order'
    | 'unknown_first_seen';
};

const normalizeCode = (value: unknown): string | null => {
  const normalized = coerceToNullableString(value);

  return normalized === null ? null : normalized.trim().toLowerCase();
};

const getStateCode = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): string | null => {
  return normalizeCode(
    typeof record.estado === 'string' ? record.estado : record.estado?.codigo,
  );
};

export type MercadoPublicoV2CompraAgilOrderReferences = {
  idOrdenCompra: string | null;
  idOc: string | null;
  codigoOrdenCompra: string | null;
};

export const getV2CompraAgilOrderReferences = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): MercadoPublicoV2CompraAgilOrderReferences => {
  const providerWithOrder = record.proveedores_cotizando?.find(
    (provider) => coerceToNullableString(provider.id_oc) !== null,
  );

  return {
    idOrdenCompra:
      coerceToNullableString(record.id_orden_compra) ??
      coerceToNullableString(record.orden_compra?.id_orden_compra),
    idOc:
      coerceToNullableString(record.orden_compra?.id_oc) ??
      coerceToNullableString(providerWithOrder?.id_oc),
    codigoOrdenCompra: coerceToNullableString(
      record.orden_compra?.codigo_orden_compra,
    ),
  };
};

export const getV2CompraAgilCallNumber = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): number | null => {
  const candidates = [
    record.convocatoria?.numero,
    record.numero_convocatoria,
    record.llamado,
    record.convocatoria?.estado_convocatoria,
  ];

  for (const candidate of candidates) {
    const numberValue =
      typeof candidate === 'number'
        ? candidate
        : typeof candidate === 'string' && candidate.trim() !== ''
          ? Number(candidate)
          : Number.NaN;

    if (Number.isInteger(numberValue) && numberValue > 0) {
      return numberValue;
    }

    const normalized = normalizeCode(candidate);

    if (normalized?.includes('segundo') || normalized === '2') {
      return 2;
    }
  }

  return null;
};

const hasVerifiedPurchaseOrder = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): boolean => {
  const orderReferences = getV2CompraAgilOrderReferences(record);

  return (
    orderReferences.idOrdenCompra !== null || orderReferences.idOc !== null
  );
};

export const classifyV2CompraAgilLifecycle = (
  record: MercadoPublicoApiV2CompraAgilRecord,
  knownCohort: boolean,
): MercadoPublicoV2LifecycleClassification => {
  const stateCode = getStateCode(record);

  if (stateCode === 'cancelada') {
    return {
      includeInCohort: knownCohort,
      terminal: knownCohort,
      reason: 'terminal_cancelled',
    };
  }

  if (
    stateCode === 'desierta' &&
    getV2CompraAgilCallNumber(record) !== null &&
    (getV2CompraAgilCallNumber(record) as number) >= 2
  ) {
    return {
      includeInCohort: knownCohort,
      terminal: knownCohort,
      reason: 'terminal_deserted_second_call',
    };
  }

  if (
    (stateCode === 'proveedor_seleccionado' || stateCode === 'oc_emitida') &&
    hasVerifiedPurchaseOrder(record)
  ) {
    return {
      includeInCohort: knownCohort,
      terminal: knownCohort,
      reason: 'terminal_selected_with_order',
    };
  }

  if (knownCohort) {
    return {
      includeInCohort: true,
      terminal: false,
      reason: 'known_follow_up',
    };
  }

  if (stateCode === 'publicada') {
    return {
      includeInCohort: true,
      terminal: false,
      reason: 'new_published',
    };
  }

  return {
    includeInCohort: false,
    terminal: false,
    reason: 'unknown_first_seen',
  };
};

export const getV2CompraAgilStateCode = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): string | null => getStateCode(record);

export const getV2CompraAgilStateLabel = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): string | null => {
  return record.estado !== null && typeof record.estado === 'object'
    ? coerceToNullableString(record.estado.glosa)
    : coerceToNullableString(record.estado);
};

export const getV2CompraAgilProviderOrderId = (
  record: MercadoPublicoApiV2CompraAgilRecord,
): string | null => {
  const orderReferences = getV2CompraAgilOrderReferences(record);

  return orderReferences.idOrdenCompra ?? orderReferences.idOc;
};
