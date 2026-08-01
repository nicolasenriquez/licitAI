import axe from 'axe-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const outputDirectory = dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://localhost:6006/iframe.html';
const stories = {
  compra: 'modules-mercadopublico-workspace--compra-agil',
  compraDark: 'modules-mercadopublico-workspace--compra-agil-dark',
  control: 'modules-mercadopublico-workspace--control-center',
  controlDark: 'modules-mercadopublico-workspace--control-center-dark',
  licitaciones: 'modules-mercadopublico-workspace--licitaciones',
  licitacionesDark: 'modules-mercadopublico-workspace--licitaciones-dark',
  sourcePending: 'modules-mercadopublico-workspace--source-pending',
};
const captureCases = [
  ['01-compra-desktop-light', stories.compra, 1440, 1000, 'light'],
  ['02-licitaciones-desktop-light', stories.licitaciones, 1440, 1000, 'light'],
  ['03-control-desktop-light', stories.control, 1440, 1100, 'light'],
  ['04-source-pending-light', stories.sourcePending, 720, 900, 'light'],
  ['05-compra-mobile-light', stories.compra, 390, 844, 'light'],
  ['06-licitaciones-mobile-light', stories.licitaciones, 390, 844, 'light'],
  ['07-control-mobile-light', stories.control, 390, 844, 'light'],
  ['08-compra-desktop-dark', stories.compraDark, 1440, 1000, 'dark'],
  [
    '09-licitaciones-desktop-dark',
    stories.licitacionesDark,
    1440,
    1000,
    'dark',
  ],
  ['10-control-desktop-dark', stories.controlDark, 1440, 1100, 'dark'],
];

const getStoryUrl = (storyId) =>
  `${baseUrl}?id=${encodeURIComponent(storyId)}&viewMode=story`;

const waitForStory = async (page) => {
  await page.locator('#storybook-root').waitFor({
    state: 'visible',
    timeout: 90_000,
  });
  await page.evaluate(async () => document.fonts.ready);
  await page.waitForTimeout(500);
};

const applyTheme = async (page, theme) => {
  if (theme !== 'dark') return;

  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
};

const collectAudit = async (page) => {
  await page.addScriptTag({ content: axe.source });

  return page.evaluate(async () => {
    const root = document.documentElement;
    const storyRoot =
      document.querySelector('#storybook-root') ?? document.body;
    const ids = [...storyRoot.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    const interactive = [
      ...storyRoot.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ];
    const getName = (element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const labelledText = labelledBy
        ? labelledBy
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
            .join(' ')
            .trim()
        : '';
      const id = element.getAttribute('id');
      const labelText = id
        ? (document
            .querySelector(`label[for="${CSS.escape(id)}"]`)
            ?.textContent?.trim() ?? '')
        : '';

      return (
        element.getAttribute('aria-label') ||
        labelledText ||
        labelText ||
        element.getAttribute('title') ||
        element.textContent?.trim() ||
        ''
      );
    };
    const axeResults = await globalThis.axe.run(storyRoot);

    return {
      axeViolations: axeResults.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.slice(0, 3).map((node) => ({
          failureSummary: node.failureSummary,
          html: node.html,
          target: node.target,
        })),
      })),
      documentOverflow: root.scrollWidth > root.clientWidth + 1,
      duplicateIds: [
        ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
      ],
      localScrollers: [...storyRoot.querySelectorAll('[role="region"]')].map(
        (region) => ({
          label: region.getAttribute('aria-label'),
          clientWidth: region.clientWidth,
          scrollWidth: region.scrollWidth,
          tabIndex: region.getAttribute('tabindex'),
        }),
      ),
      tableHeaders: [...storyRoot.querySelectorAll('table')].map((table) =>
        [...table.querySelectorAll('th')].map(
          (header) => header.textContent?.trim() ?? '',
        ),
      ),
      unnamedInteractive: interactive
        .filter(
          (element) =>
            !(
              element instanceof HTMLInputElement &&
              element.type === 'file' &&
              element.getClientRects().length === 0
            ),
        )
        .filter((element) => getName(element).length === 0)
        .map((element) => element.outerHTML.slice(0, 180)),
    };
  });
};

const collectKeyboardOrder = async (page, steps = 14) => {
  const order = [];

  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;

      if (!(element instanceof HTMLElement) || element === document.body) {
        return null;
      }

      const bounds = element.getBoundingClientRect();

      return {
        name:
          element.getAttribute('aria-label') ??
          element.getAttribute('title') ??
          element.textContent?.trim().slice(0, 80) ??
          '',
        tag: element.tagName,
        visible:
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.bottom >= 0 &&
          bounds.right >= 0 &&
          bounds.top <= innerHeight &&
          bounds.left <= innerWidth,
      };
    });

    if (focused) order.push(focused);
  }

  return order;
};

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = {
  capturedAt: new Date().toISOString(),
  cases: [],
  interaction: {},
  reducedMotion: {},
  zoom200: [],
};

for (const [name, storyId, width, height, theme] of captureCases) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const consoleErrors = [];
  const harnessWarnings = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;

    if (message.text().startsWith('Cannot parse msw request body')) {
      harnessWarnings.push(message.text());
      return;
    }

    consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(getStoryUrl(storyId), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await waitForStory(page);
  await applyTheme(page, theme);
  const audit = await collectAudit(page);
  const keyboard =
    name.startsWith('0') && name.includes('desktop-light')
      ? await collectKeyboardOrder(page)
      : [];

  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, `${name}.png`),
  });
  await writeFile(
    join(outputDirectory, `${name}.aria.yml`),
    await page.locator('body').ariaSnapshot(),
  );
  results.cases.push({
    audit,
    consoleErrors,
    height,
    harnessWarnings,
    keyboard,
    name,
    pageErrors,
    screenshot: `${name}.png`,
    storyId,
    theme,
    width,
  });
  await context.close();
}

for (const [name, storyId] of [
  ['11-compra-zoom-200', stories.compra],
  ['12-licitaciones-zoom-200', stories.licitaciones],
  ['13-control-zoom-200', stories.control],
]) {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 900, width: 720 },
  });
  const page = await context.newPage();

  await page.goto(getStoryUrl(storyId), { waitUntil: 'domcontentloaded' });
  await waitForStory(page);
  const audit = await collectAudit(page);
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, `${name}.png`),
  });
  results.zoom200.push({ audit, name, storyId });
  await context.close();
}

{
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { height: 1100, width: 1440 },
  });
  const page = await context.newPage();

  await page.goto(getStoryUrl(stories.control), {
    waitUntil: 'domcontentloaded',
  });
  await waitForStory(page);
  results.reducedMotion = await page.evaluate(() => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, '14-control-reduced-motion.png'),
  });
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { height: 1100, width: 1440 },
  });
  const page = await context.newPage();

  await page.goto(getStoryUrl(stories.control), {
    waitUntil: 'domcontentloaded',
  });
  await waitForStory(page);
  await page.getByRole('button', { name: 'Llamadas API' }).click();
  await page
    .getByRole('region', { name: 'Llamadas API' })
    .waitFor({ state: 'visible' });
  results.interaction = {
    apiTableCount: await page
      .getByRole('region', { name: 'Llamadas API' })
      .count(),
    jobTableCount: await page
      .getByRole('region', { name: 'Ejecuciones' })
      .count(),
  };
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, '15-control-api-keyboard.png'),
  });
  await context.close();
}

await browser.close();

const allAudits = [
  ...results.cases.map((entry) => entry.audit),
  ...results.zoom200.map((entry) => entry.audit),
];
const failures = {
  axeViolations: allAudits.flatMap((audit) => audit.axeViolations),
  consoleErrors: results.cases.flatMap((entry) => entry.consoleErrors),
  documentOverflow: allAudits.filter((audit) => audit.documentOverflow).length,
  duplicateIds: allAudits.flatMap((audit) => audit.duplicateIds),
  pageErrors: results.cases.flatMap((entry) => entry.pageErrors),
  unnamedInteractive: allAudits.flatMap((audit) => audit.unnamedInteractive),
};

await writeFile(
  join(outputDirectory, 'results.json'),
  `${JSON.stringify({ ...results, failures }, null, 2)}\n`,
);
await writeFile(
  join(outputDirectory, 'audit-report.md'),
  `# Mercado Público production validation\n\n` +
    `- Captured: ${results.capturedAt}\n` +
    `- Screenshots: 15\n` +
    `- Axe violations: ${failures.axeViolations.length}\n` +
    `- Console errors: ${failures.consoleErrors.length}\n` +
    `- Page errors: ${failures.pageErrors.length}\n` +
    `- Duplicate IDs: ${failures.duplicateIds.length}\n` +
    `- Unnamed interactive controls: ${failures.unnamedInteractive.length}\n` +
    `- Document overflow cases: ${failures.documentOverflow}\n` +
    `- Reduced motion matched: ${results.reducedMotion.mediaMatches}\n` +
    `- Investigation tables after API switch: API ${results.interaction.apiTableCount}, jobs ${results.interaction.jobTableCount}\n`,
);

if (
  failures.axeViolations.length ||
  failures.consoleErrors.length ||
  failures.documentOverflow ||
  failures.duplicateIds.length ||
  failures.pageErrors.length ||
  failures.unnamedInteractive.length ||
  !results.reducedMotion.mediaMatches ||
  results.interaction.apiTableCount !== 1 ||
  results.interaction.jobTableCount !== 0
) {
  throw new Error('Production visual/accessibility audit failed.');
}
