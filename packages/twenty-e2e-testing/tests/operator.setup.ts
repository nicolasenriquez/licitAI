import { test } from '@playwright/test';
import path from 'path';

import { authenticateAndSave } from '../lib/auth/authenticate';

test('Login test (operator)', async ({ page }) => {
  test.setTimeout(300_000);

  await authenticateAndSave(
    page,
    path.resolve(__dirname, '..', '.auth', 'operator.json'),
  );
});
