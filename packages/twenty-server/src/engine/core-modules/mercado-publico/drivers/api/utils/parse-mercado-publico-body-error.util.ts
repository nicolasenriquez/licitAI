import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoErrorSummary } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

export type MercadoPublicoApiBodyError = {
  code: string | null;
  message: string;
  errorSummary: MercadoPublicoErrorSummary;
};

export const parseMercadoPublicoBodyError = (
  payload: unknown,
): MercadoPublicoApiBodyError | null => {
  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return null;
  }

  const payloadRecord = payload as Record<string, unknown>;
  const success = coerceToNullableString(payloadRecord.success)?.toUpperCase();

  if (success === 'NOK' || success === 'ERROR') {
    const errors = Array.isArray(payloadRecord.errors)
      ? payloadRecord.errors
      : [];
    const firstError = errors.find(
      (error): error is Record<string, unknown> =>
        error !== null && typeof error === 'object' && !Array.isArray(error),
    );
    const code = coerceToNullableString(firstError?.codigo ?? firstError?.code);
    const message = coerceToNullableString(
      firstError?.mensaje ?? firstError?.message,
    );

    return {
      code,
      message: message ?? `Mercado Publico V2 provider returned ${success}`,
      errorSummary: 'hard_fail',
    };
  }

  const code = coerceToNullableString(payloadRecord.Codigo);
  const message = coerceToNullableString(payloadRecord.Mensaje);

  if (!isNonEmptyString(message)) {
    return null;
  }

  if (
    message.toLowerCase().includes('ticket') &&
    message.toLowerCase().includes('válido')
  ) {
    return {
      code,
      message,
      errorSummary: 'hard_fail',
    };
  }

  return {
    code,
    message,
    errorSummary: 'hard_fail',
  };
};
