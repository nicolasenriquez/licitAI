---
type: design-guide
title: "Design System"
description: "Design guidance for Design System."
okf_version: "0.1"
---
# Design System

## Purpose
Define the design system for the Twenty CRM platform, covering visual direction, component families, interaction rules, layout grammar, and accessibility standards. This document unifies the product UI (`twenty-ui`) and the marketing site design (`DESIGN.md`).

## Primary Audience
Frontend engineers, full-stack engineers, designers, and AI agents implementing product surfaces.

## Executive Summary
Twenty has two design registers: the **product UI** (`twenty-front`, served by `twenty-ui`) and the **marketing site** (`twenty-website`). The product UI is the CRM application — dense, analytical, read-heavy. The marketing site is editorial, typographic, and restrained. Both share a common token system (OKLCH neutrals, three-family typography, 4px base unit) but differ in density and mood. This document covers both registers while keeping the product UI as the primary focus.

## Product Register

| Attribute | Product UI (`twenty-front`) | Marketing Site (`twenty-website`) |
| --- | --- | --- |
| Register | CRM application | Brand landing / partner pages |
| Primary mood | Analytical, operational, dense | Editorial, founder-led, considered |
| Default scene | User reviewing contacts, deals, tasks during work hours | Founder browsing partner profiles on a monitor |
| Default theme | System-aware (light/dark via CSS variables) | Light-first (dark available but deferred) |
| Interaction posture | Read-explore-edit. Dense tables, forms, record panels. | Read-evaluate. Browsing partner profiles. |
| Design system package | `twenty-ui` (20 component modules) | `twenty-website` (standalone, NOT using `twenty-ui`) |
| Styling engine | Linaria (zero-runtime CSS-in-JS) in `twenty-front`; SCSS Modules in `twenty-ui` | Linaria (zero-runtime CSS-in-JS) |
| Icon library | `@tabler/icons-react` | `@tabler/icons-react` |

## Experience Principles

1. **Metadata-driven UI.** Object and field definitions from the metadata API drive table columns, form fields, and record detail layouts dynamically. Frontend code should never hardcode schema shapes.
2. **Dense but legible.** The CRM is an operational workspace, not a marketing dashboard. Information density is acceptable when hierarchy is clear.
3. **Read-optimized first.** Default interactions are inspect, filter, sort, and navigate. Mutation surfaces are narrow and explicit.
4. **Props down, events up.** Unidirectional data flow. Components receive data via props and emit changes via callbacks.
5. **Composition over inheritance.** Complex UIs are built by composing primitives, not by extending base classes.
6. **Event handlers over `useEffect`.** State updates in response to user actions use event handlers, not passive effects.
7. **Functional state updates.** `setState(prev => prev + 1)` pattern for derived state updates.
8. **Accessible by default.** WCAG AA. Keyboard-navigable. Screen-reader compatible. Color never the sole carrier of meaning.

## Visual Direction

### Color Strategy

The product UI uses a **restrained neutral palette** with semantic accent colors. Tokens are defined as CSS variables in `twenty-ui`; `twenty-front` consumes them through Linaria `styled` components, while `twenty-ui` components use SCSS Modules.

**Neutrals** (the workhorses, from `DESIGN.md`):

| Token | Role |
| --- | --- |
| `colors.primary.background[100]` | Page and card surface (white in light theme) |
| `colors.primary.text[100]` | Headlines, primary text (near-black) |
| `colors.primary.text[80]` | Body text (dark gray) |
| `colors.primary.text[60]` | Secondary text, meta, captions |
| `colors.primary.text[40]` | Disabled, placeholder |
| `colors.primary.text[20]` | Subtle separators |
| `colors.primary.text[10]` | Hairline borders |
| `colors.primary.text[5]` | Subtle fills (chips, tags) |
| `colors.primary.border[10]` | Default border |
| `colors.primary.border[20]` | Hover border |

**Brand accents** (used sparingly for emphasis):

| Token | Color |
| --- | --- |
| `colors.accent.blue` | `#4a38f5` / `#8174f8` |
| `colors.accent.pink` | `#ed87fc` / `#f3abfd` |
| `colors.accent.yellow` | `#feffb7` / `#feffd9` |
| `colors.accent.green` | `#89fc9a` / `#b0fdbe` |

**Theme switching**: Light and dark themes are implemented as CSS variable overrides via `data-scheme="dark"` attribute. `twenty-ui` exports `theme-light.css` and `theme-dark.css` for each theme. A `ThemeProvider` component manages the current scheme.

### Typography

Three font families, each with a distinct role:

| Family | Use | CSS Variable |
| --- | --- | --- |
| Serif | Headlines, section titles, headline values | `--font-serif` |
| Sans | Body text, prose, interactive labels | `--font-sans` |
| Mono | Eyebrows, meta, currency labels, tabular numerics | `--font-mono` |

**Scale**: Font sizes are computed from `theme.font.size(n) → calc(var(--font-base) * n)` where `--font-base: 0.25rem` (4px):

| Level | Size | Use |
| --- | --- | --- |
| Display / h1 | 9–12 (36–48px) | Page titles |
| h2 / section heads | 7–8 (28–32px) | Section headers |
| h3 / card heads | 5–6 (20–24px) | Card titles, record names |
| Body / prose | 4–5 (16–20px) | Main content text |
| Eyebrow / meta | 3 (12px) | Labels, captions, metadata |

**Hierarchy rules**:
- Hierarchy is set by **scale and weight contrast**, not by color or borders.
- Weights: `light: 300`, `regular: 400`, `medium: 500`. No bold.
- Body line length capped at 65–75ch.

### Spacing & Layout

Base unit: **4px**. Spacing helper: `theme.spacing(n) → n * 4px`.

| Context | Value |
| --- | --- |
| Card padding | `theme.spacing(6)` = 24px |
| Inter-section gap | `theme.spacing(10–14)` = 40–56px |
| Inter-element gap | `theme.spacing(3–5)` = 12–20px |
| Page horizontal padding (mobile) | `theme.spacing(4)` = 16px |
| Page horizontal padding (desktop) | `theme.spacing(10)` = 40px |
| Radius (cards) | `theme.radius(2)` = 4px |
| Radius (pills) | `999px` |

**Borders**: Hairline only (`1px solid primary.border[10]`). On hover, step to `border[20]`. No chunky borders as decoration.

### Motion

- Hover transitions: 250ms, ease-out.
- Card entrance: 700ms cubic-bezier `0.22, 1, 0.36, 1` (ease-out-quart), 90ms stagger per index.
- All motion respects `@media (prefers-reduced-motion: reduce)` — animations stop.
- No bounce, no elastic, no parallax.

## Component Families

`twenty-ui` organizes components into 15 functional families. Each family has its own sub-module export path.

### Accessibility (`@/accessibility`)

Components for accessible UI patterns:

- `VisibilityHidden` — Visually hidden content for screen readers.
- `VisibilityHiddenInput` — Hidden form input for accessible state.

### Assets (`@/assets`)

Static visual assets and illustrations:

- Icon SVGs: `IconAddressBook`, `IconBrandAnthropic`, `IconGoogleCalendar`, and more.
- Illustration SVGs: `IllustrationIconJson`, `IllustrationIconUser`, `IllustrationIconTag`, and more.
- Theme textures: dark and light noise patterns for surface backgrounds.

### Data Display (`@/data-display`)

Components for rendering structured data:

- `Avatar`, `AvatarGroup`, `AvatarOrIcon` — User and entity avatars.
- `Chip`, `Pill`, `Tag`, `Status` — Inline labels and status indicators.
- `Checkmark`, `AnimatedCheckmark` — Completion indicators.
- `ColorSample` — Color preview swatch.
- `CommandBlock` — Rendered command syntax display.
- `LinkChip` — Clickable chip with link behavior.
- `NotificationCounter` — Unread count badge.
- `TintedIconTile` — Colored icon container.

### Feedback (`@/feedback`)

Components for user feedback and loading states:

- `Loader`, `ProgressBar`, `CircularProgressBar` — Loading indicators.
- `AnimatedPlaceholder` — Skeleton loading placeholder.
- `Banner`, `InlineBanner`, `Callout`, `Info` — Informational messages.
- `EmptyPlaceholderStyled`, `ErrorPlaceholderStyled` — Empty and error states.
- `SidePanelInformationBanner` — Side panel info banner.

### Icon (`@/icon`)

Icon components and utilities:

- `Icon` — Base icon wrapper.
- `IconAddressBook`, `IconBrandAnthropic`, `IconBrandGemini`, `IconGmail`, `IconGoogle`, `IconLock`, `IconTrashXOff`, `IconTwentyStar` — Brand and functional icons.
- `IllustrationIconArray`, `IllustrationIconJson`, `IllustrationIconTag`, `IllustrationIconUser` — Illustration icons.
- `TablerIcons` — Wrapper for `@tabler/icons-react`.
- `ThinkingOrbitLoaderIcon` — Animated AI thinking indicator.
- Icon providers, hooks, and state management.

### Input (`@/input`)

Form controls and interactive inputs:

- `Button`, `MainButton`, `LightButton`, `RoundedIconButton`, `FloatingButton`, `FloatingIconButton`, `IconButton` — Button variants.
- `ButtonGroup`, `TabButton`, `Toggle` — Button groups and toggles.
- `Checkbox`, `Radio`, `RadioGroup` — Selection controls.
- `SearchInput` — Search field.
- `CodeEditor` — Monaco-based code editor.
- `ColorPickerButton`, `ColorSchemeCard`, `ColorSchemePicker` — Color selection.
- `CardPicker` — Card-based selection.
- `AnimatedButton` — Animated button wrapper.
- `AdvancedSettingsToggle` — Expandable settings toggle.

### JSON Visualizer (`@/json-visualizer`)

Components for rendering JSON data as expandable trees:

- `JsonTree`, `JsonNode`, `JsonObjectNode`, `JsonArrayNode`, `JsonValueNode`, `JsonNestedNode` — JSON tree view.
- `JsonTreeContextProvider` — Context for tree state.

### Layout (`@/layout`)

Layout primitives and animation wrappers:

- `AnimatedContainer`, `AnimatedEaseIn`, `AnimatedEaseInOut`, `AnimatedExpandableContainer`, `AnimatedFadeOut`, `AnimatedCircleLoading` — Container animations.
- `AnimatedIconCrossfade` — Icon transition.
- `AnimatedRotate` — Rotation animation.
- `AnimatedTextWord` — Word-level text animation.
- `AnimatedTranslation` — Translation animation.
- `AutogrowWrapper` — Auto-expanding textarea container.
- `HorizontalSeparator` — Horizontal divider.
- `ResizeHandle` — Resizable panel handle.
- `Section` — Page section wrapper.

### Navigation (`@/navigation`)

Navigation components:

- `Link`, `RawLink`, `UndecoratedLink`, `RoundedLink`, `SocialLink`, `ContactLink`, `ClickToActionLink` — Link variants.
- `GithubVersionLink` — GitHub version link.
- `MenuItem` — Menu item with variants: `MenuItemAvatar`, `MenuItemDraggable`, `MenuItemMultiSelect`, `MenuItemNavigate`, `MenuItemSelect`, `MenuItemToggle`, and more.
- `NavigationBar`, `NavigationBarItem` — Top and side navigation.

### Styles (`@/styles`)

Global style foundations:

- CSS reset (`reset.scss`).
- SCSS abstracts: breakpoints, functions, mixins.

### Surfaces (`@/surfaces`)

Container and overlay surfaces:

- `Card`, `CardContent`, `CardFooter`, `CardHeader` — Card layout with header, content, and footer slots.
- `Modal`, `ModalBackdrop`, `ModalContent`, `ModalFooter`, `ModalHeader` — Modal dialog with backdrop.
- `AppTooltip` — Tooltip wrapper.
- `OverflowingTextWithTooltip` — Truncated text with tooltip on overflow.

### Theme (`@/theme`)

Theme configuration and constants:

- Theme constants for color, spacing, and typography tokens.

### Theme Constants (`@/theme-constants`)

Theme provider and CSS variable generation:

- `ThemeProvider` — Theme context provider. Manages light/dark scheme.
- `theme-light.css`, `theme-dark.css` — Compiled theme CSS exports.
- `themeCssVariables` — CSS variable generation utility.
- `getNextThemeColor` — Color palette generation.

### Typography (`@/typography`)

Text components:

- `H1Title`, `H2Title`, `H3Title` — Heading components.
- `Label` — Form and section labels.
- `LinkifiedText` — Text with auto-linked URLs.
- `SeparatorLineText` — Text with horizontal separator lines.
- `StyledText` — Base styled text component.

### Utilities (`@/utilities`)

Shared utility functions for color computation, responsive behavior, device detection, and navigation helpers.

## Sub-Module Exports

`twenty-ui` exposes 19 sub-path exports for tree-shakeable imports:

| Export Path | Content |
| --- | --- |
| `twenty-ui` | Main barrel export |
| `twenty-ui/style.css` | Compiled styles |
| `twenty-ui/theme-light.css` | Light theme CSS variables |
| `twenty-ui/theme-dark.css` | Dark theme CSS variables |
| `twenty-ui/accessibility` | VisibilityHidden components |
| `twenty-ui/assets` | SVG icons and illustrations |
| `twenty-ui/data-display` | Avatar, Chip, Tag, Status, etc. |
| `twenty-ui/feedback` | Loader, ProgressBar, Banner, etc. |
| `twenty-ui/icon` | Icon components and providers |
| `twenty-ui/input` | Button, Checkbox, SearchInput, etc. |
| `twenty-ui/json-visualizer` | JsonTree components |
| `twenty-ui/layout` | AnimatedContainer, Section, etc. |
| `twenty-ui/navigation` | Link, MenuItem, NavigationBar |
| `twenty-ui/styles` | SCSS abstracts and reset |
| `twenty-ui/surfaces` | Card, Modal, AppTooltip |
| `twenty-ui/testing` | Test utilities |
| `twenty-ui/theme` | Theme constants |
| `twenty-ui/theme-constants` | ThemeProvider, CSS variables |
| `twenty-ui/typography` | H1Title, H2Title, Label, etc. |
| `twenty-ui/utilities` | Shared utility functions |

## Interaction Rules

1. **Keyboard-navigable.** All interactive elements reachable via keyboard. Focus ring: `outline: 2px solid primary.text[100]; outline-offset: 4px`.
2. **Touch targets ≥ 40px.** Minimum touch target size for mobile.
3. **`aria-label` on icon-only buttons.** `aria-hidden="true"` on decorative icons. `aria-labelledby` on sectioned regions.
4. **`target="_blank"` links include `rel="noopener noreferrer"`.**
5. **Color never sole carrier of meaning.** Status indicators carry both icon and text label.
6. **Functional state updates.** `setState(prev => ...)` not `setState(value)`.
7. **Event handlers for user interactions.** `onClick` handler, not `useEffect` watching a click state.

## Anti-Patterns

- **No gradients** on text, borders, backgrounds, or surfaces.
- **No glassmorphism** or blur effects.
- **No skeuomorphic shadows** beyond `0 12px 32px -16px rgba(0,0,0,0.18)` on hover.
- **No floating "Trusted by" logo bars** (marketing anti-pattern).
- **No hype copy or growth-hack patterns** in the UI.
- **No hardcoded schema shapes** in frontend code. Use metadata-driven rendering.

## Phase-1 Design Scope

- `twenty-ui` is the canonical component library for the product UI.
- `twenty-front` consumes `twenty-ui` components and extends with feature-specific modules.
- Apps built with `twenty-sdk` use `twenty-ui` for base components and `defineFrontComponent()` for custom widgets.
- The marketing site (`twenty-website`) uses its own component set, not `twenty-ui`.
- Design tokens (colors, spacing, typography) are defined via CSS variables in `twenty-ui` and consumed everywhere.
- The Twenty Figma library is available at [figma.com/file/xt8O9mFeLl46C5InWwoMrN/Twenty](https://www.figma.com/file/xt8O9mFeLl46C5InWwoMrN/Twenty) for visual reference.

## Current Assumptions

- Linaria remains the styling engine for `twenty-front` and `twenty-website`; `twenty-ui` uses SCSS Modules.
- `twenty-ui` continues to be the single component library for the product UI.
- The marketing site and product UI remain separate design registers with shared token philosophy.
- `@tabler/icons-react` remains the icon library for both product and marketing.
- Light-first design for marketing; system-aware (light/dark) for product.
- Tailwind CSS or other utility-class frameworks are not used in the product UI. `twenty-front` uses Linaria and `twenty-ui` uses SCSS Modules.
- Visual regression testing for `twenty-ui` uses Storybook + Chromatic (or equivalent) for automated visual diff in CI.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| `twenty-website` consume `twenty-ui` | No. The marketing site and product UI are intentionally different design registers. Each maintains its own component set. |
| Marketing design register documentation | `DESIGN.md` at the repo root remains the canonical marketing site design document. Not duplicated in `docs/design/`. |
| Figma library reference | The public Figma library is linked in this document for visual reference. |
| Visual regression testing | Storybook + Chromatic for automated visual diff of `twenty-ui` components. |

## Open Decisions

- Should `twenty-ui` have a formal component API stability guarantee (similar to SemVer for the SDK)?
- Should there be automated accessibility testing (axe-core) in the Storybook CI pipeline?
