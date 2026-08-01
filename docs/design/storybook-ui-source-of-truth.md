---
type: design-contract
title: "Storybook UI Source of Truth"
description: "Product UI discovery and evidence contract for Storybook, tokens, and reusable components."
okf_version: "0.1"
---
# Storybook UI Source of Truth

## Authority order

For product UI, use this order of evidence:

1. Repository and task rules.
2. The `product` design register and token governance.
3. `packages/twenty-ui` public exports and package guidance.
4. The configured Storybook surfaces:
   `packages/twenty-ui/.storybook/main.ts` for reusable UI and
   `packages/twenty-front/.storybook/main.ts` for application compositions.
5. The relevant story, component source, and consuming application seam.

Storybook is executable evidence, not a replacement for runtime import rules.
App front components consume supported UI through `twenty-sdk/ui`; they do not
import `twenty-ui` directly.

## Discovery and ownership

Search existing stories, exports, and product patterns before creating visual
code. Reuse an existing `twenty-ui` primitive or composition whenever it fits.
When it does not fit, classify the work as reusable, app-specific, or hybrid:

- Reusable behavior belongs in `twenty-ui` with a colocated story.
- App-specific behavior stays in the owning `twenty-front` or app module.
- Hybrid behavior separates a reusable presentational core from an app-wired
  wrapper only when the reuse seam is real.

Product Storybook compositions are evidence for product work, but are not a
`twenty-ui` primitive merely because they have a story. A dependency in the
source tree is likewise not a public capability.

## Tokens and evidence

The canonical token source is `packages/twenty-design-tokens/src/source/`.
Use the product register and semantic tokens before raw visual values; retain
the existing `themeCssVariables` compatibility surface when its documented API
expresses the decision. Follow `token-governance.md` and
`token-contribution.md` when a shared semantic role is missing.

Every material reusable UI change needs Storybook evidence for its visible and
interactive states. Cover the states that apply: loading, empty, error,
disabled, selection, focus/keyboard, success, responsive constraints, and
light/dark presentation. Use deterministic data, dates, network mocks, and
state reset for browser and visual evidence. Future implementation must run the
affected Storybook browser, a11y, build, visual, and size gates rather than
substituting a documentation check.

## Derived capability atlas

The AI-facing atlas is source-derived. Its taxonomy may describe inputs, data
display, feedback, composition, tables, and charts, but availability is proven
by configured story globs, public exports, and canonical tokens. Do not add a
manual `COMPONENT_REGISTRY.json`, `TOKEN_REGISTRY.json`,
`PATTERN_REGISTRY.json`, or `CHART_CAPABILITIES.json`.

If no story demonstrates a capability or required state, treat it as unavailable
for direct reuse and propose a story-first addition in the correct layer. Do
not assume Storybook MCP is configured; repository discovery remains the
required path until a separate infrastructure change adopts it.

## External reference assessment

`TWENTY_DESIGN_SYSTEM_AI_LAYER.md` was assessed as an external upstream
snapshot, not a normative repository source. This contract adopts its
Storybook-first, token-first, ownership, determinism, accessibility, and
quality-gate principles where verified locally. It intentionally excludes its
suggested persisted registries, assumed paths/versions, Storybook MCP, UI
migration programme, and chart capability contracts until separately verified
and proposed.

## Verifiable atlas

The repository gate derives a temporary atlas at validation time:

```bash
npx nx run twenty-codex-plugin:validate
node packages/twenty-codex-plugin/scripts/validate.js --repo-root . --report
```

`--report` writes stable JSON to stdout only; it is an inspection surface, not
a generated file to commit. The atlas resolves configured `twenty-ui` and all
`twenty-front` Storybook scopes, `meta.component` and render JSX, the matching
local export, and direct token references in the primary component and its
immediate style imports. It intentionally does not infer transitive component
or token usage.

A story that cannot be indexed must state a local, deliberate exception:

```ts
// storybook-atlas: ignore <reason>
```

Missing imports, exports, token names, or an unreasoned exclusion fail CI.
