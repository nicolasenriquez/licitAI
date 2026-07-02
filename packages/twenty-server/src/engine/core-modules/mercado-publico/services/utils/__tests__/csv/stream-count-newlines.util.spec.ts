import { Readable } from 'stream';

import { streamCountNewlines } from 'src/engine/core-modules/mercado-publico/services/utils/csv/stream-count-newlines.util';

describe('streamCountNewlines', () => {
  it('should count newlines in a buffer stream', async () => {
    const stream = Readable.from([
      Buffer.from('line1\nline2\nline3\n'),
    ]);

    const count = await streamCountNewlines(stream);

    expect(count).toBe(3);
  });

  it('should return 0 for stream with no newlines', async () => {
    const stream = Readable.from([Buffer.from('single line')]);

    const count = await streamCountNewlines(stream);

    expect(count).toBe(0);
  });

  it('should count newlines across multiple chunks', async () => {
    const stream = Readable.from([
      Buffer.from('line1\nl'),
      Buffer.from('ine2\nline3\n'),
    ]);

    const count = await streamCountNewlines(stream);

    expect(count).toBe(3);
  });

  it('should return 0 for empty stream', async () => {
    const stream = Readable.from([]);

    const count = await streamCountNewlines(stream);

    expect(count).toBe(0);
  });

  it('should count newlines in large stream', async () => {
    const lines = 'x'.repeat(100) + '\n';
    const data = Buffer.from(lines.repeat(1000));

    const stream = Readable.from([data]);
    const count = await streamCountNewlines(stream);

    expect(count).toBe(1000);
  });
});
