import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// This spec uses storageState from login.setup.ts and real GraphQL responses.
// Run against an isolated disposable workspace seeded with the V2 fixture.

const ACTIVE_PATH = '/mercado-publico';
const HISTORY_PATH = '/mercado-publico/historial';
const BUYERS_PATH = '/mercado-publico/compradores';
const seededCodigo =
  process.env.MERCADO_PUBLICO_V2_E2E_CODIGO ?? 'FIXTURE-CA-001';
const seededUtmCodigo =
  process.env.MERCADO_PUBLICO_V2_E2E_UTM_CODIGO ?? 'FIXTURE-CA-UTM';
const seededBuyerCode =
  process.env.MERCADO_PUBLICO_V2_E2E_BUYER_CODE ?? '60.000.000-0';

test.describe('Mercado Publico V2 history and buyers', () => {
  test('renders history event and provenance for seeded opportunity', async ({
    page,
  }) => {
    await page.goto(
      `${HISTORY_PATH}?codigo=${encodeURIComponent(seededCodigo)}`,
      { waitUntil: 'domcontentloaded' },
    );

    await expect(
      page.getByRole('heading', { name: 'Historial' }),
    ).toBeVisible();
    await expect(page.getByText(seededCodigo)).toBeVisible();
    await expect(page.getByText('Campos modificados')).toBeVisible();
    await expect(page.getByText('Procedencia')).toBeVisible();
    await expect(page.getByText('mercado-publico-v2-durable-1')).toBeVisible();
  });

  test('shows amount semantic change in history for non-CLP opportunity', async ({
    page,
  }) => {
    await page.goto(
      `${HISTORY_PATH}?codigo=${encodeURIComponent(seededUtmCodigo)}`,
      { waitUntil: 'domcontentloaded' },
    );

    await expect(page.getByText(seededUtmCodigo)).toBeVisible();
    await expect(page.getByText('Campos modificados')).toBeVisible();
    await expect(page.getByText(/amount/)).toBeVisible();
  });

  test('shows guidance and no global history feed without codigo', async ({
    page,
  }) => {
    await page.goto(HISTORY_PATH, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Historial' }),
    ).toBeVisible();
    await expect(
      page.getByText('Selecciona un proceso para consultar su historial'),
    ).toBeVisible();
  });

  test('renders buyer aggregates and data-quality context', async ({
    page,
  }) => {
    await page.goto(BUYERS_PATH, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Compradores' }),
    ).toBeVisible();
    await expect(page.getByText(seededBuyerCode)).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Oportunidades' }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: seededBuyerCode })
        .getByText(seededBuyerCode),
    ).toBeVisible();
  });

  test('navigates buyer selection to Procesos and browser Back restores Compradores', async ({
    page,
  }) => {
    await page.goto(BUYERS_PATH, { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: new RegExp(seededBuyerCode) }).click();
    await expect(page).toHaveURL(
      new RegExp(
        `${ACTIVE_PATH}.*buyer=${encodeURIComponent(seededBuyerCode)}`,
      ),
    );
    await expect(
      page.getByRole('heading', { name: 'Mercado Público' }),
    ).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(BUYERS_PATH));
    await expect(
      page.getByRole('heading', { name: 'Compradores' }),
    ).toBeVisible();
  });

  test('supports keyboard access to history and buyer routes', async ({
    page,
  }) => {
    await page.goto(BUYERS_PATH, { waitUntil: 'domcontentloaded' });

    const buyerLink = page.getByRole('link', {
      name: new RegExp(seededBuyerCode),
    });
    await buyerLink.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(
      new RegExp(
        `${ACTIVE_PATH}.*buyer=${encodeURIComponent(seededBuyerCode)}`,
      ),
    );
  });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'laptop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`${viewport.name} routes remain responsive and accessible`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      for (const path of [HISTORY_PATH, BUYERS_PATH]) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main')).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(viewport.width);

        const accessibilityScanResults = await new AxeBuilder({ page })
          .include('main')
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    });
  }
});
