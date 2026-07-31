---
type: change-proposal
title: "Change Proposal: mercado-publico-workspace-redesign"
description: "Native, truthful Mercado Público workspace composition over existing read contracts."
okf_version: "0.1"
---

# Change Proposal: mercado-publico-workspace-redesign

## Why

`mercado-publico-command-center` established the read-only route, GraphQL
reads, and data boundary. Its UI specification still permits bespoke browse,
detail, and monitoring presentation that the validated prototype proves can be
replaced by a smaller, more native Twenty composition. This change makes that
replacement implementation-ready without re-opening ingestion or inventing
facts.

## Investigation / Current State

- The validated Storybook prototype covers Compra Ágil, Licitaciones, and
  Centro de Control in light/dark, desktop/mobile, keyboard, 200%, and reduced
  motion states; its fresh audit has no duplicate IDs, document overflow,
  normal-text contrast failure, or page error.
- Existing reads already support the approved browse fields, family-specific
  detail, and factual monitoring. Missing data is a null/partial state, not a
  license for fixture values, zeroes, or inferred metrics.
- Native controls, tags, feedback, page shell, and global desktop/mobile
  SidePanel exist. The only retained local compositions should be the semantic
  Mercado Público browse and monitoring tables.

## What Changes

- Replace the Mercado Público presentation requirements of
  `mercado-publico-command-center` when this change is applied. That earlier
  change remains authoritative for its backend reads, GraphQL shape,
  ingestion/CLI boundary, and unresolved resolver-environment validation.
- Implement one domain-local browse/detail grammar for Compra Ágil and
  Licitaciones: six supported browse columns, explicit keyboard row activation,
  server pagination, truthful unavailable states, and native SidePanel detail.
- Implement Centro de Control as one calm, read-only sequence of Diagnóstico,
  Investigación, and Integridad with one mounted heavy investigation table.
- Remove bespoke filter, detail-overlay, and duplicated table presentation only
  after the replacement passes focused behavior, Storybook, and visual parity.

## Successor Authority Matrix

| Legacy requirement | Authority after this change |
| --- | --- |
| `/mercado-publico`, its three URL-hash tabs, read-only behavior, current GraphQL/DTO reads, server pagination, null/partial truth, and CLI-only ingestion | Retained from `mercado-publico-command-center` |
| State, publication-from/to, exact buyer-code, and changed-since filters; sorting by observation, publication, closing, process code, or canonical state in either direction | Retained behavior and stated normatively by this successor |
| Applied filter/page context, keyboard activation, native focus return, and truthful full-value text | Retained behavior and verified at the replacement seam |
| Bespoke filter chrome, fixed detail overlay/focus trap, compact-list mobile presentation, duplicated monitoring wrappers, and current Control Center composition | Replaced by this successor |
| Backend expansion, new visible fields or metrics, ingestion changes, and the predecessor's unresolved resolver-environment validation | Outside this change; predecessor authority/risk remains explicit |

## Change Profile

- Profile: `runtime-change`
- Why this profile fits: the visible route behavior and SidePanel integration
  change, even though the existing backend read contract does not.

## Out Of Scope

- GraphQL/DTO, database, migration, ingestion, scheduler, retry, permission,
  or provider-contract changes.
- New dependencies, design-token families, generic procurement/data-grid
  abstractions, global page state, or a second application shell.
- Free-text or buyer-name search; new browse columns/filters/sorts; dashboard
  KPIs; freshness/quality/coverage scores; document downloads; and any value
  unsupported by the current read DTOs.

## Impact

- Affects `twenty-front` Mercado Público components, page integration, tests,
  and isolated stories; may affect `twenty-shared` only for an approved
  SidePanel page type.
- Affects no server contract, migration, provider, or runtime write path.
- Requires focused frontend Nx typecheck/test and Storybook visual/a11y checks;
  build `twenty-shared` first only if its SidePanel type is touched.

## Ownership and Test Seam

- Highest existing Seam: the authenticated `/mercado-publico` page consuming
  existing typed hooks and opening the global `SidePanelRouter`.
- Owning Module: `packages/twenty-front/src/modules/mercado-publico/`, with
  page ownership in `src/pages/mercado-publico/`; shared SidePanel registration
  remains the owner of desktop/mobile hosting.
- Interface: existing typed read-hook outputs, URL hash, selected family/code,
  and `SidePanelRouter`; components do not know SQL, raw payloads, or fixtures.
- Highest test Seam: `MercadoPublicoCommandCenterPage` plus focused component/
  hook tests that observe rendered fields, focus return, query inputs, and
  null/partial behavior.
- Adapter: a thin domain adapter maps selected family/code into the registered
  SidePanel page; no data adapter or generic table layer is added.
- Depth / Leverage / Locality: one page-level composition improves all three
  views while retaining native layout, focus, and responsive behavior.

## Prior Art and First Proof

- Prior art: validated prototype stories, `MercadoPublicoCommandCenterPage`
  tests, `MainAppLayoutWithSidePanel`, and the existing Mercado Público hooks.
- First failing behavior or contract proof: current bespoke detail overlay and
  presentation must fail a page test requiring global SidePanel focus return;
  current unavailable list/detail states must fail a test if stale fixture
  detail remains visible; current monitoring must fail if two heavy tables are
  mounted or a partial response becomes zero.

## Execution Order Decision

- Required: yes.
- Why: Compra Ágil proves the first vertical browse/detail slice. Licitaciones
  follows and extracts only the exact common browse seams encountered there.
  Centro de Control may proceed independently after scope lock. Final parity
  and closeout wait for all three surfaces.

## Verification Policy

- Add failing-first, behavior-level frontend tests before replacing each
  presentation seam. Preserve the existing backend contract tests as the proof
  that values remain supported.
- Validate focused Jest, `nx typecheck twenty-front`, and Storybook interaction/
  visual coverage. Re-run the cross-surface audit at desktop/mobile, both
  themes, keyboard, 200%, and reduced motion.
- The implementation gate uses the real SidePanel host/state in page-level
  tests plus automated ARIA, keyboard, focus, and Storybook coverage. An
  authenticated Docker E2E or manual NVDA/JAWS session is required only by a
  separate release policy, not by this UI replacement.
- Do not treat generic full-suite success as proof of data truth or focus/
  responsive parity.

## Notes

- Context: wayfinding evidence lives in
  `.scratch/mercado-publico-workspace-redesign/` and is frozen as historical
  evidence. These OpenSpec artifacts are the sole active implementation
  authority; derived PRD/tickets are not manually synchronized.
- Assumptions: the existing command-center GraphQL queries and route are
  available to this implementation; an absent supported datum stays explicit.
- Boundaries: this is a successor UI authority only. A desired backend field or
  behavior requires a separate OpenSpec change before it is rendered.
