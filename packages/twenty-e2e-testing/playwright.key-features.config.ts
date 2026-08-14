import { defineConfig } from '@playwright/test';

import { playwrightConfig } from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  testDir: './tests/key-features-gated',
  testIgnore: [],
  globalSetup: './scripts/global-setup-key-features-gated.ts',
});
