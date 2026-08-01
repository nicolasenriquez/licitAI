---
type: change-spec
title: "Spec: storybook-ai-ui-context"
description: "Specification for Storybook as the source of truth for AI-generated product UI in the Twenty Codex plugin workflow."
okf_version: "0.1"
---
# Spec: storybook-ai-ui-context

## ADDED Requirements

### Requirement: Storybook is the product UI source of truth

The AI Layer SHALL treat the actual `twenty-ui` Storybook configuration,
colocated stories, component exports, and token sources as the authoritative
evidence for generating product UI.

#### Scenario: Existing Storybook component matches the request

- **WHEN** an agent finds an existing `twenty-ui` component or composition that
  covers the requested UI behavior
- **THEN** the agent SHALL reuse that component and cite the relevant export and
  Storybook story before proposing new visual code

#### Scenario: No existing Storybook component matches

- **WHEN** no existing primitive or composition covers the request
- **THEN** the agent SHALL classify the need as reusable, app-specific, or
  hybrid and SHALL propose a reusable `twenty-ui` component with Storybook
  stories before creating a feature-local visual fork for reusable behavior

### Requirement: AI UI work follows a canonical context order

The AI-facing workflow SHALL route UI work through repository rules, the
product design register, token governance, `twenty-ui` package guidance,
Storybook configuration, the relevant story/component files, and the consuming
application seam in that order, loading only the references relevant to the
request.

#### Scenario: Agent starts a product front-component task

- **WHEN** an agent is asked to create or modify product UI
- **THEN** it SHALL identify the product visual register, read the Storybook AI
  reference, and inspect the relevant `twenty-ui` stories before implementation

#### Scenario: Agent receives a marketing UI task

- **WHEN** the target is the marketing visual register
- **THEN** the agent SHALL use the marketing design contract and SHALL NOT apply
  the product `twenty-ui` Storybook workflow by default

### Requirement: UI generation is token-first and composition-first

Generated product UI SHALL prefer existing `twenty-ui` components, props,
compositions, icons, and semantic `themeCssVariables`/design-token paths before
introducing local styling or visual constants.

#### Scenario: Existing token or component prop expresses the decision

- **WHEN** a requested color, spacing, typography, border, radius, shadow,
  motion, icon, table, or state treatment exists in the product system
- **THEN** the generated plan SHALL use that token or component contract and
  SHALL NOT introduce an equivalent raw value

#### Scenario: No token expresses a shared semantic role

- **WHEN** a new semantic visual role is required across more than one consumer
- **THEN** the agent SHALL route the need through token contribution and review
  rather than hardcoding a global value in an application component

### Requirement: Every generated UI has Storybook evidence

Every new or materially changed reusable UI Module SHALL have a colocated
Storybook story that demonstrates the intended composition, visible states, and
relevant interaction behavior before the UI is considered complete.

#### Scenario: Component has stateful or interactive behavior

- **WHEN** a component exposes interaction, focus, keyboard, loading, empty,
  error, disabled, selected, success, or responsive behavior
- **THEN** its Storybook stories SHALL cover the relevant states and SHALL use
  `play` interaction checks where behavior is observable

#### Scenario: Component is consumed by an app front component

- **WHEN** an app front component consumes product UI
- **THEN** it SHALL use the supported `twenty-sdk/ui` runtime seam and its UI
  plan SHALL cite the source `twenty-ui` story/component evidence

### Requirement: AI-generated UI plans are traceable and gated

Before implementation, an AI-generated UI plan SHALL record the visual
register, selected Storybook stories and component exports, token paths,
runtime import seam, visible states, and the validation commands required for
the change.

#### Scenario: Plan is ready for implementation

- **WHEN** the agent presents a plan for a product UI change
- **THEN** a reviewer SHALL be able to trace every visual decision to an
  existing Storybook/token source or to an explicitly proposed reusable gap

#### Scenario: UI implementation is complete

- **WHEN** the implementation changes product UI
- **THEN** verification SHALL include the relevant Storybook browser tests,
  a11y checks, build/test proof, and visual/size gates required by the affected
  package, with exceptions documented rather than silently skipped

### Requirement: AI context documentation remains coherent

The Twenty Codex plugin SHALL validate that the Storybook AI reference exists,
is linked from the `develop-app` skill, preserves the existing split between
visual, runtime, and layout guidance, and links to the durable product design
contract.

#### Scenario: Context reference is missing or disconnected

- **WHEN** a required Storybook AI reference or route is removed or renamed
- **THEN** the plugin validator SHALL fail with the missing contract location

#### Scenario: Context reference is updated

- **WHEN** the Storybook AI reference changes
- **THEN** the plugin validator and its unit test SHALL verify the required
  source links, routing fragments, and guidance split before the plugin is
  considered valid

### Requirement: External design guidance is assessed against local evidence

The AI Layer SHALL treat external or upstream-derived design markdown as
non-normative reference material and SHALL record which guidance is adopted,
adapted, or excluded before it affects the local workflow.

#### Scenario: External guidance proposes a local capability

- **WHEN** an external document names a component, registry, Storybook feature,
  source path, version, or product capability
- **THEN** the local workflow SHALL verify it against configured Storybook,
  exports, tokens, and repository contracts before presenting it as available

### Requirement: Capability discovery remains source-derived

The AI Layer SHALL use configured Storybook story globs, public exports, and
canonical product tokens as its capability atlas and SHALL NOT maintain a
parallel persisted component, token, pattern, or chart registry.

#### Scenario: A requested capability has no local evidence

- **WHEN** no relevant Storybook story or supported source seam is found
- **THEN** the agent SHALL record an explicit gap and propose the appropriate
  story-first addition instead of inferring public availability
