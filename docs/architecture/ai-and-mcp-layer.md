---
type: architecture
title: "AI and MCP Layer"
description: "Current product AI execution and MCP authorization boundaries."
okf_version: "0.1"
---

# AI and MCP Layer

## Purpose

Describe the AI execution and Model Context Protocol (MCP) surfaces that exist
in the product today. This is a current-state document: it distinguishes the
product runtime from developer tooling and does not imply that every optional
AI capability is configured in local Docker Compose.

## Scope

This document covers product AI modules in `packages/twenty-server`, the
frontend AI surfaces, the authenticated `/mcp` endpoint, and the published
Codex plugin boundary. Local provider and code-interpreter configuration lives
in `docs/operations/ai-runtime-configuration.md`.

## Product AI Execution

```mermaid
flowchart LR
    User[User or workflow] --> Frontend[AI frontend surfaces]
    Frontend --> API[GraphQL and metadata API]
    API --> Executor[AiAgentExecution]
    Executor --> Billing[Credits and usage]
    Executor --> Models[Model registry and provider config]
    Executor --> Roles[Agent role and permissions]
    Executor --> Tools[Tool Provider]
    Models --> Provider[Configured LLM provider]
    Executor --> Metrics[Metrics and telemetry]
    MCPClient[MCP client] --> MCP[/mcp]
    MCP --> Auth[Authentication and workspace authorization]
    Auth --> Skills[Workspace skills and tools]
```

`AiAgentExecution` validates credits and model availability, resolves the model
and permitted tools, invokes text generation, and records usage and telemetry.
The model registry and provider configuration are separate from agent roles;
roles and permissions constrain the tools made available to an execution.

The implementation includes agent, execution, monitor, role, billing, chat,
text-generation, model, and workspace-stat modules. The frontend includes chat
threads, streamed responses, model selection, tool presentation, and code
execution presentation.

## Provider Configuration Boundary

Provider configuration resolves approved templates from the committed provider
catalog and obtains credentials from registered configuration or environment
variables. This prevents arbitrary user-defined configuration from becoming a
provider variable source. Available providers and credentials still depend on
the deployment environment; see the operations guide for the local Compose
limitation.

## Code Interpreter Boundary

The code interpreter has `DISABLED`, `LOCAL`, and `E2B` drivers. `LOCAL` is a
development-only driver. The Docker runtime image runs with
`NODE_ENV=production`, so it does not enable the local driver. Remote execution
requires explicit E2B configuration and credentials; it is not active merely
because the image or UI contains code-interpreter support.

## MCP Runtime Boundary

`/mcp` is an authenticated product endpoint. Its request path applies MCP
authentication, workspace authorization, and permission checks before listing
or executing workspace-scoped skills and tools. Tool capabilities can include
actions; callers must not assume the endpoint is a read-only PostgreSQL
introspection service.

The root `.mcp.json` file is different: it configures local developer clients
such as PostgreSQL, Playwright, and Context7. It is not the configuration or
security policy for `/mcp`.

## Codex Plugin Boundary

`packages/twenty-codex-plugin` packages skills and a public documentation MCP
connection. Workspace-specific data access is configured per user through its
local helper and OAuth flow; the package does not embed workspace-specific MCP
URLs or credentials.

## Operational Invariants

- Provider keys and E2B credentials are secrets and must not be committed.
- AI tool availability is constrained by workspace authorization and agent
  roles; new tools require a permissions review.
- Developer MCP configuration and product MCP runtime configuration are
  separate trust boundaries.
- A configured UI capability does not prove that the corresponding provider or
  sandbox capability is enabled in the deployment.

## Related Documents

- `current-state.md` — repository architecture baseline.
- `reference-architecture.md` — API and engine topology.
- `../operations/ai-runtime-configuration.md` — local runtime capability and
  configuration guide.
- `../governance/ai-assisted-delivery.md` — governance for agents developing
  the repository.
