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
