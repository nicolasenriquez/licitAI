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

- [ ] 1.4 Add failing resolver and generated-document coverage for the seven
  retained legacy read queries. Prove that no legacy mutation is restored.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.2, AC 30.5.

- [ ] 1.2 Add failing isolated authenticated Playwright coverage for enabled
  canonical V2 plus alias smoke, disabled canonical legacy smoke, re-enabled V2
  smoke, and evidence preservation across rollback. The legacy proof is one
  read-only journey with no V1-to-V2 field comparison: open Compra Ágil, open
  one process detail, then close it without losing list context. Capture
  screenshot, trace, console, network, and direct role behavior.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.2, AC 30.3, AC 30.4.

- [ ] 1.3 Add failing release-gate harness coverage or evidence assertions that
  aggregate existing lifecycle, evidence, analytics, security, navigation, and
  cutover proof without weakening their owning suites.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.2, AC 31.4, AC 31.6.

## 2. Implementation

### Retained legacy route

- [ ] 2.1 Restore historical `MercadoPublicoCommandCenterPage` from `fbf6b573ab`
  and only its compilation-required module subtree. Restore its historical
  read-only resolver, seven query documents, and generated output; add no
  mutation. Add private
  `AppPath.MercadoPublicoLegacy` at `/mercado-publico/legacy`; do not alter
  legacy behavior or restore broader surfaces.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.1, AC 30.5.

- [ ] 2.2 Update `AppRouter` and `useCreateAppRouter` so the existing build-time
  flag selects complete canonical V2 or legacy composition while the private
  legacy alias remains mounted in both builds. Keep V2 subroutes enabled-only.
  Traceability: Group G4; Slice S1; Issue 30; Acceptance AC 30.1, AC 30.5.

### Cutover and rollback proof

- [ ] 2.3 Extend the isolated Mercado Publico fixture and authenticated E2E
  harness for route-matrix smoke, explicit rollback deployment, and before/after
  evidence preservation checks. Do not seed projections directly or introduce
  browser provider calls.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.2, AC 30.3, AC 30.4.

- [ ] 2.4 Document exact local cutover, rollback, re-enable, evidence-retention,
  and stop conditions. Keep G5 retirement explicitly prohibited during G4. State
  that G5 rollback deploys the immutable G4-approved release tag.
  Traceability: Group G4; Slice S2; Issue 30; Acceptance AC 30.4, AC 30.5.

### Operational gate

- [ ] 2.5 Add release-gate evidence manifest and runner that invokes existing
  focused lifecycle, evidence, analytics, security, navigation, and cutover
  checks without duplicating their product assertions. Include visual-baseline
  review record format and cloud-smoke precondition check.
  Traceability: Group G4; Slice S3; Issue 31; Acceptance AC 31.2, AC 31.3, AC 31.4, AC 31.6.

- [ ] 2.6 Run and record one correct V2 cycle on each of two consecutive
  `America/Santiago` calendar dates through existing G3 SyncRun control. For
  each, retain cohort, checkpoint, projection, watermark, command, attempt, and
  audit evidence; reject G5 authorization on any failed or incomplete cycle.
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
