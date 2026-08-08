const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', (message) => console.log(`[${message.type()}] ${message.text()}`));
    page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));

    await page.goto('http://localhost:3001/', { waitUntil: 'commit', timeout: 30000 });
    console.log('goto:', page.url());
    console.log('cookies:', JSON.stringify(await context.cookies()));
    console.log('localStorage:', await page.evaluate(() => JSON.stringify(localStorage)));

    const emailLogin = page.getByRole('button', { name: 'Continue with Email' });
    try {
      await emailLogin.waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      console.log('login not visible:', page.url());
      console.log((await page.locator('body').innerText()).slice(0, 2000));
      throw error;
    }
    console.log('login page:', page.url());
    await emailLogin.click();
    await page.getByPlaceholder('Email').fill(process.env.DEFAULT_LOGIN || 'tim@apple.dev');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByPlaceholder('Password').fill(process.env.DEFAULT_PASSWORD || 'tim@apple.dev');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForTimeout(30000);
    console.log('signed in:', page.url());

    const workspacePicker = page.getByText('Choose a workspace');
    if (await workspacePicker.isVisible().catch(() => false)) {
      await page.getByText('Apple', { exact: true }).click();
      await page.waitForTimeout(15000);
    }

    await context.storageState({
      path: path.resolve(__dirname, '.auth', 'user.json'),
    });
    console.log('saved:', page.url());
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
