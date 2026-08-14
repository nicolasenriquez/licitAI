## Why

Mercado Publico V2 currently replaces the canonical `/mercado-publico` route
when its build-time flag is enabled. No retained legacy route exists, so the
required authenticated parity smoke and immediate route rollback cannot occur
from one deployment.

## Investigation / Current State

- `AppRouter` reads `REACT_APP_MERCADO_PUBLICO_V2_ENABLED`; `useCreateAppRouter`
  conditionally mounts V2 routes at canonical `/mercado-publico` and its V2
  subroutes.
- Historical commit `fbf6b573ab` owns the prior
  `MercadoPublicoCommandCenterPage` and its dependencies. It was removed by
  `ef0b97a3af`.
- The V2 baseline smoke and isolated authenticated V2 suites already establish
  flag-aware routing, roles, fixtures, screenshots, traces, and provider-call
  denial. They do not prove a legacy alias, atomic cutover, or daily gate.
- G3 supplies durable SyncRun control, cancellation, audit, and operator/analyst
  access. This change does not modify that contract.

## What Changes

- Restore only the historical command-center module and its required retained
  dependencies at private `/mercado-publico/legacy`, including its seven
  historical read-only GraphQL queries and generated documents.
- Make the build-time V2 flag choose one complete canonical composition at
  `/mercado-publico`: V2 when enabled; legacy when disabled. Keep the private
  legacy alias mounted in both builds throughout the G4 observation window.
- Add authenticated parity and rollback proof for canonical V2, canonical legacy,
  and private legacy alias. Preserve `mp` evidence, V2 projections, SyncRuns,
  commands, attempts, and audit without data conversion or deletion.
- Define an evidence-backed G4 release gate: complete local harness, reviewed
  visual evidence, demonstrated rollback, and two consecutive daily V2 cycles.

## Capabilities

### New Capabilities

- `mercado-publico-v2-cutover-gate`: atomic canonical route selection, retained
  private legacy alias, reversible cutover, and G4 release evidence.

### Modified Capabilities

- None.

## Change Profile

- Profile: runtime-change
- Why this profile fits: route selection changes authenticated product behavior
  and release authority.

## Out Of Scope

- Reworking legacy behavior, its V1/CSV GraphQL contracts, or its UI.
- Deleting the legacy alias, legacy consumers, V1/CSV services, CSS, stories,
  prototypes, migrations, V2 evidence, or G3 audit. G5 owns retirement.
- Cloud smoke without explicit URL, identity, authorization, and allowed data.
- Runtime remote flagging, per-user rollout, provider calls from browser requests,
  and changes to V2 ingestion, read, or control contracts.

## Ownership and Test Seam

- Highest existing Seam: authenticated browser routes mounted by `AppRouter` and
  `useCreateAppRouter`.
- Owning Module: `packages/twenty-front/src/modules/app` route composition.
- Interface: `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` selects exactly one canonical
  route composition; `/mercado-publico/legacy` remains an authenticated private
  alias through G4 observation. When G5 starts, rollback changes to deployment
  of the immutable G4-approved release tag.
- Highest test Seam: isolated authenticated Playwright route smoke with real
  fixture, role, URL, browser network, screenshot, and trace evidence.
- Adapter: Vite build-time environment value passed through `AppRouter` into
  `useCreateAppRouter`.
- Depth / Leverage / Locality: one route-composition seam controls canonical
  selection without modifying V2 services or legacy internals.

## Prior Art and First Proof

- Prior art: `packages/twenty-e2e-testing/tests/mercado-publico/baseline.spec.ts`
  proves flag-aware authenticated V2 routing and
  `packages/twenty-e2e-testing/tests/mercado-publico/sync-control.spec.ts` proves
  isolated operator and analyst V2 behavior.
- First failing behavior or contract proof: before route work, an authenticated
  browser cannot reach `/mercado-publico/legacy`, and a disabled V2 build cannot
  prove a retained previous composition while V2 `mp` evidence remains intact.
  The retained smoke journey reuses historical command-center behavior: open
  Compra Ágil, open one process detail, then close it without losing list context.

## Execution Order Decision

- Required: yes
- Why: route preservation must precede canonical selection; parity and rollback
  proof must precede daily observation and release-gate evidence.

## Impact

- Affects `packages/twenty-front` route composition and a minimal restored legacy
  module subtree.
- Affects `packages/twenty-shared` only for an explicit private alias path.
- Affects `packages/twenty-e2e-testing` isolated authenticated cutover and
  release-gate coverage plus operational evidence documentation.
- Does not affect the `mp` schema, V2 GraphQL API, provider adapter, SyncRun
  orchestration, or G3 authorization contract.

## Verification Policy

- Add fail-first route tests at the AppRouter seam and isolated authenticated
  Playwright proof before route composition changes.
- Prove parity and rollback through browser-visible behavior, real authentication,
  network checks, screenshots, and traces; broad suites do not replace these
  proofs.
- Record two V2 publication-window cycle results for 12 and 13 August 2026 with
  requested page size 50, plus human visual-baseline review, as release
  evidence. This verifies bounded source windows, not elapsed calendar days.

## Notes

- Source map: `.scratch/mercado-publico-v2-reconstruction/implementation-sdlc-map.md`;
  Group: G4.
- Source decisions: Issues 13 and 15; implementation Issues 30 and 31.
- Human decision: retain historical `MercadoPublicoCommandCenterPage` from
  `fbf6b573ab` as temporary private `/mercado-publico/legacy` alias. Do not
  restore broader historical surfaces.
- Human decision: the live legacy rollback ends when G5 starts. The final G4
  release record identifies the immutable approved release tag that G5
  deploys for rollback.
- Human decision: the G4 legacy proof is one authenticated read-only smoke
  journey with browser evidence. It does not compare V1 and V2 fields.
- Human decision: restore all seven historical legacy GraphQL read queries so
  the selected command-center page remains unchanged. G4 restores no mutation.
- Human decision: the operational proof requires one correct V2
  publication-window cycle for each of 12 and 13 August 2026, both with
  `tamano_pagina: 50`. Page size is a request, not an exact returned-record
  count.
- Preconditions: G3 Issue 29 is the declared upstream blocker. G4 implementation
  begins only after its accepted evidence is available.
