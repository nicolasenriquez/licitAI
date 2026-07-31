# Build the visible-data contract matrix

Type: research
Status: resolved
Blocked by: none

## Question

Which fields, filters, counters, and derived metrics suggested by the current UI
and external HTML are supported by authenticated internal read contracts today?

## Work

- Trace each visible value through GraphQL document, DTO, resolver/service, and
  `mp` source semantics.
- Record null, incomplete, stale, pagination, and quota semantics.
- Separate exact server facts, safe complete-input derivations, and unsupported
  ideas.
- Include Compra Agil, Licitaciones, process detail, pipeline, jobs, API calls,
  quota, CSV, reconciliation, and integrity states.
- Flag desired provider/API capabilities that are not exposed internally; do
  not treat upstream availability as current product support.

## Exit evidence

- Field-by-field matrix with source pointers.
- Approved visible set for each of the three views.
- Separate backlog of contract gaps requiring future backend authorization.

## Answer

### Contract boundary

All seven Mercado Publico queries are authenticated internal GraphQL reads.
`MercadoPublicoQueryResolver` applies workspace and user guards and delegates to
read services over deployment-local `mp`. The API-call resolver recursively
redacts sensitive request parameters before returning them.

Primary evidence:

- `packages/twenty-server/src/engine/core-modules/mercado-publico/dtos/mercado-publico-query.dto.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/mercado-publico-query.resolver.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-*-read.service.ts`
- `packages/twenty-front/src/modules/mercado-publico/graphql/fragments/`
- `packages/twenty-front/src/modules/mercado-publico/graphql/queries/`

### Visible-data matrix

| Surface | Supported facts now | Contract semantics | Do not infer |
| --- | --- | --- | --- |
| Browse row | process family/code, title, canonical/raw state, buyer code/name, publication/closing dates, source priority, reconciliation status, last seen | Rows come from `mp.gold_detected_process`; most descriptive values are nullable | Region, amount, budget, guarantees, document count, offers, second-call state, evaluation, payment |
| Browse filters | process family, canonical states, exact buyer code, publication from/to, changed since | Server filters; buyer code is exact equality; dates are timestamps | Free-text search, buyer-name search, region, amount range, guarantee, closing-window filter |
| Browse sort | last seen, publication, closing, process code, canonical state; asc/desc | Server sort with process type/code tie-breakers | Amount, relevance, buyer, offers, budget |
| Browse paging | `items`, exact filtered `total`, `page`, `limit` | Page starts at 1; default 50; maximum 200 | Counts derived from only the visible page as global totals |
| Common detail | family/code, title/state, buyer, publication/closing, items, adjudications, related OCs, source lineage, reconciliation counts, source priority, last seen | Detail exists only when gold row exists; nested fields may be null; arrays may be empty | A missing field as zero, false, no-risk, or complete coverage |
| Compra Agil detail | source path; source state; last-change/first-call/second-call dates; amounts/reasons; offers received; documents; institution/region/purchase unit/buyer; call; need; delivery; full budget; suppliers, quotes and quote products; environmental/social-economic flags | `compraAgilSource` is populated from the newest retained matching `detail-by-codigo` raw payload; object may be null; members remain nullable | Availability for every browse row; completeness across all processes; permission to aggregate page rows |
| Licitacion detail | common detail plus licitacion items and adjudications | Adjudications are licitacion-specific; source lineage may combine API V1 and CSV | Region, guarantee rules, evaluation criteria, document metadata/count, contract days, Q&A/adjudication dates, payment terms |
| Related OCs | code, canonical state, match type, match confidence | Reconciliation evidence, not a user-confirmed relationship | Award amount/date, legal certainty, or a normalized percentage confidence |
| Source lineage | source, row count, last seen | Zero-row sources are filtered out | Missing source means source failure; row count means semantic completeness |
| Reconciliation summary | exact, candidate, unmatched, manual-review-required counts | Server counts known reconciliation rows by match type | Coverage %, accuracy %, approval state, or absence of data quality risk |
| Pipeline health | supported job name, latest status, last success/failure, lag since success, failures in seven-day window, generated time | Full fixed job-name set; jobs without runs still appear | Fresh/stale classification or expected cadence: both fields are currently null |
| API quota | source, configured daily limit, used, server-derived remaining, reset time, last 429, generated time | Remaining is `max(0, limit-used)`; current configured limit is shared across source rows | Summing source limits/remaining as an independent global allowance; per-source policy differences |
| Job runs | job identity/status/times, fetched/staged/canonicalized/failed counts, error summary, CSV file id | Filterable; offset/limit; `hasMore`, but no total | Global success/error rate from the current page; zero for nullable counters |
| API-call log | source/endpoint, redacted params, status, fetch time, records fetched, error summary, job id | Filterable; offset/limit; `hasMore`, but no total; secrets redacted server-side | Global API success rate from current page; display of unredacted/raw request secrets |
| CSV health | dataset/modality/period/file identity/checksum, encoding/delimiter/fingerprint, row and parse counts, parse status, last successful load, generated time | Live aggregation over raw files/job runs; parse status is computed | CSV freshness: currently null; schema safety from fingerprint alone; zero failures as full business validity |

### Null, empty, partial, and stale rules

- Missing process detail (`null`) means no matching gold row or invalid family.
- Compra Agil `compraAgilSource=null` means retained source detail is not yet
  available. It does not mean the process has no budget, offers, or suppliers.
- A nullable member inside an existing source object means the provider omitted
  or did not yield that value. Render `No informado por fuente`/`No disponible`,
  never zero or false.
- Empty detail arrays mean no retained rows were returned for that subsection;
  they do not prove real-world absence unless the source contract says so.
- Non-Licitacion adjudications are `null`; Licitacion may return an empty array.
- `lastSeenAt`, source-lineage timestamps, `generatedAt`, and last-success/load
  timestamps may be displayed with explicit labels. They are not interchangeable.
- Pipeline and CSV `freshness` are deliberately unavailable in phase 1.
- Monitoring pages expose `hasMore`, not totals; page-level ratios are not
  product-wide metrics.

### Safe derived displays

Allowed when formula and scope are visible:

- Browse range `first-last of total`, using server `total`.
- Quota progress `used / dailyLimit` and remaining, per returned source only.
- Time elapsed since an explicit server timestamp, labelled as such.
- Pipeline failure count exactly as returned: failures in the server's seven-day
  window.
- CSV parse success/error counts and status exactly as returned.
- Reconciliation category counts exactly as returned.

Not safe with current contracts:

- Total/median/visible budget across Compra Agil or Licitaciones.
- Open, closing-in-24-hours, second-call, offer, supplier, or guarantee KPI
  counts derived from a browse page.
- Coverage, completeness, success, quality, confidence, or approval percentages.
- Global job/API success rates derived from offset pages.
- Fresh/stale badges for pipeline or CSV.
- A combined quota total across rows that currently share one configured limit.

### Approved first-version visible set

#### Compra Agil browse

Keep the six-column contract: Objeto, Organismo, Estado, Cierre, Publicada,
Codigo. Support state, publication dates, exact buyer code, changed-since, and
contract sorts. `total` may drive pagination/result count. Do not add aggregate
analysis strips.

#### Compra Agil detail

The prototype may use all non-null `compraAgilSource` fields, including budget,
offers, suppliers/quotes, institution/region, documents, call, need, delivery,
reasons, dates, and flags. Keep them progressive and source-labelled. Preserve a
distinct pending-detail state when the object is null. Do not promote these
detail-only values into browse filters, columns, or aggregate KPIs.

#### Licitaciones browse and detail

Use the same six browse columns and supported filters/sorts. Detail may show the
common fields, items, adjudications, related OCs, lineage, and reconciliation.
The richer hard-coded Licitaciones sections in the HTML remain excluded.

#### Centro de Control

Use the returned pipeline, quota, job/API, and CSV facts. Preserve generated
times, source scope, pagination scope, nulls, and redaction. No dashboard-wide
score, invented freshness, inferred coverage, or page-derived global ratio.

### Contract-gap backlog

These require separate backend/product authorization before UI work:

1. Server-backed free-text and buyer-name search.
2. Browse region, amount/budget, guarantee, offers, second-call, or closing
   window filters/sorts.
3. Complete aggregate endpoints for budgets, time windows, state counts, offers,
   suppliers, quality, or coverage.
4. Rich Licitaciones detail: region, guarantees, documents, evaluation, payment,
   contract and milestone dates.
5. Explicit pipeline/CSV cadence and freshness policy.
6. Quota semantics if official limits diverge by source.
7. Total counts for job/API investigations if global ratios become necessary.
8. Downloadable document URLs/actions; current Compra Agil documents expose only
   id/name, while `sourcePath` identifies the retained source detail path.

### Decision

No new backend contract is required to prototype a materially richer Compra
Agil detail. The redesign must remain conservative in browse, Licitaciones, and
aggregate monitoring. Unsupported HTML ideas stay out of the successor OpenSpec
unless a separate contract expansion is explicitly approved.
