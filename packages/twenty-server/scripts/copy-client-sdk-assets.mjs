import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRootPath = dirname(dirname(fileURLToPath(import.meta.url)));
const clientSdkRootPath = resolve(serverRootPath, '../twenty-client-sdk');
const destinationPath = resolve(
  serverRootPath,
  'dist/assets/twenty-client-sdk',
);

mkdirSync(destinationPath, { recursive: true });
cpSync(
  resolve(clientSdkRootPath, 'package.json'),
  resolve(destinationPath, 'package.json'),
);
cpSync(resolve(clientSdkRootPath, 'dist'), resolve(destinationPath, 'dist'), {
  recursive: true,
});
