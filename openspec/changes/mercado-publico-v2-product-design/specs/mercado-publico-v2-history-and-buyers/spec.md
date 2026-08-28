## MODIFIED Requirements

### Requirement: Historial expone sólo cambios semánticos con procedencia
The system SHALL expose a keyset-paginated `mercadoPublicoV2.history`
connection that requires a process `codigo` and is sourced from append-only
`mp.v2_history` events. Each node SHALL identify the process, event time,
changed semantic fields, and business-relevant provenance without exposing raw
payloads, request data, technical errors, UUIDs, fingerprints, or internal
source names in the primary business view. The system SHALL NOT substitute data
from the current process snapshot.

#### Scenario: Analyst reads a semantic change
- **WHEN** an authenticated analyst opens History for a process with a persisted semantic change
- **THEN** the panel shows the append-only event, semantic diff, and business-relevant provenance without current-snapshot substitution

#### Scenario: History has no semantic change
- **WHEN** the selected history scope contains no rows in `mp.v2_history`
- **THEN** the panel explains what changes are recorded and provides a return action without manufacturing an event

#### Scenario: Analyst opens and leaves History
- **WHEN** an analyst opens History from an existing V2 detail and returns
- **THEN** History remains a side-panel subview and return restores prior tab, panel scroll, process, filters, URL, and list scroll
