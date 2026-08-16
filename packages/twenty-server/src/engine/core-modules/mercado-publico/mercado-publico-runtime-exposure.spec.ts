import { readFileSync } from 'fs';
import { join } from 'path';

import { TWENTY_CURRENT_VERSION } from 'src/engine/core-modules/upgrade/constants/twenty-current-version.constant';

const serverSourceRootPath = join(__dirname, '../../..');

const readServerSource = (...segments: string[]) => {
  return readFileSync(join(serverSourceRootPath, ...segments), 'utf8');
};

describe('MercadoPublico runtime exposure', () => {
  it('exposes MercadoPublicoModule in the app and worker composition roots', () => {
    expect(TWENTY_CURRENT_VERSION).toBe('2.16.0');

    const coreEngineModuleSource = readServerSource(
      'engine',
      'core-modules',
      'core-engine.module.ts',
    );
    const jobsModuleSource = readServerSource(
      'engine',
      'core-modules',
      'message-queue',
      'jobs.module.ts',
    );
    const mercadoPublicoModuleSource = readServerSource(
      'engine',
      'core-modules',
      'mercado-publico',
      'mercado-publico.module.ts',
    );

    expect(coreEngineModuleSource).toContain('MercadoPublicoModule');
    expect(jobsModuleSource).toContain('MercadoPublicoModule');
    expect(mercadoPublicoModuleSource).toContain(
      'MercadoPublicoSyncOperatorCommand',
    );
  });
});
