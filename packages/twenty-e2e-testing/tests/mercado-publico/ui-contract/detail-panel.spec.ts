import { expect, test, type Page } from '@playwright/test';

// Issue 26: structured detail in the SidePanel. Deep link, independent child
// pagination, explicit sanitized payload disclosure, and keyboard focus return.
// The flag is build-time (REACT_APP_MERCADO_PUBLICO_V2_ENABLED).

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
  documentCount: 3,
  llamado: 1,
  observationId: 'observation-1',
  normalizerVersion: 'mercado-publico-v2-durable-1',
  providerSchemaFingerprint: 'schema-1',
  availability: 'available',
  description: 'Mantención preventiva de ascensores',
  deliveryAddress: 'Av. Central 123',
  deliveryDays: 15,
  cancellationAt: null,
  callDescription: 'Primer llamado',
  callFirstClosingAt: '2026-06-29T16:00:00.000Z',
  callSecondClosingAt: null,
  budgetType: 'estimado',
  budgetEstimate: '1500000',
  budgetCurrency: 'CLP',
  cancelMotive: null,
  desertedMotive: null,
  selectionMotive: null,
  totalOffers: 2,
  totalDemands: 0,
  finePenalty: '0',
  lifecycleReason: 'new_published',
  detailFreshness: {
    status: 'fresh',
    lastError: null,
    asOf: '2026-08-10T12:00:00.000Z',
  },
  ...overrides,
});

const buildAnalytics = (population: number) => ({
  population,
  calculatedAt: '2026-08-10T12:00:00.000Z',
  asOf: '2026-08-10T11:00:00.000Z',
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

const buildRelationPage = (
  edges: Array<{ cursor: string; node: Record<string, unknown> }>,
  totalCount: number,
) => ({
  edges,
  pageInfo: {
    hasNextPage: true,
    endCursor: edges[edges.length - 1]?.cursor ?? null,
  },
  availability: {
    availability: 'available',
    totalCount,
    sourceKind: 'detail',
    asOf: '2026-08-10T12:00:00.000Z',
  },
});

const mockGraphql = async (
  page: Page,
  opportunity: ReturnType<typeof buildOpportunity>,
  {
    opportunities = [opportunity],
    detailFailures = 0,
  }: {
    opportunities?: ReturnType<typeof buildOpportunity>[];
    detailFailures?: number;
  } = {},
): Promise<void> => {
  const documents = [
    { id: '1', name: 'Bases administrativas' },
    { id: '2', name: 'Especificaciones técnicas' },
  ];
  let detailRequestCount = 0;

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
                pageInfo: { hasNextPage: false, endCursor: 'cursor-1' },
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
          data: { mercadoPublicoV2: { analytics: buildAnalytics(1) } },
        }),
      });

      return;
    }

    if (requestBody.operationName === 'MercadoPublicoV2Opportunity') {
      detailRequestCount += 1;

      if (detailRequestCount <= detailFailures) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ errors: [{ message: 'fixture detail failure' }] }),
        });

        return;
      }

      const requestedCodigo = (requestBody as { variables?: { codigo?: string } })
        .variables?.codigo;
      const requestedOpportunity =
        opportunities.find(({ codigo }) => codigo === requestedCodigo) ??
        opportunity;

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: { mercadoPublicoV2: { opportunity: requestedOpportunity } },
        }),
      });

      return;
    }

    if (requestBody.operationName === 'MercadoPublicoV2Documents') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2: {
              documents: buildRelationPage(
                documents.map((node, index) => ({
                  cursor: `document-cursor-${index + 1}`,
                  node,
                })),
                documents.length,
              ),
            },
          },
        }),
      });

      return;
    }

    if (requestBody.operationName === 'MercadoPublicoV2RawPayload') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2: {
              rawPayload: {
                codigo: opportunity.codigo,
                observationId: 'observation-1',
                payload: {
                  codigo: opportunity.codigo,
                  nombre: opportunity.title,
                  institucion: { rut: '[REDACTED]' },
                },
                sourcePayloadChecksum: 'a'.repeat(64),
                sanitizedPayloadChecksum: 'b'.repeat(64),
                redacted: true,
              },
            },
          },
        }),
      });

      return;
    }

    await route.continue();
  });
};

test.describe('Mercado Publico V2 SidePanel structured detail', () => {
  test('deep link renders the structured detail sections', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, opportunity);

    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Descripción')).toBeVisible();
    await expect(
      page.getByText('Mantención preventiva de ascensores'),
    ).toBeVisible();
    await expect(page.getByText('Entrega')).toBeVisible();
    await expect(page.getByText('Av. Central 123')).toBeVisible();
    await expect(page.getByText('Motivo de cancelación')).toBeVisible();
    await expect(page.getByText('Ciclo de vida')).toBeVisible();
    await expect(page.getByText('new_published')).toBeVisible();
  });

  test('child relations paginate independently', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, opportunity);

    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    const documentsSection = page.getByTestId('relation-documents');

    await expect(
      documentsSection.getByText('Bases administrativas'),
    ).toBeVisible();
    await expect(
      documentsSection.getByText('Especificaciones técnicas'),
    ).toBeVisible();
    await expect(
      documentsSection.getByRole('button', {
        name: 'Siguiente página de documentos',
      }),
    ).toBeVisible();
  });

  test('sanitized JSON is disclosed only after explicit action', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, opportunity);

    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    const disclosureButton = page.getByRole('button', {
      name: 'Ver JSON sanitizado',
    });

    await expect(page.getByTestId('sanitized-payload')).toBeHidden();
    await disclosureButton.click();
    await expect(page.getByTestId('sanitized-payload')).toBeVisible();
    await expect(page.getByTestId('sanitized-payload')).toContainText(
      '[REDACTED]',
    );
  });

  test('keeps three business tabs and a collapsed technical disclosure', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, opportunity);
    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByText('Información técnica')).toBeVisible();
    await expect(
      page.getByText('Monto publicado por la fuente. La factibilidad no está evaluada.'),
    ).toBeVisible();
  });

  test('keyboard disclosure returns focus to the button', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, opportunity);

    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    const disclosureButton = page.getByRole('button', {
      name: 'Ver JSON sanitizado',
    });

    await disclosureButton.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('sanitized-payload')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('sanitized-payload')).toBeHidden();
    await expect(disclosureButton).toBeFocused();
  });

  test('switching process resets panel identity and stale detail content', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const firstOpportunity = buildOpportunity();
    const secondOpportunity = buildOpportunity({
      codigo: 'FIXTURE-CA-002',
      title: 'Segundo proceso',
    });

    await mockGraphql(page, firstOpportunity, {
      opportunities: [firstOpportunity, secondOpportunity],
    });
    await page.goto(`${ACTIVE_PATH}?proceso=${firstOpportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(firstOpportunity.title)).toBeVisible();

    await page.goto(`${ACTIVE_PATH}?proceso=${secondOpportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText(secondOpportunity.title)).toBeVisible();
    await expect(page.getByText(firstOpportunity.title)).toBeHidden();
    await expect(page.getByRole('tab', { name: 'Resumen' })).toBeVisible();
    await expect(page.getByTestId('sanitized-payload')).toBeHidden();
  });

  test('retries detail locally without closing panel', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();

    await mockGraphql(page, opportunity, { detailFailures: 1 });
    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('alert')).toContainText('Detalle no disponible');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText(opportunity.title)).toBeVisible();
    await expect(page).toHaveURL(/proceso=FIXTURE-CA-001/);
  });
});
