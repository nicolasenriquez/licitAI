import { copyBaseApplicationProject } from '@/utils/app-template';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'os';
import createTwentyAppPackageJson from 'package.json';
import { join } from 'path';

jest.mock('node:fs/promises', () => {
  const actual = jest.requireActual('node:fs/promises');
  return {
    ...actual,
    cp: jest.fn().mockResolvedValue(undefined),
  };
});

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const UNIVERSAL_IDENTIFIERS_PATH = join(
  'src',
  'constants',
  'universal-identifiers.ts',
);
const YARNRC_PATH = 'yarnrc.yml';

// Template content matching template/src/constants/universal-identifiers.ts
const TEMPLATE_UNIVERSAL_IDENTIFIERS = `export const APP_DISPLAY_NAME = 'DISPLAY-NAME-TO-BE-GENERATED';
export const APP_DESCRIPTION = 'DESCRIPTION-TO-BE-GENERATED';
export const APPLICATION_UNIVERSAL_IDENTIFIER = 'UUID-TO-BE-GENERATED';
export const DEFAULT_ROLE_UNIVERSAL_IDENTIFIER = 'UUID-TO-BE-GENERATED';
`;

// Template package.json matching template/package.json
const TEMPLATE_PACKAGE_JSON = {
  name: 'template-app',
  version: '0.1.0',
  license: 'MIT',
  scripts: { twenty: 'twenty' },
  dependencies: {},
  devDependencies: {
    'twenty-client-sdk': '0.0.0',
    'twenty-sdk': '0.0.0',
  },
};

describe('copyBaseApplicationProject', () => {
  let testAppDirectory: string;

  beforeEach(async () => {
    testAppDirectory = join(
      tmpdir(),
      `test-twenty-app-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.mkdir(testAppDirectory, { recursive: true });

    // Seed files that generation steps expect because fs.cp is mocked.
    await fs.mkdir(join(testAppDirectory, 'src', 'constants'), {
      recursive: true,
    });
    await fs.writeFile(
      join(testAppDirectory, UNIVERSAL_IDENTIFIERS_PATH),
      TEMPLATE_UNIVERSAL_IDENTIFIERS,
    );
    await fs.writeFile(
      join(testAppDirectory, 'package.json'),
      JSON.stringify(TEMPLATE_PACKAGE_JSON),
    );

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (testAppDirectory && (await pathExists(testAppDirectory))) {
      await fs.rm(testAppDirectory, { recursive: true, force: true });
    }
  });

  it('should call fs.cp to copy base application template', async () => {
    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: 'A test application',
      appDirectory: testAppDirectory,
    });

    // Two fs.cp calls: (1) the template directory, (2) AGENTS.md → CLAUDE.md
    expect(fs.cp).toHaveBeenCalledTimes(2);
    expect(fs.cp).toHaveBeenCalledWith(
      expect.stringContaining('template'),
      testAppDirectory,
      { recursive: true },
    );
    expect(fs.cp).toHaveBeenCalledWith(
      join(testAppDirectory, 'AGENTS.md'),
      join(testAppDirectory, 'CLAUDE.md'),
      { recursive: true },
    );
  });

  it('should replace placeholders in universal-identifiers.ts with real values', async () => {
    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: 'A test application',
      appDirectory: testAppDirectory,
    });

    const content = await fs.readFile(
      join(testAppDirectory, UNIVERSAL_IDENTIFIERS_PATH),
      'utf8',
    );

    expect(content).toContain("APP_DISPLAY_NAME = 'My Test App'");
    expect(content).toContain("APP_DESCRIPTION = 'A test application'");
    expect(content).not.toContain('DISPLAY-NAME-TO-BE-GENERATED');
    expect(content).not.toContain('DESCRIPTION-TO-BE-GENERATED');
    expect(content).not.toContain('UUID-TO-BE-GENERATED');

    // Both UUIDs should be valid v4 format
    const uuidMatches = content.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
    );
    expect(uuidMatches).toHaveLength(2);
  });

  it('should generate different UUIDs for each identifier', async () => {
    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: 'A test application',
      appDirectory: testAppDirectory,
    });

    const content = await fs.readFile(
      join(testAppDirectory, UNIVERSAL_IDENTIFIERS_PATH),
      'utf8',
    );

    const uuidMatches = content.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
    );
    expect(uuidMatches).toHaveLength(2);
    expect(uuidMatches![0]).not.toBe(uuidMatches![1]);
  });

  it('should update package.json with app name and SDK versions', async () => {
    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: 'A test application',
      appDirectory: testAppDirectory,
    });

    const packageJson = JSON.parse(
      await fs.readFile(join(testAppDirectory, 'package.json'), 'utf8'),
    ) as {
      name: string;
      devDependencies: Record<string, string>;
    };
    expect(packageJson.name).toBe('my-test-app');
    expect(packageJson.devDependencies['twenty-sdk']).toBe(
      createTwentyAppPackageJson.version,
    );
    expect(packageJson.devDependencies['twenty-client-sdk']).toBe(
      createTwentyAppPackageJson.version,
    );
  });

  it('should create an empty public directory in the scaffolded project', async () => {
    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: 'A test application',
      appDirectory: testAppDirectory,
    });

    const publicDirectoryPath = join(testAppDirectory, 'public');

    expect(await pathExists(publicDirectoryPath)).toBe(true);

    const publicDirectoryStats = await fs.stat(publicDirectoryPath);
    expect(publicDirectoryStats.isDirectory()).toBe(true);

    const publicDirectoryContents = await fs.readdir(publicDirectoryPath);
    expect(publicDirectoryContents).toHaveLength(0);
  });

  it('should rename yarnrc.yml to .yarnrc.yml in the scaffolded project', async () => {
    await fs.writeFile(
      join(testAppDirectory, YARNRC_PATH),
      'nodeLinker: node-modules',
    );

    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: 'A test application',
      appDirectory: testAppDirectory,
    });

    expect(await pathExists(join(testAppDirectory, YARNRC_PATH))).toBe(false);
    expect(await pathExists(join(testAppDirectory, '.yarnrc.yml'))).toBe(true);
  });

  it('should handle empty description', async () => {
    await copyBaseApplicationProject({
      appName: 'my-test-app',
      appDisplayName: 'My Test App',
      appDescription: '',
      appDirectory: testAppDirectory,
    });

    const content = await fs.readFile(
      join(testAppDirectory, UNIVERSAL_IDENTIFIERS_PATH),
      'utf8',
    );

    expect(content).toContain("APP_DESCRIPTION = ''");
  });

  it('should generate unique UUIDs across different scaffolds', async () => {
    const firstAppDir = join(testAppDirectory, 'app1');
    await fs.mkdir(join(firstAppDir, 'src', 'constants'), {
      recursive: true,
    });
    await fs.writeFile(
      join(firstAppDir, UNIVERSAL_IDENTIFIERS_PATH),
      TEMPLATE_UNIVERSAL_IDENTIFIERS,
    );
    await fs.writeFile(
      join(firstAppDir, 'package.json'),
      JSON.stringify(TEMPLATE_PACKAGE_JSON),
    );
    await copyBaseApplicationProject({
      appName: 'app-one',
      appDisplayName: 'App One',
      appDescription: 'First app',
      appDirectory: firstAppDir,
    });

    const secondAppDir = join(testAppDirectory, 'app2');
    await fs.mkdir(join(secondAppDir, 'src', 'constants'), {
      recursive: true,
    });
    await fs.writeFile(
      join(secondAppDir, UNIVERSAL_IDENTIFIERS_PATH),
      TEMPLATE_UNIVERSAL_IDENTIFIERS,
    );
    await fs.writeFile(
      join(secondAppDir, 'package.json'),
      JSON.stringify(TEMPLATE_PACKAGE_JSON),
    );
    await copyBaseApplicationProject({
      appName: 'app-two',
      appDisplayName: 'App Two',
      appDescription: 'Second app',
      appDirectory: secondAppDir,
    });

    const firstConstants = await fs.readFile(
      join(firstAppDir, UNIVERSAL_IDENTIFIERS_PATH),
      'utf8',
    );
    const secondConstants = await fs.readFile(
      join(secondAppDir, UNIVERSAL_IDENTIFIERS_PATH),
      'utf8',
    );

    const uuidRegex =
      /APPLICATION_UNIVERSAL_IDENTIFIER = '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'/;
    const firstUuid = firstConstants.match(uuidRegex)?.[1];
    const secondUuid = secondConstants.match(uuidRegex)?.[1];

    expect(firstUuid).toBeDefined();
    expect(secondUuid).toBeDefined();
    expect(firstUuid).not.toBe(secondUuid);
  });
});
