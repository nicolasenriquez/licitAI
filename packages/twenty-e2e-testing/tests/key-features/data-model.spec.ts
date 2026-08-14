import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

test('creates a custom object, fields, and a People relation', async ({ page }) => {
  const suffix = randomUUID();
  const objectName = `E2E Project ${suffix}`;
  const objectPluralName = `E2E Projects ${suffix}`;
  const textFieldName = `E2E reference ${suffix}`;
  const relationFieldName = `E2E people ${suffix}`;

  await page.goto('/');
  await page.getByTestId('workspace-dropdown').click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Data model' }).click();
  await page.getByRole('button', { name: 'Add object' }).click();
  await page.getByPlaceholder('Listing', { exact: true }).fill(objectName);
  await page
    .getByPlaceholder('Listings', { exact: true })
    .fill(objectPluralName);
  await page.getByRole('button', { name: 'Save' }).click();

  try {
    await expect(page.getByText(objectName, { exact: true })).toBeVisible();
    await page.getByText(objectName, { exact: true }).click();
    await page.getByRole('button', { name: 'Add field' }).click();
    await page.getByRole('link', { name: 'Text' }).click();
    await page.getByPlaceholder('Employees').fill(textFieldName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(textFieldName, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add field' }).click();
    await page.getByRole('link', { name: 'Relation' }).click();
    await page
      .locator("//span[contains(., 'Relation type')]/../div")
      .click();
    await page.getByText('Has many', { exact: true }).click();
    await page
      .locator("//span[contains(., 'Object destination')]/../div")
      .click();
    await page.getByText('People', { exact: true }).click();
    await page.getByPlaceholder('Field name').fill(relationFieldName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(relationFieldName, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(relationFieldName, { exact: true })).toBeVisible();
  } finally {
    await page.goto('/');
    await page.getByTestId('workspace-dropdown').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Data model' }).click();
    const object = page.getByText(objectName, { exact: true });
    if (await object.isVisible().catch(() => false)) {
      await object.click();
      await page.getByLabel('Object Options').click();
      await page.getByText('Deactivate', { exact: true }).click();
      await page.getByText('Inactive', { exact: true }).click();
      await page.getByText(objectName, { exact: true }).click();
      await page.getByLabel('Object Options').click();
      await page.getByText('Delete', { exact: true }).click();
    }
  }
});
