import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

import {
  getE2EComposePreflightError,
  isolatedE2EComposeProject,
} from './e2e-compose-preflight.mjs';

const composeProject =
  process.env.MERCADO_PUBLICO_V2_E2E_COMPOSE_PROJECT ??
  isolatedE2EComposeProject;
const composeProjectError = getE2EComposePreflightError({
  composeProject,
  isServerRunning: false,
});

if (composeProjectError !== undefined) {
  throw new Error(composeProjectError);
}

export const cleanupMercadoPublicoE2E = () => {
  const result = spawnSync(
    'docker',
    [
      'compose',
      '-p',
      composeProject,
      '-f',
      'docker-compose.yml',
      '-f',
      'docker-compose.e2e.yml',
      'down',
      '--remove-orphans',
    ],
    {
      cwd: resolve(import.meta.dirname, '../../twenty-docker'),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`E2E cleanup failed with ${result.status}`);
  }
};

export default cleanupMercadoPublicoE2E;

if (process.argv[1] === import.meta.filename) {
  cleanupMercadoPublicoE2E();
}
