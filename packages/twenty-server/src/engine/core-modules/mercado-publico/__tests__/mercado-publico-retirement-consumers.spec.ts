import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const serverSourceRootPath = join(__dirname, '../../../..');

const readServerSource = (...segments: string[]) => {
  return readFileSync(join(serverSourceRootPath, ...segments), 'utf8');
};

const legacyServerFiles = [
  'mercado-publico-query.resolver.ts',
  'dtos/mercado-publico-query.dto.ts',
  'services/mercado-publico-detected-process-read.service.ts',
  'services/mercado-publico-process-detail-read.service.ts',
  'services/mercado-publico-job-run-read.service.ts',
  'services/mercado-publico-api-call-log-read.service.ts',
  'services/mercado-publico-pipeline-health-read.service.ts',
  'services/mercado-publico-api-quota-usage-read.service.ts',
  'services/mercado-publico-csv-file-health-read.service.ts',
];

describe('Mercado Publico retirement zero-consumer contract', () => {
  it('removes the legacy resolver, DTO, redaction, and read-service closure', () => {
    const missingFiles = legacyServerFiles
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

  it('registers no legacy query resolver in the module', () => {
    const moduleSource = readServerSource(
      'engine',
      'core-modules',
      'mercado-publico',
      'mercado-publico.module.ts',
    );

    expect(moduleSource).not.toContain('MercadoPublicoQueryResolver');
    expect(moduleSource).not.toContain('DetectedProcessesReadService');
    expect(moduleSource).not.toContain('CsvFileHealthReadService');
  });

  it('keeps the accepted V2 resolver surface intact', () => {
    const v2Files = [
      'engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver.ts',
      'engine/core-modules/mercado-publico/graphql/mercado-publico-v2-sync-control.resolver.ts',
      'engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service.ts',
    ].map((file) => join(serverSourceRootPath, file));

    expect(v2Files.filter((filePath) => existsSync(filePath))).toEqual(v2Files);
  });
});
