export type MercadoPublicoCanonicalOcState =
  | 'enviada_a_proveedor'
  | 'en_proceso'
  | 'aceptada'
  | 'cancelada'
  | 'recepcion_conforme'
  | 'pendiente_de_recepcionar'
  | 'recepcionada_parcialmente'
  | 'recepcion_conforme_incompleta'
  | 'unknown_raw_state';

const OC_CANONICAL_STATE_BY_CODE: Record<
  string,
  MercadoPublicoCanonicalOcState
> = {
  '4': 'enviada_a_proveedor',
  '5': 'en_proceso',
  '6': 'aceptada',
  '9': 'cancelada',
  '12': 'recepcion_conforme',
  '13': 'pendiente_de_recepcionar',
  '14': 'recepcionada_parcialmente',
  '15': 'recepcion_conforme_incompleta',
};

type NormalizeOcStateResult = {
  canonicalState: MercadoPublicoCanonicalOcState;
  rawStateCode: string;
  rawStateLabel: string;
};

export const normalizeOcState = (
  rawStateCode: string | null,
  rawStateLabel: string | null,
): NormalizeOcStateResult => {
  const rawStateCodeStr = rawStateCode ?? '';
  const rawStateLabelStr = rawStateLabel ?? '';

  const canonicalState = OC_CANONICAL_STATE_BY_CODE[rawStateCodeStr];

  return {
    canonicalState: canonicalState ?? 'unknown_raw_state',
    rawStateCode: rawStateCodeStr,
    rawStateLabel: rawStateLabelStr,
  };
};
