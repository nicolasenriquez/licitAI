import { MODULE_METADATA } from '@nestjs/common/constants';

import { CoreEngineModule } from 'src/engine/core-modules/core-engine.module';
import { MercadoPublicoModule } from 'src/engine/core-modules/mercado-publico/mercado-publico.module';
import { MercadoPublicoRunCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-run.command';
import { JobsModule } from 'src/engine/core-modules/message-queue/jobs.module';
import { TWENTY_CURRENT_VERSION } from 'src/engine/core-modules/upgrade/constants/twenty-current-version.constant';

describe('MercadoPublico runtime exposure', () => {
  it('should expose MercadoPublicoModule through the 2.16.0 app and worker composition roots', () => {
    expect(TWENTY_CURRENT_VERSION).toBe('2.16.0');

    expect(
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, CoreEngineModule),
    ).toContain(MercadoPublicoModule);
    expect(
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, JobsModule),
    ).not.toContain(MercadoPublicoModule);
    expect(
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, MercadoPublicoModule),
    ).toContain(MercadoPublicoRunCommand);
  });
});
