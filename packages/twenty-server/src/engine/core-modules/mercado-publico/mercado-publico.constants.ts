export const MERCADO_PUBLICO_SUPPORTED_JOB_NAMES = [
  'api-v2-compra-agil-incremental',
  'api-v2-compra-agil-by-publication-window',
  'api-v2-compra-agil-detail-by-codigo',
] as const;

// Retained for the raw-layer persistence integration suite and committed
// migration evidence; the V1/CSV runtime that wrote these labels is removed.
export const MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE = 'api-v1-licitaciones';
export const MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT = 'by-date';
export const MERCADO_PUBLICO_CSV_SOURCE_SYSTEM = 'datos-abiertos' as const;
export const MERCADO_PUBLICO_CSV_OC_DATASET = 'oc' as const;

export const MERCADO_PUBLICO_API_V2_COMPRA_AGIL_PATH = 'v2/compra-agil';
export const MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE = 'api-v2-compra-agil';
export const MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT = 'list';
export const MERCADO_PUBLICO_API_V2_COMPRA_AGIL_DETAIL_BY_CODIGO_ENDPOINT =
  'detail-by-codigo';

export const MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME =
  'mercado-publico-v2-sync-command';

export const MERCADO_PUBLICO_ERROR_SUMMARIES = [
  'param_error',
  'hard_fail',
  'soft_miss',
  'retryable_failed',
] as const;

export const MERCADO_PUBLICO_JOB_RUN_STATUSES = [
  'success',
  'failed',
  'soft_miss',
  'param_error',
  'retryable_failed',
] as const;

export type MercadoPublicoJobName =
  (typeof MERCADO_PUBLICO_SUPPORTED_JOB_NAMES)[number];
export type MercadoPublicoErrorSummary =
  (typeof MERCADO_PUBLICO_ERROR_SUMMARIES)[number];
export type MercadoPublicoJobRunStatus =
  (typeof MERCADO_PUBLICO_JOB_RUN_STATUSES)[number];

const mercadoPublicoSupportedJobNameSet = new Set<string>(
  MERCADO_PUBLICO_SUPPORTED_JOB_NAMES,
);

export const MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT =
  MERCADO_PUBLICO_SUPPORTED_JOB_NAMES.join(', ');

export const isMercadoPublicoJobName = (
  value: string,
): value is MercadoPublicoJobName => {
  return mercadoPublicoSupportedJobNameSet.has(value);
};
