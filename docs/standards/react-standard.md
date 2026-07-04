---
type: standard
title: "React Standard"
description: "Repository standard for React Standard."
okf_version: "0.1"
---
# React Standard

## Overview

Twenty uses **React 19** with a functional-component-only approach. Components are organized in feature modules under `packages/twenty-front/src/modules/`. The design system lives in `packages/twenty-ui/`. State management uses Jotai for global state and Apollo Client for GraphQL cache. Styling uses Linaria (zero-runtime CSS-in-JS).

## Core Principles

- **Functional components only.** No class components. No exception.
- **Named exports only.** Every component and hook is a named export. No `export default`.
- **Composition over inheritance.** Complex UIs are built by composing primitives, not by extending base classes.
- **Props down, events up.** Parent components pass data via props. Children emit changes via callbacks.
- **Event handlers over `useEffect`.** State updates from user actions use event handlers (`onClick`, `onChange`). `useEffect` is for synchronization with external systems, not for reacting to user events.
- **No `any` type** in props or state. Use proper TypeScript types.
- **300-line component limit.** Components exceeding 300 lines should be split into smaller components.

## Configuration

React components are compiled via SWC with Linaria for CSS extraction:

```json
// nx.json generators
"@nx/react": {
  "component": {
    "style": "@linaria/react"
  }
}
```

Components are tested with React Testing Library and user-event.

## Usage Patterns

### Component Structure

```typescript
// packages/twenty-front/src/modules/my-feature/components/MyComponent.tsx

import { styled } from '@linaria/react';
import { useAtomValue } from 'jotai';
import { Button } from 'twenty-ui/input';

import { myAtom } from '../atoms/myAtom';

type MyComponentProps = {
  label: string;
  onAction: () => void;
};

const StyledContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
`;

export const MyComponent = ({ label, onAction }: MyComponentProps) => {
  const value = useAtomValue(myAtom);

  return (
    <StyledContainer>
      <span>{label}</span>
      <span>{value}</span>
      <Button label="Action" onClick={onAction} />
    </StyledContainer>
  );
};
```

### State Management

```typescript
// Jotai atoms for global state
import { atom } from 'jotai';

export const currentWorkspaceAtom = atom<Workspace | null>(null);

// Derived state with selectors
export const isWorkspaceActiveAtom = atom((get) => {
  const workspace = get(currentWorkspaceAtom);
  return workspace?.activationStatus === 'ACTIVE';
});

// Atom families for dynamic collections
import { atomFamily } from 'jotai/utils';

export const recordAtomFamily = atomFamily((recordId: string) =>
  atom<Record | null>(null),
);
```

### Event Handlers Over useEffect

```typescript
// Preferred: event handler
const handleSave = () => {
  setSaving(true);
  saveRecord(record).finally(() => setSaving(false));
};

// Not: useEffect watching a "shouldSave" state
useEffect(() => {
  if (shouldSave) {
    saveRecord(record);
  }
}, [shouldSave]);
```

### Composing Components

```typescript
// Preferred: composition
<Card>
  <CardHeader>
    <H2Title title="Details" />
  </CardHeader>
  <CardContent>
    <RecordForm record={record} />
  </CardContent>
  <CardFooter>
    <Button label="Save" onClick={handleSave} />
  </CardFooter>
</Card>

// Not: inheritance
class RecordCard extends BaseCard { ... }
```

## File Structure

```
my-feature/
├── components/               # React components
│   ├── MyComponent.tsx
│   └── __stories__/
│       └── MyComponent.stories.tsx
├── hooks/                     # Custom hooks
│   └── useMyFeature.ts
├── atoms/                     # Jotai atoms
│   └── myFeatureAtom.ts
├── types/                     # Feature-specific types
│   └── MyFeatureDTO.ts
└── __tests__/                 # Tests
    └── MyComponent.test.tsx
```

## Do's

- Do use functional state updates: `setState(prev => prev + 1)`.
- Do use Jotai for global state, Apollo cache for GraphQL data, `useState`/`useReducer` for component-local state.
- Do use Linaria `styled` components for all styling.
- Do import from `twenty-ui` sub-paths: `import { Button } from 'twenty-ui/input'`.
- Do use `@tabler/icons-react` for icons.
- Do use React Testing Library for tests. Query by text, role, or label.
- Do use `userEvent` for realistic interaction simulation.
- Do name tests descriptively: `"should [behavior] when [condition]"`.

## Don'ts

- Don't use class components.
- Don't use default exports.
- Don't use `useEffect` for state updates triggered by user actions. Use event handlers.
- Don't use `any` in props, state, or hooks.
- Don't exceed 300 lines per component. Split into smaller components.
- Don't abbreviate names (`btn` not `Button`, `usr` not `User`).
- Don't use CSS-in-JS libraries other than Linaria (no Emotion, no styled-components).
- Don't use Tailwind CSS or utility-class frameworks in the product UI. Linaria only.
- Don't hardcode schema shapes. Use metadata-driven rendering.

## References

- `CLAUDE.md` — Code style rules and development workflow.
- `.cursor/rules/react-general-guidelines.mdc` — IDE-specific React rules.
- `.cursor/rules/react-state-management.mdc` — Jotai and state management rules.
- `docs/design/design-system.md` — Component catalog and design tokens.
- `packages/twenty-ui/src/` — Design system component library.
