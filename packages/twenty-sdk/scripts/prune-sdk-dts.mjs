import { cp, readdir, rm, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectoryPath = dirname(dirname(fileURLToPath(import.meta.url)));

const directoryPathsToPrune = [
  join(currentDirectoryPath, 'dist', 'define'),
  join(currentDirectoryPath, 'dist', 'billing'),
  join(currentDirectoryPath, 'dist', 'logic-function'),
  join(currentDirectoryPath, 'dist', 'utils'),
];

const shouldRemoveDeclarationArtifact = (fileName) =>
  fileName.endsWith('.d.ts') || fileName.endsWith('.d.ts.map');

const removeDeclarationArtifactsRecursively = async (directoryPath) => {
  let directoryEntries;

  try {
    directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return;
    }

    throw error;
  }

  for (const directoryEntry of directoryEntries) {
    const entryPath = join(directoryPath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      await removeDeclarationArtifactsRecursively(entryPath);
      continue;
    }

    if (shouldRemoveDeclarationArtifact(directoryEntry.name)) {
      await unlink(entryPath);
    }
  }
};

const sdkFrontComponentDeclarationsPath = join(
  currentDirectoryPath,
  'dist',
  'sdk',
  'front-component',
);
const frontComponentDeclarationsPath = join(
  currentDirectoryPath,
  'dist',
  'front-component',
);

await cp(sdkFrontComponentDeclarationsPath, frontComponentDeclarationsPath, {
  recursive: true,
  force: true,
});

await rm(join(currentDirectoryPath, 'dist', 'sdk'), {
  force: true,
  recursive: true,
});

for (const directoryPathToPrune of directoryPathsToPrune) {
  await removeDeclarationArtifactsRecursively(directoryPathToPrune);
}
