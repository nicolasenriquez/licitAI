import { type DetectedDelimiter } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-delimiter.util';

export const parseCsvHeader = (
  headerLine: string,
  delimiter: DetectedDelimiter,
): string[] => {
  const columns: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];

    if (char === '"') {
      if (insideQuotes && headerLine[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  columns.push(current.trim());

  return columns;
};
