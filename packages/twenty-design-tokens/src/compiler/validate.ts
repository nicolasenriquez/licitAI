import { flattenDocument } from './flatten';
import {
  type TokenDocument,
  type TokenRecords,
  type TokenValue,
  type ValidationResult,
} from './types';

const ALLOWED_TYPES = new Set([
  'color',
  'dimension',
  'duration',
  'fontFamily',
  'fontWeight',
  'number',
  'shadow',
  'string',
]);

const aliasFor = (value: TokenValue): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const match = /^\{([^{}]+)\}$/.exec(value);
  return match?.[1];
};

const collectTokens = (records: TokenRecords) => [
  ...flattenDocument(records.primitives, ['primitives']),
  ...flattenDocument(records.product.common, ['product', 'common']),
  ...flattenDocument(records.product.light, ['product', 'light']),
  ...flattenDocument(records.product.dark, ['product', 'dark']),
  ...flattenDocument(records.marketing.common, ['marketing', 'common']),
  ...flattenDocument(records.marketing.light, ['marketing', 'light']),
  ...flattenDocument(records.marketing.muted, ['marketing', 'muted']),
  ...flattenDocument(records.marketing.dark, ['marketing', 'dark']),
];

const validateModeParity = (
  light: TokenDocument,
  dark: TokenDocument,
  label: string,
  errors: string[],
) => {
  const lightPaths = new Set(flattenDocument(light).map((token) => token.path));
  const darkPaths = new Set(flattenDocument(dark).map((token) => token.path));

  for (const path of lightPaths) {
    if (!darkPaths.has(path)) {
      errors.push(`${label} mode parity is missing dark token ${path}`);
    }
  }

  for (const path of darkPaths) {
    if (!lightPaths.has(path)) {
      errors.push(`${label} mode parity is missing light token ${path}`);
    }
  }
};

export const validateTokenDocuments = (
  records: TokenRecords,
): ValidationResult => {
  const errors: string[] = [];
  const tokens = collectTokens(records);
  const tokenByPath = new Map(tokens.map((token) => [token.path, token]));

  for (const token of tokens) {
    if (!ALLOWED_TYPES.has(token.type)) {
      errors.push(`${token.path} has unsupported DTCG type ${token.type}`);
    }

    const isSemantic =
      token.path.startsWith('product.') || token.path.startsWith('marketing.');
    if (isSemantic && !token.description?.trim()) {
      errors.push(`${token.path} requires a semantic description`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (path: string) => {
    if (visited.has(path)) {
      return;
    }

    if (visiting.has(path)) {
      errors.push(`alias cycle detected at ${path}`);
      return;
    }

    const token = tokenByPath.get(path);
    if (!token) {
      return;
    }

    const alias = aliasFor(token.value);
    if (!alias) {
      visited.add(path);
      return;
    }

    if (!tokenByPath.has(alias)) {
      errors.push(`${path} alias target ${alias} does not exist`);
      visited.add(path);
      return;
    }

    visiting.add(path);
    visit(alias);
    visiting.delete(path);
    visited.add(path);
  };

  for (const token of tokens) {
    visit(token.path);
  }

  validateModeParity(
    records.product.light,
    records.product.dark,
    'product',
    errors,
  );
  validateModeParity(
    records.marketing.light,
    records.marketing.dark,
    'marketing',
    errors,
  );
  validateModeParity(
    records.marketing.light,
    records.marketing.muted,
    'marketing',
    errors,
  );

  return { valid: errors.length === 0, errors };
};

export const assertValidTokenDocuments = (records: TokenRecords): void => {
  const result = validateTokenDocuments(records);
  if (!result.valid) {
    throw new Error(
      `Design token validation failed:\n${result.errors.join('\n')}`,
    );
  }
};
