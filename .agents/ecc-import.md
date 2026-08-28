---
type: provenance
title: ECC Skill Import Record
description: Provenance, precedence, and compatibility record for the six ECC skills imported into .agents/skills/.
---

# ECC Skill Import Record

## Source

- Repository: https://github.com/affaan-m/ECC
- Branch: `main`
- Commit SHA: `d8409a4b0813771235555e32e3d8046a73988bfa`
- Commit date: 2026-08-19
- Import date: 2026-08-22
- License: MIT (upstream ECC). `postgres-patterns` additionally credits Supabase (MIT).

## Installed Skills

| Skill | Destination | Upstream state |
| --- | --- | --- |
| `agentic-engineering` | `.agents/skills/agentic-engineering/` | byte-identical |
| `nestjs-patterns` | `.agents/skills/nestjs-patterns/` | byte-identical |
| `postgres-patterns` | `.agents/skills/postgres-patterns/` | precedence block added |
| `database-migrations` | `.agents/skills/database-migrations/` | precedence block added |
| `react-patterns` | `.agents/skills/react-patterns/` | precedence block added |
| `security-review` | `.agents/skills/security-review/` | precedence block added |

Precedence blocks are inserted after the frontmatter, before the heading. All
other upstream content is unchanged.

## Compatibility Findings

Format: `ECC assumption → licitAI convention → resolution`.

1. `postgres-patterns`: RLS as tenant-isolation mechanism (Supabase best
   practices) → schema-per-workspace isolation
   ([docs/standards/database-standard.md](docs/standards/database-standard.md),
   ADR 0004) → RLS adoption guidance does not apply; keep query, index, and
   transaction design sections.
2. `postgres-patterns`: raw SQL DDL and index examples → DDL only via entity
   decorators and instance commands → examples treated as illustrative only.
3. `database-migrations`: ORM-generic CLI commands (Prisma, Drizzle, Kysely,
   and similar) → TypeORM instance commands per
   [packages/twenty-server/docs/UPGRADE_COMMANDS.md](packages/twenty-server/docs/UPGRADE_COMMANDS.md)
   → use safety principles only (expand-contract, reversibility,
   zero-downtime); generic command examples do not apply.
4. `database-migrations`: raw `ALTER TABLE` / `CREATE INDEX` DDL →
   metadata-generated schema, instance-command-only DDL → illustrative only;
   never hand-write DDL; never rewrite committed up/down logic — append only.
5. `react-patterns`: Next.js App Router, React Server Components, server
   actions → Vite SPA → RSC and server-action sections do not apply.
6. `react-patterns`: state-management decision trees (Zustand, Redux, and
   similar) → Jotai + Apollo Client per
   [docs/standards/react-standard.md](docs/standards/react-standard.md) and
   `.cursor/rules/react-state-management.mdc` → defer to repository
   conventions.
7. `security-review`: npm tooling (`npm ci`) → yarn 4 only; npm disabled in
   `package.json` → yarn-only note added in precedence block.
8. `security-review`: REST and Express examples → GraphQL-first API surfaces →
   apply the checklist to GraphQL resolvers, mutations, and permission guards.
9. `agentic-engineering`: Claude model-tier names (Haiku/Sonnet/Opus) →
   harness-agnostic repository → treat tier names as illustrative;
   cost-discipline and eval-first principles remain valid.

## Not Installed

ECC cross-references to components outside the six skills (for example, the
`database-reviewer` agent referenced by `postgres-patterns`) and all ECC
hooks, agents, commands, rules, memory, and MCP configuration are intentionally
absent from this checkout.

## Ownership

- OpenSpec = specification/control plane.
- licitAI native skills = orchestration (`prime-*`, `openspec-*`,
  `opsx-spec-workflow`, `execute`, `tdd`, `code-review`).
- ECC skills = specialized engineering guidance, loaded contextually per task.
  They do not plan, orchestrate, or replace any native skill.
