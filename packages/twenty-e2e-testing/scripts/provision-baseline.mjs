// Baseline provisioner: disposable env + identities, no versioned secrets.
// Usage: node scripts/provision-baseline.mjs [--flag on|off]
//
// Prereqs (operator-run):
//   1. docker compose up -d (packages/twenty-docker)
//   2. seed the disposable DB: nx run twenty-server:command workspace:seed:dev --args="--light"
//   3. frontend .env.local: VITE_MERCADO_PUBLICO_V2_ENABLED=true (written here with --flag on)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const flagArg = process.argv[2] === '--flag' ? process.argv[3] : undefined;

if (flagArg !== undefined && flagArg !== 'on' && flagArg !== 'off') {
  console.error('Usage: node scripts/provision-baseline.mjs [--flag on|off]');
  process.exit(1);
}

const frontendEnvLocal = resolve(process.cwd(), '../../twenty-front/.env.local');
const flagKey = 'VITE_MERCADO_PUBLICO_V2_ENABLED=';
const flagValue = flagArg ?? 'true';

const readLines = (path) => readFileSync(path, 'utf8').split(/\r?\n/);
const writeLines = (path, lines) =>
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');

const upsertLine = (path, key, value) => {
  const lines = existsSync(path) ? readLines(path) : [];
  const index = lines.findIndex((line) => line.startsWith(key));

  if (index === -1) {
    lines.push(`${key}${value}`);
  } else {
    lines[index] = `${key}${value}`;
  }

  writeLines(path, lines);
};

upsertLine(frontendEnvLocal, flagKey, flagValue);

console.log(`baseline flag ${flagValue === 'true' ? 'ON' : 'OFF'} (${frontendEnvLocal})`);
console.log('');
console.log('Identities (seeded by workspace:seed:dev, passwords via env, never committed):');
console.log('  analista -> jane.austen@apple.dev');
console.log('  operador -> phil.schiler@apple.dev');
console.log('');
console.log('Next:');
console.log('  nx start twenty-front   # rebuild with the flag');
console.log('  npx playwright test tests/mercado-publico/baseline.spec.ts');
