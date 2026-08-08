import { test as base } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../lib/pom/loginPage';

const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

test('Login test', async ({ loginPage, page }) => {
  await page.goto('/');
  await page.waitForTimeout(60000);
  await loginPage.clickLoginWithEmailIfVisible();
  await loginPage.typeEmail(process.env.DEFAULT_LOGIN);
  await loginPage.clickContinueButton();
  await loginPage.typePassword(process.env.DEFAULT_PASSWORD);
  await loginPage.clickSignInButton();
  await page.waitForTimeout(60000);
  const workspacePicker = page.getByText('Choose a workspace');
  if (await workspacePicker.isVisible().catch(() => false)) {
    await page.getByText('Apple', { exact: true }).click();
  }
  await page.waitForTimeout(60000);
  console.log('LOGIN OK, final url:', page.url());
  await page.context().storageState({
    path: path.resolve(__dirname, '..', '.auth', 'user.json'),
  });
});
