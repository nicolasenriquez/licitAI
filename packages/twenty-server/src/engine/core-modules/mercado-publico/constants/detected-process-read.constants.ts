export const MERCADO_PUBLICO_DETECTED_PROCESS_TYPES = [
  'licitacion',
  'orden_compra',
  'compra_agil',
] as const;

export type MercadoPublicoDetectedProcessType =
  (typeof MERCADO_PUBLICO_DETECTED_PROCESS_TYPES)[number];

export const MERCADO_PUBLICO_DETECTED_PROCESS_SORT_KEYS = [
  'lastSeenAt',
  'publishedAt',
  'closingAt',
  'processCode',
  'canonicalState',
] as const;

export type MercadoPublicoDetectedProcessSortKey =
  (typeof MERCADO_PUBLICO_DETECTED_PROCESS_SORT_KEYS)[number];

export type MercadoPublicoDetectedProcessSortDirection = 'asc' | 'desc';

export const MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_PAGE = 1;
export const MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_LIMIT = 50;
export const MERCADO_PUBLICO_DETECTED_PROCESS_MAX_LIMIT = 200;

export const MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_KEY: MercadoPublicoDetectedProcessSortKey =
  'lastSeenAt';

export const MERCADO_PUBLICO_DETECTED_PROCESS_DEFAULT_SORT_DIRECTION: MercadoPublicoDetectedProcessSortDirection =
  'desc';
