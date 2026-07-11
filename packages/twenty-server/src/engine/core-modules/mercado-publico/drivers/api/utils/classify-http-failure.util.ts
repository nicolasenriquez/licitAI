import axios from 'axios';
import { BadRequestException } from '@nestjs/common';

import { type MercadoPublicoErrorSummary } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

const RETRYABLE_HTTP_STATUS_CODES = new Set([429, 500, 503]);
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ERR_NETWORK',
  'ETIMEDOUT',
]);

export const classifyFailure = (error: unknown): MercadoPublicoErrorSummary => {
  if (error instanceof BadRequestException) {
    return 'param_error';
  }

  if (!axios.isAxiosError(error)) {
    return 'hard_fail';
  }

  const status = error.response?.status;

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
    (typeof error.code === 'string' && RETRYABLE_ERROR_CODES.has(error.code))
  ) {
    return 'retryable_failed';
  }

  return 'hard_fail';
};

export const classifyHttpFailure = classifyFailure;
