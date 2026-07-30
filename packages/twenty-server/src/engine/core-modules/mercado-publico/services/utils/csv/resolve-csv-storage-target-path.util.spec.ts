import path from 'node:path';

import { resolveCsvStoragePath } from './resolve-csv-storage-target-path.util';

describe('resolveCsvStoragePath', () => {
  it('rejects metadata that could escape the configured storage root', () => {
    expect(() =>
      resolveCsvStoragePath(
        '/tmp/mercado-publico',
        '../licitaciones',
        '2026-07',
        'source.csv',
      ),
    ).toThrow('Unsafe source_dataset');
  });

  it('resolves retained CSV metadata below the configured storage root', () => {
    expect(
      resolveCsvStoragePath(
        '/tmp/mercado-publico',
        'licitaciones',
        '2026-07',
        'source.csv',
      ),
    ).toBe(
      path.resolve(
        '/tmp/mercado-publico',
        'licitaciones',
        '2026-07',
        '_default',
        'source.csv',
      ),
    );
  });
});
