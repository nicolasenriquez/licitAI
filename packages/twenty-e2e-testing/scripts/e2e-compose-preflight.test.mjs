import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getE2EComposePreflightError,
  isolatedE2EComposeProject,
} from './e2e-compose-preflight.mjs';

test('rejects the canonical Compose project before Docker commands run', () => {
  assert.match(
    getE2EComposePreflightError({
      composeProject: 'twenty',
      isServerRunning: false,
    }),
    /only supports twenty-mp-e2e/,
  );
});

test('rejects every project other than the isolated E2E project', () => {
  assert.match(
    getE2EComposePreflightError({
      composeProject: 'another-project',
      isServerRunning: false,
    }),
    /only supports twenty-mp-e2e/,
  );
});

test('rejects cleanup while the isolated E2E server is running', () => {
  assert.match(
    getE2EComposePreflightError({
      composeProject: isolatedE2EComposeProject,
      isServerRunning: true,
    }),
    /down --volumes --remove-orphans/,
  );
});

test('allows a stopped isolated E2E project', () => {
  assert.equal(
    getE2EComposePreflightError({
      composeProject: isolatedE2EComposeProject,
      isServerRunning: false,
    }),
    undefined,
  );
});
