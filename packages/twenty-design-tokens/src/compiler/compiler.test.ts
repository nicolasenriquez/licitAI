import {
  compileTokenRegistry,
  renderCss,
  renderFigmaBundle,
  renderTypeScript,
} from './compiler';
import { validateTokenDocuments } from './validate';
import {
  checkLegacyParity,
  getLegacyParityVariableError,
  readLegacyThemeManifest,
} from './legacy-parity';
import { renderLegacyCssVariableReferences } from './legacy-parity';
import { tokenRecords } from './source-records';

const primitives = {
  color: {
    white: {
      $type: 'color',
      $value: '#ffffff',
      $description: 'White primitive.',
    },
    black: {
      $type: 'color',
      $value: '#000000',
      $description: 'Black primitive.',
    },
  },
  spacing: {
    1: {
      $type: 'dimension',
      $value: { value: 4, unit: 'px' },
      $description: 'Base spacing step.',
    },
  },
} as const;

const records = {
  primitives,
  product: {
    common: {
      spacing: {
        1: {
          $type: 'dimension',
          $value: '{primitives.spacing.1}',
          $description: 'Product base spacing.',
        },
      },
    },
    light: {
      background: {
        primary: {
          $type: 'color',
          $value: '{primitives.color.white}',
          $description: 'Primary product surface in light mode.',
        },
      },
    },
    dark: {
      background: {
        primary: {
          $type: 'color',
          $value: '{primitives.color.black}',
          $description: 'Primary product surface in dark mode.',
        },
      },
    },
  },
  marketing: {
    common: {},
    light: {
      surface: {
        primary: {
          $type: 'color',
          $value: '{primitives.color.white}',
          $description: 'Primary marketing surface in light mode.',
        },
      },
    },
    muted: {
      surface: {
        primary: {
          $type: 'color',
          $value: '{primitives.color.white}',
          $description: 'Primary marketing surface in muted mode.',
        },
      },
    },
    dark: {
      surface: {
        primary: {
          $type: 'color',
          $value: '{primitives.color.black}',
          $description: 'Primary marketing surface in dark mode.',
        },
      },
    },
  },
} as const;

describe('design token compiler', () => {
  it('accepts valid aliases and preserves mode parity', () => {
    expect(validateTokenDocuments(records)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('rejects an alias that does not exist', () => {
    const invalidRecords = {
      ...records,
      product: {
        ...records.product,
        light: {
          ...records.product.light,
          background: {
            primary: {
              $type: 'color',
              $value: '{primitives.color.missing}',
              $description: 'Invalid alias.',
            },
          },
        },
      },
    };

    expect(validateTokenDocuments(invalidRecords).valid).toBe(false);
    expect(validateTokenDocuments(invalidRecords).errors.join('\n')).toContain(
      'does not exist',
    );
  });

  it('rejects cyclic aliases', () => {
    const cyclicRecords = {
      primitives: {
        cycle: {
          first: {
            $type: 'color',
            $value: '{primitives.cycle.second}',
            $description: 'Cycle entry.',
          },
          second: {
            $type: 'color',
            $value: '{primitives.cycle.first}',
            $description: 'Cycle entry.',
          },
        },
      },
      product: records.product,
      marketing: records.marketing,
    };

    expect(validateTokenDocuments(cyclicRecords).valid).toBe(false);
    expect(validateTokenDocuments(cyclicRecords).errors.join('\n')).toContain(
      'cycle',
    );
  });

  it('rejects mode drift', () => {
    const modeDriftRecords = {
      ...records,
      product: {
        ...records.product,
        dark: {},
      },
    };

    expect(validateTokenDocuments(modeDriftRecords).valid).toBe(false);
    expect(
      validateTokenDocuments(modeDriftRecords).errors.join('\n'),
    ).toContain('mode parity');
  });

  it('renders deterministic public adapters', () => {
    const registry = compileTokenRegistry(records);
    const css = renderCss(registry, 'product');
    const typescript = renderTypeScript(registry, 'product');
    const figma = renderFigmaBundle(registry, 'product');

    expect(css).toContain('--t-background-primary: #ffffff;');
    expect(css).toContain('.dark {');
    expect(typescript).toContain('productCssVariables');
    expect(figma).toContain('"$value": "{primitives.color.white}"');
    expect(renderCss(registry, 'product')).toBe(css);
  });

  it('keeps the imported legacy product baseline unchanged', () => {
    expect(checkLegacyParity()).toEqual([]);
  });

  it('rejects a protected variable missing from generated CSS', () => {
    expect(
      getLegacyParityVariableError(
        'light',
        '--t-background-primary',
        '#ffffff',
        undefined,
      ),
    ).toBe('light generated CSS is missing --t-background-primary');
  });

  it('captures the complete legacy variable name/value baseline', () => {
    const manifest = readLegacyThemeManifest();
    const lightNames = Object.keys(manifest.light);
    const darkNames = Object.keys(manifest.dark);

    expect(lightNames.length).toBeGreaterThan(100);
    expect(darkNames).toEqual(lightNames);
  });

  it('keeps the marketing register independent from product semantics', () => {
    const css = renderCss(compileTokenRegistry(tokenRecords), 'marketing');

    expect(css).toContain('--t-marketing-surface-primary: #f4f4f4;');
    expect(css).toContain('--t-marketing-text-primary: #1c1c1c;');
    expect(css).toContain(
      '--t-marketing-font-family-sans: var(--font-sans), sans-serif;',
    );
  });

  it('generates a complete flat compatibility reference adapter', () => {
    const references = renderLegacyCssVariableReferences();

    expect(references).toContain('legacyCssVariableReferences');
    expect(references).toContain(
      '"--t-background-primary": "var(--t-background-primary)"',
    );
    expect(references).toContain('"--t--illustration-icon-color-blue"');
  });
});
