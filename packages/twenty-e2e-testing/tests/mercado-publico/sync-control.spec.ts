import { expect, test, type Page } from '@playwright/test';

// Isolated operator and analyst checks for the V2 sync control center
// (openspec change mercado-publico-v2-sync-operations, task 3.2).
// Prerequisites (isolated disposable project):
//   node scripts/provision-baseline.mjs --flag on --fixture v2-history-and-buyers
// Run: npx playwright test tests/mercado-publico/sync-control.spec.ts --project=operator --project=analyst

const SYNC_CONTROL_PATH = '/mercado-publico/centro-de-control';
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const v2FlagOn = process.env.REACT_APP_MERCADO_PUBLICO_V2_ENABLED === 'true';
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

test.beforeEach(async () => {
  test.skip(!v2FlagOn, 'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false');
});

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
    let focused = false;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await page.keyboard.press('Tab');

      if (
        await controlAction.evaluate(
          (element) => element === document.activeElement,
        )
      ) {
        focused = true;
        break;
      }
    }

    expect(focused).toBe(true);
    expect(
      await controlAction.evaluate((element) =>
        element.matches(':focus-visible'),
      ),
    ).toBe(true);

    await controlAction.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    const dialogCancelButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancelar' });
    let dialogCancelFocused = false;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await page.keyboard.press('Tab');

      if (
        await dialogCancelButton.evaluate(
          (element) => element === document.activeElement,
        )
      ) {
        dialogCancelFocused = true;
        break;
      }
    }

    expect(dialogCancelFocused).toBe(true);
    await dialogCancelButton.press('Enter');
    await expect(page.getByRole('dialog')).toBeHidden();
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
  });
});

test.describe('Mercado Publico V2 sync control for analysts @analyst', () => {
  test('analyst is denied access with a guidance card and no actions', async ({
    page,
  }) => {
    await page.goto(SYNC_CONTROL_PATH, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Centro de control' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'No tienes acceso al control de sincronización. Contacta a un administrador para que te asigne como operador.',
      ),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Iniciar', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Cancelar', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Reanudar', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
