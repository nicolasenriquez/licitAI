export class MercadoPublicoRecordedJobFailureError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = MercadoPublicoRecordedJobFailureError.name;
    this.retryable = retryable;
  }
}
