---
type: operations-guide
title: "AI Runtime Configuration"
description: "Local Docker Compose capability matrix and safe AI runtime configuration."
okf_version: "0.1"
---

# AI Runtime Configuration

## Purpose

Describe what the current local Docker Compose stack does and does not enable
for product AI. This guide is operational documentation, not authorization to
add provider keys, sandbox credentials, or new tool capabilities.

## Current Local Compose Capability Matrix

| Capability | Current local Compose state | What is required to enable it safely |
| --- | --- | --- |
| Agent UI, chat, model selection, and tool presentation | Present in the application image | Start a compatible image and configure an authorized workspace. |
| AI provider invocation | Not wired by default | Explicitly inject only the required provider keys into the relevant runtime services through the local `.env`, after an infrastructure change adds an allow-list. |
| Background AI work | Uses the same application image in `worker` | Apply the same approved provider configuration to every service that executes the workload. |
| Local code interpreter | Disabled in the Docker runtime | Not supported with the production-mode image. |
| E2B code interpreter | Not wired by default | Explicit `CODE_INTERPRETER_TYPE=E2B`, `E2B_API_KEY`, a reviewed Compose allow-list, and sandbox cost/security review. |
| Product MCP endpoint `/mcp` | Implemented in the server | Authenticate, select a workspace, and rely on runtime permissions; do not confuse it with root `.mcp.json`. |
| Developer PostgreSQL MCP | Configured by root `.mcp.json` | Local credentials and developer access; this is a separate trust boundary. |

## Current Limitation

`packages/twenty-docker/docker-compose.yml` does not currently pass provider
credentials such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`,
`XAI_API_KEY`, `GROQ_API_KEY`, or `MISTRAL_API_KEY` to `server` or `worker`.
Therefore, starting the default Compose stack alone does not configure an LLM
provider for product AI execution.

Likewise, the Compose file does not pass `CODE_INTERPRETER_TYPE` or
`E2B_API_KEY`. The runtime image sets `NODE_ENV=production`; the local
code-interpreter driver is development-only and is not enabled there.

## Safe Configuration Procedure

1. Decide which product capability is needed: a single provider, background
   agent execution, E2B, or an MCP client flow.
2. Review the affected tools, roles, workspace permissions, cost controls, and
   data boundary before changing infrastructure.
3. Add a narrowly scoped environment allow-list to the services that execute
   the capability. Keep provider keys in `packages/twenty-docker/.env`; never
   commit that file.
4. Add commented, secret-free variable names to `.env.example`, including the
   least-privilege intent and any service scope.
5. Validate Compose rendering with `docker compose ... config --quiet`, then
   exercise the capability in a non-production workspace.
6. Recheck that no credentials appear in version control, rendered logs, or
   shared command output.

## Diagnostics

| Symptom | Likely cause | First check |
| --- | --- | --- |
| Model selection is visible but generation cannot run | No provider credential available to the executing container, or model is not enabled for the workspace | Inspect the approved runtime environment and workspace model availability. |
| Code execution is unavailable in local Docker | Docker image is production mode and no E2B configuration is wired | Confirm `CODE_INTERPRETER_TYPE` and the reviewed E2B environment path. |
| MCP client cannot access a tool | Authentication, workspace context, or permissions rejected the request | Inspect the authenticated product MCP flow rather than `.mcp.json`. |
| Developer MCP behavior differs from `/mcp` | They are distinct endpoints and trust boundaries | Use `.mcp.json` only for developer tooling; use the runtime endpoint documentation for product behavior. |

## Related Documents

- `local-development.md` — complete local Docker Compose runtime.
- `command-surface.md` — canonical start, rebuild, and diagnostic commands.
- `../architecture/ai-and-mcp-layer.md` — architecture and authorization
  boundaries.
- `../governance/ai-assisted-delivery.md` — rules for AI tools used to develop
  the repository.
