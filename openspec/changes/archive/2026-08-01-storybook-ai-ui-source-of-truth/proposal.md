## Why

The repository already treats `twenty-ui` and Storybook as the product UI's
component and visual-quality seam, but the AI Layer currently receives that
knowledge through several partially overlapping documents. Without one
explicit workflow, an agent can invent a new visual pattern, use raw values,
or build a feature-specific component when an existing Storybook component and
token already solve the problem.

This change establishes Storybook as the executable source of truth for UI
generation and adds a narrow AI-facing context adapter so every generated UI
starts from the existing component catalog, tokens, stories, and validation
gates. It is needed before expanding AI-generated product surfaces, because
consistency must be enforced at the generation seam rather than repaired by a
later redesign.

The AI context will only be reliable if the repository's existing domain
history is also routed correctly. Mercado Público is a concrete example: its
knowledge is distributed across durable business, architecture, and operations
documents, active changes, and archived OpenSpec artifacts. Before the AI
context is implemented, that history needs to be classified and reincorporated
into the canonical documentation topology so the AI can distinguish current
repository truth from historical evidence, superseded decisions, and
change-local implementation records.

## Investigation / Current State

- `packages/twenty-ui/.storybook/` defines the primary Storybook configuration,
  global theme context, a11y gate, Vitest browser setup, and Argos integration.
- `packages/twenty-ui/src/**/__stories__/` colocates stories with reusable
  components; the catalog uses typed `Meta`/`StoryObj`, decorators, args,
  interaction tests, and combinatorial catalog stories.
- `packages/twenty-ui` is the reusable product UI library; app-defined front
  components consume its public UI through `twenty-sdk/ui`.
- `docs/design/design-system.md`,
  `packages/twenty-codex-plugin/references/design/front-component-ui.md`, and
  `packages/twenty-codex-plugin/references/develop-app/front-components.md`
  already contain valuable guidance, but the AI workflow is not yet explicit
  about Storybook discovery, component selection, story-first delivery, or
  refusal to invent a parallel visual language.
- Existing OpenSpec capabilities cover procurement, repository routing, and
  documentation adoption; none owns AI-driven Storybook UI generation.

## What Changes

- Add a durable product-design contract that names Storybook as the executable
  UI source of truth and defines the discovery, selection, token, story, and
  validation workflow.
- Add an AI-facing Storybook UI reference under the Twenty Codex plugin that
  compresses the workflow into agent-executable preflight and handoff rules.
- Route `develop-app` front-component work through that reference while keeping
  `front-component-ui.md` as the detailed visual vocabulary and
  `front-components.md` as the runtime/import contract.
- Define the component-selection rule: reuse an existing `twenty-ui` primitive
  or composition first; if no suitable seam exists, propose a reusable
  `twenty-ui` component with its Storybook stories before adding an
  app-specific visual implementation.
- Define a context hierarchy that points agents from repository rules to the
  design register, token governance, `twenty-ui` package guidance, Storybook
  configuration, relevant story files, and the consuming application seam.
- Define a proof-of-consistency checklist covering light/dark themes, keyboard
  and a11y behavior, loading/empty/error/disabled/success states, responsive
  constraints, tokens, visual diff, and size/test gates.
- Add documentation validation and link checks for the new AI context so the
  plugin does not ship a broken or contradictory Storybook workflow.
- Keep runtime behavior, component APIs, token values, Storybook infrastructure,
  and application UI unchanged in this proposal-only change.

## Added Scope: Historical Documentation Reincorporation

This proposal additionally covers the documentation work required to make the
AI Layer's context trustworthy before implementation begins. It is additive to
the Storybook source-of-truth work and does not authorize a broad rewrite of
the repository's documentation.

The alignment pass will:

- Inventory relevant knowledge across `docs/`, active OpenSpec changes,
  `openspec/changes/archive/`, and the repository history where provenance is
  needed.
- Classify each artifact as current canonical truth, historical decision or
  evidence, superseded guidance, duplicate/conflicting material, or a
  change-local implementation record.
- Use the existing documentation topology as the destination: Mercado Público
  business and source semantics belong under `docs/business/`, architecture and
  data-boundary decisions under `docs/architecture/`, operator procedures under
  `docs/operations/`, and product UI/design guidance under `docs/design/` only
  when it is genuinely design-system or product-interface knowledge.
- Reincorporate durable, still-valid knowledge into the appropriate canonical
  document or index, with additive frontmatter, normalized headings, routing
  links, explicit ownership/status, and provenance to the originating change or
  source when needed.
- Keep archived OpenSpec artifacts as historical records. They must remain
  reachable and must not be rewritten to appear current; the AI reading path
  must consult them as history rather than silently treating them as active
  instructions.
- Resolve conflicts explicitly by documenting the current rule, linking the
  superseded or historical material, and preserving the reason for the change.
  No silent selection of one conflicting document is allowed.
- Use Mercado Público as the first concrete alignment case, including the
  existing source contract, ingestion context, data-model constraints,
  operator runbook, related active changes, and archived ingestion decisions.

The historical alignment is complete only when the relevant Mercado Público
knowledge has a clear canonical route, historical artifacts remain traceable,
the AI-facing reading order distinguishes current from historical material, and
no substantive information is lost through relocation or normalization.

## Added Scope: Storybook Capability and Token Atlas

The documentation will also expose the complete set of UI capabilities that are
actually available to the AI Layer, with enough context to choose and compose
them correctly. This includes reusable components, product-level compositions,
data visualizations, feedback patterns, and the token families that govern their
appearance.

The atlas will have two explicit levels:

- `packages/twenty-ui`: the reusable product UI library, including its
  primitives and compositions for input, navigation, data display, feedback,
  layout, surfaces, typography, icons, and related states.
- `packages/twenty-front` and other configured product Storybook surfaces: the
  application-level compositions and feature components that already have
  stories, including record tables, table layouts, field inputs/displays,
  page/layout widgets, graph widgets, and product-specific feedback. These are
  available for product composition but are not automatically promoted to
  generic reusable library components.

At minimum, the capability map will cover the existing Storybook families when
present in the source:

- Tables and data display: table and record-table patterns, columns, filters,
  sorting, pagination, selection, empty/loading/error states, rows, cells,
  status, tags, chips, avatars, links, and detail displays.
- Charts and visualization: aggregate/KPI charts, bar charts, pie or donut
  charts, line charts, legends, tooltips, responsive behavior, data limits,
  loading, empty, unavailable, and error states.
- Feedback and transient UI: snackbars, banners, callouts, information
  messages, progress indicators, loaders, confirmation states, and recovery
  states. This includes the repository's snackbar pattern when the request
  refers to “knackbars”.
- Inputs and interaction: buttons, icon buttons, button groups, checkboxes,
  toggles, radios, selects, search, text areas, date inputs, pickers, tabs,
  menus, and keyboard/focus behavior.
- Composition and structure: cards, modals, side panels, navigation bars,
  drawers, separators, sections, resize handles, expandable containers,
  responsive layouts, and page-level compositions.
- Design tokens: semantic and primitive colors, light/dark modes, typography,
  spacing, sizing, borders, radii, shadows/elevation, icon treatment, and
  state-specific roles such as success, warning, danger, info, disabled, hover,
  focus, selected, and unavailable.

Each atlas entry will expose, or link directly to, the package and layer,
canonical component name, Storybook story path, public import seam, composition
level, supported variants and states, responsive/a11y coverage, relevant token
families, and usage restrictions. The AI must be able to answer both “what is
available?” and “which existing component should I use for this UI need?”

The atlas will be source-derived rather than a manually maintained duplicate
catalog. Storybook story files, Storybook configuration scopes, public exports,
and the canonical token source remain authoritative. The documentation adds
taxonomy, selection rules, and decision context; it does not copy component
implementations, token values, or an independent list that can drift.

The AI selection rules will include the following examples:

- Use a line chart for temporal trends, a bar chart for category comparison, a
  pie/donut chart for bounded part-to-whole relationships, and an aggregate/KPI
  pattern for a summarized value; confirm the corresponding Storybook story
  exists before implementation.
- Use the existing table or record-table composition for structured records and
  preserve its documented loading, empty, error, pagination, sorting, filter,
  selection, and responsive behavior.
- Use the existing snackbar/feedback composition for transient user feedback;
  do not invent a parallel notification pattern or encode arbitrary colors.
- Select colors, spacing, borders, radii, typography, and states through the
  canonical semantic tokens and theme modes, never through new raw visual
  values chosen by the AI.
- If a capability or state is not represented by an existing Storybook story,
  mark it as unavailable for direct reuse and propose a story-first addition to
  the appropriate layer before using it in product UI.

The atlas is a validator-derived discovery contract, not a generated registry.
It validates the configured Storybook surfaces, durable source links, and
plugin routing without persisting component, token, pattern, or chart JSON.
Deep story-to-export coverage and new capability-family enforcement remain a
future dedicated change because they require a parser and CI contract beyond
this documentation-governance scope.

## External Reference Assessment

`C:\\Users\\nenri\\Downloads\\TWENTY_DESIGN_SYSTEM_AI_LAYER.md` is a useful
upstream-derived reference, but it is not repository authority. This change
adopts its verified principles—Storybook-first discovery, token-first styling,
reusable-versus-app triage, deterministic stories, accessibility, and quality
gates. It adapts charts and product patterns into on-demand discovery taxonomy.
It excludes its persisted JSON registries, assumed source paths and versions,
Storybook MCP, migration programme, and public capability claims until a
separate local change verifies and owns them.

## Capabilities

### New Capabilities

- `storybook-ai-ui-context`: Defines the documented and agent-consumable
  workflow for generating product UI from Storybook, `twenty-ui`, and the
  canonical token system. It also includes the source-derived capability and
  token atlas described above.

### Modified Capabilities

- None. No existing OpenSpec requirement is changed; this introduces a new
  documentation and AI-governance capability.

## Impact

- Affects durable design documentation under `docs/design/` and its index.
- Affects the published Twenty Codex plugin's `develop-app` skill and design
  references, including plugin validation expectations.
- Affects future AI-generated UI work in `packages/twenty-front`, app front
  components, and consumers of `twenty-ui`/`twenty-sdk/ui`.
- Affects the durable documentation route for domain context, with Mercado
  Público as the first historical-alignment case across business,
  architecture, operations, and archived OpenSpec material.
- Affects the AI-facing discovery model for reusable components,
  application-level compositions, tables, charts, feedback patterns, and
  design-token families exposed by the configured Storybook surfaces.
- Does not change Storybook runtime configuration, component implementations,
  design tokens, public exports, APIs, or application behavior.
- Does not apply to the marketing design register, which remains separate from
  the product UI register.

## Change Profile

- Profile: docs-or-governance-change
- Why this profile fits: the change establishes source-of-truth and agent
  operating contracts without changing runtime behavior or component APIs.

## Ownership and Test Seam

- Highest existing Seam: the `develop-app` skill and its design/reference
  documents, where an AI agent is routed before it creates a front component.
- Historical-documentation Seam: `docs/index.md`, `docs/README.md`, and the
  repository's OKF authoring rules, where domain context is routed before the
  AI adapter consumes it.
- Owning Module: `packages/twenty-codex-plugin` as the AI-facing adapter over
  the product design system.
- Interface: the required reading order, component-selection algorithm,
  capability-atlas lookup, token/story rules, and validation checklist an agent
  must follow.
- Capability-atlas Seam: the configured Storybook story globs and the canonical
  token source, which provide observable evidence for what is available and how
  it is intended to be used.
- Highest test Seam: plugin validation plus a documentation contract test that
  proves the skill links the Storybook context and preserves the existing
  front-component guidance split.
- Adapter: a new `storybook-ui-generation.md` plugin reference; it adapts the
  durable design contract to agent-readable instructions without becoming a
  second component catalog.
- Depth / Leverage / Locality: a small AI-facing interface hides the larger
  Storybook and token system, gives every future UI task the same leverage, and
  keeps source-of-truth changes local to design docs, plugin references, and
  their validators.

## Prior Art and First Proof

- Prior art: `front-component-ui.md`, `front-components.md`, `design-system.md`,
  `twenty-ui/README.md`, the colocated Storybook stories, and the plugin's
  `assertFrontComponentGuidance` validator.
- Historical-documentation prior art: `docs/README.md`, `docs/index.md`,
  `docs/standards/okf-standard.md`, `docs/operations/okf-authoring-guide.md`,
  the Mercado Público documents under `docs/business/`,
  `docs/architecture/`, and `docs/operations/`, plus the active and archived
  Mercado Público OpenSpec artifacts.
- First failing behavior or contract proof: a documentation contract test
  fails when `develop-app` no longer routes UI work through the Storybook AI
  reference, or when the reference points at a missing source-of-truth file.
- The historical-alignment proof fails when a canonical Mercado Público route
  is missing, a historical artifact is orphaned, a current document silently
  contradicts a retained decision, or the AI reading path cannot distinguish
  current guidance from archived evidence.
- The capability-atlas proof fails when an available Storybook story is not
  discoverable, its import seam is unclear, a token family has no documented
  role, or the guide presents an app-specific composition as a reusable
  `twenty-ui` primitive.
- No runtime fail-first test is required because this proposal changes only
  documentation, agent routing, and governance contracts.

## Execution Order Decision

- Required: yes
- Why: the work has multiple dependent slices: durable contract first, AI
  adapter second, plugin routing/validation third, then coherence checks.

## Out Of Scope

- Rebuilding or redesigning `twenty-ui` components.
- Changing Storybook runtime, addons, visual baselines, or token values.
- Adding a manually maintained duplicate component catalog.
- Persisting `COMPONENT_REGISTRY.json`, `TOKEN_REGISTRY.json`,
  `PATTERN_REGISTRY.json`, or `CHART_CAPABILITIES.json`.
- Assuming Storybook MCP is installed or changing Storybook configuration to
  adopt it.
- Introducing a new UI framework, CSS system, Figma-to-code pipeline, or
  marketing design guidance.
- Rewriting, deleting, or flattening archived OpenSpec history; adding a new
  `log.md` history surface; or silently changing the substantive meaning of an
  existing durable document.
- Treating the capability atlas as an independent manually curated component
  catalog; it must remain generated or validated from Storybook, exports, and
  canonical tokens.
- Automatically modifying AI-generated application code during this proposal.

## Verification Policy

- Verify that every new/modified document points to the canonical source rather
  than duplicating component inventories or token values.
- Run the plugin validator and its unit tests after the documentation contract
  is implemented.
- Re-read the final context path as an agent would and confirm that it leads to
  Storybook stories, tokens, component exports, and validation commands.
- Do not substitute a successful Markdown link check for Storybook's own visual,
  a11y, interaction, or size gates when a future UI implementation is made.

## Notes

- Context: Storybook is the executable evidence layer; `twenty-ui` is the
  reusable product UI module; `docs/design` is the human design contract; the
  Codex plugin is the AI context adapter.
- Historical-context rule: current durable documentation is the AI's default
  domain context; archived OpenSpec artifacts provide provenance and rationale,
  not active instructions. Mercado Público is the initial proof case for this
  rule.
- Capability-context rule: the atlas explains the available UI vocabulary, but
  Storybook stories, public exports, and canonical tokens remain the executable
  source of truth. The atlas must distinguish reusable primitives from
  app-level compositions and must show unavailable gaps rather than encourage
  invention.
- Assumptions: existing Storybook structure and token APIs remain the current
  product register; future changes should update the source contract before
  broadening agent behavior.
- Boundaries: the proposal targets developer-AI context, not the product AI
  runtime or workspace MCP data boundary.
