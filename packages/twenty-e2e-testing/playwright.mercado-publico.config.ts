import { defineConfig } from '@playwright/test';
import path from 'node:path';

import {
  desktopChromeUse,
  sharedPlaywrightConfig,
} from './playwright.base.config';

export default defineConfig({
  ...sharedPlaywrightConfig,
  testDir: './tests',
  webServer: {
    ...sharedPlaywrightConfig.webServer,
    command:
      'npx vite preview --config packages/twenty-front/vite.config.ts --port 3001 --strictPort',
  },
  projects: [
    { name: 'setup-team', testMatch: /login\.setup\.ts/ },
    { name: 'setup-operator', testMatch: /operator\.setup\.ts/ },
    { name: 'setup-analyst', testMatch: /analyst\.setup\.ts/ },
    {
      name: 'chrome',
      testDir: './tests/mercado-publico',
      testMatch: [/ui-contract\/.+\.spec\.ts/, /journeys\/.+\.spec\.ts/],
      use: {
        ...desktopChromeUse,
        storageState: path.resolve(__dirname, '.auth', 'user.json'),
      },
      dependencies: ['setup-team'],
    },
    {
      name: 'operator',
      testDir: './tests/mercado-publico',
      testMatch: /roles\/operator\.spec\.ts/,
      use: {
        ...desktopChromeUse,
        storageState: path.resolve(__dirname, '.auth', 'operator.json'),
      },
      dependencies: ['setup-operator'],
    },
    {
      name: 'analyst',
      testDir: './tests/mercado-publico',
      testMatch: /roles\/analyst-denied\.spec\.ts/,
      use: {
        ...desktopChromeUse,
        storageState: path.resolve(__dirname, '.auth', 'analyst.json'),
      },
      dependencies: ['setup-analyst'],
    },
  ],
});
