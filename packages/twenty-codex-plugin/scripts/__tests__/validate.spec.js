const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const PLUGIN_JSON_PATH = path.join(PLUGIN_ROOT, '.codex-plugin', 'plugin.json');
const PACKAGE_JSON_PATH = path.join(PLUGIN_ROOT, 'package.json');
const MCP_JSON_PATH = path.join(PLUGIN_ROOT, '.mcp.json');
const MARKETPLACE_TEMPLATE_PATH = path.join(
  PLUGIN_ROOT,
  'templates',
  'marketplace.example.json',
);

const metadata = require('../validators/metadata');
const assets = require('../validators/assets');
const skills = require('../validators/skills');
const references = require('../validators/references');
const crossDocContracts = require('../validators/cross-doc-contracts');
const setupHelper = require('../validators/setup-helper');
const { createAtlas, indexStory } = require('../storybook-atlas');

const collectFailures = (assertion) => {
  const failures = [];
  assertion((message) => failures.push(message));
  return failures;
};

const withFileMutation = (filePath, mutator, body) => {
  const original = fs.readFileSync(filePath, 'utf8');

  try {
    fs.writeFileSync(filePath, mutator(original));
    body();
  } finally {
    fs.writeFileSync(filePath, original);
  }
};

const withJsonMutation = (filePath, mutator, body) =>
  withFileMutation(
    filePath,
    (original) => {
      const data = JSON.parse(original);
      mutator(data);
      return `${JSON.stringify(data, null, 2)}\n`;
    },
    body,
  );

const withExtraFile = (filePath, contents, body) => {
  try {
    fs.writeFileSync(filePath, contents);
    body();
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

const withAtlasRepo = (files, body) => {
  const root = fs.mkdtempSync(path.join(__dirname, 'atlas-'));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const filePath = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, contents);
    }
    body(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const atlasFiles = {
  'packages/twenty-design-tokens/src/source/primitives.json':
    '{"color":{"blue":{"$value":"#00f"}}}',
  'packages/twenty-ui/src/Button.tsx':
    'export const Button = () => null; token("color.blue");',
  'packages/twenty-ui/src/Button.stories.tsx':
    "import { Button } from './Button'; const meta = { component: Button }; export default meta;",
  'packages/twenty-front/src/pages/Page.tsx': 'export const Page = () => null;',
  'packages/twenty-front/src/pages/Page.stories.tsx':
    "import { Page } from './Page'; export default { component: Page };",
  'packages/twenty-front/src/modules/Module.tsx':
    'export const Module = () => null;',
  'packages/twenty-front/src/modules/Module.stories.tsx':
    "import { Module } from './Module'; export default { component: Module };",
  'packages/twenty-front/src/modules/perf/Perf.tsx':
    'export const Perf = () => null;',
  'packages/twenty-front/src/modules/perf/Perf.perf.stories.tsx':
    "import { Perf } from './Perf'; export default { component: Perf };",
};

// ---------------------------------------------------------------------------
// Smoke tests — every assertion should pass on the current plugin state.
// ---------------------------------------------------------------------------

test('assertJsonMetadata passes on current state', () => {
  assert.deepStrictEqual(collectFailures(metadata.assertJsonMetadata), []);
});

test('assertNoBundledMcpConfig passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(metadata.assertNoBundledMcpConfig),
    [],
  );
});

test('assertInterfaceFields passes on current state', () => {
  assert.deepStrictEqual(collectFailures(metadata.assertInterfaceFields), []);
});

test('assertMarketplaceTemplate passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(metadata.assertMarketplaceTemplate),
    [],
  );
});

test('assertAssets passes on current state', () => {
  assert.deepStrictEqual(collectFailures(assets.assertAssets), []);
});

test('assertSkills passes on current state', () => {
  assert.deepStrictEqual(collectFailures(skills.assertSkills), []);
});

test('assertSkillTriggerPhrases passes on current state', () => {
  assert.deepStrictEqual(collectFailures(skills.assertSkillTriggerPhrases), []);
});

test('assertNoLegacySkillReferences passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(skills.assertNoLegacySkillReferences),
    [],
  );
});

test('assertReferences passes on current state', () => {
  assert.deepStrictEqual(collectFailures(references.assertReferences), []);
});

test('assertHowAppsWork passes on current state', () => {
  assert.deepStrictEqual(collectFailures(references.assertHowAppsWork), []);
});

test('assertTwentyMcpFormattingContract passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(crossDocContracts.assertTwentyMcpFormattingContract),
    [],
  );
});

test('assertFrontComponentGuidance passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(crossDocContracts.assertFrontComponentGuidance),
    [],
  );
});

test('assertStorybookUiGenerationGuidance passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(crossDocContracts.assertStorybookUiGenerationGuidance),
    [],
  );
});

test('assertCliGuidanceSplit passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(crossDocContracts.assertCliGuidanceSplit),
    [],
  );
});

test('assertTestingGuidance passes on current state', () => {
  assert.deepStrictEqual(
    collectFailures(crossDocContracts.assertTestingGuidance),
    [],
  );
});

test('assertSetupHelper passes on current state', () => {
  assert.deepStrictEqual(collectFailures(setupHelper.assertSetupHelper), []);
});

// ---------------------------------------------------------------------------
// Negative cases — each assertion catches its targeted failure.
// ---------------------------------------------------------------------------

test('assertJsonMetadata catches version mismatch between package.json and plugin.json', () => {
  withJsonMutation(
    PACKAGE_JSON_PATH,
    (pkg) => {
      pkg.version = '99.99.99';
    },
    () => {
      const failures = collectFailures(metadata.assertJsonMetadata);
      assert.ok(
        failures.some((f) => f.includes('version must match')),
        `expected version-mismatch failure, got: ${failures.join('; ')}`,
      );
    },
  );
});

test('assertJsonMetadata catches missing .mcp.json from package.json files', () => {
  withJsonMutation(
    PACKAGE_JSON_PATH,
    (pkg) => {
      pkg.files = pkg.files.filter((f) => f !== '.mcp.json');
    },
    () => {
      const failures = collectFailures(metadata.assertJsonMetadata);
      assert.ok(failures.some((f) => f.includes('.mcp.json')));
    },
  );
});

test('assertJsonMetadata catches non-canonical MCP server', () => {
  withJsonMutation(
    MCP_JSON_PATH,
    (mcp) => {
      mcp.mcpServers['rogue-server'] = { url: 'https://example.com/mcp' };
    },
    () => {
      const failures = collectFailures(metadata.assertJsonMetadata);
      assert.ok(failures.some((f) => f.includes('twenty-docs')));
    },
  );
});

test('assertNoBundledMcpConfig catches a bundled .app.json', () => {
  const stub = path.join(PLUGIN_ROOT, '.app.json');
  withExtraFile(stub, '{}', () => {
    const failures = collectFailures(metadata.assertNoBundledMcpConfig);
    assert.ok(
      failures.some((f) => f.includes('app declarations must not be shipped')),
    );
  });
});

test('assertNoBundledMcpConfig catches a non-placeholder URL', () => {
  const stub = path.join(PLUGIN_ROOT, 'scratch-url-check.md');
  withExtraFile(
    stub,
    'see https://internal.private-domain.test/secret for details',
    () => {
      const failures = collectFailures(metadata.assertNoBundledMcpConfig);
      assert.ok(failures.some((f) => f.includes('non-placeholder URL')));
    },
  );
});

test('assertNoBundledMcpConfig catches a bearer token', () => {
  const stub = path.join(PLUGIN_ROOT, 'scratch-bearer.md');
  withExtraFile(
    stub,
    'Authorization: Bearer abc123def456ghi789jkl012mno',
    () => {
      const failures = collectFailures(metadata.assertNoBundledMcpConfig);
      assert.ok(failures.some((f) => f.includes('bearer token')));
    },
  );
});

test('assertInterfaceFields catches invalid brandColor', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.brandColor = 'red';
    },
    () => {
      const failures = collectFailures(metadata.assertInterfaceFields);
      assert.ok(failures.some((f) => f.includes('brandColor must match')));
    },
  );
});

test('assertInterfaceFields catches too-long shortDescription', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.shortDescription = 'x'.repeat(100);
    },
    () => {
      const failures = collectFailures(metadata.assertInterfaceFields);
      assert.ok(
        failures.some((f) => f.includes('shortDescription must be 64')),
      );
    },
  );
});

test('assertInterfaceFields catches unknown category', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.category = 'Photography';
    },
    () => {
      const failures = collectFailures(metadata.assertInterfaceFields);
      assert.ok(failures.some((f) => f.includes('category must be one of')));
    },
  );
});

test('assertInterfaceFields catches invalid capability', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.capabilities = ['Magic'];
    },
    () => {
      const failures = collectFailures(metadata.assertInterfaceFields);
      assert.ok(
        failures.some((f) => f.includes('capabilities contains invalid value')),
      );
    },
  );
});

test('assertInterfaceFields catches empty defaultPrompt', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.defaultPrompt = [];
    },
    () => {
      const failures = collectFailures(metadata.assertInterfaceFields);
      assert.ok(failures.some((f) => f.includes('defaultPrompt')));
    },
  );
});

test('assertAssets catches a missing screenshot reference', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.screenshots = ['./assets/screenshots/nonexistent.png'];
    },
    () => {
      const failures = collectFailures(assets.assertAssets);
      assert.ok(
        failures.some((f) => f.includes('screenshots entry is missing')),
      );
    },
  );
});

test('assertAssets catches a non-PNG logo', () => {
  withJsonMutation(
    PLUGIN_JSON_PATH,
    (j) => {
      j.interface.logo = './assets/twenty-logo.svg';
    },
    () => {
      const failures = collectFailures(assets.assertAssets);
      assert.ok(failures.some((f) => f.includes('logo must be a PNG')));
    },
  );
});

test('assertMarketplaceTemplate catches version drift', () => {
  withJsonMutation(
    MARKETPLACE_TEMPLATE_PATH,
    (t) => {
      t.plugins[0].version = '0.0.0';
    },
    () => {
      const failures = collectFailures(metadata.assertMarketplaceTemplate);
      assert.ok(failures.some((f) => f.includes('version must match')));
    },
  );
});

test('assertSkillTriggerPhrases catches a SKILL.md missing the When To Use section', () => {
  const skillPath = path.join(PLUGIN_ROOT, 'skills', 'create-app', 'SKILL.md');
  withFileMutation(
    skillPath,
    (original) => original.replace(/^#+\s+When To Use[\s\S]*?(?=\n#\s)/m, ''),
    () => {
      const failures = collectFailures(skills.assertSkillTriggerPhrases);
      assert.ok(
        failures.some(
          (f) => f.includes('create-app') && f.includes('When To Use'),
        ),
      );
    },
  );
});

test('assertTestingGuidance catches missing manage-app test target instructions', () => {
  const skillPath = path.join(PLUGIN_ROOT, 'skills', 'manage-app', 'SKILL.md');
  withFileMutation(
    skillPath,
    (original) =>
      original.replace(
        'TWENTY_API_URL=http://localhost:2021 yarn test',
        'yarn test',
      ),
    () => {
      const failures = collectFailures(crossDocContracts.assertTestingGuidance);
      assert.ok(
        failures.some(
          (f) =>
            f.includes('manage-app/SKILL.md') && f.includes('TWENTY_API_URL'),
        ),
        `expected manage-app test target failure, got: ${failures.join('; ')}`,
      );
    },
  );
});

test('assertStorybookUiGenerationGuidance catches disconnected routing', () => {
  const skillPath = path.join(PLUGIN_ROOT, 'skills', 'develop-app', 'SKILL.md');
  withFileMutation(
    skillPath,
    (original) =>
      original.replaceAll('storybook-ui-generation.md', 'removed-reference.md'),
    () => {
      const failures = collectFailures(
        crossDocContracts.assertStorybookUiGenerationGuidance,
      );
      assert.ok(
        failures.some((failure) =>
          failure.includes('missing Storybook UI generation routing'),
        ),
      );
    },
  );
});

test('assertStorybookUiGenerationGuidance catches a missing durable link', () => {
  const referencePath = path.join(
    PLUGIN_ROOT,
    'references',
    'design',
    'storybook-ui-generation.md',
  );
  withFileMutation(
    referencePath,
    (original) =>
      original.replace(
        'docs/design/storybook-ui-source-of-truth.md',
        'docs/design/missing.md',
      ),
    () => {
      const failures = collectFailures(
        crossDocContracts.assertStorybookUiGenerationGuidance,
      );
      assert.ok(
        failures.some((failure) =>
          failure.includes('docs/design/storybook-ui-source-of-truth.md'),
        ),
      );
    },
  );
});

test('storybook atlas resolves meta.component, aliases, tokens, and configured scopes deterministically', () => {
  withAtlasRepo(
    {
      ...atlasFiles,
      'packages/twenty-ui/src/Alias.stories.tsx':
        "import { Button as AliasButton } from '@ui/Button'; export default { component: AliasButton };",
      'packages/twenty-front/src/Loose.tsx': 'export const Loose = () => null;',
      'packages/twenty-front/src/Loose.stories.tsx':
        "import { Loose } from './Loose'; export default { component: Loose };",
    },
    (root) => {
      const first = createAtlas(root);
      const second = createAtlas(root);
      assert.deepStrictEqual(first, second);
      assert.ok(first.configuredScopes.includes('twenty-front:ui-docs'));
      assert.ok(
        first.stories.some((entry) => entry.scopes.includes('twenty-ui')),
      );
      assert.ok(
        first.stories.some((entry) =>
          entry.scopes.includes('twenty-front:pages'),
        ),
      );
      assert.ok(
        first.stories.some((entry) =>
          entry.scopes.includes('twenty-front:modules'),
        ),
      );
      assert.ok(
        first.stories.some((entry) =>
          entry.scopes.includes('twenty-front:performance'),
        ),
      );
      assert.ok(
        first.stories.some((entry) =>
          entry.scopes.includes('twenty-front:default'),
        ),
      );
      assert.deepStrictEqual(
        first.stories.find((entry) =>
          entry.story.endsWith('Button.stories.tsx'),
        ).components[0].tokens,
        ['color.blue'],
      );
    },
  );
});

test('storybook atlas resolves a render component and accepts a justified exclusion', () => {
  withAtlasRepo(
    {
      ...atlasFiles,
      'packages/twenty-ui/src/Render.stories.tsx':
        "import { Button } from './Button'; export default { title: 'render' }; export const Default = { render: () => <Button /> };",
      'packages/twenty-ui/src/Ignored.stories.tsx':
        '// storybook-atlas: ignore visual-only documentation has no component',
    },
    (root) => {
      const atlas = createAtlas(root);
      assert.ok(
        atlas.stories.find((entry) =>
          entry.story.endsWith('Render.stories.tsx'),
        ).components[0].name === 'Button',
      );
      assert.ok(
        atlas.stories
          .find((entry) => entry.story.endsWith('Ignored.stories.tsx'))
          .excluded.includes('visual-only'),
      );
    },
  );
});

test('storybook atlas rejects unresolved imports, exports, tokens, and unreasoned stories', () => {
  withAtlasRepo(
    {
      ...atlasFiles,
      'packages/twenty-ui/src/Broken.stories.tsx':
        "import { Missing } from './Missing'; export default { component: Missing };",
    },
    (root) => {
      assert.throws(() => createAtlas(root), /cannot resolve import/);
    },
  );
  withAtlasRepo(
    {
      ...atlasFiles,
      'packages/twenty-ui/src/Button.tsx': 'export const Other = () => null;',
      'packages/twenty-ui/src/Broken.stories.tsx':
        "import { Button } from './Button'; export default { component: Button };",
    },
    (root) => {
      assert.throws(() => createAtlas(root), /cannot resolve export/);
    },
  );
  withAtlasRepo(
    {
      ...atlasFiles,
      'packages/twenty-ui/src/Button.tsx':
        'export const Button = () => null; token("color.missing");',
    },
    (root) => {
      assert.throws(() => createAtlas(root), /unknown DTCG token/);
    },
  );
  withAtlasRepo(
    {
      ...atlasFiles,
      'packages/twenty-ui/src/Broken.stories.tsx':
        'export default { title: "no component" };',
    },
    (root) => {
      assert.throws(() => createAtlas(root), /storybook-atlas ignore/);
    },
  );
});

test('validate supports installed-plugin and repository-contract modes', () => {
  const standalone = spawnSync(process.execPath, ['scripts/validate.js'], {
    cwd: PLUGIN_ROOT,
    encoding: 'utf8',
  });
  assert.strictEqual(standalone.status, 0, standalone.stderr);
  const repository = spawnSync(
    process.execPath,
    ['scripts/validate.js', '--repo-root', '../..'],
    {
      cwd: PLUGIN_ROOT,
      encoding: 'utf8',
    },
  );
  assert.strictEqual(repository.status, 0, repository.stderr);
});

test('Mercado Público reading map links to canonical documents', () => {
  const docsRoot = path.join(PLUGIN_ROOT, '..', '..', 'docs');
  const docsReadme = fs.readFileSync(path.join(docsRoot, 'README.md'), 'utf8');
  const docsIndex = fs.readFileSync(path.join(docsRoot, 'index.md'), 'utf8');
  for (const relativePath of [
    'business/mercado-publico-source-contract.md',
    'architecture/data-model.md',
    'decisions/0005-deployment-local-mercado-publico-schema.md',
    'operations/mercado-publico-ingestion.md',
  ]) {
    assert.ok(docsReadme.includes(`](${relativePath})`));
    assert.ok(docsIndex.includes(`](${relativePath})`));
    assert.ok(fs.existsSync(path.join(docsRoot, relativePath)));
  }
});
