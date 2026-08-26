import { expect, test } from '@playwright/test';

import {
  ACTIVE_PATH,
  buildAnalytics,
  buildOpportunity,
  getGraphqlRequestBody,
  mockMercadoPublicoGraphql,
  trackHarnessDiagnostics,
} from '../fixtures/mercado-publico.fixture';

test.describe('Mercado Publico Oportunidades UI contract', () => {
  test('Oportunidades advances and returns through URL-backed keyset pages', async ({
    page,
  }) => {
    const pageOneOpportunity = {
      codigo: 'FIXTURE-CA-001',
      title: 'Primera oportunidad',
      state: 'publicada',
      buyerName: 'Municipalidad de Ejemplo',
      region: 13,
      publishedAt: '2026-06-01T09:30:00.000Z',
      closingAt: '2026-06-30T16:00:00.000Z',
      amount: '1500000',
      currency: 'CLP',
      documentCount: 1,
      observationId: 'observation-1',
      normalizerVersion: 'mercado-publico-v2-golden-path-1',
      providerSchemaFingerprint: 'schema-1',
      availability: 'available',
    };
    const pageTwoOpportunity = {
      ...pageOneOpportunity,
      codigo: 'FIXTURE-CA-002',
      title: 'Segunda oportunidad',
    };

    await page.route('**/*', async (route) => {
      const requestBody = getGraphqlRequestBody(route.request());

      if (requestBody === undefined) {
        await route.continue();
        return;
      }

      if (requestBody.operationName !== 'MercadoPublicoV2ActiveOpportunities') {
        await route.continue();
        return;
      }

      const isNextPage = requestBody.variables?.after === 'cursor-1';
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2: {
              opportunities: {
                edges: [
                  {
                    cursor: isNextPage ? 'cursor-2' : 'cursor-1',
                    node: isNextPage ? pageTwoOpportunity : pageOneOpportunity,
                  },
                ],
                pageInfo: {
                  hasNextPage: !isNextPage,
                  endCursor: isNextPage ? 'cursor-2' : 'cursor-1',
                },
                totalCount: 2,
              },
            },
          },
        }),
      });
    });

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('button', { name: 'Abrir Primera oportunidad' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page).toHaveURL(/\/mercado-publico\?after=cursor-1$/);
    await expect(
      page.getByRole('button', { name: 'Abrir Segunda oportunidad' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Siguiente' }),
    ).toBeDisabled();

    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect(page).toHaveURL(/\/mercado-publico$/);
    await expect(
      page.getByRole('button', { name: 'Abrir Primera oportunidad' }),
    ).toBeVisible();

    await page.goForward();
    await page.goBack();
    await expect(
      page.getByRole('button', { name: 'Abrir Primera oportunidad' }),
    ).toBeVisible();
  });

  test('renders loading state before populated results', async ({ page }) => {
    const diagnostics = trackHarnessDiagnostics(page);
    const release = await mockMercadoPublicoGraphql(page, {
      holdActive: true,
    });

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('status', { name: 'Cargando procesos…' }),
    ).toBeVisible();

    release();
    await expect(
      page.getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      }),
    ).toBeVisible();
    diagnostics.assertClean();
  });

  test('renders empty and partial availability states without hiding fields', async ({
    page,
  }) => {
    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page, {
      opportunities: [],
      analytics: buildAnalytics(0),
    });

    await page.goto(`${ACTIVE_PATH}?q=empty-state`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.getByText('No hay procesos disponibles'),
    ).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);

    await page.unroute('**/*');
    await mockMercadoPublicoGraphql(page, {
      opportunities: [
        buildOpportunity({
          codigo: 'FIXTURE-CA-PARTIAL',
          title: null,
          buyerName: null,
          region: null,
          closingAt: null,
          amount: null,
          currency: null,
          documentCount: null,
          llamado: null,
          availability: 'unavailable',
        }),
      ],
      analytics: buildAnalytics(1, {
        completeness: 'partial',
        availability: 'partial',
        coverage: {
          closingAt: 0,
          state: 1,
          region: 0,
          buyer: 0,
          amount: 0,
          currency: 0,
          documentCount: 0,
          llamado: 0,
        },
      }),
    });

    await page.goto(`${ACTIVE_PATH}?q=partial-state`, {
      waitUntil: 'domcontentloaded',
    });
    const analyticsRegion = page.getByRole('region', {
      name: 'Resumen del universo filtrado',
    });
    await expect(analyticsRegion.getByRole('status')).toContainText(
      'Resultados parciales',
    );
    await expect(page.getByText('Aún no disponible').first()).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveCount(5);
    diagnostics.assertClean();
  });

  test('renders active errors and retries successfully', async ({ page }) => {
    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page, {
      activeError: 'fixture active failure',
      activeFailures: 1,
    });

    await page.goto(`${ACTIVE_PATH}?q=error-state`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.locator('#mercado-publico-v2-filter-notice'),
    ).toContainText('No fue posible cargar los procesos.');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(
      page.getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      }),
    ).toBeVisible();
    diagnostics.assertClean();
  });
});
