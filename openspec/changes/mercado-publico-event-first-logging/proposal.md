## Why

Mercado Publico operational logs are human-oriented prose. The 19 current
logger calls use native Nest `Logger` instances, and four messages embed JSON
text. This makes event grouping, field extraction, and failure classification
hard for AI agents and log tooling. One detail-by-code message is emitted at
INFO for every hydrated record, which adds high-cardinality noise.

The repository already defines the event namespace
`{domain}.{component}.{action_state}`. The runtime has no small TypeScript
formatter that applies that convention while preserving the existing native
logger setup.

## Investigation / Current State

- `LoggerService` forwards the existing Nest logger contract and has no event
  formatting interface. `LoggerModule` is global and must not be refactored for
  this scoped change.
- Mercado Publico classes instantiate native `Logger` directly. The calls are
  in commands, cron jobs, the V2 API client, the V2 sync job, sync-control and
  durable-sync services, quota tracking, and evidence replay.
- The API client logs only sanitized parameter names for list requests, but the
  detail request is logged once per record at INFO.
- Durable sync completion, contract rejection, and schema-change messages embed
  JSON objects in message text. Their data already exists as scalar counters,
  statuses, endpoints, and fingerprints.
- JSON used for raw evidence, request/result persistence, audit data, opaque
  cursors, checksums, and exception construction is not operational logging and
  must remain unchanged.
- Existing ingestion requirements prohibit logging tickets and raw provider
  data. Existing sync-control requirements keep audit records separate from
  operational logs.
- The durable source for the naming convention is
  `docs/standards/logging-standard.md`. No duplicate
  `docs/operations/logging.md` exists in this checkout.
- No implementation SDLC map exists in this checkout for this change.

## What Changes

- Add pure `formatLogEvent(eventName, attributes)` formatting under the server
  logger utilities.
- Accept only flat scalar attributes: strings, finite numbers, booleans,
  `null`, and `undefined`. Omit `undefined`, render `null` explicitly, sort
  attribute keys, and escape string whitespace/control characters so output is
  always one physical line.
- Migrate all 19 Mercado Publico operational logger calls to the event-first
  format. Use the event catalog and safe scalar fields in `design.md`.
- Downgrade per-record Compra Agil detail-request telemetry from INFO to DEBUG.
- Remove the RUT from E2E fixture/read-model operational messages. Keep fixture
  identifiers and counts where they are useful and non-sensitive.
- Preserve native Nest `Logger`, `LoggerService`, logger levels, audit writes,
  raw evidence, provider responses, request persistence, and all non-log JSON.
- Document the TypeScript formatter contract and the Mercado Publico event
  catalog in the existing logging standard, then add a narrow server routing
  note.

## Capabilities

### New Capabilities

- `mercado-publico-event-first-logging`: deterministic, safe, AI-friendly
  operational event messages for the Mercado Publico backend.

### Modified Capabilities

- None. Existing ingestion, sync-control, audit, and persistence contracts stay
  behaviorally unchanged; this change adds observability formatting rules.

## Change Profile

- Profile: mixed-change
- Why this profile fits: runtime log messages and log levels change, while the
  event grammar and implementation guidance also become durable documentation.

## Out Of Scope

- Replacing Nest logging, `LoggerService`, `ConsoleLogger`, or the global logger
  module.
- Adding Pino, Winston, structlog, OpenTelemetry logger providers, a logging
  dependency, or a global structured-logging migration.
- Introducing JSON log objects, a persistent event table, a remote collector,
  correlation middleware, or a new public API.
- Converting JSON used by persistence, raw evidence, checksums, API contracts,
  cursors, exception construction, or audit data.
- Migrating logger calls outside
  `packages/twenty-server/src/engine/core-modules/mercado-publico/`.
- Changing Mercado Publico sync, retry, quota, authorization, projection, or
  provider behavior.

## Ownership and Test Seam

- Highest existing Seam: the native Nest `Logger` calls at Mercado Publico
  runtime boundaries, where emitted message text and level are observable.
- Owning Module: `packages/twenty-server` logger utility for formatting and the
  Mercado Publico module for event selection and safe fields.
- Interface: `formatLogEvent(eventName, attributes)` returns one event-first
  string consumed as the first argument to the existing native logger methods.
  No caller depends on a new logger object or driver contract.
- Highest test Seam: the pure formatter test for serialization rules, followed
  by focused API, durable-sync, job, and sync-control tests that observe emitted
  message and level.
- Adapter: the formatter adapts typed scalar attributes to the native Nest
  logger message string. Native logger drivers remain unchanged.
- Depth / Leverage / Locality: one pure formatter gives consistent output at
  every current callsite; callsite migration stays local to Mercado Publico and
  avoids a global logger refactor.

## Prior Art and First Proof

- Prior art: `docs/standards/logging-standard.md`,
  `packages/twenty-server/src/engine/core-modules/logger/__tests__/logger.service.spec.ts`,
  `mercado-publico-v2-durable-sync.service.spec.ts`, API client tests, and
  sync-command job tests.
- First failing behavior or contract proof: a formatter test calls the new
  public function and asserts event-first ordering, sorted scalar attributes,
  omitted `undefined`, explicit `null`, escaped newline, and one physical line.
- First runtime proof: the durable-sync completion and contract-drift tests
  assert the event token is first and no JSON object is embedded in the message;
  the API client test asserts detail telemetry is DEBUG and contains only the
  process code.

## Execution Order Decision

- Required: yes
- Why: the formatter is a prerequisite for three independent callsite
  migration slices, and documentation closeout depends on all event names and
  fields being settled and verified.

## Impact

- Affects the logger utility and 19 operational log callsites in
  `packages/twenty-server` Mercado Publico code.
- Affects formatter, logger, API client, durable-sync, replay, sync-control,
  command, cron, quota, and fixture-related focused tests.
- Affects `docs/standards/logging-standard.md` and
  `packages/twenty-server/AGENTS.md` during closeout.
- Does not affect GraphQL contracts, database schemas, migrations, raw evidence,
  durable audit rows, provider request behavior, or other packages.

## Verification Policy

- Add formatter and callsite contract assertions before production changes.
- Verify the original JSON-in-message and INFO-cardinality symptoms directly.
- Use focused Jest tests, source searches, changed-file lint, server typecheck,
  and OpenSpec validation. Do not substitute a broad green suite for the
  message-safety proof.
- Search separately for operational logger calls and for persistence JSON so
  the migration does not delete required audit serialization.

## Notes

- Context: Mercado Publico V2 durable sync, ingestion security rules, and the
  repository logging standard.
- Assumptions: alphabetical attribute order is the deterministic ordering rule;
  safe token strings remain unquoted and strings needing escaping use quoted
  escaped output; `debug` is the intended level for per-record detail request
  telemetry.
- Boundaries: only operational message construction changes. Raw provider
  payloads, tickets, headers, audit JSON, persistence ordering, and business
  outcomes remain untouched.
- Existing staged work in `docs/standards/logging-standard.md` is user-owned
  context and is not modified while authoring this change.
