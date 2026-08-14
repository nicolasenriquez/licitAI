import { defineConfig } from '@playwright/test';

import {
  buildNarrowedTestProjects,
  playwrightConfig,
} from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  testDir: './tests/key-features-gated',
  testIgnore: [],
  projects: buildNarrowedTestProjects,
  globalSetup: './scripts/global-setup-key-features-gated.ts',
});
