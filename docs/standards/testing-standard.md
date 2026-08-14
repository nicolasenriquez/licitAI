---
type: standard
title: "Testing Standard"
description: "Repository standard for Testing Standard."
okf_version: "0.1"
---
# Testing Standard

## Overview

Twenty uses a multi-tool testing strategy: **Jest** for unit and integration tests, **Vitest** for Storybook tests, and **Playwright** for end-to-end tests. The test pyramid target is 70% unit, 20% integration, 10% E2E. Tests are run per package via Nx targets.

## Core Principles

- **Test behavior, not implementation.** Focus on what the user sees and does, not internal state.
- **Descriptive test names.** Use `"should [behavior] when [condition]"` format.
- **Query by user-visible elements.** Prefer text, roles, and labels over test IDs.
- **Use realistic interactions.** `@testing-library/user-event` over `fireEvent`.
- **Clear mocks between tests.** Use `jest.clearAllMocks()` in `beforeEach`.
- **Single file tests during development.** Fastest feedback loop. Full suite for CI.

## Configuration

### Jest

```javascript
// jest.config.mjs
export default {
  displayName: 'twenty-server',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
};
```

Jest preset (`jest.preset.js`) configures `ts-jest` with SWC for fast compilation.

### Vitest (Storybook)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
  },
});
```

### Playwright

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
});
```

## Running Tests

```bash
# Single test file (preferred during development)
npx jest path/to/test.test.ts --config=packages/twenty-server/jest.config.mjs

# Run tests matching a pattern
cd packages/twenty-server && npx jest "pattern"

# Full package test
npx nx test twenty-server

# Integration tests with database reset
npx nx run twenty-server:test:integration:with-db-reset

# Storybook tests
npx nx storybook:test twenty-front

# E2E tests
npx nx test:e2e twenty-e2e-testing
```

## Usage Patterns

### Descriptive Test Names

```typescript
describe('WorkspaceService', () => {
  describe('findById', () => {
    it('should return workspace when it exists', async () => { ... });
    it('should return null when workspace does not exist', async () => { ... });
    it('should not return soft-deleted workspaces', async () => { ... });
  });
});
```

### Querying by User-Visible Elements

```typescript
// Preferred: query by text, role, or label
const button = screen.getByRole('button', { name: 'Save' });
const heading = screen.getByText('Workspace Settings');
const input = screen.getByLabelText('Display Name');

// Not: query by test ID
const button = screen.getByTestId('save-button');
```

### Realistic Interactions

```typescript
import userEvent from '@testing-library/user-event';

// Preferred: userEvent for realistic simulation
await userEvent.click(screen.getByRole('button', { name: 'Save' }));
await userEvent.type(screen.getByLabelText('Name'), 'New Workspace');

// Not: fireEvent for simple dispatching
fireEvent.click(screen.getByRole('button'));
```

### Clear Mocks Between Tests

```typescript
describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call repository', async () => {
    const spy = jest.spyOn(repository, 'find');
    await service.findAll();
    expect(spy).toHaveBeenCalled();
  });
});
```

### Integration Tests with Database

```typescript
describe('WorkspaceResolver (integration)', () => {
  it('should create and query a workspace', async () => {
    // Uses test database with seed data
    const result = await graphqlQuery(`
      query { currentWorkspace { id displayName } }
    `);
    expect(result.data.currentWorkspace).toBeDefined();
  });
});
```

## Do's

- Do run a single test file during active development.
- Do use descriptive test names: `"should [behavior] when [condition]"`.
- Do query by text, role, or label (Testing Library best practices).
- Do use `userEvent` for realistic interaction simulation.
- Do clear mocks between tests with `jest.clearAllMocks()`.
- Do reset the database before integration tests.
- Do test all four UI states: loading, empty, error, and populated.
- Do test behavior, not implementation details.

## Don'ts

- Don't use snapshot tests for component output. Test specific behaviors.
- Don't query by test ID (`getByTestId`). Prefer user-visible attributes.
- Don't use `fireEvent` when `userEvent` is available.
- Don't skip test cleanup. Mocks and state should not leak between tests.
- Don't hardcode database state in tests. Use seed data or test factories.
- Don't skip tests in CI. All tests must pass for every PR.
- Don't write tests that test implementation details (internal state, private methods).

## Test Pyramid

| Level | Percentage | Tool | Scope |
| --- | --- | --- | --- |
| Unit | 70% | Jest, Vitest | Single function, component, or service. Isolated with mocks. |
| Integration | 20% | Jest (with DB), Vitest | Multiple services, database interactions, GraphQL queries. |
| E2E | 10% | Playwright | Full user flows across frontend and backend. |

## References

- `.cursor/rules/testing-guidelines.mdc` — IDE-specific testing rules.
- `AGENTS.md` — Root command routing. Read `docs/operations/command-surface.md` for testing commands and strategy.
- `jest.preset.js` — Shared Jest configuration.
- `playwright.config.ts` — Playwright E2E configuration.
