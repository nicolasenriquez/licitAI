import { execFileSync } from 'child_process';
import { join } from 'path';

const SAMPLE_ZIP_BASE64 =
  'UEsDBBQAAAAIAKe04Vy8JCCdHAAAABoAAAAKAAAAc2FtcGxlLmNzdnPOT8lMz7d2LS5JTMnnMrQOKE3KyUxOTEnkAgBQSwECFAAUAAAACACntOFcvCQgnRwAAAAaAAAACgAAAAAAAAAAAAAAAAAAAAAAc2FtcGxlLmNzdlBLBQYAAAAAAQABADgAAABEAAAAAAA=';

describe('decompressCsvStream', () => {
  it('extracts the first zip entry with ParseOne without hanging', async () => {
    const utilPath = join(
      __dirname,
      '..',
      '..',
      'csv',
      'decompress-csv-stream.util.ts',
    );
    const script = `
require('ts-node/register/transpile-only');
const { Readable, Writable } = require('stream');
const { decompressCsvStream } = require(${JSON.stringify(utilPath)});

(async () => {
  const sourceStream = Readable.from([
    Buffer.from(${JSON.stringify(SAMPLE_ZIP_BASE64)}, 'base64'),
  ]);
  const decompressedStream = await decompressCsvStream(sourceStream, 'zip');
  const collected = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      collected.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  });

  sink.on('finish', () => {
    process.stdout.write(Buffer.concat(collected).toString('utf8'));
  });
  sink.on('error', (error) => {
    throw error;
  });
  decompressedStream.on('error', (error) => {
    throw error;
  });
  decompressedStream.pipe(sink);
})();
`;

    const text = execFileSync(process.execPath, ['-e', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(text).toBe('Codigo;Estado\n1;Publicada\n');
  });
});
