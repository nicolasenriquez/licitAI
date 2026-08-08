import AxeBuilder from '@axe-core/playwright';
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

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

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

  test('mocked UI Activas opens a detail panel without losing table context', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

    const consoleErrors: string[] = [];
    const unexpectedMercadoPublicoOperations: string[] = [];
    const externalRequests: string[] = [];
    const knownMercadoPublicoOperations = new Set([
      'MercadoPublicoV2ActiveOpportunities',
      'MercadoPublicoV2Analytics',
      'MercadoPublicoV2Opportunity',
    ]);

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
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

      if (url.pathname.endsWith('/graphql')) {
        const requestBody = request.postDataJSON() as {
          operationName?: string;
          query?: string;
        };
        const operationName = requestBody.operationName;
        const query = requestBody.query;

        if (
          query?.includes('mercadoPublicoV2') &&
          (operationName === undefined ||
            !knownMercadoPublicoOperations.has(operationName))
        ) {
          unexpectedMercadoPublicoOperations.push(operationName ?? 'anonymous');
        }
      }
    });

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
      llamado: 1,
      observationId: 'observation-1',
      normalizerVersion: 'mercado-publico-v2-golden-path-1',
      providerSchemaFingerprint: 'schema-1',
      availability: 'available',
    };
    const opportunities = [
      opportunity,
      {
        ...opportunity,
        codigo: 'FIXTURE-CA-002',
        title: null,
        buyerName: null,
        region: null,
        closingAt: null,
        amount: null,
        currency: null,
        documentCount: null,
        llamado: null,
        availability: 'unavailable',
      },
      {
        ...opportunity,
        codigo: 'FIXTURE-CA-003',
        state: null,
        region: null,
        documentCount: 0,
        amount: '0',
        availability: 'not_applicable',
      },
      {
        ...opportunity,
        codigo: 'FIXTURE-CA-004',
        buyerName: null,
      },
    ];

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
                  edges: opportunities.map((node, index) => ({
                    cursor: `cursor-${index + 1}`,
                    node,
                  })),
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: `cursor-${opportunities.length}`,
                  },
                  totalCount: opportunities.length,
                },
              },
            },
          }),
        });

        return;
      }

      if (requestBody.operationName === 'MercadoPublicoV2Analytics') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              mercadoPublicoV2: {
                analytics: {
                  population: opportunities.length,
                  calculatedAt: '2026-08-08T12:00:00.000Z',
                  asOf: '2026-08-08T11:00:00.000Z',
                  freshness: 'healthy',
                  completeness: 'complete',
                  availability: 'available',
                  coverage: {
                    closingAt: 1,
                    state: 1,
                    region: 1,
                    buyer: 1,
                    amount: 1,
                    currency: 1,
                    documentCount: 1,
                    llamado: 1,
                  },
                  stateBuckets: [{ key: 'publicada', count: 1 }],
                  regionBuckets: [{ key: '13', count: 1 }],
                  currencyBuckets: [{ key: 'CLP', count: 1 }],
                  closingDateBuckets: [{ key: '2026-08-08', count: 1 }],
                  documentBuckets: [{ key: 'positive', count: 1 }],
                  llamadoBuckets: [{ key: '1', count: 1 }],
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
    await expect(
      page.getByRole('heading', { name: 'Resumen del universo filtrado' }),
    ).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      'Resultados disponibles',
    );
    await expect(page.getByRole('columnheader')).toHaveCount(5);
    await expect(
      page.getByText('No informado por fuente').first(),
    ).toBeVisible();
    await expect(page.getByText('Aún no disponible').first()).toBeVisible();
    await expect(page.getByText('No aplica').first()).toBeVisible();
    await expect(page.getByText('Documentos: 0')).toBeVisible();
    await expect(
      page.locator('time[datetime="2026-06-30T16:00:00.000Z"]'),
    ).toHaveAttribute('title', /ISO:/);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

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
    expect(consoleErrors).toEqual([]);
    expect(unexpectedMercadoPublicoOperations).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('mobile view stacks every table field without horizontal page overflow', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    });

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
                  edges: [
                    {
                      cursor: 'cursor-1',
                      node: {
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
                        llamado: 1,
                        availability: 'available',
                      },
                    },
                  ],
                  pageInfo: { hasNextPage: false, endCursor: 'cursor-1' },
                  totalCount: 1,
                },
              },
            },
          }),
        });

        return;
      }

      if (requestBody.operationName === 'MercadoPublicoV2Analytics') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              mercadoPublicoV2: {
                analytics: {
                  population: 1,
                  calculatedAt: '2026-08-08T12:00:00.000Z',
                  asOf: '2026-08-08T11:00:00.000Z',
                  freshness: 'healthy',
                  completeness: 'complete',
                  availability: 'available',
                  coverage: {
                    closingAt: 1,
                    state: 1,
                    region: 1,
                    buyer: 1,
                    amount: 1,
                    currency: 1,
                    documentCount: 1,
                    llamado: 1,
                  },
                  stateBuckets: [{ key: 'publicada', count: 1 }],
                  regionBuckets: [{ key: '13', count: 1 }],
                  currencyBuckets: [{ key: 'CLP', count: 1 }],
                  closingDateBuckets: [{ key: '2026-08-08', count: 1 }],
                  documentBuckets: [{ key: 'positive', count: 1 }],
                  llamadoBuckets: [{ key: '1', count: 1 }],
                },
              },
            },
          }),
        });

        return;
      }

      await route.continue();
    });

    await page.goto(ACTIVE_PATH);
    await expect(page.getByRole('columnheader')).toHaveCount(5);
    await expect(page.getByText('Municipalidad de Ejemplo')).toBeVisible();
    await expect(page.getByText('Documentos: 1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  });

  test('flagged Activas advances through URL-backed keyset pages', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

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

    await page.route('**/graphql', async (route) => {
      const requestBody = route.request().postDataJSON() as {
        operationName?: string;
        variables?: { after?: string };
      };

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

    await page.goto(ACTIVE_PATH);
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

    await page.goBack();
    await expect(page).toHaveURL(/\/mercado-publico$/);
    await expect(
      page.getByRole('button', { name: 'Abrir Primera oportunidad' }),
    ).toBeVisible();
  });
});
