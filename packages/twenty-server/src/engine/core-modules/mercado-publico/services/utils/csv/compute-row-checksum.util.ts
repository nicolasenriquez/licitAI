import * as crypto from 'crypto';

export const computeRowChecksum = (rawText: string): string => {
  return crypto.createHash('sha256').update(rawText, 'utf-8').digest('hex');
};
