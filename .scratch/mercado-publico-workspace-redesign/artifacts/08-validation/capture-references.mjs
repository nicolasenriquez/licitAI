import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const outputDirectory = dirname(fileURLToPath(import.meta.url));
const references = [
  ['24-native-table-reference', 'ui-layout-table-table--default'],
  [
    '25-native-record-table-reference',
    'modules-objectrecord-recordtable-recordtable--default',
  ],
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const [name, storyId] of references) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(
    `http://localhost:6006/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.locator('#storybook-root').waitFor({ state: 'visible' });
  await page.evaluate(async () => document.fonts.ready);
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, `${name}.png`),
  });
  await context.close();
}

await browser.close();
