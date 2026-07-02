import { createGunzip } from 'zlib';
import { PassThrough, Transform } from 'stream';

import unzipper from 'unzipper';

export const createDecompressor = (
  compressionType: 'gz' | 'zip' | null,
): Transform => {
  if (compressionType === null) {
    return new PassThrough();
  }

  if (compressionType === 'gz') {
    return createGunzip();
  }

  return unzipper.ParseOne() as unknown as Transform;
};

export const decompressCsvStream = (
  sourceStream: NodeJS.ReadableStream,
  compressionType: 'gz' | 'zip' | null,
): NodeJS.ReadableStream => {
  if (compressionType === null) {
    return sourceStream;
  }

  if (compressionType === 'gz') {
    return sourceStream.pipe(createGunzip());
  }

  return sourceStream.pipe(unzipper.ParseOne());
};
