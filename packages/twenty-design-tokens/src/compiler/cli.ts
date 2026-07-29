import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  compileTokenRegistry,
  renderCss,
  renderFigmaBundle,
  renderTypeScript,
} from './compiler';
import { tokenRecords } from './source-records';
import { validateTokenDocuments } from './validate';
import {
  checkLegacyParity,
  renderLegacyCssVariableReferences,
  renderLegacyThemeManifest,
} from './legacy-parity';

const generatedRoot = resolve(import.meta.dirname, '../../generated');

const writeGeneratedFile = (relativePath: string, content: string) => {
  const filePath = resolve(generatedRoot, relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
};

const generate = () => {
  const registry = compileTokenRegistry(tokenRecords);
  const legacyParityErrors = checkLegacyParity();

  if (legacyParityErrors.length > 0) {
    throw new Error(`Legacy parity failed:\n${legacyParityErrors.join('\n')}`);
  }

  writeGeneratedFile('product.css', renderCss(registry, 'product'));
  writeGeneratedFile('marketing.css', renderCss(registry, 'marketing'));
  writeGeneratedFile(
    'product-css-variables.ts',
    renderTypeScript(registry, 'product'),
  );
  writeGeneratedFile(
    'marketing-css-variables.ts',
    renderTypeScript(registry, 'marketing'),
  );
  writeGeneratedFile(
    'figma/product.json',
    renderFigmaBundle(registry, 'product'),
  );
  writeGeneratedFile(
    'figma/marketing.json',
    renderFigmaBundle(registry, 'marketing'),
  );
  writeGeneratedFile(
    'compatibility/legacy-theme-manifest.json',
    renderLegacyThemeManifest(),
  );
  writeGeneratedFile(
    'compatibility/legacy-css-variable-references.ts',
    renderLegacyCssVariableReferences(),
  );
};

const command = process.argv[2] ?? 'validate';
const validation = validateTokenDocuments(tokenRecords);

if (!validation.valid) {
  throw new Error(
    `Design token validation failed:\n${validation.errors.join('\n')}`,
  );
}

if (command === 'generate' || command === 'build') {
  generate();
} else if (command !== 'validate') {
  throw new Error(`Unknown design token command: ${command}`);
}
