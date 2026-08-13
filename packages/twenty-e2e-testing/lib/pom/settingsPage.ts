import { Locator, Page } from '@playwright/test';

export class SettingsPage {
  private readonly profileLink: Locator;
  private readonly experienceLink: Locator;
  private readonly accountsLink: Locator;
  private readonly emailsLink: Locator;
  private readonly calendarsLink: Locator;
  private readonly generalLink: Locator;
  private readonly dataModelLink: Locator;
  private readonly layoutLink: Locator;
  private readonly membersLink: Locator;
  private readonly billingLink: Locator;
  private readonly apisWebhooksLink: Locator;
  private readonly appsLink: Locator;
  private readonly aiLink: Locator;
  private readonly emailLink: Locator;
  private readonly communityLink: Locator;
  private readonly adminPanelLink: Locator;
  private readonly documentationLink: Locator;
  private readonly advancedToggle: Locator;

  constructor(public readonly page: Page) {
    this.profileLink = page.getByRole('link', { name: 'Profile' });
    this.experienceLink = page.getByRole('link', { name: 'Experience' });
    this.accountsLink = page.getByRole('link', { name: 'Accounts' });
    this.emailsLink = page.getByRole('link', { name: 'Emails', exact: true });
    this.calendarsLink = page.getByRole('link', { name: 'Calendars' });
    this.generalLink = page.getByRole('link', { name: 'General' });
    this.dataModelLink = page.getByRole('link', { name: 'Data model' });
    this.layoutLink = page.getByRole('link', { name: 'Layout' });
    this.membersLink = page.getByRole('link', { name: 'Members' });
    this.billingLink = page.getByRole('link', { name: 'Billing' });
    this.apisWebhooksLink = page.getByRole('link', {
      name: 'APIs & Webhooks',
    });
    this.appsLink = page.getByRole('link', { name: 'Apps' });
    this.aiLink = page.getByRole('link', { name: 'AI' });
    this.emailLink = page.getByRole('link', { name: 'Email' });
    this.communityLink = page.getByRole('link', { name: 'Community' });
    this.adminPanelLink = page.getByRole('link', { name: 'Admin Panel' });
    this.documentationLink = page.getByText('Documentation', { exact: true });
    this.advancedToggle = page.getByRole('switch');
  }

  async goToProfileSection() {
    await this.profileLink.click();
  }

  async goToExperienceSection() {
    await this.experienceLink.click();
  }

  async goToAccountsSection() {
    await this.accountsLink.click();
  }

  async goToEmailsSection() {
    await this.emailsLink.click();
  }

  async goToCalendarsSection() {
    await this.calendarsLink.click();
  }

  async goToGeneralSection() {
    await this.generalLink.click();
  }

  async goToDataModelSection() {
    await this.dataModelLink.click();
  }

  async goToLayoutSection() {
    await this.layoutLink.click();
  }

  async goToMembersSection() {
    await this.membersLink.click();
  }

  async goToBillingSection() {
    await this.billingLink.click();
  }

  async goToAPIsWebhooksSection() {
    await this.apisWebhooksLink.click();
  }

  async goToAppsSection() {
    await this.appsLink.click();
  }

  async goToAISection() {
    await this.aiLink.click();
  }

  async goToEmailSection() {
    await this.emailLink.click();
  }

  async goToCommunitySection() {
    await this.communityLink.click();
  }

  async goToAdminPanelSection() {
    await this.adminPanelLink.click();
  }

  async logout() {
    await this.page.getByText('Logout', { exact: true }).click();
  }

  async toggleAdvancedSettings() {
    await this.advancedToggle.click();
  }
}
