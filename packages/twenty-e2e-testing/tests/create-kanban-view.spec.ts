import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

test('creates, reloads, and removes a Kanban view', async ({ page }) => {
  const suffix = randomUUID();
  const fieldName = `E2E industry ${suffix}`;
  const viewName = `E2E by industry ${suffix}`;

  try {
    await page.getByTestId('workspace-dropdown').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Data model' }).click();
    await page.getByRole('link', { name: 'Opportunities' }).click();
    await expect(page.getByRole('button', { name: 'New Field' })).toBeVisible();
    await page.getByRole('button', { name: 'New Field' }).click();
    await page.getByRole('link', { name: 'Select', exact: true }).click();
    await page.getByRole('textbox', { name: 'Employees' }).click();
    await page.getByRole('textbox', { name: 'Employees' }).fill(fieldName);
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).press('ControlOrMeta+a');
    await page.getByRole('textbox').nth(1).fill('Food');
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByRole('button', { name: 'Option 2' }).getByRole('textbox').fill('Tech');
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByRole('button', { name: 'Option 3' }).getByRole('textbox').fill('Travel');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/objects/opportunities');
    await page.waitForSelector(`text=${fieldName}`);
    await expect(page.getByText(fieldName)).toBeVisible();

  await page.getByRole('link', { name: 'Opportunities' }).click();
  await page.getByRole('button', { name: /All Opportunities/ }).click();
  await page.getByText('Add view').click();
  await page.getByRole('textbox').press('ControlOrMeta+a');
  await page.getByRole('textbox').fill(viewName);
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await page.getByText('Kanban').click();
  await page.locator('[aria-controls="view-picker-kanban-field-options"]').click();
  await page.getByRole('option', { name: fieldName }).click();
  await page.getByRole('button', { name: 'Create new view' }).click();
  await expect(page.getByText('Food')).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Tech')).toBeVisible();
  await expect(page.getByText('Travel')).toBeVisible();
  await expect(page.getByText('No Value')).toBeVisible();
  const byIndustryElements = await page.getByText(viewName, { exact: true }).all();
  expect(byIndustryElements.length).toBeGreaterThanOrEqual(1);
  for (const element of byIndustryElements) {
    await expect(element).toBeVisible();
  }
  await page.getByText('Options').click();
  await page.getByText('Group', { exact: true }).click();
  await Promise.all([page.getByTestId('hide-group-').click(),
    page.waitForRequest((req) => {
    return req.url().includes('/metadata') &&
           req.method() === 'POST';
  })]);
  await expect(page.getByText('No Value')).not.toBeVisible();
  await page.reload();
  await expect(page.getByText(viewName, { exact: true })).toBeVisible();
  } finally {
    const viewOptions = page.getByRole('button', { name: /Options/ }).first();
    if (await viewOptions.isVisible().catch(() => false)) {
      await viewOptions.click();
      const deleteView = page.getByText('Delete view', { exact: true });
      if (await deleteView.isVisible().catch(() => false)) {
        await deleteView.click();
      }
    }

    await page.goto('/settings/objects/opportunities');
    const field = page.getByText(fieldName, { exact: true });
    if (await field.isVisible().catch(() => false)) {
      await field.click();
      await page.getByRole('button', { name: 'Delete' }).click();
    }
  }
});
