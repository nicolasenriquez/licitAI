import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { validateReleaseGateEvidence } from './mercado-publico-release-gate.mjs';

test('rejects an incomplete release-gate evidence manifest', () => {
  const evidenceDirectory = mkdtempSync(join(tmpdir(), 'mp-release-gate-'));

  writeFileSync(
    join(evidenceDirectory, 'release-gate-evidence.json'),
    JSON.stringify({ publicationWindows: [] }),
  );

  assert.throws(
    () => validateReleaseGateEvidence(evidenceDirectory),
    /authenticatedParitySmoke/,
  );
});
