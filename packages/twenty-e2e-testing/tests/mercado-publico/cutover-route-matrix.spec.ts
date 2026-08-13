import { expect, test, type Page } from '@playwright/test';

const CANONICAL_PATH = '/mercado-publico';
const LEGACY_PATH = '/mercado-publico/legacy';
const CUTOVER_PHASE = process.env.MERCADO_PUBLICO_V2_CUTOVER_PHASE;
const legacyProcessCode =
  process.env.MERCADO_PUBLICO_LEGACY_E2E_PROCESS_CODE ?? 'FIXTURE-CA-001';

const allowedExternalHosts = new Set([
  'fonts.googleapis.com',
  'twenty-icons.com',
]);

const isAllowedExternalRequest = (url: URL) =>
  allowedExternalHosts.has(url.hostname) ||
  url.hostname.endsWith('.gstatic.com');

const trackBrowserEvidence = (page: Page) => {
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('request', (request) => {
    const url = new URL(request.url());
    const isLocal =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (!isLocal && !isAllowedExternalRequest(url)) {
      externalRequests.push(request.url());
    }
  });

  return () => {
    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  };
};

const runLegacyReadOnlyJourney = async (page: Page) => {
  await expect(
    page.getByRole('heading', { name: 'Mercado Público' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compra Ágil' })).toBeVisible();

  const processRow = page.getByTestId(`process-row-${legacyProcessCode}`);

  await expect(processRow).toBeVisible();
  await processRow.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(processRow).toBeVisible();
};

test.describe('Mercado Publico G4 cutover route matrix', () => {
  test.beforeEach(async ({ page }) => {
    expect(CUTOVER_PHASE).toMatch(/^(enabled|disabled|reenabled)$/);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('enabled deployment serves canonical V2 and the private legacy alias', async ({
    page,
  }) => {
    test.skip(CUTOVER_PHASE !== 'enabled');

    const assertBrowserEvidence = trackBrowserEvidence(page);

    await page.goto(CANONICAL_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();

    await page.goto(LEGACY_PATH, { waitUntil: 'domcontentloaded' });
    await runLegacyReadOnlyJourney(page);
    await page.screenshot({
      path: 'run_results/cutover-enabled-legacy-alias.png',
      fullPage: true,
    });
    assertBrowserEvidence();
  });

  test('disabled deployment serves canonical legacy without V2 subroutes', async ({
    page,
  }) => {
    test.skip(CUTOVER_PHASE !== 'disabled');

    const assertBrowserEvidence = trackBrowserEvidence(page);

    await page.goto(CANONICAL_PATH, { waitUntil: 'domcontentloaded' });
    await runLegacyReadOnlyJourney(page);
    await page.screenshot({
      path: 'run_results/cutover-disabled-canonical-legacy.png',
      fullPage: true,
    });

    await page.goto('/mercado-publico/historial', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('heading', { name: 'Historial' })).toHaveCount(
      0,
    );
    assertBrowserEvidence();
  });

  test('re-enabled deployment restores canonical V2 and retains the legacy alias', async ({
    page,
  }) => {
    test.skip(CUTOVER_PHASE !== 'reenabled');

    const assertBrowserEvidence = trackBrowserEvidence(page);

    await page.goto(CANONICAL_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();

    await page.goto(LEGACY_PATH, { waitUntil: 'domcontentloaded' });
    await runLegacyReadOnlyJourney(page);
    await page.screenshot({
      path: 'run_results/cutover-reenabled-legacy-alias.png',
      fullPage: true,
    });
    assertBrowserEvidence();
  });
});
