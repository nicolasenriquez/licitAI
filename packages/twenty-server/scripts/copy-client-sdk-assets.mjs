import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const clientSdkAssetsDirectory = join('dist', 'assets', 'twenty-client-sdk');

await mkdir(clientSdkAssetsDirectory, { recursive: true });
await cp(
  join('..', 'twenty-client-sdk', 'package.json'),
  join(clientSdkAssetsDirectory, 'package.json'),
);
await cp(
  join('..', 'twenty-client-sdk', 'dist'),
  join(clientSdkAssetsDirectory, 'dist'),
  { recursive: true },
);
