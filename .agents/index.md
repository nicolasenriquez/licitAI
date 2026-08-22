# Shared Agent Skills Index

## Purpose

Route all repository-local, harness-agnostic skills through `.agents/skills/`.

## Layout

| Path | Role |
| --- | --- |
| `.agents/skills/<name>/SKILL.md` | Canonical skill instructions |
| `.agents/skills/<name>/references/` | On-demand skill references and harness adapters |
| `.agents/skills/<name>/scripts/` | Skill-owned deterministic helpers |

## Rules

- Keep one canonical directory per skill name.
- Keep `SKILL.md` small enough to load the main path without unnecessary reference material.
- Read references only when the skill's current branch requires them.
- Do not create a second full skill copy under any other harness-specific path.

## Imported ECC Engineering Skills

Six specialized guidance skills were imported from Everything Claude Code
(`affaan-m/ECC`). See `ecc-import.md` for provenance, license, and
compatibility details. Repository conventions always win over imported
guidance.

| Skill | Use When |
| --- | --- |
| `agentic-engineering` | Execution discipline for implementation slices: completion criteria, bounded units, baselines, regression evidence |
| `nestjs-patterns` | NestJS modules, providers, DTO validation, guards, interceptors within Twenty server conventions |
| `postgres-patterns` | Query design, indexing, transaction safety, schema reasoning; tenancy rules per `database-standard.md` |
| `database-migrations` | Migration safety principles only; commands come from Twenty's TypeORM machinery |
| `react-patterns` | React component and hook craft within Twenty frontend conventions (Jotai, Apollo, Linaria, Lingui) |
| `security-review` | Conditional review checklist for external APIs, Mercado Público inputs, auth, secrets, DB writes, GraphQL surfaces |

Load these skills contextually per task. Do not load all six for every task.
They complement — never replace — OpenSpec workflow skills and native licitAI
skills.
