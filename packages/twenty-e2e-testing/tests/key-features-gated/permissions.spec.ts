import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { authenticateAndSave } from '../../lib/auth/authenticate';

test('a restricted role cannot edit People or use CSV import and export', async ({ browser, page }) => {
  const roleName = `E2E restricted ${randomUUID()}`;
  const restrictedContext = await browser.newContext();
  const restrictedPage = await restrictedContext.newPage();

  try {
    await page.goto('/');
    await page.getByTestId('workspace-dropdown').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Roles' }).click();
    await page.getByRole('button', { name: 'Create Role' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(roleName);
    await page.getByText('People', { exact: true }).click();
    await page.getByText('Read', { exact: true }).click();
    await page.getByText('Emails', { exact: true }).click();
    await page.getByRole('button', { name: 'Assign to member' }).click();
    await page.getByText(process.env.PERMISSIONS_LOGIN!, { exact: true }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await authenticateAndSave(
      restrictedPage,
      undefined,
      process.env.PERMISSIONS_LOGIN,
      process.env.PERMISSIONS_PASSWORD,
    );
    await restrictedPage.goto('/objects/people');
    await expect(restrictedPage.getByRole('button', { name: /^New Person/ })).toBeHidden();
    await expect(restrictedPage.getByText('Import', { exact: true })).toBeHidden();
    await expect(restrictedPage.getByText('Export', { exact: true })).toBeHidden();
  } finally {
    await restrictedContext.close();
    await page.goto('/');
    await page.getByTestId('workspace-dropdown').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Roles' }).click();
    const role = page.getByText(roleName, { exact: true });
    if (await role.isVisible().catch(() => false)) {
      await role.click();
      await page.getByRole('button', { name: 'Delete' }).click();
    }
  }
});
