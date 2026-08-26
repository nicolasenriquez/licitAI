import { type MatchColumnsStepProps } from '@/spreadsheet-import/steps/components/MatchColumnsStep/MatchColumnsStep';
import { type SpreadsheetMatchedOptions } from '@/spreadsheet-import/types/SpreadsheetMatchedOptions';

export const uniqueEntries = (
  data: MatchColumnsStepProps['data'],
  index: number,
): Partial<SpreadsheetMatchedOptions>[] =>
  [...new Set(data.map((row) => row[index]))]
    .filter((entry): entry is string => !!entry)
    .map((entry) => ({ entry }));
