---
type: change-investigation
title: "Investigation: mercado-publico-ingestion-backbone"
description: "Investigation artifact for Mercado Publico Ingestion Backbone."
okf_version: "0.1"
---
# Investigation: mercado-publico-ingestion-backbone

## Purpose

Phase 0 investigation artifact for the Mercado Publico ingestion backbone change. Covers pattern inventory, untouched baseline verification, blast-radius review, regression check map, and minimal implementation plan. Refreshed after the binding schema catalog landed so Phase 0 stays aligned with the exact `mp` table, key, constraint, and relationship inventory. Non-implementing by design (per `proposal.md` Preferred Execution Shape and `tasks.md` Phase 0 footnotes).

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md`, change `proposal.md`, `design.md`, `specs/.../spec.md`, `tasks.md`, `docs/business/mercado-publico-source-contract.md`, `docs/business/mercado-publico-ingestion-context.md`, `docs/standards/{nestjs,database,testing}-standard.md`, `docs/operations/{data-operations,command-surface}.md`, `docs/decisions/0005-deployment-local-mercado-publico-schema.md`, `docs/architecture/current-state.md`, `packages/twenty-server/docs/UPGRADE_COMMANDS.md`. Pattern inventory via explore agent scan of `packages/twenty-server/src/`. Refresh cross-check: `schema-catalog.md` now freezes the exact layer inventory, unique keys, check constraints, and FK relationships for Phase 2 SQL.

---

## 0.2 Pattern Inventory

Lens applied to each category: depth (small interface, concentrated complexity), leverage (reuse vs create fresh), locality (related code co-located), deletion-test (would removing this module break anything, or is it a shallow pass-through).

### Module Composition — EXISTS, deep

- Root wiring: `packages/twenty-server/src/app.module.ts:49-79`. `ModulesModule` (`src/modules/modules.module.ts:10-22`) aggregates business modules — registration seam for MP module.
- Two-tier: `engine/core-modules/` (platform) vs `modules/` (business features). MP backbone belongs in `modules/` (business) per ADR 0005 ("core module with a clear interface" — but "core" there means infra-grade, not literal `core-modules/` location; design.md says "treat as a core module" yet business feature => `modules/`).
- Reference: `connected-account.module.ts:10-18` — `@Module` with `TypeOrmModule.forFeature`, providers, exports.
- **Depth**: Modules are thin registration shells; complexity lives in services. Good — MP module should be thin shell, services carry logic.
- **Deletion-test**: Removing `ModulesModule` breaks all business features. Not pass-through.
- **Leverage**: Reuse `@Module` + `ModulesModule` registration exactly. No new composition pattern needed.

### Instance Commands — EXISTS, deep

- Decorator: `registered-instance-command.decorator.ts:20-33` — `@RegisteredInstanceCommand(version, timestamp, { type?: 'slow' })`. Auto-discovery via `UpgradeCommandRegistryService` (`upgrade-command-registry.service.ts:57-130`) using `DiscoveryService.getProviders()`.
- Interfaces: `FastInstanceCommand { up, down }` (`fast-instance-command.interface.ts:3-6`), `SlowInstanceCommand extends Fast + runDataMigration` (`slow-instance-command.interface.ts:5-7`).
- Fast example: `2-9-instance-command-fast-1799000030000-add-logic-function-execution-mode.ts:6-25` — raw SQL via `queryRunner.query()`.
- Auto-generated registry: `instance-commands.constant.ts:1` — `// Auto-edited by generate:instance-command`. Do NOT edit manually.
- Generate: `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>`.
- **Depth**: `UpgradeCommandRegistryService` concentrates discovery + ordering. Commands themselves are thin `up`/`down` SQL. Deep registry, thin leaf commands. Good shape.
- **Deletion-test**: Removing registry breaks all migrations. Not pass-through.
- **Leverage**: MP schema creation = fast instance command(s) via `queryRunner.query('CREATE SCHEMA IF NOT EXISTS mp')` + `CREATE TABLE IF NOT EXISTS mp.*`. Never edit committed commands. Generate new, auto-registers.

### Workspace Commands — EXISTS, not needed for MP

- `@RegisteredWorkspaceCommand` + `WorkspaceCommandRunner` (`workspace.command-runner.ts:25-140`). Iterates active/suspended workspaces.
- **Leverage**: MP is deployment-local `mp` schema, NOT per-workspace. Workspace commands NOT needed unless per-workspace CRM projection (explicitly deferred per spec). Skip entirely for this change.

### Message Queue — EXISTS, deep, extend at single seam

- Queue names enum: `message-queue.constants.ts:5-23` — `MessageQueue` enum. Add `mercadoPublicoQueue` here.
- Driver: `bullmq.driver.ts:38-277` — `BullMQDriver`, `add()` with `retryLimit`, `work()` with Sentry scope. `SyncDriver` (`sync.driver.ts:12-73`) for tests.
- Auto-creates queue providers: `message-queue-core.module.ts:114-122` maps every `MessageQueue` value → `{ provide: getQueueToken(queueName), useFactory: ... }`. Adding enum entry auto-wires the queue.
- Explorer: `message-queue.explorer.ts:33-220` — auto-discovers `@Processor` classes, matches `@Process(jobName)` by `job.name`.
- Worker bootstrap: `queue-worker.ts:9-33` → `QueueWorkerModule` (`queue-worker.module.ts:10-20`) imports `JobsModule` (`jobs.module.ts:49-106`). Register MP job module in `JobsModule` imports + processor classes in providers.
- Manual trigger: `calendar-trigger-event-list-fetch.command.ts:29-130` — `nest-commander` `@Command` + `@InjectMessageQueue` + `messageQueueService.add()`. Reference for MP manual trigger commands.
- Cron registration: `workflow-run-enqueue.cron.command.ts:11-34` — `@Command` calls `addCron`. Phase 1 = manual only, so cron command deferred.
- **Depth**: `BullMQDriver` + `MessageQueueExplorer` concentrate all queue logic. Processors are thin handlers. Deep infra, thin leaf.
- **Deletion-test**: Removing explorer/drivers breaks all queues. Not pass-through.
- **Leverage**: Add enum entry + `@Processor(MessageQueue.mercadoPublicoQueue)` job classes + register in `JobsModule`. Reuse `add()` with `retryLimit` for bounded retry (design.md resilience: 429/500/503/timeout = retryable, 401/403 = hard fail). `SyncDriver` for unit tests.

### Secure HTTP — EXISTS, deep, mandatory reuse

- `secure-http-client.service.ts:23-125` — `SecureHttpClientService.getHttpClient(config, context)`. SSRF protection, `axiosRetry` for retries, protocol allowlist, outbound request logging.
- Canonical usage: `call-webhook.job.ts:72-79` — `secureHttpClientService.getHttpClient(undefined, { workspaceId, userId, source: 'webhook' })`.
- Context type: `outbound-request-context.type.ts:3-7` — `OutboundRequestContext { workspaceId, source, userId? }`.
- **Depth**: SSRF + retry + logging concentrated in one service. Callers pass config + context. Deep.
- **Deletion-test**: Removing breaks all outbound HTTP. Not pass-through.
- **Leverage**: ALL MP API calls (V1 Licitaciones, V1 OC, V2 Compra Agil, CSV download) MUST use `SecureHttpClientService.getHttpClient()`. Inject `SecureHttpClientModule` into MP driver module. Retry config from `TwentyConfigService.get('MERCADO_PUBLICO_HTTP_MAX_RETRIES')`. Error classification via `isAxiosError` + status codes (design.md 398-405).

### Config / Secrets — EXISTS, deep, extend at single seam

- `twenty-config.service.ts:21-307` — `get(key)`, env-only bypass, DB cache fallback, masking.
- Schema: `config-variables.ts:56-1893` — `class ConfigVariables` with `@ConfigVariablesMetadata({ group, description, type, isSensitive?, isEnvOnly? })` + class-validator decorators + defaults.
- Masking: `constants/config-variables-masking-config.ts` — add sensitive vars here.
- Usage: `microsoft-api-refresh-tokens.service.ts:16-27` — `this.config.get('AUTH_MICROSOFT_CLIENT_ID')`.
- **Depth**: `TwentyConfigService` + `ConfigVariables` class concentrate all config logic. Deep.
- **Deletion-test**: Removing breaks all config access. Not pass-through.
- **Leverage**: Add 12 config vars (design.md 418-429) to `ConfigVariables` class with `@ConfigVariablesMetadata`. Tickets = `isSensitive: true` + add to masking config. Read via `twentyConfigService.get('MERCADO_PUBLICO_API_TICKET')`. NEVER `process.env` in feature code (only bootstrap `main.ts` + `core.datasource.ts` allowed).

### CSV Parsing — NOT FOUND, create fresh

- Searched `csv-parse|papaparse|fast-csv|csvtojson` in `packages/twenty-server/src/` → no matches. `papaparse` only in `twenty-front` (browser preview, `fetchCsvPreview.ts:1`).
- **Leverage**: Must add CSV parser dependency to `packages/twenty-server/package.json`. `csv-parse` (node-native, stream-first) is the idiomatic backend choice. No existing backend pattern to mirror.
- **Depth**: Create a focused CSV profiling + parsing service. Interface: `profileFile(stream) -> { encoding, delimiter, quotechar, header, columns, fingerprint }` + `parseRows(stream, opts) -> AsyncIterable<Row>`. Concentrate encoding/delimiter detection here.

### Decompression — NOT FOUND, create fresh

- Searched `zlib|createUnzip|createGunzip|7z|7zip` in `packages/twenty-server/src/` → no matches.
- **Leverage**: Add `zlib` (Node built-in, no dep) for `.gz`. For `.7z` (source-contract.md 206: "Files may be compressed as `.7z`"), need a package or external tool. `7zip-min` or shell out to `7z` binary. Decision deferred to implementation — minimum viable is `.gz`/`.zip` via zlib; `.7z` handled if fixtures require it.

### File Storage — EXISTS, deep, optional reuse

- `file-storage.service.ts:32-406` — `writeFile`, `readFile -> Promise<Readable>`, `downloadFile`, `getPresignedUrl`. Workspace-scoped (`@InjectWorkspaceScopedRepository(FileEntity)`).
- Drivers: S3 + local (`drivers/s3.driver.ts`, `drivers/local.driver.ts`).
- Stream utils: `utils/stream-to-buffer.ts:1` — `streamToBuffer` helper.
- **Depth**: `FileStorageService` concentrates storage logic. Deep.
- **Deletion-test**: Removing breaks file features. Not pass-through.
- **Leverage**: MP CSV download can use `FileStorageService.writeFile` for staging downloaded files to `MERCADO_PUBLICO_CSV_STORAGE_ROOT`. BUT `FileStorageService` is workspace-scoped — MP is deployment-local (`mp` schema, not workspace). May need to bypass workspace scoping or use direct `fs`/`StorageDriver` for the storage root. Decision for implementation: use `StorageDriver` directly (S3 or local) without workspace-scoped `FileEntity`, since CSV files are deployment-local reference data, not tenant CRM files. Audit contract = persisted raw file metadata in `mp.raw_csv_file`, not filesystem retention (design.md 323-326).

### Tests — EXISTS, two-tier

- Unit: co-located `*.spec.ts` beside source, often in `__tests__/`. Example: `secure-http-client.service.spec.ts:4-9`.
- Integration: `test/integration/<feature>/suites/<name>.integration-spec.ts`. Setup: `setup-test.ts:8-21`, app factory `create-app.ts:43-107` (uses `SyncDriver` for queue tests, line 38/71).
- Mocks: co-located `src/**/mocks/` (e.g. `gmail-api-error-mocks.ts`, `microsoft-api-examples.ts`).
- Run single: `cd packages/twenty-server && npx jest "filename"` (per AGENTS.md). Integration: `npx nx run twenty-server:test:integration:with-db-reset`.
- **Leverage**: MP unit specs co-located beside driver/service. Integration specs in `test/integration/mercado-publico/suites/`. Mock API responses in `src/modules/mercado-publico/mocks/`. Use `SyncDriver` for queue tests. DB-backed tests via `createApp` + `rawDataSource`.

### Logging / Observability — EXISTS, deep

- `logger.service.ts:18-111` — `LoggerService` with `category` param, perf timers.
- Sentry: `@sentry/nestjs`, `SentryModule.forRoot()` (`app.module.ts:51`). `@SentryCronMonitor` on cron jobs.
- Metrics: `MetricsService` — `recordHistogram`, `incrementCounterForEvent`.
- Event logs: `EventLogEmitterService.createContext({ workspaceId })` + `insertWorkspaceEvent`.
- **Leverage**: Inject `LoggerService` for structured logs with category `mercado-publico`. `EventLogEmitterService` for audit trail of ingestion runs. Add `MetricsKeys` for ingestion counters/histograms.

### Existing API Client Modules — EXISTS, reference pattern

- Google calendar: `google-calendar-get-events.service.ts:14-124` — injects OAuth provider, paginates, classifies errors in `handleError`. Driver module: `google-calendar-driver.module.ts:7-12` — imports `TwentyConfigModule`, provides/exports service.
- Microsoft: `microsoft-api-refresh-tokens.service.ts:14-64` — `@azure/msal-node`, config from `TwentyConfigService.get(...)`.
- **Leverage**: Mirror Google calendar driver structure for MP:
  ```
  modules/mercado-publico/
    mercado-publico.module.ts
    drivers/
      api/mercado-publico-api-client.service.ts
      api/mercado-publico-api-driver.module.ts
      api/utils/parse-mercado-publico-error.util.ts
      api/mocks/mercado-publico-api-examples.ts
    csv/mercado-publico-csv.service.ts
    csv/mercado-publico-csv.module.ts
    jobs/mercado-publico-*.job.ts
    mercado-publico-job.module.ts
    commands/mercado-publico-trigger-*.command.ts
    services/mercado-publico-read-contract.service.ts
  ```
  Single client service injected with `SecureHttpClientService` + `TwentyConfigService`. Error parse util. Mocks dir for fixtures.

### Entry Points — EXISTS

- API: `main.ts:30-111`. Worker: `queue-worker.ts:9-33` → `QueueWorkerModule` (`queue-worker.module.ts:10-20`). CLI: `nest-commander` `@Command`.
- **Leverage**: MP jobs run in worker process (register in `JobsModule`). Manual triggers via `@Command` CLI classes. No new entry point needed.

---

## 0.3 Untouched Baseline Verification

### Environment

- OS: Windows. Shell: PowerShell 7. Node via nvm4w. Yarn 4.13.0 (corepack).
- `yarn install` completed: 5m52s, 4877 packages, 3.26 GiB. Peer-dep warnings + disabled build scripts = normal Yarn 4 behavior.
- Docker: `twenty-db-1` (postgres:16, healthy), `twenty-redis-1` (redis, healthy), `twenty-server-1` + `twenty-worker-1` (prebuilt `twentycrm/twenty:latest`, source NOT mounted, devDeps absent — `ls /app/node_modules/.bin/nx` = not found). DB+Redis usable for integration tests later.

### Gate 1: `npx nx typecheck twenty-server` — FAILED (pre-existing)

Two distinct pre-existing failures, neither caused by MP change (change is docs-only, zero `packages/twenty-server/src/` edits):

1. **`twenty-sdk:build` rimraf Windows bug**: `npx rimraf 'dist/sdk' 'dist/define/**/*.d.ts' ...` in `packages/twenty-sdk/project.json` build script. On Windows, `npx` invokes scripts via `cmd.exe` which does not strip single-quotes → rimraf receives literal `'dist/sdk'` (with quotes) → `Error: Illegal characters in path. code: EINVAL`. This is a pre-existing Windows incompatibility in the repo's build scripts, not an MP change issue. Passes on Linux.

2. **Direct `tsgo -p packages/twenty-server/tsconfig.json --noEmit`** (bypassing nx dep chain): 35 errors, all in `packages/twenty-server/src/engine/workspace-manager/workspace-migration/`:
   - TS2307: Cannot find module (15 occurrences) — `src/` prefix path resolution failures for `row-level-permission-predicate`, `command-menu-item`, `field`, `object`, `page-layout`, `page-layout-widget` action handlers and utils.
   - TS7053: Element implicitly 'any' (5) — `AllFlatEntityMaps` index errors.
   - TS2366: Function lacks ending return (2).
   - TS7006: Parameter implicitly 'any' (2).
   - TS2345: Argument 'any' not assignable to 'never' (6).
   - TS2322: Type assignment incompatibility (1).
   All confined to `workspace-migration-runner`. MP change does not touch this module. Pre-existing baseline errors (likely missing built deps or tsconfig path mapping when running tsgo standalone).

### Gate 2: `npx nx lint:diff-with-main twenty-server` — FAILED (pre-existing Windows bug), trivial PASS when run in bash

- `npx nx` invocation fails because the lint command uses bash syntax `FILES=$(...)` but `npx` on Windows runs via `cmd.exe` → `'FILES' is not recognized`. Pre-existing Windows incompatibility in `packages/twenty-server/project.json` lint script.
- Ran the underlying command directly in Git Bash: `git diff --name-only --relative --diff-filter=d main...HEAD -- packages/twenty-server/src/` → **no changed files** (MP change is docs-only: OpenSpec artifacts + docs + AGENTS.md routing files). Lint passes trivially (nothing to lint).

### Baseline Conclusion

- **Pre-existing failures documented**: (a) `twenty-sdk:build` rimraf single-quote bug on Windows, (b) `twenty-server:lint:diff-with-main` bash-syntax-in-cmd bug on Windows, (c) `workspace-migration-runner` type errors when tsgo run standalone (likely missing built dep dist).
- **None caused by MP change** — change is docs-only at this commit.
- **Implementation phase must not regress these** and must not add new type errors in touched files.
- **Validation strategy**: run `tsgo` directly on touched MP files during impl, run `oxlint`/`oxfmt` directly on changed files in bash, run integration tests via `npx nx run twenty-server:test:integration:with-db-reset` (DB+Redis available). Avoid `npx nx typecheck` wrapper on Windows due to upstream `twenty-sdk:build` bug.

---

## 0.4 Blast Radius and Regression Check Map

For each surface the MP change touches: files affected, blast radius, regression checks.

### 1. Static `mp` Schema Creation (instance commands)

- **Files touched**: new files under `packages/twenty-server/src/database/commands/upgrade-version-command/2-15/` (or current version dir). Auto-registered in `instance-commands.constant.ts`.
- **Blast radius**: New SQL schema `mp` + tables. Does NOT touch `core`, `metadata`, or `workspace_<id>` schemas. `CREATE SCHEMA IF NOT EXISTS mp` + `CREATE TABLE IF NOT EXISTS mp.*` — idempotent, reversible (`DROP SCHEMA IF EXISTS mp CASCADE`). Exact object inventory, unique keys, check constraints, and FK topology are now frozen in `schema-catalog.md` §§Raw/Staging/Canonical/Reconciliation/Gold.
- **Regression checks**:
  - `npx nx database:reset twenty-server` still passes (runs all instance commands including new MP ones).
  - `npx nx run twenty-server:database:migrate:prod` applies new commands cleanly.
  - Existing `core`/`metadata`/`workspace_<id>` schemas unaffected — verify via Postgres MCP: `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%'` still returns workspaces, `mp` exists alongside.
  - Integration test: `test/integration/mercado-publico/suites/schema-creation.integration-spec.ts` — verify `mp` schema + all required tables exist after migration.
  - DB verification must sample catalog-defined constraint/relationship seams, not only table existence: raw payload UK, raw CSV row FK to raw CSV file, canonical natural-key UKs, reconciliation logical dedupe UKs, and any catalog-defined CHECKs for enum-like columns.

### 2. Typed Config Variables (`config-variables.ts`)

- **Files touched**: `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts` (add 12 `MERCADO_PUBLICO_*` fields), `constants/config-variables-masking-config.ts` (add ticket masking).
- **Blast radius**: Config schema extension. New fields have defaults (non-sensitive) or no default (sensitive tickets — required at runtime when MP jobs run). Does NOT alter existing config vars. Admin panel shows new group `MERCADO_PUBLICO` (or similar).
- **Regression checks**:
  - `twenty-config.service.spec.ts` still passes.
  - `npx tsgo -p packages/twenty-server/tsconfig.json --noEmit` — no new type errors beyond pre-existing baseline.
  - `npx nx typecheck twenty-server` — no new errors beyond pre-existing rimraf bug.
  - Verify masking: `TwentyConfigService.getAll()` masks ticket values when DB driver active.

### 3. MessageQueue Enum Extension (`message-queue.constants.ts`)

- **Files touched**: `packages/twenty-server/src/engine/core-modules/message-queue/message-queue.constants.ts` (add `mercadoPublicoQueue = 'mercado-publico'`).
- **Blast radius**: `message-queue-core.module.ts:114-122` auto-creates queue provider for every enum value. Adding entry auto-wires `mercadoPublicoQueue` token. No existing queues affected.
- **Regression checks**:
  - Existing queue tests pass (no existing tests should reference queue count or enum length).
  - `queue-worker.module.ts` bootstraps without error — `JobsModule` imports MP job module, explorer discovers `@Processor(MessageQueue.mercadoPublicoQueue)` classes.
  - `SyncDriver` test harness still works for MP queue unit tests.

### 4. JobsModule Registration (`jobs.module.ts`)

- **Files touched**: `packages/twenty-server/src/engine/core-modules/message-queue/jobs.module.ts:49-106` (add MP job module to `imports`, processor classes to `providers`).
- **Blast radius**: Worker bootstrap. If MP job module fails to import, worker process crashes on start. Existing job processors unaffected (additive).
- **Regression checks**:
  - `npx nx run twenty-server:worker` starts without error.
  - Existing jobs still process (calendar, webhook, timeline, etc.).
  - `create-app.ts:43-107` integration test harness still bootstraps (it imports `JobsModule`).

### 5. CSV Parser + Decompression Dependencies (`packages/twenty-server/package.json`)

- **Files touched**: `packages/twenty-server/package.json` (add `csv-parse` or similar, possibly `7zip-min` or `zlib` is built-in).
- **Blast radius**: New deps. `yarn install` still resolves. No existing imports affected.
- **Regression checks**:
  - `yarn install` succeeds.
  - `npx nx build twenty-server` succeeds (if build deps resolve).
  - No security advisories from new deps (check `yarn npm audit` or similar).

### 6. MP Module + Services + Jobs (new `modules/mercado-publico/`)

- **Files touched**: entirely new directory `packages/twenty-server/src/modules/mercado-publico/`. Registered in `ModulesModule` (`modules.module.ts:10-22` — add `MercadoPublicoModule` to imports).
- **Blast radius**: Additive. No existing module modified except `ModulesModule` (one import added). MP module imports `SecureHttpClientModule`, `TwentyConfigModule`, `TypeOrmModule.forFeature([...MP entities])`.
- **Regression checks**:
  - `ModulesModule` still bootstraps — existing business features (calendar, messaging, connected-account, workflow, workspace-member, onboarding) unaffected.
  - `app.module.ts` still bootstraps — API server starts on port 3000.
  - No public GraphQL/REST/MCP surface added (spec.md:369-373 "Phase-1 execution surface remains internal"). Verify: no new `@Resolver`, `@Controller`, or MCP tool registrations in MP module.

### 7. Internal Read Contracts (new services, no public API)

- **Files touched**: new `services/mercado-publico-read-contract.service.ts` in MP module.
- **Blast radius**: Internal backend services only. No GraphQL resolver, no REST controller, no MCP tool. Consumed by future CRM projection change (deferred).
- **Regression checks**:
  - No new public API surface (grep: `@Query`, `@Mutation`, `@Resolver` in MP module = none).
  - Read contract tests verify behavior through service methods, not HTTP/GraphQL endpoints.
  - `gold_*` tables populated correctly — verified via integration tests.

### 8. Secret / Ticket Handling

- **Files touched**: MP API client services read tickets via `TwentyConfigService.get('MERCADO_PUBLICO_API_TICKET')` / `COMPRA_AGIL_API_TICKET`.
- **Blast radius**: None — no existing secret handling modified.
- **Regression checks**:
  - Grep MP module for `process.env` → zero matches (AGENTS.md rule: no `process.env` in feature code).
  - Grep MP module for ticket variable in log statements → zero matches (design.md: never log secrets).
  - Grep fixtures for ticket values → zero real ticket strings (design.md: no real tickets in fixtures).
  - `SecureHttpClientService` used for all outbound MP HTTP (grep: no raw `axios`/`HttpService` in MP module).

### 9. Frontend (explicitly out of scope, task 3.36)

- **Files touched**: NONE. `packages/twenty-front/` untouched.
- **Regression checks**: `npx nx typecheck twenty-front` unaffected. No GraphQL codegen changes (no new public schema).

### Regression Check Summary

Table-by-table authority is `schema-catalog.md`. This blast-radius map stays focused on touched repository surfaces and the validation shape required to prove the catalog was applied correctly.

| Surface | Check command | Pre-existing? |
| --- | --- | --- |
| Instance commands | `npx nx database:reset twenty-server` | must still pass |
| Config schema | `npx tsgo -p packages/twenty-server/tsconfig.json --noEmit` | no new errors beyond 0.3 baseline |
| Queue enum | worker bootstrap | no crash |
| JobsModule | `npx nx run twenty-server:worker` | starts OK |
| Deps | `yarn install` + `npx nx build twenty-server` | resolves + builds |
| Module registration | `npx nx start twenty-server` | API starts on 3000 |
| No public API surface | grep MP module for `@Resolver/@Controller/@Mutation/@Query` | zero matches |
| No process.env in feature | grep MP module for `process.env` | zero matches |
| No secrets logged | grep MP module for ticket var in log calls | zero matches |
| Frontend untouched | `npx nx typecheck twenty-front` | unaffected |
| Integration | `npx nx run twenty-server:test:integration:with-db-reset` | MP suites pass, existing suites pass |

---

## 0.5 Minimal Surgical Implementation Plan

## 0.6 Compra Agil V2 Contract Repair (2026-08-10)

### Diagnosis

- **Implemented defect**: the two command entrypoints accepted one-sided
  publication/change windows, while the list validator already required pairs.
- **Implemented defect**: a durable sync with a watermark derived only
  `cambio_desde`, allowing an incomplete request window.
- **Implemented defect**: `orden` was still typed and serialized although it is
  outside the supported V2 request contract.

### Corrected Behavior and Evidence Boundary

- Both entrypoints now require complete explicit date pairs and propagate
  `ordenar_por`.
- A watermark produces a five-minute-overlap `cambio_desde` plus a single UTC
  `cambio_hasta` captured at sync start; `ttl_cambio_ms` is not combined with
  that derived range.
- `orden` is rejected before dispatch and cannot be serialized by the client.
- The minimal telemetry option is retained: existing checkpoints/raw audit
  records remain authoritative; `Retry-After` parsing is documented without a
  migration, duplicate manifest, raw header capture, or secret-bearing JSON.
- The operator guide records official, implemented, policy, and unknown claims.
  No raw body, ticket, or complete request header is included in this change.

### Verification Cases

- unilateral publication and change windows reject before a request is made;
- a watermark produces one complete UTC range;
- `orden` rejects and `ordenar_por` reaches both entrypoints; and
- the lightweight documentation check pins the official-link and critical
  safety claims.

### Frozen Decisions (per task 0.5 footnote)

| Decision | Frozen value | Source |
| --- | --- | --- |
| Config vars (12) | `MERCADO_PUBLICO_API_TICKET` (sensitive), `COMPRA_AGIL_API_TICKET` (sensitive), `MERCADO_PUBLICO_API_V1_BASE_URL`, `COMPRA_AGIL_API_BASE_URL`, `MERCADO_PUBLICO_HTTP_TIMEOUT_MS`, `MERCADO_PUBLICO_HTTP_MAX_RETRIES`, `MERCADO_PUBLICO_HTTP_RETRY_BACKOFF_MS`, `MERCADO_PUBLICO_QUOTA_TIMEZONE` (default `America/Santiago`), `MERCADO_PUBLICO_CSV_STORAGE_ROOT`, `MERCADO_PUBLICO_CSV_OC_SOURCE_URL`, `MERCADO_PUBLICO_CSV_LICITACIONES_SOURCE_URL`, `MERCADO_PUBLICO_CSV_DOWNLOAD_ENABLED` | design.md:418-429 |
| High-freq cadence | every 1 hour (if automation added later) | design.md:297, ingestion-context.md:229 |
| Low-freq cadence | every 24 hours (if automation added later) | design.md:300, ingestion-context.md:230 |
| Phase-1 execution | manual only, no scheduler | design.md:287, spec.md:361-373 |
| Recent-state boundary | `now(America/Santiago) <= max(FechaCierre, FechaPublicacion) + 30 days` | ingestion-context.md:182, source-contract.md, design.md:225 |
| CSV re-download conflict | keep both raw files, recompute canonical from newer, emit reconciliation event | ingestion-context.md:183, design.md:249-253 |
| `mp` schema | static, deployment-local, instance commands, NOT workspace schema | ADR 0005, design.md:20-28 |
| API V1 date format | `ddmmaaaa` | source-contract.md:46, spec.md:55 |
| V2 Compra Agil bounds | `tamano_pagina <= 50`, `numero_pagina >= 1`, `id`/`q` mutually exclusive | source-contract.md:174-176, spec.md:99-103 |
| OC↔licitacion link | `CodigoLicitacion = CodigoExterno`, optional | source-contract.md:116-118 |
| Compra Agil↔OC link | `id_orden_compra` or `id_oc`, never `codigo_orden_compra` | source-contract.md:190-192, design.md:232-234 |
| Non-null protection | never overwrite non-null canonical with null | design.md:195, spec.md:192-195 |
| Gold freshness | healthy ≤1.5x, degraded ≤3x, stale >3x cadence | design.md:316-319, ingestion-context.md:232-235 |
| HTTP failure classification | 400=param error, 401/403=hard fail, 404=soft miss, 429/500/503/timeout=retryable bounded | design.md:398-405, spec.md:304-329 |

### Binding Schema Note

- `schema-catalog.md` now freezes the exact table inventory, columns, unique keys, FK relationships, and enum-like CHECK constraints for tasks 2.1-2.14.
- The implementation order below may split work across multiple instance commands or slices, but each selected table must land with its full catalog-defined shape. No invented intermediate column sets.

### Tracer-Bullet Slice (task 1.1 will define formally; pre-selection here)

**Slice**: `api-v1-licitaciones-by-date` end-to-end, narrowest vertical:
1. Instance command creates `mp` schema + `mp.raw_api_payload` + `mp.stg_job_run` + `mp.licitacion` (minimum subset).
2. Config vars registered (`MERCADO_PUBLICO_API_TICKET`, `MERCADO_PUBLICO_API_V1_BASE_URL`, HTTP settings).
3. MP module + driver module + API client service (V1 Licitaciones by-date only).
4. `@Processor` job: format date `ddmmaaaa` → call V1 → persist raw payload → staging → canonical refresh (licitacion only, no items/offers yet).
5. Manual trigger `@Command`.
6. Read contract: `listDetectedProcesses` minimum shape (processType, processCode, canonicalState, sourcePriority, lastSeenAt).
7. Unit tests: `ddmmaaaa` formatting, HTTP failure classification. Integration test: DB-backed raw persist + canonical + read contract.

This slice proves: schema creation, config, secure HTTP, queue, raw persistence, canonical refresh, read contract — the full backbone stack on one narrow path.

### Implementation Order (dependency-ordered, mapped to repo patterns)

#### Foundation blockers (Phase 2 tasks 2.1-2.5, 3.1-3.2)
1. **2.1**: Instance command scaffold — `npx nx run twenty-server:database:migrate:generate --name mp-schema-foundation --type fast`. Reference: `2-9-instance-command-fast-1799000030000-add-logic-function-execution-mode.ts:6-25`.
2. **2.2**: `CREATE SCHEMA IF NOT EXISTS mp` in the command `up`, `DROP SCHEMA IF EXISTS mp CASCADE` in `down`.
3. **2.3-2.5**: Raw API payload, raw CSV file, raw CSV row tables — `CREATE TABLE IF NOT EXISTS mp.raw_api_payload(...)`, etc. in same or follow-up fast commands. Follow `schema-catalog.md` §Raw Layer exactly; design.md summaries are no longer sufficient by themselves.
4. **3.1**: MP module — `modules/mercado-publico/mercado-publico.module.ts`. Register in `ModulesModule` (`modules.module.ts:10-22`). Reference: `connected-account.module.ts:10-18`.
5. **3.2**: Config vars — add 12 fields to `config-variables.ts:56-1893`. Reference: `OUTBOUND_HTTP_SAFE_MODE_ENABLED` (line 83-90). Add tickets to masking config. Read via `TwentyConfigService.get(...)`.

#### Tracer-bullet slice (Phase 2 tasks 2.6, 2.9, 3.4-3.5, 3.20, 3.23, 3.30 + Phase 1 test tasks)
6. **3.4**: V1 Licitaciones API client — `drivers/api/mercado-publico-api-client.service.ts`. Inject `SecureHttpClientService` + `TwentyConfigService`. Reference: `google-calendar-get-events.service.ts:14-124`, `call-webhook.job.ts:72-79`.
7. **3.5**: V1 Licitaciones by-date job — `jobs/api-v1-licitaciones-by-date.job.ts`. `@Processor(MessageQueue.mercadoPublicoQueue)`. Format date `ddmmaaaa`, call client, persist raw, staging, canonical refresh. Reference: `upsert-timeline-activity-from-internal-event.job.ts:15-72`.
8. Manual trigger command — `commands/mercado-publico-trigger-licitaciones-by-date.command.ts`. Reference: `calendar-trigger-event-list-fetch.command.ts:29-130`.
9. Register job module in `JobsModule` (`jobs.module.ts:49-106`).
10. **2.6, 2.9**: Staging + canonical licitacion tables (minimum subset for slice). For each selected table, implement the full `schema-catalog.md` §Staging Layer / §Canonical Layer shape rather than a narrowed ad hoc subset of columns.
11. **3.20, 3.23, 3.30**: Staging projection, canonical refresh, read contract `listDetectedProcesses` minimum.
12. Tests: unit (`ddmmaaaa` format, failure classification) + integration (DB-backed slice).

#### Source expansion (Phase 2 tasks 2.7-2.14, 3.6-3.19, 3.21-3.25)
13. Remaining API V1 jobs (by-state, detail-by-codigo for licitacion + OC).
14. API V2 Compra Agil client + jobs (incremental, publication-window, detail).
15. CSV download + profiling + raw load (2.7-2.8, 3.16-3.19) — requires new `csv-parse` dep + `zlib`.
16. Canonical refresh for OC, Compra Agil, items, offers, adjudicaciones (3.23-3.25).
17. CSV scalar normalization utils (3.26) — comma decimals, sentinel dates, null-like.

#### Hardening (Phase 2 tasks 2.12-2.14, 3.27-3.35)
18. Non-null-over-null protection + idempotent rerun (3.27).
19. Reconciliation link + event objects (2.12-2.13) + policies (3.28-3.29).
20. Gold/read objects (2.14) + read contracts (3.30-3.34) — pipeline health, quota, CSV file health.
21. Bounded retry + quota reset + failure classification (3.35).
22. Operator runbook (3.37).

#### Validation (Phase 4)
23. Unit tests: request formatting, CSV profiling, scalar normalization, reconciliation rules, non-null protection.
24. Integration tests: schema creation, raw persistence, list-to-detail, CSV load, reconciliation, read contracts.
25. Fixture coverage: API V1/V2 + CSV (latin-1, `;`, `"`, comma decimals, sentinel, repeated keys).

#### Closeout (Phase 5)
26. Update durable docs if impl changes understanding.
27. CHANGELOG.md review.
28. Handoff notes.

### Module Shape (deep module, small interface)

```
modules/mercado-publico/
  mercado-publico.module.ts              # @Module, imports driver+job+csv+read modules, exports read service
  drivers/
    api/
      mercado-publico-api-client.service.ts   # V1 + V2 HTTP calls via SecureHttpClient
      mercado-publico-api-driver.module.ts    # imports SecureHttpClientModule, TwentyConfigModule
      utils/
        parse-mercado-publico-error.util.ts   # classify 400/401/403/404/429/500/503
        format-v1-date.util.ts                # ddmmaaaa
        classify-http-failure.util.ts         # -> param_error|hard_fail|soft_miss|retryable
      mocks/
        v1-licitacion-list.example.ts
        v1-licitacion-detail.example.ts
        v1-oc-list.example.ts
        v1-oc-detail.example.ts
        v2-compra-agil-list-with-oc.example.ts
        v2-compra-agil-list-without-oc.example.ts
        v2-compra-agil-detail.example.ts
  csv/
    mercado-publico-csv.service.ts            # profileFile + parseRows, encoding/delimiter/quotechar detection
    mercado-publico-csv.module.ts
    utils/
      detect-encoding.util.ts                 # utf-8/utf-8-sig/latin-1 fallback
      detect-delimiter.util.ts                # ;|,|tab||
      normalize-scalar.util.ts                # comma decimals, NA/blank, 1900-01-01 sentinel
  persistence/
    mp.datasource.ts                          # static schema 'mp' datasource (not workspace-scoped)
    entities/                                 # raw_api_payload.entity.ts, raw_csv_file.entity.ts, etc.
  jobs/
    api-v1-licitaciones-by-date.job.ts
    api-v1-licitaciones-by-state.job.ts
    api-v1-licitacion-detail-by-codigo.job.ts
    api-v1-oc-by-date.job.ts
    api-v1-oc-by-state.job.ts
    api-v1-oc-detail-by-codigo.job.ts
    api-v2-compra-agil-incremental.job.ts
    api-v2-compra-agil-by-publication-window.job.ts
    api-v2-compra-agil-detail-by-codigo.job.ts
    csv-licitaciones-download.job.ts
    csv-oc-download.job.ts
    csv-file-profile.job.ts
    csv-raw-load.job.ts
    csv-canonical-refresh.job.ts
    reconciliation-refresh.job.ts
    mercado-publico-job.module.ts             # imports api-driver + csv + persistence modules
  commands/
    mercado-publico-trigger-licitaciones-by-date.command.ts
    ... (one per job, or grouped)
  services/
    mercado-publico-read-contract.service.ts  # listDetectedProcesses, getDetectedProcessDetail, getPipelineHealth, getApiQuotaUsage, getCsvFileHealth
    mercado-publico-canonical-refresh.service.ts
    mercado-publico-reconciliation.service.ts
```

### Key Design Decisions for Implementation

- **`mp` datasource**: NOT workspace-scoped. Create a dedicated `TypeOrmModule.forFeature([...MP entities], 'mp')` or a custom datasource with `schema: 'mp'` (reference: `core.datasource.ts:40-84` which uses `schema: 'core'`). Entities use `@Entity({ name: '...', schema: 'mp' })`. Do NOT use `@InjectWorkspaceScopedRepository` — use standard `@InjectRepository`.
- **No public API surface**: MP module exports only internal services. No `@Resolver`, `@Controller`, or MCP tool. Read contracts are service methods consumed internally.
- **CSV files**: Use `StorageDriver` (S3 or local) directly for `MERCADO_PUBLICO_CSV_STORAGE_ROOT`, not workspace-scoped `FileStorageService` (which ties to `FileEntity` + workspace). Audit contract = `mp.raw_csv_file` metadata, not filesystem.
- **Job retry**: Use `messageQueueService.add(jobName, data, { retryLimit: MERCADO_PUBLICO_HTTP_MAX_RETRIES })` for bounded retry. HTTP 401/403 = hard fail (no retry). 429/500/503/timeout = retryable. Classify in job handler, not in queue config.
- **Idempotency**: Raw dedupe via unique keys (design.md:388-394). Canonical upsert by natural key. Reconciliation event dedupe by logical fingerprint.

---

## Investigation Summary

- **Patterns**: 8 categories EXISTS (module, instance commands, queue, secure HTTP, config, file storage, tests, logging, API client reference). 2 categories NOT FOUND (CSV parsing, decompression) — must create fresh.
- **Baseline**: 3 pre-existing Windows-specific failures documented (rimraf single-quote bug, bash-syntax-in-cmd lint bug, workspace-migration-runner type errors). None caused by MP change (docs-only). Implementation must not regress.
- **Blast radius**: Additive — new `modules/mercado-publico/` directory, new instance commands, config vars, queue enum entry, JobsModule import, package.json deps. No existing business module modified except `ModulesModule` (one import). No public API surface. No frontend.
- **Plan**: Foundation blockers → tracer-bullet slice (`api-v1-licitaciones-by-date` end-to-end) → source expansion → hardening → validation → closeout. Frozen decisions table above.
- **No implementation code written in this phase** (per Phase 0 contract).
- **Schema catalog**: `schema-catalog.md` is the binding column-level schema for all `mp` tables. Phase 2 instance commands must follow it exactly. Any deviation requires updating the catalog first.
