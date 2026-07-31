import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const outputDirectory = dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://localhost:6006/iframe.html';
const unavailableDetailMessage =
  'El detalle estará disponible cuando la lista de procesos pueda mostrarse.';

const stories = {
  empty: 'mercado-público-browse-detail-prototype--empty',
  error: 'mercado-público-browse-detail-prototype--error',
  loaded: 'mercado-público-browse-detail-prototype--compra-agil-loaded',
  loading: 'mercado-público-browse-detail-prototype--loading',
  sourcePending:
    'mercado-público-browse-detail-prototype--compra-agil-source-pending',
};

const getStoryUrl = (storyId) =>
  `${baseUrl}?id=${encodeURIComponent(storyId)}&viewMode=story`;

const waitForStory = async (page, storyId) => {
  await page.goto(getStoryUrl(storyId), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await page
    .locator('#storybook-root')
    .waitFor({ state: 'visible', timeout: 180_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

const browser = await chromium.launch({ headless: true });
const results = {};

try {
  await mkdir(outputDirectory, { recursive: true });

  for (const [name, storyId] of Object.entries(stories)) {
    const context = await browser.newContext({
      viewport: { height: 900, width: 1440 },
    });
    const page = await context.newPage();
    await waitForStory(page, storyId);

    const detail = page.getByLabel('Detalle del proceso seleccionado');
    const summaryFieldCount = await detail.locator('dt').count();
    const unavailableMessageVisible = await detail
      .getByText(unavailableDetailMessage, { exact: true })
      .isVisible();

    if (['loading', 'empty', 'error'].includes(name)) {
      if (summaryFieldCount !== 0 || !unavailableMessageVisible) {
        throw new Error(
          `${name} presented process detail while the browse list was unavailable.`,
        );
      }
    }

    if (name === 'sourcePending' && summaryFieldCount === 0) {
      throw new Error('source-pending hid the selected process summary.');
    }

    if (name === 'loaded') {
      const titleButtons = page.locator('tbody button');
      const buttonCount = await titleButtons.count();
      await titleButtons.nth(buttonCount - 1).focus();
      await page.keyboard.press('Enter');
    }

    await page.screenshot({
      fullPage: true,
      path: join(outputDirectory, `${name}.png`),
    });

    results[name] = {
      selectedCode:
        summaryFieldCount > 0
          ? await detail.locator('dd').first().textContent()
          : null,
      summaryFieldCount,
      unavailableMessageVisible,
    };
    await context.close();
  }

  await writeFile(
    join(outputDirectory, 'results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
