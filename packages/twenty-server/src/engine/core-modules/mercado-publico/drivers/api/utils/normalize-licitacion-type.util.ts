const LICITACION_CANONICAL_TYPE_BY_CODE = {
  LP: 'licitacion_publica',
  LE: 'licitacion_especial',
} as const;

export type MercadoPublicoCanonicalLicitacionType =
  | 'licitacion_publica'
  | 'licitacion_especial'
  | 'unknown_raw_type';

export const normalizeLicitacionType = (
  rawCodigoTipo: string | null,
): MercadoPublicoCanonicalLicitacionType => {
  if (rawCodigoTipo === null) {
    return 'unknown_raw_type';
  }

  const normalizedRawCodigoTipo = rawCodigoTipo.trim().toUpperCase();

  if (normalizedRawCodigoTipo in LICITACION_CANONICAL_TYPE_BY_CODE) {
    return LICITACION_CANONICAL_TYPE_BY_CODE[
      normalizedRawCodigoTipo as keyof typeof LICITACION_CANONICAL_TYPE_BY_CODE
    ];
  }

  return 'unknown_raw_type';
};
