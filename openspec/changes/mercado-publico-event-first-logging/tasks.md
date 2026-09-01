## 0. Investigation and Scope Lock

- [ ] 0.1 Confirm the 19 in-scope logger calls and map each call to its owner,
  event name, level, and safe scalar fields using `design.md`.
  Traceability: closes the callsite ownership and event-catalog gap before runtime edits.

- [ ] 0.2 Classify every `JSON.stringify` in the Mercado Publico surface as
  operational-message serialization or required persistence, checksum, cursor,
  exception, provider, or audit data; record any deviation from the catalog.
  Traceability: prevents removal of required audit serialization while eliminating embedded log JSON.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add failing formatter tests at
  `packages/twenty-server/src/engine/core-modules/logger/utils/__tests__/format-log-event.util.spec.ts`
  for event-first output, sorted keys, scalar values, omitted `undefined`,
  explicit `null`, quoting, escaping, and one physical line.
  Traceability: this is the first proof of the new formatting contract and must fail before the utility exists.

- [ ] 1.2 Add or update API client tests to prove list telemetry exposes only
  safe parameter metadata and detail telemetry is DEBUG with a `codigo` field.
  Traceability: proves provider-secret safety and the high-cardinality level change at the API seam.

- [ ] 1.3 Add or update durable-sync and evidence-replay tests to prove completion,
  contract-rejection, schema-change, cancellation, attempt-failure, and replay
  messages use event-first scalar fields without embedded JSON.
  Traceability: proves the highest-volume and diagnostic sync events before migration.

- [ ] 1.4 Add or update sync-control, command, cron, quota, operator, and E2E
  command tests to prove event names, safe fields, and removal of RUT from
  fixture readiness messages.
  Traceability: proves remaining operational owners and sensitive-field boundaries before migration.

## 2. Implementation

### Formatter seam

- [ ] 2.1 Implement the pure `formatLogEvent` utility and its scalar types at
  `packages/twenty-server/src/engine/core-modules/logger/utils/format-log-event.util.ts`.
  Traceability: provides one local adapter for deterministic event messages without changing the global logger contract.

### API and provider telemetry

- [ ] 2.2 Migrate Compra Agil list and detail request logs in
  `mercado-publico-api-v2-compra-agil-client.service.ts`; keep list metadata
  value-free and emit detail request telemetry at DEBUG.
  Traceability: isolates provider-facing log safety and per-record cardinality at the API adapter seam.

### Sync lifecycle telemetry

- [ ] 2.3 Migrate durable-sync and evidence-replay logger calls to the event
  catalog, preserving existing counters, statuses, error summaries, and
  fingerprints as scalar attributes.
  Traceability: removes embedded completion/drift JSON while preserving durable sync behavior and replay outcomes.

### Control and operational commands

- [ ] 2.4 Migrate sync-control, sync-command job, recovery/debt cron jobs, quota
  tracker, operator command, and E2E fixture/read-model command logger calls;
  remove RUT values and preserve only safe identifiers, counts, and reasons.
  Traceability: completes the scoped 19-call migration across control, recovery, quota, operator, and fixture seams.

## 3. Verification

- [ ] 3.1 Run formatter tests and existing logger service tests; confirm the new
  utility does not alter `LoggerService` delegation or performance logging.
  Traceability: proves the formatter seam and global logger compatibility directly.

- [ ] 3.2 Run API client tests and source scans proving no ticket, header, full
  request value, or INFO-level per-record detail log is emitted.
  Traceability: closes the provider safety and cardinality symptom at its source.

- [ ] 3.3 Run durable-sync and evidence-replay tests; assert completion and drift
  messages have no embedded JSON and all required counters/fingerprints remain.
  Traceability: closes the original JSON-in-message symptom and preserves diagnostic coverage.

- [ ] 3.4 Run sync-control, job, cron, quota, operator, and fixture tests; scan
  all 19 callsites for formatter usage and classify remaining JSON uses as
  non-operational; run changed-file lint and `npx nx typecheck twenty-server`.
  Traceability: proves migration completeness and behavior preservation across remaining owners.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update `docs/standards/logging-standard.md` with the TypeScript/Nest
  formatter contract, scalar grammar, safety boundary, and Mercado Publico
  event catalog without creating a duplicate operations logging document.
  Traceability: makes the shipped event convention durable at the repository standard source.

- [ ] 4.2 Add a concise `formatLogEvent` usage rule and scope boundary to
  `packages/twenty-server/AGENTS.md`.
  Traceability: routes future server work to the adopted formatter without widening the global logger contract.

- [ ] 4.3 Run `openspec validate mercado-publico-event-first-logging` and confirm
  proposal, design, tasks, and capability spec remain aligned.
  Traceability: provides final artifact-level proof before implementation handoff.

## Execution Order

### Slice 1 - Formatter contract

- Tasks: `0.1 -> 0.2 -> 1.1 -> 2.1 -> 3.1`
- Checkpoint: formatter tests pass with deterministic, escaped, scalar-only output and existing logger behavior remains unchanged.
- Blocks: Slices 2, 3, and 4.

### Slice 2 - API and provider telemetry

- Tasks: `1.2 -> 2.2 -> 3.2`
- Checkpoint: list logs contain safe metadata only, detail logs are DEBUG, and no provider secret or per-record INFO noise remains.
- Blocked by: Slice 1.
- Blocks: Slice 5.

### Slice 3 - Sync lifecycle telemetry

- Tasks: `1.3 -> 2.3 -> 3.3`
- Checkpoint: completion and drift events expose scalar diagnostics without embedded JSON and sync behavior is unchanged.
- Blocked by: Slice 1.
- Blocks: Slice 5.

### Slice 4 - Control and operational commands

- Tasks: `1.4 -> 2.4 -> 3.4`
- Checkpoint: all remaining operational calls use the catalog, fixture logs omit RUT, and static classification finds no unapproved operational JSON.
- Blocked by: Slice 1.
- Blocks: Slice 5.

### Slice 5 - Documentation and artifact closeout

- Tasks: `4.1 -> 4.2 -> 4.3`
- Checkpoint: durable guidance matches verified runtime output and OpenSpec validation passes.
- Blocked by: Slices 2, 3, and 4.
- Blocks: None.
