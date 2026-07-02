const NULL_LIKE_LOWER_PATTERNS = ['na', 'n/a', 'null'];

const isNullLike = (trimmed: string): boolean => {
  if (trimmed.length === 0) {
    return true;
  }

  const lower = trimmed.toLowerCase();

  return NULL_LIKE_LOWER_PATTERNS.includes(lower);
};

export const normalizeNullLike = (raw: string): string | null => {
  const trimmed = raw.trim();

  if (isNullLike(trimmed)) {
    return null;
  }

  return trimmed;
};

export const normalizeDecimal = (
  raw: string,
): { value: number | null; parseError: string | null } => {
  const trimmed = raw.trim();

  if (isNullLike(trimmed)) {
    return { value: null, parseError: null };
  }

  const normalized = trimmed.replace(',', '.');

  if (normalized.includes(',')) {
    return { value: null, parseError: 'multiple_commas' };
  }

  const num = parseFloat(normalized);

  if (Number.isNaN(num)) {
    return { value: null, parseError: 'not_numeric' };
  }

  return { value: num, parseError: null };
};

export const normalizeDate = (
  raw: string,
): { value: Date | null; isSentinel1900: boolean; parseError: string | null } => {
  const trimmed = raw.trim();

  if (isNullLike(trimmed)) {
    return { value: null, isSentinel1900: false, parseError: null };
  }

  if (trimmed === '1900-01-01') {
    return { value: null, isSentinel1900: true, parseError: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { value: null, isSentinel1900: false, parseError: 'invalid_format' };
  }

  const date = new Date(`${trimmed}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return { value: null, isSentinel1900: false, parseError: 'invalid_format' };
  }

  return { value: date, isSentinel1900: false, parseError: null };
};
