import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const serverSourceRootPath = join(__dirname, '../../../..');

const csvFixturesDirectoryPath = join(
  serverSourceRootPath,
  'engine',
  'core-modules',
  'mercado-publico',
  'services',
  'utils',
  '__tests__',
  'csv',
  'fixtures',
);

const v2FixturesDirectoryPath = join(
  serverSourceRootPath,
  'engine',
  'core-modules',
  'mercado-publico',
  'drivers',
  'api',
  '__tests__',
  'fixtures',
);

describe('Mercado Publico visual asset retirement ownership contract', () => {
  it('removes every displaced CSV licitaciones fixture', () => {
    const csvFixtureFiles = existsSync(csvFixturesDirectoryPath)
      ? readdirSync(csvFixturesDirectoryPath).filter((fileName) =>
          fileName.startsWith('licitaciones-'),
        )
      : [];

    expect(csvFixtureFiles).toEqual([]);
  });

  it('keeps the shared V2 JSON fixture evidence intact', () => {
    const v2FixtureFiles = readdirSync(v2FixturesDirectoryPath).filter(
      (fileName) =>
        fileName.startsWith('v2-compra-agil-') && fileName.endsWith('.json'),
    );

    expect(v2FixtureFiles.length).toBeGreaterThan(0);
  });
});
