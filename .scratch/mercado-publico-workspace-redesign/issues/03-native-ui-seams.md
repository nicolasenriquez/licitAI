# Select native Twenty UI seams

Type: research
Status: resolved
Blocked by: none

## Question

Which existing product components, tokens, patterns, and Storybook examples can
replace the Mercado Publico module's bespoke presentation code without changing
behavior or forcing premature generic abstractions?

## Work

- Map page shell, tabs, filters, table, status tags, feedback states,
  pagination, detail panel, disclosure, and responsive behavior.
- Inspect real consumers and stories, not exports alone.
- Check accessibility, theme, density, virtualization, and mobile constraints.
- Mark direct reuse, thin domain composition, justified local adapter, and true
  missing primitive.
- Estimate deletable bespoke code only after behavioral parity is demonstrated.

## Exit evidence

- Component/pattern reuse matrix with canonical source and story pointers.
- Decision record for any unavoidable local adapter or missing primitive.
- Confirmation that no new dependency or token family is needed, or strong
  evidence for the exception.

## Answer

### Outcome

The repository already contains the visual and interaction vocabulary required
for the redesign. No dependency, design-token addition, or new generic UI
library is justified. Direct reuse is appropriate for shell, navigation,
controls, status, feedback, progress, and the global side panel. Tables require
small Mercado Publico semantic compositions because the existing visual table
primitives do not fully cover interactive-row and responsive accessibility.

The current three main components contain 37 local `Styled*` declarations
(Browse 19, Control Center 9, Detail 9) across roughly two thousand lines. This
is a reduction opportunity, not a promise that all local styling disappears.

### Reuse matrix

| Seam | Canonical repository source | Decision | Reason / constraint |
| --- | --- | --- | --- |
| Workspace route layout | `MainAppLayoutWithSidePanel` | keep direct | Already supplies real desktop and mobile side-panel hosts |
| Page frame | `PageCardLayout`, `PageCardHeader` | keep direct | Current implementation is already native |
| Three-view navigation | `SettingsTabBar` | keep direct | Hash navigation and mounted-tab context already work |
| Text/date filters | `ui/input/TextInput` | direct composition | Supports labels, native input attributes, sizes, errors, and full width; `type="date"` can preserve native date behavior |
| State/sort filters | `ui/input/Select` | direct composition | Established dropdown/selectable-list keyboard pattern and Storybook states |
| More/clear/pagination/actions | `twenty-ui` `Button`/`IconButton` | direct | Native button semantics and consistent variants |
| Active-filter chips | `twenty-ui` `Chip` inside a semantic local control | thin adapter | `Chip` is presentational; do not make its decorative close icon the only action target |
| Status values | `twenty-ui` `Tag` | direct | Already used with Mercado Publico display mapping; neutral unknown state remains explicit |
| Long procurement text | `OverflowingTextWithTooltip` | direct | Existing truncation/tooltip behavior; full value remains available |
| Browse table | Table visual vocabulary plus native HTML semantics | thin domain composition | Current `TableRow` is a visual `div`, does not expose sufficient row/button/ARIA props, and only offers column-hiding mobile behavior; whole-row activation must remain keyboard-operable |
| Monitoring tables | Native semantic table, consolidated as a Mercado Publico composition | thin domain composition | Control Center needs real table semantics and repeated read-only layouts; avoid admin mutation APIs |
| Table headings/cells | `TableHeader`, `TableCell`, spacing/token patterns | reuse where semantics remain valid | Visual measurements are useful, but component reuse must not erase native table semantics |
| Empty dense table | `SettingsEmptyPlaceholder` | direct | Compact and already used by operational/settings tables |
| Whole-surface empty | `AnimatedPlaceholder` | optional after visual review | Useful only when a full empty state warrants illustration; avoid decorative bulk in dense workspace views |
| Initial loading | existing `react-loading-skeleton` theme pattern | thin local table/detail skeleton | Generic `SkeletonLoader` has fixed activity dimensions and does not match these tables; no new dependency |
| Query error/info | `InlineBanner`; `Callout` for persistent warning | direct with live-region wrapper | Existing variants cover info/danger/warning; Storybook defers some contrast checks, so prototype must verify contrast |
| Quota usage | `ProgressBar` plus numeric text | direct | Accessible role/label exists; keep source-specific numerator/denominator visible and verify reduced motion |
| Detail host | global `SidePanelForDesktop` / mobile `CommandMenuForMobile` through `SidePanelRouter` | native integration | Replaces custom fixed backdrop/dialog and automatically follows workspace width/mobile/focus architecture |
| Detail navigation | `useNavigateSidePanel`, focus stack, close cleanup | direct plus domain page | Preserves app-level resize, close, focus, and mobile behavior |
| Detail grouping | `SidePanelGroup`, `SidePanelInformationBanner`, `Section`, `H2Title`, `Label` | direct composition | Matches existing panel hierarchy and progressive disclosure |
| Theme and spacing | `themeCssVariables` and current product adapters | keep | No stable missing token was found |

### Explicit non-reuse decisions

#### `SettingsTableListSection`

Do not reuse the whole component. It requires title/description, a footer add
button, and mutation-oriented callbacks. Its clickable rows are visual `div`s,
not a sufficient keyboard contract. Reuse its table density as evidence only.

#### `SettingsAdminQueueJobsTable`

Use as a neighboring operational-density and pagination reference, not as a
component. It includes checkbox selection, retry/delete controls, expansion,
and total-count semantics absent from Mercado Publico read models.

#### Metadata-driven `RecordTable`

Do not adopt it. It requires object metadata, views, selection, editing, and
virtualization infrastructure that a read-only `mp` projection does not own.

#### Direct `TableRow` for activated browse rows

Do not regress the existing native button behavior to a clickable `div`. Either
the prototype proves a small backward-compatible semantic extension of the
existing primitive, or Mercado Publico retains a local native row/action
composition. Default to the local composition; broaden the primitive only with
cross-surface evidence.

#### Current custom detail overlay

Remove after native side-panel parity. The app route already lives inside
`MainAppLayoutWithSidePanel`; maintaining a second backdrop, focus trap, width,
mobile presentation, and close lifecycle is duplication.

### Required native side-panel integration

The smallest coherent integration is:

1. Add one Mercado Publico process-detail value to shared `SidePanelPages`.
2. Register one frontend page in `SIDE_PANEL_PAGES_CONFIG`.
3. Add one domain navigation hook/state seam carrying process family/code per
   panel instance.
4. Render the existing detail query inside the native panel using
   `SidePanelGroup` and established feedback components.
5. Let `MainAppLayoutWithSidePanel` provide resizable desktop presentation and
   `CommandMenuForMobile` provide the full-screen mobile host.
6. Preserve origin focus on close and selected-row context; verify this in the
   prototype before deleting the custom panel.

This is a shared-contract change: build `twenty-shared` before validating
`twenty-front`. It does not alter GraphQL or Mercado Publico data semantics.

### Proposed local domain compositions

Keep these intentionally shallow:

- `MercadoPublicoFilterBar`: `TextInput`, `Select`, Buttons, and active-filter
  controls; owns no server/query behavior.
- `MercadoPublicoBrowseTable`: six supported columns, accessible row action,
  responsive label stacking, selected state, and no generic column engine.
- `MercadoPublicoMonitoringTable`: repeated semantic read-only table frame for
  job/API/CSV data; accepts explicit columns/rows but no mutation or metadata.
- `MercadoPublicoTableSkeleton`: mirrors approved row geometry using the
  existing skeleton dependency/theme.
- Native side-panel page: domain sections and query states only.

Do not create a generic procurement design system, universal data-grid wrapper,
dashboard-card framework, or token alias layer.

### Storybook and validation harness

Existing evidence stories:

- `modules/ui/layout/table/components/__stories__/Table.stories.tsx`
- `modules/ui/input/components/__stories__/TextInput.stories.tsx`
- `modules/ui/input/components/__stories__/Select.stories.tsx`
- `twenty-ui` stories for Button, Tag, Chip, ProgressBar, Callout,
  SidePanelInformationBanner, Section, and typography.

Prototype stories should be Mercado Publico compositions, not copies of those
primitive catalogs:

- Browse: populated, partial/null, loading, empty, error, selected detail,
  long Spanish text, desktop and mobile.
- Detail: pending source detail, rich Compra Agil, sparse Licitacion, long lists,
  load error, mobile full-screen.
- Control Center: healthy/empty/partial/error sources, quota boundary, paginated
  investigations, CSV pending/error/success.
- Every composition: light/dark, keyboard, focus return, 200% zoom, reduced
  motion, and automated a11y where the harness supports it.

### Removal target after parity

Expected deletions/replacements:

- Custom `StyledInput`, `StyledSelect`, disclosure, chip, feedback, and
  pagination button styling.
- Repeated Control Center table wrappers and native form styling.
- Entire custom process-detail backdrop/dialog/focus-trap shell.
- Repeated local heading/section/status presentation covered by native seams.

Retain only Mercado Publico-specific responsive table composition, domain
section layout, and skeleton geometry. Measure net lines after prototype parity;
do not optimize toward a fabricated line-count target.

### Decision

Ticket 04 may prototype without adding dependencies or tokens. It should use
the global side panel and native controls immediately, while treating semantic
tables as two shallow domain compositions. Any proposal to change a generic
table primitive must bring cross-surface evidence and its own Storybook/a11y
coverage.
