#!/usr/bin/env node

const metadata = require('./validators/metadata');
const assets = require('./validators/assets');
const skills = require('./validators/skills');
const references = require('./validators/references');
const crossDocContracts = require('./validators/cross-doc-contracts');
const setupHelper = require('./validators/setup-helper');
const { createAtlas } = require('./storybook-atlas');

const repoRootFlag = process.argv.indexOf('--repo-root');
const repoRoot =
  repoRootFlag === -1 ? undefined : process.argv[repoRootFlag + 1];
const report = process.argv.includes('--report');

if (repoRootFlag !== -1 && (!repoRoot || repoRoot.startsWith('-'))) {
  console.error('validate --repo-root requires a repository path');
  process.exit(1);
}

const failures = [];
const fail = (message) => failures.push(message);

metadata.assertJsonMetadata(fail);
metadata.assertNoBundledMcpConfig(fail);
metadata.assertInterfaceFields(fail);
metadata.assertMarketplaceTemplate(fail);
assets.assertAssets(fail);
skills.assertSkills(fail);
skills.assertSkillTriggerPhrases(fail);
skills.assertNoLegacySkillReferences(fail);
references.assertReferences(fail);
references.assertHowAppsWork(fail);
crossDocContracts.assertTwentyMcpFormattingContract(fail);
crossDocContracts.assertFrontComponentGuidance(fail);
if (repoRoot) {
  crossDocContracts.assertStorybookUiGenerationGuidance(fail, repoRoot);
  try {
    createAtlas(require('node:path').resolve(repoRoot));
  } catch (error) {
    fail(`Storybook atlas validation failed: ${error.message}`);
  }
}
crossDocContracts.assertCliGuidanceSplit(fail);
crossDocContracts.assertTestingGuidance(fail);
setupHelper.assertSetupHelper(fail);

if (failures.length > 0) {
  if (!report) console.error('Twenty Codex plugin validation failed:');

  for (const failure of failures) {
    console.error(report ? failure : `- ${failure}`);
  }

  process.exit(1);
}

if (report) {
  if (!repoRoot) {
    console.error(
      '--report requires --repo-root because the atlas is repository-derived',
    );
    process.exit(1);
  }
  console.log(
    JSON.stringify(createAtlas(require('node:path').resolve(repoRoot))),
  );
} else {
  console.log('Twenty Codex plugin validation passed.');
}
