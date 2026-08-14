import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

test('creates, saves, and removes a People number dashboard widget', async ({ page }) => {
  const dashboardName = `E2E dashboard ${randomUUID()}`;

  await page.goto('/');
  await page.getByRole('link', { name: 'Dashboards' }).click();
  await page.getByRole('button', { name: 'Create dashboard' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill(dashboardName);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Add widget' }).click();
  await page.getByText('Number', { exact: true }).click();
  await page.getByText('People', { exact: true }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await expect(page.getByText(dashboardName, { exact: true })).toBeVisible();
  await page.getByText('Options', { exact: true }).click();
  await page.getByText('Delete dashboard', { exact: true }).click();
});
