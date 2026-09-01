## Context

Mercado Publico already has a useful operational logging surface, but each
class builds human prose independently. The highest useful seam is the message
passed to the existing native Nest `Logger`, not the global driver. A pure
formatter can normalize messages without changing logger construction,
configuration, output drivers, or business services.

## Goals / Non-Goals

**Goals**

- Make every in-scope Mercado Publico operational message start with a stable
  dotted event name.
- Keep attributes flat, scalar, deterministic, safe, and parseable from one
  physical line.
- Remove manually embedded JSON from operational message text.
- Reduce high-cardinality INFO noise while retaining opt-in detail telemetry.
- Preserve all durable evidence, audit data, provider security rules, and logger
  compatibility.

**Non-Goals**

- Replace the logger driver or introduce structured logging infrastructure.
- Define a repository-wide migration outside the Mercado Publico boundary.
- Make operational logs a source of truth for sync state or audit history.

## Boundary and Ownership

### Formatter module

`packages/twenty-server/src/engine/core-modules/logger/utils/format-log-event.util.ts`
owns the `formatLogEvent` Interface. Its input is an event name and a flat
`Record<string, string | number | boolean | null | undefined>`. Its output is
one string. It does not log, mutate input, inspect secrets, serialize objects,
or depend on Nest.

The logger utility is the Adapter between typed event fields and the existing
native Nest logger message Interface. This seam has high Leverage and Locality:
one pure implementation controls output shape while existing callers retain
their logger instances.

### Mercado Publico callsites

The Mercado Publico module owns event meaning and field selection. Each callsite
passes only fields needed to understand the operational transition. It must not
pass raw responses, request params, tickets, headers, idempotency keys, RUTs, or
object-shaped values.

### Test seam

The first proof crosses the formatter seam. Focused callsite tests then cross
the native logger seam and assert message and level. Persistence and audit tests
remain the proof for JSON and durable evidence; they are not rewritten as log
tests.

## Decisions

1. Use a pure string formatter instead of changing `LoggerService`.

   Rationale: current Mercado Publico classes use native `Logger`, and the
   requested behavior is message grammar, not a new driver contract. This is the
   smallest seam that supports all 19 calls without a global refactor.

   Alternatives considered:
   - Extend `LoggerService` with an object context API.
     - Rejected because the scoped callsites do not use that service and the
       change would alter a global Nest contract.
   - Replace the logger driver with a JSON logger.
     - Rejected because it adds dependency and deployment-wide behavior outside
       this change.

2. Render events as space-delimited `event key=value` tokens.

   Rationale: event names stay grep-friendly and first; scalar fields remain
   visible without embedding a JSON object.

   Serialization rules:
   - The event name is the first token and is emitted unchanged.
   - Attribute keys are sorted in ascending lexical order.
   - `undefined` attributes are omitted.
   - `null` is rendered as the literal `null`.
   - Booleans use lowercase `true` or `false`; numbers use their normal decimal
     string form.
   - A safe token string is emitted unquoted. A string containing whitespace,
     control characters, `=`, quotes, or backslashes is quoted and escaped with
     JSON string escaping for that scalar value only.
   - Newline, carriage return, tab, quote, and backslash characters never reach
     the returned physical message as raw control characters.

   Example:

   ```text
   mercado_publico.sync.completed discovery_complete=true records_deferred=2 records_discovered=10 status="partial_failed"
   ```

3. Use `mercado_publico` as event domain and stable components by runtime seam.

   Rationale: the domain identifies the feature, while component names separate
   API, sync, control, replay, quota, and fixture behavior for AI and grep
   queries. Action states use snake_case.

   Event catalog for the 19 current calls:

   | Current behavior | Event | Safe fields | Level |
   | --- | --- | --- | --- |
   | Remove operator | `mercado_publico.sync_operator.removed` | `workspace_id`, `user_workspace_id` | INFO |
   | Assign operator | `mercado_publico.sync_operator.assigned` | `workspace_id`, `user_workspace_id`, `assigned_by_user_workspace_id` | INFO |
   | E2E fixture ready | `mercado_publico.e2e.fixture_ready` | `fixture_id` | INFO |
   | E2E read models ready | `mercado_publico.e2e.read_model_seeded` | `fixture_ids` | INFO |
   | Sync commands re-dispatched | `mercado_publico.sync.recovery_redispatched` | `command_count` | INFO |
   | Debt recovery runs dispatched | `mercado_publico.debt_recovery.dispatched` | `run_count` | INFO |
   | Compra Agil list requested | `mercado_publico.api.list_requested` | `parameter_keys` | INFO |
   | Compra Agil detail requested | `mercado_publico.api.detail_requested` | `codigo` | DEBUG |
   | Command no-op | `mercado_publico.sync_command.no_op` | `command_id`, `reason` | INFO |
   | Inactive command attempt | `mercado_publico.sync_command.attempt_inactive` | `command_id`, `attempt_id` | WARN |
   | Quota record failed | `mercado_publico.quota.rate_limit_record_failed` | `source`, `error` | WARN |
   | Attempt telemetry failed | `mercado_publico.sync.attempt_record_failed` | `attempt_number`, `process_code`, `error` | WARN |
   | Sync cancelled | `mercado_publico.sync.cancelled` | `sync_run_id` | INFO |
   | Sync completed | `mercado_publico.sync.completed` | existing completion counters and booleans | INFO |
   | Contract records rejected | `mercado_publico.sync.contract_rejected` | `endpoint`, `records_rejected`, `contract_issue_count`, `schema_fingerprint` | WARN |
   | Provider schema changed | `mercado_publico.sync.schema_changed` | `endpoint`, `previous_schema_fingerprint`, `schema_fingerprint` | WARN |
   | Evidence replay finished | `mercado_publico.replay.finished` | `intent`, `sync_run_id`, `status` | INFO |
   | Deferred item recovery failed | `mercado_publico.debt_recovery.item_failed` | `process_code`, `error` | WARN |
   | Sync command dispatch failed | `mercado_publico.sync_command.dispatch_failed` | `command_id`, `error` | WARN |

   `parameter_keys` and `fixture_ids` are comma-delimited scalar strings, not
   arrays. They contain names or public fixture identifiers only.

4. Preserve data boundaries and remove sensitive/high-cardinality fields at the
   callsite.

   Rationale: the formatter cannot determine whether a scalar is safe. Callers
   must select safe fields. Tickets, headers, raw responses, full request
   params, idempotency keys, and RUTs are excluded. Existing normalized error
   summaries remain allowed when they contain no provider secret or raw body.
   The detail request remains available at DEBUG for explicit diagnostics but is
   absent from default INFO output.

5. Keep documentation in the existing standard.

   Rationale: `docs/standards/logging-standard.md` is the durable source of
   logging rules. Add TypeScript/Nest usage and the Mercado Publico adapter
   contract there instead of creating a duplicate operations document.

## Blast Radius

### Touched runtime areas

- Logger formatter utility and focused formatter tests.
- 19 Mercado Publico operational logger callsites and their focused tests.

### Touched documentation areas

- Existing logging standard.
- `packages/twenty-server/AGENTS.md` routing guidance.

### Untouched runtime areas

- `LoggerModule`, `LoggerService`, logger drivers, configuration, and log-level
  defaults.
- `mp` persistence, raw evidence, audit events, migrations, sync behavior,
  queue behavior, provider calls, GraphQL, and CRM projections.

## Verification Strategy

- Add formatter tests before implementation and assert exact output strings.
- Add focused logger assertions for completion JSON removal, contract/schema
  fields, API request safety, DEBUG detail level, and fixture RUT removal.
- Run Mercado Publico focused tests for all migrated owners.
- Search for in-scope logger calls that do not pass through `formatLogEvent` and
  for `JSON.stringify` remaining only in approved non-log locations.
- Run changed-file lint, `npx nx typecheck twenty-server`, and
  `openspec validate mercado-publico-event-first-logging`.
