import { expect, test } from '@playwright/test';

test('connects the disposable mailbox, syncs its expected message, and disconnects it', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('workspace-dropdown').click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: /Accounts/ }).click();
  await page.getByText(process.env.E2E_EXTERNAL_MAILBOX!, { exact: true }).click();
  await page.getByRole('button', { name: /Connect/ }).click();
  await page.waitForURL(/oauth|authorize|callback/);
  await expect(page.getByText(process.env.E2E_EXTERNAL_EXPECTED_SUBJECT!)).toBeVisible({
    timeout: 120_000,
  });
  await page.getByRole('button', { name: /Disconnect/ }).click();
});
