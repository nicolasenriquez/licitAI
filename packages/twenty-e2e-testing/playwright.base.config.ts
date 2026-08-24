import { devices, type PlaywrightTestConfig } from '@playwright/test';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '.env'), quiet: true });

export const sharedPlaywrightConfig = {
  outputDir: 'run_results/',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 30_000,
  webServer: {
    command:
      'npx nx build twenty-front --skip-nx-cache && npx nx run twenty-front:preview --watch=false --open=false',
    cwd: path.resolve(__dirname, '../..'),
    url: 'http://localhost:3001',
    timeout: 300_000,
    reuseExistingServer: false,
  },
  use: {
    baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    testIdAttribute: 'data-testid',
  },
  expect: { timeout: 5_000 },
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['./reporters/log-summary-reporter.ts'],
    ['html', { open: 'never' }],
  ],
} satisfies PlaywrightTestConfig;

export const desktopChromeUse = {
  ...devices['Desktop Chrome'],
  permissions: ['clipboard-read', 'clipboard-write'],
};
