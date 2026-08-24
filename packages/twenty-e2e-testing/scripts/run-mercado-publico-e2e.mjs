import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { cleanupMercadoPublicoE2E } from './cleanup-mercado-publico-e2e.mjs';

const categoryPatterns = {
  'ui-contract': 'tests/mercado-publico/ui-contract',
  journeys: 'tests/mercado-publico/journeys',
  roles: 'tests/mercado-publico/roles',
};

export const mercadoPublicoE2ECommands = Object.values(categoryPatterns).map(
  (pattern) =>
    `yarn playwright test --config=playwright.mercado-publico.config.ts ${pattern}`,
);

const run = (command, arguments_) => {
  const executable =
    process.platform === 'win32' && command === 'yarn' ? 'yarn.cmd' : command;
  const result = spawnSync(executable, arguments_, {
    cwd: import.meta.dirname + '/..',
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`${command} failed with ${result.status}`);
  }
};

export const runMercadoPublicoE2E = (category, fresh = false) => {
  const selectedPatterns =
    category === 'all'
      ? Object.values(categoryPatterns)
      : [categoryPatterns[category]].filter(Boolean);

  if (selectedPatterns.length === 0) {
    throw new Error(`Unknown Mercado Publico E2E category: ${category}`);
  }

  try {
    run('node', [
      'scripts/provision-mercado-publico-e2e.mjs',
      '--fixture',
      'v2-history-and-buyers',
      ...(fresh ? ['--fresh'] : []),
    ]);

    for (const pattern of selectedPatterns) {
      run('yarn', [
        'playwright',
        'test',
        '--config=playwright.mercado-publico.config.ts',
        pattern,
      ]);
    }
  } finally {
    if (process.env.MERCADO_PUBLICO_V2_KEEP_E2E_ENV !== 'true') {
      cleanupMercadoPublicoE2E();
    }
  }
};

if (process.argv[1] === import.meta.filename) {
  runMercadoPublicoE2E(
    process.argv.find((argument) =>
      Object.keys(categoryPatterns).includes(argument),
    ) ?? 'all',
    process.argv.includes('--fresh'),
  );
}
