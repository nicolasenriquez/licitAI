import { readFileSync } from 'fs';
import { join } from 'path';

import { TWENTY_CURRENT_VERSION } from 'src/engine/core-modules/upgrade/constants/twenty-current-version.constant';

const readServerSource = (...segments: string[]) => {
  return readFileSync(join(process.cwd(), 'src', ...segments), 'utf8');
};

describe('MercadoPublico runtime exposure', () => {
  it('keeps MercadoPublicoModule out of the 2.15.0 app and worker composition roots', () => {
    expect(TWENTY_CURRENT_VERSION).toBe('2.15.0');

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

    expect(coreEngineModuleSource).not.toContain('MercadoPublicoModule');
    expect(jobsModuleSource).not.toContain('MercadoPublicoModule');
    expect(mercadoPublicoModuleSource).toContain('MercadoPublicoRunCommand');
  });
});
