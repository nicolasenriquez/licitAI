import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

test('saves table filters, sorts, grouping, and a calendar view', async ({ page }) => {
  const suffix = randomUUID();
  const tableViewName = `E2E table ${suffix}`;
  const calendarViewName = `E2E calendar ${suffix}`;

  await page.goto('/objects/people');
  await page.getByText('Add view', { exact: true }).click();
  await page.getByRole('textbox').fill(tableViewName);
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await page.getByRole('button', { name: 'Create new view' }).click();

  try {
    await page.getByText('Filter', { exact: true }).click();
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.getByText('Name', { exact: true }).last().click();
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.getByText('Emails', { exact: true }).last().click();
    await page.getByText('Sort', { exact: true }).click();
    await page.getByText('Name', { exact: true }).last().click();
    await page.getByText('Sort', { exact: true }).click();
    await page.getByText('Created at', { exact: true }).last().click();
    await page.getByText('Options', { exact: true }).click();
    await page.getByText('Group', { exact: true }).click();
    await page.getByText('Name', { exact: true }).last().click();
    await page.reload();
    await expect(page.getByText(tableViewName, { exact: true })).toBeVisible();

    await page.getByText('Add view', { exact: true }).click();
    await page.getByRole('textbox').fill(calendarViewName);
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await page.getByText('Calendar', { exact: true }).click();
    await page.getByRole('button', { name: 'Create new view' }).click();
    await page.reload();
    await expect(page.getByText(calendarViewName, { exact: true })).toBeVisible();
  } finally {
    for (const viewName of [calendarViewName, tableViewName]) {
      const view = page.getByText(viewName, { exact: true });
      if (await view.isVisible().catch(() => false)) {
        await view.click();
        await page.getByText('Options', { exact: true }).click();
        await page.getByText('Delete view', { exact: true }).click();
      }
    }
  }
});
