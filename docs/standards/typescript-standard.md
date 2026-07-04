---
type: standard
title: "TypeScript Standard"
description: "Repository standard for TypeScript Standard."
okf_version: "0.1"
---
# TypeScript Standard

## Overview

Twenty uses **TypeScript** with strict compiler options as the type-checking layer for all code. TypeScript is enforced by `tsgo` in CI and must pass for every package. The configuration is defined in `tsconfig.base.json` at the repo root.

**Why TypeScript strict mode:**
- Catches `null`/`undefined` errors before runtime.
- Eliminates entire categories of bugs (type mismatches, missing properties).
- Enables confident refactoring with compiler-backed guarantees.
- AI-friendly: the compiler rejects impossible states that an LLM might hallucinate.

## Core Principles

- **Strict mode is non-negotiable.** Every compiler flag that tightens type safety must be enabled.
- **`any` is forbidden** in application code. Use `unknown` when the type is genuinely unknown, or define proper types.
- **Types over interfaces.** Use `type` aliases by default. Use `interface` only when extending third-party interfaces or when declaration merging is required.
- **String literals over enums.** Prefer `type Status = 'active' | 'inactive'` over `enum Status { ... }`. Exception: GraphQL enums which must use TypeScript enums.
- **Named exports only.** No default exports. Exception: SDK `define*()` functions and Next.js page/layout conventions.
- **Descriptive generic names.** Use `TData` not `T`. Use `TFieldMetadataType` not `T`.
- **Explicit return types** on all functions and components.

## Configuration

### Base tsconfig (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  }
}
```

### Running Type Check

```bash
npx nx typecheck twenty-server     # Type check backend
npx nx typecheck twenty-front      # Type check frontend
npx nx typecheck twenty-shared     # Type check shared library
```

Type check uses `tsgo` (fast TypeScript type checker) via `nx.json` target.

## Usage Patterns

### Type Aliases Over Interfaces

```typescript
// Preferred: type alias
type ButtonProps = {
  label: string;
  variant: 'primary' | 'secondary';
  onClick: () => void;
};

// Only for extending third-party interfaces
interface CustomRequest extends Express.Request {
  workspaceId: string;
}
```

### String Literals Over Enums

```typescript
// Preferred: string literal union
type WorkspaceActivationStatus =
  | 'PENDING_CREATION'
  | 'ONGOING_CREATION'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

// Exception: GraphQL enums
export enum FieldMetadataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
}
```

### Descriptive Generics

```typescript
// Preferred: descriptive names
function findEntity<TEntity>(id: string): TEntity | null { ... }

// Not: single-letter generics
function findEntity<T>(id: string): T | null { ... }
```

### Null Checking

```typescript
// Use optional chaining and nullish coalescing
const label = object?.labelSingular ?? 'Untitled';

// Use isDefined(), isNonEmptyString() from twenty-shared
import { isDefined, isNonEmptyString } from 'twenty-shared/utils';

// Not: manual null checks
if (value !== null && value !== undefined) { ... }
```

## Naming Conventions

| Construct | Convention | Example |
| --- | --- | --- |
| Variables | camelCase | `userWorkspace` |
| Functions | camelCase | `getWorkspaceById()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types | PascalCase | `UserWorkspaceDTO` |
| Component props | PascalCase + `Props` suffix | `ButtonProps` |
| Files | kebab-case + suffix | `user-workspace.entity.ts` |
| Generics | PascalCase + descriptive prefix | `TData`, `TFieldMetadataType` |

## Import Order

```typescript
// 1. External libraries
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// 2. Internal packages (@/)
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/input';

// 3. Relative imports
import { WorkspaceService } from './workspace.service';
import { type WorkspaceDTO } from './workspace.dto';
```

## Do's

- Do use `unknown` when a type is genuinely unknown (API response, JSON parse).
- Do use `type` imports for type-only imports (`import type { User } from '...'`).
- Do use `const` assertions for literal types (`as const`).
- Do use discriminated unions for state machines.
- Do use `tsgo` for type checking — it's faster than `tsc`.
- Do run `typecheck` after any TypeScript change.

## Don'ts

- Don't use `any`. Use `unknown` and narrow with type guards.
- Don't use default exports (exceptions noted above).
- Don't use abbreviations in names (`usr` not `user`, `fm` not `fieldMetadata`).
- Don't use `enum` for non-GraphQL types. Use string literal unions.
- Don't use `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- Don't skip type checking in CI. `tsgo` must pass for every package.

## References

- `CLAUDE.md` — Code style rules and development workflow.
- `.cursor/rules/typescript-guidelines.mdc` — IDE-specific TypeScript rules.
- `tsconfig.base.json` — Base TypeScript configuration.
- `docs/architecture/repository-strategy.md` — Monorepo build order.
