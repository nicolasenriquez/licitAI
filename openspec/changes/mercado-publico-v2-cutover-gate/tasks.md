## 0. Investigation and Scope Lock

- [x] 0.1 Verify G3 Issue 29 acceptance evidence, current route table, historical
  `MercadoPublicoCommandCenterPage` at `fbf6b573ab`, and every required retained
  import before restoring code. Verify its seven read-only GraphQL queries and
  stop if any dependency requires a mutation or widens beyond the selected legacy
  module subtree.
  Traceability: Group G4; Slice S1; Issue 30; Scope selected legacy alias and G3 predecessor only.

- [x] 0.2 Record current pre-cutover V2 evidence and G3 latest SyncRun, command,
  attempt, and audit state. Define stable evidence locations and the exact
  enabled-to-disabled-to-enabled rollback runbook. Define the immutable release
  tag that G5 deploys after live legacy rollback ends.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.3, AC 30.4; Scope evidence-preserving rollback.

## 1. Contract Coverage (Failing First)

- [x] 1.1 Add failing AppRouter route-composition tests for both flag values:
  canonical V2 versus canonical legacy, private legacy alias in both builds,
  disabled V2 subroutes, and no mixed composition.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.1.

- [x] 1.4 Add failing resolver and generated-document coverage for the seven
  retained legacy read queries. Prove that no legacy mutation is restored.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.2, AC 30.5.

- [x] 1.2 Add failing isolated authenticated Playwright coverage for enabled
  canonical V2 plus alias smoke, disabled canonical legacy smoke, re-enabled V2
  smoke, and evidence preservation across rollback. The legacy proof is one
  read-only journey with no V1-to-V2 field comparison: open Compra Ágil, open
  one process detail, then close it without losing list context. Capture
  screenshot, trace, console, network, and direct role behavior.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.2, AC 30.3, AC 30.4.

- [x] 1.3 Add failing release-gate harness coverage or evidence assertions that
  aggregate existing lifecycle, evidence, analytics, security, navigation, and
  cutover proof without weakening their owning suites.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.2, AC 31.4, AC 31.6.

## 2. Implementation

### Retained legacy route

- [x] 2.1 Restore historical `MercadoPublicoCommandCenterPage` from `fbf6b573ab`
  and only its compilation-required module subtree. Restore its historical
  read-only resolver, seven query documents, and generated output; add no
  mutation. Add private
  `AppPath.MercadoPublicoLegacy` at `/mercado-publico/legacy`; do not alter
  legacy behavior or restore broader surfaces.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.1, AC 30.5.

- [x] 2.2 Update `AppRouter` and `useCreateAppRouter` so the existing build-time
  flag selects complete canonical V2 or legacy composition while the private
  legacy alias remains mounted in both builds. Keep V2 subroutes enabled-only.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.1, AC 30.5.

### Cutover and rollback proof

- [ ] 2.3 Extend the isolated Mercado Publico fixture and authenticated E2E
  harness for route-matrix smoke, explicit rollback deployment, and before/after
  evidence preservation checks. Do not seed projections directly or introduce
  browser provider calls.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.2, AC 30.3, AC 30.4.

- [x] 2.4 Document exact local cutover, rollback, re-enable, evidence-retention,
  and stop conditions. Keep G5 retirement explicitly prohibited during G4. State
  that G5 rollback deploys the immutable G4-approved release tag.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.4, AC 30.5.

### Operational gate

- [x] 2.5 Add release-gate evidence manifest and runner that invokes existing
  focused lifecycle, evidence, analytics, security, navigation, and cutover
  checks without duplicating their product assertions. Include visual-baseline
  review record format and cloud-smoke precondition check.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.2, AC 31.3, AC 31.4, AC 31.6.

- [x] 2.6 Run and record two bounded representative V2 publication-window cycles
  through the existing backend runner: one for `2026-08-12` and one for
  `2026-08-13`, each with `tamano_pagina: 50`, `max_pages: 3`, and
  `bounded_window: true`. For each, retain the requested window, SyncRun,
  cohort, checkpoint, projection, and watermark evidence. `tamano_pagina` is a
  provider page-size request, not a claim that exactly 50 records are returned.
  Reject G5 authorization on any failed or incomplete cycle.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.1, AC 31.5.

## 3. Verification

- [ ] 3.1 Run focused router, restored-legacy compilation, and route-matrix tests
  for enabled, disabled, rollback, and re-enable states.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.1 through AC 30.5.

- [ ] 3.2 Run isolated authenticated Playwright with analyst and operator sessions
  at desktop 1440, laptop 1280, and mobile 390. Preserve and review screenshots,
  traces, console/network output, keyboard, zoom, reduced-motion, and Axe
  evidence. A human records every visual-baseline decision.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.2, AC 31.3, AC 31.4.

- [ ] 3.3 Run changed-file lint, front/shared/server typechecks, required GraphQL
  codegen check if generated contracts change, formatting, `git diff --check`,
  and focused existing G1-G3 gate suites. Run cloud smoke only when explicit
  authority inputs exist.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.4, AC 31.6.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update operator and E2E documentation with verified route matrix,
  rollback procedure, evidence retention, daily-cycle record, visual review, and
  cloud-smoke preconditions. Do not state G5 approval until evidence is complete.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.5, AC 31.6.

- [ ] 4.2 Create the final G4 release record that explicitly approves or rejects
  G5 based on complete local evidence. Record the immutable approved release
  tag for G5 rollback. Preserve alias and all retained consumers until G5
  begins, regardless of decision.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.1 through AC 31.6.

- [ ] 4.3 Run `openspec validate mercado-publico-v2-cutover-gate` and confirm no
  G5 deletion, V1/CSV refactor, schema, provider, or G3 contract work entered
  the change.
  Traceability: Group G4; Slice S3; Issue 30; Issue 31; Scope artifact validation.

## Execution Order

### Slice 1 — Retained route boundary
- Tasks: `0.1 -> 0.2 -> 1.1 -> 1.4 -> 2.1 -> 2.2`
- Checkpoint: route table exposes private legacy alias and selects exactly one
  canonical composition for each build flag.
- Blocks: Slice 2.

### Slice 2 — Reversible cutover proof
- Tasks: `1.2 -> 2.3 -> 2.4 -> 3.1`
- Checkpoint: authenticated enabled-to-disabled-to-enabled browser smoke proves
  route rollback and unchanged V2/G3 durable evidence.
- Blocked by: Slice 1.
- Blocks: Slice 3.

### Slice 3 — Operational release gate
- Tasks: `1.3 -> 2.5 -> 2.6 -> 3.2 -> 3.3 -> 4.1 -> 4.2 -> 4.3`
- Checkpoint: complete local harness, reviewed visual evidence, two correct daily
  cycles, and final G4 approval/rejection record exist without deleting legacy.
- Blocked by: Slice 2.
- Blocks: None.

## Progress

- 2026-08-13: Started tasks 3.1, 3.2, and 3.3. Running focused route and
  restored-legacy checks first, then isolated browser evidence and required
  package validation. Full browser proof remains subject to the existing
  isolated Compose preflight; cloud smoke remains excluded without authority
  inputs.
- 2026-08-13: Started task 0.1. Inspecting G3 Issue 29 evidence, current route composition, and historical retained-module dependency closure.
- 2026-08-13: Completed task 0.1. G3 Issue 29 is done: all five acceptance
  criteria pass in `.scratch/mercado-publico-v2-reconstruction/issues/29-operar-cancelacion-y-exclusion-mutua.md`;
  `openspec/changes/mercado-publico-v2-sync-operations/tasks.md` records focused
  proof, lint, typecheck, codegen, and OpenSpec validation. Current
  `AppRouter.tsx` passes `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` to
  `useCreateAppRouter.tsx`, which mounts only V2 canonical and subroutes when
  enabled; `AppPath.ts` has no legacy alias. Historical `fbf6b573ab` mounts
  `MercadoPublicoCommandCenterPage` at canonical route and requires only its
  command-center page, `modules/mercado-publico` components/hooks/utils, seven
  query documents/fragments, generated GraphQL output, and server read resolver
  plus DTO/read-service closure. Verified seven query-only operations: detected
  processes, process detail, job runs, API call log, pipeline health, API quota
  usage, CSV file health. No historical Mercado Publico mutation exists. Scope
  remains selected legacy subtree; no restore performed in this task.
- 2026-08-13: Started task 0.2. Capturing pre-cutover V2 and G3 durable-state
  evidence, then defining evidence locations and rollback procedure.
- 2026-08-13: Completed task 0.2. Recorded read-only local Compose baseline in
  `pre-cutover-evidence.md`: runtime is healthy, V2 durable tables contain zero
  rows, and current image predates G3 control schema, so no SyncRun, command,
  attempt, or audit record exists. Defined stable evidence locations, read-only
  before/after capture query, enabled-to-disabled-to-enabled deploy-only
  runbook, stop conditions, and protected G5 rollback tag contract. No runtime,
  database, flag, build, or deployment change was made.
- 2026-08-13: Started task 1.1. Adding fail-first route-composition coverage at
  the `useCreateAppRouter` seam for the enabled and disabled build matrices.
- 2026-08-13: Completed task 1.1. Added
  `packages/twenty-front/src/modules/app/hooks/__tests__/useCreateAppRouter.test.tsx`.
  Focused Jest is red as intended: enabled build lacks private legacy alias and
  disabled build lacks canonical legacy. Tests assert one canonical route, V2
  canonical plus alias and subroutes when enabled, legacy canonical plus alias
  and no V2 subroutes when disabled. `npx nx typecheck twenty-front` and
  `npx nx lint:diff-with-main twenty-front` pass.
- 2026-08-13: Started task 1.4. Adding fail-first coverage for the selected
  legacy resolver and all seven historical read query documents.
- 2026-08-13: Completed task 1.4. Added failing contract proofs in
  `packages/twenty-server/src/engine/core-modules/mercado-publico/__tests__/mercado-publico-legacy-query-contract.spec.ts`
  and
  `packages/twenty-front/src/modules/mercado-publico/__tests__/mercado-publico-legacy-query-documents.spec.ts`.
  Focused Jest is red as intended: the legacy resolver module and all seven
  generated query documents are absent. Both package typechecks fail only on
  those missing task 2.1 artifacts. `npx nx lint:diff-with-main twenty-front`
  passes; server diff lint exhausted memory before analysis.
- 2026-08-13: Started task 2.1. Restoring the selected historical legacy
  command-center compilation closure, seven reads, generated output, and private
  path only.
- 2026-08-13: Completed task 2.1. Restored `MercadoPublicoCommandCenterPage`,
  its required module subtree, the historical seven read-only query documents,
  resolver, DTO/read-service closure, and `AppPath.MercadoPublicoLegacy`.
  Preserved V2 generated output and added historical legacy generated output in
  `packages/twenty-front/src/generated/mercado-publico-legacy.graphql.ts`.
  Both legacy contract tests, front/server typechecks, front/server diff lint,
  formatting, and `git diff --check` pass. `graphql:generate` is blocked because
  healthy local server image denies introspection; no runtime changed. No legacy
  mutation is present.
- 2026-08-13: Started task 2.2. Wiring the existing build-time V2 flag into an
  atomic canonical route composition while mounting the private legacy alias in
  both builds.
- 2026-08-13: Completed task 2.2. `AppRouter` continues to pass the existing
  build-time flag into `useCreateAppRouter`; the router now selects V2 canonical
  plus V2 subroutes when enabled, legacy canonical without V2 subroutes when
  disabled, and mounts `AppPath.MercadoPublicoLegacy` in both builds. Focused
  route-matrix and retained legacy document tests, frontend typecheck, diff lint,
  formatting, and `git diff --check` pass.
- 2026-08-13: Started task 1.2. Adding fail-first isolated authenticated
  Playwright route-matrix coverage for the three deployment phases and the
  retained legacy read-only journey.
- 2026-08-13: Completed task 1.2. Added
  `packages/twenty-e2e-testing/tests/mercado-publico/cutover-route-matrix.spec.ts`
  with authenticated enabled, disabled, and re-enabled phase contracts. Each
  legacy smoke opens Compra Ágil, opens one process detail, closes it, and
  verifies list context persists; browser evidence asserts no console errors or
  provider/unapproved external requests and records a phase screenshot. Playwright
  discovery, direct `oxlint`, formatting, and `git diff --check` pass. Runtime
  proof remains red by design: the current provisioner rejects the V2 fixture
  when disabled and has no three-phase deployment/evidence orchestration; task
  2.3 owns that fixture/harness work. An enabled attempted run exceeded the
  preview-build timeout before assertions began.
- 2026-08-13: Started task 1.3. Adding fail-first release-gate manifest and
  runner contract coverage without duplicating lifecycle, evidence, analytics,
  security, navigation, or cutover product assertions.
- 2026-08-13: Completed task 1.3. Added
  `packages/twenty-e2e-testing/scripts/mercado-publico-release-gate.test.mjs`.
  It requires task 2.5 to aggregate lifecycle, evidence, analytics, security,
  navigation, and cutover owner suites exactly once and rejects cloud smoke
  unless URL, identity, authorization, and allowed-data inputs exist. Focused
  Node test is red as intended because the release-gate runner is absent;
  direct `oxlint`, formatting, and `git diff --check` pass. No existing product
  assertion or runtime state changed.
- 2026-08-13: Started task 2.3. Extending the isolated fixture harness for one
  seeded database, three frontend deployment phases, authenticated route smoke,
  and read-only before/after durable-state evidence.
- 2026-08-13: Task 2.3 implementation is ready in
  `packages/twenty-e2e-testing/scripts/run-mercado-publico-cutover.mjs` and the
  `test:mercado-publico:cutover` target. It provisions once through the existing
  durable SyncRun fixture, rebuilds only the frontend for enabled, disabled, and
  re-enabled phases, preserves the isolated database, captures read-only V2/G3
  durable state, and rejects any state difference. Per-phase Playwright output
  includes trace, screenshot, console, and network attachments. Dry-run, syntax,
  Playwright discovery, direct `oxlint`, formatting, `git diff --check`, and
  isolation preflight pass. Full execution is blocked: a pre-existing
  `twenty-mp-e2e` server is running. It was not stopped or modified without
  authorization, so task 2.3 remains unchecked pending an isolated full run.
- 2026-08-13: Started task 2.5. Adding the release-gate manifest and runner to
  invoke existing lifecycle, evidence, analytics, security, navigation, and
  cutover owner checks without adding assertions.
- 2026-08-13: Completed task 2.5. Added
  `packages/twenty-e2e-testing/scripts/mercado-publico-release-gate.mjs` and
  `test:mercado-publico:release-gate`. The manifest invokes each of the six
  existing owner commands once, writes a human visual-baseline review record,
  and blocks `--cloud-smoke` unless URL, identity, authorization, and allowed
  data inputs exist. `node --test scripts/mercado-publico-release-gate.test.mjs`,
  `npx oxlint scripts/mercado-publico-release-gate.mjs scripts/mercado-publico-release-gate.test.mjs`,
  `npx oxfmt --check scripts/mercado-publico-release-gate.mjs scripts/mercado-publico-release-gate.test.mjs project.json`,
  cloud-smoke dry runs, and `git diff --check` pass. The package has no
  `lint:diff-with-main` target.
- 2026-08-13: Started task 2.4. Making the existing pre-cutover evidence record
  the exact local cutover, rollback, re-enable, evidence-retention, and stop
  procedure without creating a duplicate operator document.
- 2026-08-13: Completed task 2.4. Updated `pre-cutover-evidence.md` with the
  isolated local harness dry run and command, exact enabled-disabled-reenabled
  build flags, local state/deployment/browser artifact locations, durable-state
  stop conditions, G4-wide G5 prohibition, and immutable approved-tag G5
  rollback rule. `node scripts/run-mercado-publico-cutover.mjs --dry-run` proves
  the documented isolated three-phase sequence; `git diff --check` passes.
- 2026-08-13: Started task 2.6. Checking the canonical runtime and existing G3
  control evidence before any daily-cycle action. Two real consecutive
  `America/Santiago` dates are required; no synthetic timestamp or direct data
  write is permitted.
- 2026-08-13: Task 2.6 blocked. `just runtime-check` confirms canonical Compose
  health at revision `02b7a283908ede74c6ca04f58fea039cd51dd7fc`; read-only
  PostgreSQL inspection at `2026-08-13 America/Santiago` finds
  `mp.sync_run`, `mp.v2_cohort`, `mp.gold_detected_process`, and
  `mp.source_watermark`, but not G3 `mp.sync_command`, `mp.sync_run_attempt`,
  or `mp.sync_run_audit`. All current V2 counts are zero. This runtime cannot
  prove an existing G3-controlled cycle, and a second real Santiago date has
  not elapsed. G5 authorization is rejected. Deploy G3 schema, use an assigned
  operator to run one terminal V2 cycle on each of two consecutive local dates,
  then retain the required evidence before retrying this task.
- 2026-08-13: Preserved cutover evidence across harness runs. The harness now
  writes each run under `cutover-evidence/<run-id>` and rejects unsafe explicit
  run IDs instead of deleting the evidence root. The task 2.3 full run remains
  blocked by the existing isolated E2E server.
- 2026-08-13: Retried task 2.6 with a read-only healthy-runtime preflight.
  `just runtime-check` passes. At `2026-08-13 19:39 America/Santiago`, only
  `mp.sync_run`, `mp.v2_cohort`, `mp.gold_detected_process`, and
  `mp.source_watermark` exist; G3 `mp.sync_operator`, `mp.sync_command`,
  `mp.sync_run_attempt`, and `mp.sync_run_audit` remain absent. No V2 SyncRun,
  cohort, projection, or watermark exists. Therefore no G3-controlled cycle
  can be started, no two-date evidence can be retained, and G5 remains
  rejected. No migration, direct database write, synthetic cycle, or cloud
  smoke ran; cloud smoke correctly rejected missing authority inputs.
- 2026-08-13: Revised task 2.6 to verify two real V2 publication windows rather
  than fabricate execution dates. The existing runner only supports page sizes
  through `50`, so proof requests `tamano_pagina: 50`, not `100`. The 12 August
  window was submitted through `mercado-publico:run`. Its configured retry policy
  produced four failed runs; each discovered 45 records and checkpointed page 1,
  then failed because deployed worker code writes `mp.sync_run.heartbeat_at` while
  the runtime has not applied G3 schema. The 13 August window was not submitted.
  Evidence is in `pre-cutover-evidence.md`; task 2.6 remains unchecked and G5
  remains rejected until G3 deployment and two terminal successful windows.
- 2026-08-14: Applied existing additive
  `MpV2SyncOperationsFastInstanceCommand` through the standard
  `run-instance-commands --force` path. Runtime verification confirms G3
  columns, control tables, and indexes. Retried the 12 August window. SyncRun
  `920d80c2-9cf1-4ccb-afc3-330310609175` completed all 104 discovery pages and
  discovered 2598 cohort records, then hydration encountered five soft misses
  followed by provider HTTP 504. Queue retries terminated with another provider
  504 SyncRun. No projection or watermark exists; the 13 August window was not
  submitted. Task 2.6 remains unchecked and G5 remains rejected.
- 2026-08-14: Retried the full 12 August publication window through the
  standard backend runner with `tamano_pagina: 50`. SyncRun
  `e510d181-3721-4e3f-b5cb-6f0025ee565b` reached discovery checkpoint 38 of
  104 with 2598 cohort records, then failed terminally with
  `hard_fail: durable discovering failed`. It made no hydration, projection,
  or watermark progress. Stop condition prevented 13 August submission; task
  2.6 remains unchecked and G5 remains rejected.
- 2026-08-13: Implemented source-only hydration recovery after provider failure
  investigation. New durable metadata preserves generic queue execution
  ownership and frozen hydration decisions; detail responses now persist before
  soft-miss handling; retryable failures become terminal-resumable; provider
  attempts refresh heartbeat; and hydration skips only list-confirmed unchanged
  detail. Focused server Jest passes. Required instance command and source image
  are not deployed, so task 2.6 remains unchecked and G5 remains rejected.
- 2026-08-14: Updated the publication-window runner to pass explicit
  `max_pages` and `bounded_window` payload fields. A bounded run terminalizes
  through the existing success and watermark path after its configured page
  budget; existing resumable `max_pages` behavior remains unchanged. Focused
  Jest, server typecheck, task-file formatting, and `git diff --check` pass.
  Full server diff lint finds only pre-existing format drift in two unrelated
  files.
- 2026-08-14: Rebuilt `twentycrm/twenty:mp-local`, recreated canonical server
  and worker, and verified hydration-recovery columns plus deployed bounded
  runner code. Submitted the bounded 12 August window. SyncRun
  `ce9edf06-6fc1-4384-b5cf-9af6f216ba49` checkpointed two of three allowed
  pages and discovered 89 items, then exhausted retryable provider discovery
  attempts. It ended `partial_failed` with no hydration, projection, or
  watermark; only 3 cohort rows were admitted. Stop condition blocks the 13
  August window. Task 2.6 remains unchecked and G5 remains rejected.
- 2026-08-14: Retried the bounded 12 August window (authorized scope: 12
  August only). Preflight `just runtime-check` healthy with no active run.
  SyncRun `8b024d10-f25f-4154-84ad-cde07703a0fa` consumed all 3 allowed pages,
  discovered 144 items, hydrated and projected 140, and ended
  `partial_failed` with 4 `retryable_failed` terminal items. Watermark
  unchanged (0 global rows). The 13 August window was not submitted. The cycle
  is terminal failure, so G5 authorization remains rejected and task 2.6
  remains unchecked. Evidence recorded in `pre-cutover-evidence.md`.
- 2026-08-14: Diagnosed the four failed items: each had 4 attempts with
  `retryable_failed` at the detail endpoint while sibling items succeeded;
  two of them were `soft_miss` in an earlier run. This is provider-side
  per-record failure, not empty responses and not a pipeline failure.
- 2026-08-14: Retried the bounded 12 August window again as SyncRun
  `4691a855-1281-40eb-b284-68876f84c962`: `132` discovered, `129` hydrated
  and projected, `3` failed (`5251-747-COT26` recovered). Then ran one
  isolated `id`-filtered run per remaining codigo
  (`2721-365-COT26`, `1221016-161-COT26`, `2281-1456-COT26`): each discovered
  1 item and failed all 4 detail attempts with `retryable_failed`. Provider
  detail failure is confirmed per record. G5 authorization remains rejected
  and task 2.6 remains unchecked. Evidence in `pre-cutover-evidence.md`.
- 2026-08-14: Submitted the bounded 13 August window (authorized scope: 13
  August only). SyncRun `85e5dfff-a55f-4713-8975-d068594e934b` succeeded:
  3 pages, `12` discovered, hydrated, and projected, `0` failed, `12` cohort
  admissions, `12` observations. The deployed image still advances the
  watermark on bounded runs (source and runbook forbid it); global watermark
  is now `2026-08-15T00:35:00+00`. The 12 August cycle remains failed, so
  task 2.6 remains unchecked and G5 authorization remains rejected until a
  correct 12 August cycle exists and the watermark deviation is resolved.
  Evidence in `pre-cutover-evidence.md`.
