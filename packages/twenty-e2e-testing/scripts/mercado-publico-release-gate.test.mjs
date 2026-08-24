import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mercadoPublicoReleaseGateManifest,
  visualEvidenceReviewRecord,
} from './mercado-publico-release-gate.mjs';

void test('release gate runs backend proof before the E2E aggregate', () => {
  assert.deepEqual(
    mercadoPublicoReleaseGateManifest.gates.map(({ id }) => id),
    ['backend-lifecycle', 'backend-evidence', 'e2e-aggregate'],
  );
  assert.equal(
    mercadoPublicoReleaseGateManifest.gates.at(-1)?.command,
    'node scripts/run-mercado-publico-e2e.mjs all',
  );
});

void test('release gate supplies a human visual evidence record', () => {
  assert.match(
    visualEvidenceReviewRecord,
    /Reviewed at \(UTC\):.*Reviewer:.*Build revision:.*Evidence path:.*Decision: approved \| rejected.*Reason:/s,
  );
  assert.doesNotMatch(visualEvidenceReviewRecord, /Baseline changed/);
});
