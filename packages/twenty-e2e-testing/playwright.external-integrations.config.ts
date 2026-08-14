import { defineConfig } from '@playwright/test';

import {
  buildNarrowedTestProjects,
  playwrightConfig,
} from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  testDir: './tests/external-integrations',
  testIgnore: [],
  projects: buildNarrowedTestProjects,
  globalSetup: './scripts/global-setup-external-integrations.ts',
});
