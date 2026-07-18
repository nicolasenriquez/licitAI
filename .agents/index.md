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
- Do not create a second full skill copy under `.codex/` or `.opencode/`.
