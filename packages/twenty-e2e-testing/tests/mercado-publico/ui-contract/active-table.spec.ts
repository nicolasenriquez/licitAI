import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  ACTIVE_PATH,
  buildAnalytics,
  buildOpportunity,
  mockMercadoPublicoGraphql,
  trackHarnessDiagnostics,
} from '../fixtures/mercado-publico.fixture';

test.describe('Mercado Publico Procesos UI contract', () => {
  test('mocked UI Procesos opens a detail panel without losing table context', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

    const diagnostics = trackHarnessDiagnostics(page);
    const opportunity = buildOpportunity({ amount: '1500000' });
    const opportunities = [
      opportunity,
      buildOpportunity({
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
      }),
      buildOpportunity({
        codigo: 'FIXTURE-CA-003',
        state: null,
        region: null,
        documentCount: 0,
        amount: '0',
        availability: 'not_applicable',
      }),
      buildOpportunity({
        codigo: 'FIXTURE-CA-004',
        buyerName: null,
      }),
    ];

    await mockMercadoPublicoGraphql(page, {
      opportunities,
      analytics: buildAnalytics(opportunities.length, {
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
      }),
    });

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Procesos' })).toBeVisible();
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
    await expect(page.getByText('Datos técnicos')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Procesos' })).toBeVisible();
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: 'FIXTURE-CA-001' })
        .getByRole('button', {
          name: 'Abrir Servicio de mantención preventiva',
        }),
    ).toBeVisible();
    diagnostics.assertClean();
  });

  test('mobile view stacks every table field without horizontal page overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    });

    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page, {
      opportunities: [buildOpportunity({ amount: '1500000' })],
      analytics: buildAnalytics(1),
    });

    await page.goto(ACTIVE_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('columnheader')).toHaveCount(5);
    await expect(
      page.getByText('Municipalidad de Ejemplo').first(),
    ).toBeVisible();
    await expect(page.getByText('Documentos: 1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    diagnostics.assertClean();
  });
});
