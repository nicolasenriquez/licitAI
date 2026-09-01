## ADDED Requirements

### Requirement: Event messages use deterministic first-token formatting

The system SHALL provide a pure `formatLogEvent(eventName, attributes)` utility
for Mercado Publico operational messages. The returned message SHALL begin with
the unchanged event name, use space-delimited `key=value` scalar attributes,
sort attribute keys lexically, omit `undefined`, render `null` explicitly, and
contain no raw newline, carriage return, tab, quote, or backslash control
characters from string values.

#### Scenario: Formatter emits stable scalar output

- **WHEN** a caller formats an event with strings, a number, a boolean, `null`,
  and an `undefined` value
- **THEN** the event is first, keys are alphabetically ordered, `undefined` is
  absent, `null` is present as `null`, and scalar values are preserved

#### Scenario: Formatter escapes a multiline value

- **WHEN** an attribute string contains whitespace, quotes, backslashes, or a
  newline
- **THEN** the value is quoted and escaped, and the returned message remains one
  physical line

#### Scenario: Formatter rejects non-scalar input at the type boundary

- **WHEN** a caller attempts to pass an object or array as an event attribute
- **THEN** the TypeScript interface does not accept that value and the formatter
  does not define object or array serialization

### Requirement: Mercado Publico operational logs use stable event names

The system SHALL route all 19 operational logger calls under
`packages/twenty-server/src/engine/core-modules/mercado-publico/` through
`formatLogEvent` and SHALL use the event catalog defined by this change. Event
names SHALL follow `mercado_publico.<component>.<action_state>` with snake_case
in the final action/state segment.

#### Scenario: Sync completion is machine-readable without embedded JSON

- **WHEN** a durable V2 sync completes
- **THEN** the log starts with `mercado_publico.sync.completed`, exposes the
  existing counters as scalar fields, and contains no serialized JSON object

#### Scenario: Contract and schema warnings preserve diagnostic fields

- **WHEN** a provider response rejects records or changes schema fingerprint
- **THEN** the warning uses the corresponding stable event and retains endpoint,
  counts, and fingerprints as separate scalar fields

### Requirement: Operational logs preserve provider and audit safety boundaries

Operational event attributes SHALL exclude Mercado Publico tickets, full
headers, raw provider payloads, full request parameter values, idempotency keys,
RUTs, and object or array payloads. JSON used for raw evidence, persistence,
checksums, cursors, exception construction, and append-only audit data SHALL
remain unchanged.

#### Scenario: List request logs safe parameter metadata

- **WHEN** the Compra Agil list client emits request telemetry
- **THEN** it logs parameter names or equivalent safe metadata without logging
  parameter values or the API ticket

#### Scenario: Fixture telemetry avoids personal data

- **WHEN** an E2E fixture or read-model seed command reports readiness
- **THEN** it logs fixture identifiers or counts and does not log the seeded RUT

#### Scenario: Durable audit JSON remains persisted

- **WHEN** sync control or evidence services write request, result, audit, or raw
  evidence data
- **THEN** existing JSON serialization and persistence behavior remain unchanged
  even though operational messages use scalar event formatting

### Requirement: High-cardinality detail telemetry is not emitted at INFO

The Compra Agil detail-by-code request event SHALL use DEBUG level. Other event
levels SHALL preserve the current INFO or WARN severity unless the event catalog
explicitly identifies a change.

#### Scenario: Detail hydration runs for many records

- **WHEN** the worker requests detail for each discovered Compra Agil record
- **THEN** each request may emit `mercado_publico.api.detail_requested` at DEBUG,
  and the request does not add one INFO message per record

### Requirement: Event formatting does not alter business behavior

The logging migration SHALL not change provider requests, sync state
transitions, retries, quota accounting, authorization, persistence ordering,
raw evidence, audit append-only behavior, GraphQL contracts, or CRM projection
behavior.

#### Scenario: Logging formatter receives an operational failure

- **WHEN** an existing warning path formats its normalized error message
- **THEN** the same warning path, return behavior, and durable state outcome are
  preserved while the emitted message uses the event grammar
