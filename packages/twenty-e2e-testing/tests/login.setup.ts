import { test as base, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../lib/pom/loginPage';

// fixture
const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

test('Login test', async ({ loginPage, page }) => {
  test.setTimeout(300_000);

  await test.step('Navigated to login page', async () => {
    await page.goto('/');
  });
  await test.step(
    'Logging in '.concat(page.url(), ' as ', process.env.DEFAULT_LOGIN),
    async () => {
      // Click "Continue with Email" if visible (may be skipped if password is the only auth method)
      await loginPage.clickLoginWithEmailIfVisible();
      await loginPage.typeEmail(process.env.DEFAULT_LOGIN);
      await loginPage.clickContinueButton();
      await loginPage.typePassword(process.env.DEFAULT_PASSWORD);
      await loginPage.clickSignInButton();
      await expect(page).not.toHaveURL(/\/welcome(?:[/?#]|$)/);
      // Workspace picker only shows for multi-workspace users; single-workspace
      // sessions (e.g. dev-seed identities in the V2 baseline) go straight in.
      const workspacePicker = page.getByText('Choose a workspace');
      if (await workspacePicker.isVisible().catch(() => false)) {
        await page.getByText('Apple', { exact: true }).click();
        await page.waitForURL((url) => !url.pathname.includes('verify'));
      }
      process.env.LINK = page.url();
    },
  );

  await test.step('Saved auth state', async () => {
    await page.context().storageState({
      path: path.resolve(__dirname, '..', '.auth', 'user.json'),
    });
  });
});
