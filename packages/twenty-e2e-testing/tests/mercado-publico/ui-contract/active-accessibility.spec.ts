import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  ACTIVE_PATH,
  getGraphqlRequestBody,
  mockMercadoPublicoGraphql,
  trackHarnessDiagnostics,
} from '../fixtures/mercado-publico.fixture';

test.describe('Mercado Publico Procesos UI contract', () => {
  test('quick views preserve filters, map to the cohort contract, and reset the cursor', async ({
    page,
  }) => {
    const filtersSeen: Array<Record<string, unknown>> = [];
    page.on('request', (request) => {
      const requestBody = getGraphqlRequestBody(request);

      if (
        requestBody?.operationName === 'MercadoPublicoV2ActiveOpportunities' &&
        requestBody.variables?.filter !== undefined
      ) {
        filtersSeen.push(
          requestBody.variables.filter as Record<string, unknown>,
        );
      }
    });

    const diagnostics = trackHarnessDiagnostics(page);
    await mockMercadoPublicoGraphql(page);
    await page.goto(
      `${ACTIVE_PATH}?q=computadores&buyer=69000100-1&docsMin=1&after=cursor-2`,
      { waitUntil: 'domcontentloaded' },
    );

    await page.getByRole('button', { name: 'Cierra hoy' }).click();
    await expect.poll(() => filtersSeen.length).toBeGreaterThan(1);

    const todaySearch = new URL(page.url()).searchParams;
    expect(todaySearch.get('q')).toBe('computadores');
    expect(todaySearch.get('buyer')).toBe('69000100-1');
    expect(todaySearch.get('docsMin')).toBe('1');
    expect(todaySearch.get('cohorte')).toBe('active');
    expect(todaySearch.get('estado')).toBe('publicada');
    expect(todaySearch.get('desde')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todaySearch.get('hasta')).toBe(todaySearch.get('desde'));
    expect(todaySearch.get('after')).toBeNull();
    expect(filtersSeen.at(-1)?.states).toEqual(['publicada']);
    expect(filtersSeen.at(-1)?.cohortStatus).toBe('active');

    await page.getByRole('button', { name: 'Todas' }).click();
    await expect.poll(() => filtersSeen.length).toBeGreaterThan(2);

    const allSearch = new URL(page.url()).searchParams;
    expect(allSearch.get('q')).toBe('computadores');
    expect(allSearch.get('buyer')).toBe('69000100-1');
    expect(allSearch.get('docsMin')).toBe('1');
    expect(allSearch.get('cohorte')).toBe('active');
    expect(allSearch.get('estado')).toBeNull();
    expect(allSearch.get('desde')).toBeNull();
    expect(allSearch.get('hasta')).toBeNull();
    expect(allSearch.get('after')).toBeNull();
    expect(filtersSeen.at(-1)?.states).toBeUndefined();
    expect(filtersSeen.at(-1)?.cohortStatus).toBe('active');
    await expect(
      page.getByRole('region', { name: 'Procesos en seguimiento' }),
    ).toBeVisible();
    diagnostics.assertClean();
  });

  test('@extended passes responsive theme matrix and diagnostics', async ({
    page,
  }) => {
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
        page.getByRole('heading', { name: 'Procesos' }),
      ).toBeVisible();
      await expect(page.getByRole('columnheader')).toHaveCount(4);
      await expect(
        page.getByText('Municipalidad de Ejemplo').first(),
      ).toBeVisible();
      await expect(
        page.getByRole('columnheader', { name: 'Oportunidad' }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('main')
        .analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    }

    diagnostics.assertClean();
  });

  test('supports keyboard interaction, visible focus, reduced motion, and 200% zoom', async ({
    page,
  }) => {
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
    await opportunityButton.focus();
    await expect(opportunityButton).toBeFocused();
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
    await page.getByTestId('tab-evidence').click();
    await expect(page.getByText('Ver detalles técnicos')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Ver detalles técnicos')).toBeHidden();
    await expect(opportunityButton).toBeFocused();

    expect(
      await page.evaluate(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    ).toBe(true);

    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expect(
      page.getByText('Municipalidad de Ejemplo').first(),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Monto publicado' }),
    ).toBeVisible();

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
