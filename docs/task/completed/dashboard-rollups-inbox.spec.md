---
tier: standard
tier-why: new account-level read-only routes aggregating existing PageAnalytics/FormSubmission; no schema change, no LLM/credits, no publish path. Main risk = cross-user data scoping. (Auto-escalates to full if AI reply-draft folds in.)
---

# dashboard-rollups-inbox — spec  (Dashboard redesign · Slice S4a)

## Problem / why
Dashboard S1 shipped the account sidebar with **All Analytics** + **All Leads** nav items
**greyed** (routes didn't exist). The handoff (2a/2b) wants account-level **cross-site rollups**:
one Analytics view across all the user's sites, and one Leads **inbox** across all sites
(master-detail). Today analytics/forms are per-site only (`/dashboard/[token]/…`). This slice
builds the two cross-site views and un-greys the nav.

Part of the dashboard risk-cut (S1 merged · S2 merged · S3 billing-beta specced · **S4a this** ·
S4b AI reply-draft deferred).

## Goal
Ship account-level **All Analytics** (cross-site rollup) and **All Leads** (cross-site inbox,
master-detail) — read-only over existing data — and enable their sidebar nav. The AI reply-draft
(2c) is a fast-follow.

## Approach (decided)
- **Read-only aggregation** over shipped models: `PageAnalytics` (daily per-slug) and
  `FormSubmission` (leads). No new models, no LLM, no credits.
- **AI reply-draft (2c) deferred to S4b** — it's net-new (no reply mechanism exists; LLM + credit
  cost). Keeps S4a lower-risk + cleanly parallel.

## Scope IN
- **All Analytics (2a)** — account-level page aggregating `PageAnalytics` across all the user's
  published sites: totals (views, unique visitors, conversions) + per-site breakdown table +
  the handoff's summary layout. Read-only.
- **All Leads (2b)** — account-level **inbox** over `FormSubmission` across all sites:
  master-detail (list + selected-lead detail showing `data`, site, form, timestamp). Read-only
  (view/read; reply-draft = S4b).
- **Un-grey the sidebar nav** items `All Analytics` + `All Leads` (were greyed in S1); wire to
  the new routes.
- **Own-data scoping** — every query filters by the user's `userId`; a user sees only their own
  sites' analytics + their own leads. Admin god-view consistent with S1's pattern.
- Built on `ui-foundation` tokens/primitives.

## Scope OUT (non-goals)
- **AI reply-draft (2c)** — S4b fast-follow (LLM + credits + copy-to-clipboard flow).
- **Notifications panel (2d)**, profile popover (2e), account settings (2f) — separate/later.
- **No changes to the per-site** `/dashboard/[token]/{analytics,leads}` views (S1 re-homed them;
  this is the *cross-site* aggregate, additive).
- **No new Prisma models / schema changes** — read existing `PageAnalytics`/`FormSubmission`.
- No lead status/assignment/CRM features (inbox is read/view only for beta).
- No responsive/mobile pass.

## Constraints
- Depends on **`ui-foundation` merged**; builds on the **S1 sidebar shell** (merged).
- **Cross-user data scoping is the #1 risk** — aggregation queries MUST filter by `userId`; never
  leak another user's leads/analytics. Verify the admin god-view path doesn't become a normal-user
  cross-tenant read.
- **Coordination seam with `billing-beta` (S3):** both un-grey items in the **same sidebar nav
  component** (S4 un-greys All Analytics/All Leads; billing un-greys the plan widget/Upgrade).
  Different items, same file → coordinate to avoid a merge conflict (whoever lands second rebases).
- **Account-level routing**: All Analytics/All Leads are account-scoped (no `[token]`) —
  reconcile with S1's `/dashboard/[token]/*` restructure (likely `/dashboard/analytics` +
  `/dashboard/leads` index routes). Confirm with scout.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `prisma/schema.prisma` — `PageAnalytics` (L359, daily per-slug aggregation),
  `FormSubmission` (L229, leads: userId/publishedPageId/formId/data/createdAt).
- `src/app/dashboard/analytics/[slug]/page.tsx`, `forms/[slug]/page.tsx` — per-site views to
  aggregate (patterns for querying/rendering).
- `src/app/api/analytics/*`, `src/app/api/forms/*` — existing analytics/forms routes.
- `docs/task/dashboard-workspace-ia.spec.md` (S1) — sidebar nav + greyed items this un-greys.
- `docs/task/billing-beta.spec.md` (S3) — the sidebar-nav coordination seam.
- Handoff `Lessgo Dashboard.dc.html` 2a (All Analytics), 2b (All Leads inbox), 2c (reply — S4b).

## Open exploration questions (feeds scout)
- Account-level route shape for All Analytics/All Leads vs S1's `/dashboard/[token]/*` (index routes?).
- How is a user's set of sites/slugs resolved to aggregate `PageAnalytics` (published pages by userId)?
- Cleanest own-data query for `FormSubmission` across all the user's sites; pagination for a long inbox.
- Where the sidebar nav component lives + how S1 rendered the greyed items (to un-grey without
  clobbering billing's changes).

## Candidate human gates
- **Cross-user data-scoping** — verify a user cannot see another user's leads/analytics (authz).

## Acceptance criteria
- [ ] All Analytics page aggregates `PageAnalytics` across the user's sites (totals + per-site).
- [ ] All Leads inbox lists `FormSubmission` across all the user's sites (master-detail, read-only).
- [ ] Sidebar `All Analytics` + `All Leads` are enabled (un-greyed) → route to the new views.
- [ ] All queries scoped to the user's own data; no cross-user leak; admin path consistent.
- [ ] AI reply-draft NOT built (S4b); no new schema.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Slice order: (1) All Leads inbox (higher day-1 value — real leads to read) + un-grey nav, (2) All
Analytics rollup. Gate: a user sees all their leads in one inbox and all-site analytics in one view,
scoped to their own data. Then S4b adds the AI reply-draft.
