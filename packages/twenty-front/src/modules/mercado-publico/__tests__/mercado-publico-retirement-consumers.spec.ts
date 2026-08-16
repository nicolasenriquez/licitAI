import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const frontSourceRootPath = join(__dirname, '../../..');

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

const readModuleSource = (...segments: string[]) => {
  return readFileSync(join(frontSourceRootPath, ...segments), 'utf8');
};

const legacyModuleFiles = [
  'components/MercadoPublicoBrowseTab.tsx',
  'components/MercadoPublicoControlCenterTab.tsx',
  'components/MercadoPublicoProcessDetailPanel.tsx',
  'hooks/useMercadoPublicoDetectedProcesses.ts',
  'hooks/useMercadoPublicoProcessDetail.ts',
  'hooks/useMercadoPublicoJobRuns.ts',
  'hooks/useMercadoPublicoApiCallLog.ts',
  'hooks/useMercadoPublicoPipelineHealth.ts',
  'hooks/useMercadoPublicoApiQuotaUsage.ts',
  'hooks/useMercadoPublicoCsvFileHealth.ts',
  'hooks/mercadoPublicoQueryHelpers.ts',
  'utils/parseMercadoPublicoTabHash.ts',
  'utils/mercadoPublicoDisplay.ts',
];

const legacyGraphqlFiles = [
  'graphql/queries/getMercadoPublicoDetectedProcesses.ts',
  'graphql/queries/getMercadoPublicoProcessDetail.ts',
  'graphql/queries/getMercadoPublicoJobRuns.ts',
  'graphql/queries/getMercadoPublicoApiCallLog.ts',
  'graphql/queries/getMercadoPublicoPipelineHealth.ts',
  'graphql/queries/getMercadoPublicoApiQuotaUsage.ts',
  'graphql/queries/getMercadoPublicoCsvFileHealth.ts',
  'graphql/fragments/mercadoPublicoDetectedProcessFragment.ts',
  'graphql/fragments/mercadoPublicoProcessDetailFragment.ts',
  'graphql/fragments/mercadoPublicoJobRunFragment.ts',
  'graphql/fragments/mercadoPublicoApiCallLogFragment.ts',
  'graphql/fragments/mercadoPublicoPipelineHealthFragment.ts',
  'graphql/fragments/mercadoPublicoApiQuotaUsageFragment.ts',
  'graphql/fragments/mercadoPublicoCsvFileHealthFragment.ts',
];

describe('Mercado Publico retirement zero-consumer contract', () => {
  it('has no source import of the legacy generated GraphQL module', () => {
    const importingFiles = walkFiles(frontSourceRootPath).filter(
      (filePath) =>
        (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
        !filePath.endsWith('.spec.ts') &&
        !filePath.endsWith('.spec.tsx'),
    );
    const legacyImportingFiles = importingFiles.filter((filePath) =>
      readFileSync(filePath, 'utf8').includes('mercado-publico-legacy.graphql'),
    );

    expect(legacyImportingFiles).toEqual([]);
  });

  it('removes every displaced legacy module file', () => {
    const missingFiles = [...legacyModuleFiles, ...legacyGraphqlFiles]
      .map((file) =>
        join(frontSourceRootPath, 'modules', 'mercado-publico', file),
      )
      .filter((filePath) => existsSync(filePath));

    expect(missingFiles).toEqual([]);
  });

  it('removes the legacy command center page and generated output', () => {
    expect(
      existsSync(
        join(
          frontSourceRootPath,
          'pages',
          'mercado-publico',
          'MercadoPublicoCommandCenterPage.tsx',
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(
          frontSourceRootPath,
          'generated',
          'mercado-publico-legacy.graphql.ts',
        ),
      ),
    ).toBe(false);
  });

  it('keeps AppPath free of the legacy alias', () => {
    const appPathSource = readFileSync(
      join(
        frontSourceRootPath,
        '..',
        '..',
        'twenty-shared',
        'src',
        'types',
        'AppPath.ts',
      ),
      'utf8',
    );

    expect(appPathSource).not.toContain('MercadoPublicoLegacy');
  });

  it('composes the router without the legacy route or page', () => {
    const routerSource = readModuleSource(
      'modules',
      'app',
      'hooks',
      'useCreateAppRouter.tsx',
    );

    expect(routerSource).not.toContain('/mercado-publico/legacy');
    expect(routerSource).not.toContain('MercadoPublicoCommandCenterPage');
  });

  it('keeps the accepted V2 replacement surface intact', () => {
    const v2Files = [
      'pages/mercado-publico/MercadoPublicoV2ActivePage.tsx',
      'modules/mercado-publico/components/MercadoPublicoV2Nav.tsx',
      'modules/mercado-publico/components/MercadoPublicoV2FilterBar.tsx',
      'modules/mercado-publico/hooks/useMercadoPublicoV2UrlState.ts',
    ].map((file) => join(frontSourceRootPath, file));

    expect(v2Files.filter((filePath) => existsSync(filePath))).toEqual(v2Files);
  });
});
