import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  ACTIVE_PATH,
  mockMercadoPublicoGraphql,
  trackHarnessDiagnostics,
} from '../fixtures/mercado-publico.fixture';

test.describe('Mercado Publico Procesos UI contract', () => {
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
      await expect(page.getByRole('columnheader')).toHaveCount(5);
      await expect(
        page.getByText('Municipalidad de Ejemplo').first(),
      ).toBeVisible();
      await expect(page.getByText('Documentos: 1')).toBeVisible();
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
    await expect(page.getByText('Datos técnicos')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Datos técnicos')).toBeHidden();
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
