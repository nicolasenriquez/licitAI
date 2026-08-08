const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: require('path').resolve(__dirname, '.auth', 'user.json'),
  });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) =>
    logs.push(`[requestfailed] ${req.method()} ${req.url()} ${req.failure()?.errorText}`),
  );
  await page.goto('http://localhost:3001/mercado-publico', {
    waitUntil: 'commit',
    timeout: 30000,
  });
  await page.waitForTimeout(Number(process.env.PROBE_WAIT) || 15000);
  const state = await page.evaluate(() => {
    const res = performance.getEntriesByType('resource');
    const pending = res.filter((r) => r.duration === 0 && !r.responseEnd);
    return {
      readyState: document.readyState,
      totalResources: res.length,
      pending: pending.slice(0, 12).map((r) => r.name),
    };
  });
  console.log(JSON.stringify(state, null, 1));
  console.log('--- console ---');
  logs.slice(0, 15).forEach((l) => console.log(l));
  await browser.close();
})();

