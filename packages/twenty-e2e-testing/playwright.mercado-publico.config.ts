import { defineConfig } from '@playwright/test';

import { playwrightConfig } from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  webServer: {
    ...playwrightConfig.webServer,
    command: 'npx nx run twenty-front:preview --watch=false --open=false',
  },
  globalTeardown:
    process.env.MERCADO_PUBLICO_V2_KEEP_E2E_ENV === 'true'
      ? undefined
      : './scripts/cleanup-mercado-publico-e2e.mjs',
});
