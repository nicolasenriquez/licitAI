import { randomUUID } from 'node:crypto';

import { expect, test, type Page } from '@playwright/test';

import { deleteWorkflow } from '../../lib/requests/delete-workflow';
import { destroyWorkflow } from '../../lib/requests/destroy-workflow';

const createWorkflowWithTrigger = async (
  page: Page,
  triggerName: string,
): Promise<{ id: string; name: string }> => {
  const name = `E2E ${triggerName} ${randomUUID()}`;

  await page.goto('/');
  await page.getByRole('link', { name: 'Workflows' }).click();
  const responsePromise = page.waitForResponse((response) => {
    if (!response.url().endsWith('/graphql')) {
      return false;
    }

    return response.request().postDataJSON().operationName === 'CreateOneWorkflow';
  });
  await page.getByRole('button', { name: 'Create new workflow' }).click();
  const response = await responsePromise;
  const responseBody = await response.json();
  const id = responseBody.data.createWorkflow.id as string;
  await page.getByTestId('top-bar-title').getByPlaceholder('Name').fill(name);
  await page.getByText('Add a Trigger', { exact: true }).click();
  await page.getByText(triggerName, { exact: true }).click();
  await page.getByRole('button', { name: 'Close command menu' }).click();
  await page.reload();
  await expect(page.getByTestId('rf__node-trigger')).toContainText(triggerName);

  return { id, name };
};

test('persists the supported workflow trigger configurations', async ({ page }) => {
  const workflows: Array<{ id: string; name: string }> = [];

  try {
    for (const triggerName of [
      'Launch manually',
      'Record is updated',
      'Schedule',
      'Webhook',
    ]) {
      workflows.push(await createWorkflowWithTrigger(page, triggerName));
    }

    const manualWorkflow = workflows[0];
    await page.goto(`/object/workflow/${manualWorkflow.id}`);
    await page.getByLabel(manualWorkflow.name).click();
    await expect(page.getByText(`#1 - ${manualWorkflow.name}`)).toBeVisible();

    const webhookWorkflow = workflows[3];
    await page.goto(`/object/workflow/${webhookWorkflow.id}`);
    const webhookUrl = await page
      .getByLabel('Webhook URL')
      .inputValue();
    const webhookResponse = await page.request.post(webhookUrl, {
      data: { source: 'playwright' },
    });
    expect(webhookResponse.ok()).toBeTruthy();
  } finally {
    for (const workflow of workflows) {
      await deleteWorkflow({ page, workflowId: workflow.id });
      await destroyWorkflow({ page, workflowId: workflow.id });
    }
  }
});
