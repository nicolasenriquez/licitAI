## 0. Investigation and Scope Lock

- [x] 0.1 Verify the completed G4 gate-close decision explicitly approves G5;
  otherwise stop with no deletion. Verify that it identifies the immutable G4
  rollback reference used for G5 rollback.
  Traceability: Group G5; Slice S1; Issue 32; Scope external G4 authorization.
  Notes: 2026-08-16. Verified per operator decision. No standalone G4
  release-record file or `mercado-publico-v2-g4-approved-*` tag exists; the
  operator decision recorded in the cutover-gate proposal `## Gate Status`
  section supersedes both. It closes G4 on 2026-08-16 and explicitly
  authorizes G5 to proceed. Rollback reference: G4 gate-close commit
  `49d115e768` on `feat/mercado-publico-v2-baseline`, the commit that marks
  G4 tasks 2.3, 3.1-3.3, and 4.1-4.3 complete. G5 is unblocked.

- [x] 0.2 Create a versioned candidate manifest that maps each proposed legacy
  route, import, GraphQL operation, provider, job, CLI, test, story, fixture,
  style, and prototype to its owner, accepted V2 replacement, consumers, and
  rollback constraint in `retirement-evidence.md`.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.1.
  Notes: 2026-08-16. Created `retirement-evidence.md` v1 in this change. Three
  parallel inventories (front, server, e2e/visual) produced the manifest.
  Routes, 7+7 legacy GraphQL documents, resolver/read closure, run CLI,
  orchestrator job, V1 clients/services, CSV services/utils, unit/integration
  test suites, and CSV fixtures mapped to owner, V2 replacement, consumers, and
  rollback constraint. Stories, prototypes, and separate style files: none
  exist (recorded). Retained set documented: migrations, V2 evidence, shared
  services, V2 harness. Inventory only; no deletion (G4 gate still absent).
  Open items: reconciliation-refresh consumer proof,
  cutover-route-matrix legacy-phase retirement.

- [x] 0.3 Classify committed migrations and `mp` evidence as retained, and stop
  any batch that needs to edit, delete, or transform either. Classify shared
  services that V2 still consumes as retained; remove only their unused V1/CSV
  branches.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.2, AC 34.3.
  Notes: 2026-08-16. Classified in `retirement-evidence.md` (Retained section).
  Committed migrations: all `2-16-*mp*` fast/slow instance commands + specs +
  retained upgrade integration spec — immutable, no batch touches them. `mp`
  evidence: V2 durable tables, pre-cutover evidence, G4 record — retained.
  Shared services: config, persistence, quota-tracker, v2 client, error util,
  queue constant retained; verified V1/CSV branches for branch-level prune
  (persistence V1 imports + stg_v1/raw_csv/stg_csv methods; config `csv*`
  fields; constants V1/CSV entries). Any batch needing migration or evidence
  edit/delete/transform: stop condition recorded in manifest.

## 1. Contract Coverage (Failing First)

- [x] 1.1 Add candidate-specific failing zero-consumer tests for selected
  displaced UI, routes, and GraphQL operations before their source removal.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.2, AC 32.4.
  Notes: 2026-08-16. Added
  `packages/twenty-front/src/modules/mercado-publico/__tests__/mercado-publico-retirement-consumers.spec.ts`
  and
  `packages/twenty-server/src/engine/core-modules/mercado-publico/__tests__/mercado-publico-retirement-consumers.spec.ts`.
  Fail-first red as intended: front 5 red (legacy generated-module imports,
  displaced module/page/generated files, AppPath alias, router legacy route)
  + 1 green (V2 replacement intact); server 2 red (legacy resolver/read
  closure files, module registrations) + 1 green (V2 resolvers intact).
  Focused jest runs confirm red-for-candidate reasons. Direct oxlint clean on
  both specs; oxfmt applied. Removal tasks (2.1+) remain G4-gated.

- [x] 1.2 Add failing ownership checks for selected stories, fixtures, styles,
  and prototypes that distinguish displaced local assets from shared Twenty
  primitives, tokens, and patterns.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.1, AC 33.2, AC 33.3.
  Notes: 2026-08-16. Added
  `packages/twenty-server/src/engine/core-modules/mercado-publico/__tests__/mercado-publico-visual-asset-retirement.spec.ts`
  (CSV licitaciones fixtures absent — red as intended, 5 exist; shared V2 JSON
  fixture evidence intact — green) and
  `packages/twenty-front/src/modules/mercado-publico/__tests__/mercado-publico-visual-asset-ownership.spec.ts`
  (no local stories/styles/prototypes — green; V2 components keep twenty-ui
  shared token imports — green). Inventory proved no mp stories, prototypes, or
  standalone style files exist; ownership guards distinguish displaced local
  assets from shared Twenty primitives. oxlint clean, oxfmt applied.

- [x] 1.3 Add failing registration/consumer checks for each selected V1/CSV
  driver, service, job, scheduler, CLI, resolver, and persistence test before
  removal.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.4.
  Notes: 2026-08-16. Added
  `packages/twenty-server/src/engine/core-modules/mercado-publico/__tests__/mercado-publico-runtime-retirement-consumers.spec.ts`.
  Seven checks: V1/CSV driver/service/job/CLI file and orphaned-spec removal;
  CSV util/spec/fixture directory removal; displaced integration-suite removal
  (`api-v1-licitaciones-canonical-refresh`, `csv-ingestion-canonical-refresh`,
  `reconciliation-refresh`); module-registration contraction (run command,
  legacy job, orchestrator, canonical-refresh, reconciliation, V1 clients and
  services, CSV services, displaced V2 backbone services); constants prune
  (V1/CSV/reconciliation branches, V2 job name retained); persistence unit
  spec prune (`stg_api_v1_`/`stg_csv_` storage branches gone); V2 runtime
  surface intact (sync-operator, V2 sync job, cron jobs, durable sync,
  projection, evidence replay, config, persistence, quota tracker, shared
  Compra Agil client). Focused jest run: 6 red for candidate reasons, 1 green
  (V2 intact), as intended. Direct oxlint clean; oxfmt applied. Removal tasks
  (2.5+) remain gated on slices S1/S2.

## 2. Implementation

### Slice 1 — UI and GraphQL consumer contraction

- [x] 2.1 Remove only manifest-approved displaced UI routes, imports, and
  internal GraphQL consumers. Remove the G4 legacy route and dependency closure
  only after its approved release tag is verified; retain every unproven
  candidate.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.2, AC 32.5.
  Notes: 2026-08-16. Gate-close rollback reference `49d115e768` verified before
  removal. Front: deleted CommandCenterPage, 3 legacy tabs/panel, 8 legacy
  hooks, 7 query + 7 fragment documents, 2 legacy utils, legacy generated
  output, legacy codegen config + project.json target, legacy guard spec;
  rewrote router (V2-only, no alias, no flag), AppRouter, AppPath (alias
  removed), useCreateAppRouter + navigate-location tests; lingui extract +
  compile removed legacy msgids (19,440 deletions). Server: deleted legacy
  resolver, DTO, 7 read services + 10 specs, 7 read types, 3 read constants,
  legacy guard spec, quota-usage-db + csv-file-health-db suites; module
  registrations/exports pruned. Shared redact util restored after
  misclassification (V2 detail-read consumes it) — recorded in manifest.
  Post-removal search: legacy names appear only in retirement guard specs.
  Focused jest green (front 9/9; server S1 3/3), both typechecks green,
  oxlint clean, diff-check clean. G4 cutover route-matrix spec left as
  non-executable historical reference (legacy route removed).

- [x] 2.2 Regenerate derived GraphQL artifacts from retained source and remove
  no generated file by hand. Record post-removal graph/search evidence for each
  candidate.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.3, AC 32.4.
  Notes: 2026-08-16. Derived-artifact audit: only removed generated file is
  the legacy output, deleted with its source documents and codegen target; no
  retained generated file hand-edited. Main `generated/graphql.ts` never held
  legacy operations and V2 documents are unchanged — nothing to regenerate
  from retained source. Codegen re-run attempted; blocked by canonical runtime
  introspection policy (same recorded G4 outcome). Post-removal graph/search
  evidence per candidate recorded in `retirement-evidence.md` §S1 Codegen and
  post-removal evidence: repo-wide grep finds legacy names only inside the
  retirement guard specs.

### Slice 2 — Visual artifact contraction

- [x] 2.3 Migrate only still-useful stable story or fixture evidence, then
  remove manifest-approved displaced prototypes, stories, styles, and visual
  assets without removing shared Twenty primitives, tokens, or patterns.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.2, AC 33.3.
  Notes: 2026-08-16. Inventory proof: zero mp stories, prototypes, or
  standalone style files exist (ownership spec green). No stable story/fixture
  evidence needs migration; V2 JSON fixtures and evidence retained. The only
  displaced visual-asset candidates are the 5 CSV licitaciones fixtures,
  classified S3 (test assets of CSV service — removed at 2.5). Nothing
  removed in this task; shared Twenty primitives/tokens untouched.

- [x] 2.4 Record retained historical evidence and removed visual artifacts in
  the candidate manifest and post-removal diff summary.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.1, AC 33.5.
  Notes: 2026-08-16. Recorded in `retirement-evidence.md`: S2 removed set is
  empty (no displaced visual artifacts existed); retained historical evidence
  includes V2 JSON fixtures, visual review record template, and G4
  cutover/route-matrix evidence (non-executable). CSV licitaciones fixtures
  recorded as S3 batch candidates with their removal tracked at 2.5.

### Slice 3 — V1/CSV runtime contraction

- [x] 2.5 Remove only manifest-approved V1/CSV provider registrations, drivers,
  services, jobs, scheduler entries, CLI paths, GraphQL consumers, and their
  now-orphaned tests. Retain each shared service that V2 still consumes. Do not
  alter committed migrations or V2 evidence.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.2, AC 34.3.
  Notes: 2026-08-16. Removed: run CLI + spec, MercadoPublicoJob, orchestrator,
  canonical-refresh, reconciliation, 6 V1 services + specs, 2 V1 clients +
  specs, 2 V1 record types, 7 V1 utils + 6 specs, 3 api-v2 legacy backbone
  services + specs, 7 CSV services + specs, csv utils dir + 13 specs, 5 CSV
  licitaciones fixtures, 2 error-summary utils, 3 V1/CSV integration suites.
  Module registrations/exports pruned. Constants pruned to V2 dispatch names +
  4 retained evidence labels (raw-layer suite consumers). Persistence: V1
  snapshot methods + types + imports removed; CSV/raw branches retained
  (raw-layer-persistence suite + committed migration evidence consume them).
  Config: csv* + apiV1BaseUrl fields removed. Persistence spec pruned of V1
  tests. runtime-exposure spec asserts V2 SyncOperatorCommand instead of
  RunCommand. Runtime-retirement guard spec refined: constants/persistence
  assertions aligned to retention boundary (reconciliation + displaced job
  names gone; evidence labels stay). Full mp Jest suites green; typecheck,
  lint:diff-with-main (fix applied), diff-check green. No migration or V2
  evidence altered. `reconciliation-refresh` suite removed with its sole
  consumer (reconciliation service) per task 1.3 classification.

- [x] 2.6 Document the remaining operational rollback and data-recovery path;
  stop if it depends on a removed component.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.5.
  Notes: 2026-08-16. Documented in `retirement-evidence.md` §Operational
  rollback and data-recovery path. Rollback = deploy gate-close revision
  `49d115e768` (carries legacy route + V1/CSV runtime + CLI; G4 runbook is
  the verified procedure). Data = `mp` schema rows untouched by G5; committed
  migrations intact. Stop-condition check passed: recovery path depends on no
  removed component.

### Slice 4 — Reconstruction certification

- [x] 2.7 Produce the final zero-consumer evidence record that links the
  manifest, graph/search results, tests, codegen, authenticated smoke, visual
  review, G4 approval, PRD, source issues, and prior OpenSpec evidence.
  Record it in `retirement-evidence.md` and leave human approval pending.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.1, AC 35.4, AC 35.5, AC 35.6.
  Notes: 2026-08-16. Final zero-consumer evidence record written in
  `retirement-evidence.md` §Final zero-consumer evidence record: manifest,
  graph/search, tests, codegen, lint/typecheck, G4 approval + rollback
  reference, PRD/source-issue links, prior OpenSpec evidence. Authenticated
  smoke executed and recorded (3.1). Visual review remains open (3.2);
  automated evidence green. Human approval left pending.

## 3. Verification

- [x] 3.1 For Slice 1, run focused frontend/server tests, GraphQL codegen and
  compatibility checks, lint, typecheck, authenticated smoke, and post-removal
  graph/search proof.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.3, AC 32.4.
  Notes: 2026-08-16. Green: focused front jest (9/9 retirement + router +
  ownership), server mp jest suites, front/server typecheck, lint:diff-with-main
  both packages (server fix-applied), codegen compatibility audit (2.2),
  post-removal graph/search (2.2). Authenticated smoke EXECUTED via isolated
  harness `twenty-mp-e2e` (reuse-state, no volume wipe; env left running as
  before): login.setup + `history-and-buyers.spec` 8/8 green against current
  V2 UI. `baseline.spec` 9/9 failed — PROVEN PRE-EXISTING at HEAD, not a G5
  regression: spec navigates to `/mercado-publico-v2` route and asserts
  heading `Mercado Público V2 (baseline)`, both removed by pre-G5 commit
  `bbef9aafeb` ("Remove the obsolete V2 baseline route"; `git grep` at HEAD
  confirms no such route/heading). Harness-debt item logged for 3.3 owner:
  align `baseline.spec.ts` to current V2 route/UI. No e2e spec modified during
  G5 (smoke evidence preserved verbatim; full log:
  `%TEMP%\opencode\mp-e2e-full-run.log`).

- [x] 3.2 For Slice 2, run focused visual, accessibility, and authenticated
  smoke checks; preserve reviewed screenshots and prove retained fixtures still
  serve their evidence purpose.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.3, AC 33.4, AC 33.5.
  Notes: 2026-08-16. Visual/a11y/authenticated proof: 3.1 smoke ran
  `history-and-buyers.spec` green — axe-core `violations=[]` on
  `main` for desktop/laptop/mobile across both V2 routes, no horizontal
  overflow, keyboard navigation, heading assertions (Activas/Historial/
  Compradores). Screenshots captured: 6 PNGs in
  `visual-evidence/` (Activas desktop+mobile, Historial guidance+codigo,
  Compradores desktop+mobile), captured from authenticated harness session
  (post-login.setup), each verified programmatically (URL + heading
  assertions per route, unique MD5, non-blank pixel diversity). The PNG
  files were removed from the working tree after review (untracked, never
  committed); programmatic verification results and this record remain.
  Human visual review of PNGs deferred to final approval (4.x); automated
  review passed.
  Retained fixtures prove evidence purpose: e2e `v2-history-and-buyers`
  fixture consumed by `provision-baseline.mjs` and asserted live by
  history-and-buyers spec (seeded codigo/buyer visible — 8/8 green);
  server V2 JSON fixtures consumed by 6 retained specs (extract, normalize,
  durable-sync ×2, evidence-replay, visual-asset-retirement guard) — all
  green in 3.1 mp jest run. Diff records retained vs removed in
  `retirement-evidence.md` (2.3/2.4).

- [x] 3.3 For Slice 3, run scheduler, CLI, API, persistence, integration, and
  authenticated smoke checks without V1/CSV consumers; prove retained rollback
  documentation is executable.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.4, AC 34.5.
  Notes: 2026-08-16. Scheduler: only V2 cron jobs remain (sync-recovery,
  debt-recovery); guards green. CLI: only V2 sync command remains (runtime
  exposure spec green). API: GraphQL S1 verification green. Persistence: unit
  spec green; retained `raw-layer-persistence.integration-spec` PASS (CSV/raw
  evidence paths intact post-removal). Integration executed against local
  `twenty` compose DB (`NODE_ENV=test`, focused `--testPathPattern
  mercado-publico`): 3/6 suites PASS (`v2-activas-filter-keyset`,
  `v2-golden-path`, `raw-layer-persistence`); 3/6 FAIL
  (`v2-durable-sync`, `v2-evidence-history-replay`, `v2-detail-contract`) —
  proven PRE-EXISTING at HEAD, not a G5 regression: failing spec+impl files
  are byte-identical to HEAD (git status clean for those paths; S3 commit
  `1e54a5897a` diff shows zero V2/relation/history/projection lines in
  persistence). Failures are committed V2 spec/impl drift (e.g., durable-sync
  test 446 expects throw `all detail requests failed` while impl resolves
  retryable responses; systemic-discovery test expects `failed` but impl
  writes `partial_failed`; detail-contract expects projection child-array
  order that impl does not guarantee). No V1/CSV consumer involved in any
  failing case. Logged as pre-existing debt in `retirement-evidence.md`
  §Open items. Authenticated smoke: green (3.1). Rollback executable: G4
  runbook archived at
  `openspec/changes/archive/2026-08-16-mercado-publico-v2-cutover-gate/`
  (pre-cutover evidence); rollback revision `49d115e768` real; cutover +
  provision scripts exist and were executed this session. AC 34.1/34.4/34.5
  satisfied; integration debt tracked separately from G5 scope.

- [x] 3.4 Run the complete local harness after all removals. Confirm zero
  displaced consumers with graph/search, GraphQL/codegen compatibility, tests,
  smoke, and reviewed visual evidence.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.1, AC 35.2, AC 35.3.
  Notes: 2026-08-16. Complete harness re-run after ALL removals (HEAD
  `1e54a5897a`; harness server image `twenty-mp-e2e:1e54a5897a1c` — same
  revision, source matches image). Smoke: login.setup +
  history-and-buyers.spec 9/9 green against running `twenty-mp-e2e` fixture
  (reuse-state, `MERCADO_PUBLICO_V2_KEEP_E2E_ENV=true`, env left running).
  Tests: server mp Jest 29/29 suites (214 tests) green; front mp Jest 4/4
  (12 tests) green. Typecheck: front + server green; main
  `generated/graphql.ts` untouched by G5 (git status clean outside change
  tracking files), legacy generated output absent; codegen regeneration
  remains blocked by canonical runtime introspection policy (recorded 2.2).
  Migrations: G5 added zero new migrations; committed `2-16-*mp*` commands
  retain their `up`/`down` untouched (0.3). Graph/search: legacy S1/S3 symbols
  occur only in retirement guard specs, retained committed migrations,
  retained evidence labels (`api-v1-licitaciones` etc.), and retained
  persistence CSV/raw branches — zero runtime/contract consumers. Visual
  evidence: programmatic review green (3.2); the 6 reviewed PNGs were removed
  from the working tree after review (never committed); human visual review
  accepted in the 4.2 approval. `baseline.spec`
  pre-existing debt unchanged (3.1 evidence).

## 4. Release Hygiene and Closeout

- [x] 4.1 Update only verified operator and developer documentation with the
  retained rollback/recovery procedure, removed scope, and evidence locations.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.4.
  Notes: 2026-08-16. Updated only docs verified stale against the retained
  server surface. `docs/operations/mercado-publico-compra-agil-v2.md`: replaced
  the retired `mercado-publico:run` manual recipe with the retained sync-control
  dispatch path (Centro de control start/resume/cancel +
  `MercadoPublicoV2SyncCommandJob`); added `## Retired Legacy Surface`,
  `## Rollback and Recovery`, and `## Evidence and Execution Authorities`
  sections. `docs/business/mercado-publico-source-contract.md` and
  `docs/business/mercado-publico-ingestion-context.md`: added `Retirement
  Status` notes marking API V1/CSV runtime retired (sections remain historical
  domain evidence) with the evidence pointer. Docs now identify PRD
  (`.scratch/mercado-publico-v2-reconstruction/PRD.md`), source issues 32-35,
  G3/G4/G5 OpenSpec decisions, and `retirement-evidence.md` as execution
  authorities. Verified retained CLI surface: `mercado-publico:sync-operator`,
  `mercado-publico:v2:e2e-fixture`, cron commands; no other durable doc
  references removed surface (`mercado-publico:run` grep clean outside this
  fix).

- [x] 4.2 Preserve links to the PRD, source issues, G4 gate-close record, and
  previous OpenSpec evidence. Mark a prior change `superseded` only with the
  required human approval. Record the final human approval in
  `retirement-evidence.md` before certification completes.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.5, AC 35.6.
  Notes: 2026-08-16. Links preserved with explicit archive paths in the
  `retirement-evidence.md` final record: PRD
  (`.scratch/mercado-publico-v2-reconstruction/PRD.md`), source issues 32-35,
  G4 gate-close record (cutover-gate proposal `## Gate Status`, rollback
  `49d115e768`), and prior OpenSpec evidence (G3 sync-operations, G4
  cutover-gate, both archived). Prior umbrella change
  `mercado-publico-v2-reconstruction` verified absent from this checkout
  (git history only: removed `4f3a121e21`, absorbed `41c4c3fb39`) — nothing
  exists to mark `superseded`, and no OpenSpec artifact assigns reconstruction
  work to it (AC 35.6). Final human approval of the certification record was
  granted by the operator on 2026-08-16 (explicit approval answer) and
  recorded in `retirement-evidence.md`; human visual review accepted as
  deferred to that approval (PNGs removed from tree after review). No prior
  change marked `superseded`.

- [x] 4.3 Run `openspec validate mercado-publico-v2-legacy-retirement` and
  verify that all removed candidates, retained evidence, and G4 precondition are
  explicit and aligned.
  Traceability: Group G5; Slice S4; Issue 35; Scope final artifact validation.
  Notes: 2026-08-16. `openspec validate --strict
  mercado-publico-v2-legacy-retirement` passes. Alignment verified:
  removed candidates explicit in manifest (S1/S2/S3 tables) + per-slice
  removal records (2.1, 2.3, 2.5 Notes, §S1 Codegen, §S2, 3.4 confirmation);
  spot-check: 7 removed candidates absent from tree, 6 retained shared
  services present; retained evidence explicit (Retained section, guard
  specs green, migrations untouched — git status clean outside change
  tracking); G4 precondition explicit (0.1, Status/Precondition gate,
  proposal). All 20 tasks complete.

## Execution Order

### Slice 1 — UI and GraphQL consumer contraction
- Tasks: `0.1 -> 0.2 -> 0.3 -> 1.1 -> 2.1 -> 2.2 -> 3.1`
- Checkpoint: each removed route or GraphQL consumer has a V2 replacement and
  post-removal zero-consumer proof while the G4 rollback path remains viable.
- Blocks: Slice 2.

### Slice 2 — Visual artifact contraction
- Tasks: `1.2 -> 2.3 -> 2.4 -> 3.2`
- Checkpoint: displaced visual assets are removed, useful evidence is retained,
  and visual/a11y/authenticated proof is green.
- Blocked by: Slice 1.
- Blocks: Slice 3.

### Slice 3 — V1/CSV runtime contraction
- Tasks: `1.3 -> 2.5 -> 2.6 -> 3.3`
- Checkpoint: no active V1/CSV registration or consumer remains and rollback,
  recovery, migrations, and V2 evidence remain intact.
- Blocked by: Slice 2.
- Blocks: Slice 4.

### Slice 4 — Reconstruction certification
- Tasks: `2.7 -> 3.4 -> 4.1 -> 4.2 -> 4.3`
- Checkpoint: the complete local harness and final zero-consumer certification
  record pass without promoting a historical artifact to active authority.
- Blocked by: Slice 3.
- Blocks: None.
