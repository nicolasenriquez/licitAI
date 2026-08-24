import assert from 'node:assert/strict';
import test from 'node:test';

import { mercadoPublicoE2ECommands } from './run-mercado-publico-e2e.mjs';

void test('aggregate owns the three Mercado Publico categories exactly once', () => {
  assert.deepEqual(mercadoPublicoE2ECommands, [
    'yarn playwright test --config=playwright.mercado-publico.config.ts tests/mercado-publico/ui-contract',
    'yarn playwright test --config=playwright.mercado-publico.config.ts tests/mercado-publico/journeys',
    'yarn playwright test --config=playwright.mercado-publico.config.ts tests/mercado-publico/roles',
  ]);
});
