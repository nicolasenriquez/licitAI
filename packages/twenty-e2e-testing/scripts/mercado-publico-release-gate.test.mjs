import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const releaseGateRunnerPath = resolve(
  import.meta.dirname,
  'mercado-publico-release-gate.mjs',
);

test('release gate aggregates each owned G1-G4 proof exactly once', async () => {
  assert.ok(
    existsSync(releaseGateRunnerPath),
    'task 2.5 must add the Mercado Publico release-gate runner',
  );

  const { mercadoPublicoReleaseGateManifest } =
    await import('./mercado-publico-release-gate.mjs');

  assert.deepEqual(
    mercadoPublicoReleaseGateManifest.gates.map((gate) => gate.id),
    ['lifecycle', 'evidence', 'analytics', 'security', 'navigation'],
  );
  assert.deepEqual(
    mercadoPublicoReleaseGateManifest.gates.map((gate) => gate.command),
    [
      'npx jest --config jest-integration.config.ts "v2-durable-sync|v2-golden-path"',
      'npx jest --config jest-integration.config.ts v2-evidence-history-replay',
      'npx playwright test tests/mercado-publico/activas-ui-contract.spec.ts --project=chrome',
      'npx playwright test tests/mercado-publico/sync-control.spec.ts --project=operator --project=analyst',
      'npx playwright test tests/mercado-publico/history-and-buyers.spec.ts --project=chrome',
    ],
  );
});

test('release gate blocks cloud smoke without explicit authority inputs', async () => {
  assert.ok(
    existsSync(releaseGateRunnerPath),
    'task 2.5 must add the Mercado Publico release-gate runner',
  );

  const { getCloudSmokePreconditionError } =
    await import('./mercado-publico-release-gate.mjs');

  assert.match(
    getCloudSmokePreconditionError({}),
    /MERCADO_PUBLICO_CLOUD_SMOKE_URL.*MERCADO_PUBLICO_CLOUD_SMOKE_IDENTITY.*MERCADO_PUBLICO_CLOUD_SMOKE_AUTHORIZATION.*MERCADO_PUBLICO_CLOUD_SMOKE_ALLOWED_DATA/s,
  );
  assert.equal(
    getCloudSmokePreconditionError({
      MERCADO_PUBLICO_CLOUD_SMOKE_ALLOWED_DATA: 'fixture-only',
      MERCADO_PUBLICO_CLOUD_SMOKE_AUTHORIZATION: 'approved',
      MERCADO_PUBLICO_CLOUD_SMOKE_IDENTITY: 'release-operator',
      MERCADO_PUBLICO_CLOUD_SMOKE_URL: 'https://example.test',
    }),
    undefined,
  );
});

test('release gate supplies a human visual-baseline review record', async () => {
  const { visualBaselineReviewRecord } =
    await import('./mercado-publico-release-gate.mjs');

  assert.match(
    visualBaselineReviewRecord,
    /Reviewed at \(UTC\):.*Reviewer:.*Build revision:.*Evidence path:.*Baseline changed: yes \| no.*Decision: approved \| rejected.*Reason:/s,
  );
});
