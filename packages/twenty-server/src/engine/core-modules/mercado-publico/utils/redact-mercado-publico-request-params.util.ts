const SENSITIVE_KEY_PATTERN =
  /(ticket|authorization|cookie|token|password|secret)/i;
const SENSITIVE_VALUE_FIELDS = new Set(['val', 'value']);

export const MERCADO_PUBLICO_REDACTED_VALUE = '[REDACTED]' as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const hasSensitiveKeyMarker = (value: Record<string, unknown>): boolean => {
  const keyMarker = value.key;
  const nameMarker = value.name;

  return (
    (typeof keyMarker === 'string' && SENSITIVE_KEY_PATTERN.test(keyMarker)) ||
    (typeof nameMarker === 'string' && SENSITIVE_KEY_PATTERN.test(nameMarker))
  );
};

export const redactMercadoPublicoRequestParams = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactMercadoPublicoRequestParams(entry));
  }

  if (!isRecord(value)) {
    return value;
  }

  const hasSensitiveMarker = hasSensitiveKeyMarker(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, MERCADO_PUBLICO_REDACTED_VALUE];
      }

      if (hasSensitiveMarker && SENSITIVE_VALUE_FIELDS.has(key)) {
        return [key, MERCADO_PUBLICO_REDACTED_VALUE];
      }

      return [key, redactMercadoPublicoRequestParams(nestedValue)];
    }),
  );
};
