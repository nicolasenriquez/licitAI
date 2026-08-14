import { expect, test } from '@playwright/test';

test('returns from the disposable identity provider with the configured default role', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Single sign-on|SSO/ }).click();
  await page.waitForURL(/oauth|saml|callback/);
  await expect(page.getByText(process.env.E2E_EXTERNAL_DEFAULT_ROLE!)).toBeVisible();
});
