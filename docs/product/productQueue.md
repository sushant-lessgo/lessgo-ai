# Product Queue

Ordered build queue — the single source of truth for WHAT comes next. **Only spec files enter this queue.** Queue number = build order. Agreed-but-unspecced directions live in `productBacklog.md` and enter here once their spec is written. Shipped items are removed (history in git + `docs/task/completed/`).

Updated: 2026-07-12

| # | Feature | Spec file | Status |
|---|---------|-----------|--------|
| 0 | **Editor track — world-class editing** (founder ruling 2026-07-11: priority #1): trust → truth → shell+primitives → store finish → scale §5/§6 UI surface | `docs/tracks/editorPlan.md` | phases 0–3 merged; **phase 4 (store finish) IN PROGRESS** (`feature/editor-phase-4-store-finish`) |
| 1 | Atelier — work-engine template (Kundius) via template-factory pipeline | `docs/task/atelier-template.spec.md` | in progress (`feature/atelier-template`, phase 9a/9b) |
| 2 | Content baseline split — stop shipping `content.baseline` (~2× payload) to editor; server-side reference only | `docs/task/content-baseline-split.spec.md` | queued (pairs with editor phase 4 — same save-path files) |
| 3 | Research brief — premium research-backed path: agentic Claude VoC + competitor research → editable Brief → generation | `docs/task/research-brief.spec.md` | queued — HELD until atelier lands (generation-path conflict) |
| 4 | Universe v1 — variant fan-out (message-match / SEO keyword / audience), shared-edit propagation, universe view + per-variant analytics | `docs/tracks/universePlan.md` → universe-01… (spec required before /feature) | reserved, awaiting spec (**needs editorPlan phase 4 ops**) |
| 5 | Campaign/offer pages — time-bound promo variants (universe v2) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 6 | A/B testing — split traffic between variants (universe v3) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |

Shipped 2026-07-11→12 (removed from queue): template-factory, tracking-pixels, app-subdomain, data-capture, pricing-v2, social-posts + email-sequences + cold-outreach (dark; un-flag work tracked in backlog).

## App-UI beta readiness (added 2026-07-12)

From `docs/reports/app-ui-ux-assessment.md` (live signup→publish audit). Whole report carved into the specs below. **Most contain public-beta blockers → prioritize the P0s before beta-public; exact interleave with #0–#6 = orchestrator's call.** Independent of each other except where noted.

| Feature | Spec file | Beta-blocker? | Notes |
|---------|-----------|---------------|-------|
| App entry — signed-out landing on app subdomain + resolve `/sign-in` `/sign-up` + branded 404 | `docs/task/app-entry.spec.md` | **Yes (P0)** | builds on shipped app-subdomain |
| Dashboard lifecycle — own-projects/kill orphan badge + delete + **unpublish** + real URL (+ rename/dup/search) | `docs/task/dashboard-lifecycle.spec.md` | **Yes (P0)** | unpublish = new capability; authz + publish-teardown gates |
| Onboarding fixes — style-step stub + offer/proof seeds + goal skip + togglable sections | `docs/task/onboarding-fixes.spec.md` | Partial (style-step P0-ish, rest P1) | reuse editor Style controls |
| Publish UX — modal defaults (slug/title from business, analytics ON) + custom-domain explainer + preflight | `docs/task/publish-ux.spec.md` | **Yes (P0.3)** | preflight detects; content fixes live in hygiene spec |
| Published-output hygiene — SEO HTML-strip + footer year/empty-columns/dead-links + brand/date | `docs/task/published-output-hygiene.spec.md` | **Yes (P0.4/P0.5)** | dual-renderer; rebuild to verify. Terminal-mock OUT → backlog #27 |
| In-app plan/credits surface — counter + costs + plan display + block-with-upgrade message | `docs/task/plan-credits-surface.spec.md` | **Yes (P0.7)** | depends on shipped pricing-v2 |
| Editor chrome — kill debug chips + human rail labels + styled add-page/social modals + toolbar overlap | `docs/task/editor-chrome.spec.md` | No (P1 polish) | coordinate w/ editor track (#0) |

Terminal-mock hero filler → `productBacklog.md` #27 (template-content work, out of app-UI scope).

## Rules
- Only spec files (`docs/task/*.spec.md` or a track's numbered specs) get a queue number.
- New idea → `productBacklog.md`; agreed direction → `/discuss` → spec → enters queue.
- Reordering = edit this file in a discussion, never implicitly.
- Item reaches #1 → run `/feature <spec>`.
