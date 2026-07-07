import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url));
const sourceFilePath = resolve(currentDirectoryPath, 'oxlint-plugin.ts');
const sourceFileContents = await readFile(sourceFilePath, 'utf8');

await build({
  absWorkingDir: currentDirectoryPath,
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: resolve(currentDirectoryPath, 'dist/oxlint-plugin.mjs'),
  stdin: {
    contents: sourceFileContents,
    loader: 'ts',
    resolveDir: currentDirectoryPath,
    sourcefile: sourceFilePath,
  },
  tsconfig: resolve(currentDirectoryPath, 'tsconfig.json'),
  define: {
    __filename: JSON.stringify('[plugin]'),
    __dirname: JSON.stringify('[plugin]'),
  },
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});
