# OpenSpec Index

## Purpose

Use this index to route active OpenSpec change work inside `openspec/`.

## Start Here

1. Read `openspec/AGENTS.md`.
2. Read `openspec/index.md`.
3. Select the active change under `openspec/changes/`.
4. Prefer this artifact order:
   - `proposal.md`
   - `specs/.../spec.md`
   - `design.md`
   - `tasks.md`
   - change-local validation artifacts

## Surface Layout

| Path | Role |
| --- | --- |
| `changes/` | Active change work |
| `changes/<change>/proposal.md` | What and why |
| `changes/<change>/design.md` | How |
| `changes/<change>/tasks.md` | Execution and verification tracking |
| `changes/<change>/specs/.../spec.md` | Explicit requirements and scenarios |
| `changes/archive/` | Archived change history |

## Routing Rule

- Stay in `openspec/` for active change definition or change-driven execution.
- Bounce back through root `index.md` if the task is really durable repo docs or
  general package work outside an active change artifact.
