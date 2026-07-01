import {
  type MercadoPublicoErrorSummary,
  type MercadoPublicoJobRunStatus,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export const mapMercadoPublicoErrorSummaryToJobRunStatus = (
  errorSummary: MercadoPublicoErrorSummary,
): MercadoPublicoJobRunStatus => {
  if (errorSummary === 'param_error') {
    return 'param_error';
  }

  if (errorSummary === 'soft_miss') {
    return 'soft_miss';
  }

  if (errorSummary === 'retryable_failed') {
    return 'retryable_failed';
  }

  return 'failed';
};
