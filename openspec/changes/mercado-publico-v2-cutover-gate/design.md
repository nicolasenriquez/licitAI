## Context

G4 must make V2 canonical while preserving a reversible previous path. The
highest existing seam is frontend route composition: `AppRouter` reads the
build-time flag and `useCreateAppRouter` mounts authenticated routes. Current
V2 code already owns `/mercado-publico`; historical command-center code was
removed, so G4 restores only that explicitly selected legacy module under a
private alias.

## Goals / Non-Goals

**Goals**
- Expose an authenticated private legacy alias for parity and rollback.
- Select exactly one complete canonical composition per build.
- Preserve V2 evidence and durable operational records during route rollback.
- Produce complete, reviewable local release-gate evidence before G5.

**Non-Goals**
- Improve, redesign, or repair legacy command-center behavior.
- Delete any legacy or V2 code, data, or migration.
- Build a runtime rollout service or change remote deployment authority.

## Boundary and Ownership

### Route composition

`AppRouter` and `useCreateAppRouter` own canonical and private-route selection.
Their Interface is a boolean build-time V2 choice with these invariants:

- enabled: canonical `/mercado-publico` mounts V2; private
  `/mercado-publico/legacy` mounts retained legacy;
- disabled: canonical `/mercado-publico` mounts retained legacy; private alias
  also mounts retained legacy;
- no view combines V2 and legacy components;
- V2 subroutes remain available only in enabled builds;
- direct routes remain behind the normal authenticated application layout.

The Vite environment value is the Adapter. This seam has high Leverage and
Locality: one route table decides selection without creating a second flag
system, remote switch, data adapter, or service facade. G5 owns contraction.

### Retained legacy adapter

The retained source is `MercadoPublicoCommandCenterPage` at historical commit
`fbf6b573ab` and only its compilation-required local imports. Its Interface is
an unchanged authenticated command-center view at `/mercado-publico/legacy`.
It includes the historical read-only GraphQL resolver and its seven query
documents: detected processes, process detail, job runs, API call log, pipeline
health, API quota usage, and CSV file health. It is an Adapter, not a renewed
legacy product contract. Any unsupported or failing legacy dependency is an
explicit G4 blocker; do not replace its reads, invent fixtures, add mutations,
or expand into Browse, V1/CSV redesign, or new GraphQL behavior.

### Release evidence

The isolated Mercado Publico E2E harness owns local browser evidence. Its
Interface accepts clean Compose state, production-like build flags, real analyst
and operator sessions, and sanitized V2 fixtures supplied through SyncRun. It
captures screenshots, traces, console/network assertions, and review records.
Daily-cycle observation is an operational evidence adapter around existing G3
SyncRun/audit records, not a new scheduler or data model.

## Decisions

1. Preserve legacy at a private alias, not a second deployment.

   Rationale: parity and rollback occur against one authenticated deployment and
   one controlled route seam.

   Alternatives considered:
   - Dual deployments.
     - Rejected because it cannot prove route switch and rollback in one runtime.
   - Disable V2 with no retained route.
     - Rejected because it fails Issue 30's previous-path requirement.

2. Use historical `MercadoPublicoCommandCenterPage` only.

   Rationale: human selection narrows retained scope to one historical owner.

   Alternatives considered:
   - Restore the broader Browse workspace.
     - Rejected because it widens G4 into V1/CSV and GraphQL behavior.
   - Build a new legacy facsimile.
     - Rejected because a new implementation cannot prove rollback compatibility.

3. Keep cutover build-time and atomic at route-table level.

   Rationale: existing `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` already has this
   behavior. One build selects one canonical composition, preventing mixed views.

   Alternatives considered:
   - Per-route or per-component switching.
     - Rejected because it can mix implementations in one user view.
   - Remote runtime flag.
     - Rejected because it adds deployment and authorization scope without need.

4. Treat daily cycles and visual review as evidence gates, not new product code.

   Rationale: Issue 31 requires human-reviewed and operationally observed proof.
   G4 records repeatable procedure and evidence locations; it does not fake
   completion through unit tests.

5. End live legacy rollback when G5 starts.

   Rationale: a live legacy route and zero-consumer retirement cannot coexist.
   The final G4 release record supplies one immutable approved release tag
   for G5 rollback instead.

   Alternatives considered:
   - Keep the live legacy route through G5.
     - Rejected because its dependency closure prevents retirement.
   - Keep the live legacy route indefinitely.
     - Rejected because it leaves two production paths without a retirement end.

6. Use a read-only legacy smoke, not V1-to-V2 parity comparison.

   Rationale: the retained page is a temporary rollback adapter. A successful
   authenticated read journey and clean browser evidence prove it is usable
   without making V1 output a renewed product contract.

   Alternatives considered:
   - Compare selected legacy and V2 fields.
     - Rejected because it expands G4 into V1/CSV contract work.
   - Require full feature and data parity.
     - Rejected because G4 does not restore the full legacy product surface.

7. Restore the complete historical read-only query set.

   Rationale: the unchanged command-center page imports seven read-only query
   documents. Restoring the complete set preserves its selected behavior without
   adding a new API or mutation.

   Alternatives considered:
   - Restore only list and detail and remove Centro de Control.
     - Rejected because it changes the selected rollback page.
   - Restore only list and detail and leave Centro de Control broken.
     - Rejected because a rollback surface must not contain a known failing tab.

## Route Matrix

| Build flag | `/mercado-publico` | `/mercado-publico/legacy` | V2 subroutes |
| --- | --- | --- | --- |
| `true` | V2 Activas | retained legacy | mounted |
| `false` | retained legacy | retained legacy | absent |

During G4, rollback sets the build flag to `false`, deploys that complete build,
then executes the authenticated canonical and private-alias smoke. It does not
run a migration, transform V1/CSV, delete `mp` evidence, or delete G3
command/audit records. Re-enable repeats the same deployment and smoke sequence
with `true`. When G5 starts, rollback deploys the immutable G4-approved release
tag recorded at G4 closeout.

## Blast Radius

### Touched runtime areas
- Frontend route composition, shared path declaration, restored legacy module
  subtree, isolated E2E route checks, and release operations documentation.

### Untouched runtime areas
- `mp` schema and migrations, V2 GraphQL namespace, provider integration, V2
  projections/evidence, durable SyncRun service, G3 control service, commands,
  queue workers, and authorization.

## Verification Strategy

- Fail-first router proof asserts enabled and disabled canonical selections,
  private-alias availability, absent disabled V2 subroutes, and no mixed route
  tree.
- Isolated authenticated Playwright runs canonical V2, private legacy, disabled
  canonical legacy, and restored enabled canonical V2. The legacy route proves
  one authenticated read-only journey without V1-to-V2 field comparison: open
  Compra Ágil, open one process detail, then close it without losing list
  context. It records screenshot, trace, console/network checks, and
  preservation queries for V2 evidence and latest SyncRun/audit state before
  and after rollback.
- Run existing lifecycle, evidence, analytics, security, navigation, and G3
  control proofs with the complete local harness. Record results rather than
  reimplement their contracts.
- Run existing backend V2 publication-window cycles for 12 and 13 August 2026
  with `tamano_pagina: 50`. Record each requested source window and durable
  SyncRun/cohort/checkpoint/projection/watermark evidence. Page size does not
  assert an exact returned-record count. A human reviews every changed visual
  baseline and records reason and result.
- Cloud smoke remains optional and only runs after explicit URL, identity,
  authorization, and allowed data are supplied.
