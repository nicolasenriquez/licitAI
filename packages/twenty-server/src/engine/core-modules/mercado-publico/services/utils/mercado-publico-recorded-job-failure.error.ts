import { type MercadoPublicoErrorSummary } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export type MercadoPublicoRecordedJobFailureDisposition =
  | 'acknowledge'
  | 'fail'
  | 'retry';

export class MercadoPublicoRecordedJobFailureError extends Error {
  readonly retryable: boolean;
  readonly disposition: MercadoPublicoRecordedJobFailureDisposition;

  constructor(
    message: string,
    retryable: boolean,
    errorSummary?: MercadoPublicoErrorSummary,
  ) {
    super(message);
    this.name = MercadoPublicoRecordedJobFailureError.name;
    this.retryable = retryable;
    this.disposition =
      errorSummary === 'hard_fail'
        ? 'fail'
        : retryable
          ? 'retry'
          : 'acknowledge';
  }
}
