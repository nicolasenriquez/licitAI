import { mkdirSync, writeFileSync } from 'node:fs';
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

export const visualEvidenceReviewRecord = `# Mercado Publico Visual Evidence Review

- Reviewed at (UTC):
- Reviewer:
- Build revision:
- Evidence path:
- Decision: approved | rejected
- Reason:
`;

const run = (command, cwd) => {
  const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });

  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`${command} failed with ${result.status}`);
  }
};

const writeVisualEvidenceRecord = () => {
  const evidenceDirectory = resolve(
    packageDirectory,
    'run_results/release-gate',
  );
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(
    resolve(evidenceDirectory, 'visual-evidence-review.md'),
    visualEvidenceReviewRecord,
    'utf8',
  );
};

if (process.argv[1] === import.meta.filename) {
  if (process.argv.includes('--dry-run')) {
    console.log(
      mercadoPublicoReleaseGateManifest.gates
        .map(({ command, id }) => `${id}: ${command}`)
        .join('\n'),
    );
  } else {
    writeVisualEvidenceRecord();
    mercadoPublicoReleaseGateManifest.gates.forEach(({ command, cwd }) =>
      run(command, cwd),
    );
  }
}
