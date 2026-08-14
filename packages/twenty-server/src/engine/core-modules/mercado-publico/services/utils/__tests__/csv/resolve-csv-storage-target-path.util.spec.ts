import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { resolveCsvStorageTargetPath } from 'src/engine/core-modules/mercado-publico/services/utils/csv/resolve-csv-storage-target-path.util';

describe('resolveCsvStorageTargetPath', () => {
  it('addresses downloaded files by checksum while preserving extension', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mp-csv-path-'));

    try {
      await expect(
        resolveCsvStorageTargetPath(
          root,
          'oc',
          '2026-06',
          '2026-6.csv',
          'mes-6',
          'a'.repeat(64),
        ),
      ).resolves.toBe(
        join(root, 'oc', '2026-06', 'mes-6', `2026-6.${'a'.repeat(64)}.csv`),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps legacy source filename when checksum is absent', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mp-csv-path-'));

    try {
      await expect(
        resolveCsvStorageTargetPath(root, 'oc', '2026-06', '2026-6.csv'),
      ).resolves.toBe(join(root, 'oc', '2026-06', '_default', '2026-6.csv'));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
