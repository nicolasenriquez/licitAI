import { expect, test } from '@playwright/test';

// Isolated operator and analyst checks for the V2 sync control center
// (openspec change mercado-publico-v2-sync-operations, task 3.2).
// Prerequisites (isolated disposable project):
//   node scripts/provision-mercado-publico-e2e.mjs --fixture v2-history-and-buyers

const SYNC_CONTROL_PATH = '/mercado-publico/centro-de-control';
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
