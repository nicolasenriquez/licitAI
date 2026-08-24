import { expect, test, type Page } from '@playwright/test';

// Issue 22: Activas navigation through URL and keyset (deep links, Back/Forward,
// invalid cursor recovery). The flag is build-time (REACT_APP_MERCADO_PUBLICO_V2_ENABLED).

const ACTIVE_PATH = '/mercado-publico';
const v2FlagOn = process.env.REACT_APP_MERCADO_PUBLICO_V2_ENABLED === 'true';

const buildOpportunity = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

const buildAnalytics = (population: number) => ({
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
  stateBuckets: [{ key: 'publicada', count: population }],
  regionBuckets: [{ key: '13', count: population }],
  currencyBuckets: [{ key: 'CLP', count: population }],
  closingDateBuckets: [{ key: '2026-08-08', count: population }],
  documentBuckets: [{ key: 'positive', count: population }],
  llamadoBuckets: [{ key: '1', count: population }],
});

const mockGraphql = async (
  page: Page,
  opportunities: ReturnType<typeof buildOpportunity>[],
  {
    invalidCursorAfter,
  }: {
    invalidCursorAfter?: string;
  } = {},
): Promise<void> => {
  await page.route('**/metadata', async (route) => {
    const requestBody = route.request().postDataJSON() as {
      operationName?: string;
      variables?: { after?: string };
    };

    if (requestBody.operationName === 'MercadoPublicoV2ActiveOpportunities') {
      if (
        invalidCursorAfter !== undefined &&
        requestBody.variables?.after === invalidCursorAfter
      ) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Mercado Publico V2 cursor is invalid' }],
          }),
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
              analytics: buildAnalytics(opportunities.length),
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
          data: { mercadoPublicoV2: { opportunity: opportunities[0] } },
        }),
      });

      return;
    }

    await route.continue();
  });
};

test.describe('Mercado Publico V2 Activas URL and keyset navigation', () => {
  test('serializes filters and order in the URL and restores them from it', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    await mockGraphql(page, [
      buildOpportunity(),
      buildOpportunity({
        codigo: 'FIXTURE-CA-002',
        title: 'Segunda oportunidad',
        state: 'cerrada',
        region: 5,
      }),
    ]);

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });

    await page
      .getByLabel('Filtrar por estados')
      .getByLabel('Publicada')
      .check();
    await page.getByLabel('Filtrar por región').selectOption('13');
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();

    await expect(page).toHaveURL(/estado=publicada/);
    await expect(page).toHaveURL(/region=13/);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/estado=publicada/);
    await expect(page).toHaveURL(/region=13/);
    await expect(page.getByLabel('Filtrar por región')).toHaveValue('13');
    await expect(
      page.getByLabel('Filtrar por estados').getByLabel('Publicada'),
    ).toBeChecked();

    await page.goBack();
    await expect(page).toHaveURL(/\/mercado-publico$/);
    await expect(page.getByLabel('Filtrar por región')).toHaveValue('');
  });

  test('restores the side panel from a deep link with proceso', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, [opportunity]);

    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Evidencia')).toBeVisible();
  });

  test('Back closes the open panel before navigating the table', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, [opportunity]);

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Evidencia')).toBeVisible();
    await expect(page).toHaveURL(/proceso=FIXTURE-CA-001/);

    await page.goBack();

    await expect(page.getByText('Evidencia')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Activas' })).toBeVisible();
    await expect(page).toHaveURL(/\/mercado-publico$/);
  });

  test('invalid cursor returns to the first page with an accessible notice', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, [opportunity], {
      invalidCursorAfter: 'expired-cursor',
    });

    await page.goto(`${ACTIVE_PATH}?after=expired-cursor`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('alert')).toContainText('Cursor inválido');
    await expect(page).toHaveURL(/\/mercado-publico$/);
    await expect(
      page.getByRole('button', {
        name: 'Abrir Servicio de mantención preventiva',
      }),
    ).toBeVisible();
  });
});
