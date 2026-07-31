import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const outputDirectory = dirname(fileURLToPath(import.meta.url));
const baseUrl = 'http://localhost:6006/iframe.html';

const stories = {
  compraLoaded: 'mercado-público-browse-detail-prototype--compra-agil-loaded',
  licitacionesLoaded:
    'mercado-público-browse-detail-prototype--licitaciones-loaded',
  browseLoading: 'mercado-público-browse-detail-prototype--loading',
  browseEmpty: 'mercado-público-browse-detail-prototype--empty',
  browseError: 'mercado-público-browse-detail-prototype--error',
  compraPending:
    'mercado-público-browse-detail-prototype--compra-agil-source-pending',
  licitacionesMissing:
    'mercado-público-browse-detail-prototype--licitaciones-missing-values',
  controlHealthy: 'mercado-público-control-center-prototype--healthy',
  controlPartial: 'mercado-público-control-center-prototype--partial',
  controlEmpty: 'mercado-público-control-center-prototype--empty',
  controlError: 'mercado-público-control-center-prototype--error',
};

const captureCases = [
  ['01-compra-agil-desktop-light', stories.compraLoaded, 1440, 1100, 'light'],
  [
    '02-licitaciones-desktop-light',
    stories.licitacionesLoaded,
    1440,
    1100,
    'light',
  ],
  [
    '03-control-center-desktop-light',
    stories.controlHealthy,
    1440,
    1100,
    'light',
  ],
  ['04-compra-agil-mobile-light', stories.compraLoaded, 390, 844, 'light'],
  [
    '05-licitaciones-mobile-light',
    stories.licitacionesLoaded,
    390,
    844,
    'light',
  ],
  ['06-control-center-mobile-light', stories.controlHealthy, 390, 844, 'light'],
  ['07-compra-agil-desktop-dark', stories.compraLoaded, 1440, 1100, 'dark'],
  [
    '08-licitaciones-desktop-dark',
    stories.licitacionesLoaded,
    1440,
    1100,
    'dark',
  ],
  [
    '09-control-center-desktop-dark',
    stories.controlHealthy,
    1440,
    1100,
    'dark',
  ],
  ['10-loading', stories.browseLoading, 1440, 900, 'light'],
  ['11-empty', stories.browseEmpty, 1440, 900, 'light'],
  ['12-error', stories.browseError, 1440, 900, 'light'],
  ['13-source-pending', stories.compraPending, 1440, 1000, 'light'],
  ['14-missing-values', stories.licitacionesMissing, 1440, 1000, 'light'],
  ['15-control-partial', stories.controlPartial, 1440, 1100, 'light'],
  ['16-control-empty', stories.controlEmpty, 1440, 900, 'light'],
  ['17-control-error', stories.controlError, 1440, 900, 'light'],
];

const getStoryUrl = (storyId) =>
  `${baseUrl}?id=${encodeURIComponent(storyId)}&viewMode=story`;

const applyTheme = async (page, theme) => {
  if (theme !== 'dark') return;

  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
};

const waitForStableStory = async (page) => {
  await page
    .locator('#storybook-root')
    .waitFor({ state: 'visible', timeout: 90_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);
};

const collectDomAudit = async (page) =>
  page.evaluate(() => {
    const root = document.documentElement;
    const storyRoot =
      document.querySelector('#storybook-root') ?? document.body;
    const interactiveSelector =
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const interactiveElements = [
      ...storyRoot.querySelectorAll(interactiveSelector),
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
    const ids = [...storyRoot.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    const duplicateIds = [
      ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
    ];
    const tables = [...storyRoot.querySelectorAll('table')].map((table) => ({
      columnHeaders: [...table.querySelectorAll('th[scope="col"]')].map(
        (header) => header.textContent?.trim() ?? '',
      ),
      rowCount: table.querySelectorAll('tbody tr').length,
    }));
    const parseRgb = (value) => {
      if (value.startsWith('color(display-p3')) {
        const match = value.match(
          /color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
        );
        return match
          ? match.slice(1, 4).map((channel) => Number(channel) * 255)
          : null;
      }
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (channels.length < 3) return null;
      return channels.slice(0, 3);
    };
    const luminance = (channels) => {
      const linear = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const contrast = (foreground, background) => {
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      );
    };
    const getBackground = (element) => {
      let current = element;
      while (current instanceof HTMLElement) {
        const value = getComputedStyle(current).backgroundColor;
        if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent')
          return value;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const contrastSamples = [
      ...storyRoot.querySelectorAll(
        'li, p, dt, dd, th, td, button, label, h1, h2, h3, h4, h5, h6',
      ),
    ]
      .filter((element) => element.textContent?.trim())
      .filter((element) => !element.closest(':disabled'))
      .map((element) => {
        const foregroundValue = getComputedStyle(element).color;
        const backgroundValue = getBackground(element);
        const foreground = parseRgb(foregroundValue);
        const background = parseRgb(backgroundValue);
        return {
          background: backgroundValue,
          color: foregroundValue,
          ratio:
            foreground && background
              ? Number(contrast(foreground, background).toFixed(2))
              : null,
          tag: element.tagName,
          text: element.textContent?.trim().slice(0, 140) ?? '',
        };
      })
      .filter((sample) => sample.ratio !== null && sample.ratio < 4.5)
      .sort((left, right) => left.ratio - right.ratio)
      .slice(0, 30);
    const overflowElements = [...storyRoot.querySelectorAll('*')]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > root.clientWidth + 1,
      )
      .slice(0, 30)
      .map((element) => ({
        className: element.getAttribute('class')?.slice(0, 160) ?? '',
        right: Math.round(element.getBoundingClientRect().right),
        tag: element.tagName,
        text: element.textContent?.trim().slice(0, 120) ?? '',
      }));

    return {
      contrastBelow45: contrastSamples,
      documentOverflow: root.scrollWidth > root.clientWidth + 1,
      documentWidth: { client: root.clientWidth, scroll: root.scrollWidth },
      duplicateIds,
      headings: [...storyRoot.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(
        (heading) => ({
          level: heading.tagName,
          text: heading.textContent?.trim() ?? '',
        }),
      ),
      interactiveCount: interactiveElements.length,
      unnamedInteractive: interactiveElements
        .filter((element) => getName(element).length === 0)
        .map((element) => element.outerHTML.slice(0, 200)),
      landmarks: {
        aside: storyRoot.querySelectorAll('aside').length,
        main: storyRoot.querySelectorAll('main').length,
        nav: storyRoot.querySelectorAll('nav').length,
        section: storyRoot.querySelectorAll('section').length,
      },
      liveRegions: [
        ...storyRoot.querySelectorAll('[aria-live], [role="alert"]'),
      ].map((element) => ({
        ariaLive: element.getAttribute('aria-live'),
        role: element.getAttribute('role'),
        text: element.textContent?.trim().slice(0, 240) ?? '',
      })),
      overflowElements,
      tables,
    };
  });

const collectKeyboardAudit = async (page, maximumSteps = 16) => {
  const focusOrder = [];

  for (let step = 0; step < maximumSteps; step += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body)
        return null;
      const box = element.getBoundingClientRect();
      return {
        ariaLabel: element.getAttribute('aria-label'),
        tag: element.tagName,
        text:
          element.getAttribute('title') ??
          element.textContent?.trim().slice(0, 100) ??
          '',
        visible:
          box.width > 0 &&
          box.height > 0 &&
          box.bottom >= 0 &&
          box.right >= 0 &&
          box.top <= window.innerHeight &&
          box.left <= window.innerWidth,
      };
    });
    if (focused) focusOrder.push(focused);
  }

  return focusOrder;
};

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = {
  capturedAt: new Date().toISOString(),
  cases: [],
  interactions: {},
  reducedMotion: {},
  truthfulBrowseStates: {},
  zoom200: [],
};

for (const [name, storyId, width, height, theme] of captureCases) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(getStoryUrl(storyId), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await waitForStableStory(page);
  await applyTheme(page, theme);
  const dom = await collectDomAudit(page);
  const ariaSnapshot = await page.locator('body').ariaSnapshot();
  const keyboard = ['01-', '02-', '03-'].some((prefix) =>
    name.startsWith(prefix),
  )
    ? await collectKeyboardAudit(page)
    : [];
  const screenshotPath = join(outputDirectory, `${name}.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath });

  if (['10-loading', '11-empty', '12-error'].includes(name)) {
    const detail = page.getByLabel('Detalle del proceso seleccionado');
    const summaryFieldCount = await detail.locator('dt').count();
    const unavailableMessageVisible = await detail
      .getByText(
        'El detalle estará disponible cuando la lista de procesos pueda mostrarse.',
        { exact: true },
      )
      .isVisible();

    if (summaryFieldCount !== 0 || !unavailableMessageVisible) {
      throw new Error(
        `${name} presents a current process detail while the browse list is unavailable.`,
      );
    }

    results.truthfulBrowseStates[name] = {
      summaryFieldCount,
      unavailableMessageVisible,
    };
  }

  results.cases.push({
    consoleErrors,
    dom,
    height,
    keyboard,
    name,
    pageErrors,
    screenshot: `${name}.png`,
    storyId,
    theme,
    width,
  });
  await writeFile(join(outputDirectory, `${name}.aria.yml`), ariaSnapshot);
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  await page.goto(getStoryUrl(stories.compraLoaded), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await waitForStableStory(page);
  await page
    .getByLabel('Detalle del proceso seleccionado')
    .waitFor({ state: 'visible' });
  const titleButtons = page.locator('tbody button');
  const buttonCount = await titleButtons.count();
  await titleButtons.nth(buttonCount - 1).focus();
  await page.keyboard.press('Enter');
  const selectedCode = await page
    .getByLabel('Detalle del proceso seleccionado')
    .locator('dd')
    .first()
    .textContent();
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, '18-browse-keyboard-selection.png'),
  });
  results.interactions.browseKeyboardSelection = {
    activeElementTitle: await page.evaluate(() =>
      document.activeElement?.getAttribute('title'),
    ),
    selectedCode,
  };
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  await page.goto(getStoryUrl(stories.controlHealthy), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await waitForStableStory(page);
  await page.getByRole('main').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Llamadas API' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Ver detalle' }).first().focus();
  await page.keyboard.press('Enter');
  const redactedDetailVisible = await page
    .getByText('Parámetros redactados por servidor')
    .isVisible();
  await page.getByRole('button', { name: 'Siguiente' }).focus();
  await page.keyboard.press('Enter');
  const pageLabel = await page.getByText(/Página 2/).textContent();
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, '19-control-keyboard-api-page.png'),
  });
  results.interactions.controlKeyboardFlow = {
    activeElementTitle: await page.evaluate(() =>
      document.activeElement?.getAttribute('title'),
    ),
    pageLabel,
    redactedDetailVisible,
  };
  await context.close();
}

for (const [name, storyId] of [
  ['20-compra-agil-zoom-200', stories.compraLoaded],
  ['21-licitaciones-zoom-200', stories.licitacionesLoaded],
  ['22-control-center-zoom-200', stories.controlHealthy],
]) {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 720, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(getStoryUrl(storyId), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await waitForStableStory(page);
  const dom = await collectDomAudit(page);
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, `${name}.png`),
  });
  results.zoom200.push({ dom, name, screenshot: `${name}.png`, storyId });
  await context.close();
}

{
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  await page.goto(getStoryUrl(stories.controlHealthy), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  });
  await waitForStableStory(page);
  results.reducedMotion = await page.evaluate(() => ({
    animationElements: [
      ...(
        document.querySelector('#storybook-root') ?? document.body
      ).querySelectorAll('*'),
    ]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.animationName !== 'none' || style.transitionDuration !== '0s'
        );
      })
      .slice(0, 30)
      .map((element) => ({
        animationName: getComputedStyle(element).animationName,
        tag: element.tagName,
        transitionDuration: getComputedStyle(element).transitionDuration,
      })),
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  await page.screenshot({
    fullPage: true,
    path: join(outputDirectory, '23-control-center-reduced-motion.png'),
  });
  await context.close();
}

await writeFile(
  join(outputDirectory, 'results.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);
await browser.close();
