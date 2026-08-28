## ADDED Requirements

### Requirement: Procesos preserves query context
The system SHALL keep existing Mercado Publico filter, sort, cursor, and process
URL keys. Applying or clearing a filter SHALL remove `after`, preserve sort and
selected process, and SHALL NOT close the detail panel or move list scroll.

#### Scenario: Operator changes a filter with detail open
- **WHEN** an operator applies or removes a filter while a process is selected
- **THEN** pagination resets while sort, selected process, panel, and list scroll remain

### Requirement: Filters follow operator intent
The system SHALL show search, situation, region, closing date, and order before
results and SHALL group remaining filters under Who buys, Process status, and
Size and evidence. The groups SHALL support keyboard operation, Escape close,
focus return, field-local errors, and unchanged URL serialization.

#### Scenario: Keyboard user closes advanced filters
- **WHEN** a keyboard user closes an advanced group with Escape
- **THEN** focus returns to its disclosure control and unapplied values remain intact

### Requirement: Process changes isolate detail state
The system SHALL reset the active tab, all relation cursors, technical payload,
errors, and transient mutation state when `codigo` changes. New relation reads
SHALL begin with a null cursor and stale process content SHALL not render.

#### Scenario: Operator changes a process after technical review
- **WHEN** an operator paginates a relation, opens technical data, and selects another process
- **THEN** Summary is active, relation cursors are null, technical data is closed, and prior content is absent

### Requirement: Detail errors recover locally
The system SHALL render one alert for a detail failure and provide an in-panel
Retry action that repeats the same request without closing the panel or changing
URL, selection, list scroll, or focus context. Relation failures SHALL remain
independent and retry locally.

#### Scenario: Detail request recovers
- **WHEN** a failed detail request succeeds after Retry
- **THEN** the same panel renders the process and other page context is unchanged

### Requirement: Detail prioritizes factual evidence
The system SHALL place a factual summary before secondary content, keep Summary,
Items and offers, and Documents available as primary destinations, and keep
sanitized technical data in a collapsed lazy disclosure. It SHALL distinguish
zero, source-not-reported, not-yet-available, and not-applicable values and
state that financial feasibility is not evaluated.

#### Scenario: Source amount is zero
- **WHEN** the source reports a numeric zero amount
- **THEN** detail renders zero and does not replace it with an unavailable label

### Requirement: Procesos reflows accessibly
The system SHALL preserve semantic order, accessible names, visible focus, and
status and alert announcements on desktop and mobile. At 320 CSS pixels and 200
percent zoom, the page SHALL have no horizontal page scroll and interactive
targets SHALL be at least 44 by 44 CSS pixels where applicable.

#### Scenario: Mobile operator opens process detail
- **WHEN** an operator uses Procesos at 320 CSS pixels
- **THEN** rows become ordered compact records and list, panel, tabs, and actions remain operable without horizontal page scroll
