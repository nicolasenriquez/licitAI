export const MERCADO_PUBLICO_SUPPORTED_JOB_NAMES = [
  'api-v1-licitaciones-by-date',
  'api-v1-licitaciones-by-state',
  'api-v1-licitacion-detail-by-codigo',
  'api-v1-oc-by-date',
  'api-v1-oc-by-state',
  'api-v1-oc-detail-by-codigo',
  'api-v2-compra-agil-incremental',
  'api-v2-compra-agil-by-publication-window',
  'api-v2-compra-agil-detail-by-codigo',
  'csv-oc-download',
  'csv-licitaciones-download',
  'csv-file-profile',
  'csv-raw-load',
  'csv-staging-projection',
  'csv-canonical-refresh',
  'reconciliation-refresh',
] as const;

export const MERCADO_PUBLICO_RECONCILIATION_MATCHED_BY =
  'reconciliation-refresh' as const;

export const MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES =
  'api-v1-licitaciones' as const;
export const MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC =
  'api-v1-oc' as const;
export const MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V2_COMPRA_AGIL =
  'api-v2-compra-agil' as const;
export const MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV =
  'csv-datos-abiertos' as const;

export const MERCADO_PUBLICO_RECONCILIATION_EXACT_MATCH_TYPES = [
  'exact_codigo_externo',
  'csv_api_same_business_key',
  'exact_codigo_licitacion',
  'exact_compra_agil_id_orden_compra',
] as const;

export type MercadoPublicoReconciliationExactMatchType =
  (typeof MERCADO_PUBLICO_RECONCILIATION_EXACT_MATCH_TYPES)[number];

export const MERCADO_PUBLICO_RECONCILIATION_MATCH_TYPES_THAT_SUPPRESS_UNMATCHED =
  [
    ...MERCADO_PUBLICO_RECONCILIATION_EXACT_MATCH_TYPES,
    'unmatched',
  ] as const;

export const MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE = 'high' as const;
export const MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_MEDIUM =
  'medium' as const;
export const MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_LOW =
  'low' as const;
export const MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_UNKNOWN =
  'unknown' as const;

export const MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_MATCH_TYPES = [
  'candidate_supplier_amount',
  'candidate_item_amount',
  'unmatched',
] as const;

export type MercadoPublicoReconciliationHeuristicMatchType =
  (typeof MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_MATCH_TYPES)[number];

export const MERCADO_PUBLICO_RECONCILIATION_EVENT_TYPES = [
  'state_mismatch',
  'source_period_rerun_mismatch',
  'manual_review_required',
] as const;

export type MercadoPublicoReconciliationEventType =
  (typeof MERCADO_PUBLICO_RECONCILIATION_EVENT_TYPES)[number];

export const MERCADO_PUBLICO_GOLD_RECONCILIATION_STATUS_VALUES = [
  'exact',
  'candidate',
  'unmatched',
  'manual_review_required',
] as const;

export type MercadoPublicoGoldReconciliationStatus =
  (typeof MERCADO_PUBLICO_GOLD_RECONCILIATION_STATUS_VALUES)[number];

// ponytail: zero tolerance (exact equality). Bound is a raw ratio (abs(a-b)/a),
// not a percent — set 0.05 for 5%, NOT 5.
export const MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_ITEM_AMOUNT_TOLERANCE_RATIO = 0;

export const MERCADO_PUBLICO_CSV_SOURCE_SYSTEM = 'datos-abiertos' as const;
export const MERCADO_PUBLICO_CSV_OC_DATASET = 'oc' as const;
export const MERCADO_PUBLICO_CSV_LICITACIONES_DATASET = 'licitaciones' as const;
export const MERCADO_PUBLICO_CSV_STORAGE_FAILED_ERROR_SUMMARY =
  'storage_write_failed' as const;
export const MERCADO_PUBLICO_CSV_EMPTY_RESPONSE_ERROR_SUMMARY =
  'empty_response' as const;

export const MERCADO_PUBLICO_API_V1_LICITACIONES_PATH =
  'servicios/v1/publico/licitaciones.json';
export const MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE = 'api-v1-licitaciones';
export const MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT = 'by-date';
export const MERCADO_PUBLICO_API_V1_LICITACIONES_BY_STATE_ENDPOINT = 'by-state';
export const MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT =
  'detail-by-codigo';

export const MERCADO_PUBLICO_API_V1_OC_PATH =
  'servicios/v1/publico/ordenesdecompra.json';
export const MERCADO_PUBLICO_API_V1_OC_SOURCE = 'api-v1-oc';
export const MERCADO_PUBLICO_API_V1_OC_BY_DATE_ENDPOINT = 'by-date';
export const MERCADO_PUBLICO_API_V1_OC_BY_STATE_ENDPOINT = 'by-state';
export const MERCADO_PUBLICO_API_V1_OC_DETAIL_BY_CODIGO_ENDPOINT =
  'detail-by-codigo';

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
