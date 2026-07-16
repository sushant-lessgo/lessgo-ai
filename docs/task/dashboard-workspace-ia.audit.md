# dashboard-workspace-ia — implementation audit

Branch: `feature/dashboard-workspace-ia` (guard checked before any edit — matched).
Plan: `docs/task/dashboard-workspace-ia.plan.md` rev 4 (FROZEN, not modified).

---

## Phase 1 — Dashboard shell + Header retirement ×11 + blog-preview escape

### Files changed

**New**
- `src/app/dashboard/layout.tsx` — the shell; the ONLY `.app-chrome` attach point.
- `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx` — moved verbatim (B2).
- `src/components/dashboard/AppSidebar.tsx`
- `src/components/dashboard/DashboardTopBar.tsx`
- `src/components/dashboard/NewSiteButton.tsx`
- `e2e/dashboard-shell.spec.ts`

**Modified — orchestrator exception**
- `playwright.config.ts` — **orchestrator exception: `playwright.config.ts` added to Files-touched (plan gap — specs were unregistered).** The frozen plan never registered its e2e specs, so `dashboard-shell.spec.ts` matched no project and would never have run in the pre-push gate (false confidence). Added `dashboard-shell` / `dashboard-workspace` / `dashboard-redirects` to the **`authed`** project's `testMatch` (existing `publish` + `edit-persistence` entries kept), pre-registering the phases 2–5 spec names exactly as the frozen plan names them, so later phases don't re-hit this. Registering a not-yet-existing spec is harmless (matches nothing). Added a comment explaining that an unregistered spec silently matches no project.

**Deleted**
- `src/app/dashboard/blog/[slug]/[postId]/preview/page.tsx` — MOVED (git rm; dir gone, no same-path collision; verified only one `preview` dir remains under the blog tree).

**Modified (Header retirement only — interiors untouched)**
- `src/app/dashboard/page.tsx` · `settings/page.tsx` · `testimonials/page.tsx` · `social/[token]/page.tsx` · `outreach/[token]/page.tsx` · `emails/[token]/page.tsx` · `forms/[slug]/page.tsx` · `blog/[slug]/page.tsx` · `blog/[slug]/[postId]/page.tsx` · `analytics/[slug]/page.tsx` · `analytics/[slug]/loading.tsx` — all 11. `grep dashboard/Header src/app` → none. `billing/page.tsx` confirmed clean, untouched.

### What was built

`dashboard/layout.tsx`: `.app-chrome` wrapper → `AppSidebar` (244px) + column (`DashboardTopBar` + scrollable `<main>`). Fetches `currentUser()` for the profile row. NOT an auth boundary (chrome data only) — noted in the file.

**Plan data (R6) — BEHAVIORAL LANDMINE, ruling confirmed by the orchestrator. DO NOT "simplify" this back to `getUserPlan()`.**
The layout uses a READ-ONLY `prisma.userPlan.findUnique` + `publishedPage.count`. `getUserPlan()` is **get-OR-CREATE**: on a missing row it calls `createDefaultPlan()`, which writes a `UserPlan` **and seeds the one-time, non-refilling FREE credit pool**. This layout renders on EVERY `/dashboard/*` page, so using `getUserPlan()` would make passive chrome silently mutate billing state (and burn a once-ever credit grant) merely because someone opened the dashboard. Read-only + em-dash greying on no-row is the correct and consistent-with-R14 behavior (real or absent, never fabricated). A `🚨`-marked comment at the call site in `layout.tsx` states this so a later refactor doesn't reintroduce it.
Tier → `PLAN_CONFIGS` (planManager) → `{planName, used, limit}`. No plan row → `plan` undefined → widget greys with em-dashes. Both reads are Clerk-id-keyed (`UserPlan.userId` and `PublishedPage.userId` are both Clerk ids) — no cross-ID-space join.

`NewSiteButton`: `/api/start` logic extracted VERBATIM from `DashboardHeader.handleCreatePage` (PostHog `create_page_clicked` → `GET /api/start` → `window.open(url, '_blank')`). DashboardHeader's dead state (`userInput`/`confirmedFields`/`stepIndex`) dropped as instructed. Props (`label`/`icon`/`className`/`location`) added so phase 2 can reuse it in the filter row + empty state.

`DashboardTopBar`: 64px, 2-line title block + spacer + greyed bell; no logo/avatar (R1). Literal-segment title map; **unknown segment (= a token) → `null`** so phase 3's workspace header doesn't double-stack bars.

### R17b / greyed-control treatment

R17b (empty state) is **phase 2** — nothing built here. Phase-1 greyed controls, all per **R12** (`nav-item` has no `disabled` prop and is FROZEN — not modified):
- `DisabledNavItem` local helper in `AppSidebar.tsx` renders `<button disabled aria-disabled="true">` reusing the primitive's exported `navItemClasses()` → a greyed row is pixel-identical to an idle row plus `opacity-50` + `cursor-not-allowed`.
- Greyed: **All Analytics** (S4), **All Leads** (S4, **no count pill** — R14), **Domains** (R15 — grey-by-existence; no page built), **Upgrade** (S3), **bell** (not built).
- Enabled: Projects, Billing & plan, profile gear → `/dashboard/settings` (R7).

### Decisions / judgment calls (in-scope, conservative)

1. **`<Footer/>` removal scope.** Plan step 6 says remove Header "+ dashboard `<Footer/>` where present", and carves out ONLY `forms/[slug]` + `blog/[slug]` as accepted transients. Read literally: dropped `@/components/shared/Footer` from the other 9 where present (page, settings, testimonials, social, outreach, emails, blog/[postId], analytics page + loading); **kept** in `forms/[slug]` + `blog/[slug]` per the explicit "do NOT fix it here". Note the mild inconsistency: `analytics/[slug]/page.tsx` also becomes a shim in phase 4 yet was not carved out — followed the literal text.
2. **Outer page wrappers kept** (`min-h-screen`, `bg-*`, `font-body`) — plan says "import + JSX only, interiors untouched". They now nest inside the shell's scroll container. Cosmetic; phases 2/4/5 rewrite these bodies anyway.
3. **Near-miss colors as arbitrary values, no new Tailwind keys**: sidebar bg `bg-[#fafafb]`, chrome border `border-[#f0f0f3]`, progress track `bg-[#eef0f4]`. Everything else is an `app-*` token.
4. **Plan limit `-1` (unlimited)** renders `{N} of ∞ sites used`, progress bar 0%. Design never covered it.
5. **Avatar uses a plain `<img>`** (+ scoped eslint-disable) — the Clerk image host isn't in `next.config` `images`.
6. All 9 icons used are already in the committed Material Symbols subset (`icons.txt`) — no font regeneration needed.

### Deliberately NOT done

- `Header.tsx` / `DashboardHeader.tsx` NOT deleted — phase 6.
- No middleware change (scout §C verdict holds).
- No foundation edits (`src/components/ui/*` untouched); no stock Tailwind key added/mutated.
- No `/dashboard/domains` page (R15 — later slice).
- No projects grid / empty state (phase 2), no `[token]` spine (phase 3).

### ⚠️ Follow-ups / open risks for the orchestrator

1. **RESOLVED — spec registration.** Was: `playwright.config.ts` in no phase’s Files-touched → `dashboard-shell.spec.ts` matched no project and would never run. **Orchestrator granted an exception**; config edited this phase, all three dashboard spec names pre-registered on `authed`. Verified: `npx playwright test --list --project=authed` → **Total: 10 tests in 4 files**, including all 5 `dashboard-shell.spec.ts` tests. No further action needed for phases 2-5.
2. **B2 runtime guard design — ACCEPTED by the orchestrator; keep both guards as built.** A 404-based no-`.app-chrome` check would be **vacuous**: `src/app/not-found.tsx` is the ROOT boundary, so `notFound()` renders WITHOUT the dashboard layout regardless of where the file sits — it would pass even if the page moved back under `src/app/dashboard/`. Hence two guards: (a) a **structural fs assertion** (preview page present in `(blog-preview)`, absent under `src/app/dashboard/`) — cheap, sound, catches the real regression; (b) a **runtime** check against a real fixture (start → seedDraft → `POST /api/publish` → `POST /api/blog/posts` → GET preview → assert 0 `.app-chrome` + URL unchanged) that `test.skip`s **with a reason** rather than passing silently if the fixture cannot be built. Now registered; runtime path unexecuted this session (no dev server / Clerk creds) — worth a pass at the phase-6 gate.
3. Playwright specs were **not executed** (needs a dev server + Clerk E2E creds; not run per instructions to keep to tsc/test:run/lint). `e2e/ui-isolation.spec.ts` unmodified.
4. Sidebar/top-bar are unverified against the design **by eye** — no browser run. Founder gate item 6 covers this.

### Verification (actual output)

- **`npx tsc --noEmit`** → 1 error, **pre-existing and unrelated**:
  `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'`
  (`src/app/page.tsx` untouched by this phase — `git status` clean for it; `src/assets/images/founder.jpg` exists on disk; a pre-existing asset-typing quirk.) **Zero errors from phase-1 files.**
- **`npm run test:run`** → **Test Files 193 passed | 1 skipped (194); Tests 3331 passed | 18 skipped (3349)**. Config-freeze isolation guard green.
- **`npm run lint`** → **zero errors**; warnings only, all pre-existing (`no-img-element` in templates, `react-hooks/exhaustive-deps` in providers/editor). No warning in any phase-1 file.
- `npm run build` not run (orchestrator runs it once at the end).
- Not committed — orchestrator commits.
