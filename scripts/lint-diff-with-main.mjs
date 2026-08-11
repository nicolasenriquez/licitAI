import { execFileSync, spawnSync } from 'node:child_process';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRootPath = dirname(dirname(fileURLToPath(import.meta.url)));
const projectRootPath = resolve(workspaceRootPath, process.argv[2] ?? '');
const projectName = basename(projectRootPath);
const isFixMode = process.argv.includes('--fix');
const oxlintEntryPoint = resolve(
  workspaceRootPath,
  'node_modules/oxlint/bin/oxlint',
);
const oxfmtEntryPoint = resolve(
  workspaceRootPath,
  'node_modules/oxfmt/bin/oxfmt',
);

const changedFilesOutput = execFileSync(
  'git',
  [
    'diff',
    '--name-only',
    '--relative',
    '--diff-filter=d',
    'main...HEAD',
    '--',
    'src/',
  ],
  { cwd: projectRootPath, encoding: 'utf8' },
);

const changedTypeScriptFilePaths = changedFilesOutput
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter((line) => line.length > 0)
  .filter((line) => /\.(ts|tsx)$/u.test(line));

if (changedTypeScriptFilePaths.length === 0) {
  console.log('No changed files.');
  process.exit(0);
}

const runNode = (entryPoint, argumentsList) => {
  const result = spawnSync(process.execPath, [entryPoint, ...argumentsList], {
    cwd: projectRootPath,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

runNode(oxlintEntryPoint, [
  '--type-aware',
  ...(isFixMode ? ['--fix'] : []),
  '-c',
  '.oxlintrc.json',
  ...changedTypeScriptFilePaths,
]);

if (isFixMode) {
  runNode(oxfmtEntryPoint, changedTypeScriptFilePaths);
  process.exit(0);
}

const oxfmtResult = spawnSync(
  process.execPath,
  [oxfmtEntryPoint, '--check', ...changedTypeScriptFilePaths],
  { cwd: projectRootPath, stdio: 'inherit' },
);

if (oxfmtResult.status !== 0) {
  console.error(
    `ERROR: oxfmt formatting check failed! Fix with: npx nx lint:diff-with-main ${projectName} --configuration=fix`,
  );
  process.exit(oxfmtResult.status ?? 1);
}
