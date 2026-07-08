import { execFileSync, spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url));
const packageRootPath = dirname(currentDirectoryPath);
const isFixMode = process.argv.includes('--fix');
const isWindows = process.platform === 'win32';
const npxExecutableName = isWindows ? 'npx.cmd' : 'npx';

const changedFilesOutput = execFileSync(
  'git',
  ['diff', '--name-only', '--relative', '--diff-filter=d', 'main...HEAD', '--', 'src/'],
  {
    cwd: packageRootPath,
    encoding: 'utf8',
  },
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

const runNpx = (argumentsList) => {
  const result = spawnSync(npxExecutableName, argumentsList, {
    cwd: packageRootPath,
    shell: isWindows,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

runNpx([
  'oxlint',
  '--type-aware',
  ...(isFixMode ? ['--fix'] : []),
  '-c',
  '.oxlintrc.json',
  ...changedTypeScriptFilePaths,
]);

if (isFixMode) {
  runNpx(['oxfmt', ...changedTypeScriptFilePaths]);
  process.exit(0);
}

const oxfmtResult = spawnSync(
  npxExecutableName,
  ['oxfmt', '--check', ...changedTypeScriptFilePaths],
  {
    cwd: packageRootPath,
    shell: isWindows,
    stdio: 'inherit',
  },
);

if (oxfmtResult.status !== 0) {
  console.error(
    'ERROR: oxfmt formatting check failed! Fix with: npx nx lint:diff-with-main twenty-server --configuration=fix',
  );
  process.exit(oxfmtResult.status ?? 1);
}
