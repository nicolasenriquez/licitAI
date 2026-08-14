import { expect, type Page } from '@playwright/test';

import { LoginPage } from '../pom/loginPage';

export const authenticateAndSave = async (
  page: Page,
  stateFile?: string,
  login?: string,
  password?: string,
): Promise<void> => {
  await page.goto('/');
  const loginPage = new LoginPage(page);

  await loginPage.clickLoginWithEmailIfVisible();
  await loginPage.typeEmail(login ?? process.env.DEFAULT_LOGIN);
  await loginPage.clickContinueButton();
  await loginPage.typePassword(password ?? process.env.DEFAULT_PASSWORD);
  await loginPage.clickSignInButton();
  await expect(page).not.toHaveURL(/\/welcome(?:[/?#]|$)/);
  // Workspace picker only shows for multi-workspace users; single-workspace
  // sessions (e.g. dev-seed identities in the V2 baseline) go straight in.
  const workspacePicker = page.getByText('Choose a workspace');
  if (await workspacePicker.isVisible().catch(() => false)) {
    await page.getByText('Apple', { exact: true }).click();
    await page.waitForURL((url) => !url.pathname.includes('verify'));
  }
  if (stateFile !== undefined) {
    await page.context().storageState({ path: stateFile });
  }
};
