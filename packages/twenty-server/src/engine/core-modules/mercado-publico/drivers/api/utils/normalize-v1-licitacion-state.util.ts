const LICITACION_CANONICAL_STATE_BY_CODE = {
  '5': 'publicada',
  '6': 'cerrada',
  '7': 'desierta',
  '8': 'adjudicada',
  '18': 'revocada',
  '19': 'suspendida',
} as const;

const LICITACION_CANONICAL_STATE_BY_LABEL = {
  publicada: 'publicada',
  cerrada: 'cerrada',
  desierta: 'desierta',
  adjudicada: 'adjudicada',
  revocada: 'revocada',
  suspendida: 'suspendida',
} as const;

export type MercadoPublicoCanonicalLicitacionState =
  | 'publicada'
  | 'cerrada'
  | 'desierta'
  | 'adjudicada'
  | 'revocada'
  | 'suspendida'
  | 'unknown_raw_state';

const isKnownLicitacionStateCode = (
  rawStateCode: string,
): rawStateCode is keyof typeof LICITACION_CANONICAL_STATE_BY_CODE => {
  return rawStateCode in LICITACION_CANONICAL_STATE_BY_CODE;
};

const isKnownLicitacionStateLabel = (
  rawStateLabel: string,
): rawStateLabel is keyof typeof LICITACION_CANONICAL_STATE_BY_LABEL => {
  return rawStateLabel in LICITACION_CANONICAL_STATE_BY_LABEL;
};

export const normalizeV1LicitacionState = (
  rawStateCode: string | null,
  rawStateLabel: string | null,
): MercadoPublicoCanonicalLicitacionState | null => {
  if (rawStateCode !== null && isKnownLicitacionStateCode(rawStateCode)) {
    return LICITACION_CANONICAL_STATE_BY_CODE[rawStateCode];
  }

  if (rawStateLabel !== null) {
    const normalizedRawStateLabel = rawStateLabel.trim().toLowerCase();

    if (isKnownLicitacionStateLabel(normalizedRawStateLabel)) {
      return LICITACION_CANONICAL_STATE_BY_LABEL[normalizedRawStateLabel];
    }
  }

  if (rawStateCode === null && rawStateLabel === null) {
    return null;
  }

  return 'unknown_raw_state';
};
