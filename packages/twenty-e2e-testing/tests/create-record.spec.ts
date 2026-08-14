import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';
import { backendGraphQLUrl } from '../lib/requests/backend';
import { getAccessAuthToken } from '../lib/utils/getAccessAuthToken';

const query = `query FindOnePerson($objectRecordId: UUID!) {
  person(
    filter: {or: [{deletedAt: {is: NULL}}, {deletedAt: {is: NOT_NULL}}], id: {eq: $objectRecordId}}
  ) {
    previousCompanies {
      edges {
        node {
          company {
            name
          }
        }
      }
    }
    emails {
      primaryEmail
      additionalEmails
      __typename
    }
    id
    intro
    jobTitle
    linkedinLink {
      primaryLinkUrl
      primaryLinkLabel
      secondaryLinks
      __typename
    }
    name {
      firstName
      lastName
      __typename
    }
    performanceRating
    phones {
      primaryPhoneNumber
      primaryPhoneCountryCode
      primaryPhoneCallingCode
      additionalPhones
      __typename
    }
    position
    workPreference
    updatedAt
  }
}`

test('creates, reloads, and removes a person', async ({ page }) => {
    await page.goto('/objects/people');
    await page.getByRole('button', { name: 'Create new Person' }).click();

    // Generate a random email for testing
    const randomEmail = `e2e-${randomUUID()}@example.com`;
    // Fill first name and last name
    const firstNameInput = page.getByRole('textbox', { name: 'F‌‌irst name' })
    await expect(firstNameInput).toBeFocused();
    await firstNameInput.fill('John');
    const lastNameInput = page.getByPlaceholder('L‌‌ast name');
    await expect(lastNameInput).toBeVisible();
    await lastNameInput.fill('Doe');
    await lastNameInput.press('Enter');

    // Focus on recordFieldList
    const recordFieldList = page.getByTestId('record-fields-widget');
    await expect(recordFieldList).toBeVisible();
    await recordFieldList.getByText('Emails').first().click();

    // Fill email
    const emailInput = recordFieldList.getByText('Emails').nth(1);
    await expect(emailInput).toBeVisible();
    await emailInput.click({ force: true });
    await page.getByPlaceholder('Email').fill(randomEmail);
    await page.keyboard.press('Enter');
    await recordFieldList.getByText('Emails').first().click();


    // Fill intro
    const introInput = recordFieldList.getByText('Intro').nth(1);
    await expect(introInput).toBeVisible();
    await introInput.click({ force: true });
    await introInput.click({ force: true });
    await page.getByPlaceholder('Intro').fill('This is an intro');
    await page.getByPlaceholder('Intro').press('Enter');

    // Fill URL
    await recordFieldList.getByText('Linkedin').first().click();
    const urlInput = recordFieldList.getByText('Linkedin').nth(1);
    await expect(urlInput).toBeVisible();
    await urlInput.click({ force: true });
    await page.getByPlaceholder('URL').fill('linkedin.com/johndoe');
    await page.getByPlaceholder('URL').press('Enter');

    // Click on 4th star to rate
    await recordFieldList.getByText('Performance Rating').first().click({ force: true });
    const ratingContainer = recordFieldList.locator('div[aria-label="Rating"]');
    await ratingContainer.locator('svg').nth(3).click({force: true});

    // Fill phone field
    await recordFieldList.getByText('Phones').first().click();
    const phoneInput = recordFieldList.getByText('Phones').nth(1);
    await expect(phoneInput).toBeVisible();
    await phoneInput.click({ force: true });
    await page.getByPlaceholder('Phone').fill('+336 1 122 3344');
    await page.getByPlaceholder('Phone').press('Enter');

    // Fill work preference
    await recordFieldList.getByText('Work Preference').first().click({force: true});
    await recordFieldList.getByText('Work Preference').nth(1).click({force: true});
    const options = page.getByRole('listbox');
    await options.getByText('Hybrid').first().click({force: true});
    recordFieldList.getByText('Work Preference').first().click({force: true});

    // Open full record page to get person ID
    await page.getByRole('button', { name: /^Open/ }).click();
    await page.waitForURL(/\/object\/person\//);
    const newPersonId = page.url().match(/\/object\/person\/([a-f0-9-]+)/)?.[1];

    // Check data was saved. GraphQL is only used for cleanup after the UI
    // confirms the persisted record.
    const { authToken } = await getAccessAuthToken(page);
    const findOnePersonResponse = await page.request.post(backendGraphQLUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        operationName: 'FindOnePerson',
        query,
        variables: {
          objectRecordId: newPersonId,
        }
      },
    });

    const findOnePersonReponseBody = await findOnePersonResponse.json();

    expect(findOnePersonReponseBody.data.person.name.firstName).toBe('John');
    expect(findOnePersonReponseBody.data.person.name.lastName).toBe('Doe');
    expect(findOnePersonReponseBody.data.person.emails.primaryEmail).toBe(randomEmail);
    expect(findOnePersonReponseBody.data.person.intro).toBe('This is an intro');
    expect(findOnePersonReponseBody.data.person.linkedinLink.primaryLinkUrl).toBe('linkedin.com/johndoe');
    expect(findOnePersonReponseBody.data.person.phones.primaryPhoneNumber).toBe('611223344');
    expect(findOnePersonReponseBody.data.person.workPreference).toEqual(['HYBRID']);

    await page.reload();
    await expect(page.getByText(randomEmail)).toBeVisible();

    const destroyResponse = await page.request.post(backendGraphQLUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        operationName: 'DestroyPerson',
        query: 'mutation DestroyPerson($id: UUID!) { destroyPerson(id: $id) { id } }',
        variables: { id: newPersonId },
      },
    });

    expect(destroyResponse.ok()).toBeTruthy();

});
