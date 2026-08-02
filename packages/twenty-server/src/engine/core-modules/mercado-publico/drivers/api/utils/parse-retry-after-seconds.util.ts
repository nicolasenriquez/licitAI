export const parseRetryAfterSeconds = (
  value: unknown,
  nowMs = Date.now(),
): number | null => {
  const headerValue = Array.isArray(value) ? value[0] : value;

  if (typeof headerValue === 'number') {
    return Number.isFinite(headerValue) && headerValue >= 0
      ? Math.ceil(headerValue)
      : null;
  }

  if (typeof headerValue !== 'string') {
    return null;
  }

  const trimmedValue = headerValue.trim();

  if (/^\d+$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  const retryAtMs = Date.parse(trimmedValue);

  if (Number.isNaN(retryAtMs)) {
    return null;
  }

  return Math.max(0, Math.ceil((retryAtMs - nowMs) / 1000));
};
