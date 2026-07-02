export type DetectedEncoding = 'utf-8' | 'utf-8-sig' | 'latin-1';

const UTF8_BOM = [0xef, 0xbb, 0xbf];

export const detectEncoding = (
  buffer: Buffer,
): { encoding: DetectedEncoding; fallbackUsed: boolean } => {
  if (buffer.length === 0) {
    throw new Error('Cannot detect encoding from empty buffer');
  }

  const hasBom =
    buffer.length >= 3 &&
    buffer[0] === UTF8_BOM[0] &&
    buffer[1] === UTF8_BOM[1] &&
    buffer[2] === UTF8_BOM[2];

  if (hasBom) {
    return { encoding: 'utf-8-sig', fallbackUsed: false };
  }

  const decoded = buffer.toString('utf-8');

  if (!decoded.includes('\uFFFD')) {
    return { encoding: 'utf-8', fallbackUsed: false };
  }

  return { encoding: 'latin-1', fallbackUsed: true };
};
