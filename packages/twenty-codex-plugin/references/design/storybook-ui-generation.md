# Storybook UI Generation

Use this reference for product UI discovery before creating or changing a front
component. It adapts the durable contract at
`docs/design/storybook-ui-source-of-truth.md`; it does not replace runtime,
layout, or detailed visual guidance.

## Preflight

1. Identify the product register; marketing work follows the marketing contract
   and does not use this workflow by default.
2. Read token governance and `packages/twenty-ui/README.md`.
3. Inspect `packages/twenty-ui/.storybook/main.ts`, then the relevant reusable
   story and public export.
4. When the request is a product composition, inspect the scoped surface in
   `packages/twenty-front/.storybook/main.ts` and its owning module.
5. Read `front-components.md` for runtime/import rules, `layout.md` for
   placement, and `front-component-ui.md` for detailed visual guidance.

## Selection algorithm

- Reuse an existing `twenty-ui` primitive, prop, icon, or composition first.
- Reuse a documented app composition only in its owning product context; it is
  not a `twenty-ui` primitive by default.
- When no fit exists, classify it as reusable, app-specific, or hybrid. Propose
  a story-first `twenty-ui` addition for reusable presentational behavior.
- Use product semantic tokens or `themeCssVariables` before raw colors,
  spacing, typography, borders, radii, shadows, or state values.
- Treat unsupported charts, tables, feedback patterns, and states as gaps, not
  as permission to invent a parallel visual language.

## Required plan trace

Before implementation, record the product register, story paths and exports
inspected, selected component or explicit gap, token paths, runtime import
seam, visible states, and affected validation commands.

For a reusable UI change, add or update a colocated story with relevant
interaction and accessibility evidence. Use deterministic fixtures, dates,
network mocks, and reset global state. Run the affected Storybook browser,
a11y, build, visual, and size gates when implementing UI.

## Atlas boundary

Configured Storybook story globs, exports, and
`packages/twenty-design-tokens/src/source/product/` are the capability atlas.
No generated registry is maintained by this plugin. Do not assume Storybook MCP
is configured; use repository discovery unless a separate change adds it.

Run `npx nx run twenty-codex-plugin:validate` in this repository to verify the
derived atlas. The installed plugin's `validate` command deliberately checks
only its own package; repository Storybook and documentation contracts require
`validate --repo-root <repository-path>`. Use `--report` with that mode when a
stable JSON inspection result is useful, and never commit its output.

The evidence is limited to the primary component plus immediate style imports;
it does not claim a transitive dependency graph. A story with no indexable
component must declare `// storybook-atlas: ignore <reason>` directly in the
story. The exception is local and audited: missing imports, exports, tokens, or
an empty reason fail the repository gate.
