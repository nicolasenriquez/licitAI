import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import { backendGraphQLUrl } from '../../lib/requests/backend';
import { getAccessAuthToken } from '../../lib/utils/getAccessAuthToken';

test('imports one person and exports only the filtered record', async ({ page }, testInfo) => {
  const suffix = randomUUID();
  const email = `e2e-import-${suffix}@example.com`;
  const csvPath = testInfo.outputPath(`people-${suffix}.csv`);
  const viewName = `E2E imported ${suffix}`;
  let personId: string | undefined;

  await writeFile(csvPath, `First name,Last name,Email\nE2E,Imported,${email}\n`);
  await page.goto('/objects/people');

  try {
    await page.getByRole('button', { name: 'Command menu' }).click();
    await page.getByText('Import', { exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.getByRole('button', { name: /Import/ }).last().click();
    await expect(page.getByText(email)).toBeVisible({ timeout: 30_000 });

    await page.getByText(email).click();
    await page.getByRole('button', { name: /^Open/ }).click();
    personId = page.url().match(/\/object\/person\/([a-f0-9-]+)/)?.[1];
    await page.goto('/objects/people');
    await page.getByText('Add view', { exact: true }).click();
    await page.getByRole('textbox').fill(viewName);
    await page.getByRole('button', { name: 'Create new view' }).click();
    await page.getByText('Filter', { exact: true }).click();
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.getByText('Emails', { exact: true }).last().click();
    await page.getByText(email, { exact: true }).last().click();
    const download = page.waitForEvent('download');
    await page.getByText('Export', { exact: true }).click();
    const exportedCsvPath = await (await download).path();
    expect(exportedCsvPath).not.toBeNull();
    const exportedCsv = await readFile(exportedCsvPath!, 'utf8');
    expect(exportedCsv).toContain(email);
    expect(exportedCsv).not.toContain('e2e-import-not-in-filter@example.com');
  } finally {
    const { authToken } = await getAccessAuthToken(page);
    if (personId !== undefined) {
      await page.request.post(backendGraphQLUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          operationName: 'DestroyPerson',
          query: 'mutation DestroyPerson($id: UUID!) { destroyPerson(id: $id) { id } }',
          variables: { id: personId },
        },
      });
    }
  }
});
