import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import * as path from 'path';

const envResult = config({
  path: path.resolve(__dirname, '.env'),
});

if (envResult.error) {
  throw new Error('Failed to load .env file');
}

const analystLogin = process.env.ANALYST_LOGIN ?? '';

/* === Run your local dev server before starting the tests === */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export const GLOBAL_TEST_IGNORE =
  /.*(external-integrations|key-features-gated|mercado-publico-contract).*/;

export const playwrightConfig = {
  testDir: './tests',
  testIgnore: GLOBAL_TEST_IGNORE,
  outputDir: 'run_results/',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: false, // parallelization of tests will be done later in the future
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 1 worker = 1 test at the time, tests can't be parallelized
  timeout: 30 * 1000, // timeout can be changed
  webServer: {
    command:
      'npx nx build twenty-front --skip-nx-cache && npx nx run twenty-front:preview --watch=false --open=false',
    cwd: path.resolve(__dirname, '../..'),
    url: 'http://localhost:3001',
    timeout: 300 * 1000,
    reuseExistingServer: false,
  },
  use: {
    baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3001',
    trace: 'retain-on-failure', // trace takes EVERYTHING from page source, records every single step, should be used only when normal debugging won't work
    screenshot: 'only-on-failure',
    headless: true, // instead of changing it to false, run 'yarn test:e2e:debug' or 'yarn test:e2e:ui'
    testIdAttribute: 'data-testid', // taken from Twenty source
  },
  expect: {
    timeout: 5000,
  },
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['./reporters/log-summary-reporter.ts'],
  ],
  projects: [
    {
      name: 'setup-team',
      testMatch: /login\.setup\.ts/,
    },
    {
      name: 'chrome',
      testIgnore: [
        GLOBAL_TEST_IGNORE,
        /.*sync-control.*/,
        /.*cutover-route-matrix.*/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-read', 'clipboard-write'],
        storageState: path.resolve(__dirname, '.auth', 'user.json'), // takes saved cookies from directory
      },
      dependencies: ['setup-team'],
    },
    {
      name: 'setup-operator',
      testMatch: /operator\.setup\.ts/,
    },
    {
      name: 'operator',
      testMatch: /.*(sync-control|cutover-route-matrix).*/,
      grep: /@operator/,
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-read', 'clipboard-write'],
        storageState: path.resolve(__dirname, '.auth', 'operator.json'),
      },
      dependencies: ['setup-operator'],
    },
    ...(analystLogin.length > 0
      ? [
          {
            name: 'setup-analyst',
            testMatch: /analyst\.setup\.ts/,
          },
          {
            name: 'analyst',
            testMatch: /.*(sync-control|cutover-route-matrix).*/,
            grep: /@analyst/,
            use: {
              ...devices['Desktop Chrome'],
              permissions: ['clipboard-read', 'clipboard-write'],
              storageState: path.resolve(__dirname, '.auth', 'analyst.json'),
            },
            dependencies: ['setup-analyst'],
          },
        ]
      : []),

    //{
    //  name: 'webkit',
    //  use: { ...devices['Desktop Safari'] },
    //},

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    //{
    //  name: 'Microsoft Edge',
    //  use: { ...devices['Desktop Edge'], channel: 'msedge' },
    //},
    //{
    //  name: 'Google Chrome',
    //  use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    //},
  ],
};

export const buildNarrowedTestProjects = playwrightConfig.projects.map(
  (project) => {
    if (project.name === 'setup-team') {
      return { ...project, testDir: './tests' };
    }

    if (project.name === 'chrome') {
      return { ...project, testIgnore: [] };
    }

    return project;
  },
);

export default defineConfig(playwrightConfig);
