---
type: readme
title: "Codex Commands"
description: "Index for native repo-local Codex commands."
okf_version: "0.1"
---

# Commands

Native Codex command documentation lives in this directory. Portable skills
live only in `.agents/skills/`.

## Command files

- `commit-local.md`
- `create-prd.md`
- `execute.md`
- `implementation-summary.md`
- `prime.md`
- `zoom-out.md`
- the `openspec-*.md` command entrypoints

## Skill routing

When a command needs a skill, load the canonical skill from
`.agents/skills/<name>/SKILL.md`. Do not add a second copy under `.codex`.
