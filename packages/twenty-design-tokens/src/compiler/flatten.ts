import {
  type FlattenedToken,
  type TokenDocument,
  type TokenNode,
} from './types';

const isTokenNode = (value: TokenDocument | TokenNode): value is TokenNode =>
  '$value' in value;

export const flattenDocument = (
  document: TokenDocument,
  prefix: readonly string[] = [],
): readonly FlattenedToken[] => {
  const tokens: FlattenedToken[] = [];

  for (const key of Object.keys(document).sort()) {
    const value = document[key];
    const path = [...prefix, key];

    if (isTokenNode(value)) {
      tokens.push({
        description: value.$description,
        path: path.join('.'),
        type: value.$type,
        value: value.$value,
      });
      continue;
    }

    tokens.push(...flattenDocument(value, path));
  }

  return tokens;
};
