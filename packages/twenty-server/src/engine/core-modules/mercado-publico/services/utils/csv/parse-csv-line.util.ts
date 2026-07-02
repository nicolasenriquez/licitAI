import { parse } from 'csv-parse/sync';

type CsvLineParseResult = {
  values: string[] | null;
  parseError: string | null;
};

export const parseCsvLine = (
  line: string,
  delimiter: string,
  quotechar: string | null,
): CsvLineParseResult => {
  const trimmed = line.trim();

  if (trimmed.length === 0) {
    return { values: null, parseError: 'empty_line' };
  }

  try {
    const records = parse(trimmed, {
      delimiter,
      quote: quotechar ?? false,
      relaxColumnCount: true,
      relaxQuotes: true,
    }) as string[][];

    return {
      values: records.length > 0 ? records[0] : null,
      parseError: records.length > 0 ? null : 'no_records',
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown parse error';

    return { values: null, parseError: message };
  }
};
