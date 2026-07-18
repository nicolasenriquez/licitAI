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
  [
    'diff',
    '--name-only',
    '--relative',
    '--diff-filter=d',
    'main...HEAD',
    '--',
    'src/',
  ],
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
const FILE_PATHS_PER_BATCH = 20;
const changedTypeScriptFilePathBatches = Array.from(
  {
    length: Math.ceil(changedTypeScriptFilePaths.length / FILE_PATHS_PER_BATCH),
  },
  (_, batchIndex) =>
    changedTypeScriptFilePaths.slice(
      batchIndex * FILE_PATHS_PER_BATCH,
      (batchIndex + 1) * FILE_PATHS_PER_BATCH,
    ),
);

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

  return result.status;
};

for (const filePathBatch of changedTypeScriptFilePathBatches) {
  const status = runNpx([
    'oxlint',
    '--type-aware',
    ...(isFixMode ? ['--fix'] : []),
    '-c',
    '.oxlintrc.json',
    ...filePathBatch,
  ]);

  if (status !== 0) {
    process.exit(status ?? 1);
  }
}

if (isFixMode) {
  for (const filePathBatch of changedTypeScriptFilePathBatches) {
    const status = runNpx(['oxfmt', ...filePathBatch]);

    if (status !== 0) {
      process.exit(status ?? 1);
    }
  }

  process.exit(0);
}

for (const filePathBatch of changedTypeScriptFilePathBatches) {
  const status = runNpx(['oxfmt', '--check', ...filePathBatch]);

  if (status !== 0) {
    console.error(
      'ERROR: oxfmt formatting check failed! Fix with: npx nx lint:diff-with-main twenty-server --configuration=fix',
    );
    process.exit(status ?? 1);
  }
}
