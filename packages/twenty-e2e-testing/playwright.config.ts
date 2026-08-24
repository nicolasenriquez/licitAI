import { defineConfig } from '@playwright/test';
import path from 'node:path';

import {
  desktopChromeUse,
  sharedPlaywrightConfig,
} from './playwright.base.config';

export const playwrightConfig = {
  ...sharedPlaywrightConfig,
  testDir: './tests',
  testIgnore: /(?:external-integrations|key-features-gated|mercado-publico)\//,
  projects: [
    { name: 'setup-team', testMatch: /login\.setup\.ts/ },
    {
      name: 'chrome',
      use: {
        ...desktopChromeUse,
        storageState: path.resolve(__dirname, '.auth', 'user.json'),
      },
      dependencies: ['setup-team'],
    },
  ],
};

export const buildNarrowedTestProjects = playwrightConfig.projects.map(
  (project) =>
    project.name === 'setup-team'
      ? { ...project, testDir: './tests' }
      : project,
);

export default defineConfig(playwrightConfig);
