import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const nxPath = join(
  dirname(require.resolve('nx/package.json')),
  'dist',
  'bin',
  'nx.js',
);
const previewUrl = 'http://127.0.0.1:4001/preview/test';
const timeoutMilliseconds = 20_000;

const emailProcess = spawn(
  process.execPath,
  [nxPath, 'run', 'twenty-emails:start'],
  {
    cwd: repositoryRoot,
    stdio: 'inherit',
    windowsHide: true,
  },
);

const stopProcessTree = () => {
  if (!emailProcess.pid) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(emailProcess.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  emailProcess.kill('SIGTERM');
};

const waitForPreview = async () => {
  const deadline = Date.now() + timeoutMilliseconds;

  while (Date.now() < deadline) {
    let isReady = false;

    try {
      const response = await fetch(previewUrl, {
        signal: AbortSignal.timeout(2_000),
      });
      isReady = response.status === 200;
    } catch {}

    if (isReady) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${previewUrl}`);
};

try {
  await Promise.race([
    waitForPreview(),
    new Promise((_, reject) => {
      emailProcess.once('exit', (exitCode) => {
        reject(
          new Error(
            `Email preview exited before becoming ready (code ${exitCode})`,
          ),
        );
      });
      emailProcess.once('error', reject);
    }),
  ]);
  console.log(`Email preview ready: ${previewUrl}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  stopProcessTree();
}
