import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { TWENTY_CURRENT_VERSION } from 'src/engine/core-modules/upgrade/constants/twenty-current-version.constant';

const readSourceFile = (relativePath: string): string =>
  readFileSync(join(__dirname, relativePath), 'utf8');

describe('MercadoPublico runtime exposure', () => {
  it('should expose MercadoPublicoModule through the 2.16.0 app and worker composition roots', () => {
    expect(TWENTY_CURRENT_VERSION).toBe('2.16.0');

    const coreEngineModuleSource = readSourceFile('../core-engine.module.ts');
    const jobsModuleSource = readSourceFile('../message-queue/jobs.module.ts');
    const mercadoPublicoModuleSource = readSourceFile(
      './mercado-publico.module.ts',
    );

    expect(coreEngineModuleSource).toMatch(
      /imports:[\s\S]*MercadoPublicoModule/u,
    );
    expect(jobsModuleSource).not.toContain('MercadoPublicoModule');
    expect(mercadoPublicoModuleSource).toContain('MercadoPublicoRunCommand');
    expect(mercadoPublicoModuleSource).toContain(
      "import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';",
    );
    expect(mercadoPublicoModuleSource).toContain(
      "import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';",
    );
    expect(mercadoPublicoModuleSource).toMatch(
      /imports:\s*\[[\s\S]*SecureHttpClientModule,[\s\S]*TokenModule,[\s\S]*WorkspaceCacheStorageModule/u,
    );
  });
});
