import { defineConfig } from '@playwright/test';

import { playwrightConfig } from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  testDir: './tests/external-integrations',
  testIgnore: [],
  globalSetup: './scripts/global-setup-external-integrations.ts',
});
