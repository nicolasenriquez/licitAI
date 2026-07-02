import * as crypto from 'crypto';

export const computeSchemaFingerprint = (headerLine: string): string => {
  return crypto.createHash('sha256').update(headerLine, 'utf-8').digest('hex');
};
