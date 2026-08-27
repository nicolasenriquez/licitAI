import { spawn } from 'node:child_process';
import { relative, resolve } from 'node:path';

import { tool } from '@opencode-ai/plugin';

const mercadoPublicoSuites = [
  'all',
  'ui-contract',
  'journeys',
  'roles',
  'extended',
] as const;

const runRunner = async (
  worktree: string,
  arguments_: string[],
  abortSignal: AbortSignal,
): Promise<string> => {
  const runnerPath = resolve(
    worktree,
    'packages/twenty-e2e-testing/scripts/run-mercado-publico-e2e.mjs',
  );

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [runnerPath, ...arguments_], {
      cwd: worktree,
      shell: false,
      windowsHide: true,
    });
    let standardOutput = '';
    let standardError = '';

    const abort = () => child.kill();

    abortSignal.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', (chunk: Buffer) => {
      standardOutput += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      standardError += chunk.toString();
    });
    child.on('error', rejectPromise);
    child.on('close', (exitCode) => {
      abortSignal.removeEventListener('abort', abort);
      const output = `${standardOutput}${standardError}`.trim();

      if (exitCode === 0) {
        resolvePromise(output);
        return;
      }

      rejectPromise(
        new Error(output || `Mercado Publico E2E runner exited ${exitCode}`),
      );
    });
  });
};

const validateTestFile = (worktree: string, testFile: string): string => {
  const packageDirectory = resolve(worktree, 'packages/twenty-e2e-testing');
  const testRoot = resolve(packageDirectory, 'tests/mercado-publico');
  const absolutePath = resolve(packageDirectory, testFile);
  const relativePath = relative(testRoot, absolutePath);

  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    resolve(testRoot, relativePath) !== absolutePath ||
    !relativePath.endsWith('.spec.ts')
  ) {
    throw new Error(
      'testFile must be a .spec.ts file inside tests/mercado-publico.',
    );
  }

  return `tests/mercado-publico/${relativePath.replaceAll('\\', '/')}`;
};

export const status = tool({
  description:
    'Read the prepared Mercado Publico E2E lifecycle status as JSON.',
  args: {},
  async execute(_arguments, context) {
    return runRunner(context.worktree, ['status'], context.abort);
  },
});

export const prepare = tool({
  description: 'Prepare the isolated Mercado Publico E2E lifecycle.',
  args: {
    fresh: tool.schema.boolean().optional().default(false),
  },
  async execute({ fresh }, context) {
    return runRunner(
      context.worktree,
      ['prepare', ...(fresh ? ['--fresh'] : [])],
      context.abort,
    );
  },
});

export const run = tool({
  description:
    'Run a validated Mercado Publico Playwright suite against a prepared lifecycle.',
  args: {
    suite: tool.schema.enum(mercadoPublicoSuites).default('all'),
    testFile: tool.schema.string().min(1).optional(),
    grep: tool.schema.string().min(1).optional(),
    reuseAuth: tool.schema.boolean().optional().default(false),
  },
  async execute({ suite, testFile, grep, reuseAuth }, context) {
    const validatedTestFile =
      testFile === undefined
        ? undefined
        : validateTestFile(context.worktree, testFile);

    return runRunner(
      context.worktree,
      [
        suite,
        '--prepared',
        '--keep',
        ...(validatedTestFile === undefined
          ? []
          : ['--test-file', validatedTestFile]),
        ...(grep === undefined ? [] : ['--grep', grep]),
        ...(reuseAuth ? ['--reuse-auth'] : []),
      ],
      context.abort,
    );
  },
});

export const reset = tool({
  description:
    'Restore the prepared Mercado Publico database baseline without building.',
  args: {},
  async execute(_arguments, context) {
    return runRunner(context.worktree, ['reset'], context.abort);
  },
});
