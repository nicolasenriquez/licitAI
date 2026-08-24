import { expect, test, type Page } from '@playwright/test';

// Isolated operator and analyst checks for the V2 sync control center
// (openspec change mercado-publico-v2-sync-operations, task 3.2).
// Prerequisites (isolated disposable project):
//   node scripts/provision-mercado-publico-e2e.mjs --fixture v2-history-and-buyers

const SYNC_CONTROL_PATH = '/mercado-publico/centro-de-control';
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const START_BUTTON_NAME = /^Iniciar(?:\s|$)/;

const getEnabledControlAction = async (page: Page) => {
  const cancelButton = page.getByRole('button', { name: /^Cancelar/ });

  if ((await cancelButton.count()) === 1 && (await cancelButton.isEnabled())) {
    return cancelButton;
  }

  return page.getByRole('button', { name: START_BUTTON_NAME });
};

const openConfirmationDialog = async (page: Page) => {
  await page.getByRole('button', { name: START_BUTTON_NAME }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
};

test.describe('Mercado Publico V2 sync control for operators @operator', () => {
  test('operator sees safe latest-run state without internal identifiers', async ({
    page,
  }) => {
    await page.goto(SYNC_CONTROL_PATH, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Centro de control' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Última ejecución' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Línea de tiempo' }),
    ).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(UUID_PATTERN);
    expect(bodyText).not.toContain('syncRunId');
    expect(bodyText).not.toContain('observationId');
    expect(bodyText).not.toContain('idempotencyKey');
  });

  test('operator operates the dialog with the keyboard', async ({ page }) => {
    await page.goto(SYNC_CONTROL_PATH, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Centro de control' }),
    ).toBeVisible();

    const controlAction = await getEnabledControlAction(page);
    await controlAction.focus();
    await expect(controlAction).toBeFocused();
    expect(
      await controlAction.evaluate((element) =>
        element.matches(':focus-visible'),
      ),
    ).toBe(true);

    await controlAction.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const dialogCancelButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancelar' });
    await dialogCancelButton.focus();
    await expect(dialogCancelButton).toBeFocused();
    await dialogCancelButton.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(controlAction).toBeFocused();
  });

  test('operator renders without horizontal overflow on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SYNC_CONTROL_PATH, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Centro de control' }),
    ).toBeVisible();

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);

    await (await getEnabledControlAction(page)).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  });

  test('operator start requires explicit confirmation and confirms safely', async ({
    page,
  }) => {
    let startInput: Record<string, unknown> | undefined;

    await page.route('**/*', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      let requestBody: {
        operationName?: string;
        variables?: { input?: Record<string, unknown> };
      };

      try {
        requestBody = route.request().postDataJSON() as typeof requestBody;
      } catch {
        await route.continue();
        return;
      }

      if (requestBody.operationName !== 'MercadoPublicoV2StartSync') {
        await route.continue();
        return;
      }

      startInput = requestBody.variables?.input;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2SyncControl: { start: { state: 'accepted' } },
          },
        }),
      });
    });

    await page.goto(SYNC_CONTROL_PATH, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Centro de control' }),
    ).toBeVisible();

    await openConfirmationDialog(page);
    await expect(
      page
        .getByRole('dialog')
        .getByText('¿Confirmas iniciar una sincronización global incremental?'),
    ).toBeVisible();

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancelar' })
      .click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await openConfirmationDialog(page);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Confirmar' })
      .click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
    expect(startInput).toEqual({
      confirmed: true,
      idempotencyKey: expect.stringMatching(UUID_PATTERN),
    });
  });
});
