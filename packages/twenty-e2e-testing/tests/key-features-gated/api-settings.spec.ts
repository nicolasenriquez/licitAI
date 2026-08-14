import { expect, test } from '@playwright/test';

test('shows REST and GraphQL playgrounds with their schema documentation', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('workspace-dropdown').click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: /APIs & Webhooks/ }).click();
  await expect(page.getByRole('link', { name: /REST Playground/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /GraphQL Playground/ })).toBeVisible();
  await page.getByRole('link', { name: /GraphQL Playground/ }).click();
  await expect(page.getByText(/Documentation|Schema/)).toBeVisible();
});
