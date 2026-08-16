# Retirement Evidence — Mercado Publico V2 Legacy Retirement (G5)

Version: 1
Created: 2026-08-16
Status: draft — G4 gate satisfied; Slice S1 removal authorized by gate-close
decision. S2/S3 batches remain pending until their own candidate proof passes.
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

## Open items

- `reconciliation-refresh` suite: classified S3 at task 1.3 (2026-08-16) —
  sole consumer is `MercadoPublicoReconciliationService`, a V1/CSV-only
  service displaced by V2 evidence-replay; removed with its owner at task 2.5.
- `cutover-route-matrix.spec.ts`: S1 removal done 2026-08-16 with verified
  rollback reference `49d115e768`. Spec retained as non-executable historical
  G4 evidence reference; release-gate `cutover` gate is now historical.
