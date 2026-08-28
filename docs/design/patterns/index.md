# Product UI Patterns

## Purpose

This directory contains curated product UI interaction knowledge. It is not a
replacement for repository contracts, package instructions, or the design
system.

This is a UI knowledge integration and agent-guidance correction. It is not an
OKF adoption slice and does not migrate the repository from OKF v0.1 to v0.2.
The local OKF v0.1 formatting and routing rules still apply.

## Read order

1. Read `../design-system.md`.
2. Read the closest package contracts.
3. For Mercado Público, read `mercado-publico-application.md`.
4. Load the one thematic guide that matches the user problem.
5. Open a `library/` leaf only when a named pattern needs specific review.

Do not load the complete library for ordinary implementation work.

## Authority

Follow the repository-wide source authority in
`../../governance/documentation-authority.md`. For this corpus:

- repository code, package contracts, existing Twenty primitives, and feature
  contracts are local truth;
- WCAG, WAI-ARIA, and primary platform specifications govern platform behavior;
- these curated guides provide repository-specific design interpretation;
- DesignMotionHQ is a secondary pattern-discovery source.

The pattern corpus does not create a second authority hierarchy.

## Normativity

Use these terms exactly:

- `REQUIRED`: apply when the stated condition is true;
- `RECOMMENDED`: preferred default when the condition is true;
- `CONTEXTUAL`: apply only after checking the stated tradeoffs;
- `HEURISTIC`: an exploration lens, never a mandatory rule;
- `AVOID`: do not add by default;
- `PROHIBITED`: a product-level prohibition unless a closer repository
  contract provides an explicit exception.

Qualified postures in the catalog and leaves combine a base posture with a
condition. For example, `REQUIRED_FOR_PAGED_DATA` means `REQUIRED` when data is
paged. `AVOID_AS_RULE` means the idea may inform exploration but cannot override
repository tokens or layout contracts.

## Application algorithm

1. State the user problem.
2. Inspect the current implementation and nearby behavior.
3. Search `packages/twenty-ui` for an existing primitive.
4. Load the matching thematic guide.
5. Check `Applies When` and `Do Not Apply When`.
6. Resolve conflicts using repository authority and accessibility standards.
7. Define the required loading, data, empty, filtered-empty, error, pending,
   and recovery states.
8. Implement the smallest repository-native change.
9. Verify behavior, keyboard access, responsive behavior, and state recovery.

## Canonical ownership

Every pattern has exactly one primary thematic owner. The owner is the guide
listed in `pattern-catalog.md` and the guide's `Primary-owned patterns` section.
Other guides may mention a related pattern, but related references do not create
additional ownership.

## Guides

- Dense records, tables, selection, and pagination:
  `data-dense-surfaces.md`
- Search, filters, and result discovery: `search-filter-discovery.md`
- Forms, validation, editing, and uploads: `forms-and-editing.md`
- Loading, empty, error, notification, and recovery behavior:
  `feedback-and-recovery.md`
- Destructive, reversible, and mutation-risk decisions:
  `destructive-and-reversible-actions.md`
- Modals, drawers, menus, tooltips, and disclosure:
  `overlays-and-disclosure.md`
- Navigation, tabs, command menus, and focus:
  `navigation.md`
- Animation and transition behavior: `motion.md`
- Visual hierarchy, tokens, color, and density:
  `visual-foundations.md`

## Library

The 73 `library/` leaves are small retrieval references. They preserve stable
`UI-PAT-*` IDs, the external source, a repository interpretation, and pattern-
specific applicability. They do not repeat global governance or feature rules.

Open `library/index.md` for the complete optional leaf map. Use
`pattern-catalog.md` for posture and ownership. Use
`mercado-publico-application.md` for the current Mercado Público application
map and `verification-matrix.md` for behavior checks.
