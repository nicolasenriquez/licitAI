import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const packageDirectory = resolve(import.meta.dirname, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');

export const mercadoPublicoReleaseGateManifest = {
  gates: [
    {
      id: 'backend-lifecycle',
      command:
        'yarn jest --config jest-integration.config.ts "v2-durable-sync|v2-golden-path"',
      cwd: resolve(repositoryDirectory, 'packages/twenty-server'),
    },
    {
      id: 'backend-evidence',
      command:
        'yarn jest --config jest-integration.config.ts v2-evidence-history-replay',
      cwd: resolve(repositoryDirectory, 'packages/twenty-server'),
    },
    {
      id: 'e2e-aggregate',
      command: 'node scripts/run-mercado-publico-e2e.mjs all',
      cwd: packageDirectory,
    },
  ],
};

const run = (command, cwd) => {
  const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`${command} failed with ${result.status}`);
  }
};

const assertEvidenceFile = (evidenceDirectory, evidencePath) => {
  if (
    typeof evidencePath !== 'string' ||
    evidencePath.length === 0 ||
    !existsSync(resolve(evidenceDirectory, evidencePath))
  ) {
    throw new Error(`Missing release-gate evidence file: ${evidencePath}`);
  }
};

export const validateReleaseGateEvidence = (evidenceDirectory) => {
  const manifestPath = resolve(evidenceDirectory, 'release-gate-evidence.json');

  if (!existsSync(manifestPath)) {
    throw new Error(`Missing release-gate evidence manifest: ${manifestPath}`);
  }

  const evidence = JSON.parse(readFileSync(manifestPath, 'utf8'));

  for (const key of [
    'authenticatedParitySmoke',
    'localHarness',
    'rollbackDemonstration',
  ]) {
    const record = evidence[key];

    if (record?.passed !== true) {
      throw new Error(`Incomplete release-gate evidence: ${key}`);
    }
    assertEvidenceFile(evidenceDirectory, record.evidencePath);
  }

  const expectedWindows = ['2026-08-12', '2026-08-13'];

  for (const date of expectedWindows) {
    const record = evidence.publicationWindows?.find(
      (window) => window.date === date,
    );

    if (
      record?.complete !== true ||
      record.requestedPageSize !== 50 ||
      record.cohortRecorded !== true ||
      record.checkpointRecorded !== true ||
      record.projectionRecorded !== true ||
      record.watermarkRecorded !== true
    ) {
      throw new Error(`Incomplete publication-window evidence: ${date}`);
    }
    assertEvidenceFile(evidenceDirectory, record.evidencePath);
  }

  if (
    evidence.visualReview?.decision !== 'approved' ||
    typeof evidence.visualReview.reviewer !== 'string' ||
    evidence.visualReview.reviewer.trim() === ''
  ) {
    throw new Error('Human visual-evidence approval is required');
  }
  assertEvidenceFile(evidenceDirectory, evidence.visualReview.evidencePath);
};

if (process.argv[1] === import.meta.filename) {
  if (process.argv.includes('--dry-run')) {
    console.log(
      mercadoPublicoReleaseGateManifest.gates
        .map(({ command, id }) => `${id}: ${command}`)
        .join('\n'),
    );
  } else {
    mercadoPublicoReleaseGateManifest.gates.forEach(({ command, cwd }) =>
      run(command, cwd),
    );
    if (!process.argv.includes('--automated-only')) {
      validateReleaseGateEvidence(
        resolve(packageDirectory, 'run_results/release-gate'),
      );
    }
  }
}
