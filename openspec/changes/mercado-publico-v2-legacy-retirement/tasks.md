## 0. Investigation and Scope Lock

- [ ] 0.1 Verify the completed G4 Issue 31 release record explicitly approves G5;
  otherwise stop with no deletion. Verify that it identifies the immutable G4
  release tag used for G5 rollback.
  Traceability: Group G5; Slice S1; Issue 32; Scope external G4 authorization.

- [ ] 0.2 Create a versioned candidate manifest that maps each proposed legacy
  route, import, GraphQL operation, provider, job, CLI, test, story, fixture,
  style, and prototype to its owner, accepted V2 replacement, consumers, and
  rollback constraint in `retirement-evidence.md`.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.1.

- [ ] 0.3 Classify committed migrations and `mp` evidence as retained, and stop
  any batch that needs to edit, delete, or transform either. Classify shared
  services that V2 still consumes as retained; remove only their unused V1/CSV
  branches.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.2, AC 34.3.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add candidate-specific failing zero-consumer tests for selected
  displaced UI, routes, and GraphQL operations before their source removal.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.2, AC 32.4.

- [ ] 1.2 Add failing ownership checks for selected stories, fixtures, styles,
  and prototypes that distinguish displaced local assets from shared Twenty
  primitives, tokens, and patterns.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.1, AC 33.2, AC 33.3.

- [ ] 1.3 Add failing registration/consumer checks for each selected V1/CSV
  driver, service, job, scheduler, CLI, resolver, and persistence test before
  removal.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.4.

## 2. Implementation

### Slice 1 — UI and GraphQL consumer contraction

- [ ] 2.1 Remove only manifest-approved displaced UI routes, imports, and
  internal GraphQL consumers. Remove the G4 legacy route and dependency closure
  only after its approved release tag is verified; retain every unproven
  candidate.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.2, AC 32.5.

- [ ] 2.2 Regenerate derived GraphQL artifacts from retained source and remove
  no generated file by hand. Record post-removal graph/search evidence for each
  candidate.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.3, AC 32.4.

### Slice 2 — Visual artifact contraction

- [ ] 2.3 Migrate only still-useful stable story or fixture evidence, then
  remove manifest-approved displaced prototypes, stories, styles, and visual
  assets without removing shared Twenty primitives, tokens, or patterns.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.2, AC 33.3.

- [ ] 2.4 Record retained historical evidence and removed visual artifacts in
  the candidate manifest and post-removal diff summary.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.1, AC 33.5.

### Slice 3 — V1/CSV runtime contraction

- [ ] 2.5 Remove only manifest-approved V1/CSV provider registrations, drivers,
  services, jobs, scheduler entries, CLI paths, GraphQL consumers, and their
  now-orphaned tests. Retain each shared service that V2 still consumes. Do not
  alter committed migrations or V2 evidence.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.2, AC 34.3.

- [ ] 2.6 Document the remaining operational rollback and data-recovery path;
  stop if it depends on a removed component.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.5.

### Slice 4 — Reconstruction certification

- [ ] 2.7 Produce the final zero-consumer evidence record that links the
  manifest, graph/search results, tests, codegen, authenticated smoke, visual
  review, G4 approval, PRD, source issues, and prior OpenSpec evidence.
  Record it in `retirement-evidence.md` and leave human approval pending.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.1, AC 35.4, AC 35.5, AC 35.6.

## 3. Verification

- [ ] 3.1 For Slice 1, run focused frontend/server tests, GraphQL codegen and
  compatibility checks, lint, typecheck, authenticated smoke, and post-removal
  graph/search proof.
  Traceability: Group G5; Slice S1; Issue 32; Acceptance AC 32.3, AC 32.4.

- [ ] 3.2 For Slice 2, run focused visual, accessibility, and authenticated
  smoke checks; preserve reviewed screenshots and prove retained fixtures still
  serve their evidence purpose.
  Traceability: Group G5; Slice S2; Issue 33; Acceptance AC 33.3, AC 33.4, AC 33.5.

- [ ] 3.3 For Slice 3, run scheduler, CLI, API, persistence, integration, and
  authenticated smoke checks without V1/CSV consumers; prove retained rollback
  documentation is executable.
  Traceability: Group G5; Slice S3; Issue 34; Acceptance AC 34.1, AC 34.4, AC 34.5.

- [ ] 3.4 Run the complete local harness after all removals. Confirm zero
  displaced consumers with graph/search, GraphQL/codegen compatibility, tests,
  smoke, and reviewed visual evidence.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.1, AC 35.2, AC 35.3.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update only verified operator and developer documentation with the
  retained rollback/recovery procedure, removed scope, and evidence locations.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.4.

- [ ] 4.2 Preserve links to the PRD, source issues, G4 release record, and
  previous OpenSpec evidence. Mark a prior change `superseded` only with the
  required human approval. Record the final human approval in
  `retirement-evidence.md` before certification completes.
  Traceability: Group G5; Slice S4; Issue 35; Acceptance AC 35.5, AC 35.6.

- [ ] 4.3 Run `openspec validate mercado-publico-v2-legacy-retirement` and
  verify that all removed candidates, retained evidence, and G4 precondition are
  explicit and aligned.
  Traceability: Group G5; Slice S4; Issue 35; Scope final artifact validation.

## Execution Order

### Slice 1 — UI and GraphQL consumer contraction
- Tasks: `0.1 -> 0.2 -> 0.3 -> 1.1 -> 2.1 -> 2.2 -> 3.1`
- Checkpoint: each removed route or GraphQL consumer has a V2 replacement and
  post-removal zero-consumer proof while the G4 rollback path remains viable.
- Blocks: Slice 2.

### Slice 2 — Visual artifact contraction
- Tasks: `1.2 -> 2.3 -> 2.4 -> 3.2`
- Checkpoint: displaced visual assets are removed, useful evidence is retained,
  and visual/a11y/authenticated proof is green.
- Blocked by: Slice 1.
- Blocks: Slice 3.

### Slice 3 — V1/CSV runtime contraction
- Tasks: `1.3 -> 2.5 -> 2.6 -> 3.3`
- Checkpoint: no active V1/CSV registration or consumer remains and rollback,
  recovery, migrations, and V2 evidence remain intact.
- Blocked by: Slice 2.
- Blocks: Slice 4.

### Slice 4 — Reconstruction certification
- Tasks: `2.7 -> 3.4 -> 4.1 -> 4.2 -> 4.3`
- Checkpoint: the complete local harness and final zero-consumer certification
  record pass without promoting a historical artifact to active authority.
- Blocked by: Slice 3.
- Blocks: None.
