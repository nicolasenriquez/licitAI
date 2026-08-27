import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../../../..');
const isDryRun = process.argv.includes('--dry-run');

const leafTargets = [
  ['gate', 'ci-gate'],
  ['server-static', 'ci-server-lint'],
  ['front-static', 'ci-front-lint'],
  ['front-types', 'ci-front-typecheck'],
  ['shared', 'ci-shared'],
  ['ui', 'ci-ui'],
  ['sdk', 'ci-sdk'],
  ['docs', 'ci-docs'],
  ['server-build', 'ci-server-build'],
  ['front-build', 'ci-front-build'],
  ['server-tests', 'ci-server-test'],
  ['front-tests', 'ci-front-test'],
];

const isolatedChecks = {
  'ci-server-lint': [
    ['server-lint', ['npx', 'nx', 'lint:diff-with-main', 'twenty-server']],
    ['server-types', ['npx', 'nx', 'typecheck', 'twenty-server']],
  ],
  'ci-front-lint': [
    ['front-lint', ['npx', 'nx', 'lint:diff-with-main', 'twenty-front']],
  ],
  'ci-front-typecheck': [
    ['front-types', ['npx', 'nx', 'typecheck', 'twenty-front']],
  ],
  'ci-shared': [
    ['shared-lint', ['npx', 'nx', 'lint', 'twenty-shared']],
    ['shared-types', ['npx', 'nx', 'typecheck', 'twenty-shared']],
    ['shared-tests', ['npx', 'nx', 'test', 'twenty-shared']],
  ],
  'ci-ui': [
    ['ui-lint', ['npx', 'nx', 'lint', 'twenty-ui']],
    ['ui-types', ['npx', 'nx', 'typecheck', 'twenty-ui']],
    ['ui-tests', ['npx', 'nx', 'test', 'twenty-ui']],
  ],
  'ci-sdk': [
    ['sdk-lint', ['npx', 'nx', 'lint', 'twenty-sdk']],
    ['sdk-types', ['npx', 'nx', 'typecheck', 'twenty-sdk']],
    ['sdk-tests', ['npx', 'nx', 'run', 'twenty-sdk:test:unit']],
  ],
  'ci-server-build': [
    ['server-build', ['npx', 'nx', 'build', 'twenty-server']],
  ],
  'ci-front-build': [['front-build', ['npx', 'nx', 'build', 'twenty-front']]],
  'ci-server-test': [['server-tests', ['npx', 'nx', 'test', 'twenty-server']]],
  'ci-front-test': [['front-tests', ['npx', 'nx', 'test', 'twenty-front']]],
};

const commandText = (command, argumentsList) =>
  [command, ...argumentsList].join(' ');

const commandInvocation = (command) => {
  if (process.platform !== 'win32') {
    return { executable: command, argumentsPrefix: [] };
  }

  if (command === 'npx') {
    const npxCliPath = join(
      dirname(process.execPath),
      'node_modules',
      'npm',
      'bin',
      'npx-cli.js',
    );

    if (existsSync(npxCliPath)) {
      return {
        executable: process.execPath,
        argumentsPrefix: [npxCliPath],
      };
    }
  }

  const windowsExecutables = {
    git: 'git.exe',
    just: 'just.exe',
    npx: 'npx.cmd',
  };

  return {
    executable: windowsExecutables[command] ?? command,
    argumentsPrefix: [],
  };
};

const runGit = (argumentsList) => {
  const { executable, argumentsPrefix } = commandInvocation('git');
  const result = spawnSync(executable, [...argumentsPrefix, ...argumentsList], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: false,
  });

  return result.status === 0
    ? (result.stdout ?? '')
        .split(/\r?\n/u)
        .filter((filePath) => filePath.length > 0)
    : [];
};

const workingTreeFiles = [
  ...runGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD']),
  ...runGit(['ls-files', '--others', '--exclude-standard']),
].filter((filePath, index, filePaths) => filePaths.indexOf(filePath) === index);

const workingTreeSourceFiles = workingTreeFiles.filter((filePath) =>
  /\.(cjs|js|mjs|jsx|ts|tsx)$/u.test(filePath),
);

const lintSourceFilesByConfigDirectory = new Map();
const unscopedSourceFiles = [];

const findNearestOxlintConfigDirectory = (filePath) => {
  let directory = resolve(repositoryRoot, dirname(filePath));

  while (true) {
    if (existsSync(join(directory, '.oxlintrc.json'))) {
      return directory;
    }

    if (directory === repositoryRoot) {
      return null;
    }

    const parentDirectory = dirname(directory);

    if (parentDirectory === directory) {
      return null;
    }

    directory = parentDirectory;
  }
};

for (const filePath of workingTreeSourceFiles) {
  const configDirectory = findNearestOxlintConfigDirectory(filePath);

  if (configDirectory === null) {
    unscopedSourceFiles.push(filePath);
    continue;
  }

  const files = lintSourceFilesByConfigDirectory.get(configDirectory) ?? [];
  files.push(filePath);
  lintSourceFilesByConfigDirectory.set(configDirectory, files);
}

if (isDryRun) {
  console.log('safe-ci-prepush command order:');
  console.log('1. just ci-prepush');

  leafTargets.forEach(([stage, target], index) => {
    console.log(`${index + 2}. just ${target} (${stage})`);

    for (const [isolatedStage, argumentsList] of isolatedChecks[target] ?? []) {
      console.log(
        `  ${commandText(argumentsList[0], argumentsList.slice(1))} (${isolatedStage}, on parent failure)`,
      );
    }
  });

  if (workingTreeSourceFiles.length > 0) {
    for (const [
      configDirectory,
      filePaths,
    ] of lintSourceFilesByConfigDirectory) {
      const relativeFiles = filePaths.map((filePath) =>
        relative(configDirectory, resolve(repositoryRoot, filePath)).replaceAll(
          '\\',
          '/',
        ),
      );
      console.log(
        `working-tree checks: npx oxlint --type-aware -c .oxlintrc.json ${relativeFiles.join(' ')} (cwd ${relative(repositoryRoot, configDirectory).replaceAll('\\', '/')})`,
      );
    }
    console.log(
      `working-tree checks: npx oxfmt --check ${workingTreeSourceFiles.join(' ')}`,
    );

    if (unscopedSourceFiles.length > 0) {
      console.log(
        `working-tree lint skipped for files without an ancestor .oxlintrc.json: ${unscopedSourceFiles.join(' ')}`,
      );
    }
  }

  process.exit(0);
}

const logDirectory = join(
  tmpdir(),
  `safe-ci-prepush-${Date.now()}-${process.pid}`,
);
mkdirSync(logDirectory, { recursive: true });

const results = [];

const runCommand = (
  stage,
  command,
  argumentsList,
  sequence,
  workingDirectory = repositoryRoot,
) => {
  const { executable, argumentsPrefix } = commandInvocation(command);
  const result = spawnSync(executable, [...argumentsPrefix, ...argumentsList], {
    cwd: workingDirectory,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    shell: false,
  });
  const output = [
    result.stdout ?? '',
    result.stderr ?? '',
    result.error ? `${result.error.message}\n` : '',
  ].join('');
  const logPath = join(
    logDirectory,
    `${String(sequence).padStart(2, '0')}-${stage}.log`,
  );

  writeFileSync(logPath, output, 'utf8');

  const exitCode = result.status ?? 1;
  const entry = {
    stage,
    command: commandText(command, argumentsList),
    exitCode,
    logPath,
    workingDirectory,
  };

  results.push(entry);
  console.log(
    `[safe-ci-prepush] ${exitCode === 0 ? 'PASS' : 'FAIL'} ${stage} exit=${exitCode} log=${logPath}`,
  );

  return entry;
};

console.log(`[safe-ci-prepush] repository=${repositoryRoot}`);
console.log(`[safe-ci-prepush] log-directory=${logDirectory}`);
console.log(
  `[safe-ci-prepush] working-tree-source-files=${workingTreeSourceFiles.length}`,
);

const aggregateResult = runCommand('aggregate', 'just', ['ci-prepush'], 1);
let sequence = 2;

for (const [configDirectory, filePaths] of lintSourceFilesByConfigDirectory) {
  const relativeFiles = filePaths.map((filePath) =>
    relative(configDirectory, resolve(repositoryRoot, filePath)).replaceAll(
      '\\',
      '/',
    ),
  );

  runCommand(
    `working-tree-lint-${relative(repositoryRoot, configDirectory).replaceAll('\\', '-')}`,
    'npx',
    ['oxlint', '--type-aware', '-c', '.oxlintrc.json', ...relativeFiles],
    sequence,
    configDirectory,
  );
  sequence += 1;
}

if (workingTreeSourceFiles.length > 0) {
  runCommand(
    'working-tree-format',
    'npx',
    ['oxfmt', '--check', ...workingTreeSourceFiles],
    sequence,
  );
  sequence += 1;
}

const hasWorkingTreeFailure = results.some(
  ({ stage, exitCode }) => stage.startsWith('working-tree-') && exitCode !== 0,
);

if (aggregateResult.exitCode !== 0 || hasWorkingTreeFailure) {
  for (const [stage, target] of leafTargets) {
    const targetResult = runCommand(stage, 'just', [target], sequence);
    sequence += 1;

    if (targetResult.exitCode !== 0) {
      for (const [isolatedStage, argumentsList] of isolatedChecks[target] ??
        []) {
        runCommand(
          isolatedStage,
          argumentsList[0],
          argumentsList.slice(1),
          sequence,
        );
        sequence += 1;
      }
    }
  }
}

const reportPath = join(logDirectory, 'report.json');
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      repositoryRoot,
      aggregatePassed: aggregateResult.exitCode === 0,
      results,
    },
    null,
    2,
  ),
  'utf8',
);

const failureCount = results.filter(({ exitCode }) => exitCode !== 0).length;
console.log(`[safe-ci-prepush] report=${reportPath}`);
console.log(
  `[safe-ci-prepush] complete results=${results.length} failures=${failureCount}`,
);

process.exitCode = failureCount === 0 ? 0 : 1;
