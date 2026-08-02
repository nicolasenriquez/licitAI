import { isNonEmptyString } from '@sniptt/guards';

import { DateTime } from 'luxon';

import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  type MercadoPublicoErrorSummary,
  type MercadoPublicoJobName,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { type MercadoPublicoApiV2CompraAgilListResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';

export type MercadoPublicoCompraAgilExtractionManifestStatus =
  | 'running'
  | 'complete'
  | 'empty'
  | 'partial'
  | 'failed'
  | 'retryable_failed'
  | 'param_error';

export type MercadoPublicoCompraAgilRequestedLocalWindow = {
  from: string;
  to: string;
  timezone: string;
};

export type MercadoPublicoCompraAgilExtractionManifest = {
  schemaVersion: 1;
  source: typeof MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE;
  jobName: MercadoPublicoJobName;
  requestParams: Record<string, string | number>;
  requestedLocalWindow: MercadoPublicoCompraAgilRequestedLocalWindow | null;
  sentUtcWindow: { from: string; to: string } | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  effectiveDate: string | null;
  pagesRequested: number;
  pagesCompleted: number;
  providerTotalPages: number | null;
  providerTotalResults: number | null;
  rawItemsReceived: number;
  uniqueCodes: number;
  retryAfterSeconds: number | null;
  status: MercadoPublicoCompraAgilExtractionManifestStatus;
  errorSummary: string | null;
};

type CreateManifestInput = {
  jobName: MercadoPublicoJobName;
  requestParams: Record<string, unknown>;
  requestedLocalWindow?: unknown;
  fallbackUsed?: unknown;
  fallbackReason?: unknown;
  effectiveDate?: unknown;
};

const SENSITIVE_KEY_PATTERN =
  /(ticket|authorization|cookie|token|password|secret)/i;

const toSafeRequestParams = (
  requestParams: Record<string, unknown>,
): Record<string, string | number> => {
  return Object.fromEntries(
    Object.entries(requestParams).filter(
      ([key, value]) =>
        !SENSITIVE_KEY_PATTERN.test(key) &&
        ((typeof value === 'string' && value.length > 0) ||
          (typeof value === 'number' && Number.isFinite(value))),
    ),
  ) as Record<string, string | number>;
};

const parseRequestedLocalWindow = (
  value: unknown,
): MercadoPublicoCompraAgilRequestedLocalWindow | null => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    !isNonEmptyString(candidate.from) ||
    !isNonEmptyString(candidate.to) ||
    !isNonEmptyString(candidate.timezone)
  ) {
    return null;
  }

  return {
    from: candidate.from,
    to: candidate.to,
    timezone: candidate.timezone,
  };
};

const getSentUtcWindow = (
  requestParams: Record<string, string | number>,
): { from: string; to: string } | null => {
  const from =
    requestParams.publicado_desde ?? requestParams.cambio_desde ?? null;
  const to = requestParams.publicado_hasta ?? requestParams.cambio_hasta ?? null;

  if (typeof from !== 'string' || typeof to !== 'string') {
    return null;
  }

  const fromUtc = DateTime.fromISO(from, { setZone: true }).toUTC();
  const toUtc = DateTime.fromISO(to, { setZone: true }).toUTC();

  if (!fromUtc.isValid || !toUtc.isValid) {
    return null;
  }

  return {
    from: fromUtc.toISO({ suppressMilliseconds: true }),
    to: toUtc.toISO({ suppressMilliseconds: true }),
  };
};

export const createMercadoPublicoCompraAgilExtractionManifest = (
  input: CreateManifestInput,
): MercadoPublicoCompraAgilExtractionManifest => {
  const requestParams = toSafeRequestParams(input.requestParams);

  return {
    schemaVersion: 1,
    source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
    jobName: input.jobName,
    requestParams,
    requestedLocalWindow: parseRequestedLocalWindow(
      input.requestedLocalWindow,
    ),
    sentUtcWindow: getSentUtcWindow(requestParams),
    fallbackUsed: input.fallbackUsed === true,
    fallbackReason: isNonEmptyString(input.fallbackReason)
      ? input.fallbackReason
      : null,
    effectiveDate: isNonEmptyString(input.effectiveDate)
      ? input.effectiveDate
      : null,
    pagesRequested: 0,
    pagesCompleted: 0,
    providerTotalPages: null,
    providerTotalResults: null,
    rawItemsReceived: 0,
    uniqueCodes: 0,
    retryAfterSeconds: null,
    status: 'running',
    errorSummary: null,
  };
};

export const recordMercadoPublicoCompraAgilManifestPage = (
  manifest: MercadoPublicoCompraAgilExtractionManifest,
  response: Pick<
    MercadoPublicoApiV2CompraAgilListResponse,
    'compraAgil' | 'pagination' | 'retryAfterSeconds'
  >,
  uniqueCodes: Set<string>,
  completed: boolean,
): void => {
  manifest.rawItemsReceived += response.compraAgil.length;

  for (const record of response.compraAgil) {
    uniqueCodes.add(record.codigo);
  }

  manifest.uniqueCodes = uniqueCodes.size;
  manifest.pagesCompleted += completed ? 1 : 0;
  manifest.providerTotalPages =
    response.pagination?.totalPages ?? manifest.providerTotalPages;
  manifest.providerTotalResults =
    response.pagination?.totalResults ?? manifest.providerTotalResults;
  manifest.retryAfterSeconds =
    response.retryAfterSeconds ?? manifest.retryAfterSeconds;
};

export const mapMercadoPublicoErrorSummaryToManifestStatus = (
  errorSummary: MercadoPublicoErrorSummary,
): MercadoPublicoCompraAgilExtractionManifestStatus => {
  if (errorSummary === 'param_error') {
    return 'param_error';
  }

  if (errorSummary === 'retryable_failed') {
    return 'retryable_failed';
  }

  if (errorSummary === 'soft_miss') {
    return 'empty';
  }

  return 'failed';
};
