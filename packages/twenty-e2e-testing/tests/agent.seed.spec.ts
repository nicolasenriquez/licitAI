import { expect, test } from '@playwright/test';

test('agent seed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
