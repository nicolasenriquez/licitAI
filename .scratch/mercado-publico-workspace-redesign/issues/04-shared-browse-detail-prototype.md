# Prototype the shared browse and detail grammar

Type: prototype
Status: resolved
Blocked by: 01, 02, 03

## Question

What smallest shared composition gives both process families a native,
professional browse/detail experience while preserving their domain differences?

## Work

- Use a non-production Storybook or isolated harness; do not replace the route.
- Compose approved native primitives and supported data states.
- Prototype filters, table/list density, row activation, pagination, loading,
  empty, error, stale, and detail disclosure.
- Preserve selection/focus/context across tab and panel transitions.
- Avoid a speculative generic procurement framework; share only proven seams.

## Exit evidence

- Runnable prototype and stories for representative states.
- Short composition API and ownership decision.
- List of bespoke current seams expected to become removable after parity.

## Answer

The smallest proven shared composition is a domain-local browse/detail pair,
not a generic procurement framework:

- `MercadoPublicoBrowseTable`: six supported browse columns, explicit process
  title button for keyboard activation, exact buyer-code and state controls,
  and server-owned pagination language.
- `MercadoPublicoProcessDetailPage`: a native global SidePanel page in the
  later implementation, with `SidePanelGroup` progressive disclosure. It owns
  no fetch policy; the route/domain hook supplies a selected process code.
- The page owns tab persistence and selection. Browse owns only its filter,
  selected-code, loading/empty/error rendering, and receives complete server
  pagination. Detail owns no invented values: optional Compra Agil source data
  becomes an explicit pending state, and Licitaciones retains its conservative
  detail contract.

The isolated Storybook story at
`packages/twenty-front/src/modules/mercado-publico/components/__stories__/MercadoPublicoBrowseDetailPrototype.stories.tsx`
exercises Compra Agil and Licitaciones loaded states plus source-pending,
loading, empty, and error. Its values are explicitly labelled fixtures and
never enter the application route or call Mercado Publico.

There is deliberately no "fresh" or "stale" badge: current DTOs provide a
retained `lastSeenAt`, not a global freshness contract. The prototype therefore
shows "Ultima observacion" without claiming currency.

Expected removals after production parity is proven:

- Browse's bespoke filter/table/row/pagination presentation in
  `MercadoPublicoBrowseTab` becomes the two shallow domain compositions above.
- The fixed backdrop, focus trap, and local aside implementation in
  `MercadoPublicoProcessDetailPanel` becomes the shared desktop/mobile
  SidePanel registration described in ticket 03.

Validation: `npx nx typecheck twenty-front` passed (outside the sandbox, which
blocks Nx child processes). The Storybook glob includes the new story. Runtime
Storybook build could not execute on Windows because the existing Nx target
uses Unix `NODE_OPTIONS='...'` assignment; the equivalent direct invocation
also cannot resolve a `storybook` binary in this workspace. This environment
issue is recorded for the visual/runtime gate in ticket 08; no product code or
configuration was changed to work around it.
