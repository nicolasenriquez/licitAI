import assert from 'node:assert/strict';
import test from 'node:test';

import { getCutoverEvidenceDirectory } from './run-mercado-publico-cutover.mjs';

test('uses one retained evidence directory per cutover run', () => {
  const firstDirectory = getCutoverEvidenceDirectory({
    MERCADO_PUBLICO_CUTOVER_RUN_ID: '20260813T192400-enabled',
  });
  const secondDirectory = getCutoverEvidenceDirectory({
    MERCADO_PUBLICO_CUTOVER_RUN_ID: '20260814T192400-enabled',
  });

  assert.notEqual(firstDirectory, secondDirectory);
  assert.match(firstDirectory, /cutover-evidence[\\/]20260813T192400-enabled$/);
});

test('rejects unsafe cutover evidence run IDs', () => {
  assert.throws(
    () =>
      getCutoverEvidenceDirectory({
        MERCADO_PUBLICO_CUTOVER_RUN_ID: '../other-run',
      }),
    /MERCADO_PUBLICO_CUTOVER_RUN_ID must contain only letters, numbers, _ or -/,
  );
});
