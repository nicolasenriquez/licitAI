const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'];
const STORY_RE = /\.stories\.(?:tsx?|jsx?)$/;

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
};

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const walk = (directory, predicate, files = []) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath, predicate, files);
    else if (predicate(filePath)) files.push(filePath);
  }
  return files;
};

const sourceFile = (filePath) =>
  ts.createSourceFile(filePath, read(filePath), ts.ScriptTarget.Latest, true);

const resolveFile = (fromFile, specifier, repoRoot) => {
  let base;
  if (specifier === '@ui' || specifier.startsWith('@ui/')) {
    base = path.join(repoRoot, 'packages/twenty-ui/src', specifier.slice(3));
  } else if (specifier.startsWith('~/')) {
    base = path.join(repoRoot, 'packages/twenty-front/src', specifier.slice(2));
  } else if (specifier.startsWith('@/')) {
    base = path.join(
      repoRoot,
      'packages/twenty-front/src/modules',
      specifier.slice(2),
    );
  } else if (specifier === 'twenty-ui' || specifier.startsWith('twenty-ui/')) {
    base = path.join(
      repoRoot,
      'packages/twenty-ui/src',
      specifier.slice('twenty-ui'.length),
    );
  } else if (specifier.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return undefined;
  }
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => base + extension),
    ...SOURCE_EXTENSIONS.map((extension) =>
      path.join(base, `index${extension}`),
    ),
    ...STYLE_EXTENSIONS.map((extension) => base + extension),
  ];
  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
};

const exported = (filePath, exportName, repoRoot) => {
  const source = sourceFile(filePath);
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement) && exportName === 'default')
      return true;
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause && exportName === 'default') continue;
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        const item = statement.exportClause.elements.find(
          (element) => element.name.text === exportName,
        );
        if (
          item &&
          statement.moduleSpecifier &&
          ts.isStringLiteral(statement.moduleSpecifier)
        ) {
          const target = resolveFile(
            filePath,
            statement.moduleSpecifier.text,
            repoRoot,
          );
          return target
            ? exported(
                target,
                item.propertyName?.text ?? item.name.text,
                repoRoot,
              )
            : false;
        }
        if (item) return true;
      }
    }
    const modifiers = statement.modifiers ?? [];
    const hasExport = modifiers.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    const hasDefault = modifiers.some(
      (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
    );
    if (!hasExport) continue;
    if (hasDefault && exportName === 'default') return true;
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name?.text === exportName
    )
      return true;
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        (declaration) =>
          (ts.isIdentifier(declaration.name) &&
            declaration.name.text === exportName) ||
          (ts.isArrayBindingPattern(declaration.name) &&
            declaration.name.elements.some(
              (element) =>
                ts.isBindingElement(element) &&
                ts.isIdentifier(element.name) &&
                element.name.text === exportName,
            )),
      )
    )
      return true;
  }
  return false;
};

const importsFor = (source) => {
  const imports = new Map();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const specifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name)
      imports.set(clause.name.text, { specifier, exportName: 'default' });
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const item of clause.namedBindings.elements)
        imports.set(item.name.text, {
          specifier,
          exportName: item.propertyName?.text ?? item.name.text,
        });
    }
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings))
      imports.set(clause.namedBindings.name.text, {
        specifier,
        exportName: '*',
      });
  }
  return imports;
};

const property = (object, name) =>
  object.properties.find(
    (item) =>
      ts.isPropertyAssignment(item) &&
      (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) &&
      item.name.text === name,
  );

const jsxComponent = (node, imports) => {
  let found;
  const visit = (current) => {
    if (found) return;
    if (
      ts.isJsxOpeningElement(current) ||
      ts.isJsxSelfClosingElement(current)
    ) {
      const tag = current.tagName;
      if (ts.isIdentifier(tag) && imports.has(tag.text)) found = tag.text;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
};

const tokenNames = (repoRoot) => {
  const names = new Set();
  const tokenRoot = path.join(
    repoRoot,
    'packages/twenty-design-tokens/src/source',
  );
  const flatten = (value, prefix = []) => {
    if (value && typeof value === 'object' && '$value' in value)
      names.add(prefix.join('.'));
    else if (value && typeof value === 'object')
      for (const [key, child] of Object.entries(value))
        if (!key.startsWith('$')) flatten(child, [...prefix, key]);
  };
  for (const filePath of walk(tokenRoot, (file) => file.endsWith('.json')))
    flatten(JSON.parse(read(filePath)));
  return names;
};

const evidenceFor = (componentPath, repoRoot, knownTokens) => {
  const files = [componentPath];
  const source = sourceFile(componentPath);
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const resolved = resolveFile(
      componentPath,
      statement.moduleSpecifier.text,
      repoRoot,
    );
    if (resolved && STYLE_EXTENSIONS.includes(path.extname(resolved)))
      files.push(resolved);
  }
  const tokens = new Set();
  for (const filePath of files) {
    const contents = read(filePath);
    if (STYLE_EXTENSIONS.includes(path.extname(filePath)))
      for (const match of contents.matchAll(/\{([a-zA-Z][\w.-]+)\}/g))
        tokens.add(match[1]);
    for (const match of contents.matchAll(
      /(?:token\(['\"]|data-token=["'])([a-zA-Z][\w.-]+)/g,
    ))
      tokens.add(match[1]);
  }
  const invalid = [...tokens].filter((token) => !knownTokens.has(token));
  if (invalid.length)
    throw new Error(
      `${path.relative(repoRoot, componentPath)} references unknown DTCG token(s): ${invalid.join(', ')}`,
    );
  return [...tokens].sort();
};

const componentFromExpression = (expression, imports) => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression))
    return jsxComponent(expression.body, imports);
  return undefined;
};

const indexStory = (storyPath, repoRoot, knownTokens) => {
  const contents = read(storyPath);
  const ignored = contents.match(/\/\/\s*storybook-atlas:\s*ignore\s+(.+)/);
  if (ignored)
    return {
      story: path.relative(repoRoot, storyPath),
      excluded: ignored[1].trim(),
    };
  const source = sourceFile(storyPath);
  const imports = importsFor(source);
  let meta;
  const objects = new Map();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      )
        objects.set(declaration.name.text, declaration.initializer);
    }
  }
  for (const statement of source.statements) {
    if (!ts.isExportAssignment(statement)) continue;
    if (ts.isObjectLiteralExpression(statement.expression))
      meta = statement.expression;
    if (ts.isIdentifier(statement.expression))
      meta = objects.get(statement.expression.text);
  }
  if (!meta)
    throw new Error(
      `${path.relative(repoRoot, storyPath)} has no default Meta object; add a justified storybook-atlas ignore comment`,
    );
  const candidates = [];
  const metaComponent = property(meta, 'component');
  if (metaComponent)
    candidates.push(
      componentFromExpression(metaComponent.initializer, imports),
    );
  if (
    !metaComponent ||
    !ts.isIdentifier(metaComponent.initializer) ||
    !imports.has(metaComponent.initializer.text)
  ) {
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (
          !declaration.initializer ||
          !ts.isObjectLiteralExpression(declaration.initializer)
        )
          continue;
        const render = property(declaration.initializer, 'render');
        if (render)
          candidates.push(componentFromExpression(render.initializer, imports));
      }
    }
  }
  const jsxNames = new Set();
  const collectJsxNames = (node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      imports.has(node.tagName.text)
    )
      jsxNames.add(node.tagName.text);
    ts.forEachChild(node, collectJsxNames);
  };
  collectJsxNames(source);
  if (
    !metaComponent ||
    !ts.isIdentifier(metaComponent.initializer) ||
    !imports.has(metaComponent.initializer.text)
  )
    candidates.push(...jsxNames);
  const names = [
    ...new Set(
      candidates
        .filter(Boolean)
        .map((name) => {
          if (imports.has(name)) return name;
          const local = source.statements
            .filter(ts.isVariableStatement)
            .flatMap((statement) => statement.declarationList.declarations)
            .find(
              (declaration) =>
                ts.isIdentifier(declaration.name) &&
                declaration.name.text === name,
            );
          return local?.initializer
            ? componentFromExpression(local.initializer, imports)
            : undefined;
        })
        .filter((name) => {
          const imported = imports.get(name);
          return (
            imported &&
            (imported.specifier.startsWith('.') ||
              imported.specifier.startsWith('@ui') ||
              imported.specifier.startsWith('~/') ||
              imported.specifier.startsWith('@/') ||
              imported.specifier.startsWith('twenty-ui'))
          );
        }),
    ),
  ];
  if (!names.length)
    throw new Error(
      `${path.relative(repoRoot, storyPath)} has no resolvable meta.component or render JSX component; add a justified storybook-atlas ignore comment`,
    );
  const components = names.map((name) => {
    const imported = imports.get(name);
    if (!imported)
      throw new Error(
        `${path.relative(repoRoot, storyPath)} component ${name} is not imported`,
      );
    const componentPath = resolveFile(storyPath, imported.specifier, repoRoot);
    if (!componentPath)
      throw new Error(
        `${path.relative(repoRoot, storyPath)} cannot resolve import ${imported.specifier} for ${name}`,
      );
    if (!exported(componentPath, imported.exportName, repoRoot))
      throw new Error(
        `${path.relative(repoRoot, storyPath)} cannot resolve export ${imported.exportName} from ${path.relative(repoRoot, componentPath)}`,
      );
    return {
      name,
      export: imported.exportName,
      file: path.relative(repoRoot, componentPath),
      tokens: evidenceFor(componentPath, repoRoot, knownTokens),
    };
  });
  return { story: path.relative(repoRoot, storyPath), components };
};

const createAtlas = (repoRoot) => {
  const knownTokens = tokenNames(repoRoot);
  const entries = [];
  const uiRoot = path.join(repoRoot, 'packages/twenty-ui/src');
  const frontRoot = path.join(repoRoot, 'packages/twenty-front/src');
  for (const storyPath of walk(uiRoot, (file) => STORY_RE.test(file)))
    entries.push({
      scopes: ['twenty-ui'],
      ...indexStory(storyPath, repoRoot, knownTokens),
    });
  for (const storyPath of walk(frontRoot, (file) => STORY_RE.test(file))) {
    const relative = path
      .relative(frontRoot, storyPath)
      .split(path.sep)
      .join('/');
    const scope = relative.startsWith('pages/')
      ? 'pages'
      : relative.includes('/perf/')
        ? 'performance'
        : relative.startsWith('modules/')
          ? 'modules'
          : 'default';
    entries.push({
      scopes: ['twenty-front:all', `twenty-front:${scope}`],
      ...indexStory(storyPath, repoRoot, knownTokens),
    });
  }
  return stable({
    configuredScopes: [
      'twenty-ui',
      'twenty-front:all',
      'twenty-front:pages',
      'twenty-front:modules',
      'twenty-front:performance',
      'twenty-front:ui-docs',
    ],
    stories: entries.sort((left, right) =>
      left.story.localeCompare(right.story),
    ),
    tokenSource: 'packages/twenty-design-tokens/src/source',
  });
};

module.exports = { createAtlas, indexStory, resolveFile, tokenNames };
