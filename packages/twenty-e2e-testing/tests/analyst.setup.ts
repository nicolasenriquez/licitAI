import { test } from '@playwright/test';
import path from 'path';

import { authenticateAndSave } from '../lib/auth/authenticate';

const analystLogin = process.env.ANALYST_LOGIN;

if (analystLogin === undefined || analystLogin.length === 0) {
  throw new Error('ANALYST_LOGIN is required for the analyst Playwright setup');
}

test('Login test (analyst)', async ({ page }) => {
  test.setTimeout(300_000);

  await authenticateAndSave(
    page,
    path.resolve(__dirname, '..', '.auth', 'analyst.json'),
    analystLogin,
  );
});
