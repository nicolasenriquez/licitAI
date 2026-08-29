import { expect, test } from '@playwright/test';

import {
  ACTIVE_PATH,
  mockMercadoPublicoGraphql,
  trackHarnessDiagnostics,
} from '../fixtures/mercado-publico.fixture';

const v2FlagOn = process.env.REACT_APP_MERCADO_PUBLICO_V2_ENABLED === 'true';

test.beforeEach(async () => {
  test.skip(!v2FlagOn, 'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false');
});

test('hides refresh control when current member is not an operator', async ({
  page,
}) => {
  const diagnostics = trackHarnessDiagnostics(page);
  await mockMercadoPublicoGraphql(page, {
    syncControlError:
      'You are not an explicit Mercado Publico V2 sync operator',
  });

  await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('button', {
      name: /Abrir Servicio de mantención preventiva/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Actualizar datos' }),
  ).toHaveCount(0);

  diagnostics.assertClean();
});
