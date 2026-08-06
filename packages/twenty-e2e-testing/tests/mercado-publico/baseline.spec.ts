import { expect, test } from '@playwright/test';

// Baseline smoke (issue 18): authenticated, flag-aware, evidence-preserving.
// The flag is build-time (REACT_APP_MERCADO_PUBLICO_V2_ENABLED); this spec asserts
// the behavior of the running build and saves screenshots/trace via config.

const V2_PATH = '/mercado-publico-v2';
const ACTIVE_PATH = '/mercado-publico';
const v2FlagOn = process.env.REACT_APP_MERCADO_PUBLICO_V2_ENABLED === 'true';

test.describe('Mercado Publico V2 baseline', () => {
  test('flagged build exposes the full V2 route, read-only, local-only network', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const externalRequests: string[] = [];

    page.on('request', (request) => {
      const url = new URL(request.url());
      const isLocal =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      const isFontCdn =
        url.hostname === 'fonts.googleapis.com' ||
        url.hostname.endsWith('.gstatic.com');

      if (!isLocal && !isFontCdn) {
        externalRequests.push(request.url());
      }
    });

    await page.goto(V2_PATH);
    await expect(
      page.getByRole('heading', { name: 'Mercado Público V2 (baseline)' }),
    ).toBeVisible();

    await page.screenshot({
      path: 'run_results/baseline-v2-route.png',
      fullPage: true,
    });

    expect(
      externalRequests,
      'browser must never call the provider or any external host',
    ).toEqual([]);
  });

  test('non-flagged build does not expose the V2 route (prior state intact)', async ({
    page,
  }) => {
    test.skip(v2FlagOn, 'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true');

    await page.goto(V2_PATH);

    await expect(
      page.getByRole('heading', { name: 'Mercado Público V2 (baseline)' }),
    ).not.toBeVisible();
  });

  test('flagged Activas opens a detail panel without losing the table context', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = {
      codigo: 'FIXTURE-CA-001',
      title: 'Servicio de mantención preventiva',
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

    await page.route('**/graphql', async (route) => {
      const requestBody = route.request().postDataJSON() as {
        operationName?: string;
      };

      if (requestBody.operationName === 'MercadoPublicoV2ActiveOpportunities') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              mercadoPublicoV2: {
                opportunities: {
                  edges: [{ cursor: 'cursor-1', node: opportunity }],
                  pageInfo: { hasNextPage: false, endCursor: 'cursor-1' },
                  totalCount: 1,
                },
              },
            },
          }),
        });

        return;
      }

      if (requestBody.operationName === 'MercadoPublicoV2Opportunity') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: { mercadoPublicoV2: { opportunity } },
          }),
        });

        return;
      }

      await route.continue();
    });

    await page.goto(ACTIVE_PATH);
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveCount(5);

    await page
      .getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      })
      .click();
    await expect(page.getByText('Evidencia')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      }),
    ).toBeVisible();
  });
});
