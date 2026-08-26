## Why

Mercado Publico V2 supports process lookup, but its filter hierarchy, detail
state, error recovery, and technical presentation do not yet support a clear
path from public evidence to CRM investigation. The product audit found five
P1 issues, including stale detail state and no explicit, idempotent CRM action.

## Investigation / Current State

- Existing URL state already preserves filters, sort, cursor, and selected
  process through `useMercadoPublicoV2UrlState`.
- The active page, filter bar, side-panel detail, and history route already own
  the required read behavior; this change should deepen those seams rather than
  add parallel pages.
- Detail-local tab, relation cursor, payload, and error state is not reset by
  `codigo`; detail errors have no local `refetch` action.
- Existing Playwright contracts cover URL navigation, pagination, table states,
  detail, and accessibility, but not process-switch reset, 320 px panel use, or
  CRM conversion.
- No CRM mutation or durable workspace-plus-code identity exists. Opportunity
  has no Mercado Publico source fields, so generic upsert cannot provide the
  required idempotency.

## What Changes

- Recompose Procesos filters into five primary controls and three intent-based
  advanced groups without changing URL or GraphQL filter keys.
- Reset detail transient state by process code, add local retry, expose factual
  summary information, keep three primary tabs, and move sanitized technical
  data into a collapsed disclosure.
- Keep History inside the side panel and restore its prior detail tab and
  scroll context on return.
- Add an authenticated `markMercadoPublicoV2ForInvestigation` mutation that
  creates or recovers one Opportunity per workspace and process code.
- Add optional Mercado Publico process-code and source-URL fields to Opportunity
  and a core mapping with unique workspace-plus-code identity. A deleted mapped
  Opportunity is replaced while the first `markedAt` remains stable.
- Add responsive, focus, alert, localization, and state-language closure for
  desktop, 320 px, 200 percent zoom, light theme, and dark theme.

## Capabilities

### New Capabilities

- `mercado-publico-v2-process-workspace`: Procesos filtering, result, detail,
  responsive, accessibility, and recovery behavior.
- `mercado-publico-v2-crm-investigation`: Idempotent Opportunity creation,
  mapping, mutation states, and CRM navigation.

### Modified Capabilities

- `mercado-publico-v2-history-and-buyers`: History opens as a contextual detail
  subview and restores the prior panel state on return.

## Change Profile

- Profile: mixed-change
- Why this profile fits: UI behavior, GraphQL contract, Opportunity metadata,
  and durable persistence change; the product audit remains durable source
  context and is updated only during release closeout.

## Out Of Scope

- Compradores and synchronization-control behavior.
- Viability, priority, probability, margin, ROI, scoring, recommendation, or
  any derived commercial judgment.
- Buyer Company creation or linkage.
- Changes to existing filter parameter names, list query semantics, source
  ingestion, relation data, or raw-history persistence.
- A full-detail route, dashboard, parallel design system, or new UI library.

## Ownership and Test Seam

- Highest existing Seam: Procesos route and side-panel behavior in
  `MercadoPublicoV2ActivePage`, `MercadoPublicoV2FilterBar`, and
  `SidePanelMercadoPublicoV2OpportunityPage`; authenticated Mercado Publico
  GraphQL resolver behavior for CRM marking.
- Owning Module: `twenty-front` Mercado Publico page and side-panel modules;
  `twenty-server` Mercado Publico module for mapping and orchestration;
  standard Opportunity metadata for source fields.
- Interface: existing URL keys and read GraphQL fields remain stable; new
  mutation returns `codigo`, `crmRecordId`, `created`, and `markedAt`.
- Highest test Seam: Playwright UI contracts for user-visible behavior and
  server resolver/service tests for mutation, permissions, transaction, and
  concurrency behavior.
- Adapter: Apollo adapts GraphQL state to the panel; Common API record creation
  adapts Mercado Publico facts to Opportunity; a core mapping is idempotency
  authority.
- Depth / Leverage / Locality: existing route and panel seams preserve caller
  contracts; one Mercado Publico service owns conversion policy; mapping avoids
  embedding source identity in generic CRM upsert behavior.

## Prior Art and First Proof

- Prior art: URL-state and filter component Jest tests; `detail-panel.spec.ts`,
  `active-url-navigation.spec.ts`, `active-pagination-and-states.spec.ts`, and
  `active-accessibility.spec.ts`; Mercado Publico resolver and read-service
  Jest suites.
- First failing behavior or contract proof: switch from a process with paged
  relation and visible payload to another process, then assert Summary,
  `after: null`, hidden payload, and no stale content; retry a failed detail in
  the same panel. Mutation tests first prove concurrent same-workspace calls
  return one CRM identity and different workspaces remain isolated.

## Execution Order Decision

- Required: yes
- Why: seven slices span UI, schema, persistence, API, client integration, and
  accessibility; CRM UI is blocked by its backend contract, while independent
  UI correction slices can proceed after their fail-first proofs.

## Impact

- Affects `packages/twenty-front`, `packages/twenty-server`,
  `packages/twenty-e2e-testing`, Opportunity metadata, GraphQL schema and
  generated client types, and one generated fast instance command.
- Adds no runtime dependency and changes no Mercado Publico read schema.

## Verification Policy

- Add each external-behavior proof before its production change.
- Generate, do not hand-author, the instance command for schema changes; include
  `up` and `down` behavior.
- Verify focused Jest and Playwright seams, changed-file lint, package
  typechecks, GraphQL compatibility, and OpenSpec validation.
- Attach visual evidence only after behavior passes automated checks.

## Notes

- Context: normalized from
  `docs/design/mercado-publico-v2-product-design-audit.md` and
  `docs/design/mercado-publico-v2-ui.md`.
- Decisions: create Opportunity through existing CRM record APIs; persist
  minimal factual name, amount, close date, process code, and source URL; create
  no buyer; replace a deleted mapped Opportunity; keep History in panel.
- Assumptions: `created` means this invocation created a CRM record; repeated
  healthy mapping returns `created: false`; `markedAt` records first successful
  mark and is not changed by repeats or replacement.
- Boundaries: Opportunity create permission is required in addition to existing
  workspace authentication; all mapping reads and writes are workspace scoped.
- No implementation SDLC map exists for this change.
