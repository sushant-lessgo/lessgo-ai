# dashboard-workspace-ia — implementation plan (rev 4 — **FROZEN**, founder-approved; implementation starts)

- **WORKDIR**: `C:\Users\susha\lessgo-ai\.claude\worktrees\dashboard-workspace-ia`
- **Branch**: `feature/dashboard-workspace-ia`
- **Tier**: full
- **Inputs**: `docs/task/dashboard-workspace-ia.spec.md` (scope) + `docs/task/dashboard-workspace-ia.scout.md` (facts + rulings R1–R14 + non-negotiables §G) + orchestrator rulings **R15, R16, R17b (supersedes R17), R18, R19** + review fixes **B1–B5, C1–C3 (verified)** + final edits **D1–D5** (all in force; reviewer line refs trump scout where they conflict). Schema names confirmed real: `prisma/schema.prisma:23` `Project.user` relation, `:12` `User.clerkId`. Design source: `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Dashboard.dc.html` (read-only reference).

## Overview

Build the dashboard IA spine: account-level shell (sidebar + top bar) via a new `dashboard/layout.tsx`, projects grid + 1a empty state replacing the flat list, then a token-spined project workspace at `/dashboard/[token]/*` that re-homes analytics/forms(leads)/blog/testimonials as-is behind tabs, with Node-runtime redirect shims from old slug URLs and per-page ownership checks (hardened `assertProjectOwner` wrapper — B3/D2). No new backend, no schema changes, no destructive actions. Foundation (`src/components/ui/*`, Tailwind `app-*` keys) is frozen — consume only; gaps solved at dashboard call sites (R11/R12/R13).

**Global invariants (every phase):**
- `.app-chrome` class ONLY on the dashboard shell wrapper (layout) — never body / `/p` / `/preview` / editor canvas / **the blog SSR preview route (B2)**.
- Never add/mutate a stock Tailwind key; 3 isolation guards stay green (published.css sha256, config-freeze test, `e2e/ui-isolation.spec.ts`).
- **No middleware change** — scout §C verdict: `/dashboard/*` nesting auto-inherits Clerk protection + apex→app forwarding. If an implementer thinks middleware needs an edit, STOP and escalate.
- **THREE ID SPACES (C2):** `Project.userId` = **internal `User.id`**; `PublishedPage.userId` = **Clerk id**; **`Testimonial.userId` = Clerk id** (`dashboard/testimonials/page.tsx:21` passes `auth().userId` raw into `listTestimonialsByOwner`; `src/lib/testimonials/repo.ts:82-94` filters `where:{userId}`). All three are `string` — a wrong-space pass is tsc-green and silently returns zero rows. Never join across spaces. In the token spine, scope by `project.id` / `publishedPage.id` after the ownership check; for Clerk-keyed reads use the wrapper's returned `clerkId` (owner-resolved, non-null by construction — phase 3/D2).
- **Shim directories hold ONLY the shim (C3):** local `components/` folders move WITH their page to the new `[token]` location — never left behind under a redirect dir.
- **In-tab links never bounce through a shim (C1/D1):** any URL a moved page/component renders for its own workspace must be the token URL, not the old slug URL (shims drop query strings and add hops).
- Merge to main-LOCAL only when green; **DO NOT PUSH** (big-bang push is founder's).
- Gates before merge: `npx tsc --noEmit`, `npm run test:run`, `npm run lint`, `npm run build`.

## Progress log

- phase 1 shell (layout + sidebar + top bar, Header retired ×11, blog-preview escapes shell): **done** (commit `9c5a3aed`, review loops 1, verdict ship). Gates: tsc clean · 3331 tests pass · lint 0 err. Orchestrator exception: `playwright.config.ts` added to Files-touched (plan gap — new e2e specs were registered by no project; specs for phases 2-5 pre-registered in the same edit). Non-blocking carried to gate: plan widget renders "Free plan" (real `PLAN_CONFIGS[FREE].name`) vs design's "Starter plan" — founder eyeball.
- phase 2 projects grid + card + menu + filters + empty state: **done** (commit `a9dc3b13`, review loops 1 + 2 orchestrator e2e rounds, verdict ship). Gates: tsc clean · 3331 tests · lint 0 err. B4 port verified line-for-line vs `9c5a3aed:ProjectCard.tsx:41-84` (all 6 paths, original order). Orchestrator exception: `NewSiteButton.tsx` label → `ReactNode` (killed an a11y-hostile overlay button). **e2e gotcha for later phases: `AppIcon` renders the Material Symbols ligature AS element text — whole-string `toHaveText` can never pass on any element containing an icon (3 instances fixed; use end-anchored regex or `getByRole(...,{name})`).** Carried to gate: "Free plan" vs design's "Starter plan"; `dashboard_header_loaded` event lost (identity intact via ph-provider); `ProjectFilters.tsx` exports `ProjectsBoard` (rename follow-up).
- phase 3 token workspace spine + Overview + hardened authz helper: **done** (commit `6f632c08`, review loops 1 + 1 orchestrator test-hardening round, verdict ship). Gates: tsc clean · 3343 tests · lint 0 err. **B3 CLOSED + adversarially verified** — reviewer attacked the ladder (orphan/demo/non-owner/null-userRecord) and found no path through; all rungs run before any display query. Guards are **mutation-proven** (deleting rung 3 or the `isDemo` clause each fail the suite). `cache()` runtime-absence verified empirically. Note for phases 4-5: `getWorkspaceProject` returns `{project, publishedPage|null, adminOverride, clerkId}` — **`clerkId` is the OWNER's**, use it for all Clerk-keyed reads (`PublishedPage`, `Testimonial`); `project.userId` is internal `User.id`.
- phase 4 re-home analytics + leads (+ 8 co-located components), slug shims: **done** (commit `baf61ef1`, review loops 1 + 1 orchestrator accuracy round, verdict ship). Gates: tsc clean · 3343 tests · lint 0 err. Ownership verified first-statement on both pages; no cross-space compare; 8 moves are pure renames (0 changed lines); D1 verified end-to-end. **Gate item added: existing pages' visible LEAD COUNTS may shift** — `/api/forms/submit` takes `userId`+`publishedPageId` from the client-supplied body, so the dropped filter never protected anything, but previously-hidden non-matching-`userId` rows now appear (not a cross-project leak). Also: duplicate back-link inside moved analytics body (founder eyeball).
- phase 5 re-home blog + testimonials (+ 4 co-located components, URL re-points), blog shims: **done** (commit `d049dc3e`, review loops 1, verdict ship). Gates: tsc clean · 3343 tests · lint 0 err · 32 e2e collected. **Third ID space handled + guarded**: `listTestimonialsByOwner(clerkId, {projectId})` with the wrapper's owner-resolved `clerkId`; e2e asserts the quote is VISIBLE (wrong-space renders an empty-but-healthy page — only a non-empty check bites). B2 preview untouched/un-shimmed/chrome-free; its old-slug link is deliberate + commented. `slug`-prop drop verified safe (grep: zero readers — not a field-drop repeat). Corruption sweep for stray `</content>` residue: **zero hits** worktree-wide. Carried to gate: duplicate back-link in moved blog body (same as analytics).
- phase 6 cleanup + docs + full gates: **done** (commit `ddd099e1`, review loops 1 + 1 orchestrator doc round, verdict ship). 5 dead components deleted, each verified importer-free (`Footer.tsx` was 0 bytes); correct `EmptyState` survived. Docs D4/G1/G2. **All four gates green incl. `npm run build`** (first run). Build corroborates architecture: shims 367-372 B (redirect-only), blog preview 786 kB First Load = identical to `/p/[slug]` → **B2 held**.
- **main merged in** (`62f1748f`, auth-redesign) — clean, no conflicts. Its root-layout change is Clerk localization only (flow-scoped keys, no fonts/body classes) → no `.app-chrome` interaction. **Re-greened post-merge: tsc 0 · 3343 tests · lint 0 err · build compiled successfully (34/34 static pages) · isolation diff empty · `.app-chrome` still one attach site.**
- **HUMAN GATE (authz/redirect founder QA) + merge: PENDING FOUNDER** → checklist at the end of `dashboard-workspace-ia.audit.md`. Merge target = **main-LOCAL only, NO PUSH** (big-bang with auth + editor-shell).

---

## Phase 1 — Dashboard shell: `dashboard/layout.tsx` + sidebar + top bar; retire `<Header/>` from all **11** importers; blog-preview escapes the shell

No routing changes (the preview route-group move keeps its URL byte-identical). After this phase every `/dashboard/*` screen renders inside the new chrome exactly once — layout creation and the 11 call-site removals land atomically — and the blog SSR preview renders with NO `.app-chrome` ancestor.

**Build:**
1. `src/app/dashboard/layout.tsx` (async server component):
   - Wrapper `<div className="app-chrome ...">` → grid: `AppSidebar` (244px) + column (`DashboardTopBar` + `<main>{children}</main>`), full-viewport, `bg-app-canvas`.
   - Fetches Clerk user (`currentUser()`) for profile row (name, email, avatar) and plan data for the widget. Plan data (R6): if a trivial read exists via `src/lib/planManager.ts` (tier name + site limit) + project count, pass `{planName, used, limit}`; otherwise pass `undefined` → widget renders greyed with em-dash placeholders. **Never fake numbers.**
2. **B2 — blog SSR preview must escape the shell.** `dashboard/blog/[slug]/[postId]/preview/page.tsx` is NOT a dashboard screen: it imports `@/styles/fonts-self-hosted.css` (`:1`) and returns `renderBlogSsrPage(...)` (`:54`) — real template markup, deliberately Header-less; wrapping it in `.app-chrome` (Onest/ink/canvas inherited defaults) breaks its parity with the live page (`src/components/ui/README.md:47-51` forbids this; dual-renderer-adjacent, load-bearing). Fix: **move it verbatim to a root route group outside the dashboard folder tree** — `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx`. URL unchanged (`/dashboard/blog/{slug}/{postId}/preview`), only the root layout wraps it, literal `blog` segment stays static-first vs `[token]`. Token-less deep link from the post editor — NOT re-homed, NO shim (see phase 5).
3. `src/components/dashboard/AppSidebar.tsx` (client; active state via `usePathname()`), per handoff §E sidebar spec (tokens per §E hex→token map; near-miss colors use nearest token or arbitrary value — never new keys):
   - Logo (from `@/components/shared/Logo` — do NOT edit shared) → `/dashboard`.
   - `NewSiteButton` CTA ("New site with AI", `app-cta` orange).
   - WORKSPACE: **Projects** enabled (`/dashboard`) · **All Analytics** greyed · **All Leads** greyed, **NO count pill** (R14). Grey-out per R12: `NavItem` button form (no `href`) + `disabled` + `aria-disabled` + opacity/`cursor-not-allowed` at call site — do NOT touch the primitive.
   - ACCOUNT: **Billing & plan** enabled → `/dashboard/billing`. **Domains: GREYED — RULED, R15.** No `/dashboard/domains` page exists (verified; domain UI is only `src/components/domain/AddDomainForm.tsx` in the publish flow). Grey-by-existence governs. **Do NOT build a Domains page** (later slice). Spec line 49 superseded.
   - Bottom: plan widget (two-line design copy `"Starter plan"` / `"{N} of {M} sites used · Upgrade"`; "Upgrade" greyed — S3) + profile row (avatar, name, email, gear → `/dashboard/settings`, enabled per R7).
4. `src/components/dashboard/DashboardTopBar.tsx` (client): 64px bar per §E — 2-line title block (eyebrow + title) + spacer + **greyed bell**. NO logo/avatar (R1). Title from a `usePathname()` literal-segment map (`/dashboard`→"Workspace"/"Projects", `settings`, `billing`, `testimonials`, `forms`, `analytics`, `blog`, `emails`, `outreach`, `social`). **If the segment after `/dashboard/` is not in the literal map (= a token), render `null`** — the phase-3 workspace header owns that chrome. Ships now so phase 3 doesn't double-stack bars.
5. `src/components/dashboard/NewSiteButton.tsx` (client): CTA extracting the **`/api/start` logic verbatim** from `DashboardHeader.tsx` (`POST /api/start` → `window.open(url)`). Drop DashboardHeader's dead state. Reused by grid filter row + empty state.
6. **B1 — edit the 11 Header importers** (reviewer-verified list): remove `<Header/>` (+ dashboard `<Footer/>` where present, e.g. `testimonials/page.tsx:55,:89`) import + JSX only. **No other changes** — interiors untouched. `billing/page.tsx` is confirmed clean (`'use client'`, no Header) — not touched. Note: R19 ("testimonials stays live, unchanged") means unchanged *behavior/route* — it still loses its Header/Footer here. Do NOT delete `Header.tsx`/`DashboardHeader.tsx` yet (phase 6).
   - **Known transient (accepted):** `forms/[slug]/page.tsx` + `blog/[slug]/page.tsx` keep their `@/components/shared/Footer` inside the new chrome until phases 4–5 turn them into shims. Cosmetic only — do NOT "fix" it here (out of scope for this phase's Files-touched).
7. Keep `PersonaUpdatedBanner` working on `/dashboard` (`?personaUpdated=1`).
8. `e2e/dashboard-shell.spec.ts` (authed, copy `publish.spec.ts` + `auth.setup.ts` Clerk pattern): sidebar renders; All Analytics / All Leads / **Domains (R15)** / bell are `disabled`/`aria-disabled`; exactly ONE `.app-chrome` element on `/dashboard`; old header markup absent; `/dashboard/settings` and `/dashboard/testimonials` render inside shell without a second nav; **B2 guard: the blog preview route (`/dashboard/blog/{slug}/{postId}/preview`, fixture via publish-flow pattern) has NO `.app-chrome` ancestor** (`e2e/ui-isolation.spec.ts` only covers `/dev/meridian/blocks` — nothing else would catch this). Also assert `/p/*` contains no `.app-chrome` (skip if ui-isolation already covers).

**Files touched:**
- `src/app/dashboard/layout.tsx` (new)
- `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx` (new — moved verbatim)
- `src/app/dashboard/blog/[slug]/[postId]/preview/page.tsx` (delete — moved to route group)
- `src/components/dashboard/AppSidebar.tsx` (new)
- `src/components/dashboard/DashboardTopBar.tsx` (new)
- `src/components/dashboard/NewSiteButton.tsx` (new)
- `src/app/dashboard/page.tsx`  (Header import `:4`)
- `src/app/dashboard/settings/page.tsx`  (`:5`)
- `src/app/dashboard/testimonials/page.tsx`  (`:5`, `<Header/>` `:55`, `<Footer/>` `:89` — B1)
- `src/app/dashboard/social/[token]/page.tsx`  (`:5`)
- `src/app/dashboard/outreach/[token]/page.tsx`  (`:5`)
- `src/app/dashboard/emails/[token]/page.tsx`  (`:5`)
- `src/app/dashboard/forms/[slug]/page.tsx`  (`:4`)
- `src/app/dashboard/blog/[slug]/page.tsx`  (`:4`)
- `src/app/dashboard/blog/[slug]/[postId]/page.tsx`  (`:4`)
- `src/app/dashboard/analytics/[slug]/page.tsx`  (`:4`)
- `src/app/dashboard/analytics/[slug]/loading.tsx`  (`:1`)
- `e2e/dashboard-shell.spec.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run` (config-freeze guard green); `npx playwright test e2e/dashboard-shell.spec.ts e2e/ui-isolation.spec.ts`; manual: every `/dashboard/*` page loads with exactly one chrome; blog preview pixel-matches its pre-move rendering; CTA opens onboarding.

---

## Phase 2 — Projects grid + card + `•••` menu + filter row + empty state (flat list replaced)

**Build:**
1. `src/components/dashboard/continueRouting.ts` (client util, new): extract the state-aware `/api/loadDraft` routing **VERBATIM from `ProjectCard.tsx:41-84`** (B4 — NOT `:116-189`, that's JSX). **All FOUR branches + BOTH error fallbacks, explicitly:**
   1. `:55` `finalContent && stepIndex === 999` → `/edit/[token]`
   2. `:59` `stepIndex >= 6 && featuresFromAI?.length > 0` → `/generate/[token]`
   3. `:63` `else if (data.finalContent)` → `/edit/[token]`  ← the branch prose-drops silently kill: without it, content-bearing drafts bounce to onboarding (B4)
   4. `:67` `else` → `/onboarding/product/[token]`
   - Fallbacks: `:72` `!response.ok` → onboarding; `:76` `catch` → onboarding.
   Load-bearing — do not simplify (R9/B4). **PostHog `project_edit_clicked` fires INSIDE this util** (mirrors `handleEdit:42`) — the SINGLE call site for that event; all entry points (card primary this phase, menu "Open editor", phase-3 WorkspaceHeader "Open editor") call the util and never fire it themselves (B5: no double-fire, no zero-fire).
2. `src/components/dashboard/ProjectGridCard.tsx` (new, client) per §E 1d card spec:
   - Thumbnail `bg-app-stripes` + status badge (Published green; **Draft = amber `#9a6a1e`/`#fdf2dc` arbitrary values** per R9) + `•••` trigger.
   - Body: smart name; sub-line `"{domain} · {typeLabel}"` (published → `lessgo.ai/p/{slug}`; draft → em-dash pattern); typeLabel from existing item `type`.
   - **Admin (R8):** small `text-app-faint` owner-email line when `owner` present.
   - Metrics strip: views / leads / conv. **all em-dash (`#c0c0c8`) this slice — RULED, R16.** No fabricated numbers, no per-card analytics queries; rollups = S4. No date field.
   - Footer primary button — Published label **"Open"** (R5), Draft label **"Continue"** — **BOTH route through `continueRouting.ts` in this phase** (B5: today's published "Edit" already goes through the same state-aware `handleEdit`, `ProjectCard.tsx:158-165` — never hard-code `/edit/[token]`; also kills the transient 404). Card name/thumbnail click = same action. **Phase 3 re-points published-card "Open" + name/thumbnail click to `/dashboard/{tokenId}`** (one-line change, listed there). Plus 34px `ios_share`-style outline button (greyed — not built).
   - Today's Social/Emails/Outreach card buttons drop (design); surfaces stay reachable at existing URLs and return as Overview quick actions (phase 3) with the same kill-switch checks.
3. `src/components/dashboard/ProjectCardMenu.tsx` (new, client): `•••` popover, all 7 design items in order (R4): **Open editor** → `continueRouting.ts` (B5) · **Visit site** (`/p/{slug}`, active only when published; **fires `project_preview_clicked` — the single call site**) · Rename · Duplicate · Domain settings · divider · Archive · Delete — latter five **greyed** (Domain settings grey = R15-consistent). Per R11: style at call site via `className` on `DropdownMenuContent`/`Item` (or local popover under `components/dashboard/`) — never edit the primitive, never touch stock Tailwind keys.
4. `src/components/dashboard/ProjectFilters.tsx` (new, client): pills All {n} / Published / Drafts (client-side filter, enabled) · greyed "Recent" sort pill · `NewSiteButton` compact "New site".
5. `src/app/dashboard/page.tsx`: flat list → 3-col grid (`gap-[18px]`) + filter row + ghost "Create a new site" card (1b, wired to `NewSiteButton` behavior). **Explicitly: remove the `<DashboardHeader/>` import + render (`dashboard/page.tsx:6,:159`)** — the filter row + `NewSiteButton` replace it (the file itself is deleted in phase 6). **PRESERVE VERBATIM:** smart-name fallback (`:104-139` incl. `formatField`), admin god-view branch (`isAdmin` → `findMany take:200` + `ownerEmail`), **"Showing first 200 projects" notice**, item shape, `PersonaUpdatedBanner`. Data fetch unchanged (R16). Empty branch → new `DashboardEmptyState` (old `EmptyState` import removed here; file deleted phase 6).
6. `src/components/dashboard/DashboardEmptyState.tsx` (new, client) per §E 1a spec — **R17b (RULED, supersedes R17):** welcome chip, `"Let's build your first site, {firstName}"` (Clerk firstName, graceful fallback), design sub-copy; **segmented toggle + textarea render GREYED/DISABLED in place** (design placeholder text visible, greyed) — an enabled textarea that silently discards a typed paragraph violates the completeness principle (spec:28-31); no sessionStorage stash either. **"Build my site" stays ENABLED** → existing `/api/start` CTA verbatim → onboarding. Radial-gradient content bg per design (arbitrary value, no new keys). **Audit:** record that wiring prompt-text → onboarding prefill (needs `/api/start` input + an onboarding prefill param) is a clean follow-up slice.
7. Extend `e2e/dashboard-shell.spec.ts`: grid renders; `•••` opens with 7 items, exactly 2 enabled (draft cards: Visit also disabled); filter pills toggle visibility; metrics em-dashes (R16); if fixture allows zero-project state: prompt controls disabled + Build-my-site enabled (else manual).

**Files touched:**
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/ProjectGridCard.tsx` (new)
- `src/components/dashboard/ProjectCardMenu.tsx` (new)
- `src/components/dashboard/ProjectFilters.tsx` (new)
- `src/components/dashboard/continueRouting.ts` (new)
- `src/components/dashboard/DashboardEmptyState.tsx` (new)
- `e2e/dashboard-shell.spec.ts`

**Verification:** `tsc`; `npm run test:run`; `npx playwright test e2e/dashboard-shell.spec.ts`; manual: draft "Continue" AND published "Open" route per state — exercise branch 3 (bare `finalContent`, stepIndex≠999) specifically; admin sees all projects + owner emails + 200-notice; zero-project account shows 1a with dead prompt controls + live CTA. No transient 404s anywhere (B5 fix).

---

## Phase 3 — Token workspace spine: `/dashboard/[token]` layout + tabs + Overview + **hardened** authz helper  ⚠️ auth-adjacent

**Build:**
1. `src/lib/workspace.ts` (new) — `getWorkspaceProject(tokenId)` wrapped in React `cache()` (dedupes layout+page double-call):
   - `auth()` → `assertProjectOwner(clerkId, tokenId, {action:'dashboard_workspace'})` (returns, never throws — scout §A). `{ok:false}` → `notFound()` (Clerk middleware already handles unauthenticated).
   - **B3 + D2 HARDENING — security-blocking, do not skip.** `assertProjectOwner`'s allow-ladder is WIDER than today's slug routes: orphan projects (`security.ts:98-110`, `project.userId == null` → `{ok:true}` for ANY signed-in user) and the demo token (`:63-65`, `{ok:true, project:null, userRecord:null}` regardless of clerkId). Today's `publishedPage.findFirst({slug, userId})` makes orphan analytics/leads unreachable by strangers — a plain `{ok:false}`→404 mapping would hand any signed-in user `/dashboard/<orphan-token>/leads` (violates spec line 84 "must not widen the existing gap"). Therefore after `ok:true`:
     - **D2: reject orphans/demo FIRST, OUTSIDE the admin short-circuit** — `if (result.isDemo || result.project == null || result.project.userId == null) notFound()`. An orphan has no owner to god-view *as*; rejecting it for admins too keeps `clerkId` non-null by construction (`Project.userId String?`, schema `:22` — otherwise `project.user` is null → `clerkId: string|null` → the `listTestimonialsByOwner` call won't typecheck). Record the orphan/demo/admin-orphan decision in the audit.
     - then require `result.adminOverride || result.project.userId === result.userRecord?.id` — else `notFound()`.
     - **Do NOT pass `claimIfOrphan`.**
   - On pass: `project.findUnique({tokenId})` (include the owning user relation) + `publishedPage.findFirst({where:{projectId: project.id}})` (keyed on `projectId`, NEVER a cross-space userId join).
   - **C2 — return the OWNER's `clerkId` for Clerk-keyed reads.** `Testimonial.userId` is a CLERK id (third ID space); pages must not guess which space to use. The wrapper returns `clerkId` = **the project OWNER's Clerk id**, resolved via the `Project → User` relation (`project.user.clerkId` — schema names confirmed: `prisma/schema.prisma:23` relation, `:12` `User.clerkId`). Non-null by construction post-D2. Under `adminOverride`, the admin's own clerkId is used ONLY for the `isAdmin` check + audit log — returning it would make owner-scoped Clerk reads (testimonials) silently blank on god-view (same silent-zero-rows bug class C2 exists to kill; this keeps R8 working). **Return `{project, publishedPage|null, adminOverride, clerkId}`.**
   - Page-shaped wrapper only — `src/lib/security.ts` is NOT edited.
   - ⚠️ Audit: routing analytics/forms/blog through this ADDS admin god-view where slug routes silently 404'd admins. Intended (spec), but a real behavior change.
2. `src/lib/workspace.test.ts` (new, vitest, mocked prisma/auth/assertProjectOwner): non-owner `{ok:false,403}` → notFound; missing → notFound; **orphan (`userId:null` w/ `ok:true`) → notFound (B3)**; **orphan + adminOverride → notFound (D2)**; **demo token (`isDemo`, `project:null`) → notFound (B3)**; owner → data + own `clerkId`; **admin → data + `adminOverride:true` + `clerkId` = OWNER's Clerk id, not the admin's (C2)**.
3. `src/app/dashboard/[token]/layout.tsx` (new): calls `getWorkspaceProject` for **chrome data only** — ⚠️ NOT an auth boundary (scout §A: layouts don't re-run as guards; every nested page re-checks). Renders `WorkspaceHeader` + `WorkspaceTabs` above `{children}`. (Root `DashboardTopBar` already self-suppresses on token paths — phase 1.)
4. `src/components/dashboard/WorkspaceHeader.tsx` (new) per §E 3a: back-link "All Projects" → `/dashboard`, breadcrumb sep, 30px thumb, project name, status chip (Live green / Draft amber), domain text, `ml-auto`: **Visit** (outline, `/p/{slug}`, disabled unpublished) + **Open editor** (primary) → **`continueRouting.ts` UNCONDITIONALLY (B5)** — published and draft alike; the util owns the `project_edit_clicked` fire. No bell (design).
5. `src/components/dashboard/WorkspaceTabs.tsx` (new): **Link-based tab bar** (R13 — no `TabsContent`); hand-roll to §E underline spec. Order (R2): **Overview · Blog · Leads · Testimonials · Analytics · Grow**; Grow = greyed non-link stub (R2). Active via `usePathname()`.
6. `src/app/dashboard/[token]/page.tsx` (new, async server) — Overview per R3: calls `getWorkspaceProject` itself (re-check), renders "QUICK ACTIONS" eyebrow + 4-card row ONLY (exact cards from handoff 3a markup); cards greyed where route/track absent or kill-switched (`NEXT_PUBLIC_*_DISABLED`, same flags as old `ProjectCard.tsx:28-36`). OUT: KPI cards, Recent-leads panel, Pages panel (R3).
7. **Re-point (from phase 2):** in `ProjectGridCard.tsx` (+ `dashboard/page.tsx` if props change), published-card "Open" + name/thumbnail click → `/dashboard/{tokenId}`. Draft "Continue" keeps `continueRouting.ts`. "Open" now fires NO PostHog event (workspace nav — B5 single-call-site rule intact inside the util).
8. Route-shadow caveat (scout §B): `[token]` resolves after literal siblings — static-first, no action; note in audit.
9. `e2e/dashboard-workspace.spec.ts` (new, authed): unauth `/dashboard/<anything>` → sign-in redirect; authed + bogus token → 404; **authed + demo token `lessgodemomockdata` → 404 (B3/D2)**; owner + real token → header + 6 tabs, Grow disabled; Overview = quick actions, NO KPI markup. (Orphan rejection = unit-tested — e2e can't seed an orphan; founder gate re-checks.)

**Files touched:**
- `src/lib/workspace.ts` (new)
- `src/lib/workspace.test.ts` (new)
- `src/app/dashboard/[token]/layout.tsx` (new)
- `src/app/dashboard/[token]/page.tsx` (new)
- `src/components/dashboard/WorkspaceHeader.tsx` (new)
- `src/components/dashboard/WorkspaceTabs.tsx` (new)
- `src/app/dashboard/page.tsx` (re-point only)
- `src/components/dashboard/ProjectGridCard.tsx` (re-point only)
- `e2e/dashboard-workspace.spec.ts` (new)

**Verification:** `tsc`; `npm run test:run` (workspace.test.ts incl. orphan/admin-orphan/demo/C2-clerkId cases green); `npx playwright test e2e/dashboard-workspace.spec.ts`; manual: grid "Open" lands on workspace; draft workspace shows Draft chip + disabled Visit; demo-token URL 404s from a normal account.

---

## Phase 4 — Re-home Analytics + Leads under `[token]` (+ 8 co-located components), slug shims  ⚠️ auth-adjacent

**Build:**
1. `src/app/dashboard/[token]/analytics/page.tsx` (new): body moved from `analytics/[slug]/page.tsx` (no reskin). Entry `getWorkspaceProject(token)`; `publishedPage` null → locked state per R10 (icon + line + "Publish to see analytics"); else `pageAnalytics` by `publishedPage.slug` exactly as today. **D1 — re-point the date-range links (`analytics/[slug]/page.tsx:226`)** from `/dashboard/analytics/{slug}?days={d}` → **`/dashboard/{token}/analytics?days={d}`**; the new page reads `searchParams.days` exactly as today. (A verbatim copy would aim the 7/30/90 pills at the shim, and the shim preserves no query → every range click bounces out of the workspace and silently renders the default range — same bug class as C1.) No other internal links in this body need re-pointing — back-link `:203` → `/dashboard` and site link `:211` → external host are both fine (`forms/[slug]/page.tsx` verified clean: only `/dashboard` `:74`, `/p/{slug}` `:160`).
2. **C3 — move ALL 7 analytics local components** (fully enumerated; move-and-co-locate ruling: shim dir keeps ONLY the shim) from `src/app/dashboard/analytics/[slug]/components/` → `src/app/dashboard/[token]/analytics/components/`: `CtaBreakdown.tsx`, `DeviceBreakdown.tsx`, `EmptyState.tsx`, `ExportCSV.tsx`, `MetricsCards.tsx`, `TrafficSourcesTable.tsx`, `TrendChart.tsx`. ⚠️ **`analytics/[slug]/components/EmptyState.tsx` is a DIFFERENT file from `src/components/dashboard/EmptyState.tsx`** (which phase 6 deletes) — do not conflate; the analytics one MOVES and lives on, the dashboard one DIES.
3. `src/app/dashboard/[token]/analytics/loading.tsx` (new): old skeleton minus Header.
4. `src/app/dashboard/[token]/leads/page.tsx` (new): body moved from `forms/[slug]/page.tsx`; `FormSubmissionsTable` unreskinned. Entry `getWorkspaceProject`; unpublished → locked state ("Publish to start collecting leads"). Query `formSubmission.findMany({where:{publishedPageId: publishedPage.id}})` — **drop old `userId` filter** (reviewer-cleared: unique FK to a page whose ownership was just asserted; required for admin god-view). Audit-note it.
5. **`ExportFormCSV.tsx`** (imported `./components/ExportFormCSV`, `forms/[slug]/page.tsx:7`): move → `src/app/dashboard/[token]/leads/components/ExportFormCSV.tsx` (C3 co-location rule; shim doesn't need it).
6. Node-runtime server-page redirect shims (scout §B: middleware edge/no-Prisma; no next.config redirects; **shim dirs stay real** or `[token]` swallows `/dashboard/analytics/foo`):
   - `src/app/dashboard/analytics/[slug]/page.tsx` → shim: `publishedPage.findFirst({where:{slug}, select:{projectId}})` → `project.findUnique` (select tokenId) → `redirect('/dashboard/{tokenId}/analytics')`; missing slug/projectId → `notFound()`. Shims redirect **unconditionally** — target enforces authz (post-B3/D2, target rejects orphans/demo). Audit-note.
   - `src/app/dashboard/analytics/[slug]/loading.tsx` → **delete** (instant server redirect).
   - `src/app/dashboard/forms/[slug]/page.tsx` → shim → `/dashboard/{tokenId}/leads`.
7. `e2e/dashboard-redirects.spec.ts` (new, authed; published fixture via publish-flow pattern): `/dashboard/analytics/{slug}` → `/dashboard/{token}/analytics`; `/dashboard/forms/{slug}` → `.../leads`; unknown slug → 404.

**Files touched:**
- `src/app/dashboard/[token]/analytics/page.tsx` (new — moved; **`:226` day-links re-pointed, D1**)
- `src/app/dashboard/[token]/analytics/loading.tsx` (new)
- `src/app/dashboard/[token]/analytics/components/CtaBreakdown.tsx` (new — moved)
- `src/app/dashboard/[token]/analytics/components/DeviceBreakdown.tsx` (new — moved)
- `src/app/dashboard/[token]/analytics/components/EmptyState.tsx` (new — moved; ≠ `components/dashboard/EmptyState.tsx`)
- `src/app/dashboard/[token]/analytics/components/ExportCSV.tsx` (new — moved)
- `src/app/dashboard/[token]/analytics/components/MetricsCards.tsx` (new — moved)
- `src/app/dashboard/[token]/analytics/components/TrafficSourcesTable.tsx` (new — moved)
- `src/app/dashboard/[token]/analytics/components/TrendChart.tsx` (new — moved)
- `src/app/dashboard/analytics/[slug]/components/CtaBreakdown.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/components/DeviceBreakdown.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/components/EmptyState.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/components/ExportCSV.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/components/MetricsCards.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/components/TrafficSourcesTable.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/components/TrendChart.tsx` (delete — moved)
- `src/app/dashboard/[token]/leads/page.tsx` (new)
- `src/app/dashboard/[token]/leads/components/ExportFormCSV.tsx` (new — moved)
- `src/app/dashboard/forms/[slug]/components/ExportFormCSV.tsx` (delete — moved)
- `src/app/dashboard/analytics/[slug]/page.tsx` (rewrite → shim)
- `src/app/dashboard/analytics/[slug]/loading.tsx` (delete)
- `src/app/dashboard/forms/[slug]/page.tsx` (rewrite → shim)
- `e2e/dashboard-redirects.spec.ts` (new)

**Verification:** `tsc`; `npx playwright test e2e/dashboard-redirects.spec.ts e2e/dashboard-workspace.spec.ts`; manual: published project's analytics/leads identical to before (incl. both CSV exports working); **date-range pills stay on the token URL and change the range (D1)**; draft shows locked states; no `components/` dir remains under either shim; admin opens another user's analytics via token URL (NEW behavior — confirm rendering).

---

## Phase 5 — Re-home Blog + Testimonials under `[token]` (+ 4 co-located components, URL re-points), blog shims (preview NOT re-homed — B2)  ⚠️ auth-adjacent

**Build:**
1. `src/app/dashboard/[token]/blog/page.tsx` (new): body moved from `blog/[slug]/page.tsx`; old slug→token hop (`:30-34`) now unnecessary. **R18:** blog tab locks pre-publish — status-quo (old route was publish-gated; blogIndex/subscriber count need a `PublishedPage`, scout §B `:49-51`); same R10 locked state ("Publish to start blogging"). Audit-note: `BlogPost.projectId` is token-reachable → pre-publish blog = viable later slice. Published: `blogPost.findMany({projectId: project.id})` as today.
2. **C1 — move + re-point the 4 blog local components** (C3 co-location rule; components must not self-redirect through the shims they'd otherwise live behind):
   - `blog/[slug]/components/BlogPostsTable.tsx` → `[token]/blog/components/BlogPostsTable.tsx`; **re-point `:77` and `:97`** router pushes from `/dashboard/blog/{slug}/{postId}` → **`/dashboard/{token}/blog/{postId}`** (pass token down as prop; never bounce through the shim from inside the tab).
   - `blog/[slug]/components/NewPostButton.tsx` → `[token]/blog/components/NewPostButton.tsx`; **re-point `:22`** the same way.
   - `blog/[slug]/[postId]/components/BlogPostEditor.tsx` → `[token]/blog/[postId]/components/BlogPostEditor.tsx`; **`:178` preview link DELIBERATELY stays on the OLD slug URL** `/dashboard/blog/{slug}/{postId}/preview` (B2: preview lives in the `(blog-preview)` route group, token-less, no `[token]` twin, no shim). **Add a one-line code comment explaining this so nobody "fixes" it.**
   - `blog/[slug]/[postId]/components/BlogRichTextEditor.tsx` (imported by BlogPostEditor via `./BlogRichTextEditor`) → move alongside → `[token]/blog/[postId]/components/BlogRichTextEditor.tsx`.
3. `src/app/dashboard/[token]/blog/[postId]/page.tsx` (new): moved; preserve the `post.projectId === project.id` integrity check (equivalent to today's `publishedPage.projectId` check post-authz). **C1: re-point the `:43` back-link** from the old slug URL → **`/dashboard/{token}/blog`**. **D3: `BlogPostEditor` still needs `slug` for its `:178` preview link — the page sources it from the wrapper's `publishedPage.slug`, NOT a route param;** R18's publish-gate makes it non-null here, so this is safe.
4. `src/app/dashboard/[token]/testimonials/page.tsx` (new): per-project tab. Reuse `TestimonialModerationList` + dialogs as-is. **C2 — third ID space:** `Testimonial.userId` = CLERK id (`repo.ts:82-94`); call **`listTestimonialsByOwner(clerkId, { projectId: project.id })`** using the wrapper's owner-resolved `clerkId` — NEVER `project.userId` (internal id; silently returns zero rows, tsc-green). Under admin god-view the wrapper already returns the OWNER's clerkId, so R8 holds. **The util ALREADY accepts `{projectId}`** (`repo.ts:93`, used by `autoImport.ts:58`) — **NO util edit needed**; grep callers once to confirm signature understanding before wiring, but change nothing.
   - **R19:** account-level `/dashboard/testimonials` stays live, behavior-unchanged (phase-1 Header removal aside), unlinked from sidebar; owner-scoped as today.
5. Blog shims (dirs stay real, hold only shims):
   - `src/app/dashboard/blog/[slug]/page.tsx` → shim → `/dashboard/{tokenId}/blog`
   - `src/app/dashboard/blog/[slug]/[postId]/page.tsx` → shim → `/dashboard/{tokenId}/blog/{postId}`
   - **No preview shim** (B2 — preview URL unchanged, live via `(blog-preview)` group).
6. Extend `e2e/dashboard-redirects.spec.ts`: both blog URL shapes redirect; preview URL still 200s WITHOUT redirect and without `.app-chrome`; `[token]/testimonials` renders for owner; **in-tab navigation stays on `/dashboard/{token}/...` with NO redirect hop (C1/D1): blog table row → post, post back-link, AND the analytics date pills (`?days=` preserved, range changes)**.

**Files touched:**
- `src/app/dashboard/[token]/blog/page.tsx` (new)
- `src/app/dashboard/[token]/blog/components/BlogPostsTable.tsx` (new — moved, re-pointed `:77,:97`)
- `src/app/dashboard/[token]/blog/components/NewPostButton.tsx` (new — moved, re-pointed `:22`)
- `src/app/dashboard/[token]/blog/[postId]/page.tsx` (new — back-link `:43` re-pointed; slug from `publishedPage.slug`, D3)
- `src/app/dashboard/[token]/blog/[postId]/components/BlogPostEditor.tsx` (new — moved; `:178` preview link stays old slug URL + comment)
- `src/app/dashboard/[token]/blog/[postId]/components/BlogRichTextEditor.tsx` (new — moved)
- `src/app/dashboard/blog/[slug]/components/BlogPostsTable.tsx` (delete — moved)
- `src/app/dashboard/blog/[slug]/components/NewPostButton.tsx` (delete — moved)
- `src/app/dashboard/blog/[slug]/[postId]/components/BlogPostEditor.tsx` (delete — moved)
- `src/app/dashboard/blog/[slug]/[postId]/components/BlogRichTextEditor.tsx` (delete — moved)
- `src/app/dashboard/[token]/testimonials/page.tsx` (new)
- `src/app/dashboard/blog/[slug]/page.tsx` (rewrite → shim)
- `src/app/dashboard/blog/[slug]/[postId]/page.tsx` (rewrite → shim)
- `e2e/dashboard-redirects.spec.ts`

**Verification:** `tsc`; `npm run test:run`; `npx playwright test e2e/dashboard-redirects.spec.ts`; manual: blog list/post identical under new URLs; table row → post → back-link all token-URLs, zero redirect hops; preview from post editor renders template markup, no app chrome (pilot vishwas-dubey blog = real fixture, custom domain — don't break); per-project testimonials filtered AND non-empty for a project that has testimonials (C2 silent-zero-rows check); admin god-view on `[token]/testimonials` shows the owner's entries; account-level testimonials page unchanged (R19); no `components/` dirs left under blog shim paths.

---

## Phase 6 — Dead-component cleanup + docs + full gates  🔒 **HUMAN GATE**

**Build:**
1. **B4 guard:** grep every `handleEdit` consumer / `ProjectCard` import BEFORE deleting — confirm all editor-opening paths route through `continueRouting.ts` (4 branches + 2 fallbacks intact) and no reader is dropped. Then **delete**:
   - `src/components/dashboard/Header.tsx`
   - `src/components/dashboard/DashboardHeader.tsx`
   - `src/components/dashboard/ProjectCard.tsx`
   - `src/components/dashboard/EmptyState.tsx`  (⚠️ the dashboard one — NOT `[token]/analytics/components/EmptyState.tsx`, which moved in phase 4 and lives on)
   - `src/components/dashboard/Footer.tsx` (dead per scout §D)
   (Keep: `PersonaUpdatedBanner`, `FormSubmissionsTable`, `testimonials/*`.)
2. **D4 — update `src/app/README.md:80-83`:** the route table documents the old slug routes — update to the new `/dashboard/[token]/*` shape + one-line note on the shims.
3. Run ALL gates: `npx tsc --noEmit` · `npm run test:run` · `npm run lint` (pre-push hook parity) · `npm run build` · full Playwright dashboard suite + `e2e/ui-isolation.spec.ts` + existing `publish.spec.ts`.
4. Acceptance-criteria sweep vs spec; write audit. Merge-gate summary MUST list: **R17b follow-up candidate** (prompt-text → onboarding prefill slice) + **B3/D2 orphan/demo/admin-orphan rejection decision** + **null-projectId count result** (gate item 4) + **D5 known extra-hop callers** (see RESOLVED item 18 — record only, do NOT fix).

**Files touched:**
- `src/components/dashboard/Header.tsx` (delete)
- `src/components/dashboard/DashboardHeader.tsx` (delete)
- `src/components/dashboard/ProjectCard.tsx` (delete)
- `src/components/dashboard/EmptyState.tsx` (delete)
- `src/components/dashboard/Footer.tsx` (delete)
- `src/app/README.md` (route table `:80-83` update — D4)

**Verification:** all gates green (tsc / test:run / lint / build / e2e).

**🔒 HUMAN GATE (mandatory, before merge — spec's authz gate):** founder manually confirms:
1. Second (non-owner) account: every `/dashboard/[token]/*` surface (overview, analytics, leads, blog, blog post, testimonials) → 404. E2e can't fully cover this (single Clerk session) — this is the real check.
2. Admin account: god-view on grid AND re-homed token surfaces — **including the NEW admin god-view on analytics/leads/blog that slug routes never had** (intended change; sign off explicitly), and **testimonials showing the OWNER's entries, not blank (C2)**.
3. **B3/D2 spot-check:** demo token URL (`/dashboard/lessgodemomockdata/...`) → 404 from a normal signed-in account.
4. **Null-projectId audit:** one-line count of `PublishedPage` rows with `projectId IS NULL` (`schema.prisma:154` nullable; publish sets `project?.id || null` — `api/publish/route.ts:216,250`). If any exist: their workspace shows the locked state and their shims 404 a bookmark that works today — surface for founder decision (prod wiped 2026-06-16, expected zero — verify, don't redesign).
5. Old bookmarked slug URLs (analytics/forms/blog×2) redirect correctly; blog preview URL unchanged + chrome-free (B2); in-tab blog nav + analytics day pills have no redirect hops (C1/D1).
6. Main dashboard screen reads 100% final-design; every not-yet-built control greyed in place (Domains R15). **R17b eyeball: greyed toggle+textarea above an enabled "Build my site" — confirm the founder accepts the button-acting-on-dead-field read, or orders the prefill follow-up now.**
7. R17b follow-up review: order the prompt-prefill slice or park it.
Then: merge to **main-LOCAL only, plain merge, DO NOT PUSH** (big-bang with auth + editor-shell).

---

## Risky-surface map

| Phase | Risky surface | Note |
|---|---|---|
| 1 | dual-renderer-adjacent | blog SSR preview must stay chrome-free (B2) — route-group escape + e2e guard |
| 2 | none | pure chrome; isolation guards are the watchpoint |
| 3–5 | auth/ownership | hardened wrapper (B3/D2) + owner-clerkId resolution (C2) + re-keyed queries; NO edit to `security.ts`/middleware; no schema change |
| all | middleware | **untouched** — scout §C: no collision, nesting auto-protected |
| all | editor store / billing / publish path / prisma schema | untouched |

## RESOLVED rulings & review fixes (in force)

1. **R15 — Domains nav GREYED.** No `/dashboard/domains` page; grey-by-existence; spec line 49 superseded. (Phases 1, 2.)
2. **R16 — Card metrics em-dash this slice.** No fabricated numbers, no per-card queries; rollups = S4. (Phase 2.)
3. **R17b (supersedes R17) — empty-state prompt controls DISABLED, CTA live.** Prefill wiring = follow-up slice (audit + gate). (Phases 2, 6.)
4. **R18 — Blog tab locked pre-publish.** Status-quo; R10 locked state; token-reachable posts → later slice. (Phase 5.)
5. **R19 — Old `/dashboard/testimonials` stays live, unlinked.** Behavior/route unchanged (loses Header phase 1 per B1). (Phases 1, 5.)
6. **B1 — 11 Header importers**, incl. `testimonials/page.tsx:5`; `billing/page.tsx` clean. (Phase 1.)
7. **B2 — blog preview escapes shell** via `(blog-preview)` route group; URL unchanged; no re-home, no shim; e2e no-`.app-chrome` guard. (Phases 1, 5.)
8. **B3 — hardened `getWorkspaceProject`:** owner-or-admin ON TOP of `assertProjectOwner`; orphan + demo → 404; no `claimIfOrphan`; unit + e2e tested. (Phase 3.)
9. **B4 — continueRouting = `ProjectCard.tsx:41-84`, 4 branches + 2 fallbacks**; grep `handleEdit` consumers before deletion. (Phases 2, 6.)
10. **B5 — "Open editor" state-aware everywhere** via `continueRouting.ts`; PostHog single call sites (`project_edit_clicked` in util; `project_preview_clicked` in "Visit site"). (Phases 2, 3.)
11. **C1 — blog local components moved + re-pointed:** `BlogPostsTable:77,:97` + `NewPostButton:22` → token URLs (no self-redirect through shims); `BlogPostEditor:178` preview link stays old slug URL deliberately (+ code comment); post page `:43` back-link → token URL. (Phase 5.)
12. **C2 — THREE ID spaces; `Testimonial.userId` = Clerk id.** Wrapper returns owner-resolved `clerkId` (via `project.user.clerkId` — schema confirmed `:23`/`:12`); admin god-view uses OWNER's clerkId for owner-scoped reads (admin's own id only for `isAdmin` + audit log); testimonials call = `listTestimonialsByOwner(clerkId, {projectId})`. (Phases 3, 5, global invariants.)
13. **C3 — Files-touched fully enumerated; move-and-co-locate ruling.** 7 analytics components + ExportFormCSV + 4 blog components move with their pages; shim dirs hold only shims; `analytics .../EmptyState.tsx` ≠ `components/dashboard/EmptyState.tsx`. (Phases 4, 5, 6.)
14. **D1 — analytics `?days` day-links re-pointed** (`analytics/[slug]/page.tsx:226` → `/dashboard/{token}/analytics?days={d}`; new page reads `searchParams.days` as today). Shims preserve no query — in-tab links must never hit a shim. Back-link `:203` + site link `:211` fine; `forms/[slug]` verified clean (`:74`, `:160`). E2e covers the pills. (Phases 4, 5.)
15. **D2 — orphan rejection OUTSIDE the admin short-circuit.** Orphans 404 for admins too (no owner to god-view as); keeps `clerkId` non-null by construction (`Project.userId String?`, schema `:22`). Unit-tested (admin+orphan case); audit-noted. (Phase 3.)
16. **D3 — `[token]/blog/[postId]/page.tsx` sources `slug` from the wrapper's `publishedPage.slug`** (not a route param) for BlogPostEditor's preview link; non-null via R18 publish-gate. (Phase 5.)
17. **D4 — `src/app/README.md:80-83` route table updated** to `/dashboard/[token]/*` + shim note. (Phase 6.)
18. **D5 — RECORD ONLY, do NOT fix here:** `edit/[token]/components/layout/PageSwitcher.tsx:43` → `/dashboard/blog/{slug}` and `admin/page.tsx:370,:378` → old analytics/forms slug URLs route correctly via the shims but take an extra hop. Re-pointing them = clean later cleanup slice — explicitly OUT of scope for this spec. Listed in the merge-gate summary as a follow-up candidate.
19. **Non-blocking folded (rev 3):** testimonials util already takes `{projectId}` (`repo.ts:93`) — no util edit; phase-1 transient `shared/Footer` in forms/blog pages accepted until shims; `<DashboardHeader/>` removal from `dashboard/page.tsx:6,:159` explicit in phase 2; R17b founder-eyeball = gate item 6.
20. **Reviewer-cleared, do not revisit:** B1–B5, C1–C3 as implemented, R17b, R2/R3/R8/R15/R16, ID-space handling, dropping the `userId` filter on `formSubmission.findMany`.
