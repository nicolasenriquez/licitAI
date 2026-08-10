import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Baseline smoke (issue 18): authenticated, flag-aware, evidence-preserving.
// The flag is build-time (REACT_APP_MERCADO_PUBLICO_V2_ENABLED); this spec asserts
// the behavior of the running build and saves screenshots/trace via config.

const V2_PATH = '/mercado-publico-v2';
const ACTIVE_PATH = '/mercado-publico';
const v2FlagOn = process.env.REACT_APP_MERCADO_PUBLICO_V2_ENABLED === 'true';
const isAllowedExternalRequest = (url: URL) =>
  url.hostname === 'fonts.googleapis.com' ||
  url.hostname.endsWith('.gstatic.com') ||
  url.hostname === 'twenty-icons.com';

type GraphqlRequestBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
};

const buildOpportunity = (overrides: Record<string, unknown> = {}) => ({
  codigo: 'FIXTURE-CA-001',
  title: 'Servicio de mantención preventiva',
  state: 'publicada',
  buyerName: 'Municipalidad de Ejemplo',
  region: 13,
  publishedAt: '2026-06-01T09:30:00.000Z',
  closingAt: '2026-06-30T16:00:00.000Z',
  amount: '1500000.50',
  currency: 'CLP',
  documentCount: 1,
  llamado: 1,
  observationId: 'observation-1',
  normalizerVersion: 'mercado-publico-v2-golden-path-1',
  providerSchemaFingerprint: 'schema-1',
  availability: 'available',
  ...overrides,
});

const buildAnalytics = (
  population: number,
  overrides: Record<string, unknown> = {},
) => ({
  population,
  calculatedAt: '2026-08-08T12:00:00.000Z',
  asOf: '2026-08-08T11:00:00.000Z',
  freshness: 'healthy',
  completeness: 'complete',
  availability: 'available',
  coverage: {
    closingAt: population,
    state: population,
    region: population,
    buyer: population,
    amount: population,
    currency: population,
    documentCount: population,
    llamado: population,
  },
  stateBuckets: population > 0 ? [{ key: 'publicada', count: population }] : [],
  regionBuckets: population > 0 ? [{ key: '13', count: population }] : [],
  currencyBuckets: population > 0 ? [{ key: 'CLP', count: population }] : [],
  closingDateBuckets:
    population > 0 ? [{ key: '2026-08-08', count: population }] : [],
  documentBuckets:
    population > 0 ? [{ key: 'positive', count: population }] : [],
  llamadoBuckets: population > 0 ? [{ key: '1', count: population }] : [],
  ...overrides,
});

const trackHarnessDiagnostics = (page: Page) => {
  const unexpectedMercadoPublicoOperations: string[] = [];
  const externalRequests: string[] = [];
  const knownMercadoPublicoOperations = new Set([
    'MercadoPublicoV2ActiveOpportunities',
    'MercadoPublicoV2Analytics',
    'MercadoPublicoV2Opportunity',
  ]);

  page.on('request', (request) => {
    const url = new URL(request.url());
    const isLocal =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (!isLocal && !isAllowedExternalRequest(url)) {
      externalRequests.push(request.url());
    }

    if (url.pathname.endsWith('/metadata')) {
      const requestBody = request.postDataJSON() as GraphqlRequestBody;
      const operationName = requestBody.operationName;

      if (
        requestBody.query?.includes('mercadoPublicoV2') &&
        (operationName === undefined ||
          !knownMercadoPublicoOperations.has(operationName))
      ) {
        unexpectedMercadoPublicoOperations.push(operationName ?? 'anonymous');
      }
    }
  });

  return {
    assertClean: () => {
      expect(unexpectedMercadoPublicoOperations).toEqual([]);
      expect(externalRequests).toEqual([]);
    },
  };
};

const mockMercadoPublicoGraphql = async (
  page: Page,
  {
    opportunities = [buildOpportunity()],
    analytics = buildAnalytics(opportunities.length),
    activeError,
    activeFailures = 0,
    analyticsError,
    holdActive = false,
  }: {
    opportunities?: ReturnType<typeof buildOpportunity>[];
    analytics?: ReturnType<typeof buildAnalytics>;
    activeError?: string;
    activeFailures?: number;
    analyticsError?: string;
    holdActive?: boolean;
  } = {},
): Promise<() => void> => {
  let activeRequestCount = 0;
  let releaseActiveRequest: (() => void) | undefined;
  const activeRequestGate = holdActive
    ? new Promise<void>((resolve) => {
        releaseActiveRequest = resolve;
      })
    : undefined;

  await page.route('**/metadata', async (route) => {
    const requestBody = route.request().postDataJSON() as GraphqlRequestBody;

    if (requestBody.operationName === 'MercadoPublicoV2ActiveOpportunities') {
      activeRequestCount += 1;

      if (activeRequestGate) {
        await activeRequestGate;
      }

      if (activeError && activeRequestCount <= activeFailures) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ errors: [{ message: activeError }] }),
        });

        return;
      }

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
                  endCursor:
                    opportunities.length > 0
                      ? `cursor-${opportunities.length}`
                      : null,
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
      if (analyticsError) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ errors: [{ message: analyticsError }] }),
        });

        return;
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: { mercadoPublicoV2: { analytics } },
        }),
      });

      return;
    }

    if (requestBody.operationName === 'MercadoPublicoV2Opportunity') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2: { opportunity: opportunities[0] ?? null },
          },
        }),
      });

      return;
    }

    await route.continue();
  });

  return () => releaseActiveRequest?.();
};

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

      if (!isLocal && !isAllowedExternalRequest(url)) {
        externalRequests.push(request.url());
      }
    });

    await page.goto(V2_PATH, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Mercado Público V2 (baseline)' }),
    ).toBeVisible();

    await page.screenshot({
      path: 'run_results/baseline-v2-route.png',
      fullPage: true,
    });

    expect(
      externalRequests,
      'browser must never call the provider or an unapproved external host',
    ).toEqual([]);
  });

  test('non-flagged build does not expose the V2 route (prior state intact)', async ({
    page,
  }) => {
    test.skip(v2FlagOn, 'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true');

    await page.goto(V2_PATH, { waitUntil: 'domcontentloaded' });

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

    const unexpectedMercadoPublicoOperations: string[] = [];
    const externalRequests: string[] = [];
    const knownMercadoPublicoOperations = new Set([
      'MercadoPublicoV2ActiveOpportunities',
      'MercadoPublicoV2Analytics',
      'MercadoPublicoV2Opportunity',
    ]);

    page.on('request', (request) => {
      const url = new URL(request.url());
      const isLocal =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1';

      if (!isLocal && !isAllowedExternalRequest(url)) {
        externalRequests.push(request.url());
      }

      if (url.pathname.endsWith('/metadata')) {
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

    await page.route('**/metadata', async (route) => {
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

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Resumen del universo filtrado' }),
    ).toBeVisible();
    const analyticsRegion = page.getByRole('region', {
      name: 'Resumen del universo filtrado',
    });
    await expect(analyticsRegion.getByRole('status')).toContainText(
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
      page
        .getByRole('row')
        .filter({ hasText: 'FIXTURE-CA-001' })
        .locator('time[datetime="2026-06-30T16:00:00.000Z"]'),
    ).toHaveAttribute('title', /ISO:/);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('main')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await page
      .getByRole('row')
      .filter({ hasText: 'FIXTURE-CA-001' })
      .getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      })
      .click();
    await expect(page.getByText('Evidencia')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: 'FIXTURE-CA-001' })
        .getByRole('button', {
          name: 'Abrir Servicio de mantención preventiva',
        }),
    ).toBeVisible();
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

    await page.route('**/metadata', async (route) => {
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

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
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

    await page.route('**/metadata', async (route) => {
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

    await page.goBack();
    await expect(page).toHaveURL(/\/mercado-publico$/);
    await expect(
      page.getByRole('button', { name: 'Abrir Primera oportunidad' }),
    ).toBeVisible();
  });

  test('renders loading state before populated results', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const diagnostics = trackHarnessDiagnostics(page);
    const release = await mockMercadoPublicoGraphql(page, {
      holdActive: true,
    });

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Cargando oportunidades…')).toBeVisible();

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
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page, {
      opportunities: [],
      analytics: buildAnalytics(0),
    });

    await page.goto(`${ACTIVE_PATH}?q=empty-state`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.getByText('No hay oportunidades disponibles.'),
    ).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);

    await page.unroute('**/metadata');
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
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

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
    ).toContainText('No fue posible cargar las oportunidades.');
    await page
      .getByRole('button', { name: 'Reintentar oportunidades' })
      .click();
    await expect(
      page.getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      }),
    ).toBeVisible();
    diagnostics.assertClean();
  });

  test('passes responsive theme matrix and diagnostics', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page);

    const matrix = [
      {
        width: 1440,
        height: 900,
        colorScheme: 'light' as const,
        reducedMotion: 'no-preference' as const,
      },
      {
        width: 1440,
        height: 900,
        colorScheme: 'dark' as const,
        reducedMotion: 'reduce' as const,
      },
      {
        width: 1280,
        height: 900,
        colorScheme: 'light' as const,
        reducedMotion: 'reduce' as const,
      },
      {
        width: 1280,
        height: 900,
        colorScheme: 'dark' as const,
        reducedMotion: 'no-preference' as const,
      },
      {
        width: 390,
        height: 844,
        colorScheme: 'light' as const,
        reducedMotion: 'no-preference' as const,
      },
      {
        width: 390,
        height: 844,
        colorScheme: 'dark' as const,
        reducedMotion: 'reduce' as const,
      },
    ];

    for (const viewport of matrix) {
      await page.setViewportSize(viewport);
      await page.emulateMedia(viewport);
      await page.goto(
        `${ACTIVE_PATH}?q=matrix-${viewport.width}-${viewport.colorScheme}`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(
        page.getByRole('heading', { name: 'Activas' }),
      ).toBeVisible();
      await expect(page.getByRole('columnheader')).toHaveCount(5);
      await expect(page.getByText('Municipalidad de Ejemplo')).toBeVisible();
      await expect(page.getByText('Documentos: 1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('main')
        .analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
      await page.screenshot({
        path: `run_results/issue-24-${viewport.width}-${viewport.colorScheme}.png`,
        fullPage: true,
      });
    }

    diagnostics.assertClean();
  });

  test('supports keyboard interaction, visible focus, reduced motion, and 200% zoom', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });

    const search = page.getByLabel('Buscar por código, título o comprador');
    await search.fill('mantención');
    await search.press('Enter');
    await expect(page).toHaveURL(/q=mantenci%C3%B3n/);
    await expect(
      page.getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      }),
    ).toBeVisible();

    const opportunityButton = page.getByRole('button', {
      name: 'Abrir Servicio de mantención preventiva',
    });
    let focusedOpportunity = false;

    for (let attempt = 0; attempt < 80; attempt += 1) {
      await page.keyboard.press('Tab');

      if (
        await opportunityButton.evaluate(
          (element) => element === document.activeElement,
        )
      ) {
        focusedOpportunity = true;
        break;
      }
    }

    expect(focusedOpportunity).toBe(true);
    expect(
      await opportunityButton.evaluate((element) =>
        element.matches(':focus-visible'),
      ),
    ).toBe(true);
    expect(
      await opportunityButton.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).outlineWidth),
      ),
    ).toBeGreaterThan(0);

    await opportunityButton.press('Enter');
    await expect(page.getByText('Evidencia')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Evidencia')).toBeHidden();

    expect(
      await page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    ).toBe(true);

    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expect(page.getByText('Municipalidad de Ejemplo')).toBeVisible();
    await expect(page.getByText('Documentos: 1')).toBeVisible();

    const zoomMetrics = await page
      .locator('[role="region"]')
      .evaluate((element) => ({
        pageScrollWidth: document.documentElement.scrollWidth,
        pageClientWidth: document.documentElement.clientWidth,
        tableScrollWidth: element.scrollWidth,
        tableClientWidth: element.clientWidth,
      }));

    expect(zoomMetrics.pageScrollWidth).toBeLessThanOrEqual(
      zoomMetrics.pageClientWidth,
    );
    expect(zoomMetrics.tableScrollWidth).toBeGreaterThan(
      zoomMetrics.tableClientWidth,
    );
    diagnostics.assertClean();
  });
});
