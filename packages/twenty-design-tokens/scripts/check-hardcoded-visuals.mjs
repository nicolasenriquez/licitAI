import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const visualExtensions = new Set(['.css', '.scss', '.ts', '.tsx']);
const patterns = [
  /#[0-9a-f]{3,8}\b/gi,
  /\b(?:rgb|rgba|hsl|hsla)\(/gi,
  /(?:border-radius|box-shadow|transition|animation-duration)\s*:\s*(?!var\()/gi,
];

const collectFiles = async (path) => {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else if (
      visualExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))
    ) {
      files.push(entryPath);
    }
  }

  return files;
};

const inputPaths = process.argv.slice(2);
const paths = inputPaths.length === 0 ? ['src'] : inputPaths;
const files = (await Promise.all(paths.map(collectFiles))).flat().sort();
const findings = [];

for (const file of files) {
  if (file.includes('.test.')) {
    continue;
  }
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
  lines.forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line))) {
      findings.push(`${relative(process.cwd(), file)}:${index + 1}`);
    }
    patterns.forEach((pattern) => (pattern.lastIndex = 0));
  });
}

if (findings.length > 0) {
  console.error('New visual hardcodes found:');
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Visual hardcode check passed for ${files.length} source files.`);
}
