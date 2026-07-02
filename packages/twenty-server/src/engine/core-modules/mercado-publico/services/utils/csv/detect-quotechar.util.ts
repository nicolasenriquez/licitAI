import { type DetectedDelimiter } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-delimiter.util';

export const detectQuotechar = (
  headerLine: string,
  delimiter: DetectedDelimiter,
): '"' | null => {
  const trimmed = headerLine.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed[0] === '"') {
    return '"';
  }

  if (trimmed.endsWith('"')) {
    return '"';
  }

  if (trimmed.includes(delimiter + '"')) {
    return '"';
  }

  return null;
};
