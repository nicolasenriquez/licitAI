---
type: qa-baseline
title: CRM Dossier Playwright Baseline
description: Read-only end-to-end baseline for the seeded CRM demonstration workspace.
---

# CRM Dossier Playwright Baseline

## Purpose

This baseline records the expected read-only behaviour of the seeded Apple
workspace. It gives QA, engineers, AI agents, and product users one repeatable
flow for the CRM demonstration data.

Use the local development user Tim only in the disposable local environment.

## User story

As a CRM user, I can open each core workspace, inspect seeded records, scroll
the table, and open a record. I can then see its fields and related records in
the correct detail surface.

As a CRM user, I can open each default dashboard and inspect its published
widgets without changing its layout or data.

## Observed local data

The data below was observed on 2026-08-12. Counts are evidence, not fixed
assertions. The automated baseline only requires that each object contains at
least one record.

| Surface | Observed state | Detail behaviour |
| --- | --- | --- |
| Companies | 599 records. The table includes name, domain, creator, owner, creation date, LinkedIn, and address. | Selecting a company opens the side panel. It shows fields and linked people. |
| People | Seeded records are visible in the table. | Selecting a person opens the side panel. |
| Opportunities | 150 records. The table shows amount and close date. | The side panel shows amount, stage, close date, company, point of contact, and owner. |
| Tasks | 1,800 records. The table shows title, status, relations, and creator. | The side panel shows due date, status, assignee, body, and relations. |
| Notes | 1,800 records. The table shows title, relation, body, and creator. | The side panel shows the note body and related record. |
| Dashboards | Three records: Sales Overview, Customer Insights, and Team & Activity. | A dashboard opens as a full record page with Overview and Details tabs. It does not open in the side panel. |

## Automated flow

`packages/twenty-e2e-testing/tests/crm-dossier-baseline.spec.ts` performs the
following non-destructive flow for Companies, People, Opportunities, Tasks,
and Notes:

1. Open the object view.
2. Confirm that the object view title is visible.
3. Confirm that at least one record link is visible.
4. Open the first record and confirm the expected populated detail labels.
5. Close the panel with the button, then open it again and close it with Escape.
6. Scroll the table and confirm that its scroll position changes.
7. Capture the open detail panel and the scrolled table.

For each dashboard, the test opens the Dashboards object, selects the named
dashboard, confirms the full record URL, a named widget, and the `Edit
Dashboard` action, then captures the page.

The test does not click create, edit, delete, favourite, filter, sort, or
options actions. Those actions can change local state. Test them in a separate
mutation suite against a fresh disposable seed.

## Run the baseline

From `packages/twenty-e2e-testing`:

```powershell
yarn playwright test tests/crm-dossier-baseline.spec.ts --project=chrome
```

The login setup runs first and stores local browser state in the ignored
`.auth/user.json` file. Screenshots are attached to each test result under
`run_results/`. They are runtime evidence and are not committed. They are not
pixel-comparison baselines because the seed data, dates, and charts can vary.

## Acceptance criteria

- Each core object view loads with at least one seeded record.
- A record opens the expected populated side panel for Companies, People,
  Opportunities, Tasks, and Notes, and it closes with both the button and
  Escape.
- The record table changes its scroll position after a vertical scroll.
- Opportunities expose a monetary amount and relation fields in the observed
  baseline data.
- Tasks and notes expose their populated activity content in their detail
  panels.
- Sales Overview, Customer Insights, and Team & Activity are reachable from
  Dashboards, render as dashboard record pages, and show a named widget.
