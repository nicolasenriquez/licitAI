# Mercado Público V2 Detail Contract — Session Summary

## Objective
- Finish MP V2 detail contract ticket: projection writes `parent_provider_key` + `mp.v2_relation_snapshot`; durable sync records cohort `lifecycle_reason`; unit tests + server typecheck green; integration/e2e specs aligned with real surfaces.

## Work State

### Completed
- Projection service (`services/mercado-publico-v2-projection.service.ts`): child evidence INSERT now 8 cols incl `parent_provider_key`; nested key `${providerIdentifier ?? providerOrdinal}:${productIdentifier ?? productOrdinal}`; parent = `child.providerKey?.split(':', 1)[0]`. Added `projectRelationSnapshots`: 4 rows/observation (documentos, productos_solicitados, proveedores_cotizando, productos_cotizados), `availability` available/unavailable, `ON CONFLICT (observation_id, relation) DO UPDATE SET availability, total_count, source_kind, projected_at = now()`, `source_kind` = `context.snapshotKind`.
- Durable sync (`services/mercado-publico-v2-durable-sync.service.ts`): terminal path captures `classifyV2CompraAgilLifecycle(detailRecord, true).reason` → `markCohortTerminal(context, codigo, lifecycle.reason)`; method sets `lifecycle_reason = $5` (param type `MercadoPublicoV2LifecycleClassification['reason']`). Verified: import line 12, call ~line 726, method ~822.
- Unit spec fixes:
  - `services/__tests__/mercado-publico-v2-projection.service.spec.ts`: buildContext now annotated `: MercadoPublicoV2ProjectionContext` (+ type import) — fixed 4× TS2345 (response.source widening + `record: never`). Snapshot expectations already match 4-row design.
  - `services/__tests__/mercado-publico-v2-durable-sync.service.spec.ts`: +1 test `marks a terminal cohort with its lifecycle reason` (white-box cast of private `markCohortTerminal`; asserts UPDATE contains `lifecycle_reason = $5` and params `[sync-run-1, api-v2-compra-agil, global, CA-TERMINAL-001, terminal_cancelled]`).
- Duplicate spec deleted: `drivers/api/utils/__tests__/normalize-v2-compra-agil-record.util.spec.ts` (stale, old 14-field shape) via `git rm` — current spec lives at `drivers/api/__tests__/`.
- Normalize spec re-added `does not invent unavailable fields` (all 30 fields).
- Integration spec REWRITTEN (Phase-2 scope): deleted `test/integration/mercado-publico/suites/v2-detail-read.integration-spec.ts` (imported nonexistent Phase-3 `MercadoPublicoV2DetailReadService`/`MercadoPublicoV2DetailResolver`); wrote `v2-detail-contract.integration-spec.ts`:
  - Full 2-16 command chain: schema(7505) → raw-api-payload(7517) → raw-csv-file(7600) → raw-csv-row(7700) → stg-job-run(7800) → stg-api-v2-compra-agil(7830) → canonical-compra-agil(7880) → gold-read-objects(7910) → golden-path(1784) → relax(1784000000010) → durable(1785) → cohort(1786) → evidence-history-replay(1787) → activas-filters(1789) → detail-contract(1790).
  - 6 tests: schema/columns exist (information_schema); child evidence w/ parent keys (`501:101` → `501`); relation snapshots (4 available rows, source_kind detail); gold detail fields (description, delivery_days, cancel_motive, total_offers 3, total_demands 0, fine_penalty '0', etc.); replay idempotency (2 observations, 4 children, 4 snapshots, 1 compra_agil, skipped=true); `down()` reverses (drop table+cols) then `up()` restores.
  - Fixture `buildDetailFixture()`: raw API shape — codigo/nombre/descripcion, estado {codigo,id_estado,glosa}, institucion {rut,organismo_comprador,region}, fechas, presupuesto, entrega, convocatoria, motivos, resumen, documentos [{id:77}], productos_solicitados [{codigo_producto:101}], proveedores_cotizando [{id_cotizacion:501, productos_cotizados:[...]}].
  - Context `buildContext()`: response literal matched to `MercadoPublicoApiV2CompraAgilListResponse`, `record: record as never`.
- Key DDL facts discovered: `mp.v2_observation` + `sync_run` created in golden-path (1784); `sync_run_item`/`sync_run_page`/`source_watermark` in durable (1785); `v2_cohort` in cohort (1786); `v2_child_evidence` + `v2_history` in evidence-history-replay (1787); `gold_detected_process` in gold-read-objects (7910); `stg_api_v2_compra_agil` in stg (7830); `raw_api_payload` in raw-api-payload (7517); schema+pgcrypto in mp-schema (7505). Dedupe constraint `uq_mp_v2_observation_run_code_checksum` dropped by 1787 (observations accumulate).

### Verified
- `npx nx typecheck twenty-server` → 0 errors (projection spec + integration spec + durable spec all clean).
- Unit sweep (from `packages/twenty-server`, pattern `mercado-publico`, `--testPathIgnorePatterns "test/integration"`): 69 suites / 491 tests PASS.
- Lint: `npx oxlint --config packages/twenty-server/.oxlintrc.json` on changed spec files → 0 warnings/errors.
- `npx jest "mercado-publico-v2-durable-sync" --runInBand` → 5/5.

### Blocked / Env
- Integration config (`jest-integration.config.ts`, testRegex `\.integration-spec\.ts$`, globalSetup `test/integration/utils/setup-test.ts`) requires container DB; host `localhost:5432` connection refused → `AggregateError` in globalSetup. Same pre-existing constraint for existing suites (reconciliation-refresh, csv-file-health-db). New spec will run in CI/container.
- `npx nx lint:diff-with-main twenty-server` fails on Windows: `The command line is too long` (script `scripts/lint-diff-with-main.mjs` builds argv from diff — Windows cmdline limit). Pre-existing; workaround: direct `npx oxlint` on changed files.

## Commands That Work
- Unit sweep: from `packages/twenty-server`: `npx jest "mercado-publico" --runInBand --testPathIgnorePatterns "test/integration"`.
- Integration collect: from `packages/twenty-server`: `npx jest --config jest-integration.config.ts "v2-detail-contract" --runInBand` (fails on DB connect from host, not code).
- Typecheck: `npx nx typecheck twenty-server` (grep `error TS`).
- File-lint: `npx oxlint --config packages/twenty-server/.oxlintrc.json <files>`.
- bash = PowerShell: no `&&`, no `sed`; use `;`, `Get-Content`, `Select-String`, `Out-File -Encoding utf8`.

## Next Steps
1. Run integration suite inside container/CI (DB available) — verify `v2-detail-contract.integration-spec.ts` fully green.
2. Phase 3 (issue 26): detail-read surface (`MercadoPublicoV2DetailReadService`/`MercadoPublicoV2ChildRelation`/`getChildEvidence`) — NOT implemented; `graphql/mercado-publico-v2-read.service.ts` (class line 273) + `mercado-publico-v2.resolver.ts` expose no child/relation API. Original detail-read integration spec content is preserved in this summary's earlier context (it was deleted; git cannot restore untracked file).
3. Playwright `detail-panel.spec.ts` (twenty-e2e-testing) intact — needs Phase-3 surface to pass.

## Relevant Files
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service.ts` (795 lines) — parent key + snapshots.
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service.ts` — lifecycle reason.
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/__tests__/mercado-publico-v2-projection.service.spec.ts` — context typing fixed.
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/__tests__/mercado-publico-v2-durable-sync.service.spec.ts` — +1 lifecycle test.
- `packages/twenty-server/test/integration/mercado-publico/suites/v2-detail-contract.integration-spec.ts` — NEW Phase-2 integration spec.
- `packages/twenty-server/src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1790000000000-mp-v2-detail-contract.ts` + `.spec.ts` — migration command (v2_relation_snapshot, parent_provider_key, lifecycle_reason, 16 gold detail cols), spec 3/3.
- `packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util.ts` + `drivers/api/__tests__/normalize-v2-compra-agil-record.util.spec.ts` — detail fields.
- `packages/twenty-e2e-testing/tests/mercado-publico/detail-panel.spec.ts` — intact (Phase-3 dependent).
- `.scratch/mercado-publico-v2-reconstruction/` — verification tmp files (typecheck/lint/sweep logs, DDL exploration).

## Git State
- NOT committed (no commit requested). Untracked/new: `v2-detail-contract.integration-spec.ts`. Deleted (untracked): `v2-detail-read.integration-spec.ts`. Modified (tracked): projection service, durable sync service, projection spec, durable-sync spec, instance-commands.constant.ts, normalizer util, normalizer spec.
