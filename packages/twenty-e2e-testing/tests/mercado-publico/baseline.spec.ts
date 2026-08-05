import { expect, test } from '@playwright/test';

// Baseline smoke (issue 18): authenticated, flag-aware, evidence-preserving.
// The flag is build-time (VITE_MERCADO_PUBLICO_V2_ENABLED); this spec asserts
// the behavior of the running build and saves screenshots/trace via config.

const V2_PATH = '/mercado-publico-v2';
const v2FlagOn = process.env.VITE_MERCADO_PUBLICO_V2_ENABLED === 'true';

test.describe('Mercado Publico V2 baseline', () => {
  test('flagged build exposes the full V2 route, read-only, local-only network', async ({
    page,
  }) => {
    test.skip(!v2FlagOn, 'build has VITE_MERCADO_PUBLICO_V2_ENABLED=false');

    const externalRequests: string[] = [];

    page.on('request', (request) => {
      const url = new URL(request.url());
      const isLocal =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1';

      if (!isLocal) {
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
    test.skip(v2FlagOn, 'build has VITE_MERCADO_PUBLICO_V2_ENABLED=true');

    await page.goto(V2_PATH);

    await expect(
      page.getByRole('heading', { name: 'Mercado Público V2 (baseline)' }),
    ).not.toBeVisible();
  });
});
