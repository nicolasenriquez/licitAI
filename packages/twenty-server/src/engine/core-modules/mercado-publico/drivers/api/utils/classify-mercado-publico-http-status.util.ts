import { type MercadoPublicoErrorSummary } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export const classifyMercadoPublicoHttpStatus = (
  httpStatus: number,
): MercadoPublicoErrorSummary | undefined => {
  if (httpStatus < 400) {
    return undefined;
  }

  if (httpStatus === 400) {
    return 'param_error';
  }

  if (httpStatus === 404) {
    return 'soft_miss';
  }

  if (httpStatus === 429 || httpStatus === 500 || httpStatus === 503) {
    return 'retryable_failed';
  }

  return 'hard_fail';
};
