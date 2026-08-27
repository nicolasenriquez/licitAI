import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

import {
  getE2EComposePreflightError,
  isolatedE2EComposeProject,
} from './e2e-compose-preflight.mjs';

const E2E_FIXTURE = 'v2-history-and-buyers';
const PG_USER = 'postgres';
const PG_DATABASE = 'default';
const scriptDirectory = import.meta.dirname;
const packageDirectory = resolve(scriptDirectory, '..');
const repositoryDirectory = resolve(scriptDirectory, '../../..');
const composeDirectory = resolve(scriptDirectory, '../../twenty-docker');
const frontendBuildIndex = resolve(
  scriptDirectory,
  '../../twenty-front/build/index.html',
);
const lifecycleStatePath = resolve(
  repositoryDirectory,
  '.cache/mercado-publico-e2e-state.json',
);
const composeFiles = [
  '-f',
  'docker-compose.yml',
  '-f',
  'docker-compose.e2e.yml',
];
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

const now = () => performance.now();

const createTimings = () => ({
  database: 0,
  image: 0,
  server: 0,
  frontend: 0,
  authentication: 0,
  tests: 0,
  total: 0,
});

const measure = (timings, phase, callback) => {
  const startedAt = now();

  try {
    return callback();
  } finally {
    timings[phase] += Math.round(now() - startedAt);
  }
};

const runProcess = (
  command,
  arguments_,
  {
    allowFailure = false,
    capture = false,
    cwd = repositoryDirectory,
    input,
  } = {},
) => {
  const executable =
    process.platform === 'win32' && command === 'yarn' ? 'yarn.cmd' : command;
  const result = spawnSync(executable, arguments_, {
    cwd,
    env: process.env,
    input,
    encoding: capture || input !== undefined ? 'utf8' : undefined,
    stdio: capture
      ? 'pipe'
      : input === undefined
        ? 'inherit'
        : ['pipe', 'pipe', 'pipe'],
    shell: process.platform === 'win32' && command === 'docker',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (!allowFailure && (result.error || result.status !== 0)) {
    throw (
      result.error ??
      new Error(
        `${command} failed with ${result.status}: ${result.stderr ?? ''}`.trim(),
      )
    );
  }

  return result;
};

const compose = (arguments_, options = {}) =>
  runProcess(
    'docker',
    ['compose', '-p', composeProject, ...composeFiles, ...arguments_],
    { cwd: composeDirectory, ...options },
  );

const execDbSql = (sql) => {
  const result = compose(
    ['exec', '--no-TTY', 'db', 'psql', '-U', PG_USER, '-d', 'postgres', '-tA'],
    { capture: true, input: sql },
  );

  return result.stdout.trim();
};

const getGitOutput = (arguments_) =>
  runProcess('git', arguments_, { capture: true }).stdout.trim();

export const getMercadoPublicoRepositoryState = () => {
  const revision = getGitOutput(['rev-parse', '--short=12', 'HEAD']);

  if (!/^[a-f0-9]{7,40}$/i.test(revision)) {
    throw new Error(`Unsupported Git revision for E2E lifecycle: ${revision}`);
  }

  return {
    revision,
    dirty:
      getGitOutput(['status', '--porcelain', '--untracked-files=all']) !== '',
  };
};

const getTemplateDatabase = (revision) => `mp_e2e_template_v2hb_${revision}`;

const getImageName = (revision) => `twenty-mp-e2e:${revision}`;

const isDockerImagePresent = (imageName) => {
  const result = runProcess('docker', ['image', 'inspect', imageName], {
    allowFailure: true,
    capture: true,
  });

  return result.error === undefined && result.status === 0;
};

export const selectMercadoPublicoServerImageMode = ({ dirty, imageExists }) =>
  !dirty && imageExists ? 'reuse' : 'build';

const isComposeServiceRunning = (service) => {
  const result = runProcess(
    'docker',
    [
      'ps',
      '--quiet',
      '--filter',
      `label=com.docker.compose.project=${composeProject}`,
      '--filter',
      `label=com.docker.compose.service=${service}`,
      '--filter',
      'status=running',
    ],
    { allowFailure: true, capture: true, cwd: composeDirectory },
  );

  return (
    result.error === undefined &&
    result.status === 0 &&
    result.stdout.trim() !== ''
  );
};

const getPublishedServerPort = () => {
  const result = compose(['port', 'server', '3000'], { capture: true });
  const port = result.stdout.trim().match(/:(\d+)$/)?.[1];

  if (port === undefined) {
    throw new Error(`Could not parse E2E server port: ${result.stdout}`);
  }

  return port;
};

const runServerUp = () => {
  const arguments_ = ['up', '--detach', '--no-build', '--wait', 'server'];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = compose(arguments_, { allowFailure: true });

    if (result.error === undefined && result.status === 0) {
      return;
    }

    if (attempt === 1) {
      throw (
        result.error ?? new Error(`docker compose failed with ${result.status}`)
      );
    }
  }
};

const configureFrontendRuntime = (serverPort) => {
  const frontendIndex = readFileSync(frontendBuildIndex, 'utf8');
  const configuredFrontendIndex = frontendIndex.replace(
    /<!-- BEGIN: Twenty Config -->[\s\S]*?<!-- END: Twenty Config -->/,
    `<!-- BEGIN: Twenty Config -->
    <script id="twenty-env-config">
      window._env_ = ${JSON.stringify({
        REACT_APP_SERVER_BASE_URL: `http://localhost:${serverPort}`,
      })};
    </script>
    <!-- END: Twenty Config -->`,
  );

  if (configuredFrontendIndex === frontendIndex) {
    throw new Error('Frontend runtime configuration markers were not found');
  }

  writeFileSync(frontendBuildIndex, configuredFrontendIndex, 'utf8');
};

const readLifecycleState = () => {
  if (!existsSync(lifecycleStatePath)) {
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(lifecycleStatePath, 'utf8'));
  } catch {
    return undefined;
  }
};

const writeLifecycleState = (state) => {
  mkdirSync(dirname(lifecycleStatePath), { recursive: true });
  writeFileSync(
    lifecycleStatePath,
    `${JSON.stringify(state, null, 2)}\n`,
    'utf8',
  );
};

const getAuthStatus = () => {
  const stateNames = ['user', 'operator', 'analyst'];

  return Object.fromEntries(
    stateNames.map((name) => [
      name,
      existsSync(resolve(packageDirectory, `.auth/${name}.json`)),
    ]),
  );
};

export const getMercadoPublicoE2EStatus = () => {
  const repository = getMercadoPublicoRepositoryState();
  const state = readLifecycleState();
  const imageName = getImageName(repository.revision);
  const templateDatabase = getTemplateDatabase(repository.revision);
  const databaseRunning = isComposeServiceRunning('db');
  const serverRunning = isComposeServiceRunning('server');
  const imageExists = isDockerImagePresent(imageName);
  let templateExists = false;

  if (databaseRunning) {
    try {
      templateExists =
        execDbSql(
          `SELECT 1 FROM pg_database WHERE datname = '${templateDatabase}'`,
        ) === '1';
    } catch {
      templateExists = false;
    }
  }

  const compatible = state?.revision === repository.revision;
  const expectedServerUrl =
    compatible && state?.serverPort
      ? `http://localhost:${state.serverPort}`
      : undefined;
  const frontendConfigured =
    expectedServerUrl !== undefined &&
    existsSync(frontendBuildIndex) &&
    readFileSync(frontendBuildIndex, 'utf8').includes(expectedServerUrl);
  const auth = getAuthStatus();
  const prepared =
    compatible &&
    imageExists &&
    templateExists &&
    serverRunning &&
    frontendConfigured;

  return {
    prepared,
    revision: {
      current: repository.revision,
      prepared: state?.revision ?? null,
      compatible,
    },
    dirty: repository.dirty,
    image: { name: imageName, exists: imageExists },
    database: {
      running: databaseRunning,
      template: templateDatabase,
      prepared: templateExists,
    },
    server: {
      running: serverRunning,
      port: compatible ? (state?.serverPort ?? null) : null,
    },
    frontend: {
      exists: existsSync(frontendBuildIndex),
      configured: frontendConfigured,
    },
    auth,
  };
};

export const assertMercadoPublicoE2EPrepared = (status) => {
  if (!status.prepared) {
    throw new Error(
      'Mercado Publico E2E is not prepared for this revision. Run "yarn nx run twenty-e2e-testing:test:mercado-publico:prepare" first.',
    );
  }
};

const emitTimings = (timings) => {
  console.log(
    JSON.stringify({
      event: 'mercado-publico-e2e-timings',
      timingsMs: timings,
    }),
  );
};

export const prepareMercadoPublicoE2E = ({ fresh = false } = {}) => {
  const totalStartedAt = now();
  const timings = createTimings();
  const repository = getMercadoPublicoRepositoryState();
  const templateDatabase = getTemplateDatabase(repository.revision);
  const imageName = getImageName(repository.revision);
  process.env.GIT_SHA = repository.revision;
  process.env.APP_VERSION = process.env.APP_VERSION ?? '0.0.0-e2e';

  console.log(`Preparing isolated Compose project ${composeProject}`);
  console.log(`Source revision: ${repository.revision}`);

  const imageExists = measure(timings, 'image', () =>
    isDockerImagePresent(imageName),
  );
  const imageMode = selectMercadoPublicoServerImageMode({
    dirty: repository.dirty,
    imageExists,
  });

  measure(timings, 'database', () => {
    compose(
      fresh
        ? ['down', '--volumes', '--remove-orphans']
        : ['down', '--remove-orphans'],
      { allowFailure: true },
    );
    compose(['up', '--detach', '--wait', 'db']);
  });

  const hasTemplate = measure(
    timings,
    'database',
    () =>
      execDbSql(
        `SELECT 1 FROM pg_database WHERE datname = '${templateDatabase}'`,
      ) === '1',
  );

  if (imageMode === 'build') {
    console.log(
      repository.dirty
        ? `Checkout is dirty. Rebuilding ${imageName}.`
        : `Image ${imageName} is missing. Building it.`,
    );
    measure(timings, 'image', () => compose(['build', 'server']));
  } else {
    console.log(`Reusing matching image ${imageName}`);
  }

  measure(timings, 'database', () => {
    execDbSql(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PG_DATABASE}' AND pid <> pg_backend_pid();\nDROP DATABASE IF EXISTS ${PG_DATABASE};`,
    );

    if (hasTemplate) {
      console.log(`Restoring baseline from template ${templateDatabase}`);
      execDbSql(`CREATE DATABASE ${PG_DATABASE} TEMPLATE ${templateDatabase};`);
      return;
    }

    const staleTemplates = execDbSql(
      "SELECT datname FROM pg_database WHERE datname LIKE 'mp_e2e_template_%'",
    );
    const dropStatements = staleTemplates
      .split('\n')
      .filter(Boolean)
      .map((name) => `DROP DATABASE IF EXISTS ${name};`)
      .join('\n');

    if (dropStatements !== '') {
      execDbSql(dropStatements);
    }
  });

  measure(timings, 'server', runServerUp);

  if (!hasTemplate) {
    measure(timings, 'database', () => {
      compose([
        'exec',
        '--no-TTY',
        'server',
        'yarn',
        'command:prod',
        'run-instance-commands',
        '--force',
        '--include-slow',
      ]);
      compose([
        'exec',
        '--no-TTY',
        'server',
        'yarn',
        'command:prod',
        'workspace:seed:dev',
        '--light',
      ]);
      compose([
        'exec',
        '--no-TTY',
        'server',
        'yarn',
        'command:prod',
        'mercado-publico:v2:e2e-read-model-seed',
      ]);
      compose(['stop', 'server']);
      execDbSql(`CREATE DATABASE ${templateDatabase} TEMPLATE ${PG_DATABASE};`);
      console.log(`Captured baseline template ${templateDatabase}`);
    });
    measure(timings, 'server', runServerUp);
  }

  const serverPort = getPublishedServerPort();

  measure(timings, 'frontend', () => {
    runProcess('yarn', ['nx', 'build', 'twenty-front']);
    configureFrontendRuntime(serverPort);
  });

  writeLifecycleState({
    fixture: E2E_FIXTURE,
    revision: repository.revision,
    dirtyAtPrepare: repository.dirty,
    image: imageName,
    serverPort,
    preparedAt: new Date().toISOString(),
  });

  timings.total = Math.round(now() - totalStartedAt);
  emitTimings(timings);

  return { status: getMercadoPublicoE2EStatus(), timings };
};

export const resetMercadoPublicoE2E = () => {
  const totalStartedAt = now();
  const timings = createTimings();
  const repository = getMercadoPublicoRepositoryState();
  const state = readLifecycleState();

  if (state?.revision !== repository.revision) {
    throw new Error(
      `Prepared revision ${state?.revision ?? 'none'} is incompatible with current revision ${repository.revision}. Run prepare again.`,
    );
  }

  const templateDatabase = getTemplateDatabase(repository.revision);
  process.env.GIT_SHA = repository.revision;

  measure(timings, 'database', () => {
    compose(['up', '--detach', '--no-build', '--wait', 'db']);

    if (
      execDbSql(
        `SELECT 1 FROM pg_database WHERE datname = '${templateDatabase}'`,
      ) !== '1'
    ) {
      throw new Error(
        `Prepared template ${templateDatabase} is missing. Run prepare again.`,
      );
    }

    compose(['stop', 'server'], { allowFailure: true });
    execDbSql(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PG_DATABASE}' AND pid <> pg_backend_pid();\nDROP DATABASE IF EXISTS ${PG_DATABASE};\nCREATE DATABASE ${PG_DATABASE} TEMPLATE ${templateDatabase};`,
    );
  });
  measure(timings, 'server', runServerUp);

  timings.total = Math.round(now() - totalStartedAt);
  emitTimings(timings);

  return { status: getMercadoPublicoE2EStatus(), timings };
};

const parseLifecycleArguments = (arguments_) => {
  const fixtureIndex = arguments_.indexOf('--fixture');
  const fixture =
    fixtureIndex === -1 ? E2E_FIXTURE : arguments_[fixtureIndex + 1];
  const action =
    arguments_.find(
      (argument, index) =>
        !argument.startsWith('--') && index !== fixtureIndex + 1,
    ) ?? 'prepare';
  const knownArguments = new Set([
    'prepare',
    'status',
    'reset',
    '--fresh',
    '--fixture',
    E2E_FIXTURE,
  ]);
  const unknownArguments = arguments_.filter(
    (argument) => !knownArguments.has(argument),
  );

  if (
    !['prepare', 'status', 'reset'].includes(action) ||
    fixture !== E2E_FIXTURE ||
    unknownArguments.length > 0
  ) {
    throw new Error(
      'Usage: node scripts/provision-mercado-publico-e2e.mjs <prepare|status|reset> [--fresh] [--fixture v2-history-and-buyers]',
    );
  }

  if (action !== 'prepare' && arguments_.includes('--fresh')) {
    throw new Error('--fresh is valid only with prepare');
  }

  return { action, fresh: arguments_.includes('--fresh') };
};

if (process.argv[1] === import.meta.filename) {
  const { action, fresh } = parseLifecycleArguments(process.argv.slice(2));

  if (action === 'prepare') {
    prepareMercadoPublicoE2E({ fresh });
  } else if (action === 'reset') {
    resetMercadoPublicoE2E();
  } else {
    console.log(JSON.stringify(getMercadoPublicoE2EStatus(), null, 2));
  }
}
