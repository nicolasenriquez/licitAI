import { Readable } from 'stream';

export const streamCountNewlines = async (stream: Readable): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    let newlineCount = 0;

    stream.on('data', (chunk: Buffer) => {
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === 0x0a) {
          newlineCount++;
        }
      }
    });

    stream.on('end', () => {
      resolve(newlineCount);
    });

    stream.on('error', reject);
  });
};
