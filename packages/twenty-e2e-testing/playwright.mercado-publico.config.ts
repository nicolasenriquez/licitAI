import { defineConfig } from '@playwright/test';

import { playwrightConfig } from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  webServer: {
    ...playwrightConfig.webServer,
    // Serve the harness-patched build without rebuilding, so the isolated
    // server base URL injected into build/index.html survives.
    command:
      'npx vite preview --config packages/twenty-front/vite.config.ts --port 3001 --strictPort',
  },
  globalTeardown:
    process.env.MERCADO_PUBLICO_V2_KEEP_E2E_ENV === 'true'
      ? undefined
      : './scripts/cleanup-mercado-publico-e2e.mjs',
});
