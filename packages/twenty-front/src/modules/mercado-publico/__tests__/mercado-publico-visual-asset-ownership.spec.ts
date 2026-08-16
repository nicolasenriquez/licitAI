import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const frontSourceRootPath = join(__dirname, '../../..');

const mercadPublicoAreas = [
  join(frontSourceRootPath, 'modules', 'mercado-publico'),
  join(frontSourceRootPath, 'pages', 'mercado-publico'),
];

const walkFiles = (directoryPath: string): string[] => {
  const entries = readdirSync(directoryPath);

  return entries.flatMap((entry) => {
    const entryPath = join(directoryPath, entry);

    if (statSync(entryPath).isDirectory()) {
      return walkFiles(entryPath);
    }

    return [entryPath];
  });
};

describe('Mercado Publico visual asset ownership contract', () => {
  it('keeps Mercado Publico areas free of local stories, styles, and prototypes', () => {
    const allFiles = mercadPublicoAreas.flatMap((areaPath) =>
      walkFiles(areaPath),
    );

    const localVisualAssetFiles = allFiles.filter(
      (filePath) =>
        filePath.endsWith('.stories.tsx') ||
        filePath.endsWith('.styles.ts') ||
        filePath.includes('prototype'),
    );

    expect(localVisualAssetFiles).toEqual([]);
  });

  it('keeps V2 components on shared twenty-ui tokens and patterns', () => {
    const v2ComponentFiles = [
      join(
        frontSourceRootPath,
        'modules',
        'mercado-publico',
        'components',
        'MercadoPublicoV2Nav.tsx',
      ),
      join(
        frontSourceRootPath,
        'modules',
        'mercado-publico',
        'components',
        'MercadoPublicoV2FilterBar.tsx',
      ),
    ];

    for (const filePath of v2ComponentFiles) {
      expect(readFileSync(filePath, 'utf8')).toContain('twenty-ui');
    }
  });
});
