import axios from 'axios';

import { MercadoPublicoTransportError } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/mercado-publico-transport.error';

export const getTransportFailureCode = (error: unknown): string =>
  error instanceof MercadoPublicoTransportError
    ? error.code
    : axios.isAxiosError(error)
      ? (error.code ?? 'unknown')
      : 'unknown';

export const getHttpFailureStatus = (error: unknown): number | null =>
  error instanceof MercadoPublicoTransportError
    ? error.httpStatus
    : axios.isAxiosError(error)
      ? (error.response?.status ?? null)
      : null;
