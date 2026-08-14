import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const scriptDirectory = import.meta.dirname;
const packageDirectory = resolve(scriptDirectory, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');

export const mercadoPublicoReleaseGateManifest = {
  gates: [
    {
      id: 'lifecycle',
      command:
        'npx jest --config jest-integration.config.ts "v2-durable-sync|v2-golden-path"',
      cwd: resolve(repositoryDirectory, 'packages/twenty-server'),
    },
    {
      id: 'evidence',
      command:
        'npx jest --config jest-integration.config.ts v2-evidence-history-replay',
      cwd: resolve(repositoryDirectory, 'packages/twenty-server'),
    },
    {
      id: 'analytics',
      command:
        'npx playwright test tests/mercado-publico/baseline.spec.ts --project=chrome',
      cwd: packageDirectory,
    },
    {
      id: 'security',
      command:
        'npx playwright test tests/mercado-publico/sync-control.spec.ts --project=operator --project=analyst',
      cwd: packageDirectory,
    },
    {
      id: 'navigation',
      command:
        'npx playwright test tests/mercado-publico/history-and-buyers.spec.ts --project=chrome',
      cwd: packageDirectory,
    },
    {
      id: 'cutover',
      command: 'node scripts/run-mercado-publico-cutover.mjs',
      cwd: packageDirectory,
    },
  ],
};

export const visualBaselineReviewRecord = `# Mercado Publico Visual Baseline Review

- Reviewed at (UTC):
- Reviewer:
- Build revision:
- Evidence path:
- Baseline changed: yes | no
- Decision: approved | rejected
- Reason:
`;

const cloudSmokeInputs = [
  'MERCADO_PUBLICO_CLOUD_SMOKE_URL',
  'MERCADO_PUBLICO_CLOUD_SMOKE_IDENTITY',
  'MERCADO_PUBLICO_CLOUD_SMOKE_AUTHORIZATION',
  'MERCADO_PUBLICO_CLOUD_SMOKE_ALLOWED_DATA',
];

export const getCloudSmokePreconditionError = (environment) => {
  const missingInputs = cloudSmokeInputs.filter((input) => !environment[input]);

  return missingInputs.length === 0
    ? undefined
    : `Cloud smoke requires: ${missingInputs.join(', ')}`;
};

const run = (command, cwd) => {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    stdio: 'inherit',
  });

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`${command} failed with ${result.status}`);
  }
};

const writeVisualReviewRecord = () => {
  const evidenceDirectory = resolve(
    packageDirectory,
    'run_results/release-gate',
  );

  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(
    resolve(evidenceDirectory, 'visual-baseline-review.md'),
    visualBaselineReviewRecord,
    'utf8',
  );
};

if (process.argv[1] === import.meta.filename) {
  const isDryRun = process.argv.includes('--dry-run');
  const requiresCloudSmoke = process.argv.includes('--cloud-smoke');
  const cloudSmokePreconditionError = requiresCloudSmoke
    ? getCloudSmokePreconditionError(process.env)
    : undefined;

  if (cloudSmokePreconditionError !== undefined) {
    throw new Error(cloudSmokePreconditionError);
  }

  if (isDryRun) {
    console.log(
      mercadoPublicoReleaseGateManifest.gates
        .map(({ command, id }) => `${id}: ${command}`)
        .join('\n'),
    );
  } else {
    writeVisualReviewRecord();
    mercadoPublicoReleaseGateManifest.gates.forEach(({ command, cwd }) =>
      run(command, cwd),
    );
  }
}
