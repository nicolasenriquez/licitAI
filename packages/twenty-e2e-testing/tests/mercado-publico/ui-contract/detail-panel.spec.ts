import { expect, test, type Page } from '@playwright/test';

import {
  ACTIVE_PATH,
  buildAnalytics,
  buildOpportunity as buildBaseOpportunity,
  getGraphqlRequestBody,
} from '../fixtures/mercado-publico.fixture';

// Issue 26: structured detail in the SidePanel. Deep link, independent child
// pagination, explicit sanitized payload disclosure, and keyboard focus return.
// The flag is build-time (REACT_APP_MERCADO_PUBLICO_V2_ENABLED).

const v2FlagOn = process.env.REACT_APP_MERCADO_PUBLICO_V2_ENABLED === 'true';

const buildOpportunity = (overrides: Record<string, unknown> = {}) => ({
  ...buildBaseOpportunity({
    amount: '1500000',
    documentCount: 3,
    normalizerVersion: 'mercado-publico-v2-durable-1',
  }),
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
    documentAvailability = 'available',
    documentFailures = 0,
    documents: documentNodes = [
      { id: '1', name: 'Bases administrativas' },
      { id: '2', name: 'Especificaciones técnicas' },
    ],
  }: {
    opportunities?: ReturnType<typeof buildOpportunity>[];
    detailFailures?: number;
    documentAvailability?: 'available' | 'unavailable';
    documentFailures?: number;
    documents?: Array<{ id: string; name: string }>;
  } = {},
): Promise<{ documentAfterValues: Array<string | null> }> => {
  let detailRequestCount = 0;
  let documentRequestCount = 0;
  const documentAfterValues: Array<string | null> = [];

  await page.route('**/*', async (route) => {
    const requestBody = getGraphqlRequestBody(route.request());

    if (requestBody === undefined) {
      await route.continue();
      return;
    }

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
          body: JSON.stringify({
            errors: [{ message: 'fixture detail failure' }],
          }),
        });

        return;
      }

      const requestedCodigo = (
        requestBody as { variables?: { codigo?: string } }
      ).variables?.codigo;
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
      documentRequestCount += 1;
      documentAfterValues.push(
        (requestBody as { variables?: { after?: string | null } }).variables
          ?.after ?? null,
      );

      if (documentRequestCount <= documentFailures) {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'fixture documents failure' }],
          }),
        });

        return;
      }

      const documentPage = buildRelationPage(
        documentAvailability === 'available'
          ? documentNodes.map((node, index) => ({
              cursor: `document-cursor-${index + 1}`,
              node,
            }))
          : [],
        documentAvailability === 'available' ? documentNodes.length : 0,
      );

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2: {
              documents: {
                ...documentPage,
                availability: {
                  ...documentPage.availability,
                  availability: documentAvailability,
                },
              },
            },
          },
        }),
      });

      return;
    }

    if (requestBody.operationName === 'MercadoPublicoV2History') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            mercadoPublicoV2: {
              history: buildRelationPage([], 0),
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

  return { documentAfterValues };
};

test.describe('Mercado Publico V2 SidePanel structured detail', () => {
  test('deep link renders the structured detail sections', async ({ page }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity({
      cancelMotive: 'No cancelado',
    });

    await mockGraphql(page, opportunity);

    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText('Descripción')).toBeVisible();
    await expect(
      page.getByText('Mantención preventiva de ascensores'),
    ).toBeVisible();
    await page.getByText('Entrega y presupuesto').click();
    await expect(page.getByText('Entrega', { exact: true })).toBeVisible();
    await expect(page.getByText('Av. Central 123')).toBeVisible();
    await page.getByText('Motivos y decisión').click();
    await expect(page.getByText('Motivo de cancelación')).toBeVisible();
    await page.getByText('Ciclo de vida').click();
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

    await page.getByTestId('tab-documents').click();
    const documentsSection = page.getByTestId('relation-documents');

    await expect(
      documentsSection.getByText('Bases administrativas'),
    ).toBeVisible();
    await expect(
      documentsSection.getByText('Especificaciones técnicas'),
    ).toBeVisible();
    await expect(documentsSection.locator('summary')).toHaveCount(0);
    await expect(
      documentsSection.getByText('Localizador no informado').first(),
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

    await page.getByTestId('tab-evidence').click();
    await page.getByText('Payload técnico de fuente').click();

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

  test('keeps four business tabs and a collapsed technical disclosure', async ({
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

    await expect(
      page.locator('[data-side-panel] [data-testid^="tab-"]:visible'),
    ).toHaveCount(4);
    await expect(page.getByTestId('tab-evidence')).toHaveText('Trazabilidad');
    await page.getByTestId('tab-evidence').click();
    await page.getByText('Payload técnico de fuente').click();
    await expect(page.getByText('Ver detalles técnicos')).toBeVisible();
    await expect(page.getByTestId('sanitized-payload')).toBeHidden();
  });

  test('documents expose empty, unavailable, and retry states without inventing links', async ({
    page,
  }) => {
    test.skip(
      !v2FlagOn,
      'build has REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false',
    );

    const opportunity = buildOpportunity();
    await mockGraphql(page, opportunity, { documents: [] });
    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('tab-documents').click();
    await expect(page.getByText('No hay documentos informados.')).toBeVisible();
    await expect(
      page.getByTestId('relation-documents').getByRole('link'),
    ).toHaveCount(0);

    await page.unroute('**/*');
    await mockGraphql(page, opportunity, {
      documentAvailability: 'unavailable',
    });
    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('tab-documents').click();
    await expect(
      page.getByText('Documentos no disponibles desde la fuente.'),
    ).toBeVisible();

    await page.unroute('**/*');
    await mockGraphql(page, opportunity, { documentFailures: 1 });
    await page.goto(`${ACTIVE_PATH}?proceso=${opportunity.codigo}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('tab-documents').click();
    await expect(
      page.getByText('No fue posible cargar los documentos.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Reintentar documentos' }).click();
    await expect(page.getByText('Bases administrativas')).toBeVisible();
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

    await page.getByTestId('tab-evidence').click();
    await page.getByText('Payload técnico de fuente').click();

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

    const { documentAfterValues } = await mockGraphql(page, firstOpportunity, {
      opportunities: [firstOpportunity, secondOpportunity],
    });
    await page.goto(ACTIVE_PATH, {
      waitUntil: 'domcontentloaded',
    });
    const firstRow = page.getByRole('row').filter({
      hasText: firstOpportunity.codigo,
    });
    const secondRow = page.getByRole('row').filter({
      hasText: secondOpportunity.codigo,
    });
    await firstRow.getByRole('button').click();

    const panel = page.locator('[data-side-panel]');
    await expect(panel.getByText(firstOpportunity.title)).toBeVisible();

    await panel.getByTestId('tab-documents').click();
    await expect(
      panel.getByRole('button', { name: 'Siguiente página de documentos' }),
    ).toBeVisible();
    await panel
      .getByRole('button', { name: 'Siguiente página de documentos' })
      .click();
    await expect
      .poll(() => documentAfterValues.at(-1))
      .toBe('document-cursor-2');

    await panel.getByTestId('tab-evidence').click();
    await panel.getByText('Payload técnico de fuente').click();
    await panel.getByRole('button', { name: 'Ver JSON sanitizado' }).click();
    await expect(panel.getByTestId('sanitized-payload')).toBeVisible();

    await secondRow.getByRole('button').click();

    await expect(panel.getByText(secondOpportunity.title)).toBeVisible();
    await expect(panel.getByText(firstOpportunity.title)).toBeHidden();
    await expect(panel.getByTestId('tab-summary')).toHaveAttribute(
      'data-active',
    );
    await expect(panel.getByTestId('sanitized-payload')).toBeHidden();
    await panel.getByTestId('tab-documents').click();
    await expect.poll(() => documentAfterValues.at(-1)).toBe(null);
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

    await expect(page.getByRole('alert')).toContainText(
      'Detalle no disponible',
    );
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(
      page.locator('[data-side-panel]').getByText(opportunity.title),
    ).toBeVisible();
    await expect(page).toHaveURL(/proceso=FIXTURE-CA-001/);
  });
});
