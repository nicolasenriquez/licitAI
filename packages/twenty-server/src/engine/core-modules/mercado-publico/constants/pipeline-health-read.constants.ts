export const MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_STATUSES = [
  'failed',
  'retryable_failed',
  'param_error',
] as const;

export type MercadoPublicoPipelineHealthFailureStatus =
  (typeof MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_STATUSES)[number];

export const MERCADO_PUBLICO_PIPELINE_HEALTH_FAILURE_WINDOW_DAYS = 7;

export const MERCADO_PUBLICO_PIPELINE_HEALTH_FRESHNESS_VALUES = [
  'healthy',
  'degraded',
  'stale',
] as const;

export type MercadoPublicoFreshness =
  (typeof MERCADO_PUBLICO_PIPELINE_HEALTH_FRESHNESS_VALUES)[number];
