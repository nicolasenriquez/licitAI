import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertMercadoPublicoE2EPrepared,
  selectMercadoPublicoServerImageMode,
} from './provision-mercado-publico-e2e.mjs';
import {
  assertMercadoPublicoReusableAuth,
  buildMercadoPublicoPlaywrightArguments,
  mercadoPublicoE2ECommands,
  parseMercadoPublicoRunnerArguments,
  validateMercadoPublicoTestFile,
} from './run-mercado-publico-e2e.mjs';

void test('aggregate uses one Playwright invocation for all categories', () => {
  assert.equal(mercadoPublicoE2ECommands.length, 1);
  assert.deepEqual(
    buildMercadoPublicoPlaywrightArguments({
      suite: 'all',
      reuseAuth: false,
    }),
    [
      'playwright',
      'test',
      '--config=playwright.mercado-publico.config.ts',
      'tests/mercado-publico/ui-contract',
      'tests/mercado-publico/journeys',
      'tests/mercado-publico/roles',
    ],
  );
});

void test('runner accepts every public suite', () => {
  for (const suite of ['all', 'ui-contract', 'journeys', 'roles', 'extended']) {
    assert.equal(parseMercadoPublicoRunnerArguments([suite]).suite, suite);
  }
});

void test('fast UI excludes extended and extended selects only tagged tests', () => {
  assert.deepEqual(
    buildMercadoPublicoPlaywrightArguments({
      suite: 'ui-contract',
      reuseAuth: false,
    }).slice(-2),
    ['--grep-invert', '@extended'],
  );
  assert.deepEqual(
    buildMercadoPublicoPlaywrightArguments({
      suite: 'extended',
      reuseAuth: false,
    }).slice(-2),
    ['--grep', '@extended'],
  );
});

void test('runner rejects test files outside Mercado Publico', () => {
  assert.throws(
    () => validateMercadoPublicoTestFile('../twenty-server/src/main.ts'),
    /inside tests\/mercado-publico/,
  );
  assert.throws(
    () => validateMercadoPublicoTestFile('tests/login.spec.ts'),
    /inside tests\/mercado-publico/,
  );
});

void test('reuse auth fails with a clear list of missing storage states', () => {
  assert.throws(
    () => assertMercadoPublicoReusableAuth({ suite: 'all' }, () => false),
    /user\.json, operator\.json, analyst\.json.*without --reuse-auth/,
  );
});

void test('prepared mode rejects an unprepared lifecycle', () => {
  assert.throws(
    () => assertMercadoPublicoE2EPrepared({ prepared: false }),
    /test:mercado-publico:prepare/,
  );
});

void test('image selection reuses only a clean matching revision', () => {
  assert.equal(
    selectMercadoPublicoServerImageMode({ dirty: false, imageExists: true }),
    'reuse',
  );
  assert.equal(
    selectMercadoPublicoServerImageMode({ dirty: true, imageExists: true }),
    'build',
  );
  assert.equal(
    selectMercadoPublicoServerImageMode({ dirty: false, imageExists: false }),
    'build',
  );
});
