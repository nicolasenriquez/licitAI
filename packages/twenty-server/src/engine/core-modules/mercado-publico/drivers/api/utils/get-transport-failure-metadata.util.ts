import axios from 'axios';

export const getTransportFailureCode = (error: unknown): string =>
  axios.isAxiosError(error) ? (error.code ?? 'unknown') : 'unknown';

export const getHttpFailureStatus = (error: unknown): number | null =>
  axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
