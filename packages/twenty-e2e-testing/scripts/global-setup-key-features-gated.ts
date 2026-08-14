import { requireE2eEnvironment } from './require-e2e-environment.mjs';

export default async (): Promise<void> => {
  requireE2eEnvironment('test:key-features:gated', [
    'E2E_DASHBOARDS_ENABLED',
    'E2E_PERMISSIONS_ENABLED',
    'E2E_API_UI_ENABLED',
    'PERMISSIONS_LOGIN',
    'PERMISSIONS_PASSWORD',
  ]);
};
