export class MercadoPublicoRecordedJobFailureError extends Error {
  readonly retryable: boolean;
  readonly retryAt: Date | null;

  constructor(message: string, retryable = false, retryAt: Date | null = null) {
    super(message);
    this.retryable = retryable;
    this.retryAt = retryAt;
  }
}
