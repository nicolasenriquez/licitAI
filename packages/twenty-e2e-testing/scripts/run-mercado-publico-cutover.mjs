import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

import {
  getE2EComposePreflightError,
  isolatedE2EComposeProject,
} from './e2e-compose-preflight.mjs';

export const mercadoPublicoCutoverPhases = [
  { flag: 'true', name: 'enabled' },
  { flag: 'false', name: 'disabled' },
  { flag: 'true', name: 'reenabled' },
];

const scriptDirectory = import.meta.dirname;
const packageDirectory = resolve(scriptDirectory, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');
const composeDirectory = resolve(packageDirectory, '../twenty-docker');
const frontendBuildIndex = resolve(
  packageDirectory,
  '../twenty-front/build/index.html',
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
const isDryRun = process.argv.includes('--dry-run');

export const getCutoverEvidenceDirectory = (environment, now = new Date()) => {
  const runId =
    environment.MERCADO_PUBLICO_CUTOVER_RUN_ID ??
    now.toISOString().replace(/[:.]/g, '-');

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(runId)) {
    throw new Error(
      'MERCADO_PUBLICO_CUTOVER_RUN_ID must contain only letters, numbers, _ or -',
    );
  }

  return resolve(packageDirectory, 'run_results/cutover-evidence', runId);
};

const evidenceDirectory = getCutoverEvidenceDirectory(process.env);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
    ...options,
  });

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`${command} failed with ${result.status}`);
  }
};

const runCompose = (args, options) =>
  run('docker', ['compose', '-p', composeProject, ...composeFiles, ...args], {
    cwd: composeDirectory,
    ...options,
  });

const getServerPort = () => {
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
    { cwd: composeDirectory, encoding: 'utf8' },
  );
  const port = result.stdout?.trim().match(/:(\d+)$/)?.[1];

  if (result.error || result.status !== 0 || port === undefined) {
    throw result.error ?? new Error('Could not read isolated E2E server port');
  }

  return port;
};

const writeDeploymentEvidence = (phase) => {
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repositoryDirectory,
    encoding: 'utf8',
  }).stdout.trim();
  const image = spawnSync(
    'docker',
    [
      'compose',
      '-p',
      composeProject,
      ...composeFiles,
      'images',
      '--format',
      '{{.ID}}',
      'server',
    ],
    { cwd: composeDirectory, encoding: 'utf8' },
  ).stdout.trim();

  writeFileSync(
    resolve(evidenceDirectory, `${phase.name}-deployment.txt`),
    [
      `phase=${phase.name}`,
      `build_flag=${phase.flag}`,
      `revision=${revision}`,
      `image=${image}`,
      `deployed_at=${new Date().toISOString()}`,
    ].join('\n'),
  );
};

const captureState = (name) => {
  const stateQuery = `
    BEGIN TRANSACTION READ ONLY;
    SELECT jsonb_pretty(jsonb_build_object(
      'sync_runs', COALESCE((SELECT jsonb_agg(to_jsonb(run) ORDER BY run.created_at) FROM (
        SELECT id, status, source, scope, records_discovered, records_hydrated,
          records_failed, records_projected, pages_checkpointed, watermark_before,
          watermark_after, created_at, updated_at, finished_at
        FROM mp.sync_run WHERE source = 'api-v2-compra-agil'
      ) run), '[]'::jsonb),
      'commands', COALESCE((SELECT jsonb_agg(to_jsonb(command) ORDER BY command.created_at) FROM (
        SELECT id, action, state, sync_run_id, dispatch_attempts, created_at,
          updated_at, finished_at
        FROM mp.sync_command
      ) command), '[]'::jsonb),
      'attempts', COALESCE((SELECT jsonb_agg(to_jsonb(attempt) ORDER BY attempt.started_at) FROM (
        SELECT id, state, attempt_number, sync_run_id, sync_command_id,
          started_at, heartbeat_at, finished_at
        FROM mp.sync_run_attempt
      ) attempt), '[]'::jsonb),
      'audit', COALESCE((SELECT jsonb_agg(to_jsonb(audit) ORDER BY audit.created_at) FROM (
        SELECT id, event_type, sync_run_id, sync_command_id, sync_run_attempt_id,
          created_at
        FROM mp.sync_run_audit
      ) audit), '[]'::jsonb),
      'observations', COALESCE((SELECT jsonb_agg(to_jsonb(observation) ORDER BY observation.id) FROM (
        SELECT id, codigo, semantic_fingerprint, created_at
        FROM mp.v2_observation
      ) observation), '[]'::jsonb),
      'history', COALESCE((SELECT jsonb_agg(to_jsonb(history) ORDER BY history.id) FROM (
        SELECT id, codigo, created_at FROM mp.v2_history
      ) history), '[]'::jsonb),
      'cohorts', COALESCE((SELECT jsonb_agg(to_jsonb(cohort) ORDER BY cohort.id) FROM (
        SELECT id, codigo, status, lifecycle_reason, created_at, updated_at
        FROM mp.v2_cohort
      ) cohort), '[]'::jsonb),
      'watermarks', COALESCE((SELECT jsonb_agg(to_jsonb(watermark) ORDER BY watermark.source, watermark.scope) FROM (
        SELECT source, scope, watermark_at, updated_at FROM mp.source_watermark
      ) watermark), '[]'::jsonb),
      'projections', COALESCE((SELECT jsonb_agg(to_jsonb(projection) ORDER BY projection.process_type, projection.process_code) FROM (
        SELECT process_type, process_code, observation_id, last_seen_at
        FROM mp.gold_detected_process
      ) projection), '[]'::jsonb)
    ));
    COMMIT;
  `;
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
      'postgres',
      '-d',
      'default',
      '-tA',
    ],
    { cwd: composeDirectory, input: stateQuery, encoding: 'utf8' },
  );

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`State capture failed: ${result.stderr}`);
  }

  writeFileSync(
    resolve(evidenceDirectory, `${name}-state.json`),
    result.stdout,
  );
};

const assertStateUnchanged = (before, after) => {
  const beforeState = readFileSync(
    resolve(evidenceDirectory, `${before}-state.json`),
    'utf8',
  );
  const afterState = readFileSync(
    resolve(evidenceDirectory, `${after}-state.json`),
    'utf8',
  );

  if (beforeState !== afterState) {
    throw new Error(`Durable evidence changed between ${before} and ${after}`);
  }
};

const buildFrontend = (phase) => {
  run('yarn', ['nx', 'build', 'twenty-front'], {
    cwd: repositoryDirectory,
    env: {
      ...process.env,
      REACT_APP_MERCADO_PUBLICO_V2_ENABLED: phase.flag,
    },
  });

  const frontendIndex = readFileSync(frontendBuildIndex, 'utf8');
  const configuredFrontendIndex = frontendIndex.replace(
    /<!-- BEGIN: Twenty Config -->[\s\S]*?<!-- END: Twenty Config -->/,
    `<!-- BEGIN: Twenty Config -->
    <script id="twenty-env-config">
      window._env_ = ${JSON.stringify({
        REACT_APP_SERVER_BASE_URL: `http://localhost:${getServerPort()}`,
      })};
    </script>
    <!-- END: Twenty Config -->`,
  );

  if (configuredFrontendIndex === frontendIndex) {
    throw new Error('Frontend runtime configuration markers were not found');
  }

  writeFileSync(frontendBuildIndex, configuredFrontendIndex, 'utf8');
};

const runPhase = (phase) => {
  buildFrontend(phase);
  writeDeploymentEvidence(phase);
  run(
    'yarn',
    [
      'playwright',
      'test',
      'tests/mercado-publico/cutover-route-matrix.spec.ts',
      '--config=playwright.mercado-publico.config.ts',
      '--project=chrome',
      '--grep',
      `${phase.name} deployment`,
      '--output',
      resolve(evidenceDirectory, phase.name, 'playwright'),
    ],
    {
      cwd: packageDirectory,
      env: {
        ...process.env,
        MERCADO_PUBLICO_V2_CUTOVER_PHASE: phase.name,
        MERCADO_PUBLICO_V2_KEEP_E2E_ENV: 'true',
        REACT_APP_MERCADO_PUBLICO_V2_ENABLED: phase.flag,
      },
    },
  );
};

if (import.meta.main) {
  const preflightError = getE2EComposePreflightError({
    composeProject,
    isServerRunning: false,
  });

  if (preflightError !== undefined) {
    throw new Error(preflightError);
  }

  if (isDryRun) {
    console.log(
      `Would provision ${composeProject} once, then run ${mercadoPublicoCutoverPhases.map((phase) => phase.name).join(', ')} without changing durable state.`,
    );
  } else {
    mkdirSync(evidenceDirectory, { recursive: true });
    let isolatedEnvironmentProvisioned = false;

    try {
      run(
        'node',
        [
          'scripts/provision-baseline.mjs',
          '--flag',
          'on',
          '--fixture',
          'v2-history-and-buyers',
        ],
        {
          cwd: packageDirectory,
        },
      );
      isolatedEnvironmentProvisioned = true;
      captureState('before');
      runPhase(mercadoPublicoCutoverPhases[0]);
      runPhase(mercadoPublicoCutoverPhases[1]);
      captureState('after-disabled');
      assertStateUnchanged('before', 'after-disabled');
      runPhase(mercadoPublicoCutoverPhases[2]);
      captureState('after-reenabled');
      assertStateUnchanged('before', 'after-reenabled');
    } finally {
      if (isolatedEnvironmentProvisioned) {
        runCompose(['down', '--remove-orphans']);
      }
    }
  }
}
