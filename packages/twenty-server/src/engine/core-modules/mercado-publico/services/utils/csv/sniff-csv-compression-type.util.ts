import { isNonEmptyString } from '@sniptt/guards';

import { basename } from 'path';

export const sniffCsvCompressionType = (
  sourceUrl: string,
  contentType?: string,
): 'gz' | 'zip' | null => {
  if (isNonEmptyString(contentType)) {
    const lower = contentType.toLowerCase();

    if (lower.includes('application/gzip') || lower.includes('application/x-gzip')) {
      return 'gz';
    }

    if (lower.includes('application/zip')) {
      return 'zip';
    }
  }

  const filename = basename(sourceUrl).toLowerCase();

  if (filename.endsWith('.gz')) {
    return 'gz';
  }

  if (filename.endsWith('.zip')) {
    return 'zip';
  }

  // ponytail: .7z deferred — add when fixtures require it (node-7z or sys 7z binary)
  return null;
};
