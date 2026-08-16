# Retirement Evidence — Mercado Publico V2 Legacy Retirement (G5)

Version: 1
Created: 2026-08-16
Status: certified 2026-08-16 — automated evidence green, final human approval
recorded (task 4.2). Remains an active change until 4.3 validation completes.
Precondition gate: G4 approval of G5 — SATISFIED on 2026-08-16 by the operator
decision recorded in the cutover-gate proposal `## Gate Status` section. No
standalone release record or `mercado-publico-v2-g4-approved-*` tag exists; the
operator decision supersedes both. Rollback reference: G4 gate-close commit
`49d115e768` on `feat/mercado-publico-v2-baseline`. All removal batches remain
blocked until their own candidate proof (tasks 0.3 through 4.3) passes.

## Candidate Manifest

Legend: Batch S1 = UI/GraphQL contraction (Issue 32), S2 = visual artifacts
(Issue 33), S3 = V1/CSV runtime (Issue 34). Rollback constraint is the G4
gate-close commit `49d115e768` plus Git history for every candidate unless
noted. Owner = owning file/registration seam.

### S1 — Displaced UI and GraphQL consumers

| Candidate | Owner | Accepted V2 replacement | Consumers | Batch |
| --- | --- | --- | --- | --- |
| `AppPath.MercadoPublicoLegacy` (`/mercado-publico/legacy`) | `packages/twenty-shared/src/types/AppPath.ts` | Canonical V2 routes `/mercado-publico` + subroutes | `useCreateAppRouter.tsx` (alias route), `cutover-route-matrix.spec.ts`, `useCreateAppRouter.test.tsx`, `usePageChangeEffectNavigateLocation.test.ts` | S1 |
| `MercadoPublicoCommandCenterPage` | `packages/twenty-front/src/pages/mercado-publico/` | `MercadoPublicoV2ActivePage` / V2 pages | `useCreateAppRouter.tsx` (flag-off canonical + alias lazy imports) | S1 |
| Legacy tabs/panel: `MercadoPublicoBrowseTab`, `MercadoPublicoControlCenterTab`, `MercadoPublicoProcessDetailPanel` | `packages/twenty-front/src/modules/mercado-publico/components/` | V2 pages + `MercadoPublicoV2FilterBar` | `MercadoPublicoCommandCenterPage` only | S1 |
| Legacy hooks ×7 (`useMercadoPublicoDetectedProcesses`, `ProcessDetail`, `JobRuns`, `ApiCallLog`, `PipelineHealth`, `ApiQuotaUsage`, `CsvFileHealth`) + `mercadoPublicoQueryHelpers` | `modules/mercado-publico/hooks/` | `useMercadoPublicoV2UrlState` + V2 inline queries | legacy tabs/panel only | S1 |
| Legacy GraphQL documents: 7 queries + 7 fragments (`graphql/queries/*`, `graphql/fragments/*`) | `modules/mercado-publico/graphql/` | V2 operations in main `generated/graphql.ts` | legacy hooks only | S1 |
| Generated `generated/mercado-publico-legacy.graphql.ts` + `codegen-mercado-publico-legacy.cjs` + project.json target | `packages/twenty-front` | main GraphQL codegen | legacy hooks; 10 files import generated types | S1 |
| Legacy utils: `parseMercadoPublicoTabHash`, `mercadoPublicoDisplay` | `modules/mercado-publico/utils/` | V2 URL state / twenty-ui display | legacy tabs/panel only | S1 |
| Legacy resolver `mercado-publico-query.resolver.ts` + DTO `dtos/mercado-publico-query.dto.ts` | `packages/twenty-server/.../mercado-publico/` | `mercadoPublicoV2` + detail + sync-control resolvers | 7 legacy read services; front legacy ops | S1 |
| Legacy read closure: 7 `*-read.service.ts`, 7 `types/*-read.types.ts`, 3 `constants/*-read.constants.ts` | server module | V2 read services | legacy resolver only | S1 |
| Legacy route/flag branches: alias route, flag-off canonical branch, `isMercadoPublicoV2Enabled` ternary in `AppRouter.tsx` | `useCreateAppRouter.tsx`, `AppRouter.tsx` | flag-on V2-only composition | tests above | S1 (remove G4 legacy route only after G4 rollback reference verified) |
| Guard tests: `__tests__/mercado-publico-legacy-query-documents.spec.ts` (front), `__tests__/mercado-publico-legacy-query-contract.spec.ts` (server) | both packages | V2 contract specs | none | S1 |
| Locale legacy msgids (all `.po` + generated) | `packages/twenty-front/src/locales/` | V2 msgids retained | regenerate via `lingui:extract` | S1 |

### S2 — Visual artifacts

| Candidate | Owner | Replacement / disposition | Consumers | Batch |
| --- | --- | --- | --- | --- |
| Stories | — | None exist (repo-wide search: zero mp stories) | — | S2 |
| Prototypes | — | None exist | — | S2 |
| Style files | — | No `*.styles.ts`; legacy inline linaria styled blocks retire with S1 components | legacy components | S2 |
| CSV fixture files `services/utils/__tests__/csv/fixtures/licitaciones-*.csv` ×5 | server module | V2 JSON fixtures retained | `mercado-publico-csv-raw-load-licitaciones.spec.ts` only | S3 (consumes CSV service) |
| V1/CSV-era screenshots/baselines | — | None tracked; runtime `run_results/` untracked | — | S2 |

### S3 — V1/CSV runtime

| Candidate | Owner | Accepted V2 replacement | Consumers | Batch |
| --- | --- | --- | --- | --- |
| CLI `mercado-publico:run` command + spec | `commands/mercado-publico-run.command.ts` | `mercado-publico:sync-operator` (V2) | enqueues orchestrator jobs | S3 |
| Job `MercadoPublicoJob` processor | `jobs/mercado-publico.job.ts` | `MercadoPublicoV2SyncCommandJob` + V2 cron jobs | orchestrator only | S3 |
| Orchestrator `mercado-publico-job-orchestrator.service.ts` + spec | server module | V2 sync command dispatch | `MercadoPublicoJob` only | S3 |
| `mercado-publico-canonical-refresh.service.ts` + spec | server module | V2 projection service | V1 services, orchestrator, reconciliation | S3 |
| `mercado-publico-reconciliation.service.ts` + spec | server module | V2 evidence-replay (reconciliation tables pinned by retained migrations) | orchestrator only | S3 |
| V1 API services ×6 (`mercado-publico-api-v1-*` licitaciones/oc) + specs | `services/` | V2 compra-agil services | orchestrator; `api-v1-licitaciones-canonical-refresh.integration-spec.ts` | S3 |
| V1 API clients ×2 (`mercado-publico-api-v1-{licitaciones,ordenes-de-compra}-client.service.ts`) + v1 types + v1 utils (`extract-v1-*`, `format-v1-date`, `normalize-v1-*`) + specs | `drivers/api/` | `mercado-publico-api-v2-compra-agil-client.service.ts` (shared) | V1 services; integration suite above | S3 |
| api-v2 legacy backbone services ×3 (`mercado-publico-api-v2-compra-agil-{incremental,publication-window,detail-by-codigo}.service.ts`) + specs | `services/` | V2 durable-sync service | orchestrator only (displaced despite v2 name) | S3 |
| CSV services ×7 (`mercado-publico-csv-*`) + `services/utils/csv/**` + 2 column-map constants + specs | `services/` | V2 compra-agil ingestion | orchestrator; `csv-ingestion-canonical-refresh.integration-spec.ts` | S3 |
| Error-summary utils `build-mercado-publico-error-summary-text`, `map-mercado-publico-error-summary-to-job-run-status` | `services/utils/` | V2 error summary path | orchestrator side | S3 |
| Constants: V1/CSV branches of `mercado-publico.constants.ts` (job names, reconciliation, CSV) | server module | prune only; retain V2 job name + status/error types | orchestrator, jobs, run command | S3 |
| Legacy/V1/CSV unit specs (all `*csv-*`, `*api-v1-*`, `*read.service.spec`, orchestrator/reconciliation/canonical-refresh/run-command specs) | server module | V2 specs | removed with owners | S3 |
| Integration suites `api-v1-licitaciones-canonical-refresh`, `csv-ingestion-canonical-refresh` | `test/integration/mercado-publico/suites/` | V2 integration suites | V1/CSV services | S3 |
| Integration suites `csv-file-health-db`, `quota-usage-db` (legacy read consumers) | same | V2 suites | legacy read services | S1 (read closure) |
| `mercado-publico-runtime-exposure.spec.ts` | server module | update assertions (asserts `MercadoPublicoRunCommand` in module) | module | S3 |
| Integration suite `reconciliation-refresh` | `test/integration/mercado-publico/suites/` | classified 2026-08-16 (task 1.3): consumes `MercadoPublicoReconciliationService` (V1/CSV-only, displaced by V2 evidence-replay) | reconciliation service | S3 |

## Retained (never touched by G5)

- Committed migrations: all `2-16-*mp*` fast/slow instance commands + specs
  (`packages/twenty-server/src/database/commands/upgrade-version-command/2-16/`),
  including the retained `upgrade` integration spec.
- V2 durable evidence: `mp` schema, projections, SyncRun control/audit tables,
  `pre-cutover-evidence.md`, the G4 gate-close record (cutover-gate
  `proposal.md` `## Gate Status`).
- V2 runtime: resolvers, read services, sync-control, guards, cron jobs
  (sync-recovery, debt-recovery), V2 e2e specs/scripts/harness
  (`run-mercado-publico-cutover.mjs`, release gate), V2 JSON fixtures,
  `mercado-publico-v2-e2e.fixture.ts`.
- Shared services V2 still consumes: `mercado-publico-config`,
  `mercado-publico-persistence`, `mercado-publico-quota-tracker`,
  `mercado-publico-api-v2-compra-agil-client` + v2 utils/record types,
  `mercado-publico-recorded-job-failure.error`,
  `redact-mercado-publico-request-params.util` (V2 detail-read consumer —
  verified shared during 2.1, restored after initial misclassification),
  `MessageQueue.mercadoPublicoQueue` (shared queue, V2 jobs use it).
  Branch-level prune only (verified 2026-08-16): remove unused V1/CSV branches
  of shared services — `mercado-publico-persistence.service.ts` V1 imports
  (lines 8-9) + `stg_api_v1_licitacion` / `raw_csv_file` / `raw_csv_row` /
  `stg_csv_*` methods (V1/CSV services sole callers);
  `mercado-publico-config.service.ts` `csv*` config fields (CSV services sole
  consumers); `mercado-publico.constants.ts` V1/CSV job/reconciliation/CSV
  constants. Keep every V2-used member. Stop any batch that would edit,
  delete, or transform committed migrations or `mp` evidence.
- Shared integration suites: `v2-golden-path`, `v2-evidence-history-replay`,
  `v2-durable-sync`, `v2-detail-contract`, `v2-activas-filter-keyset`,
  `raw-layer-persistence`.
- Orphaned V2 contract specs `tests/mercado-publico-contract/*` — excluded from
  every runner via `GLOBAL_TEST_IGNORE`; leave untouched (not legacy).

## Operational rollback and data-recovery path (2026-08-16)

- Rollback (route/runtime level): deploy G4 gate-close revision
  `49d115e768` on `feat/mercado-publico-v2-baseline`. That revision contains
  the legacy command-center route, alias, legacy resolver/read closure, and
  the full V1/CSV runtime; its G4 runbook (`pre-cutover-evidence.md`,
  enabled-to-disabled-to-enabled procedure) remains the verified recovery
  procedure. Nothing G5 removed is required to *execute* rollback: the old
  revision carries its own code and CLI (`mercado-publico:run`).
- Data level: all `mp` schema, raw/evidence tables
  (`raw_api_payload`, `raw_csv_file`, `raw_csv_row`, `stg_*`, canonical,
  `v2_*` durable evidence, SyncRun/control/audit), and committed 2-16
  migrations are untouched by G5. Historical V1/CSV data already in those
  tables remains queryable; no removal deletes rows. New V1/CSV ingestion
  requires rollback deployment (old runtime) — by design.
- Stop condition check: the recovery path depends on no removed component.
  Verified against removed set (S1 + S3 lists).

## Final zero-consumer evidence record (2026-08-16)

- Manifest: this file, v1 — owner, V2 replacement, consumers, batch, rollback
  constraint per candidate.
- Graph/search: repo-wide greps (S1 symbols, V1/CSV symbols, constants)
  show zero runtime/contract consumers; remaining hits are guard-spec
  assertions, retained suite labels, and committed migrations (retained).
- Tests: fail-first zero-consumer specs green — front
  `mercado-publico-retirement-consumers.spec.ts` (9 assertions),
  `mercado-publico-visual-asset-ownership.spec.ts`; server
  `mercado-publico-retirement-consumers.spec.ts`,
  `mercado-publico-visual-asset-retirement.spec.ts`,
  `mercado-publico-runtime-retirement-consumers.spec.ts`; full mp Jest suites
  green in twenty-server; focused front suites green.
- Codegen: legacy generated output removed with source + target; main
  `generated/graphql.ts` untouched (no legacy ops); regeneration attempt
  blocked by canonical introspection policy (recorded G4 precedent).
- Authenticated smoke (2026-08-16): executed against isolated harness
  `twenty-mp-e2e` (reuse-state, volumes kept). login.setup +
  `history-and-buyers.spec` 8/8 green on current V2 UI. `baseline.spec`
  9/9 failures proven pre-existing at HEAD (route `/mercado-publico-v2` and
  heading removed by `bbef9aafeb`, pre-G5) — harness debt, not a G5
  regression. G5 smoke evidence recorded in tasks.md 3.1 Notes; full log
  `%TEMP%\opencode\mp-e2e-full-run.log`.
- Visual review (2026-08-16): axe-core green (violations=[]) across
  desktop/laptop/mobile for both V2 routes in authenticated smoke (3.1);
  no horizontal overflow; keyboard navigation green. Screenshots captured:
  `visual-evidence/` (6 PNGs: Activas, Historial guidance + codigo,
  Compradores; desktop + mobile), captured authenticated, verified
  programmatically (per-route URL + heading assertions, unique content
  hashes). The PNG files were removed from the working tree after review
  (untracked, never committed); programmatic results and this record remain.
  Human visual review of PNGs deferred to final approval.
- Retained fixtures serve evidence purpose: e2e `v2-history-and-buyers`
  fixture consumed by `provision-baseline.mjs`, asserted live by
  `history-and-buyers.spec` (8/8 green, 3.1); server V2 JSON fixtures
  consumed by 6 retained specs — all green in 3.1 jest run.
- Lint/typecheck: `lint:diff-with-main` green both packages (server formatted
  via fix config), `nx typecheck` green front + server, `git diff --check`
  clean.
- G4 approval: gate-close decision 2026-08-16, proposal `## Gate Status`
  (`openspec/changes/archive/2026-08-16-mercado-publico-v2-cutover-gate/proposal.md`),
  rollback reference `49d115e768`.
- PRD: `.scratch/mercado-publico-v2-reconstruction/PRD.md`; source issues
  32-35 under `.scratch/mercado-publico-v2-reconstruction/issues/`; prior
  OpenSpec evidence: `mercado-publico-v2-cutover-gate` (G4, archived:
  `openspec/changes/archive/2026-08-16-mercado-publico-v2-cutover-gate/` —
  tasks + pre-cutover evidence), `mercado-publico-v2-sync-operations` (G3,
  archived:
  `openspec/changes/archive/2026-08-16-mercado-publico-v2-sync-operations/`).
- Prior umbrella change `mercado-publico-v2-reconstruction`: absent from this
  checkout (removed in `4f3a121e21` and absorbed in `41c4c3fb39`; preserved in
  git history only). Nothing to mark `superseded`: no artifact remains in
  `changes/` or `archive/`, and no human approval requests superseding. No
  OpenSpec artifact assigns reconstruction work to it — the only active
  change is this one (AC 35.6 verified 2026-08-16).
- Human approval: GRANTED 2026-08-16 by the operator. The final zero-consumer
  certification record is approved after all automated evidence was green
  (tests, complete harness 9/9, graph/search, typecheck, codegen
  compatibility, visual evidence). Human visual review of the captured
  screenshots is accepted as deferred to this approval (PNG files removed
  from the tree after review). No prior
  change was marked `superseded` (no artifact remains and no superseding was
  requested).

## Post-removal complete harness confirmation (2026-08-16, task 3.4)

- Harness: complete isolated run after ALL removal batches (HEAD `1e54a5897a`;
  harness server image `twenty-mp-e2e:1e54a5897a1c` built from the same
  revision — running fixture source-matches checkout). login.setup +
  `history-and-buyers.spec` 9/9 green (reuse-state, `KEEP_E2E_ENV=true`,
  fixture left running as before).
- Tests: server mp Jest 29/29 suites (214 tests), front mp Jest 4/4 (12
  tests) green.
- GraphQL/codegen compatibility: front + server typecheck green; main
  `generated/graphql.ts` byte-identical to HEAD (git status clean outside
  change tracking files); no legacy generated output remains. Regeneration
  still blocked by canonical runtime introspection policy (recorded 2.2).
  G5 introduced zero new migrations; committed `2-16-*mp*` `up`/`down` pairs
  intact.
- Graph/search: repo-wide search for S1/S3 legacy symbols shows zero
  runtime/contract consumers; matches restricted to retirement guard specs,
  retained committed migrations, retained evidence labels, and retained
  persistence CSV/raw branches (retention boundary per 0.3/2.5).
- Visual evidence: automated review green (3.2); the 6 reviewed PNGs were
  removed from the working tree after review (never committed). Human visual
  review accepted in the 4.2 approval.

## Operator and developer documentation update (2026-08-16, task 4.1)

- `docs/operations/mercado-publico-compra-agil-v2.md`: retired
  `mercado-publico:run` recipe replaced with retained sync-control dispatch;
  added Retired Legacy Surface, Rollback and Recovery (rollback revision
  `49d115e768`, G4 runbook), and Evidence and Execution Authorities sections.
- `docs/business/mercado-publico-source-contract.md`,
  `docs/business/mercado-publico-ingestion-context.md`: Retirement Status notes
  mark V1/CSV runtime retired; sections remain historical domain evidence.
- Execution authorities identified: PRD, issues 32-35, G3/G4/G5 OpenSpec
  decisions, this evidence record.

## Open items

- `reconciliation-refresh` suite: classified S3 at task 1.3 (2026-08-16) —
  sole consumer is `MercadoPublicoReconciliationService`, a V1/CSV-only
  service displaced by V2 evidence-replay; removed with its owner at task 2.5.
- `cutover-route-matrix.spec.ts`: S1 removal done 2026-08-16 with verified
  rollback reference `49d115e768`. Spec retained as non-executable historical
  G4 evidence reference; release-gate `cutover` gate is now historical.
- Pre-existing V2 integration drift (found 2026-08-16 during task 3.3,
  NOT caused by G5): suites `v2-durable-sync`, `v2-evidence-history-replay`,
  `v2-detail-contract` fail against committed impl at HEAD (spec+impl
  byte-identical to HEAD; no V1/CSV consumer involved). Examples:
  durable-sync test 446 expects `rejects.toThrow('all detail requests
  failed')` while impl resolves retryable responses; systemic-discovery test
  expects run status `failed` but impl writes `partial_failed`;
  detail-contract expects fixed child-array projection order. Green at 3.3:
  `v2-activas-filter-keyset`, `v2-golden-path`, `raw-layer-persistence`.
  Owning scope: G5 change owner to raise as separate defect after retirement
  (Issue 34 scope = V1/CSV removal only).

## S2 visual retirement record (2026-08-16)

- Removed: nothing. Inventory proved zero displaced stories, prototypes, or
  standalone style files. Legacy inline linaria styles retired with their S1
  components. The 5 CSV licitaciones fixtures are S3 test assets, removed at
  2.5 with their CSV service.
- Retained historical/visual evidence: V2 JSON fixtures
  (`v2-compra-agil-*.json`, `v2-compra-agil-detail-contract.md`), release-gate
  visual-baseline review template, G4 `cutover-route-matrix` spec and
  `pre-cutover-evidence.md` (non-executable references), `run_results/`
  artifacts (untracked).
- Ownership guards green: `mercado-publico-visual-asset-ownership.spec.ts`
  (front) proves no local stories/styles/prototypes and V2 components keep
  twenty-ui shared tokens; server visual-asset spec's CSV-fixture assertion
  turns green at 2.5.

## S1 Codegen and post-removal evidence (2026-08-16)

- Derived artifacts: the only removed generated file is
  `packages/twenty-front/src/generated/mercado-publico-legacy.graphql.ts`.
  Its source documents (7 queries + 7 fragments) and its codegen target
  (`codegen-mercado-publico-legacy.cjs`, project.json configuration) were
  removed with it in 2.1; no retained generated file was edited by hand.
- Main `generated/graphql.ts`: never contained legacy operations (legacy had
  its own output file). V2 documents unchanged → no regeneration needed for
  retained source. `npx nx run twenty-front:graphql:generate` re-run attempted:
  blocked by canonical runtime introspection policy (same outcome G4 recorded
  on 2026-08-13). Front typecheck against existing generated output passes.
- Post-removal graph/search proof (repo-wide grep, `*.{ts,tsx,cjs,json,mjs}`):
  `MercadoPublicoCommandCenterPage`, `MercadoPublicoLegacy`,
  `mercado-publico-legacy`, `MercadoPublicoQueryResolver`,
  `mercadoPublicoDetectedProcesses`, `mercadoPublicoCsvFileHealth`,
  `mercadoPublicoPipelineHealth`, `mercadoPublicoApiQuotaUsage`,
  `mercadoPublicoApiCallLog`, `mercadoPublicoJobRuns`,
  `mercadoPublicoProcessDetail` — zero runtime/contract consumers remain;
  the only hits are the retirement guard specs (assertions, not consumers).
- Candidate-level proof: front
  `mercado-publico-retirement-consumers.spec.ts` green (import scan, file
  absence, AppPath, router composition, V2 intact); server
  `mercado-publico-retirement-consumers.spec.ts` green (file absence, module
  registration, V2 resolvers intact).
