import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'path';

import createTwentyAppPackageJson from 'package.json';

const SRC_FOLDER = 'src';

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const copyBaseApplicationProject = async ({
  appName,
  appDisplayName,
  appDescription,
  appDirectory,
  onProgress,
}: {
  appName: string;
  appDisplayName: string;
  appDescription: string;
  appDirectory: string;
  onProgress?: (message: string) => void;
}) => {
  onProgress?.('Copying base template');
  await fs.cp(join(__dirname, './constants/template'), appDirectory, {
    recursive: true,
  });

  onProgress?.('Configuring dotfiles (.gitignore, .github, .yarnrc.yml)');
  await renameDotfiles({ appDirectory });

  onProgress?.('Mirroring AGENTS.md to CLAUDE.md');
  await mirrorAgentsToClaude({ appDirectory });

  await addEmptyPublicDirectory({ appDirectory });

  onProgress?.('Generating unique application identifiers');
  await generateUniversalIdentifiers({
    appDisplayName,
    appDescription,
    appDirectory,
  });

  onProgress?.('Updating package.json');
  await updatePackageJson({ appName, appDirectory });
};

// npm strips dotfiles/dotdirs (.gitignore, .github/) from published packages,
// so we store them without the leading dot and rename after copying.
const renameDotfiles = async ({ appDirectory }: { appDirectory: string }) => {
  const renames = [
    { from: 'gitignore', to: '.gitignore' },
    { from: 'github', to: '.github' },
    { from: 'yarnrc.yml', to: '.yarnrc.yml' },
  ];

  for (const { from, to } of renames) {
    const sourcePath = join(appDirectory, from);

    if (await pathExists(sourcePath)) {
      await fs.rename(sourcePath, join(appDirectory, to));
    }
  }
};

// AGENTS.md is the cross-tool standard; Claude Code prefers CLAUDE.md and only
// falls back to AGENTS.md, so we mirror the file to keep a single source of truth.
const mirrorAgentsToClaude = async ({
  appDirectory,
}: {
  appDirectory: string;
}) => {
  await fs.cp(
    join(appDirectory, 'AGENTS.md'),
    join(appDirectory, 'CLAUDE.md'),
    { recursive: true },
  );
};

const addEmptyPublicDirectory = async ({
  appDirectory,
}: {
  appDirectory: string;
}) => {
  await fs.mkdir(join(appDirectory, 'public'), { recursive: true });
};

const generateUniversalIdentifiers = async ({
  appDisplayName,
  appDescription,
  appDirectory,
}: {
  appDisplayName: string;
  appDescription: string;
  appDirectory: string;
}) => {
  const universalIdentifiersPath = join(
    appDirectory,
    SRC_FOLDER,
    'constants',
    'universal-identifiers.ts',
  );

  const universalIdentifiersFileContent = await fs.readFile(
    universalIdentifiersPath,
    'utf-8',
  );

  await fs.writeFile(
    universalIdentifiersPath,
    universalIdentifiersFileContent
      .replace('DISPLAY-NAME-TO-BE-GENERATED', appDisplayName)
      .replace('DESCRIPTION-TO-BE-GENERATED', appDescription)
      .replace(/UUID-TO-BE-GENERATED/g, () => randomUUID()),
  );
};

const updatePackageJson = async ({
  appName,
  appDirectory,
}: {
  appName: string;
  appDirectory: string;
}) => {
  const packageJson = JSON.parse(
    await fs.readFile(join(appDirectory, 'package.json'), 'utf8'),
  ) as {
    name: string;
    devDependencies: Record<string, string>;
  };

  packageJson.name = appName;
  packageJson.devDependencies['twenty-sdk'] =
    createTwentyAppPackageJson.version;
  packageJson.devDependencies['twenty-client-sdk'] =
    createTwentyAppPackageJson.version;

  await fs.writeFile(
    join(appDirectory, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8',
  );
};
