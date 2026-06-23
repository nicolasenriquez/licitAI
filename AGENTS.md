# AGENTS.md

This file provides guidance when working with code in this repository.

## Project Overview

Twenty is an open-source CRM built with modern technologies in a monorepo structure. The codebase is organized as an Nx workspace with multiple packages.

## Workspace Routing Pilot

`AGENTS.md` at the repository root remains the canonical entrypoint for agent instructions in this checkout.

During this routing rollout, use the contract below before acting:

- Start at `AGENTS.md`, then read `CONTEXT-MAP.md` to choose the correct surface.
- Route into `openspec/` for active OpenSpec changes, proposal/design/tasks/spec artifacts, change review, implementation, and archive/sync work.
- Route into `docs/` for repository architecture, business context, governance, operations, standards, and ADR reading or editing.
- Route into `packages/` for package-scoped work and for selecting the right package surface before leaf-package work.
- Route into `.codex/` for repo-local Codex commands, repo-local Codex skills, and local Codex workflow assets.
- If a task starts in `docs/` but is really about an active OpenSpec change, return to the root map and reroute into `openspec/`.
- If a task starts in `openspec/` but is really about architecture, governance, or other repo docs, return to the root map and reroute into `docs/`.
- If a task starts in `packages/` but is really about root docs or OpenSpec change work, return to the root map and reroute.
- If a task starts in `.codex/` but is really about the published plugin package or another mapped surface, return to the root map and reroute.
- Do not invent folder-local routing rules for unmapped leaf surfaces during rollout. If the task is outside the mapped surfaces, stay on the root contract and do not wander.
- Before a substantive response or edit, declare which routing/context files were consulted and which surface was selected.

## Key Commands

### Development
```bash
# Start development environment (frontend + backend + worker)
yarn start

# Individual package development
npx nx start twenty-front     # Start frontend dev server
npx nx start twenty-server    # Start backend server
npx nx run twenty-server:worker  # Start background worker
```

### Testing
```bash
# Preferred: run a single test file (fast)
npx jest path/to/test.test.ts --config=packages/PROJECT/jest.config.mjs

# Run all tests for a package
npx nx test twenty-front      # Frontend unit tests
npx nx test twenty-server     # Backend unit tests
npx nx run twenty-server:test:integration:with-db-reset  # Integration tests with DB reset
# To run an indivual test or a pattern of tests, use the following command:
cd packages/{workspace} && npx jest "pattern or filename"

# Storybook
npx nx storybook:build twenty-front
npx nx storybook:test twenty-front

# When testing the UI end to end, click on "Continue with Email" and use the prefilled credentials.
```

### Code Quality
```bash
# Linting (diff with main - fastest, always prefer this)
npx nx lint:diff-with-main twenty-front
npx nx lint:diff-with-main twenty-server
npx nx lint:diff-with-main twenty-front --configuration=fix  # Auto-fix

# Linting (full project - slower, use only when needed)
npx nx lint twenty-front
npx nx lint twenty-server

# Type checking
npx nx typecheck twenty-front
npx nx typecheck twenty-server

# Format code
npx nx fmt twenty-front
npx nx fmt twenty-server
```

### Build
```bash
# Build packages (twenty-shared must be built first)
npx nx build twenty-shared
npx nx build twenty-front
npx nx build twenty-server
```

### Database Operations
```bash
# Database management
npx nx database:reset twenty-server         # Reset database
npx nx run twenty-server:database:init:prod # Initialize database
npx nx run twenty-server:database:migrate:prod # Run instance commands (fast only)

# Generate an instance command (fast or slow)
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
```

### Database Inspection (Postgres MCP)

A read-only Postgres MCP server is configured in `.mcp.json`. Use it to:
- Inspect workspace data, metadata, and object definitions while developing
- Verify migration results (columns, types, constraints) after running migrations
- Explore the multi-tenant schema structure (core, metadata, workspace-specific schemas)
- Debug issues by querying raw data to confirm whether a bug is frontend, backend, or data-level
- Inspect metadata tables to debug GraphQL schema generation issues

This server is read-only — for write operations (reset, migrations, sync), use the CLI commands above.

### GraphQL
```bash
# Generate GraphQL types (run after schema changes)
npx nx run twenty-front:graphql:generate
npx nx run twenty-front:graphql:generate --configuration=metadata
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Jotai (state management), Linaria (styling), Vite
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, GraphQL (with GraphQL Yoga)
- **Monorepo**: Nx workspace managed with Yarn 4

### Package Structure
```
packages/
├── twenty-front/          # React frontend application
├── twenty-server/         # NestJS backend API
├── twenty-ui/             # Shared UI components library
├── twenty-shared/         # Common types and utilities
├── twenty-emails/         # Email templates with React Email
├── twenty-website/    # Next.js marketing website
├── twenty-docs/           # Documentation website
├── twenty-zapier/         # Zapier integration
└── twenty-e2e-testing/    # Playwright E2E tests
```

### Key Development Principles
- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party interfaces)
- **String literals over enums** (except for GraphQL enums)
- **No 'any' type allowed** — strict TypeScript enforced
- **Event handlers preferred over useEffect** for state updates
- **Props down, events up** — unidirectional data flow
- **Composition over inheritance**
- **No abbreviations** in variable names (`user` not `u`, `fieldMetadata` not `fm`)

### Naming Conventions
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Classes**: PascalCase (suffix component props with `Props`, e.g. `ButtonProps`)
- **Files/directories**: kebab-case with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`)
- **TypeScript generics**: descriptive names (`TData` not `T`)

### File Structure
- Components under 300 lines, services under 500 lines
- Components in their own directories with tests and stories
- Use `index.ts` barrel exports for clean imports
- Import order: external libraries first, then internal (`@/`), then relative

### Comments
- Use short-form comments (`//`), not JSDoc blocks
- Explain WHY (business logic), not WHAT
- Do not comment obvious code
- Multi-line comments use multiple `//` lines, not `/** */`

### State Management
- **Jotai** for global state: atoms for primitive state, selectors for derived state, atom families for dynamic collections
- Component-specific state with React hooks (`useState`, `useReducer` for complex logic)
- GraphQL cache managed by Apollo Client
- Use functional state updates: `setState(prev => prev + 1)`

### Backend Architecture
- **NestJS modules** for feature organization
- **TypeORM** for database ORM with PostgreSQL
- **GraphQL** API with code-first approach
- **Redis** for caching and session management
- **BullMQ** for background job processing

### Database & Upgrade Commands
- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **ClickHouse** for analytics (when enabled)
- When changing entity files, generate an **instance command** (`database:migrate:generate --name <name> --type <fast|slow>`)
- **Fast** instance commands handle schema changes; **slow** ones add a `runDataMigration` step for data backfills
- **Workspace commands** iterate over all active/suspended workspaces for per-workspace upgrades
- Commands use `@RegisteredInstanceCommand` and `@RegisteredWorkspaceCommand` decorators for automatic discovery
- Include both `up` and `down` logic in instance commands
- Never delete or rewrite committed instance command `up`/`down` logic
- See `packages/twenty-server/docs/UPGRADE_COMMANDS.md` for full documentation

### Utility Helpers
Use existing helpers from `twenty-shared` instead of manual type guards:
- `isDefined()`, `isNonEmptyString()`, `isNonEmptyArray()`

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library IDs and get library docs without waiting for explicit requests.

### Before Making Changes
1. Always run linting (`lint:diff-with-main`) and type checking after code changes
2. Test changes with relevant test suites (prefer single-file test runs)
3. Ensure instance commands are generated for entity changes (`database:migrate:generate`)
4. Check that GraphQL schema changes are backward compatible
5. Run `graphql:generate` after any GraphQL schema changes

### Code Style Notes
- Use **Linaria** for styling with zero-runtime CSS-in-JS (styled-components pattern)
- Follow **Nx** workspace conventions for imports
- Use **Lingui** for internationalization
- Apply security first, then formatting (sanitize before format)

### Testing Strategy
- **Test behavior, not implementation** — focus on user perspective
- **Test pyramid**: 70% unit, 20% integration, 10% E2E
- Query by user-visible elements (text, roles, labels) over test IDs
- Use `@testing-library/user-event` for realistic interactions
- Descriptive test names: "should [behavior] when [condition]"
- Clear mocks between tests with `jest.clearAllMocks()`

## Dev Environment Setup

All dev environments (Claude Code web, Cursor, local) use one script:

```bash
bash packages/twenty-utils/setup-dev-env.sh
```

This handles everything: starts Postgres + Redis (auto-detects local services vs Docker), creates databases, copies `.env` files, and initializes the database schema (runs migrations) on a fresh database. Idempotent — safe to run multiple times.

- `--docker` — force Docker mode (uses `packages/twenty-docker/docker-compose.dev.yml`)
- `--down` — stop services
- `--reset` — wipe data and restart fresh
- **Skip the setup script** for tasks that only read code — architecture questions, code review, documentation, etc.

**Note:** CI workflows (GitHub Actions) manage services via Actions service containers and run setup steps individually — they don't use this script.

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Detailed development guidelines and best practices

## Additional Agent Rules

The following repository-level rules were added from `C:\Users\nenri\OneDrive\Desktop\proyectos\pry-omnibid\omni-bid\AGENTS.md` as additive guidance.

# Omnibid Agent Rules

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Repository Context First

**Read the repository's durable context before making material changes.**

Before non-trivial work:
- Read `README.md`.
- Read `docs/README.md`.
- Read `docs/governance/ai-assisted-delivery.md`.
- Read the relevant `docs/business/`, `docs/architecture/`, and `docs/operations/` files.
- Read the relevant ADRs in `docs/decisions/`.
- Read relevant OpenSpec files when the change is material or cross-cutting.

Treat docs, ADRs, and OpenSpec as part of the delivery system, not as optional background.
If the gap is a stakeholder or business decision rather than an engineering one, use
`.codex/commands/grill-with-docs/SKILL.md` instead of guessing.

## 6. Protect Repository Truth

**Do not blur documented reality, target state, and assumptions.**

- Do not invent business facts.
- Do not collapse current state and target state into one story.
- Do not treat source-specific heuristics as universal truth unless the repo documents them that way.
- If the repository is documentation-heavy or partially implemented, say that explicitly.
- Do not import repo-specific rules from external reference files unless they exist here and match this repo.

The rule: if something is uncertain, document the uncertainty instead of smoothing it over.

## 7. Standards Are File-Backed

**Follow the repo's standard files instead of inventing local conventions.**

- `docs/standards/` is the authority for language, framework, and tooling conventions.
- For phase-1 backend work, default to FastAPI + `uv`.
- For phase-1 frontend work, default to React/Next.js + `pnpm`.
- Backend quality gates are `ruff check`, `ruff format`, `mypy`, `pytest`, and `bandit`.
- Frontend quality gates are `eslint`, TypeScript strict mode, and `vitest`.

If a shared default changes, do not change code only. Update the relevant standards, docs, ADRs,
or OpenSpec artifacts so the rule is durable and traceable.

## 8. Command And Verification Discipline

**Use the documented command surface. Verify with the smallest relevant gate.**

- Prefer `rg` over `grep` and `find` for search.
- Do not invent local commands that are not verified from repository files or docs.
- When both container and host-local paths exist, treat the container path as the default unless the repo documents otherwise.
- Use the smallest relevant validation command for the surface you changed, then report what you did or could not verify.
- If runtime assets are not implemented yet, say so plainly instead of pretending there is a working execution path.
- In this Windows workspace, bare `rtk <cmd>` may execute inside WSL while `rtk proxy powershell -NoProfile -Command "<cmd>"` executes on the Windows host. Do not mix the two unintentionally.
- For PowerShell cmdlets and host-tooling workflows, use `rtk proxy powershell -NoProfile -Command ...`.
- If a command is version-sensitive and WSL and Windows host resolve different tool versions, prefer the Windows-host RTK proxy path unless the repo explicitly documents WSL as canonical.

## 9. Command-Backed Working Modes

**Prefer the repository's explicit command modes over improvised workflows.**

When the task matches an existing command, use that mode deliberately:
- Bugs, breakages, regressions, or performance issues -> `/diagnose`
- Test-first feature or fix delivery -> `/tdd`
- Architecture review or structural deepening -> `/improve-codebase-architecture`
- Domain, terminology, stakeholder, or ADR-sensitive planning -> `/grill-with-docs`
- Material or cross-cutting spec work -> relevant OpenSpec commands

If the user uses shorthand like `/fail-fast`, `/sdd`, or `/improve-code-architecture`, map it to the closest repository command explicitly before proceeding.

## 10. Fail-Fast Diagnosis

**Do not debug by speculation. Build a feedback loop first.**

For non-trivial bugs or regressions:
- First build the fastest credible pass/fail loop you can.
- Do not hypothesize before you can reproduce the real symptom.
- Generate multiple ranked, falsifiable hypotheses before testing.
- Change one variable at a time when instrumenting.
- If no correct regression-test seam exists, document that as an architectural finding.

A fix is not complete until:
- the original repro stops reproducing,
- the regression check passes or the missing seam is documented,
- temporary debug instrumentation is removed,
- the confirmed cause is captured in the handoff, commit, or PR context.

## 11. Test-First Delivery

**Default to behavior-first TDD when changing code behavior.**

- Tests should verify behavior through public interfaces, not implementation details.
- Prefer vertical slices: one failing test, one minimal implementation, repeat.
- Do not batch all tests first and all implementation later.
- Do not refactor while RED.
- If test-first is skipped, say why and use the next best executable verification path.

The standard question is not "what code should I write?" but "what behavior must become true?"

## 12. Source-Driven Design And Documentation Discipline

**Repository files are the source of truth for planning, naming, and shared decisions.**

- Cross-check user claims, code, docs, ADRs, and OpenSpec before asserting shared truth.
- Challenge fuzzy or conflicting terminology early.
- Use domain language consistently once the repository defines it.
- Update durable documentation when a shared meaning, contract, or architectural rule changes.
- Offer or update ADRs only for decisions that are hard to reverse, surprising without context, and the result of a real tradeoff.

Do not keep important shared decisions trapped in chat.

## 13. Changelog Discipline

**User-visible or release-relevant behavior changes must be evaluated for changelog impact.**

- Check whether `CHANGELOG.md` should be updated.
- Keep unreleased notes under `Unreleased`.
- Write changelog entries for release consumers, not as implementation notes.
- Follow `docs/standards/changelog-standard.md`.
- If no changelog update is needed for release-relevant work, say so explicitly in the final handoff.

## 14. Architecture Improvement Mode

**Architecture work is an explicit mode, not an excuse for opportunistic refactoring.**

When using `/improve-codebase-architecture` or doing equivalent work:
- Focus on deepening modules, improving seams, and increasing locality.
- Prefer simpler interfaces with more leverage behind them.
- Use the deletion test to identify shallow pass-through modules.
- Respect ADRs unless real friction justifies reopening them.
- Present structural candidates and tradeoffs before implementing broad refactors.

The goal is not more abstraction. The goal is better testability, navigability, and concentrated complexity.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
