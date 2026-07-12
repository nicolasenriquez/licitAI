---
type: changelog
title: "licitai Changelog"
description: "Repository changelog for licitai."
okf_version: "0.1"
---
# Changelog

This repository is published as `licitai` and inherits the upstream Twenty history below.

All notable changes to Twenty are documented in this file.

The format follows [Semantic Versioning](https://semver.org/) and the
[changelog standard](docs/standards/changelog-standard.md).

## Unreleased

### Added
- Mercado Publico phase-1 ingestion backbone with auditable API and CSV job runs
- Email/calendar timelines derived from object relations (#21684)
- Gmail folder backfill in messaging (#21753)
- Enterprise instance metadata reporting on license validation (#21793)
- Internal endpoint to reissue enterprise keys for self-hosted billing (#21660)
- Workspace logo collection on sign-up creation step (#21723)
- Workflow: auto-layout steps on AI workflow creation via shared tidy-up (#21756)
- Workflow: `update_agent` tool and responseFormat-aware AI Agent step schema (#21755)
- Workflow: expected output schema for runtime-output validation (#21744)
- Workflow: manual-trigger payload and metadata in variable picker (#21692)
- Workflow: workspace member as variable sender for emails (#21582)
- Code interpreter: reuse warm sandbox per conversation (E2B) (#21664)
- Post-call recording ingestion and billing (#21758)
- Billing top-up facilitation in AI chat (#21645)
- Admin panel billing/usage section (#21672)
- Tool execution metrics (#21587)
- AI agent: suggest similar tool names when tool discovery misses (#21654)
- Support variables in file email attachment (#21613)
- Onboarding: prefill invite step with calendar teammates (#21640)
- Users can pick workspace subdomain during sign-up (#21641)
- Recall bot stale reconciliation (#21720)
- Centralized impersonation validation rules (#21717)
- Search input on manual record trigger object select (#21777)
- Server: `isSystemSideEffect` flag and merged side-effect migrations (#21673)
- App logo and name in workflow step side panel header (#21689)
- Partners app: profile picture, derived region and deployment (#21709)
- Website: partner application form rework with required fields and fail-fast (#21802, #21710)
- Website: full-bleed hero/testimonials, nav restructure, OpenNext deploy (#21794)
- Website: footer redesign (#21797)
- Page card box-shadow (#21688)

### Fixed
- Workflow: hide empty option for non-nullable select fields (#21075)
- 2FA crash on production due to react-qr-code default export (#21804)
- View type label casing (#21772)
- Record table drag select position (#21579)
- Removed deprecated `isCustom` from Objects and Fields metadata (#21799)
- Logic function: invoke timeout treated as user-level error, not platform error (#21779)
- AI: prevent chat thread bricking from tool parts with null input (#21752)
- Server: enforce lowercase `universalIdentifier` in sync (#21754)
- AI: handle dynamic-tool message parts in chat persistence (#21740)
- Server: app-defined permission flags referenceable by role in same sync (#21742)
- Front: home redirect honors first object of navigation menu (#21626)
- Front: wait for viewFields and fieldMetadataItems before metadata gate (#21713)
- Route trigger: distinguish user vs platform logic function execution errors (#21715)
- Server: prevent enum migration failure for long identifier names (#21748)
- CLI: detect expired token on deploy and offer interactive re-auth (#21335)
- Messaging: pin Google OAuth2 client to native fetch (#21668)
- Messaging: honor IMAP/SMTP encryption setting (#21562)
- Server: default timeline thread visibility to METADATA (#21669)
- Calendar: exclude non-groupBy date fields from field selection (#21764)
- Impersonation: stop corrupting impersonator's profile name (#21757)
- AI: enforce strict rules for currency value handling (#21470)
- Selectable list: fix arrow focus (#21679)
- Various accessibility fixes across twenty-ui (#21790, #21776)
- Onboarding: show connect step after workspace creation (#21701)
- Flaky Argos diffs stabilized (#21771)
- Side panel command menu header controls (#21747)

### Changed
- Website: README assets, `.well-known`, and env template carried over (#21803)
- Website: i18n translations updated (#21795)
- Website: full rework merged (#21763)
- Scope empty fixture workspaces to upgrade integration tests (#21778)
- Disable Claude Code attribution on commits and PRs (#21798)
- Remove twenty-ui-deprecated and migrate frontend to twenty-ui (#21596)
- Reorganize twenty-ui into per-component domains (#21745)
- Remove twenty-shared import from postcard app (#21786)
- Configure Recall bot server variables (#21774)
- Hide Input and Test tabs for app logic function nodes (#21671)
- Update Connection provider path (#21678)
- Perf: compute onboarding invite suggestions on-demand (#21696)
- Limit on view widget (#21718)
- CI: migrate cross-repo dispatch to `workflow_dispatch` (#21648)
- CI: remove merge queue, run e2e on push to main (#21722)
- Twenty app e2e app prod parity dispatch (#21750)
- Load twenty-ui global styles in twenty-front Storybook (#21665)
- Clean up MCP Monaco editor (#21643)
- Various docs translations and calendar-email page updates (#21741, #21724, #21789, #21746, #21681)

### Security
- Bump http-proxy-middleware to fix multipart field injection
- Bump protobufjs to fix DoS and property shadowing
- Bump piscina to fix prototype pollution leading to RCE
- Bump form-data across lockfiles to fix CRLF injection (GHSA)
- Bump lodash and @types/lodash to resolve vulnerable transitive

## [v2.14.3] - 2026-06-16

Latest release prior to changelog adoption. Prior releases are not retroactively
documented in this first edition.
