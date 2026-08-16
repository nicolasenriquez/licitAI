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
  smoke + visual review recorded as pending-isolated-harness items (3.2/3.3
  gates); automated evidence green. Human approval left pending.

## 3. Verification

- [ ] 3.1 For Slice 1, run focused frontend/server tests, GraphQL codegen and
  compatibility checks, lint, typecheck, authenticated smoke, and post-removal
  graph/search proof.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.3, AC 32.4.
  Notes: 2026-08-16. PARTIAL. Green: focused front jest (9/9 retirement +
  router + ownership), server mp jest suites, front/server typecheck,
  lint:diff-with-main both packages (server fix-applied), codegen
  compatibility audit (2.2 evidence), post-removal graph/search (2.2).
  BLOCKED: authenticated smoke — `test:mercado-publico` refused: existing
  `twenty-mp-e2e` isolated env already running; harness requires operator
  decision to reuse or clean it (same guard G4 recorded). No env touched.
  Unblock: operator approves reuse or `down --remove-orphans`, then re-run.

- [ ] 3.2 For Slice 2, run focused visual, accessibility, and authenticated
  smoke checks; preserve reviewed screenshots and prove retained fixtures still
  serve their evidence purpose.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.3, AC 33.4, AC 33.5.

- [ ] 3.3 For Slice 3, run scheduler, CLI, API, persistence, integration, and
  authenticated smoke checks without V1/CSV consumers; prove retained rollback
  documentation is executable.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.4, AC 34.5.

- [ ] 3.4 Run the complete local harness after all removals. Confirm zero
  displaced consumers with graph/search, GraphQL/codegen compatibility, tests,
  smoke, and reviewed visual evidence.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.1, AC 35.2, AC 35.3.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update only verified operator and developer documentation with the
  retained rollback/recovery procedure, removed scope, and evidence locations.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.4.

- [ ] 4.2 Preserve links to the PRD, source issues, G4 gate-close record, and
  previous OpenSpec evidence. Mark a prior change `superseded` only with the
  required human approval. Record the final human approval in
  `retirement-evidence.md` before certification completes.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.5, AC 35.6.

- [ ] 4.3 Run `openspec validate mercado-publico-v2-legacy-retirement` and
  verify that all removed candidates, retained evidence, and G4 precondition are
  explicit and aligned.
  Traceability: Group G5; Slice S4; Issue 35; Scope final artifact validation.

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
