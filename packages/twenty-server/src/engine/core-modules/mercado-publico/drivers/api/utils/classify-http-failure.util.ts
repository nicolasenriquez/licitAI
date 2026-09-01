import axios from 'axios';

import { type MercadoPublicoErrorSummary } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoTransportError } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/mercado-publico-transport.error';

const RETRYABLE_HTTP_STATUS_CODES = new Set([429, 500, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'ERR_NETWORK',
  'ETIMEDOUT',
]);

export const classifyFailure = (error: unknown): MercadoPublicoErrorSummary => {
  if (
    !axios.isAxiosError(error) &&
    !(error instanceof MercadoPublicoTransportError)
  ) {
    return 'hard_fail';
  }

  const status =
    error instanceof MercadoPublicoTransportError
      ? error.httpStatus
      : error.response?.status;
  const code = error.code;

  if (status === 400) {
    return 'param_error';
  }

  if (status === 401 || status === 403) {
    return 'hard_fail';
  }

  if (status === 404) {
    return 'soft_miss';
  }

  if (
    (typeof status === 'number' && RETRYABLE_HTTP_STATUS_CODES.has(status)) ||
    (typeof code === 'string' && RETRYABLE_ERROR_CODES.has(code))
  ) {
    return 'retryable_failed';
  }

  return 'hard_fail';
};

export const classifyHttpFailure = classifyFailure;
