## 0. Investigation and Scope Lock

- [x] 0.1 Reconfirm the G2 lane B boundary against `implementation-sdlc-map.md`,
  `mp.v2_history`, and the current `mercadoPublicoV2` namespace before code
  changes.
  Traceability: Group G2; Slice S1; Issue 25; Scope contract evidence only.
  Notes: Confirmed G2 lane B is 25 -> 26 -> 27; `mp.v2_history` and its
  `codigo, created_at` index exist; `MercadoPublicoV2NamespaceResolver`
  currently exposes only `opportunities` and `analytics`.

- [x] 0.2 Record Issues 25 and 26 as completed evidence and verify that Issue
  27 adds no migration, detail-contract, provider, or control-plane work.
  Traceability: Group G2; Slice S1; Issue 26; Scope authenticated detail evidence only.
  Notes: Issues 25 and 26 are `Status: done` with `Completed: 2026-08-10`
  and recorded evidence; Issue 27 remains `ready-for-human` and adds no
  migration, detail-contract, provider, or control-plane work.

## 1. Contract Coverage (Failing First)

- [x] 1.1 Add failing read-service and resolver coverage for a keyset Historial
  event for a required `codigo`, with semantic diff, provenance, and no join to
  the current snapshot.
  Traceability: Group G2; Slice S1; Issue 27; Acceptance AC 27.1, AC 27.4.
  Notes: Added history reader and namespace resolver contract specs. Jest is
  red because dedicated history reader and resolver field are not implemented.

- [x] 1.2 Add failing read-service and resolver coverage for buyer aggregates
  that share the Active filter population, group by `buyerCode`, exclude rows
  without that code from selectable aggregates, and declare coverage,
  availability, completeness, and freshness without a monetary total.
  Traceability: Group G2; Slice S2; Issue 27; Acceptance AC 27.2, AC 27.4.
  Notes: Added buyer reader and namespace resolver contract specs. Jest is red
  because dedicated buyer reader and resolver field are not implemented.

- [x] 1.3 Add failing authenticated Playwright coverage for both routes,
  buyer-to-Activas navigation, browser Back, and accessible partial states.
  Use an isolated workspace with seeded V2 data and the real authentication
  flow; do not mock GraphQL or rely on Compose residue.
  Traceability: Group G2; Slice S3; Issue 27; Acceptance AC 27.3, AC 27.5.
  Notes: Added five real-network Playwright tests using login setup storage and
  seeded-fixture defaults. `--list` compiles all tests; runtime run passed auth
  setup and failed route assertions until tasks 2.2 and 2.4 land.

## 2. Implementation

### Historial

- [x] 2.1 Add a dedicated Historial reader, DTOs, and namespace resolver field
  that requires `codigo`, with stable `created_at, id` keyset pagination and a
  derived semantic diff.
  Traceability: Group G2; Slice S1; Issue 27; Acceptance AC 27.1.
  Notes: Added `MercadoPublicoV2HistoryReadService` querying only
  `mp.v2_history` joined to `mp.v2_observation` with `created_at DESC, id DESC`
  keyset cursors and a derived `changedFields` diff, plus History DTOs and a
  `history` namespace field requiring `codigo`. History contract spec is green;
  the resolver buyers case stays red until 2.3. Resolver spec mock aligned to
  per-event cursors.

- [ ] 2.2 Add the Historial route, page, and private Mercado Público local
  navigation using Twenty shell, tokens, and explicit state rendering. Require
  `codigo` in the URL, add an accessible read-only entry from the existing V2
  detail, and show guidance when it is absent.
  Traceability: Group G2; Slice S1; Issue 27; Acceptance AC 27.1, AC 27.4, AC 27.5.

### Compradores

- [ ] 2.3 Extract the existing V2 filter validation and SQL population builder
  into a focused internal helper, then add a dedicated Compradores reader,
  DTOs, and namespace resolver field that reuses it. Use `buyerCode` as the
  aggregate key and retain the buyer name only as a display label. Calculate
  coverage from observed values and do not convert or total currencies.
  Traceability: Group G2; Slice S2; Issue 27; Acceptance AC 27.2, AC 27.4.

- [ ] 2.4 Add the Compradores route and page. Serialize a selected buyer into
  the Activas URL as `buyer=<buyerCode>` without replacing the current history
  entry.
  Traceability: Group G2; Slice S2; Issue 27; Acceptance AC 27.3, AC 27.4, AC 27.5.

- [ ] 2.5 Regenerate GraphQL client artifacts and review the generated diff for
  backward compatibility.
  Traceability: Group G2; Slice S2; Issue 27; Acceptance AC 27.1, AC 27.2.

## 3. Verification

- [ ] 3.1 Run focused server tests for filter reuse, cursor validation,
  provenance, authorization, and absent or partial data.
  Traceability: Group G2; Slice S3; Issue 27; Acceptance AC 27.1, AC 27.2, AC 27.4.

- [ ] 3.2 Run authenticated Playwright at desktop, laptop, and mobile widths
  for routes, states, keyboard use, buyer transition, and browser restoration.
  Verify the isolated workspace setup and real authentication path.
  Traceability: Group G2; Slice S3; Issue 27; Acceptance AC 27.3, AC 27.5.

- [ ] 3.3 Run diff lint, typecheck, GraphQL codegen verification, and targeted
  front and server tests.
  Traceability: Group G2; Slice S3; Issue 27; Scope quality gates.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update operational or user documentation only after verified behavior
  changes and keep the G2 lane B evidence link current.
  Traceability: Group G2; Slice S3; Issue 27; Scope release traceability.

- [ ] 4.2 Run `openspec validate mercado-publico-v2-history-and-buyers` and
  confirm the artifact set still matches the selected G2 lane B boundary.
  Traceability: Group G2; Slice S3; Issue 27; Scope artifact validation.

## Execution Order

### Slice 1 — Historial semántico
- Tasks: `0.1 -> 0.2 -> 1.1 -> 2.1 -> 2.2`
- Checkpoint: una ruta autenticada muestra sólo un evento histórico con diff y
  procedencia, sin leer `gold_detected_process`.
- Blocks: Slice 2.

### Slice 2 — Compradores factuales
- Tasks: `1.2 -> 2.3 -> 2.4 -> 2.5`
- Checkpoint: una consulta agrupada coincide con la población filtrada de
  Activas y una selección deja `buyer` en la URL.
- Blocked by: Slice 1.
- Blocks: Slice 3.

### Slice 3 — Prueba y cierre
- Tasks: `1.3 -> 3.1 -> 3.2 -> 3.3 -> 4.1 -> 4.2`
- Checkpoint: rutas autenticadas, accesibles y responsive pasan sus pruebas y
  los artefactos OpenSpec validan.
- Blocked by: Slice 2.
- Blocks: None.
