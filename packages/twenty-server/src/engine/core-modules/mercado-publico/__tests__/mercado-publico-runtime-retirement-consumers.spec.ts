import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const serverSourceRootPath = join(__dirname, '../../../..');
const serverPackageRootPath = join(__dirname, '../../../../..');

const readServerSource = (...segments: string[]) => {
  return readFileSync(join(serverSourceRootPath, ...segments), 'utf8');
};

const runtimeLegacyFiles = [
  'commands/mercado-publico-run.command.ts',
  'commands/mercado-publico-run.command.spec.ts',
  'jobs/mercado-publico.job.ts',
  'services/mercado-publico-job-orchestrator.service.ts',
  'services/mercado-publico-canonical-refresh.service.ts',
  'services/mercado-publico-reconciliation.service.ts',
  'services/mercado-publico-api-v1-licitaciones-by-date.service.ts',
  'services/mercado-publico-api-v1-licitaciones-by-state.service.ts',
  'services/mercado-publico-api-v1-licitacion-detail-by-codigo.service.ts',
  'services/mercado-publico-api-v1-oc-by-date.service.ts',
  'services/mercado-publico-api-v1-oc-by-state.service.ts',
  'services/mercado-publico-api-v1-oc-detail-by-codigo.service.ts',
  'services/mercado-publico-api-v2-compra-agil-incremental.service.ts',
  'services/mercado-publico-api-v2-compra-agil-publication-window.service.ts',
  'services/mercado-publico-api-v2-compra-agil-detail-by-codigo.service.ts',
  'services/mercado-publico-csv-download-shared.service.ts',
  'services/mercado-publico-csv-oc-download.service.ts',
  'services/mercado-publico-csv-licitaciones-download.service.ts',
  'services/mercado-publico-csv-profile.service.ts',
  'services/mercado-publico-csv-profiling.service.ts',
  'services/mercado-publico-csv-raw-load.service.ts',
  'services/mercado-publico-csv-staging-projection.service.ts',
  'services/utils/build-mercado-publico-error-summary-text.util.ts',
  'services/utils/map-mercado-publico-error-summary-to-job-run-status.util.ts',
  'drivers/api/mercado-publico-api-v1-licitaciones-client.service.ts',
  'drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service.ts',
  'drivers/api/types/mercado-publico-api-v1-licitacion-record.type.ts',
  'drivers/api/types/mercado-publico-api-v1-orden-de-compra-record.type.ts',
  'drivers/api/utils/extract-v1-licitacion-detail-record.util.ts',
  'drivers/api/utils/extract-v1-licitaciones-list-records.util.ts',
  'drivers/api/utils/extract-v1-ordenes-de-compra-list-records.util.ts',
  'drivers/api/utils/format-v1-date.util.ts',
  'drivers/api/utils/normalize-v1-licitacion-state.util.ts',
  'drivers/api/utils/normalize-licitacion-type.util.ts',
  'drivers/api/utils/normalize-oc-state.util.ts',
  'services/__tests__/mercado-publico-job-orchestrator.service.spec.ts',
  'services/__tests__/mercado-publico-canonical-refresh.service.spec.ts',
  'services/__tests__/mercado-publico-reconciliation.service.spec.ts',
  'services/__tests__/mercado-publico-api-v1-licitaciones-by-date.service.spec.ts',
  'services/__tests__/mercado-publico-api-v1-licitaciones-by-state.service.spec.ts',
  'services/__tests__/mercado-publico-api-v1-licitacion-detail-by-codigo.service.spec.ts',
  'services/__tests__/mercado-publico-api-v1-oc-by-date.service.spec.ts',
  'services/__tests__/mercado-publico-api-v1-oc-by-state.service.spec.ts',
  'services/__tests__/mercado-publico-api-v1-oc-detail-by-codigo.service.spec.ts',
  'services/__tests__/mercado-publico-api-v2-compra-agil-incremental.service.spec.ts',
  'services/__tests__/mercado-publico-api-v2-compra-agil-publication-window.service.spec.ts',
  'services/__tests__/mercado-publico-api-v2-compra-agil-detail-by-codigo.service.spec.ts',
  'services/__tests__/mercado-publico-csv-download-shared.service.spec.ts',
  'services/__tests__/mercado-publico-csv-oc-download.service.spec.ts',
  'services/__tests__/mercado-publico-csv-licitaciones-download.service.spec.ts',
  'services/__tests__/mercado-publico-csv-profile.service.spec.ts',
  'services/__tests__/mercado-publico-csv-profiling.service.spec.ts',
  'services/__tests__/mercado-publico-csv-raw-load.service.spec.ts',
  'services/__tests__/mercado-publico-csv-raw-load-licitaciones.spec.ts',
  'services/__tests__/mercado-publico-csv-staging-projection.service.spec.ts',
  'services/__tests__/csv-staging-projection.integration.spec.ts',
  'drivers/api/__tests__/mercado-publico-api-v1-licitaciones-client.service.spec.ts',
  'drivers/api/__tests__/mercado-publico-api-v1-ordenes-de-compra-client.service.spec.ts',
  'drivers/api/utils/__tests__/extract-v1-licitacion-detail-record.util.spec.ts',
  'drivers/api/utils/__tests__/extract-v1-ordenes-de-compra-list-records.util.spec.ts',
  'drivers/api/utils/__tests__/format-v1-date.util.spec.ts',
  'drivers/api/utils/__tests__/normalize-v1-licitacion-state.util.spec.ts',
  'drivers/api/utils/__tests__/normalize-licitacion-type.util.spec.ts',
  'drivers/api/utils/__tests__/normalize-oc-state.util.spec.ts',
];

const runtimeLegacyDirectories = [
  'services/utils/csv',
  'services/utils/__tests__/csv',
];

const runtimeLegacyIntegrationSuites = [
  'test/integration/mercado-publico/suites/api-v1-licitaciones-canonical-refresh.integration-spec.ts',
  'test/integration/mercado-publico/suites/csv-ingestion-canonical-refresh.integration-spec.ts',
  'test/integration/mercado-publico/suites/reconciliation-refresh.integration-spec.ts',
];

describe('Mercado Publico runtime retirement zero-consumer contract', () => {
  it('removes every V1/CSV driver, service, job, CLI, and orphaned spec', () => {
    const missingFiles = runtimeLegacyFiles
      .map((file) =>
        join(
          serverSourceRootPath,
          'engine',
          'core-modules',
          'mercado-publico',
          file,
        ),
      )
      .filter((filePath) => existsSync(filePath));

    expect(missingFiles).toEqual([]);
  });

  it('removes the CSV util, spec, and fixture directories', () => {
    const missingDirectories = runtimeLegacyDirectories
      .map((directory) =>
        join(
          serverSourceRootPath,
          'engine',
          'core-modules',
          'mercado-publico',
          directory,
        ),
      )
      .filter((directoryPath) => existsSync(directoryPath));

    expect(missingDirectories).toEqual([]);
  });

  it('removes the displaced V1/CSV integration suites', () => {
    const missingSuites = runtimeLegacyIntegrationSuites
      .map((suite) => join(serverPackageRootPath, suite))
      .filter((suitePath) => existsSync(suitePath));

    expect(missingSuites).toEqual([]);
  });

  it('registers no V1/CSV provider, job, command, or displaced V2 backbone service in the module', () => {
    const moduleSource = readServerSource(
      'engine',
      'core-modules',
      'mercado-publico',
      'mercado-publico.module.ts',
    );

    expect(moduleSource).not.toMatch(/\bMercadoPublicoRunCommand\b/);
    expect(moduleSource).not.toMatch(/\bMercadoPublicoJob\b/);
    expect(moduleSource).not.toMatch(
      /\bMercadoPublicoJobOrchestratorService\b/,
    );
    expect(moduleSource).not.toMatch(
      /\bMercadoPublicoCanonicalRefreshService\b/,
    );
    expect(moduleSource).not.toMatch(/\bMercadoPublicoReconciliationService\b/);
    expect(moduleSource).not.toMatch(/\bMercadoPublicoApiV1\w+\b/);
    expect(moduleSource).not.toMatch(/\bMercadoPublicoCsv\w+\b/);
    expect(moduleSource).not.toMatch(
      /\bMercadoPublicoApiV2CompraAgil(Incremental|PublicationWindow|DetailByCodigo)Service\b/,
    );
  });

  it('prunes V1/CSV constants from the shared constants file', () => {
    const constantsSource = readServerSource(
      'engine',
      'core-modules',
      'mercado-publico',
      'mercado-publico.constants.ts',
    );

    expect(constantsSource).not.toMatch(/MERCADO_PUBLICO_API_V1_/);
    expect(constantsSource).not.toMatch(/MERCADO_PUBLICO_CSV_/);
    expect(constantsSource).not.toMatch(/MERCADO_PUBLICO_RECONCILIATION/);
    expect(constantsSource).not.toContain('api-v1-licitaciones');
    expect(constantsSource).not.toContain('csv-raw-load');
    expect(constantsSource).not.toContain('reconciliation-refresh');
    expect(constantsSource).toContain('mercado-publico-v2-sync-command');
  });

  it('prunes V1/CSV storage branches from the retained persistence unit spec', () => {
    const persistenceSpecSource = readServerSource(
      'engine',
      'core-modules',
      'mercado-publico',
      'services',
      '__tests__',
      'mercado-publico-persistence.service.spec.ts',
    );

    expect(persistenceSpecSource).not.toMatch(/stg_api_v1_/);
    expect(persistenceSpecSource).not.toMatch(/stg_csv_/);
  });

  it('keeps the accepted V2 runtime surface intact', () => {
    const v2Files = [
      'commands/mercado-publico-sync-operator.command.ts',
      'jobs/mercado-publico-v2-sync-command.job.ts',
      'crons/jobs/mercado-publico-v2-sync-recovery.cron.job.ts',
      'crons/jobs/mercado-publico-v2-debt-recovery.cron.job.ts',
      'services/mercado-publico-v2-durable-sync.service.ts',
      'services/mercado-publico-v2-projection.service.ts',
      'services/mercado-publico-v2-evidence-replay.service.ts',
      'services/mercado-publico-config.service.ts',
      'services/mercado-publico-persistence.service.ts',
      'services/mercado-publico-quota-tracker.service.ts',
      'drivers/api/mercado-publico-api-v2-compra-agil-client.service.ts',
    ].map((file) =>
      join(
        serverSourceRootPath,
        'engine',
        'core-modules',
        'mercado-publico',
        file,
      ),
    );

    expect(v2Files.filter((filePath) => existsSync(filePath))).toEqual(v2Files);
  });
});
