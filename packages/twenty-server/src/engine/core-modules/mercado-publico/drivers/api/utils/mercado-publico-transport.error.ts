import axios from 'axios';

export class MercadoPublicoTransportError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number | null,
  ) {
    super(`Mercado Publico transport failed: ${code}`);
    this.name = 'MercadoPublicoTransportError';
  }
}

export const normalizeMercadoPublicoTransportError = (
  error: unknown,
): unknown => {
  if (!axios.isAxiosError(error)) {
    return error;
  }

  return new MercadoPublicoTransportError(
    error.code ?? 'unknown',
    error.response?.status ?? null,
  );
};
