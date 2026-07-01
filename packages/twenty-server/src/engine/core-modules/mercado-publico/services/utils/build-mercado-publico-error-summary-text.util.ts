import { type MercadoPublicoErrorSummary } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

type ApiResponseForErrorSummary = {
  errorSummary?: MercadoPublicoErrorSummary;
  errorCode?: string;
  errorMessage?: string;
};

export const buildMercadoPublicoErrorSummaryText = (
  apiResponse: ApiResponseForErrorSummary,
): string => {
  const details: string[] = [apiResponse.errorSummary ?? 'hard_fail'];

  if (apiResponse.errorCode !== undefined) {
    details.push(`code=${apiResponse.errorCode}`);
  }

  if (apiResponse.errorMessage !== undefined) {
    details.push(apiResponse.errorMessage);
  }

  return details.join(': ');
};

export const buildMercadoPublicoUnexpectedErrorSummaryText = (
  errorSummary: MercadoPublicoErrorSummary,
  error: unknown,
): string => {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown Mercado Publico error';

  return `${errorSummary}: ${errorMessage}`;
};
