import { defineConfig } from '@playwright/test';

import {
  buildNarrowedTestProjects,
  playwrightConfig,
} from './playwright.config';

export default defineConfig({
  ...playwrightConfig,
  testDir: './tests/key-features',
  testIgnore: [],
  projects: buildNarrowedTestProjects,
});
