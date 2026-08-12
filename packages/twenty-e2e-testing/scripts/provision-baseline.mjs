// Baseline provisioner: disposable env + identities, no versioned secrets.
// Usage: node scripts/provision-baseline.mjs [--flag on|off] [--fixture name]
//
// This script writes REACT_APP_MERCADO_PUBLICO_V2_ENABLED to the frontend
//      .env.local AND the e2e .env (the Playwright spec reads it from
//      process.env via the dotenv config in playwright.config.ts)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import process from 'node:process';

const flagArg = process.argv[2] === '--flag' ? process.argv[3] : undefined;
const fixtureArg =
  process.argv[4] === '--fixture' ? process.argv[5] : undefined;
const e2eFixture = 'v2-history-and-buyers';

if (
  (flagArg !== undefined && flagArg !== 'on' && flagArg !== 'off') ||
  (fixtureArg !== undefined && fixtureArg !== e2eFixture)
) {
  console.error(
    'Usage: node scripts/provision-baseline.mjs [--flag on|off] [--fixture v2-history-and-buyers]',
  );
  process.exit(1);
}

// Anchor to the script location so the script works from any cwd.
const scriptDir = import.meta.dirname;
const repoRoot = resolve(scriptDir, '../../..');
const frontendEnvLocal = resolve(scriptDir, '../../twenty-front/.env.local');
const frontendBuildIndex = resolve(
  scriptDir,
  '../../twenty-front/build/index.html',
);
const e2eEnv = resolve(scriptDir, '../.env');
const flagKey = 'REACT_APP_MERCADO_PUBLICO_V2_ENABLED=';
const flagValue = flagArg === 'off' ? 'false' : 'true';
const composeDir = resolve(scriptDir, '../../twenty-docker');
const composeFiles = [
  '-f',
  'docker-compose.yml',
  '-f',
  'docker-compose.e2e.yml',
];
const composeProject =
  process.env.MERCADO_PUBLICO_V2_E2E_COMPOSE_PROJECT ?? 'twenty-mp-e2e';

const findAvailablePort = (preferredPort) =>
  new Promise((resolvePort, reject) => {
    const server = createServer();

    server.once('error', reject);
    server.listen(preferredPort, '0.0.0.0', () => {
      const address = server.address();
      const port =
        typeof address === 'object' && address !== null ? address.port : null;

      server.close(() => {
        if (port === null) {
          reject(new Error('Could not determine E2E server port'));
        } else {
          resolvePort(String(port));
        }
      });
    });
  });

const configuredServerPort = process.env.MERCADO_PUBLICO_V2_E2E_SERVER_PORT;
const serverPort = configuredServerPort ?? (await findAvailablePort(0));
process.env.MERCADO_PUBLICO_V2_E2E_SERVER_PORT = serverPort;

const readLines = (path) => readFileSync(path, 'utf8').split(/\r?\n/);
const writeLines = (path, lines) =>
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');

const upsertLine = (path, key, value) => {
  const lines = existsSync(path) ? readLines(path) : [];
  const index = lines.findIndex((line) => line.startsWith(key));

  if (index === -1) {
    lines.push(`${key}${value}`);
  } else {
    lines[index] = `${key}${value}`;
  }

  writeLines(path, lines);
};

upsertLine(frontendEnvLocal, flagKey, flagValue);
upsertLine(e2eEnv, flagKey, flagValue);
upsertLine(
  frontendEnvLocal,
  'REACT_APP_SERVER_BASE_URL=',
  `http://localhost:${serverPort}`,
);
upsertLine(e2eEnv, 'MERCADO_PUBLICO_V2_E2E_CODIGO=', 'FIXTURE-CA-001');
upsertLine(e2eEnv, 'MERCADO_PUBLICO_V2_E2E_BUYER_CODE=', '60.000.000-0');

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

  console.log(`Provisioning isolated Compose project ${composeProject}`);
  console.log(`Source revision: ${gitSha}`);
  const frontendBuild = spawnSync('yarn', ['nx', 'build', 'twenty-front'], {
    cwd: repoRoot,
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

  run(['down', '--volumes', '--remove-orphans'], true);
  run(['up', '--detach', '--build', '--wait', 'server']);
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
}

console.log(`baseline flag ${flagValue === 'true' ? 'ON' : 'OFF'}`);
console.log(`  frontend: ${frontendEnvLocal}`);
console.log(`  e2e:      ${e2eEnv}`);
console.log('');
console.log('Identities (seeded by workspace:seed:dev --light):');
console.log('  analista -> jane.austen@apple.dev');
console.log('  operador -> phil.schiler@apple.dev');
console.log(
  '  password -> tim@apple.dev (dev-seed bcrypt hash, local disposable env only)',
);
console.log('');
console.log('Next:');
console.log('  nx start twenty-front   # rebuild with the flag');
console.log('  npx playwright test tests/mercado-publico/baseline.spec.ts');

if (fixtureArg === e2eFixture) {
  console.log('');
  console.log('V2 fixture:');
  console.log(
    '  npx playwright test tests/mercado-publico/history-and-buyers.spec.ts --project=chrome',
  );
}
