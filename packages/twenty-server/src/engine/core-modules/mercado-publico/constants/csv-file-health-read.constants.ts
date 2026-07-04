export const MERCADO_PUBLICO_CSV_FILE_HEALTH_FRESHNESS_VALUES = [
  'healthy',
  'degraded',
  'stale',
] as const;

export type MercadoPublicoCsvFileHealthFreshness =
  (typeof MERCADO_PUBLICO_CSV_FILE_HEALTH_FRESHNESS_VALUES)[number];
