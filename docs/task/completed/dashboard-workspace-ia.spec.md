---
tier: full
tier-why: token-spined URL restructure re-homing every per-project surface (>15 files) + auth-check (`assertProjectOwner`) preservation on each moved route — getting nav/authz wrong breaks the whole dashboard. Structurally cosmetic but high blast radius.
---

# dashboard-workspace-ia — spec  (Dashboard redesign · Slice 1 of N)

## Problem / why
Today `/dashboard` is a flat project list; per-project surfaces are flat sibling routes
keyed inconsistently — `[slug]` (analytics/forms/blog, only exist post-publish) vs `[token]`
(emails/outreach/social). The designer handoff (`Lessgo Dashboard.dc.html`) reorganizes the
whole workspace into an account-level shell + per-project "site is a place" workspace. This
slice builds the **IA spine** everything else in the dashboard redesign hangs off.

Part of the **risk-cut split** of `dashboard-redesign` (see `uiRedesignPlan.md` triage):
S1 = cosmetic/structural spine (this doc) · S2 = lifecycle actions (risky backend) ·
S3 = billing first-UI · S4 = cross-site rollups + leads inbox + AI reply · later = Grow
(gated), notifications, profile/account reskin, blog first-run/AI-write, Overview KPIs.

## Goal
Ship the redesigned navigation shell + projects grid + a token-spined project workspace,
**re-homing existing per-project surfaces as-is** (moved + wrapped in the new chrome, interiors
NOT reskinned yet). Proves the "site = a place" IA. No new backend, no destructive actions,
no net-new data surfaces.

**Completeness principle (same as editor-shell "full skin + grey-out"):** the **main dashboard
screen** — persistent sidebar + top bar + projects grid — must look 100% complete and
final-design on arrival. Any control whose **behavior or route does not exist yet** renders
**greyed/disabled in place** — NOT as a clickable "coming soon" placeholder page. Later slices
just enable what's greyed. This applies to the main dashboard screen and the workspace chrome;
whole separate later-lane screens (billing, rollups, inbox, Grow) are still built in final
design in their own slice (never build-ugly-then-reskin), not stubbed here.

## Approach (decided)
- **Real URL restructure, token-spined.** Per-project surfaces move under
  `/dashboard/[token]/{overview,analytics,leads,blog,testimonials}`. Token is the single
  workspace key (stable from project creation, pre-publish). Published-only surfaces
  (analytics) show a locked/empty state before publish. Old slug/token URLs get redirects.
- **Two nav levels** per handoff: account-level persistent sidebar + top bar (global);
  per-project tabs inside a project workspace.

## Scope IN
- **Account sidebar** (persistent, handoff STEP 2): `New site with AI` primary CTA;
  **WORKSPACE** group → Projects, All Analytics, All Leads; **ACCOUNT** group → Billing & plan,
  Domains; bottom → plan widget (`Starter · N of M sites · Upgrade`) + profile/avatar.
  - **Grey-out by existence** (completeness principle):
    - **Greyed/disabled in place** (route/behavior not built yet): `All Analytics`,
      `All Leads` (= S4); `Upgrade`/plan-widget action if its route isn't built.
    - **Enabled**: `Projects`, `New site with AI`, `Billing & plan`, `Domains` — link to the
      **existing** pages as-is (reskinned in their own later slices; old-styled behind the
      click is fine — the main screen stays complete).
- **Top bar**: logo (→ dashboard), breadcrumb (in project workspace), avatar (→ existing
  account/settings, enabled). **Bell/notifications = greyed/disabled** shell (panel is a
  later slice).
- **Projects grid** (handoff 1b/1d look): card grid replacing the flat row list; adaptive
  **empty state** (1a — centered AI prompt: describe or paste URL) when no projects.
  - **••• card menu shell**: `Open editor` + `Visit` active; `Rename` / `Duplicate` /
    `Delete` present but **greyed/disabled** (wired in S2).
  - Preserve existing **admin god-view** (all projects + owner email) behavior.
- **Project workspace** (open a card → `/dashboard/[token]`): breadcrumb + tab bar
  (Overview, Analytics, Leads, Blog, Testimonials). **Overview (3a)** = simple landing
  (breadcrumb + tabs + minimal quick actions/links); KPIs deferred.
- **Re-route existing surfaces AS-IS** into the tabs: current analytics/forms(leads)/blog/
  testimonials page *content* moves under `/dashboard/[token]/*`, wrapped in new chrome, not
  reskinned. Add redirects from old URLs.
- Built on `ui-foundation` tokens/primitives.

## Scope OUT (non-goals)
- **No destructive lifecycle** (rename/duplicate/delete/unpublish backend) — S2, full tier.
- **No billing/plan/credits UI** build — S3 (link to existing billing page for now).
- **No cross-site rollups** (All Analytics, All Leads inbox) or **AI reply-draft** — S4.
- **No Grow hub** — later, gated slice (must respect social/email/outreach kill-switches).
- **No** notifications panel, profile popover (2e), account-settings reskin (2f), blog
  first-run/manager/AI-write reskin (3b–3d), Overview KPIs, or interior reskins.
- No reskin of the moved surfaces' interiors (analytics/forms/blog/testimonials look
  unchanged inside their new tab wrapper).
- No responsive/mobile pass (desktop-first).

## Constraints
- Depends on **`ui-foundation` merged first**.
- **Authz is not the URL.** A token in the path is a routing key, NOT an auth boundary
  (see authz memory: token-only access was a bypass, patched with `assertProjectOwner`).
  Every re-homed route/page MUST keep or gain its `assertProjectOwner` (or equivalent
  ownership) check — the restructure must not widen the existing gap. Admin god-view must
  still bypass correctly.
- Old URLs must redirect (no dead bookmarks): map slug-based analytics/forms/blog +
  token-based routes to the new `/dashboard/[token]/*`.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Dashboard.dc.html`
  — screens 1a–1d (home/grid), 2a–2f (nav/account), 3a–3e (project workspace). Read markup
  for exact sidebar structure, tab bar, card, breadcrumb, spacing/color.
- Handoff README §Dashboard + §State Management (current workspace / current project).
- `src/app/dashboard/page.tsx` — current flat list + admin god-view + smart-name logic to preserve.
- `src/app/dashboard/{analytics/[slug],forms/[slug],blog/[slug],testimonials}/page.tsx` — surfaces to re-home.
- `src/components/dashboard/*` (Header, DashboardHeader, ProjectCard, EmptyState) — existing pieces to replace/adapt.
- `src/app/api/projects/[tokenId]` — token-scoped project route pattern.
- `assertProjectOwner` (authz helper) — the ownership check to apply on every moved route.
- `docs/task/dashboard-lifecycle.spec.md` — held spec = S2 requirements input (not this slice).
- `docs/tracks/uiRedesignPlan.md` — track plan.

## Open exploration questions (feeds scout)
- Where does `assertProjectOwner` live, and which current per-project routes already call it
  vs rely on token-only? (defines re-check work per moved route)
- Current routing seam: analytics/forms/blog keyed by `[slug]` — how do they resolve project
  from slug, and how to re-key to `[token]` (which surfaces need slug→token lookup)?
- How is the slug↔token↔project mapping done; cleanest redirect strategy for old URLs.
- Which `src/components/dashboard/*` survive vs get replaced by the new shell/grid.
- App-subdomain interaction (`app.lessgo.ai`) — does the dashboard route restructure interact
  with the subdomain middleware/cutover?

## Candidate human gates
- **MANDATORY: authz gate.** Before merge, confirm every re-homed per-project route rejects
  a non-owner (and admin god-view still works). Founder QA manual.
- Redirect coverage — confirm old bookmarked URLs still land.

## Acceptance criteria
- [ ] Account sidebar + top bar render per handoff (both nav groups, CTA, plan widget, avatar).
- [ ] Projects grid replaces the flat list; adaptive empty state (1a) when no projects;
      admin god-view preserved.
- [ ] ••• card menu: Open editor / Visit active; Rename/Duplicate/Delete greyed.
- [ ] Opening a card → `/dashboard/[token]` project workspace (breadcrumb + tabs); Overview
      landing renders.
- [ ] Analytics/Leads/Blog/Testimonials reachable as tabs under `/dashboard/[token]/*`, content
      intact (moved, not reskinned).
- [ ] Old URLs redirect to new paths.
- [ ] Every re-homed route enforces ownership (`assertProjectOwner`/equiv); non-owner blocked;
      admin god-view works.
- [ ] Main dashboard screen looks complete + final-design; controls with no route/behavior yet
      (All Analytics, All Leads, bell/notifications) render greyed/disabled in place — no
      clickable placeholder pages.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
This IS the pilot slice of the dashboard redesign — the decision gate for the whole IA.
Sub-phasing for the planner: (1) nav shell + grid + empty state (no routing change), then
(2) project-workspace route restructure + re-home surfaces + redirects + authz re-check.
Gate after (2): the IA is proven → proceed to S2/S3.
