import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';
import { deleteWorkflow } from '../lib/requests/delete-workflow';
import { destroyWorkflow } from '../lib/requests/destroy-workflow';

test('Create workflow', async ({ page }) => {
  const workflowName = `E2E workflow ${randomUUID()}`;

  await page.goto('/');

  const workflowsFolder = page.getByRole('button', { name: 'Workflows' });
  await workflowsFolder.click();

  const workflowsLink = page.getByRole('link', { name: 'Workflows' });
  await workflowsLink.click();

  const createWorkflowButton = page.getByRole('button', {
    name: 'Create new workflow',
  });

  const [createWorkflowResponse] = await Promise.all([
    page.waitForResponse(async (response) => {
      if (!response.url().endsWith('/graphql')) {
        return false;
      }

      const requestBody = response.request().postDataJSON();

      return requestBody.operationName === 'CreateOneWorkflow';
    }),

    createWorkflowButton.click()
  ]);


  const recordName = page.getByTestId('top-bar-title').getByPlaceholder('Name');
  await expect(recordName).toBeVisible();
  await recordName.fill(workflowName);

  const workflowDiagramContainer = page.locator('.react-flow__renderer');
  await workflowDiagramContainer.click();

  const body = await createWorkflowResponse.json();
  const newWorkflowId = body.data.createWorkflow.id;

  try {
    const workflowNameLocator = page
      .getByTestId('top-bar-title')
      .getByText(workflowName);

    // Wait for the name to be visible and not hidden
    await workflowNameLocator.waitFor({ state: 'visible' });
    await expect(workflowNameLocator).toBeVisible();

    await expect(page).toHaveURL(`/object/workflow/${newWorkflowId}`);
  } finally {
    await deleteWorkflow({
      page,
      workflowId: newWorkflowId,
    });
    await destroyWorkflow({
      page,
      workflowId: newWorkflowId,
    });
  }
});
