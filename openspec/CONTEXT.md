# OpenSpec Context

## Purpose

Describe the role of `openspec/` in this repository during the workspace routing pilot.

## What Lives Here

- `changes/` contains active change work.
- `changes/<change>/proposal.md` explains what and why.
- `changes/<change>/design.md` explains how the change should work.
- `changes/<change>/tasks.md` tracks implementation and validation steps.
- `changes/<change>/specs/<capability>/spec.md` captures explicit requirements and scenarios.
- Change-local validation artifacts may live beside those files when the change needs manual acceptance evidence.
- `specs/` is reserved for accepted or synced spec surfaces and may be sparse while work is still change-local.

## How To Read This Surface

For an active change, prefer this order:

1. `proposal.md`
2. `specs/.../spec.md`
3. `design.md`
4. `tasks.md`
5. Any change-local validation artifact such as a manual acceptance document

## Scope Boundary

This surface is for change definitions and change-driven execution context.

It is not the durable home for:

- architecture baseline docs
- governance rules
- business operating context
- ADRs
- general package implementation guidance unrelated to an active change

If the prompt is about those topics, go back to `../CONTEXT-MAP.md` and reroute.
