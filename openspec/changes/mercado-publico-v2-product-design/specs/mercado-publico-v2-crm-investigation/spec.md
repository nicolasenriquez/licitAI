## ADDED Requirements

### Requirement: Marking creates one workspace-scoped investigation
The system SHALL expose authenticated marking by Mercado Publico process code.
It SHALL require Opportunity create access and SHALL map each workspace and code
to one live Opportunity. Concurrent or repeated calls SHALL return the same live
CRM record identity without creating duplicates.

#### Scenario: Two callers mark the same process concurrently
- **WHEN** two authorized calls in one workspace mark the same code concurrently
- **THEN** one live Opportunity and one mapping exist and both results contain its CRM record ID

#### Scenario: Different workspaces mark the same process
- **WHEN** authorized callers in different workspaces mark the same code
- **THEN** each workspace receives its own Opportunity and mapping

### Requirement: Investigation stores factual source fields
The system SHALL create Opportunity through standard CRM record behavior with a
factual name, published amount when known, closing date when known, process code,
and canonical source URL. Process code and source URL SHALL be dedicated optional
Opportunity fields. The system SHALL NOT create a buyer Company or infer score,
priority, probability, margin, viability, or recommendation.

#### Scenario: Source has incomplete optional facts
- **WHEN** a process has no known amount or closing date
- **THEN** Opportunity leaves those fields unset and still stores code and source URL

### Requirement: Mapping survives retry and target deletion
The system SHALL persist workspace ID, code, CRM record ID, and immutable first
marked time with unique workspace-plus-code identity. If the mapped Opportunity
was deleted, the next authorized mark SHALL create one replacement, update the
mapped CRM ID, preserve first marked time, and return `created: true`.

#### Scenario: Operator repeats a healthy mark
- **WHEN** a live mapped Opportunity exists
- **THEN** marking returns its ID, `created: false`, and the original `markedAt`

#### Scenario: Operator marks after CRM deletion
- **WHEN** the mapped Opportunity no longer exists
- **THEN** one replacement is created, mapping points to it, and first `markedAt` is unchanged

### Requirement: Investigation action preserves process context
The system SHALL announce pending state, prevent duplicate submission while
pending, render created and existing success as `En investigación`, provide
`Abrir en CRM`, and allow retry after failure without losing panel context.

#### Scenario: Marking fails and then succeeds
- **WHEN** an operator retries a failed mark from the process panel
- **THEN** panel, process, filters, and scroll remain and success exposes the returned CRM record
