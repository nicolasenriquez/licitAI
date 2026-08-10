const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: require('path').resolve(__dirname, '.auth', 'user.json'),
  });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text().slice(0, 400)}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message.slice(0, 400)}`));
  page.on('requestfailed', (req) => {
    if (req.url().includes('mercado')) logs.push(`[reqfail] ${req.url()} ${req.failure()?.errorText}`);
  });
  await page.goto('http://localhost:3001/mercado-publico', {
    waitUntil: 'commit',
    timeout: 30000,
  });
  await page.waitForTimeout(90000);
  console.log('FINAL URL:', page.url());
  console.log('--- console ---');
  logs.slice(0, 25).forEach((l) => console.log(l));
  await browser.close();
})();
