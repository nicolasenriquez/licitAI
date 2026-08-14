import { expect, test, type Page, type TestInfo } from '@playwright/test';

const COMPANIES_VIEW_ID = 'd1ef4324-008f-41ce-b739-e92ee4cf88bd';

const objectScenes = [
  {
    label: 'Companies',
    path: `/objects/companies?viewId=${COMPANIES_VIEW_ID}`,
    detailLabels: ['Domain Name', 'People'],
  },
  { label: 'People', path: '/objects/people', detailLabels: ['Company'] },
  {
    label: 'Opportunities',
    path: '/objects/opportunities',
    detailLabels: ['Amount', 'Stage'],
  },
  {
    label: 'Tasks',
    path: '/objects/tasks',
    detailLabels: ['Due Date', 'Status'],
  },
  { label: 'Notes', path: '/objects/notes', detailLabels: ['Body'] },
] as const;

const captureScene = async (
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> => {
  const path = testInfo.outputPath(`${name}.png`);

  // ponytail: evidence only; add visual snapshots when the seed is fixed.
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { contentType: 'image/png', path });
};

const openFirstRecord = async (page: Page, detailLabels: readonly string[]) => {
  const recordTable = page.locator(
    '[id^="scroll-wrapper-record-table-scroll-"]',
  );
  const recordLink = recordTable.locator('a[href^="/object/"]').first();
  await expect(recordLink).toBeVisible();
  const record = recordLink.locator(
    'xpath=ancestor::*[starts-with(@data-testid, "row-id-")][1]',
  );
  const recordId = await record.getAttribute('data-testid');
  const sidePanel = page.locator('[data-side-panel]');
  const closePanel = page.getByRole('button', { name: 'Close side panel' });

  expect(recordId).not.toBeNull();
  await expect(record).toBeVisible();
  await recordLink.click();
  await expect(closePanel).toBeVisible();

  for (const detailLabel of detailLabels) {
    await expect(
      sidePanel.getByText(detailLabel, { exact: true }).first(),
    ).toBeVisible();
  }

  return { closePanel, recordLink, recordTable };
};

test.describe('CRM dossier baseline', () => {
  for (const scene of objectScenes) {
    test(`${scene.label} renders seeded records, scrolls, and opens a detail panel`, async ({
      page,
    }, testInfo) => {
      await page.goto(scene.path, { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByText(scene.label, { exact: true }).last(),
      ).toBeVisible();

      const { closePanel, recordLink, recordTable } = await openFirstRecord(
        page,
        scene.detailLabels,
      );
      await captureScene(page, testInfo, `${scene.label.toLowerCase()}-detail`);

      await closePanel.click();
      await expect(closePanel).toBeHidden();

      await recordLink.click();
      await expect(closePanel).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(closePanel).toBeHidden();

      await recordTable.hover();
      await page.mouse.wheel(0, 800);
      await expect
        .poll(() => recordTable.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await captureScene(
        page,
        testInfo,
        `${scene.label.toLowerCase()}-scrolled`,
      );
    });
  }

  for (const dashboard of [
    { name: 'Sales Overview', widget: 'Total Pipeline Value' },
    { name: 'Customer Insights', widget: 'Total Customers' },
    { name: 'Team & Activity', widget: 'Team Size' },
  ] as const) {
    test(`Dashboard ${dashboard.name} is reachable and visible`, async ({
      page,
    }, testInfo) => {
      await page.goto('/objects/dashboards', { waitUntil: 'domcontentloaded' });

      const dashboardLink = page.getByRole('link', {
        name: new RegExp(`${dashboard.name}$`),
      });
      await expect(dashboardLink).toBeVisible();
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/object\/dashboard\//);
      await expect(
        page.getByText(dashboard.widget, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Edit Dashboard' }),
      ).toBeVisible();
      await captureScene(
        page,
        testInfo,
        `dashboard-${dashboard.name.toLowerCase().replaceAll(' ', '-')}`,
      );
    });
  }
});
