## Context

The product UI has three different knowledge surfaces that must remain
distinct but connected:

1. `docs/design/` is the durable human contract for the product visual
   register, token governance, interaction rules, and accessibility baseline.
2. `packages/twenty-ui` is the reusable UI Module. Its Storybook stories,
   component exports, theme setup, interaction tests, a11y setup, and visual
   gates are executable evidence of what can be reused.
3. `packages/twenty-codex-plugin` is the AI-facing Adapter. Its `develop-app`
   skill and references are the Interface an agent reads before creating an
   app front component.

The current plugin already separates visual guidance
(`front-component-ui.md`) from runtime/import guidance
(`front-components.md`) and placement guidance (`layout.md`). The missing
seam is an explicit Storybook-first workflow that tells the AI Layer how to
discover an existing primitive or composition, how to use tokens, when to
propose a reusable component, and what proof is required before a UI change
is considered consistent.

The design must preserve the product/marketing register split, the
`twenty-sdk/ui` runtime import boundary for app front components, the existing
Storybook test/visual gates, and the token source-of-truth hierarchy.

## Goals / Non-Goals

**Goals:**

- Make Storybook the executable source of truth for product UI generation.
- Give AI agents a short, deterministic reading order and decision algorithm.
- Keep human design intent, token authority, component implementation, and AI
  adaptation in their proper Modules.
- Require traceability from generated UI plans to concrete Storybook stories,
  `twenty-ui` exports, token paths, and validation commands.
- Make the no-existing-component case explicit: propose a reusable
  `twenty-ui` component and stories before adding a feature-local visual seam.
- Add validator coverage so the AI context cannot silently lose its Storybook
  routing or source links.

**Non-Goals:**

- Rewriting the existing `front-component-ui.md` visual vocabulary.
- Creating a manually curated catalog that can drift from Storybook.
- Changing Storybook configuration, component APIs, tokens, CSS, or visual
  baselines.
- Building a product-AI runtime integration or workspace MCP behavior.
- Applying the workflow automatically to existing application code in this
  change.

## Boundary and Ownership

### Durable design contract

- **Module:** `docs/design/storybook-ui-source-of-truth.md`.
- **Interface:** the human-readable policy for product UI source selection,
  token authority, Storybook story expectations, and quality gates.
- **Owner:** design-system and frontend maintainers.
- **Seam:** `docs/design/index.md`, which is the canonical entrypoint for the
  product visual register.

This document explains intent and authority. It must link to the actual
Storybook and token sources instead of copying their component inventories or
values.

### AI context adapter

- **Module:** `packages/twenty-codex-plugin/references/design/storybook-ui-generation.md`.
- **Interface:** an agent-executable preflight, selection algorithm, context
  order, output trace, and verification checklist.
- **Owner:** Codex plugin maintainers.
- **Adapter:** the reference adapts the durable design contract to the
  `develop-app` skill without becoming a second UI library or story catalog.
- **Seam:** `packages/twenty-codex-plugin/skills/develop-app/SKILL.md`.

### Executable evidence

- **Module:** `packages/twenty-ui` Storybook and source tree.
- **Interface:** public subpath exports, colocated story titles, story args,
  decorators, play functions, theme setup, and Nx validation targets.
- **Owner:** `twenty-ui` maintainers.
- **Seam:** the relevant component export and `src/**/__stories__` files.

The AI Layer must inspect this Module when choosing a component. The durable
and AI documents explain how to read it; neither replaces it.

## Decisions

### 1. Use a two-layer documentation model

Create one human-facing source contract and one AI-facing adapter.

Rationale: the human document needs durable design language and governance,
while the plugin reference needs concise operational instructions and exact
agent routing. Combining them would make both too shallow or too large.

Alternatives considered:

- Put all guidance in `front-component-ui.md`.
  - Rejected because that reference is intentionally design-only and its
    validator protects that boundary.
- Put all guidance in `AGENTS.md`.
  - Rejected because it would make the root contract noisy and would mix
    product design detail with repository routing rules.
- Create a separate manually maintained component catalog.
  - Rejected because it would become a competing source of truth.

### 2. Make the actual Storybook tree the discovery authority

The AI reference will instruct agents to search the relevant `twenty-ui`
subpath, story title, component export, and token references before proposing
new UI. Any generated plan records those concrete references.

Rationale: Storybook contains the executable states and composition evidence;
the AI context should point to it rather than freeze a duplicate inventory.

### 3. Make the no-fit path reusable-by-default

When no existing primitive or composition fits, the agent must classify the
need as either reusable, app-specific, or hybrid. Reusable and hybrid
presentational behavior is proposed for `twenty-ui` with stories first; only
domain-bound behavior remains in the application package.

Rationale: this prevents feature-local visual forks while preserving the
library/application ownership split documented by `twenty-ui`.

### 4. Make token selection and Storybook proof part of the agent output

Every UI plan must state: visual register, chosen components, token paths,
states, Storybook story references, runtime import seam, and validation plan.

Rationale: a checklist alone is shallow; explicit output fields make the
workflow observable and reviewable before code is written.

### 5. Validate the context contract through the existing plugin validator

Extend the existing reference and cross-document validators rather than
introducing a second validation framework. Add required fragments and a unit
test for the new Storybook reference and its link from `develop-app`.

Rationale: the plugin already has `assertReferences`,
`assertFrontComponentGuidance`, and validator tests, giving this change a
high-leverage existing test Seam.

### 6. Treat the external markdown as assessed reference, not authority

Record the external upstream snapshot and its adoption matrix in the change and
durable contract. Keep verified local files authoritative. Adopt its discovery,
ownership, determinism, accessibility, and quality-gate guidance; adapt charts
and patterns as source-backed taxonomy; reject persisted registries, assumed
versions/paths, Storybook MCP, and migration scope.

### 7. Keep the capability atlas validator-derived

The plugin validator checks that the adapter names the durable contract,
configured `twenty-ui` and `twenty-front` Storybook seams, product token source,
and no-registry/MCP boundaries. It does not emit JSON, parse every export, or
promise that a dependency is public UI capability.

## Risks / Trade-offs

- **[Documentation drift]** The human contract can become stale relative to
  Storybook or token sources. → Keep inventories and token values out of the
  document; link to source files and use plugin link/fragment validation.
- **[Context overload]** More required reading can make agents slower. → Keep
  the AI reference concise, route only relevant subpaths, and distinguish
  mandatory preflight from on-demand references.
- **[False certainty]** Documentation cannot guarantee that generated code is
  visually correct. → Require Storybook build/test, a11y, visual diff, and
  size gates for future UI implementation; human review remains required.
- **[Library pressure]** Requiring reusable components for every visual gap can
  overgrow `twenty-ui`. → Use the existing generic/app-specific/hybrid triage
  and require a real reuse seam before adding a library component.
- **[Register confusion]** Marketing UI may accidentally consume product
  Storybook guidance. → Make product vs marketing register selection the first
  context decision and keep marketing explicitly out of scope.

## Migration Plan

1. Add the durable Storybook source-of-truth document and route it from the
   design index.
2. Add the concise AI adapter reference under the plugin's design references.
3. Update `develop-app/SKILL.md` to route front-component UI work through the
   adapter, while retaining the existing runtime, layout, and visual reference
   split.
4. Extend plugin reference/cross-document validation and its unit test with the
   new contract.
5. Validate the documentation path, plugin validator, and plugin tests.

Rollback is deletion/reversion of the new documentation and validator
fragments. No runtime migration, data migration, Storybook baseline migration,
or API compatibility step is required.

## Verification Strategy

- The documentation validator proves the AI adapter exists, is routed from
  `develop-app`, and links the durable contract and executable Storybook seam.
- A source review confirms no manually maintained component inventory or copied
  token values were introduced.
- A context walk-through follows the exact path an agent will use:
  repository rules → design index → durable Storybook contract → plugin
  adapter → `front-components.md` / `front-component-ui.md` / `layout.md` →
  actual `twenty-ui` story and component files.
- Future UI changes remain responsible for Storybook's own browser, a11y,
  visual, and size proof; this proposal validates the routing contract only.

## Open Questions

- Whether the future AI Layer should receive a generated Storybook index at
  runtime, or whether repository search over colocated stories remains
  sufficient. This proposal deliberately avoids a parallel catalog until a
  measured discovery problem exists.
- Whether Storybook's light/dark coverage should be made a formal CI gate in a
  later runtime change. The current proposal documents the requirement but
  does not alter Storybook configuration.
