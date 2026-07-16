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

---

## Phase 2 — Projects grid + card + `•••` menu + filter row + empty state

### Files changed

**New**
- `src/components/dashboard/continueRouting.ts` — the state-aware "open project" util (B4/B5).
- `src/components/dashboard/ProjectGridCard.tsx` — 1d grid card.
- `src/components/dashboard/ProjectCardMenu.tsx` — `•••` popover (R4/R11).
- `src/components/dashboard/ProjectFilters.tsx` — filter row + stateful grid board.
- `src/components/dashboard/DashboardEmptyState.tsx` — 1a empty state (R17b).

**Modified — orchestrator exception**
- `src/components/dashboard/NewSiteButton.tsx` — **orchestrator exception: added to Phase 2's Files-touched — `label` widened from `string` to `ReactNode` to avoid an a11y-hostile overlay.** Not foundation (`src/components/ui/*` is untouched and stays frozen); it is phase 1's own component. **Type-only change — the `/api/start` CTA logic is byte-identical.** Strictly additive (`string` is a valid `ReactNode`), so phase 1's sidebar usage typechecks unchanged. Rationale (orchestrator): my first cut layered a transparent full-cover `NewSiteButton` over `pointer-events-none` visuals; that put the accessible name on the invisible button (the ghost card's "Create a new site" / "Describe it — AI drafts in seconds" text unreachable to a screen reader), the focus ring on an invisible element, and made the hit target silently breakable by any padding change. Now the ghost card and the 1a "Build my site" CTA render their content as **real children of the real button** — no overlay anywhere.

**Modified**
- `src/app/dashboard/page.tsx` — render tree only: `<DashboardHeader/>`, `ProjectCard`, `EmptyState` out; `ProjectsBoard` / `DashboardEmptyState` in. **Data fetch byte-unchanged.**
- `e2e/dashboard-shell.spec.ts` — appended a `projects grid (phase 2)` describe (4 tests). `playwright.config.ts` already pre-registers `dashboard-shell.spec.ts` on `authed` (phase-1 exception) — **config NOT touched**.

Nothing outside the phase-2 Files-touched list was edited **except `NewSiteButton.tsx`, added to the list by explicit orchestrator exception (above)**. `src/components/ui/*` untouched; `tailwind.config.js` untouched (`git diff` empty); `.app-chrome` still attached only at `dashboard/layout.tsx`.

### B4 — the six continue-routing branches (ported, not paraphrased)

`ProjectCard.tsx:41-84` was copied into `continueRouting.ts` line-for-line (comments included), with `project.tokenId` reads kept as-is; only the PostHog capture and the `router` were parameterised. All six paths present, in order:

| # | Source | Condition | Destination |
|---|---|---|---|
| 1 | `:55` | `data.finalContent && data.stepIndex === 999` | `/edit/{token}` |
| 2 | `:59` | `data.stepIndex >= 6 && data.featuresFromAI?.length > 0` | `/generate/{token}` |
| 3 | `:63` | bare `data.finalContent` | `/edit/{token}` |
| 4 | `:67` | else | `/onboarding/product/{token}` |
| 5 | `:72` | `!response.ok` | `/onboarding/product/{token}` |
| 6 | `:76` | `catch` (+ `logger.warn`) | `/onboarding/product/{token}` |

Branch 3 is called out in a file-header comment as the silent-killer (content-bearing drafts bouncing to onboarding). `onEdit?.()` was dropped — it was an optional callback no caller ever passed (`ProjectCard` had no consumer supplying it); the util's contract is routing only.

### B5 — PostHog call sites (exactly one each)

- `project_edit_clicked` — **only** in `continueRouting.ts`. `ProjectGridCard`'s three entry points (thumbnail, name, primary button) and `ProjectCardMenu`'s "Open editor" all funnel through the same `openProject()` → `continueRouting`, so the event fires once per click and never zero times. No entry point hard-codes `/edit/{token}` — so no transient 404, and published "Open" is state-aware today exactly as the old published "Edit" was.
- `project_preview_clicked` — **only** in `ProjectCardMenu`'s "Visit site" handler (verbatim from `ProjectCard.handlePreview`, minus the unused `onPreview?.()`).
- `create_page_clicked` — fires from the shared `NewSiteButton` (phase 1), distinguished by `location`: `dashboard_filters`, `dashboard_ghost_card`, `dashboard_empty_state`.

### R17b treatment (empty state)

Segmented toggle: both options `disabled: true`, `value="describe"`, no-op `onValueChange` → design's active/idle pills still render, greyed. Textarea: `disabled` + `aria-disabled`, design placeholder visible. **No sessionStorage stash, no hidden state, nothing reads the field.** "Build my site" is enabled and runs the shared `NewSiteButton` `/api/start` logic verbatim. A 🚨 header comment in the file states why, so nobody "fixes" it.
**Follow-up slice (per plan step 6):** wiring prompt text → onboarding prefill needs (a) `/api/start` to accept an input body and (b) an onboarding prefill param. Clean, self-contained — recommend ordering it if the founder rejects the greyed-field read at gate item 6.

### Judgment calls (in-scope, conservative)

1. **`ProjectsBoard` lives in `ProjectFilters.tsx` — ACCEPTED by the orchestrator.** Filtering is client-side (R16 — no refetch) but `dashboard/page.tsx` is a server component, so filter state and the grid must share a client component; phase 2's Files-touched has no slot for a separate one. `ProjectFilters.tsx` therefore exports the controlled row (`ProjectFilters`) **and** the stateful board (default export `ProjectsBoard`). File name ≠ default export name — deliberate, to avoid touching an unlisted file; a header comment in the file says so. **Follow-up (trivial): rename the file to `ProjectsBoard.tsx`.**
2. **Rich CTAs are real button children (no overlay) — orchestrator ruling; the overlay approach was REJECTED.** `NewSiteButton.props.label` is now `ReactNode` (exception above), so the ghost card (circle + title + sub) and "Build my site" (trailing `arrow_forward`) are children of the real `NewSiteButton`. Accessible name, focus ring and hit target all sit on the actual control; behavior stays single-sourced. The earlier `opacity-0` full-cover overlay is fully removed from both call sites.
3. **`typeLabel` = "Landing page".** Item `type` is the literal `'unified'`, which is meaningless as UI copy. Mapped via `TYPE_LABELS: Record<type, string>` (plan: "typeLabel from existing item `type`"). Not a fabricated metric — every project is a landing page. Design's richer labels ("Local service", "SaaS waitlist") have no data source this slice.
4. **Sub-line for drafts** = `— · Landing page` (plan's "em-dash pattern"); published = `lessgo.ai/p/{slug} · Landing page`.
5. **Page body wrapper replaced.** The old `min-h-screen bg-white … max-w-5xl` wrapper is gone (it fought the shell's own scroll container); the grid now sits in `px-[26px] py-[22px]` per §E. The empty state renders full-bleed so its radial gradient covers the content area. `PersonaUpdatedBanner` preserved on both branches.
6. **`dashboard_header_loaded` is LOST — accepted by the orchestrator, flagged for the merge-gate summary as a FOUNDER CALL (re-home the event vs accept the loss).** It disappears with `<DashboardHeader/>`. The plan doesn't ask to preserve it and specifies no replacement location, so no new home was invented. Scope of the loss:
   - **Identity is intact** — `src/providers/ph-provider.tsx:61` already calls `posthog.identify` for every signed-in user globally; DashboardHeader's copy at `:20` was redundant.
   - **The `/dashboard` pageview is very likely still captured** by PostHog autocapture/`$pageview` via the provider — so the "did they open the dashboard?" signal survives in a different event name.
   - Only the **named `dashboard_header_loaded` event** (with its `user_id`/`email` props) is gone. Any saved insight/funnel keyed on that exact name will flatline from this deploy.
7. **Near-miss colors as arbitrary values** (no new Tailwind keys): draft chip `#9a6a1e`/`#fdf2dc` (R9), metric em-dash `#c0c0c8` (R16), popover border `#e6e6ec`, popover hover `#f4f5f8`, item ink `#2a2a34`, ghost-card dash `#cdd4e2`, ghost circle `#fff0eb`, toggle track `#f2f3f7`, prompt-card border `#e2e6ef`. Card/popover shadows + the 1a radial gradient are arbitrary/inline styles.
8. **R11 — `dropdown-menu` primitive untouched.** All handoff popover styling (w-186, radius 11, `shadow-app-float`, item padding/size/hover, danger Delete) is applied at the call site via `className` on `DropdownMenuContent` / `DropdownMenuItem` / `DropdownMenuSeparator`.
9. **All 16 icons used are already in the committed Material Symbols subset** (`icons.txt`) — no font regeneration.

### Preserved verbatim (checked line-by-line)

- Smart-name fallback chain + `formatField()` (`page.tsx:104-139`) — untouched.
- Admin god-view: `isAdmin` branch, `findMany take:200`, `user.email → ownerEmail`, publishedPages by `projectId in [...]` — untouched. Owner email surfaced on the card as a `text-app-faint` line (R8). "Showing first 200 projects" notice preserved (now `showTruncationNotice` on `ProjectsBoard`, same `viewerIsAdmin && sourceProjects.length === 200` condition).
- Item shape unchanged; `ProjectGridItem` mirrors the old `Project` type (declared locally so phase 6 can delete `ProjectCard.tsx` cleanly).
- `NEXT_PUBLIC_*_DISABLED` kill-switch checks: the Social/Emails/Outreach card buttons are dropped per design, so the flags have no reader in this phase's files. **The three constants and their checks return in phase 3's Overview quick actions (plan step 6).** The surfaces stay reachable at their existing URLs.

### Deliberately NOT done

- No re-point of published "Open" / name / thumbnail to `/dashboard/{tokenId}` — that's phase 3 step 7 (they route via `continueRouting` today, no 404).
- `ProjectCard.tsx` / `EmptyState.tsx` / `DashboardHeader.tsx` NOT deleted — phase 6 (they're now unimported).
- No sessionStorage/prefill wiring (R17b).
- No metrics queries, no rollups, no date field, no Archive/Delete/Rename/Duplicate backends.
- No `/dashboard/domains` (R15). No foundation edit, no Tailwind key, no middleware change.
- `playwright.config.ts` NOT edited (spec name already registered).

### Open risks

1. **Grid is `grid-cols-3` fixed** per §E ("repeat(3,1fr)") — desktop-only by design; narrow viewports will squeeze. No responsive ruling exists.
2. Playwright specs **not executed** (needs a dev server + Clerk E2E creds, per instructions). The 4 new tests self-skip *with reasons* on the wrong project-count branch — the empty-state test only runs on a zero-project account, so R17b likely needs the manual check at gate item 6.
3. The `••• `menu's `data-disabled` assertions depend on Radix's attribute contract; unverified at runtime for the same reason.
4. Card/menu visuals unverified by eye against the handoff — founder gate item 6.

### Impl-review fixes (e2e only — no implementation code changed)

Both in `e2e/dashboard-shell.spec.ts`, both masked today by `test.skip` guards + e2e not running in this phase's gate; both would have detonated at phase 6's full-suite gate.

1. **E1 — `toHaveText` on `•••` items could never pass.** 🚨 **Gotcha worth remembering: `AppIcon` renders the Material Symbols LIGATURE NAME as element text** (`src/components/ui/icon.tsx:33` → `{name}`, `aria-hidden`). An item's `textContent` is therefore `"open_in_newOpen editor"`, not `"Open editor"`, and `toHaveText` is a **whole-string** match (`toContainText` is the substring one) → deterministic failure. Fixed by anchoring at the end: `[/Open editor$/, /Visit site$/, /Rename$/, /Duplicate$/, /Domain settings$/, /Archive$/, /Delete$/]`. A comment in the spec records the trap — **it applies to ANY text assertion on a component containing `AppIcon`**. Accessible-name queries (`getByRole('menuitem', {name})`) are immune: they exclude the `aria-hidden` icon span — the sibling active/greyed assertions were already correct and were left alone.
2. **E2 — `.first()` menu could belong to a draft card.** Card order is `sourceProjects` order (`updatedAt desc`), not published-first, so the first card may be a draft — whose "Visit site" is *correctly* disabled, failing the "exactly 2 active" assertion for the wrong reason. Now anchored to a published card: the innermost `div` containing BOTH the "Published" badge and the "Open" primary (`.last()` = deepest match in document order), then its `Project actions` button.

3. **E3 — the SAME ligature trap at `:61`, in phase 1's block: `toHaveText('All Leads')`.** `DisabledNavItem` (`AppSidebar.tsx:47-62`) renders `<AppIcon/>` **before** `{label}` → textContent is `"move_to_inboxAll Leads"`. The locator was fine (accessible name excludes the `aria-hidden` span); only the assertion was broken. **This one was load-bearing: it IS the R14 guard** — the proof that All Leads ships without a fabricated count pill — so it was silently guarding nothing while looking green, and would have detonated at phase 6's full-suite gate. Fixed to `toHaveText(/All Leads$/)`. The end anchor preserves the R14 intent exactly: the design's pill renders AFTER the label (`margin-left:auto`), so `"move_to_inboxAll Leads7"` still fails. Deliberately NOT weakened to `toContainText`, which would pass with a pill present. Comment added at the call site.

**Sweep — every `toHaveText`/`toContainText`/`getByText` in `e2e/dashboard-shell.spec.ts` re-checked for the trap (3 instances found in one file → assumed a 4th; result: none):**

| Line | Assertion | Verdict |
|---|---|---|
| `:61` | `toHaveText` on a `DisabledNavItem` | **E3 — FIXED** (contains AppIcon) |
| `:146` | `toHaveText` array on `•••` items | **E1 — FIXED** (contains AppIcon) |
| `:174` | `toHaveText('—')` on the metric value | **safe** — value `<span>` is a leaf, no AppIcon |
| `:30,:31` | `getByText('WORKSPACE'/'ACCOUNT')` | safe — leaf `<p>` |
| `:39` | `getByText(...).toHaveCount(0)` | safe — absence check |
| `:90` | `getByText('Create a new site', exact)` | safe — leaf `<span>`; the AppIcon sits in a sibling span |
| `:132` | `getByText('Published', exact)` | safe — badge `<span>`; the status dot is an empty span, no glyph text |
| `:170` | `getByText('views'/'leads'/'conv.', exact)` | safe — leaf label `<span>` |
| `:182` | `getByText('Welcome to Lessgo AI')` | ⚠️ chip contains `<AppIcon name="rocket_launch"/>`, but this is a **`getByText` locator + `toBeVisible`**, not a whole-string text assertion — substring matching, unaffected |

All `getByRole(..., { name })` queries are immune (accessible name excludes `aria-hidden` icon spans) and were left alone. **No further instances.**

The other three phase-2 tests were reviewer-confirmed sound and untouched.

### Merge-gate summary items (phase 2)

1. **Orchestrator exception:** `NewSiteButton.tsx` added to phase 2's Files-touched — `label` widened `string` → `ReactNode` (type-only; overlay rejected on a11y grounds).
2. **R17b follow-up candidate:** prompt-text → onboarding prefill slice (needs `/api/start` input + an onboarding prefill param).
3. **Founder call:** `dashboard_header_loaded` event lost with `<DashboardHeader/>` — re-home or accept (identity + pageview unaffected).
4. **Trivial follow-up:** rename `ProjectFilters.tsx` → `ProjectsBoard.tsx` (default export name).

### Verification (actual output — re-run after the orchestrator's three rulings AND the E1/E2 e2e fixes)

- **`npx tsc --noEmit`** → **exit 0, zero errors**. (Phase 1's pre-existing `src/app/page.tsx(6,26): TS2307 … founder.jpg` no longer reproduces — `next-env.d.ts` regenerated in the interim; unrelated to this phase, nothing was done to it.)
- **`npm run test:run`** → **Test Files 193 passed | 1 skipped (194); Tests 3331 passed | 18 skipped (3349)**. Config-freeze isolation guard green (no Tailwind key touched).
- **`npm run lint`** → **zero errors**; warnings only, all pre-existing (`no-img-element` in templates, `react-hooks/exhaustive-deps` in providers/editor/generation). **No warning in any phase-2 file.**
- `npm run build` / e2e not run (per instructions).
- Not committed — orchestrator commits.

---

## Phase 3 — Token workspace spine + Overview + hardened authz helper ⚠️ SECURITY-CRITICAL

Branch guard: `git branch --show-current` → `feature/dashboard-workspace-ia`. Matched (checked before any edit).

### Files changed

**New**
- `src/lib/workspace.ts` — `getWorkspaceProject(tokenId)`, the authz spine.
- `src/lib/workspace.test.ts` — 11 security regression guards (vitest).
- `src/app/dashboard/[token]/layout.tsx` — workspace chrome (NOT an auth boundary).
- `src/app/dashboard/[token]/page.tsx` — Overview (quick actions only, R3).
- `src/components/dashboard/WorkspaceHeader.tsx` — §E 3a header.
- `src/components/dashboard/WorkspaceTabs.tsx` — Link-based tab bar (R13).
- `e2e/dashboard-workspace.spec.ts` — 5 tests; the spec name was already pre-registered on `authed` (phase-1 exception), so `playwright.config.ts` was NOT touched.

**Modified**
- `src/components/dashboard/ProjectGridCard.tsx` — re-point only (step 7).

**NOT modified** (listed in the plan, no change needed): `src/app/dashboard/page.tsx` — the re-point lives entirely inside the card; no prop change, so the page was left byte-identical (conservative).

`src/lib/security.ts` untouched. `src/components/ui/*` untouched. `git diff tailwind.config.js src/components/ui` → **empty**. No `.app-chrome` added (still only `dashboard/layout.tsx`). No middleware change. No schema change.

### The authz rules as implemented (`src/lib/workspace.ts`)

`assertProjectOwner` RETURNS (never throws) and its `{ok:true}` is NOT "this user owns it". The wrapper's rejection ladder, in order — all four rungs land `notFound()`:

1. `!result.ok` → notFound. (401/403/404; Clerk middleware owns authn.)
2. `result.isDemo || result.project == null` → notFound. **B3** — `security.ts:63-65` returns `{ok:true, project:null, userRecord:null}` for the demo token `lessgodemomockdata` to ANYONE.
3. `result.project.userId == null` (orphan) → notFound. **B3/D2** — `security.ts:98-110` returns `{ok:true}` to ANY authenticated user. Rung 3 sits **OUTSIDE / BEFORE the `adminOverride` short-circuit**: an orphan has no owner to god-view *as*, and rejecting it for admins too is what makes the returned `clerkId` non-null **by construction** (`Project.userId String?`).
4. `!result.adminOverride && result.project.userId !== result.userRecord?.id` → notFound. (`userRecord` null ⇒ `undefined !== string` ⇒ reject.)

Rungs 2–4 all short-circuit **before** any display query — no data is read on a rejected path (asserted).

- **`claimIfOrphan` is never passed** (asserted). A page render must not mutate ownership.
- **Returned `clerkId` = the OWNER's** (`project.user.clerkId` via the `Project → User` relation, `schema.prisma:23`/`:12`), **not the requesting admin's**. The admin's own clerkId is used only inside `assertProjectOwner` for `isAdmin` + `logAdminOverride`. Returning it would make owner-scoped Clerk-keyed reads (`Testimonial.userId` = Clerk id) silently return zero rows on god-view — blank, not an error. Phase 5's `listTestimonialsByOwner(clerkId, {projectId})` consumes this.
- **THREE ID spaces honoured:** `publishedPage.findFirst({where:{projectId: project.id}})` — keyed on `projectId`, never a cross-space userId join (asserted).
- Return shape: `{project:{id,tokenId,title}, publishedPage:{id,slug,title}|null, adminOverride, clerkId}`.
- `if (!project || !project.user) notFound()` after the gate: unreachable in practice post-rung-3, but a delete racing between the two reads must 404, not crash.
- ⚠️ **Behavior change (intended, per spec):** routing analytics/forms/blog through this ADDS admin god-view where the slug routes silently 404'd admins. Founder gate item 2.
- **Layout is NOT an auth boundary.** `[token]/layout.tsx` calls the wrapper for chrome data only; `[token]/page.tsx` calls it independently. Both files carry a 🚨 comment saying so. Within a request React `cache()` dedupes.

### Judgment calls (in-scope, conservative)

1. **`cache` from `react` does not exist at runtime under vitest** (React 18.3.1 exports no `cache`; Next aliases `react` to its bundled canary server-side — `tsc` is green because @types/react declares it). Importing `workspace.ts` in a unit test therefore crashes at module load. Fixed **in the test, not in prod code**: `vi.mock('react', () => ({ cache: fn => fn }))` (identity ⇒ no memoisation ⇒ each test really re-runs the ladder). Prod code uses `cache()` exactly as the plan specifies. A module-level Map was considered and **rejected** — it would cache one user's project across requests (a comment in the file forbids it).
2. **Quick-action card #1 "Write a blog post" → `/dashboard/{token}/blog` is ENABLED** even though that route only lands in phase 5. Same target as the Blog tab, which R2 requires as an enabled link — a mid-pipeline 404 is unavoidable and is not a shipped state. R3's "greyed where route absent" is judged against the feature's end state.
3. **Card #3 sub-copy: design says "3 emails active" — a fabricated count (R14).** Replaced with "Goal-matched email copy". Title/icon/tint unchanged.
4. **Card #4 "Request testimonials" → GREYED.** No per-project collection route exists (`CollectLinksDialog` is an account-page dialog, not a route). Grey-by-existence.
5. **Cards #2/#3 read the same kill-switches the retired `ProjectCard.tsx:28-36` did** — `NEXT_PUBLIC_SOCIAL_POSTS_DISABLED` → `/dashboard/social/{token}`, `NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED` → `/dashboard/emails/{token}`. Read at render time (server component), not at module load, so a flag flip needs no rebuild. `NEXT_PUBLIC_COLD_OUTREACH_DISABLED` has no card — the design's 4 cards contain no Outreach action; `/dashboard/outreach/{token}` stays reachable at its URL.
6. **Step 7 re-point:** a **published** card's "Open" + name + thumbnail → `router.push('/dashboard/{tokenId}')`, firing **no** PostHog event (workspace nav, not an editor open). **Draft** cards keep `continueRouting` (a draft has no workspace worth landing on; the plan says so). The `•••` "Open editor" now uses a separate `openEditor()` → `continueRouting` for BOTH statuses (B5) — previously it shared the card's handler, which the re-point would have silently turned into workspace nav. `project_edit_clicked` still has exactly one call site (inside `continueRouting`); no double-fire, no zero-fire from the header either (WorkspaceHeader's "Open editor" calls the util unconditionally and captures nothing).
7. **Workspace title = `project.title`** (fallback `'Untitled Project'`, `stripHTMLTags`) — the `emails/[token]` precedent. The grid's smart-name fallback chain isn't reachable from the wrapper's shape; not duplicated.
8. **Draft header: domain text omitted entirely** (not an em-dash) and **Visit greyed in place** — R14 (real or absent) + completeness principle.
9. **Near-miss colors as arbitrary values, no new Tailwind keys**: chrome border `#f0f0f3`, outline-button border `#e6e6ec`, breadcrumb sep `#c8c8d0`, back-arrow `#9a9aa4`, draft amber `#9a6a1e`/`#fdf2dc`, quick-action hover border `#cfe0ff`, orange tile `#fff0eb`. Everything else `app-*`.
10. All icons used (`arrow_back`, `open_in_new`, `edit`, `auto_awesome`, `campaign`, `mail`, `ios_share`) are already in the committed Material Symbols subset (`public/fonts/material-symbols-rounded/icons.txt`) — no font regeneration.
11. **Route-shadow caveat (scout §B), recorded:** `[token]` resolves AFTER literal siblings (`billing`, `settings`, `testimonials`, `analytics`, `forms`, `blog`, `emails`, `outreach`, `social`) — static-first, so no collision today. A token literally equal to one of those words would be shadowed. No action; noted in `layout.tsx`.

### Deliberately NOT done

- **No KPI cards, no "Recent leads" panel, no "Pages on this site" panel** (R3) — and no rollup queries anywhere.
- **No `TabsContent`** (R13) — the tab bar is hand-rolled Links; `@/components/ui/tabs` is not imported.
- **Grow is a disabled `<button>` stub, not the hub** (R2).
- No edit to `src/lib/security.ts`, `src/components/ui/*`, `tailwind.config.js`, `playwright.config.ts`, middleware, or the schema.
- No re-home of analytics/leads/blog/testimonials and no shims (phases 4–5) — those four tabs 404 until then.
- `src/app/dashboard/page.tsx` left untouched (no prop change needed for the re-point).

### Open risks

1. **Playwright not executed** (needs a dev server + Clerk E2E creds; per instructions only tsc/test:run/lint were run). `--list --project=authed` confirms all 5 new tests are collected (**Total: 19 tests in 5 files**).
2. The `workspace unauthenticated` block relies on `test.use({storageState:{cookies:[],origins:[]}})` overriding the project-level `storageState` — standard Playwright, unverified at runtime here.
3. Header/tab visuals unverified by eye against the handoff — founder gate item 6.
4. Non-owner 404 remains **founder-gate-only** (single Clerk session in e2e); orphan / admin-orphan rejection is unit-tested only (e2e cannot seed an orphan). Both called out in the spec file's header comment.

### Merge-gate summary items (phase 3)

1. **B3/D2 decision recorded:** demo + orphan → 404 **for everyone, admins included**; `claimIfOrphan` never passed; wrapper returns the OWNER's clerkId (C2).
2. **NEW admin god-view** on token-routed analytics/leads/blog (slug routes 404'd admins) — intended, needs explicit sign-off (gate item 2).
3. Design deviation: quick-action "3 emails active" → "Goal-matched email copy" (R14 — no fabricated counts).
4. `react`'s `cache` is Next-server-only at runtime — any future unit test importing `workspace.ts` must mock it (see `workspace.test.ts` header).

### Verification (actual output)

- **`npx tsc --noEmit`** → **exit 0, zero errors**.
- **`npm run test:run`** → **Test Files 194 passed | 1 skipped (195); Tests 3342 passed | 18 skipped (3360)** — +11 = the new `workspace.test.ts` guards. Config-freeze isolation guard green.
- **`npm run lint`** → **zero errors**; warnings only, all pre-existing (`react-hooks/exhaustive-deps` in providers/editor/generation). No warning in any phase-3 file.
- `git diff tailwind.config.js src/components/ui` → **empty** (foundation frozen).
- `npx playwright test --list --project=authed` → **Total: 19 tests in 5 files** (5 from `dashboard-workspace.spec.ts`).
- `npm run build` / e2e execution not run (per instructions).
- Not committed — orchestrator commits.

### Impl-review fixes S1–S3 (TEST FILES ONLY — zero implementation changes)

Verdict was **ship**; implementation is final and was not touched. `src/lib/workspace.ts` was temporarily mutated ONLY to empirically prove the new guards fail on a rung deletion, then restored — `diff` against a pre-mutation backup confirms it is **byte-identical** (the file is untracked, so `git diff` would prove nothing here). All three fixes land in `src/lib/workspace.test.ts` and `e2e/dashboard-workspace.spec.ts`.

**S1 — rung 3 (orphan) is now mutation-proof.** The reviewer was right: the non-admin orphan test would still pass with rung 3 deleted (rung 4 catches it incidentally, `null !== 'user_internal_stranger'`), so it documents the B3 hole from a stranger's POV but pins nothing. A comment now says exactly that. The **admin+orphan** test is the discriminating case (rung 4 can't catch it — `adminOverride` short-circuits) and is now labelled 🚨 **THE SOLE GUARD for rung 3 / the D2 ruling, DO NOT WEAKEN OR DELETE**. It now:
  - seeds the row a real orphan would return (`user: null`) so a rung-3 deletion takes the realistic path instead of crashing on an unseeded mock — which is precisely why `rejects.toThrow` alone is **vacuous** here: the `:122` race-guard throws the SAME `NotFoundError`, i.e. the right outcome for the wrong reason (an orphan read that rung 3 exists to prevent);
  - keeps `expect(db.project.findUnique).not.toHaveBeenCalled()` with an explicit **LOAD-BEARING** comment + a failure message ("an admin reached the DB") — it is the only assertion that fails on the mutation;
  - adds `expect(db.publishedPage.findFirst).not.toHaveBeenCalled()`;
  - renamed to "…**before any display read** (D2)" so the test name states the actual contract.

**S2 — `isDemo` sub-clause now exercised in isolation.** New test: `isDemo: true` with a **non-null project owned by the caller**, so rung 4 would happily pass and only the `result.isDemo ||` clause can reject. A comment records that `security.ts:63-65` always pairs `isDemo` with `project:null` today, so this guards the **wrapper's contract** against a future `security.ts` change rather than a live hole.

**Mutation testing — empirical proof both guards bite** (each mutation applied to `workspace.ts`, suite run, then restored):

| Mutation | Result |
|---|---|
| rung 3 deleted (`\|\| result.project.userId == null` removed) | **1 failed | 11 passed** — `rejects an orphan project for an ADMIN too, before any display read (D2)` × |
| isDemo clause deleted (`result.isDemo \|\|` removed) | **1 failed | 11 passed** — `rejects isDemo even when the gate also returns a real, owned project (rung 2)` × |

Before S1/S2 both mutations were **silent**. `workspace.test.ts` is now 12 tests (was 11).

**S3 — e2e tab order is now actually asserted.** `dashboard-workspace.spec.ts` claimed "design order" and carried a `position ${i}` failure message while asserting visibility only — a message that would lie about what failed. Replaced with a real DOM-order assertion on the tab bar's children: `expect(tabBar.locator('a, button')).toHaveText(['Overview','Blog','Leads','Testimonials','Analytics','Grow'])`, which fails on any permutation. Safe from the AppIcon ligature trap — tab labels carry no icon (the active tab's only child is the empty underline span); a comment records why. The Grow disabled/aria-disabled assertions are unchanged.

Everything the reviewer cleared (R13/R2/R3/R14, kill-switches, B5, scope, isolation) was left untouched.

**Verification after S1–S3 (actual output)**

- **`npx tsc --noEmit`** → **exit 0, zero errors**.
- **`npm run test:run`** → **Test Files 194 passed | 1 skipped (195); Tests 3343 passed | 18 skipped (3361)** (+1 vs the pre-S2 run = the new isDemo isolation guard).
- **`npm run lint`** → **zero errors** (warnings only, all pre-existing).
- `npx playwright test --list --project=authed` → **Total: 19 tests in 5 files** (unchanged — S3 edited an existing test).
- `diff` vs pre-mutation backup → `src/lib/workspace.ts` **IDENTICAL**; rung 2/3 line intact at `:105`.
- Not committed — orchestrator commits.

---

## Phase 4 — Re-home Analytics + Leads under `[token]` + slug shims ⚠️ auth-adjacent

Branch guard: `git branch --show-current` → `feature/dashboard-workspace-ia`. Matched (checked before any edit).

### Files changed

**New**
- `src/app/dashboard/[token]/analytics/page.tsx` — moved body; **D1 day-links re-pointed**.
- `src/app/dashboard/[token]/analytics/loading.tsx` — old skeleton (Header already gone since phase 1).
- `src/app/dashboard/[token]/leads/page.tsx` — moved body; `userId` filter dropped.
- `e2e/dashboard-redirects.spec.ts` — 5 tests. Spec name was already pre-registered on `authed` (phase-1 exception) → `playwright.config.ts` NOT touched.

**Moved (`git mv` — rename detected, history preserved)**
- 7 analytics components `analytics/[slug]/components/*` → `[token]/analytics/components/*`: `CtaBreakdown`, `DeviceBreakdown`, `EmptyState`, `ExportCSV`, `MetricsCards`, `TrafficSourcesTable`, `TrendChart`. **Contents byte-identical** — all 7 are self-contained (only `lucide-react` / `recharts` / `next/link` imports; no relative import crossed a directory). ⚠️ `[token]/analytics/components/EmptyState.tsx` is the analytics one and LIVES ON — NOT `src/components/dashboard/EmptyState.tsx`, which phase 6 deletes.
- `forms/[slug]/components/ExportFormCSV.tsx` → `[token]/leads/components/ExportFormCSV.tsx` (byte-identical).
- Both now-empty `components/` dirs removed from disk → **each shim dir holds ONLY the shim** (C3).

**Rewritten → shims**
- `src/app/dashboard/analytics/[slug]/page.tsx`
- `src/app/dashboard/forms/[slug]/page.tsx`

**Deleted**
- `src/app/dashboard/analytics/[slug]/loading.tsx` — the route is now an instant server redirect; nothing to stream.

Nothing outside phase 4's Files-touched list was edited. `git diff tailwind.config.js src/components/ui` → **empty**. No `.app-chrome` added (still only `dashboard/layout.tsx`). `src/middleware.ts`, `src/lib/security.ts`, `src/lib/workspace.ts`, the schema and `playwright.config.ts` are all untouched.

### Ownership check per moved surface

Both pages call **`getWorkspaceProject(params.token)` THEMSELVES** as their first statement — the `[token]/layout.tsx` call is chrome data only and is NOT an auth boundary. Each carries a 🚨 header comment saying so. Within a request React `cache()` dedupes.

The old `publishedPage.findFirst({ slug, userId })` scope is gone; the wrapper's ladder replaces it and both pages then key strictly on wrapper-returned ids:

| Surface | Display query | Keyed on | ID space |
|---|---|---|---|
| Analytics | `pageAnalytics.findMany({ slug, date })` | `publishedPage.slug` from the wrapper | n/a (`PageAnalytics` has no userId) |
| Leads | `formSubmission.findMany({ publishedPageId })` | `publishedPage.id` from the wrapper | n/a (no cross-space compare) |

**Neither page compares user ids at all** — so the three-ID-space trap has no surface here. `clerkId` is not consumed this phase (that is phase 5's testimonials read).

### D1 — the `?days` re-point

The 7/30/90 pills now render `/dashboard/{token}/analytics?days={d}` (was `/dashboard/analytics/{slug}?days={d}`). The page reads `searchParams.days` and does the `[7,30,90]` validation **exactly as before**. A verbatim copy would have aimed the pills at the shim, which preserves no query → every range click would leave the workspace and silently render the default 30d. A code comment at the link states this. E2e asserts both the `href`s and a real click (URL + query intact, active style moves to 7d and off 30d).

Other links in the moved bodies, per the plan, are correct as-is and were kept verbatim: analytics back-link → `/dashboard`, site link → external host; leads back-link → `/dashboard`, empty-state → `/p/{slug}`; the analytics `EmptyState` component → `/p/{slug}`.

### Leads — the dropped `userId` filter (audit-noted, per plan step 4)

`formSubmission.findMany({ where: { userId, publishedPageId } })` → `{ where: { publishedPageId } }`. Reviewer-cleared, and re-verified here:
- `publishedPage.id` is a **PRIMARY KEY returned by `getWorkspaceProject` after its authz ladder passed**, so `where:{ publishedPageId }` can only match rows for that one asserted-owned page → the `userId` filter added no security, only redundant scoping.
  ⚠️ **Correction (F1)** — the guarantee is **provenance, not a DB constraint**. `FormSubmission.publishedPageId` (`prisma/schema.prisma:232`) is a **nullable, indexed scalar with NO relation and NO unique constraint**; an earlier draft of this audit and of the code comment called it a "unique FK", which the schema does not say. Conclusion unchanged, reason corrected — nobody should relax this query believing a FK enforces it. Comment fixed in `leads/page.tsx`.
- `FormSubmission.userId` is a **Clerk** id while `project.userId` is an internal `User.id` — keeping a filter here would invite exactly the tsc-green / zero-rows wrong-space bug.
- The filter is precisely what blanks **admin god-view** (R8) — an admin's clerkId matches none of the owner's submissions.
- **F2 — the filter was never a real defence, and dropping it is a visible behavior delta.** `/api/forms/submit` reads **both** `userId` and `publishedPageId` from the **client-supplied request body** (`src/app/api/forms/submit/route.ts:57`, written `:198-199`) — they are embedded in the published page's form handler, so an attacker controls both. Therefore: (a) nothing is lost security-wise by dropping the `userId` filter; and (b) **submissions whose `FormSubmission.userId` != the owner were previously HIDDEN and will now APPEAR — an existing page's visible lead count can change after deploy.** Not a cross-project leak: the `publishedPageId` scoping above still holds. Founder-facing (merge-gate item below).

A 🚨 comment in the file records all of the above and says "do NOT restore it".

### Shims

Node-runtime server pages: `publishedPage.findFirst({ where:{slug}, select:{projectId} })` → `project.findUnique({ id }, select:{tokenId})` → `redirect('/dashboard/{tokenId}/{analytics|leads}')`; `notFound()` on a missing page, a **null `projectId`**, or a missing project — preserving today's no-leak behavior. They redirect **unconditionally**; the target enforces authz (post-B3/D2 it also rejects orphans + the demo token). They leak only slug existence, which `/p/{slug}` already publishes. Each file documents why middleware (edge, no Prisma) and `next.config` (static) cannot do this, and that the **directory must stay real** or `[token]` swallows `/dashboard/analytics/foo`.

### Judgment calls (in-scope, conservative)

1. **The verbatim `/dashboard` back-link was KEPT** in both moved bodies, so the workspace now shows "All Projects" (3a header) above a second "Dashboard" back-link. D1 explicitly lists those links as "fine" and the plan says the body moves with no reskin — deleting it would be an unmandated design change. Cosmetic duplication; flagged for the founder eyeball at gate item 6.
2. **`min-h-screen` dropped** from both moved wrappers (`flex flex-col bg-gray-50 …` otherwise kept). Inside the shell's own scroll container a `min-h-screen` child forces a spurious second scrollbar under the tab bar. Everything else in the wrapper is byte-identical.
3. **`<Footer/>` is gone from leads.** Phase 1 kept `@/components/shared/Footer` in `forms/[slug]/page.tsx` as an explicitly accepted transient "until phases 4–5 turn them into shims" — the shim has no Footer and the moved body correctly does not reintroduce one. The transient is now resolved, as planned. (`blog/[slug]` keeps its Footer until phase 5.)
4. **R10 locked states are minimal and token-only**: `border-app-border` / `bg-app-surface` / `bg-app-tint` / `text-app-primary` / `text-app-ink` / `text-app-faint` / `font-app-sans`, one `AppIcon`, same `rounded-[13px]` + `[38px]` tile geometry as the Overview quick-action cards. **No new visual language, no new Tailwind key, no arbitrary color.** Copy is the plan's: "Publish to see analytics" / "Publish to start collecting leads".
5. **Icons `monitoring` + `move_to_inbox` are already in the committed Material Symbols subset** (`public/fonts/material-symbols-rounded/icons.txt`) — no font regeneration.
6. **Analytics is locked, not empty-stated, pre-publish** — genuinely published-only (`PageAnalytics` keys on `slug` alone, so no page ⇒ no slug ⇒ no rows can exist). The moved `EmptyState` component still covers the published-but-no-traffic case, unchanged.

### e2e (5 tests, `authed`)

- 2 redirect tests (`analytics/{slug}` → `{token}/analytics`; `forms/{slug}` → `{token}/leads`).
- 1 unknown-slug → 404 on both shims.
- 1 **D1** test: all three pill `href`s + a real click (no hop, `?days=7` preserved, active style moves).
- 1 **R10** test: draft project → both tabs render (<400) with the locked copy.

The published fixture is built ONCE (memoized, serial) via the `publish.spec.ts` pattern (persona → `/api/start` → `seedDraft` → real publish UI → deterministic slug `e2e-redirect-smoke`, republished each run rather than accumulating). `e2e/helpers/seedDraft.ts` is **imported, not modified**. **No vacuous tests**: a failed fixture build → `test.skip(..., reason)` loudly; it never passes silently. The AppIcon-ligature trap is avoided throughout (`getByRole(..., {name})` + exact leaf text only) and is documented in the spec header.

### Deliberately NOT done

- No reskin of either body (plan: "moved as-is").
- No blog/testimonials re-home, no blog shims (phase 5) — those two tabs still 404.
- No preview shim; no middleware, `security.ts`, `workspace.ts`, schema, foundation, Tailwind or `playwright.config.ts` edit.
- `Header.tsx` / `DashboardHeader.tsx` / `ProjectCard.tsx` / `components/dashboard/EmptyState.tsx` NOT deleted — phase 6.
- **D5 extra-hop callers left alone (record only) — corrected list (F4):**
  - **Phase 4's only LIVE extra-hop caller: `src/app/admin/page.tsx:370` (`/dashboard/analytics/{p.slug}`) + `:378` (`/dashboard/forms/{p.slug}`)** — routes correctly via the new shims, one extra hop.
  - `src/app/edit/[token]/components/layout/PageSwitcher.tsx:43` links `/dashboard/blog/{slug}` → that's **phase 5's** shim, not analytics/leads. (Earlier draft of this audit both mis-scoped it to phase 4 and gave a wrong path.)
  - `src/components/dashboard/ProjectCard.tsx:175,:181` still push old slug URLs but the file has **ZERO importers** since phase 2 — dead code until phase 6 deletes it. Recorded so it isn't mistaken for a live caller.
  Out of scope by ruling (D5 = record only).

### Open risks

1. **Playwright not executed** (needs a dev server + Clerk E2E creds; per instructions only tsc/test:run/lint were run). `--list --project=authed` → **Total: 24 tests in 6 files** (was 19/5 → all 5 new tests collected).
2. **NEW admin god-view** now reaches analytics/leads by token URL (the slug routes hard-scoped on `userId` and silently 404'd admins). Intended per spec — founder gate item 2. Untestable here (single Clerk session).
3. **Null-`projectId` `PublishedPage` rows** would 404 in the shims (bookmarks that work today) and show the R10 locked state in the workspace — exactly the gate item 4 count the founder must run. Prod was wiped 2026-06-16; expected zero.
4. Locked-state + moved-body visuals unverified by eye (gate item 6), incl. the double back-link (judgment call 1).

### Merge-gate summary items (phase 4)

1. **Founder eyeball:** duplicate back-link ("All Projects" + the body's verbatim "Dashboard") on the analytics/leads tabs — keep, or drop in a later polish slice.
2. **Recorded:** leads `userId` filter dropped (required for R8 admin god-view; scoping holds because `publishedPage.id` is a **post-authz PK**, NOT because of any FK/unique constraint — see F1).
3. **⚠️ FOUNDER-FACING BEHAVIOR DELTA (F2) — sits next to the new-admin-god-view note:** `/api/forms/submit` takes both `userId` and `publishedPageId` from the **client-supplied body**, so the old Clerk-`userId` filter protected nothing — but it DID hide any submission whose `userId` != the owner. Those rows now **appear**, so an existing page's **visible lead count can shift after deploy**. Not a cross-project leak. Expect questions if a number moves.
4. **Recorded:** shims 404 on a null `projectId` → gate item 4's count matters.
5. **D5 (record only), corrected:** live = `admin/page.tsx:370,:378` only. `PageSwitcher.tsx:43` → `/dashboard/blog/{slug}` is **phase 5**. `ProjectCard.tsx:175,:181` = **dead** (zero importers, deleted in phase 6).

### Verification (actual output)

- **`npx tsc --noEmit`** → **exit 0, zero errors**.
- **`npm run test:run`** → **Test Files 194 passed | 1 skipped (195); Tests 3343 passed | 18 skipped (3361)** — unchanged vs phase 3 (no unit tests added; phase 4 is route + e2e work). Config-freeze isolation guard green.
- **`npm run lint`** → **zero errors** (`grep -c "Error:"` → `0`); warnings only, all pre-existing (`react-hooks/exhaustive-deps` in providers/editor/generation). No warning in any phase-4 file.
- `git diff --stat tailwind.config.js src/components/ui` → **empty** (foundation frozen).
- `npx playwright test --list --project=authed` → **Total: 24 tests in 6 files**.
- `npm run build` / e2e execution not run (per instructions).
- Not committed — orchestrator commits.

### Impl-review fixes F1–F4 (verdict: **ship**; ZERO implementation-logic changes)

Reviewer verified: ownership is the first statement on both pages, no cross-space compare, the `userId` drop is safe (`publishedPage.id` = a PK handed back post-authz — no other project's rows can surface), D1 correct (pills → token URL, `searchParams.days` byte-identical, both halves of the test bite), all 8 moves are pure renames with **0 changed lines**, isolation empty. Implementation logic untouched; the four fixes are comment / doc / e2e only.

- **F1 — `leads/page.tsx` header comment corrected (comment only).** It claimed `publishedPageId` is a "unique FK". `prisma/schema.prisma:232` says `publishedPageId String?` — a **nullable, indexed scalar with NO relation and NO unique constraint**. The conclusion was right, the stated reason wasn't: the guarantee is **provenance** (`publishedPage.id` is a PK returned by `getWorkspaceProject` *after* its authz ladder, so `where:{publishedPageId}` can only match rows for that one asserted-owned page), not a DB constraint. The comment now says so and warns explicitly not to relax the query believing a FK enforces anything. Audit's "Dropped `userId` filter" section corrected too.
- **F2 — real behavior delta recorded (audit + merge-gate; no code change).** `/api/forms/submit` reads **both** `userId` and `publishedPageId` from the **client-supplied request body** (`src/app/api/forms/submit/route.ts:57`, written `:198-199`) — both are embedded in the published page's form handler, so an attacker controls them. ⇒ (a) the old Clerk-`userId` filter was never real protection, so dropping it loses nothing security-wise; (b) **submissions whose `FormSubmission.userId` != the owner were previously HIDDEN and now APPEAR → an existing page's visible lead count can change after deploy.** Not a cross-project leak (`publishedPageId` scoping holds). Now in the file comment, the audit, and the merge-gate list beside the new-admin-god-view note.
- **F3 — `dashboard-redirects.spec.ts` draft fixture de-fragilised (e2e only).** `createProject` inherited its persona from an earlier `describe` (serial file order) — it would break the moment a test is filtered or reordered, since `audienceType` is captured on the Project at `/api/start`. Replaced by `getDraftToken()`, which **POSTs the persona itself** like the published fixture does, and is **memoised** so a run creates at most one throwaway draft. Accumulation is now bounded and explained in the spec: a draft has no natural dedupe key (unlike the published fixture's deterministic slug), but drafts are unpublished and so cost nothing against the plan's published-page limit. Skip reason updated. No test now passes because of file ordering.
- **F4 — D5 list corrected (doc only).** Phase 4's only **live** extra-hop caller is `src/app/admin/page.tsx:370` + `:378`. `src/app/edit/[token]/components/layout/PageSwitcher.tsx:43` targets `/dashboard/blog/{slug}` → **phase 5's** shim, and the earlier entry also had the wrong path. `src/components/dashboard/ProjectCard.tsx:175,:181` still push old slug URLs but the file has **zero importers** (dead since phase 2, deleted in phase 6) — recorded so it isn't mistaken for a live caller.

Judgment call #2 (`min-h-screen` drop) reviewer-confirmed as the only body content change beyond the authorized ones (`flex-grow` preserved, empty/pre-publish layouts unaffected) — left as built. Judgment call #1 (duplicate back-link) stays flagged for the founder.

**Verification after F1–F4 (actual output)**

- **`npx tsc --noEmit`** → **exit 0, zero errors**.
- **`npm run test:run`** → **Test Files 194 passed | 1 skipped (195); Tests 3343 passed | 18 skipped (3361)** — unchanged (fixes are comment/doc/e2e only).
- **`npm run lint`** → **zero errors** (`grep -c "Error:"` → `0`); warnings only, all pre-existing.
- `npx playwright test --list --project=authed` → **Total: 24 tests in 6 files** (unchanged — F3 edited an existing helper/test).
- `git diff --stat tailwind.config.js src/components/ui` → **empty**.
- Not committed — orchestrator commits.

---

## Phase 5 — re-home Blog + Testimonials under `[token]`, blog shims (LAST build phase)

### Files changed

**New**
- `src/app/dashboard/[token]/blog/page.tsx`
- `src/app/dashboard/[token]/blog/[postId]/page.tsx`
- `src/app/dashboard/[token]/testimonials/page.tsx`

**Moved (`git mv` → pure renames)**
- `src/app/dashboard/blog/[slug]/components/BlogPostsTable.tsx` → `src/app/dashboard/[token]/blog/components/BlogPostsTable.tsx` *(re-pointed)*
- `src/app/dashboard/blog/[slug]/components/NewPostButton.tsx` → `src/app/dashboard/[token]/blog/components/NewPostButton.tsx` *(re-pointed)*
- `src/app/dashboard/blog/[slug]/[postId]/components/BlogPostEditor.tsx` → `src/app/dashboard/[token]/blog/[postId]/components/BlogPostEditor.tsx` *(comment only)*
- `src/app/dashboard/blog/[slug]/[postId]/components/BlogRichTextEditor.tsx` → `src/app/dashboard/[token]/blog/[postId]/components/BlogRichTextEditor.tsx` *(0 changed lines)*

**Rewritten → shims**
- `src/app/dashboard/blog/[slug]/page.tsx`
- `src/app/dashboard/blog/[slug]/[postId]/page.tsx`

**Extended**
- `e2e/dashboard-redirects.spec.ts`

Nothing else. `git status -- src e2e tailwind.config.js` shows exactly this set.

### What changed, per file

- **`[token]/blog/page.tsx`** — body moved from `blog/[slug]/page.tsx`. Entry = `getWorkspaceProject(params.token)` (first statement); the old `publishedPage.findFirst({slug, userId})` + its **slug→token hop (`:29-34`) are gone** — the wrapper already hands back both. Posts: `blogPost.findMany({ where: { projectId: project.id } })` (was `publishedPage.projectId` — same value, now post-authz). Subscriber count keyed on `publishedPage.id` as before. `host` from `publishedPage.slug` instead of the route param. **R18 locked state** when `publishedPage == null` ("Publish to start blogging"), same minimal R10 shape/tokens as phase 4's analytics/leads.
- **`[token]/blog/[postId]/page.tsx`** — body moved. Wrapper first, then **the integrity check is PRESERVED**: `post.projectId !== project.id → notFound()` (exact equivalent of the old `!== publishedPage.projectId` once ownership of `project` is asserted). Without it any owned token could open another project's post by id. **D3**: `slug` for `BlogPostEditor` comes from `publishedPage.slug`, not a route param; R18's gate (`if (!publishedPage) notFound()`) makes it non-null.
- **`[token]/testimonials/page.tsx`** — new per-project tab; `TestimonialModerationList` + dialogs reused as-is, `isTestimonialsEnabled()` gate kept identical to the account page. See the ID-space section below.
- **`BlogPostsTable.tsx` / `NewPostButton.tsx`** — C1 re-points (below).
- **`BlogPostEditor.tsx`** — no logic change; only the B2 comment block above the preview link.
- **Both blog shims** — Node-runtime server pages, shaped exactly like phase 4's: `publishedPage.findFirst({where:{slug}, select:{projectId}})` → `project.findUnique({id}, select:{tokenId})` → `redirect(...)`; `notFound()` on missing page / null `projectId` / missing project. Redirect unconditionally; the target enforces authz. Each documents why middleware (edge, no Prisma) and `next.config` (static) can't do the lookup, and that **the dir must stay real** or `[token]` swallows `/dashboard/blog/foo`. The `[postId]` shim passes `postId` through unvalidated on purpose — validating it there would duplicate the target's check.

### 🚨 How testimonials avoids the third-ID-space trap

`Testimonial.userId` is a **CLERK** id (`prisma/schema.prisma:600`, "Clerk User ID (owner / tenant)"); `project.userId` is an internal **`User.id`** (`:22`). Both `string` ⇒ a wrong-space pass is tsc-green, throws nothing, and returns **zero rows**.

The page calls:

```ts
const { project, clerkId } = await getWorkspaceProject(params.token)
listTestimonialsByOwner(clerkId, { projectId: project.id })
```

- `clerkId` is the wrapper's — i.e. the **project OWNER's** Clerk id, resolved via `project.user.clerkId`, **not** the requesting admin's. That is what keeps **admin god-view (R8)** showing the owner's testimonials instead of a blank tab.
- `project.id` (internal PK) is used ONLY as the `projectId` filter — never compared against a Clerk column. **No cross-space join anywhere in the file.**
- `listTestimonialsByOwner` **was NOT edited** — it already accepts `{ projectId }` (`src/lib/testimonials/repo.ts:82-94`: `where:{ userId, ...(filter.projectId !== undefined ? { projectId } : {}) }`), as used by `autoImport.ts:58`. Signature confirmed by reading it; zero changes.
- A 🚨 header comment in the file states the trap, the ✅/❌ pair, and why `clerkId` must be the owner's.
- e2e **non-empty guard**: seed a project-scoped testimonial via `POST /api/testimonials`, then assert the quote is **visible** on the tab. A wrong-space call renders an empty-but-healthy page, so only a non-empty assertion bites.

### C1 re-points + the deliberate B2 exception

Re-pointed (these would otherwise be in-tab links bouncing through the shims this phase created — the plan's global invariant):

| Was | Now |
|---|---|
| `BlogPostsTable.tsx:77` row title `Link` → `/dashboard/blog/{slug}/{postId}` | `/dashboard/{tokenId}/blog/{postId}` |
| `BlogPostsTable.tsx:97` "Edit" `Link` → same | `/dashboard/{tokenId}/blog/{postId}` |
| `NewPostButton.tsx:22` `router.push('/dashboard/blog/{slug}/{postId}')` | `router.push('/dashboard/{tokenId}/blog/{postId}')` |
| `blog/[slug]/[postId]/page.tsx:41` back-link → `/dashboard/blog/{slug}` | `/dashboard/{tokenId}/blog` |

**Deliberate exception — `BlogPostEditor.tsx:178` preview link stays on the OLD slug URL** `/dashboard/blog/{slug}/{postId}/preview` (B2). That route lives in the `(blog-preview)` root route group, **outside** the dashboard tree, so no `.app-chrome` ancestor can leak app fonts/colors into real template markup. It has **no `[token]` twin and no shim**, so this URL is the live target, not a hop. A multi-line 🚨 comment above the link says exactly this ("Do NOT 'fix' it") plus the D3 note.

**Phase 5 states explicitly: no `.app-chrome` / workspace-chrome ancestor wraps the blog SSR preview.** It was moved out of the dashboard tree in phase 1; this phase added no wrapper, no shim, and did not touch `src/app/(blog-preview)/...`. An e2e guard asserts `.app-chrome` count is 0 on that URL.

### Judgment calls (in-scope, conservative)

1. **`slug` prop dropped from `BlogPostsTable` + `NewPostButton`.** After the C1 re-points it was referenced nowhere in either component (the `/blog/{post.slug}` sub-line uses the POST's own slug — a different field). Keeping a dead prop invites someone to "reuse" it and rebuild the old URL. Both components have exactly one caller (the new page, also in this phase's Files-touched). Recorded as a **deviation-lite**: the plan said "pass token down as prop" and did not explicitly authorise removing `slug`.
2. **`min-h-screen` dropped + `<Footer/>` not carried over** on both moved blog bodies — same as phase 4's judgment calls 2 & 3. Phase 1 recorded `blog/[slug]`'s `shared/Footer` as an accepted transient "until phase 5 turns them into shims"; the shim has no Footer and the moved body correctly does not reintroduce one. Transient now resolved as planned.
3. **The verbatim `/dashboard` back-link was KEPT** in the moved blog index body (as in analytics/leads) → the "All Projects" + "Dashboard" duplication also appears on the Blog tab. Consistent with phase 4; already on the founder-eyeball list.
4. **The blog post page has NO `/dashboard` back-link** — the old one didn't either (only "All posts"). Unchanged.
5. **R18 locked state uses `AppIcon name="article"`** — already in the committed Material Symbols subset (`public/fonts/material-symbols-rounded/icons.txt`), no font regeneration. Copy is the plan's "Publish to start blogging".
6. **Testimonials tab header** drops the account page's `/dashboard` back-link (the workspace header owns that) and re-words the sub-copy "…for your landing pages" → "…for this site". Stats grid + moderation list otherwise identical.
7. **`audienceType` is read with an extra `project.findUnique({ where: { id: project.id } })`.** `TestimonialModerationList`'s `projects` prop needs it and `WorkspaceContext` doesn't carry it; `workspace.ts` is frozen for this phase, so the read happens at the call site by **primary key, after** the ownership assertion. `token: project.tokenId` is passed because `Project.tokenId` **is** the token value (`schema.prisma:23` — the relation targets `Token.value`), i.e. the same string the account page passes as `p.token.value`.
8. **`export const dynamic = 'force-dynamic'`** kept on the testimonials tab (copied from the account page — moderation state must never be cached).

### Deliberately NOT done

- **`src/lib/testimonials/repo.ts` NOT touched** — it already accepts `{ projectId }`. Callers grepped: `autoImport.ts:58`, `dashboard/testimonials/page.tsx:19`, and this new page; the two existing callers are unaffected (`projectId` is optional).
- **`/dashboard/testimonials` (account-level) left alive and owner-scoped exactly as today (R19)** — not deleted, not re-routed, not shimmed, still unlinked from the sidebar.
- **No preview shim, no preview re-home, `src/app/(blog-preview)/...` untouched (B2).**
- No re-skin of any moved body (plan: "moved as-is").
- No edit to `middleware.ts`, `security.ts`, `workspace.ts`, the schema, `src/components/ui/*`, `tailwind.config.js`, or `playwright.config.ts` (the phase-5 spec filename was already registered — reused it).
- `Header.tsx` / `DashboardHeader.tsx` / `ProjectCard.tsx` / `components/dashboard/EmptyState.tsx` NOT deleted — phase 6.
- **D5 (record only, do NOT fix):** `edit/[token]/components/layout/PageSwitcher.tsx:43` → `/dashboard/blog/{slug}` now routes correctly **via this phase's shim**, one extra hop. This is the phase-5 half of D5 that phase 4's F4 correctly re-scoped here. `admin/page.tsx:370,:378` remain phase 4's. Left alone by ruling.

### e2e (8 new tests → `authed` total 24 → 32)

- **2 blog shim redirects**: `/dashboard/blog/{slug}` → `/dashboard/{token}/blog`; `/dashboard/blog/{slug}/{postId}` → `/dashboard/{token}/blog/{postId}`.
- **1 unknown-slug → 404** on both blog shims (pins "shim dirs stay real").
- **1 C1 no-hop test**: asserts the row link's **`href`** is the token URL, then clicks it, then asserts the "All posts" back-link's `href` + click. ⚠️ The href assertion is the one that bites — a hop through the shim lands on the **same** final URL, so a URL-only check would pass with the bug still present.
- **2 B2 tests**: the preview URL 200s on the OLD slug path, **does not redirect**, and has `.app-chrome` count **0**; and the post editor's "Preview saved draft" link still carries the old-slug `href` (locks the deliberate exception + D3's slug source).
- **1 C2 non-empty testimonials guard** (the silent-zero-rows check): `GET /api/projects/{token}` → `POST /api/testimonials {projectId}` → assert the quote renders on the tab.
- **1 R18 locked state**: draft token → `/dashboard/{token}/blog` renders (<400) with "Publish to start blogging".

New helper `getPostId(page)` follows the established memoised-fixture pattern and reuses phase 4's `getPublishedFixture()` / `getDraftToken()` unchanged. **No vacuous tests**: every fixture failure → `test.skip(cond, reason)` loudly (incl. `TESTIMONIALS_ENABLED` unset → 404 from the seed POST → loud skip, never a mute pass). AppIcon-ligature trap avoided (`getByRole(..., {name})` + exact leaf text + `href` locators only). Analytics `?days` pill survival is already covered by phase 4's D1 test in this same file — not duplicated.

### Open risks

1. **Playwright not executed** (needs a dev server + Clerk E2E creds; per instructions only tsc/test:run/lint ran). `--list --project=authed` → **Total: 32 tests in 6 files** (was 24 → all 8 collected).
2. **NEW admin god-view** now reaches blog + testimonials by token URL (the slug blog route hard-scoped on `userId` and 404'd admins). Intended per spec — founder gate item 2. Untestable here (single Clerk session).
3. **Pilot risk: the `vishwas dubey` blog has a custom domain** and is the real fixture — the shims keep old bookmarks working, but every in-tab URL changed. Founder gate item 5.
4. **`BlogPost` rows are token-reachable but the tab is publish-gated (R18)** — a project with posts and no `PublishedPage` shows the locked state and its posts are UI-unreachable. They were unreachable before too (the old route was publish-gated by construction), so this is status quo; pre-publish blog = later slice.
5. Moved-body + locked-state visuals unverified by eye (gate item 6), incl. the Blog tab's duplicate back-link (judgment call 3).

### Merge-gate summary items (phase 5)

1. **Recorded:** the testimonials tab reads with the **owner's Clerk id + `projectId`**; the util was not modified. Admin god-view must show the OWNER's entries, not blank (gate item 2's C2 half).
2. **Recorded (B2):** the blog preview URL is unchanged and deliberately unshimmed; the post editor still links to the old slug URL **by design**. Do not "fix" it in a later cleanup.
3. **D5, phase-5 half (record only):** `PageSwitcher.tsx:43` → `/dashboard/blog/{slug}` takes one extra hop via the new shim. Re-pointing = later slice.
4. **Founder eyeball:** duplicate back-link now also on the Blog tab (consistent with analytics/leads).
5. **Recorded:** the blog shims 404 on a null `projectId` → gate item 4's count matters for blog bookmarks too.

### Verification (actual output)

- **`npx tsc --noEmit`** → **exit 0, zero errors**.
- **`npm run test:run`** → **Test Files 194 passed | 1 skipped (195); Tests 3343 passed | 18 skipped (3361)** — unchanged vs phases 3/4 (no unit tests added; phase 5 is route + e2e work). Config-freeze isolation guard green.
- **`npm run lint`** → **zero errors** (`grep -c "Error:"` → `0`); warnings only, all pre-existing (`no-img-element` in templates, `react-hooks/exhaustive-deps` in providers). **No warning in any phase-5 file.**
- `git diff --stat tailwind.config.js src/components/ui` → **empty** (foundation frozen).
- `npx playwright test --list --project=authed` → **Total: 32 tests in 6 files**.
- `npm run build` / e2e execution not run (per instructions).
- Not committed — orchestrator commits.

---

## Phase 6 — Dead-component cleanup + docs + full gates

**Files changed**
- `src/components/dashboard/Header.tsx` — **deleted**
- `src/components/dashboard/DashboardHeader.tsx` — **deleted**
- `src/components/dashboard/ProjectCard.tsx` — **deleted**
- `src/components/dashboard/EmptyState.tsx` — **deleted**
- `src/components/dashboard/Footer.tsx` — **deleted**
- `src/app/README.md` — route table updated (D4) + preview route-group path named (G2)
- `src/components/README.md` — **orchestrator exception (G1)**, doc-only: `:14` still listed the just-deleted `DashboardHeader`/`ProjectCard`/`EmptyState` as living components
- `docs/task/dashboard-workspace-ia.audit.md` — this section + the merge-gate checklist

(`docs/task/dashboard-workspace-ia.plan.md` also shows modified in `git status` — that is the
**orchestrator's own uncommitted Progress-log edit** marking phase 5 done. Not touched by this phase.)

### B4 guard — grep evidence before each delete

Ran a broad sweep (`components/dashboard` import paths + whole-word identifiers) across `src/`, `e2e/`, `scripts/`.
**Every one of the 5 files had zero live importers.** All remaining textual hits are comments or self-definitions:

| File | Remaining hits | Verdict |
|---|---|---|
| `Header.tsx` | none | dead |
| `DashboardHeader.tsx` | `dashboard/page.tsx:8-9` (comment saying it's gone) · `NewSiteButton.tsx:12,14` (provenance comment) · `e2e/dashboard-shell.spec.ts:38` (comment) | dead |
| `ProjectCard.tsx` | `continueRouting.ts:9-10` (provenance doc-comment) · `ProjectGridCard.tsx:13` · `[token]/page.tsx:20` · `emails/[token]/page.tsx:15` — **all comments** | dead since phase 2 |
| `EmptyState.tsx` (dashboard) | none | dead |
| `Footer.tsx` | none (`DialogFooter` in `social/[token]` is unrelated) | dead per scout §D |

⚠️ **`src/app/dashboard/[token]/analytics/components/EmptyState.tsx` is a DIFFERENT file and was preserved** —
verified present post-delete; `analytics/page.tsx:12` imports it via the relative `./components/EmptyState`.

**Editor-opening paths confirmed intact:** `continueRouting.ts` still holds all **4 branches + 2 error fallbacks**
verbatim, and remains the **single** `project_edit_clicked` PostHog call site. Its 3 consumers
(`ProjectGridCard.tsx:98,:104`, `WorkspaceHeader.tsx:37`) all route through it; none captures the event itself.
The `handleEdit` hits in `generate/[token]/page.tsx` + `preview/[token]/page.tsx` are unrelated local functions
(not ProjectCard consumers) — no reader dropped.

### D4 — `src/app/README.md`

Replaced the 4 stale slug rows with a `/dashboard/[token]/*` workspace sub-section (6 routes + the shared
layout), noted the token is **routing, not authz** (each page asserts ownership; admins get god-view), and added
the shim note: the 4 old slug URLs are redirect-only (`slug → projectId → token`), while
`blog/[slug]/[postId]/preview` is **not** shimmed and stays a real chrome-free page. Kept `/dashboard/testimonials`
(account-wide, still live) and marked it as such. Route table verified against the actual `page.tsx` tree and the
build output (shims **367–372 B** = redirect-only; preview 786 kB = real page — confirms B2 held).

### G1 / G2 — post-review doc fixes (orchestrator exception, doc-only, no code change)

Both close the exact future-reader trap D4 exists for; shipping docs that name files deleted this run is worse
than the one-line cost.

- **G1 — `src/components/README.md:14`** listed `DashboardHeader`, `ProjectCard`, `EmptyState` as living dashboard
  components; all three were deleted above. Rewrote the row **against a real `ls` of `src/components/dashboard/`**
  (not the brief's list — they matched): shell (`AppSidebar`, `DashboardTopBar`), grid (`ProjectGridCard`,
  `ProjectCardMenu`, `ProjectFilters`, `DashboardEmptyState`, `NewSiteButton`), workspace (`WorkspaceHeader`,
  `WorkspaceTabs`), shared (`continueRouting.ts`, `FormSubmissionsTable`, `PersonaUpdatedBanner`, `testimonials/`).
  Carried two invariants a future reader needs: `ProjectFilters.tsx` exports `ProjectsBoard` (file name ≠ default
  export — follow-up #13), and `continueRouting` is load-bearing + the single `project_edit_clicked` call site.
- **G2 — `src/app/README.md`** now names the preview's real path,
  `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx`, in a File-column row, and states **why**
  it sits outside `src/app/dashboard/`: the `(blog-preview)` route group adds no URL segment, so the page keeps its
  URL while escaping `dashboard/layout.tsx`'s `.app-chrome` — which would otherwise break the preview's parity with
  the live `/p/[slug]/blog/[postSlug]` page. Explicit "do not restore it under `src/app/dashboard/`" warning added
  (the reviewer looked there and couldn't find it — precisely the path to undoing B2).

**Claims verified before writing, not assumed:** `find "src/app/(blog-preview)" -name layout.tsx` → **no layouts**;
`grep -rn app-chrome src/app/` → attached **only** at `dashboard/layout.tsx:56`.

### Gates — actual output

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **exit 0, zero errors** |
| `npm run test:run` | **194 passed / 1 skipped (195 files) · 3343 passed / 18 skipped (3361 tests)** — no count change from phase 5; nothing depended on the deleted files |
| `npm run lint` | **exit 0, zero errors** — warnings only, all pre-existing (`no-img-element` in template blocks, `react-hooks/exhaustive-deps` in `ph-provider.tsx`) |
| **`npm run build`** | ✅ **exit 0 — "Compiled successfully"**. Full pipeline ran (`build:published-css` → `build:assets` (form.v1/a.v1/a.v2/fonts…) → `next build`). All 6 workspace routes + 4 shims + preview present. |

E2e **not run** (needs dev server + Clerk session — founder's/deploy's job, per instructions).

**Frozen surfaces:** `git diff HEAD --stat -- tailwind.config.js src/components/ui src/middleware.ts` → **empty**. `.app-chrome` untouched.

### Deviations
- **None from the plan.** The task brief listed 4 deletions; the **frozen plan's Files-touched lists 5** (adds
  `Footer.tsx`, dead per scout §D). Followed the plan (the contract) and deleted all 5 after proving `Footer.tsx`
  has zero importers.

### Open risks
- Deletions are the only code change; all four gates green. Residual risk is limited to the founder-eyeball
  and manual-authz items below.

---

# MERGE GATE — founder checklist

Work top-to-bottom; no other part of this audit needs reading. Nothing here is a known defect — these are the
checks automation cannot reach, plus decisions reserved for you. **Merge is plain, to main-LOCAL only, DO NOT PUSH**
(big-bang with auth + editor-shell).

## A. Must-pass checks

**1. 🔴 MANDATORY — non-owner 404 (the spec's reason this is a human gate).**
From a **SECOND, non-owner account**, open another user's token on **every** surface:
`/dashboard/{other-token}` · `/…/analytics` · `/…/leads` · `/…/blog` · `/…/blog/{postId}` · `/…/testimonials`.
**All must 404.** E2e runs a single Clerk session and structurally cannot cover this.

**2. Admin god-view — NEWLY GAINED, sign off explicitly.**
As an admin, open a **non-owned** token on analytics / leads / blog. These now **work**; the old slug routes were
hard-scoped on `userId` and **silently 404'd admins**. This is an intended behavior change, not a leak — confirm you want it.
Also confirm **testimonials shows the OWNER's entries, not blank** (C2 — third ID space).

**3. Demo-token rejection (B3/D2).** `/dashboard/lessgodemomockdata/…` from a **normal signed-in** account → **404**.

**4. 🟡 null-`projectId` count — run this before merge.**

```sql
SELECT count(*) FROM "PublishedPage" WHERE "projectId" IS NULL;
```

(`schema.prisma:154` nullable; `api/publish/route.ts:216,250` writes `project?.id || null`.)
**Expected 0** (prod wiped 2026-06-16). **If > 0:** each such page shows the workspace's "publish first" locked
state for a live project, AND its shim 404s a bookmark that works today. Surface for a decision — **verify, don't redesign**.

**5. Redirect coverage — old bookmarks.** Each old URL must land on the right workspace tab:
`/dashboard/analytics/{slug}` → `…/{token}/analytics` · `/dashboard/forms/{slug}` → `…/{token}/leads` ·
`/dashboard/blog/{slug}` → `…/{token}/blog` · `/dashboard/blog/{slug}/{postId}` → `…/{token}/blog/{postId}`.
**`/dashboard/blog/{slug}/{postId}/preview` must NOT redirect** — same URL, chrome-free (B2).
In-tab blog nav + analytics day pills should have **no redirect hop** (C1/D1).

**6. ⚠️ Lead counts may shift after deploy — expect questions, not a bug.**
`/api/forms/submit` takes **both** `userId` and `publishedPageId` from the **client-supplied body**
(`route.ts:57`, written `:198-199`), so the old Clerk-`userId` filter **never protected anything**. But it did
**hide** submissions whose `userId` != the owner — those rows **now appear**. Not a cross-project leak
(`publishedPageId` scoping holds). A live page's visible lead count can move.

## B. Founder eyeball (design + judgment)

**7.** Main dashboard reads 100% final-design; every not-yet-built control **greyed in place** (Domains R15).
Sidebar / top bar / card / menu / header / tabs visuals are **unverified by eye** — no browser run in any phase.

**8. R17b — the live-button-over-a-dead-field read.** A greyed toggle + textarea sit above an **enabled**
"Build my site". Accept, or order the prefill follow-up (#12) now.

**9. Duplicate back-link.** Analytics / leads / blog tabs show "All Projects" (workspace header) above the moved
body's own verbatim "Dashboard" link. Kept deliberately — D1 calls those links fine and the plan mandated no
reskin. Keep, or drop in a polish slice.

**10. "Free plan" vs the design's "Starter plan"** — copy mismatch in the sidebar; your call.

**11. `dashboard_header_loaded` PostHog event is LOST** with `<DashboardHeader/>`. The plan specified no new home,
so none was invented. Identity + pageview tracking unaffected. **Re-home or accept.**

## C. Follow-ups to order or park (no action needed to merge)

**12. R17b prefill slice** — prompt text → onboarding prefill; needs `/api/start` to accept an input body + an
onboarding prefill param. Self-contained.

**13. Rename `ProjectFilters.tsx` → `ProjectsBoard.tsx`** — file exports `ProjectsBoard` as default (deliberate;
phase 2 had no slot for a new file). Trivial.

**14. D5 extra-hop callers — RECORD ONLY, deliberately not fixed:** `admin/page.tsx:370,:378` (old analytics/forms
slug URLs) and `edit/[token]/components/layout/PageSwitcher.tsx:43` (`/dashboard/blog/{slug}`). All route correctly
**via the shims**, just with one extra hop. Re-pointing = a later cleanup slice, explicitly out of scope here.

**15. B2 runtime preview guard** — the fixture-based check `test.skip`s (with a reason) when it can't seed;
worth one real pass with a dev server.

**16. `src/components/shared/Footer.tsx` is now orphaned repo-wide — RECORDED, deliberately NOT fixed.**
Verified: `grep -rl "shared/Footer" src/` → **zero consumers**. Phase 2's `dashboard/page.tsx` rewrite plus the
phase 4/5 shims removed its last importers, so the scout's premise (true when written) went stale during the run.
A dead-code candidate for the **D5 polish slice** (#14). ⚠️ **Distinct from `dashboard/Footer.tsx`**, which was a
0-byte file safely deleted in phase 6 — do not conflate them. Out of scope here (unlisted file).

## D. Reviewer-cleared — do NOT re-litigate

B1–B5, C1–C3 as implemented · R17b · R2/R3/R8/R15/R16 · ID-space handling · dropping the `userId` filter on
`formSubmission.findMany`. B3 was adversarially attacked (orphan / demo / non-owner / null-`userRecord`) with no
path through, and its guards are mutation-proven.
