import { basename } from 'path';

export const buildCsvSourceFileName = (
  sourceUrl: string,
  sourceDataset: string,
  sourcePeriod: string,
): string => {
  const urlBasename = basename(sourceUrl.split('?')[0]);

  if (urlBasename.length > 0) {
    return urlBasename;
  }

  return `${sourceDataset}-${sourcePeriod}.csv`;
};
