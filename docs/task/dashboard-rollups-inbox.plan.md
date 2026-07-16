WORKDIR: C:\Users\susha\lessgo-ai\.claude\worktrees\dashboard-rollups-inbox
Branch: feature/dashboard-rollups-inbox
Tier: standard

# dashboard-rollups-inbox — implementation plan

## Rulings (orchestrator — DECIDED, do not re-litigate)

- **R-A (overrides spec L38): the All Leads inbox scopes by `publishedPageId: { in: <the user's own PublishedPage.ids> }`, NOT by `where: { userId }`.** Reason: `/api/forms/submit` writes BOTH `userId` and `publishedPageId` from the client-supplied request body, so `FormSubmission.userId` is attacker-controllable; the own-page-ids list derives from server-set `PublishedPage.userId` and is trustworthy. Do NOT additionally AND `userId` — it adds no security (equally untrusted) and can hide legitimate rows. **Known accepted gap:** `FormSubmission.publishedPageId` is nullable, so orphan rows with a null publishedPageId are NOT shown in the inbox. Call this out in the plan + audit as a known limitation.
- **R-B: NO admin god-view branch in S4.** Both new pages show the viewer their OWN data only, admin or not. Reason: S1's "all projects, take:200" pattern would show an admin a merged everyone-analytics blob — semantically wrong for a personal rollup. Do not import `isAdmin` for a widening branch. Note the deliberate divergence from S1 in the plan.
- **R-C: NO count pill** on the un-greyed nav items — keeps R14's guard intact and the `toHaveText(/All Leads$/)` assertion valid. Un-grey only.
- **R-D: build fresh account-level components using `app-*` tokens ONLY.** Do NOT edit, reskin, or import the legacy stock-Tailwind per-site analytics components (`[token]/analytics/components/*`) — spec Scope OUT forbids changing per-site views, and importing them would violate spec L40 "built on ui-foundation". `src/components/dashboard/FormSubmissionsTable.tsx` may be reused ONLY if it is already `app-*`-clean AND needs no edit; otherwise build fresh. Never edit `src/components/ui/nav-item.tsx` (frozen primitive).
- **R-E: analytics date window** — follow whatever window the per-site analytics page uses; if ambiguous, default to last 30 days. State the choice in the plan.

**Ruling resolutions applied by this plan:**
- R-D: `FormSubmissionsTable.tsx` verified stock-Tailwind (`bg-gray-50`, `text-gray-500`, `divide-gray-200`) → **build fresh**; it is not touched.
- R-E: per-site page (`[token]/analytics/page.tsx:70-78`) uses `?days=` searchParam, valid `{7,30,90}`, **default 30** → the rollup mirrors exactly that (same param, same validation, default 30). The per-site page's previous-period comparison + trend chart are **omitted** from the pilot rollup (totals + per-site table only, per spec).

## Overview

Ship two account-level, read-only pages — `/dashboard/leads` (cross-site leads inbox, master-detail) and `/dashboard/analytics` (cross-site analytics rollup) — over existing `FormSubmission` / `PageAnalytics` data, and un-grey their S1 sidebar nav items. All scoping flows through ONE new server helper (`accountScope.ts`) that resolves the viewer's own `PublishedPage` rows from the Clerk id — the security seam, unit-tested for cross-user isolation. No schema changes, no LLM, no credits; forbidden-surface list untouched (no middleware/auth-config/editStore/published-renderer/prisma/billing/publish/staticExport/kvRoutes edits needed).

## Progress log

- phase 1 accountScope helper + isolation unit test: pending
- phase 2 All Leads inbox route + UI + top-bar titles: pending
- phase 3 un-grey All Leads nav + e2e updates: pending
- phase 4 All Analytics rollup + un-grey All Analytics + e2e: pending
- phase 5 acceptance + full-gate sweep: pending

## ID-space ledger (every query in this plan)

| Query | Where clause | ID space |
|---|---|---|
| `publishedPage.findMany` (accountScope) | `userId: <clerkId from auth()>` | **Clerk id** (PublishedPage.userId = Clerk; scout §3) |
| `formSubmission.findMany` (inbox) | `publishedPageId: { in: pageIds }` | **PublishedPage.id** (cuid), per R-A — NOT FormSubmission.userId |
| `pageAnalytics.findMany` (rollup) | `slug: { in: slugs }, date: {gte,lte}` | **PublishedPage.slug** (PageAnalytics has NO userId) |

Never filter anything here by `Project.userId` (internal `User.id` — wrong space, tsc-green, silently zero rows). Neither new page needs `prisma.user` at all.

---

## Phase 1 — accountScope helper + cross-user isolation unit test

**Goal:** the single own-data scoping seam both pages consume, proven isolated by vitest (the cheap cross-user gate — Playwright has only a single-account fixture, so NO second-user e2e is planned; this test is the automated guarantee).

Steps:
1. Create `src/lib/dashboard/accountScope.ts` (server-only module, plain — no `'use client'`):
   - `export interface AccountPage { id: string; slug: string; title: string | null }`
   - `export async function getAccountScope(clerkUserId: string, db = prisma): Promise<{ pages: AccountPage[]; pageIds: string[]; slugs: string[] }>`
   - Implementation: `db.publishedPage.findMany({ where: { userId: clerkUserId /* Clerk id space */ }, select: { id: true, slug: true, title: true } })` → derive `pageIds`/`slugs`. Include ALL of the user's PublishedPage rows regardless of `publishState`/`isPublished` — historical leads/analytics of a since-unpublished page still belong to the user.
   - `db` parameter defaults to the prisma singleton but is injectable for tests.
   - Doc comment MUST state: (a) `clerkUserId` is the **Clerk id from `auth()`** — never pass internal `User.id`; (b) R-A rationale (FormSubmission.userId is client-supplied → untrusted; scope leads via these page ids); (c) known gap: submissions with `publishedPageId = null` are invisible to the inbox; (d) R-B: no admin widening here — helper always returns the viewer's own pages.
2. Create `src/lib/dashboard/accountScope.test.ts` (vitest):
   - In-memory fake `db` whose `publishedPage.findMany` filters a two-user fixture (user_A: 2 pages, user_B: 1 page) by `args.where.userId` and applies `select`.
   - Test 1 (isolation): `getAccountScope('user_A', fakeDb)` returns exactly A's ids/slugs and NONE of B's; same inverted for B.
   - Test 2 (query shape): spy asserts `findMany` was called with `where: { userId: 'user_A' }` (guards against someone later widening/dropping the filter).
   - Test 3 (empty): unknown user → `{ pages: [], pageIds: [], slugs: [] }`.

**Files touched:**
- `src/lib/dashboard/accountScope.ts` (new)
- `src/lib/dashboard/accountScope.test.ts` (new)

**Verification:**
- `npx tsc --noEmit` → clean.
- `npm run test:run` → all green, including the 3 new accountScope tests.

---

## Phase 2 — All Leads inbox (`/dashboard/leads`) + top-bar titles

**Goal:** account-level inbox over `FormSubmission` across all the user's sites, master-detail, read-only, `app-*` tokens only.

Steps:
1. Create `src/app/dashboard/leads/page.tsx` (server component). Route slot is free (legacy account-level slug folder is `forms/`, not `leads/`; scout §1):
   - Auth: copy the account-level pattern from `src/app/dashboard/page.tsx:22-43` — `const { userId } = await auth()`; unauthenticated → same handling as that page. **Do NOT import `isAdmin` / add any admin branch (R-B — deliberate divergence from S1's dashboard root; leave a one-line code comment saying so).** Do NOT call `getUserPlan()` (get-or-create, seeds credits). `dashboard/layout.tsx` is NOT an auth boundary — this page scopes its own query.
   - `const { pages, pageIds } = await getAccountScope(userId)` (Clerk id).
   - If `pageIds` empty → render the `app-*` empty state (copy markup pattern from `src/app/dashboard/[token]/leads/page.tsx:56-66`): "Publish a site to start collecting leads."
   - Query (R-A): `prisma.formSubmission.findMany({ where: { publishedPageId: { in: pageIds } }, orderBy: { createdAt: 'desc' }, take: 200 })`. Note in code: no compound `[publishedPageId, createdAt]` index → in-memory sort, fine at beta volume; pagination out of scope. If exactly 200 rows returned, render a truncation notice (S1 precedent). **Known limitation (R-A), also goes in the audit:** orphan submissions with `publishedPageId = null` are not shown.
   - Build a `pageId → {title, slug}` map from `pages` for site labels; serialize `createdAt` to ISO strings; pass a plain-object array to the client component.
   - Empty-leads case (pages exist, zero submissions) → `app-*` empty state ("No leads yet…").
2. Create `src/app/dashboard/leads/LeadsInbox.tsx` (`'use client'`, fresh build per R-D — `FormSubmissionsTable` confirmed stock-Tailwind, not reused):
   - Master list (left): one row per submission — lead preview (priority fields `email`/`name`/`phone` from the `data` Json, reuse the priority-sort idea, not the component), site title/slug, `formName`, formatted timestamp. Selected row highlighted; `useState` for selection, first row selected by default.
   - Detail pane (right): all `data` key/values (copy-to-clipboard per field is fine, `navigator.clipboard`), site, `formName`, full timestamp, submission/form ids. Read-only — NO reply UI, no status/assignment (S4b / scope OUT).
   - Styling: `app-*` tokens ONLY (`bg-app-surface`, `border-app-border`, `text-app-ink`, `text-app-faint`, `font-app-sans`, `rounded-app-input`, …). No stock-Tailwind color/font keys.
3. Edit `src/components/dashboard/DashboardTopBar.tsx` `TITLES` map (L21-31) — **required**: `leads` is missing, so `/dashboard/leads` currently falls into the token branch and renders NO top bar. Add `leads: ['Lead management', 'All Leads']` and change `analytics` to `['Performance', 'All Analytics']` (that key only serves the redirect shim today, and phase 4's route from then on). Two-line diff, nothing else.

**Files touched:**
- `src/app/dashboard/leads/page.tsx` (new)
- `src/app/dashboard/leads/LeadsInbox.tsx` (new)
- `src/components/dashboard/DashboardTopBar.tsx` (edit — TITLES map only)

**Verification:**
- `npx tsc --noEmit` → clean; `npm run test:run` → green.
- Manual (`npm run dev`): visit `/dashboard/leads` directly (nav still greyed) → top bar shows "Lead management / All Leads"; inbox lists this account's submissions across sites with site labels; detail pane shows full `data`; empty states render for a lead-less account.

---

## 🔒 HUMAN GATE A — cross-user data scoping (spec's candidate gate)

Placed here: the scoping helper + inbox now read real data. User verifies before anything is exposed in nav:
- Account A at `/dashboard/leads` sees ONLY its own sites' leads (spot-check against DB / a second dev account).
- A second account (or incognito sign-up) sees an empty inbox, never A's leads.
- Confirm the R-A model is accepted: inbox keyed on own page-ids; null-`publishedPageId` orphans invisible (known limitation); no admin god-view (R-B).
- Automated backstop already green: phase 1 vitest isolation test. (Single-account Playwright fixture → intentionally no cross-user e2e.)

Do not proceed to phase 3 without sign-off.

---

## Phase 3 — un-grey All Leads nav + e2e updates

**Goal:** enable the `All Leads` sidebar item (slice 1 completes) and keep the e2e gate honest — `e2e/dashboard-shell.spec.ts:43-70` asserts both items disabled and WILL go red on un-grey, so it changes in this same phase.

Steps:
1. Edit `src/components/dashboard/AppSidebar.tsx`:
   - Add `const leadsActive = pathname?.startsWith('/dashboard/leads') ?? false` near L80-81.
   - Replace the `All Leads` `DisabledNavItem` (L115) with the enabled shape (copy L103-112): `<NavItem asChild active={leadsActive} className={leadsActive ? 'font-semibold' : undefined}><Link href="/dashboard/leads"><AppIcon name="move_to_inbox" filled={leadsActive} size={20} />All Leads</Link></NavItem>`. **No count pill (R-C).**
   - `All Analytics` stays a `DisabledNavItem` this phase (its route doesn't exist yet — never ship a dead link).
   - Doc-comment L20-23: MINIMAL edit — remove only "All Leads (S4)" from the greyed list (this comment is the only real merge-conflict surface with billing S3; keep the diff to the smallest token-level change).
2. Edit `e2e/dashboard-shell.spec.ts:43-70`:
   - Narrow the greyed loop to `['All Analytics', 'Domains']`; bell assertions unchanged.
   - Repoint the R14 pill guard: `All Leads` is now a link, so `page.getByRole('link', { name: 'All Leads', exact: true })` + keep `toHaveText(/All Leads$/)` (valid per R-C; end-anchor still catches a future pill; do NOT weaken to `toContainText` — the existing comment explains the AppIcon ligature-text trap).
   - Retitle the test to match the remaining set.
3. Create `e2e/dashboard-rollups-inbox.spec.ts` (authed, follows `dashboard-shell.spec.ts` patterns — same `APP_CHROME` selector, storage state):
   - Test: click sidebar `All Leads` → URL `/dashboard/leads`; exactly one `.app-chrome`; top-bar `heading` "All Leads" visible; page renders (empty state OR inbox list) without error.
   - Comment in file: single-account fixture → cross-user isolation is covered by `src/lib/dashboard/accountScope.test.ts`, NOT e2e (by design).

**Files touched:**
- `src/components/dashboard/AppSidebar.tsx` (edit)
- `e2e/dashboard-shell.spec.ts` (edit)
- `e2e/dashboard-rollups-inbox.spec.ts` (new)

**Verification:**
- `npx tsc --noEmit` → clean; `npm run test:run` → green.
- `npx playwright test e2e/dashboard-shell.spec.ts e2e/dashboard-rollups-inbox.spec.ts` → green (greyed-set test passes with narrowed loop; All Leads nav test passes).

---

## Phase 4 — All Analytics rollup (`/dashboard/analytics`) + un-grey All Analytics + e2e

**Goal:** account-level analytics rollup (totals + per-site table), enable its nav item, finish e2e coverage.

Steps:
1. Create `src/app/dashboard/analytics/page.tsx` (server component; legal sibling of the existing `analytics/[slug]/page.tsx` redirect shim — shim untouched):
   - Same auth pattern as phase 2 (Clerk `auth()`, no admin branch per R-B, no `getUserPlan()`).
   - `const { pages, slugs } = await getAccountScope(userId)`; empty → `app-*` empty state ("Publish a site to see analytics").
   - Window (R-E): mirror `[token]/analytics/page.tsx:70-78` — `searchParams.days`, valid `{7,30,90}`, default 30; compute `startDate`/`endDate` identically. No previous-period comparison in the pilot.
   - Query: `prisma.pageAnalytics.findMany({ where: { slug: { in: slugs }, date: { gte: startDate, lte: endDate } } })` (PageAnalytics has NO userId — slug join via own PublishedPage slugs; `[slug,date]` index supports this).
   - Group by slug in JS. Account totals: `views`, `uniqueVisitors`, `formSubmissions`, `ctaClicks` summed; `conversionRate = submissions/views*100` computed from totals (per-site page pattern — never average stored `conversionRate`).
   - Render (server-side, fresh `app-*` markup per R-D — no import of `MetricsCards`/`TrendChart`/etc.): stat tiles row (Views / Unique visitors / Conversions / Conv. rate) + per-site breakdown table (site title from `pages` map, slug, views, visitors, conversions, conv. rate), sorted views desc, zero-filled rows for sites with no analytics in window. Range switcher = three `<Link href="?days=7|30|90">` pills, active one highlighted.
2. Edit `src/components/dashboard/AppSidebar.tsx`:
   - Add `const analyticsActive = pathname?.startsWith('/dashboard/analytics') ?? false`; replace the `All Analytics` `DisabledNavItem` (L114) with the enabled `NavItem`+`Link href="/dashboard/analytics"` shape (icon `monitoring`). No pill (R-C).
   - Doc-comment: remove "All Analytics (S4)" from the greyed list (minimal diff again; greyed list is now Domains + Upgrade only).
3. Edit `e2e/dashboard-shell.spec.ts`: narrow the greyed loop to `['Domains']` (+ bell unchanged); retitle.
4. Edit `e2e/dashboard-rollups-inbox.spec.ts`: add the All Analytics test — click sidebar item → URL `/dashboard/analytics`; one `.app-chrome`; heading "All Analytics"; stat tiles or empty state render; optionally assert `?days=7` link navigates and page still renders.

**Files touched:**
- `src/app/dashboard/analytics/page.tsx` (new)
- `src/components/dashboard/AppSidebar.tsx` (edit)
- `e2e/dashboard-shell.spec.ts` (edit)
- `e2e/dashboard-rollups-inbox.spec.ts` (edit)

**Verification:**
- `npx tsc --noEmit` → clean; `npm run test:run` → green.
- `npx playwright test e2e/dashboard-shell.spec.ts e2e/dashboard-rollups-inbox.spec.ts` → green.
- Manual (`npm run dev`): `/dashboard/analytics` totals match the sum of the per-site pages for the same window; 7/30/90 switcher works.

---

## Phase 5 — acceptance + full-gate sweep

**Goal:** whole-feature gates green before the single standard-tier impl-review; no new surface.

Steps:
1. `npx tsc --noEmit`, `npm run test:run`, `npm run build` — all green.
2. `npx playwright test e2e/dashboard-shell.spec.ts e2e/dashboard-workspace.spec.ts e2e/dashboard-lifecycle.spec.ts e2e/dashboard-redirects.spec.ts e2e/dashboard-rollups-inbox.spec.ts` — green (regression across the dashboard suite).
3. Walk spec acceptance criteria; confirm in the audit: rollup + inbox live and scoped; nav enabled; no schema change; no S4b reply UI; R-A null-`publishedPageId` limitation and R-B no-admin-view divergence documented.
4. Fix-forward only: any fix stays within phases 1-4's Files-touched lists.

**Files touched:** none (fixes, if any, only within earlier phases' lists).

**Verification:** the three gate commands above + the Playwright dashboard suite, all green. This is the final state the single impl-review reviews.

---

## Escalation check (standard tier)

Total files: **9** (≤15). None of the forbidden surfaces (middleware, auth config, edit store, published renderers/registries, prisma schema/migrations, planManager, creditSystem, stripe/billing/credits/publish APIs, staticExport, kvRoutes) is touched. No escalation needed.

## Risks / open questions

Risks:
- **AppSidebar edited in phases 3 AND 4** (deliberate: never ship a dead All Analytics link) → two chances to collide with billing S3's seam; both edits keep the L20-23 doc-comment diff token-minimal; whoever lands second rebases.
- `formSubmission` in-memory sort over `publishedPageId IN (…)` (no compound index) — fine at beta volume; flagged in code for future pagination.
- RSC prop serialization: pass ISO strings, not Dates, to `LeadsInbox` to avoid hydration-format drift.
- `analytics` TITLES rename ("Analytics" → "All Analytics") briefly labels the redirect shim — harmless (instant redirect).

Unresolved questions (for user):
1. Rollup pilot omits prev-period deltas + trend chart (totals + per-site table only) — ok?
2. Inbox `take: 200` + truncation notice, no pagination for beta — ok?
3. Null-`publishedPageId` orphan leads invisible in inbox (R-A accepted gap) — ok, or want a follow-up backfill task logged?
4. Eyebrow labels: "Lead management / All Leads", "Performance / All Analytics" — ok?
