# Product Queue

Ordered build queue — the single source of truth for WHAT comes next. **Only spec files enter this queue.** Queue number = build order. Agreed-but-unspecced directions live in `productBacklog.md` and enter here once their spec is written. Shipped items are removed (history in git + `docs/task/completed/`).

Updated: 2026-07-14

| # | Feature | Spec file | Status |
|---|---------|-----------|--------|
| 0 | **Editor track — world-class editing** (founder ruling 2026-07-11: priority #1): trust → truth → shell+primitives → store finish → scale §5/§6 UI surface | `docs/tracks/editorPlan.md` | phase 4 (store finish): Step B done + SEO-modal fix verified; **awaiting founder Gate-B sign-off** → phases 12–13 → merge |
| 1 | Content baseline split — stop shipping `content.baseline` (~2× payload) to editor; server-side reference only | `docs/task/content-baseline-split.spec.md` | queued (pairs with editor phase 4 — same save-path files) |


Shipped 2026-07-11→12 (removed from queue): atelier-template, template-factory, tracking-pixels, app-subdomain, data-capture, pricing-v2, social-posts + email-sequences + cold-outreach (dark; un-flag work tracked in backlog). Shipped 2026-07-14: published-output-hygiene, onboarding-fixes, app-entry.

## App-UI beta readiness — ⏸️ ON HOLD (founder ruling 2026-07-14: bigger UI reimagine coming; don't polish surfaces that will be redesigned)

From `docs/reports/app-ui-ux-assessment.md`. Shipped before the hold: app-entry, onboarding-fixes, published-output-hygiene (rows removed). Remaining specs stay written but DO NOT enter the queue until the UI-reimagine direction lands; revisit P0 claims then.

| Feature | Spec file | Was | Notes |
|---------|-----------|-----|-------|
| Dashboard lifecycle — own-projects/kill orphan badge + delete + **unpublish** + real URL (+ rename/dup/search) | `docs/task/dashboard-lifecycle.spec.md` | P0 | unpublish capability (authz + publish-teardown gates) may survive reimagine as backend work |
| Publish UX — modal defaults + custom-domain explainer + preflight | `docs/task/publish-ux.spec.md` | P0.3 | |
| In-app plan/credits surface — counter + costs + plan display + upgrade block | `docs/task/plan-credits-surface.spec.md` | P0.7 | depends on shipped pricing-v2 |
| Editor chrome — kill debug chips + rail labels + styled modals + toolbar overlap | `docs/task/editor-chrome.spec.md` | P1 | coordinate w/ editor track (#0) |

Terminal-mock hero filler → `productBacklog.md` #27 (template-content work, out of app-UI scope).

## Rules
- Only spec files (`docs/task/*.spec.md` or a track's numbered specs) get a queue number.
- New idea → `productBacklog.md`; agreed direction → `/discuss` → spec → enters queue.
- Reordering = edit this file in a discussion, never implicitly.
- Item reaches #1 → run `/feature <spec>`.
