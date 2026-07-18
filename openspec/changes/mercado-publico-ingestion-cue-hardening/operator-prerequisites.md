---
type: change-operator-prerequisites
title: "Operator Prerequisites: mercado-publico-ingestion-cue-hardening"
description: "Minimum operator-provided inputs needed to complete hardening implementation."
okf_version: "0.1"
---
# Operator Prerequisites: mercado-publico-ingestion-cue-hardening

## Purpose

Record the operator-provided inputs required to complete the hardening change
without committing credentials, tickets, CSV files, or production identifiers
to the repository. These inputs are prerequisites for implementing Slice 1
(V2 contract fixtures) and executing the CUE gate in Slice 4.

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`, `openspec/AGENTS.md`,
`openspec/CONTEXT.md`, change `proposal.md` (lines 72-77, "Operator Prerequisites"),
`design.md` (lines 106-110).

---

## Prerequisite 1: V2 Detail Envelope Shape

**What**: The exact production JSON shape of a V2 Compra Agil detail response,
including the envelope/wrapper key (e.g. `{ "data": { "codigo": "...", ... } }`
or `{ "result": { ... } }`). The current fixtures use flat top-level objects; the
production response is known to be wrapped.

**Used by**: Tasks 0.2 (scope lock), 1.1 (failing-first contract coverage),
2.1 (estado normalization + envelope unwrapping), 2.2 (raw persistence before
extraction).

**Format**: Redacted JSON fixture — no real `codigo` values, no production
tickets/credentials. Synthetic data with de-identified field values but
the same structural wrapper (same keys, same nesting depth, same array/object
shape).

**Status**: Implementation uses a synthetic redacted `{ "data": { ... } }`
fixture. The exact live wrapper was not revalidated in this run; operator
confirmation remains required before live CUE execution.

---

## Prerequisite 2: Object-Shaped V2 Estado

**What**: The exact production JSON shape of `estado` when it appears as an object
in V2 Compra Agil responses. At minimum: `{ "codigo": "<string>", "glosa": "<string>" }`.
Both fields are known to exist.

**Used by**: Tasks 0.2 (scope lock), 1.1 (failing-first contract coverage),
2.1 (normalization helper).

**Format**: Already known from production observation. Fixtures will use synthetic
estado codes with `codigo` and `glosa` fields matching the confirmed structure.

**Status**: Shape confirmed. De-identified fixture to be written in Slice 1 (task 1.1).

---

## Prerequisite 3: One Known Valid Detail Code

**What**: A single Compra Agil `codigo` that is known to return a valid V2 detail
record in the target environment. Must not be a production identifier in
repository artifacts — recorded only in this prerequisites document as a
reference for CUE execution.

**Used by**: Tasks 0.2 (scope lock — confirms a positive path exists), 3.3
(CUE gate — validates the positive detail flow).

**Format**: A Compra Agil code string (e.g. `"XXXXXXXX"`).

**Status**: Operator must provide before CUE execution (Slice 4). Not required
for implementation slices 1-3.

---

## Prerequisite 4: One Known Missing Detail Case

**What**: A Compra Agil `codigo` that is known to return a V2 detail response
without a usable detail record (e.g. a non-existent or invalid code that the
API accepts but returns an empty envelope for). Used to prove the missing-detail
failure path.

**Used by**: Tasks 0.2 (scope lock — confirms the missing-detail defect exists),
1.2 (failing-first contract coverage), 2.2 (implementation).

**Format**: A Compra Agil code string known to produce a no-record response.

**Status**: Operator must provide before implementation Slice 1 or 2.
Implementation can proceed with a synthetic fixture (`v2-compra-agil-detail-envelope-no-record.json`)
that simulates a missing-record response, but the live CUE must use a real
known-missing code.

---

## Prerequisite 5: Host CSV Directory

**What**: The absolute host path to the directory containing the four June/July
CSV profiles:
- Licitaciones June 2026
- Licitaciones July 2026
- Ordenes de Compra June 2026
- Ordenes de Compra July 2026

The directory is mounted read-only into the Docker container at the path
configured by `MERCADO_PUBLICO_CSV_STORAGE_ROOT`. Files must follow the
discovery layout:
```
{host_dir}/
  licitaciones/
    2026-06/
      _default/
        <sourceFile>.csv
    2026-07/
      _default/
        <sourceFile>.csv
  oc/
    2026-06/
      _default/
        <sourceFile>.csv
    2026-07/
      _default/
        <sourceFile>.csv
```

**Used by**: Tasks 0.3 (scope lock — confirms storage-root contract), 2.5
(Docker CUE override), 2.6 (CSV profile processing), 3.3 (CUE gate execution).

**Format**: Absolute filesystem path on the Docker host.

**Status**: The override and read-only mount were implemented and Compose was
validated with a temporary host directory. The operator's real source
directory remains required before live CUE execution.

---

## Prerequisite 6: V2 API Credentials

**What**: API tickets for V1 and V2 Compra Agil endpoints:
- `MERCADO_PUBLICO_API_TICKET` (V1)
- `COMPRA_AGIL_API_TICKET` (V2)

These are already declared in `docker-compose.yml` as env vars with
`${...:-}` defaults. The CUE runbook must specify that the operator sets
these environment variables before running the CUE gate.

**Used by**: Task 3.3 (CUE gate execution).

**Format**: API ticket strings set as environment variables. Never committed
to the repository. Never stored in this file.

**Status**: Operator must provide at CUE execution time. Not required for
implementation slices 1-3 (tests use mock HTTP clients).

---

## Non-Requirements (explicit exclusions)

- CSV files committed to the repository → **Must not happen** (proposal Out Of Scope)
- Production credentials in code → **Must not happen** (proposal Out Of Scope)
- Database reset → **Must not happen** (proposal Out Of Scope)
- Production data in fixtures → **Must not happen** (proposal Out Of Scope)
- Real codigo/detail identifiers in repository → **Must not happen** (proposal Out Of Scope)

## Limitation Recording Policy

If any prerequisite is unavailable when implementation reaches its dependent
slice, the task description in `tasks.md` must be updated with a `[BLOCKED]`
marker and the limitation recorded here under a `## Blocked Prerequisites`
section. The CUE runbook (task 2.9) must record the limitation as an
explicit non-success criterion.

## Blocked Prerequisites

Live CUE execution remains blocked in this checkout because no operator
provided a known valid detail code, a known missing-detail code, the real host
CSV directory, or live API credentials. Synthetic fixtures and mocked HTTP
clients cover implementation; no production data or credentials were added.
