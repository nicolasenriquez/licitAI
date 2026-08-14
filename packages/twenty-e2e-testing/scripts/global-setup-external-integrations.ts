import { requireE2eEnvironment } from './require-e2e-environment.mjs';

export default async (): Promise<void> => {
  requireE2eEnvironment('test:external-integrations', [
    'E2E_EXTERNAL_INTEGRATIONS_ENABLED',
    'E2E_EXTERNAL_LOGIN',
    'E2E_EXTERNAL_PASSWORD',
    'E2E_EXTERNAL_MAILBOX',
    'E2E_EXTERNAL_IDP_ENABLED',
    'E2E_EXTERNAL_EXPECTED_SUBJECT',
    'E2E_EXTERNAL_DEFAULT_ROLE',
  ]);
};
