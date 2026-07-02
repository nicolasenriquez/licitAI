import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

import { HashPassThrough } from 'src/engine/core-modules/mercado-publico/services/utils/csv/create-hash-pass-through.util';

const createDevNull = (): Writable =>
  new Writable({
    write(_chunk: Buffer, _encoding: string, callback: () => void) {
      callback();
    },
  });

describe('HashPassThrough', () => {
  it('should compute sha256 and byte count for a stream', async () => {
    const hashStream = new HashPassThrough();
    const input = Readable.from([Buffer.from('hello world')]);

    await pipeline(input, hashStream, createDevNull());

    expect(hashStream.bytes).toBe(11);
    expect(hashStream.digest).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    );
  });

  it('should pass data through unchanged', async () => {
    const hashStream = new HashPassThrough();
    const chunks: Buffer[] = [];

    const input = Readable.from([Buffer.from('test')]);
    const output = new Writable({
      write(chunk: Buffer, _encoding: BufferEncoding, callback: () => void) {
        chunks.push(chunk);
        callback();
      },
    });

    await pipeline(input, hashStream, output);

    const result = Buffer.concat(chunks).toString();
    expect(result).toBe('test');
  });

  it('should throw if digest accessed before stream finish', () => {
    const hashStream = new HashPassThrough();

    expect(() => hashStream.digest).toThrow('not yet available');
  });

  it('should compute correct sha256 for larger data', async () => {
    const hashStream = new HashPassThrough();
    const data = Buffer.alloc(100000, 'x');

    const input = Readable.from([data]);
    await pipeline(input, hashStream, createDevNull());

    expect(hashStream.bytes).toBe(100000);
    expect(hashStream.digest).toHaveLength(64);
  });

  it('should compute hash of compressed data', async () => {
    const hashStream = new HashPassThrough();
    const input = Readable.from([Buffer.from('repeated content '.repeat(100))]);

    const gzipStream = createGzip();
    input.pipe(gzipStream).pipe(hashStream);

    await pipeline(hashStream, createDevNull());

    expect(hashStream.bytes).toBeGreaterThan(0);
    expect(hashStream.digest).toHaveLength(64);
  });
});
