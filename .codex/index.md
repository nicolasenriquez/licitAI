# Codex Index

## Purpose

Use this index to route repo-local Codex work inside `.codex/`.

## Surface Layout

| Path | Role |
| --- | --- |
| `.codex/commands/` | Native Codex command docs and workflows |
| `.codex/skills/` | Retired legacy location; canonical skills live in `.agents/skills/` |

## Routing Rule

- Stay in `.codex/` for native repo-local Codex commands and adapters.
- Route canonical skill changes through `.agents/`.
- Bounce back through root `index.md` when the task is really about the
  published plugin package, durable repository docs, OpenSpec change artifacts,
  or general package routing.
