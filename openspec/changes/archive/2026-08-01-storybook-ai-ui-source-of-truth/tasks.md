## 0. Investigation and Scope Lock

- [x] 0.1 Re-read the product design index, token governance, `twenty-ui` guidance, and primary Storybook configuration.
Traceability: closes the ownership and authority gap before any AI-facing guidance is authored.
Notes: Confirmed DTCG product tokens, `twenty-ui` Storybook, scoped `twenty-front` Storybook, and the SDK runtime import boundary.
- [x] 0.2 Re-read the `develop-app` skill and runtime, layout, and visual references.
Traceability: prevents the new Storybook adapter from duplicating or collapsing runtime, layout, and visual responsibilities.
Notes: Preserved runtime, layout, and visual guidance as independent plugin references.
- [x] 0.3 Assess `TWENTY_DESIGN_SYSTEM_AI_LAYER.md` against local sources and record adopted, adapted, and excluded guidance without copying it as authority.
Traceability: prevents upstream assumptions, proposed registries, and stale paths from becoming local contracts.
Notes: Recorded the assessment in the proposal, design contract, and external-reference scope.
- [x] 0.4 Classify the Mercado Público current and archived documentation routes in a change-local assessment without rewriting historical artifacts.
Traceability: keeps AI context current-state-first while retaining historical provenance.
Notes: Added `historical-documentation-assessment.md`; no archive was modified.

## 1. Contract Alignment

- [x] 1.1 Align proposal, design, and delta specification with the external-reference assessment and validator-derived atlas decision.
Traceability: makes scope, design, requirements, and implementation work describe the same source-of-truth model.
Notes: Added assessed-reference and source-derived atlas requirements without introducing a registry.

## 2. Implementation

### Durable Product Design Contract

- [x] 2.1 Add `docs/design/storybook-ui-source-of-truth.md` defining Storybook, `twenty-ui`, the canonical token source, external-reference limits, and the validator-derived capability atlas.
Traceability: implements the human-facing contract in the owning design-document seam without changing runtime behavior.
Notes: Added the durable product UI source-of-truth contract.
- [x] 2.2 Link the new contract from `docs/design/index.md` and preserve the product-versus-marketing register routing.
Traceability: makes the durable contract discoverable from the canonical design entrypoint and prevents register confusion.
Notes: Linked from the design index; the existing register routing remains unchanged.

### AI Layer Adapter

- [x] 2.3 Add `packages/twenty-codex-plugin/references/design/storybook-ui-generation.md` with the concise AI preflight, context order, component-selection algorithm, token-first rules, story traceability fields, and validation checklist.
Traceability: creates the AI-facing Adapter over the durable design contract and executable Storybook seam.
Notes: Added the concise adapter with no-registry and no-assumed-MCP boundaries.
- [x] 2.4 Update `packages/twenty-codex-plugin/skills/develop-app/SKILL.md` to route product UI/front-component work through `storybook-ui-generation.md` while retaining the existing `front-components.md`, `layout.md`, and `front-component-ui.md` responsibilities.
Traceability: places the new Interface at the highest existing agent-routing Seam.
Notes: Added the route while preserving the exact existing runtime/layout/visual guidance sentence.

### Plugin Contract Validation

- [x] 2.5 Add the new reference to the plugin's required reference inventory and add a source-link/routing validator for the Storybook AI contract, configured Storybook seams, product token source, and no-registry/MCP boundary.
Traceability: makes a disconnected or missing AI context fail at the existing plugin validation seam.
Notes: Added `assertStorybookUiGenerationGuidance` to the existing validator and validation entrypoint.
- [x] 2.6 Add or update validator unit coverage proving the Storybook reference exists, is linked from `develop-app`, points to the durable design contract, preserves the visual/runtime/layout guidance split, and fails when the route or durable link is disconnected.
Traceability: locks the documentation contract at the highest test Seam without introducing a second validation framework.
Notes: Added passing smoke coverage and route/durable-link negative cases.

## 3. Verification

- [x] 3.1 Run `yarn workspace twenty-codex-plugin validate` and `yarn workspace twenty-codex-plugin test`.
Traceability: proves the published AI adapter package remains structurally valid and its contract tests pass.
Notes: Both commands passed; the test suite reported 34 passing tests.
- [x] 3.2 Walk the final context path as an AI agent and verify that it reaches relevant Storybook stories, exports, token sources, runtime import rules, and validation commands without a duplicate catalog or assumed Storybook MCP.
Traceability: proves the user-facing objective—UI generation starts from Storybook and the canonical token system.
Notes: Confirmed the path from `develop-app` to the durable contract, configuration, token source, and existing runtime guidance.
- [x] 3.3 Re-read the changed documents for contradictions, stale Storybook claims, raw token duplication, marketing/product register mixing, and instructions that silently bypass existing gates.
Traceability: closes the documentation coherence risk that motivated the change.
Notes: No duplicate catalog, token values, infrastructure changes, or marketing-register routing were introduced.

## 4. Release Hygiene and Closeout

- [x] 4.1 Run `openspec validate storybook-ai-ui-source-of-truth` and confirm the change remains valid after implementation.
Traceability: provides final artifact-level proof that proposal, design, spec, and tasks remain aligned.
Notes: Passed after all artifacts and task evidence were updated.
- [x] 4.2 Update plugin release notes only if the implementation is subsequently shipped in a versioned plugin release; do not bump version or publish as part of this proposal.
Traceability: keeps release bookkeeping separate from proposal authoring and preserves the explicit implementation boundary.
Notes: Not applicable; no version bump or publication was requested.

## Execution Order

### Slice 1 — Durable source contract

- Tasks: `0.1 -> 0.2 -> 0.3 -> 0.4 -> 1.1 -> 2.1 -> 2.2`
- Checkpoint: the canonical design index leads to a non-duplicating Storybook source-of-truth document.
- Blocks: Slice 2

### Slice 2 — AI adapter and routing

- Tasks: `2.3 -> 2.4`
- Checkpoint: `develop-app` routes product UI generation through the AI Storybook reference and retains existing guidance boundaries.
- Blocked by: Slice 1
- Blocks: Slice 3

### Slice 3 — Validation and handoff

- Tasks: `2.5 -> 2.6 -> 3.1 -> 3.2 -> 3.3 -> 4.1 -> 4.2`
- Checkpoint: plugin validation passes and an agent can follow the documented path from UI request to Storybook evidence and token source.
- Blocked by: Slice 2
- Blocks: None
