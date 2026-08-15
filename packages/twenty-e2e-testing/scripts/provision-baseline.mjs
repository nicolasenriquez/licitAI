// Baseline provisioner: disposable env + identities, no versioned secrets.
// Usage: node scripts/provision-baseline.mjs [--flag on|off] [--fixture name] [--fresh]
//
// This script builds the fixture frontend with process-scoped configuration.
// It never changes frontend or E2E .env files.

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

import {
  getE2EComposePreflightError,
  isolatedE2EComposeProject,
} from './e2e-compose-preflight.mjs';

const flagArg = process.argv[2] === '--flag' ? process.argv[3] : undefined;
const fixtureArg =
  process.argv[4] === '--fixture' ? process.argv[5] : undefined;
const freshArg = process.argv.includes('--fresh');
const e2eFixture = 'v2-history-and-buyers';

if (
  (flagArg !== undefined && flagArg !== 'on' && flagArg !== 'off') ||
  (fixtureArg !== undefined && fixtureArg !== e2eFixture)
) {
  console.error(
    'Usage: node scripts/provision-baseline.mjs [--flag on|off] [--fixture v2-history-and-buyers] [--fresh]',
  );
  process.exit(1);
}

// Anchor to the script location so the script works from any cwd.
const scriptDir = import.meta.dirname;
const repoRoot = resolve(scriptDir, '../../..');
const frontendBuildIndex = resolve(
  scriptDir,
  '../../twenty-front/build/index.html',
);
const flagValue = flagArg === 'off' ? 'false' : 'true';
const composeDir = resolve(scriptDir, '../../twenty-docker');
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

// ponytail: compose defaults (PG_DATABASE_USER/PG_DATABASE_NAME). If the
// twenty-docker .env ever defines them, read them here or fail loudly.
const PG_USER = 'postgres';
const PG_DATABASE = 'default';

const execDbSql = (sql) => {
  const result = spawnSync(
    'docker',
    [
      'compose',
      '-p',
      composeProject,
      ...composeFiles,
      'exec',
      '--no-TTY',
      'db',
      'psql',
      '-U',
      PG_USER,
      '-d',
      'postgres',
      '-tA',
    ],
    { cwd: composeDir, input: sql, encoding: 'utf8' },
  );

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`psql failed: ${result.stderr}`);
  }

  return result.stdout.trim();
};

const run = (args, allowFailure = false) => {
  const result = spawnSync(
    'docker',
    ['compose', '-p', composeProject, ...composeFiles, ...args],
    { cwd: composeDir, stdio: 'inherit', shell: process.platform === 'win32' },
  );

  if (result.error || result.status !== 0) {
    if (allowFailure) {
      return;
    }

    throw (
      result.error ?? new Error(`docker compose failed with ${result.status}`)
    );
  }
};

const getPublishedServerPort = () => {
  const result = spawnSync(
    'docker',
    [
      'compose',
      '-p',
      composeProject,
      ...composeFiles,
      'port',
      'server',
      '3000',
    ],
    { cwd: composeDir, encoding: 'utf8' },
  );

  if (result.error || result.status !== 0) {
    throw (
      result.error ??
      new Error(`Could not read E2E server port: ${result.stderr}`)
    );
  }

  const port = result.stdout.trim().match(/:(\d+)$/)?.[1];

  if (port === undefined) {
    throw new Error(`Could not parse E2E server port: ${result.stdout}`);
  }

  return port;
};

// ponytail: one retry absorbs the compose --wait "No such container"
// recreation race; add backoff if it shows up more than once per provision.
const runServerUp = (extraArgs = []) => {
  const args = ['up', '--detach', ...extraArgs, '--wait', 'server'];

  for (let attempt = 0; ; attempt += 1) {
    const result = spawnSync(
      'docker',
      ['compose', '-p', composeProject, ...composeFiles, ...args],
      {
        cwd: composeDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      },
    );

    if (result.error === undefined && result.status === 0) {
      return;
    }

    if (attempt >= 1) {
      throw (
        result.error ?? new Error(`docker compose failed with ${result.status}`)
      );
    }
  }
};

const isE2EServerRunning = () => {
  const result = spawnSync(
    'docker',
    [
      'ps',
      '--quiet',
      '--filter',
      `label=com.docker.compose.project=${composeProject}`,
      '--filter',
      'label=com.docker.compose.service=server',
      '--filter',
      'status=running',
    ],
    {
      cwd: composeDir,
      encoding: 'utf8',
    },
  );

  if (result.error || result.status !== 0) {
    throw (
      result.error ??
      new Error(`Could not inspect E2E server state: ${result.stderr}`)
    );
  }

  return result.stdout.trim() !== '';
};

if (fixtureArg === e2eFixture) {
  if (flagValue !== 'true') {
    console.error('The V2 fixture requires --flag on');
    process.exit(1);
  }

  const gitShaResult = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const gitSha =
    process.env.GIT_SHA ?? gitShaResult.stdout?.trim() ?? 'local-source';
  process.env.GIT_SHA = gitSha;
  process.env.APP_VERSION = process.env.APP_VERSION ?? '0.0.0-e2e';

  const runningServerError = getE2EComposePreflightError({
    composeProject,
    isServerRunning: isE2EServerRunning(),
  });

  if (runningServerError !== undefined) {
    throw new Error(runningServerError);
  }

  console.log(`Provisioning isolated Compose project ${composeProject}`);
  console.log(`Source revision: ${gitSha}`);

  run(
    freshArg
      ? ['down', '--volumes', '--remove-orphans']
      : ['down', '--remove-orphans'],
    true,
  );
  run(['up', '--detach', '--wait', 'db']);

  const templateDb = `mp_e2e_template_v2hb_${gitSha}`;
  const hasTemplate =
    execDbSql(`SELECT 1 FROM pg_database WHERE datname = '${templateDb}'`) ===
    '1';

  execDbSql(`DROP DATABASE IF EXISTS ${PG_DATABASE};`);

  if (hasTemplate) {
    console.log(`Restoring baseline from template ${templateDb}`);
    execDbSql(`CREATE DATABASE ${PG_DATABASE} TEMPLATE ${templateDb};`);
    runServerUp(['--build']);
  } else {
    const staleTemplates = execDbSql(
      "SELECT datname FROM pg_database WHERE datname LIKE 'mp_e2e_template_%'",
    );
    execDbSql(
      staleTemplates
        .split('\n')
        .filter(Boolean)
        .map((name) => `DROP DATABASE IF EXISTS ${name};`)
        .join('\n'),
    );
    runServerUp(['--build']);
    run([
      'exec',
      '--no-TTY',
      'server',
      'yarn',
      'command:prod',
      'run-instance-commands',
      '--force',
    ]);
    run([
      'exec',
      '--no-TTY',
      'server',
      'yarn',
      'command:prod',
      'workspace:seed:dev',
      '--light',
    ]);
    run([
      'exec',
      '--no-TTY',
      'server',
      'yarn',
      'command:prod',
      'mercado-publico:v2:e2e-fixture',
    ]);
    run(['stop', 'server']);
    execDbSql(`CREATE DATABASE ${templateDb} TEMPLATE ${PG_DATABASE};`);
    console.log(`Captured baseline template ${templateDb}`);
    runServerUp();
  }

  const serverPort = getPublishedServerPort();
  const frontendBuild = spawnSync('yarn', ['nx', 'build', 'twenty-front'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      REACT_APP_MERCADO_PUBLICO_V2_ENABLED: flagValue,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (frontendBuild.error || frontendBuild.status !== 0) {
    throw frontendBuild.error ?? new Error('Frontend build failed');
  }

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
}

console.log(`baseline flag ${flagValue === 'true' ? 'ON' : 'OFF'}`);
console.log('');
console.log('Next:');
console.log('  npx nx run twenty-e2e-testing:test:mercado-publico');

if (fixtureArg === e2eFixture) {
  console.log('');
  console.log('V2 fixture:');
  console.log(
    "  $env:REACT_APP_MERCADO_PUBLICO_V2_ENABLED = 'true'; npx playwright test tests/mercado-publico/history-and-buyers.spec.ts --project=chrome",
  );
}
