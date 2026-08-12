## ADDED Requirements

### Requirement: Historial expone sólo cambios semánticos con procedencia
The system SHALL expose a keyset-paginated `mercadoPublicoV2.history`
connection that requires an opportunity `codigo` and is sourced from its
append-only `mp.v2_history` events. Each node SHALL identify the opportunity,
event time, changed semantic fields, previous and new observation identifiers,
normalizer version, provider schema fingerprint, and provider and observation
times. It SHALL NOT substitute data from the current opportunity snapshot or
expose raw payloads, request data, or technical errors.

#### Scenario: Analyst reads a semantic change
- **WHEN** an authenticated analyst requests a history page for an opportunity
  with a persisted semantic change
- **THEN** the response returns the append-only event, its semantic diff and
  its provenance without values from the current snapshot

#### Scenario: History has no semantic change
- **WHEN** the selected history scope contains no rows in `mp.v2_history`
- **THEN** the response returns an empty connection and does not manufacture an
  event from the current opportunity projection

#### Scenario: History has no opportunity identity
- **WHEN** an authenticated analyst requests Historial without `codigo`
- **THEN** the system rejects the history query and the route shows guidance
  without querying a global event feed

#### Scenario: Analyst opens history from detail
- **WHEN** an authenticated analyst selects Historial in an existing V2 detail
- **THEN** the application opens Historial with that opportunity `codigo` in
  the URL and does not change the detail data contract

### Requirement: Compradores aggregates the filtered V2 population
The system SHALL expose a keyset-paginated `mercadoPublicoV2.buyers`
connection that groups the same server-side V2 population selected by the
opportunity filter. Each buyer aggregate SHALL use `buyerCode` as its stable
identity and SHALL include that code, a display name, opportunity count, buyer
and amount coverage, availability, completeness, and freshness time.
`buyerCoverage` SHALL equal opportunities with `buyerCode` divided by the
filtered population. `amountCoverage` SHALL equal opportunities with a valid
amount divided by the aggregate opportunity count. `availability` SHALL be
`available`, `partial`, or `unavailable` from those coverages;
`completeness` SHALL be complete only when both are 100 percent; and freshness
SHALL use the latest available observation time. Rows without `buyerCode` SHALL
affect coverage but SHALL NOT create an aggregate. The system SHALL preserve
unknown values as unknown, SHALL NOT calculate aggregates from a browser page,
and SHALL NOT convert currencies or return a monetary total.

#### Scenario: Filtered buyer demand matches Activas
- **WHEN** an authenticated analyst applies a V2 opportunity filter and
  requests buyers with that filter
- **THEN** each aggregate is calculated from the matching server-side
  population and returns its coverage and freshness

#### Scenario: Buyer values are incomplete
- **WHEN** some matching opportunities have no buyer or amount value
- **THEN** the response reports reduced coverage or availability and does not
  infer a buyer name, count, amount, or monetary total

#### Scenario: Buyer has no stable code
- **WHEN** a matching opportunity has a buyer name but no `buyerCode`
- **THEN** it contributes to buyer coverage but does not create a selectable
  buyer aggregate

### Requirement: Buyer selection returns to Activas through the URL
The system SHALL provide authenticated routes for Historial and Compradores.
Selecting a buyer SHALL navigate to Activas with its `buyerCode` serialized as
`buyer` in the URL without replacing the current history entry. The routes
SHALL use the existing Mercado Público V2 workspace shell and SHALL provide no
operations or protected operational fields.

#### Scenario: Analyst selects a buyer
- **WHEN** an authenticated analyst selects a buyer in Compradores
- **THEN** the application opens Activas with that buyer filter applied and
  browser Back returns to Compradores with its prior URL

#### Scenario: Direct read route access
- **WHEN** an unauthenticated request reaches Historial or Compradores
- **THEN** the existing workspace authentication boundary prevents read data
  from being returned

### Requirement: Analyst read surfaces remain accessible and stateful
The system SHALL render Historial and Compradores with explicit loading, empty,
error, partial, and populated states. It SHALL support keyboard operation,
responsive layout, accessible status text, and authenticated route testing.
Playwright SHALL use an isolated workspace with seeded V2 data and the real
authentication flow. It SHALL NOT mock GraphQL responses or rely on residual
Compose data.

#### Scenario: Partial buyer data is rendered
- **WHEN** Compradores receives partial coverage or unavailable data
- **THEN** it renders the declared state and coverage without presenting the
  missing data as zero or complete
