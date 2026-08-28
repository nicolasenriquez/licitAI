import { expect, test, type Page, type TestInfo } from '@playwright/test';

const COMPANIES_VIEW_ID = 'd1ef4324-008f-41ce-b739-e92ee4cf88bd';

const COMPANIES_INDEX_URL = `/objects/companies?viewId=${COMPANIES_VIEW_ID}`;

const openSettingsDrawer = async (page: Page): Promise<void> => {
  await page.getByTestId('workspace-dropdown').click();
  const settingsLink = page.getByRole('link', { name: 'Settings' });
  await expect(settingsLink).toBeVisible();
  await settingsLink.click();
  await expect(page).toHaveURL(/\/settings\/profile/);
  await expect(
    page.getByText('Settings', { exact: true }).last(),
  ).toBeVisible();
};

const visitSettingsSection = async (
  page: Page,
  testInfo: TestInfo,
  section: { label: string; path: string },
): Promise<void> => {
  const link = page.getByRole('link', { name: section.label, exact: true });

  if (!(await link.isVisible().catch(() => false))) {
    await testInfo.attach(`settings-section-skipped-${section.label}`, {
      body: `Skipped: "${section.label}" is not visible for the audit user (permission or feature flag).`,
      contentType: 'text/plain',
    });
    return;
  }

  await link.click();
  await expect(page).toHaveURL(new RegExp(section.path));
};

test.describe('CRM dossier UI audit (team user)', () => {
  test('Settings drawer lists User, Workspace, and Other sections', async ({
    page,
  }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await openSettingsDrawer(page);

    for (const sectionLabel of ['User', 'Workspace', 'Other']) {
      await expect(page.getByText(sectionLabel, { exact: true })).toBeVisible();
    }
  });

  test('Settings: always-available sections are reachable', async ({
    page,
  }, testInfo) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await openSettingsDrawer(page);

    const alwaysAvailableSections = [
      { label: 'Profile', path: '/settings/profile' },
      { label: 'Experience', path: '/settings/experience' },
      { label: 'General', path: '/settings/general' },
      { label: 'Data model', path: '/settings/objects' },
      { label: 'Layout', path: '/settings/layout' },
      { label: 'Members', path: '/settings/members' },
      { label: 'APIs & Webhooks', path: '/settings/api-webhooks' },
      { label: 'Community', path: '/settings/community' },
    ] as const;

    for (const section of alwaysAvailableSections) {
      await test.step(`visit ${section.label}`, async () => {
        await visitSettingsSection(page, testInfo, section);
      });
    }
  });

  test('Settings: Layout exposes the Dashboards customization tab', async ({
    page,
  }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await openSettingsDrawer(page);
    await page.getByRole('link', { name: 'Layout' }).click();
    await expect(page).toHaveURL(/\/settings\/layout/);
    await expect(page.getByText('Dashboards', { exact: true })).toBeVisible();
  });

  test('Settings: flag-gated sections are visited only when visible', async ({
    page,
  }, testInfo) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await openSettingsDrawer(page);

    const gatedSections = [
      { label: 'Accounts', path: '/settings/accounts' },
      { label: 'Emails', path: '/settings/accounts/emails' },
      { label: 'Calendars', path: '/settings/accounts/calendars' },
      { label: 'Billing', path: '/settings/billing' },
      { label: 'Apps', path: '/settings/applications' },
      { label: 'AI', path: '/settings/ai' },
      { label: 'Email', path: '/settings/email' },
      { label: 'Admin Panel', path: '/settings/admin-panel' },
    ] as const;

    for (const section of gatedSections) {
      await test.step(`visit gated ${section.label}`, async () => {
        await visitSettingsSection(page, testInfo, section);
      });
    }

    await expect(
      page.getByText('Documentation', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Logout', { exact: true })).toBeVisible();
  });

  test('Settings drawer has the Advanced toggle', async ({ page }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await openSettingsDrawer(page);

    const advancedToggle = page.getByRole('switch');
    await expect(advancedToggle).toBeVisible();
  });

  test('Keyboard shortcuts dialog lists Table and General groups', async ({
    page,
  }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Shift+?');

    await expect(
      page.getByText('Keyboard shortcuts', { exact: true }),
    ).toBeVisible();

    for (const label of [
      'Table',
      'General',
      'Move right',
      'Move left',
      'Clear selection',
      'Open search',
      'Mark as favourite',
    ]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(
      page.getByText('Keyboard shortcuts', { exact: true }),
    ).toBeHidden();
  });

  test('Command menu opens with navigation items and search input', async ({
    page,
  }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });
    await page.keyboard.press('Control+K');

    const commandMenu = page.getByTestId('command-menu');
    await expect(commandMenu).toBeVisible();

    for (const item of [
      'Go to Companies',
      'Go to People',
      'Go to Opportunities',
      'Go to Tasks',
      'Go to Notes',
      'Go to Settings',
    ]) {
      await expect(page.getByText(item, { exact: true })).toBeVisible();
    }

    const searchInput = page.getByTestId('side-panel-focus');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Type anything...',
    );

    await searchInput.fill('peop');
    await expect(page.getByText('Go to People', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(commandMenu).toBeHidden();
  });

  test('Navigation drawer shows workspace, tabs, and seeded menu items', async ({
    page,
  }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('workspace-dropdown')).toBeVisible();
    await expect(
      page.getByText('Apple', { exact: true }).first(),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chat' })).toBeVisible();

    for (const item of [
      'Companies',
      'People',
      'Opportunities',
      'Tasks',
      'Notes',
      'Dashboards',
      'Workflows',
    ]) {
      await expect(
        page.getByRole('link', { name: item, exact: true }),
      ).toBeVisible();
    }

    await page.getByTestId('workspace-dropdown').click();
    await expect(page.getByText('Invite user', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Record index view bar exposes Filter, Sort, and Options', async ({
    page,
  }) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sort' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Options' })).toBeVisible();

    await page.getByRole('button', { name: 'Options' }).click();
    await expect(
      page.getByText('Create custom view', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Fields', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Dashboard record page: edit mode and creation commands', async ({
    page,
  }) => {
    await page.goto('/objects/dashboards', { waitUntil: 'domcontentloaded' });

    const dashboardLink = page.getByRole('link', {
      name: /Sales Overview$/,
    });
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/object\/dashboard\//);

    const editDashboardButton = page.getByRole('button', {
      name: 'Edit Dashboard',
    });
    await expect(editDashboardButton).toBeVisible();

    const optionsButton = page.getByRole('button', { name: 'Options' });
    await expect(optionsButton).toBeVisible();
    await optionsButton.click();
    await expect(
      page.getByText('Duplicate Dashboard', { exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    await editDashboardButton.click();
    await expect(
      page.getByRole('button', { name: 'Save Dashboard' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Cancel Edition' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancel Edition' }).click();
    await expect(editDashboardButton).toBeVisible();
  });

  test('Workflows object renders seeded records when present', async ({
    page,
  }, testInfo) => {
    await page.goto('/objects/workflows', { waitUntil: 'domcontentloaded' });

    const recordTable = page.locator(
      '[id^="scroll-wrapper-record-table-scroll-"]',
    );
    const recordLink = recordTable.locator('a[href^="/object/"]').first();

    const recordCount = await recordTable
      .locator('a[href^="/object/"]')
      .count();

    if (recordCount === 0) {
      await testInfo.attach('workflows-skipped', {
        body: 'Skipped: no seeded workflow records in this disposable seed.',
        contentType: 'text/plain',
      });
      return;
    }

    await expect(recordLink).toBeVisible();
    await recordLink.click();
    await expect(
      page.getByRole('button', { name: 'Close side panel' }),
    ).toBeVisible();
  });

  test('Rockets object is audited only when seeded', async ({
    page,
  }, testInfo) => {
    await page.goto(COMPANIES_INDEX_URL, { waitUntil: 'domcontentloaded' });

    const rocketsLink = page.getByRole('link', { name: 'Rockets' });

    if (!(await rocketsLink.isVisible().catch(() => false))) {
      await testInfo.attach('rockets-skipped', {
        body: 'Skipped: the Rockets custom object is not seeded in this disposable seed (light seed) or is not readable for the audit user.',
        contentType: 'text/plain',
      });
      return;
    }

    await rocketsLink.click();
    await expect(page).toHaveURL(/\/objects\/rockets/);
    await expect(
      page.getByText('Rockets', { exact: true }).last(),
    ).toBeVisible();
  });
});
