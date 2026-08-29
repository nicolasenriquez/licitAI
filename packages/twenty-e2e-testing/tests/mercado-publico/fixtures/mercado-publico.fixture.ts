import { expect, type Page, type Request } from '@playwright/test';

export const ACTIVE_PATH = '/mercado-publico';
export const isAllowedExternalRequest = (url: URL) =>
  url.hostname === 'fonts.googleapis.com' ||
  url.hostname.endsWith('.gstatic.com') ||
  url.hostname === 'twenty-icons.com';

type GraphqlRequestBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
};

export const getGraphqlRequestBody = (
  request: Request,
): GraphqlRequestBody | undefined => {
  if (request.method() === 'POST') {
    try {
      return request.postDataJSON() as GraphqlRequestBody | undefined;
    } catch {
      return undefined;
    }
  }

  if (request.method() !== 'GET') {
    return undefined;
  }

  const url = new URL(request.url());
  const query = url.searchParams.get('query') ?? undefined;
  const operationName =
    url.searchParams.get('operationName') ??
    query?.match(/\b(?:query|mutation)\s+(\w+)/)?.[1];
  const variables = url.searchParams.get('variables');

  try {
    return {
      operationName,
      query,
      variables:
        variables === null
          ? undefined
          : (JSON.parse(variables) as Record<string, unknown>),
    };
  } catch {
    return undefined;
  }
};

export const buildOpportunity = (overrides: Record<string, unknown> = {}) => ({
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

export const buildAnalytics = (
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

export const trackHarnessDiagnostics = (page: Page) => {
  const unexpectedMercadoPublicoOperations: string[] = [];
  const externalRequests: string[] = [];
  const knownMercadoPublicoOperations = new Set([
    'MercadoPublicoV2ActiveOpportunities',
    'MercadoPublicoV2Analytics',
    'MercadoPublicoV2Opportunity',
    'MercadoPublicoV2RefreshControl',
  ]);

  page.on('request', (request) => {
    const url = new URL(request.url());
    const isLocal =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (!isLocal && !isAllowedExternalRequest(url)) {
      externalRequests.push(request.url());
    }

    if (url.pathname.endsWith('/metadata')) {
      const requestBody = getGraphqlRequestBody(request);

      if (requestBody === undefined) {
        return;
      }

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

export const mockMercadoPublicoGraphql = async (
  page: Page,
  {
    opportunities = [buildOpportunity()],
    analytics = buildAnalytics(opportunities.length),
    activeError,
    activeFailures = 0,
    analyticsError,
    syncControlError,
    holdActive = false,
  }: {
    opportunities?: ReturnType<typeof buildOpportunity>[];
    analytics?: ReturnType<typeof buildAnalytics>;
    activeError?: string;
    activeFailures?: number;
    analyticsError?: string;
    syncControlError?: string;
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

  await page.route('**/*', async (route) => {
    const requestBody = getGraphqlRequestBody(route.request());

    if (requestBody === undefined) {
      await route.continue();
      return;
    }

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

    if (requestBody.operationName === 'MercadoPublicoV2RefreshControl') {
      if (syncControlError) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [
              {
                message:
                  'Entity performing the request does not have permission',
                extensions: {
                  code: 'INTERNAL_SERVER_ERROR',
                  userFriendlyMessage: syncControlError,
                },
              },
            ],
          }),
        });

        return;
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2SyncControl: { latestRun: null },
          },
        }),
      });

      return;
    }

    await route.continue();
  });

  return () => releaseActiveRequest?.();
};
