import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import process from 'node:process';

import { cleanupMercadoPublicoE2E } from './cleanup-mercado-publico-e2e.mjs';
import {
  assertMercadoPublicoE2EPrepared,
  getMercadoPublicoE2EStatus,
  prepareMercadoPublicoE2E,
  resetMercadoPublicoE2E,
} from './provision-mercado-publico-e2e.mjs';

const packageDirectory = resolve(import.meta.dirname, '..');
const mercadoPublicoTestDirectory = resolve(
  packageDirectory,
  'tests/mercado-publico',
);
const configArgument = '--config=playwright.mercado-publico.config.ts';

export const mercadoPublicoSuites = {
  'ui-contract': ['tests/mercado-publico/ui-contract'],
  journeys: ['tests/mercado-publico/journeys'],
  roles: ['tests/mercado-publico/roles'],
  extended: ['tests/mercado-publico/ui-contract'],
  all: [
    'tests/mercado-publico/ui-contract',
    'tests/mercado-publico/journeys',
    'tests/mercado-publico/roles',
  ],
};

export const mercadoPublicoE2ECommands = [
  `yarn playwright test ${configArgument} ${mercadoPublicoSuites.all.join(' ')}`,
];

const getOptionValue = (arguments_, option) => {
  const index = arguments_.indexOf(option);

  if (index === -1) {
    return undefined;
  }

  const value = arguments_[index + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} requires a value`);
  }

  return value;
};

export const validateMercadoPublicoTestFile = (testFile) => {
  const absolutePath = resolve(packageDirectory, testFile);
  const relativePath = relative(mercadoPublicoTestDirectory, absolutePath);

  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    resolve(mercadoPublicoTestDirectory, relativePath) !== absolutePath ||
    !relativePath.endsWith('.spec.ts')
  ) {
    throw new Error(
      'testFile must be a .spec.ts file inside tests/mercado-publico.',
    );
  }

  return `tests/mercado-publico/${relativePath.replaceAll('\\', '/')}`;
};

export const parseMercadoPublicoRunnerArguments = (arguments_) => {
  const positionalArguments = arguments_.filter(
    (argument, index) =>
      !argument.startsWith('--') &&
      arguments_[index - 1] !== '--test-file' &&
      arguments_[index - 1] !== '--grep',
  );
  const action = positionalArguments[0] ?? 'all';
  const lifecycleActions = ['prepare', 'status', 'reset', 'clean'];
  const suiteNames = Object.keys(mercadoPublicoSuites);

  if (![...lifecycleActions, ...suiteNames].includes(action)) {
    throw new Error(`Unknown Mercado Publico E2E action or suite: ${action}`);
  }

  if (positionalArguments.length > 1) {
    throw new Error(
      `Unexpected positional argument: ${positionalArguments[1]}`,
    );
  }

  const knownFlags = new Set([
    '--prepared',
    '--keep',
    '--reuse-auth',
    '--fresh',
    '--test-file',
    '--grep',
  ]);
  const unknownFlag = arguments_.find(
    (argument) => argument.startsWith('--') && !knownFlags.has(argument),
  );

  if (unknownFlag !== undefined) {
    throw new Error(`Unknown Mercado Publico E2E option: ${unknownFlag}`);
  }

  const prepared = arguments_.includes('--prepared');
  const fresh = arguments_.includes('--fresh') || process.env.CI === 'true';
  const testFileValue = getOptionValue(arguments_, '--test-file');
  const grep = getOptionValue(arguments_, '--grep');
  const testFile =
    testFileValue === undefined
      ? undefined
      : validateMercadoPublicoTestFile(testFileValue);

  if (prepared && fresh) {
    throw new Error('--prepared and --fresh cannot be used together');
  }

  if (lifecycleActions.includes(action) && (testFile || grep)) {
    throw new Error('--test-file and --grep are valid only for test suites');
  }

  return {
    action,
    suite: suiteNames.includes(action) ? action : undefined,
    prepared,
    keep: arguments_.includes('--keep'),
    reuseAuth: arguments_.includes('--reuse-auth'),
    fresh,
    testFile,
    grep,
  };
};

export const buildMercadoPublicoPlaywrightArguments = ({
  suite,
  testFile,
  grep,
  reuseAuth,
}) => {
  const testPatterns =
    testFile === undefined ? mercadoPublicoSuites[suite] : [testFile];

  if (testPatterns === undefined) {
    throw new Error(`Unknown Mercado Publico E2E suite: ${suite}`);
  }

  return [
    'playwright',
    'test',
    configArgument,
    ...testPatterns,
    ...(suite === 'ui-contract' && testFile === undefined
      ? ['--grep-invert', '@extended']
      : []),
    ...(suite === 'extended' && testFile === undefined
      ? ['--grep', '@extended']
      : []),
    ...(grep === undefined ? [] : ['--grep', grep]),
    ...(reuseAuth ? ['--no-deps'] : []),
  ];
};

export const getRequiredMercadoPublicoAuthStates = ({ suite, testFile }) => {
  const isRoles =
    suite === 'roles' ||
    suite === 'all' ||
    testFile?.includes('/roles/') === true;
  const needsTeam =
    !isRoles || suite === 'all' || testFile?.includes('/roles/') !== true;

  return [
    ...(needsTeam ? ['user.json'] : []),
    ...(isRoles ? ['operator.json', 'analyst.json'] : []),
  ];
};

export const assertMercadoPublicoReusableAuth = (
  selection,
  fileExists = existsSync,
) => {
  const missingStates = getRequiredMercadoPublicoAuthStates(selection).filter(
    (stateName) => !fileExists(resolve(packageDirectory, '.auth', stateName)),
  );

  if (missingStates.length > 0) {
    throw new Error(
      `--reuse-auth requires existing storage state: ${missingStates.join(', ')}. Run the suite once without --reuse-auth.`,
    );
  }
};

const runProcess = (command, arguments_, { capture = false } = {}) => {
  const executable =
    process.platform === 'win32' && command === 'yarn' ? 'yarn.cmd' : command;
  const result = spawnSync(executable, arguments_, {
    cwd: packageDirectory,
    env: process.env,
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? 'pipe' : 'inherit',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (capture) {
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
  }

  return result;
};

const getPlaywrightPhaseTimings = (output) => {
  for (const line of output.split(/\r?\n/).reverse()) {
    try {
      const event = JSON.parse(line);

      if (event.event === 'mercado-publico-playwright-timings') {
        return event.timingsMs;
      }
    } catch {
      // Non-JSON Playwright output is expected.
    }
  }

  return { authentication: 0, tests: 0 };
};

const emitTimings = (timings) => {
  console.log(
    JSON.stringify({
      event: 'mercado-publico-e2e-timings',
      timingsMs: timings,
    }),
  );
};

export const runMercadoPublicoE2E = (options) => {
  const totalStartedAt = performance.now();
  const timings = {
    database: 0,
    image: 0,
    server: 0,
    frontend: 0,
    authentication: 0,
    tests: 0,
    total: 0,
  };
  let primaryError;

  try {
    if (options.prepared) {
      assertMercadoPublicoE2EPrepared(getMercadoPublicoE2EStatus());
    } else {
      const prepared = prepareMercadoPublicoE2E({ fresh: options.fresh });
      Object.assign(timings, prepared.timings, { total: 0 });
    }

    if (options.reuseAuth) {
      assertMercadoPublicoReusableAuth(options);
    }

    const result = runProcess(
      'yarn',
      buildMercadoPublicoPlaywrightArguments(options),
      { capture: true },
    );
    const playwrightTimings = getPlaywrightPhaseTimings(
      `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
    timings.authentication = options.reuseAuth
      ? 0
      : playwrightTimings.authentication;
    timings.tests = playwrightTimings.tests;

    if (result.error || result.status !== 0) {
      throw (
        result.error ?? new Error(`Playwright failed with ${result.status}`)
      );
    }
  } catch (error) {
    primaryError = error;
  } finally {
    if (!options.keep) {
      try {
        cleanupMercadoPublicoE2E();
      } catch (cleanupError) {
        if (primaryError === undefined) {
          primaryError = cleanupError;
        } else {
          console.error(`E2E cleanup also failed: ${cleanupError.message}`);
        }
      }
    }

    timings.total = Math.round(performance.now() - totalStartedAt);
    emitTimings(timings);
  }

  if (primaryError !== undefined) {
    throw primaryError;
  }
};

const runLifecycleAction = (options) => {
  if (options.action === 'prepare') {
    prepareMercadoPublicoE2E({ fresh: options.fresh });
  } else if (options.action === 'status') {
    console.log(JSON.stringify(getMercadoPublicoE2EStatus(), null, 2));
  } else if (options.action === 'reset') {
    resetMercadoPublicoE2E();
  } else if (options.action === 'clean') {
    cleanupMercadoPublicoE2E();
  }
};

if (process.argv[1] === import.meta.filename) {
  const options = parseMercadoPublicoRunnerArguments(process.argv.slice(2));

  if (options.suite === undefined) {
    runLifecycleAction(options);
  } else {
    runMercadoPublicoE2E(options);
  }
}
