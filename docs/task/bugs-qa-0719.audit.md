# bugs-qa-0719 — implementation audit

## B9 — "Logo bad in editor.. make it good everywhere"

**Files changed**
- `src/components/shared/Logo.tsx` — root-cause fix
- `src/components/shared/Logo.test.tsx` — new regression test
- `src/components/dashboard/AppSidebar.tsx` — re-pointed to shared `<Logo>` (single source of truth)
- `src/components/shared/Header.tsx` — call-site size adjust
- `src/app/onboarding/[token]/page.tsx` — call-site size adjust
- `src/components/onboarding/PersonaPrompt.tsx` — call-site size adjust
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` — stale comment + size cleanup

### What changed & why
- **Logo.tsx (root cause):** now renders the transparent wordmark `/lessgo-logo.png`
  (intrinsic 152×40) via `next/image`, matching the dashboard sidebar reference from
  qa-0718. The `size` prop is reinterpreted as TARGET HEIGHT; width is derived from the
  152:40 aspect ratio (`Math.round(size * 152/40)`) so the wide wordmark is never squished.
  Previously it rendered the boxed `/logo.svg` at `width=size height=size` (square) —
  the "bad logo." `alt` set to `"Lessgo AI"`; `className` passthrough preserved
  (GlobalAppHeader still relies on `h-[22px] w-auto`).
- **AppSidebar.tsx:** replaced the inline `next/image` copy with `<Logo size={30} className="h-[30px] w-auto" />`
  (removed now-unused `next/image` import). Renders the identical ~30px transparent
  wordmark → one logo component across the app.

### Call-site sizing adjustments (size→height reinterpretation)
Old `size` was a square edge; now it's the display height, so oversized square values
had to shrink to sensible heights:
- Header.tsx (marketing): `240` → `40` (was a 240px square box; 40px tall wordmark).
- onboarding/[token]/page.tsx (top bar, py-3): `80` → `30`.
- PersonaPrompt.tsx (top bar, py-3): `80` → `30`.
- GlobalAppHeader.tsx: `110` → `22`; height already pinned by `h-[22px] w-auto` className
  (display unchanged) — updated the now-stale comment about the old square behavior.
- JourneyTopBar.tsx: `size={22}` left as-is — already a sensible height, no change needed.

### Regression test
`src/components/shared/Logo.test.tsx` renders `<Logo />` (react-dom/client + React.act,
the repo's harness — no @testing-library) and asserts the emitted `img` has
`alt="Lessgo AI"`, its `src` contains `lessgo-logo`, and does NOT contain `logo.svg`.
- Pre-fix (old Logo.tsx via `git stash`): **FAILED** (src was logo.svg).
- Post-fix: **PASSED** (1/1).

### Gate results
- `npx vitest run src/components/shared/Logo.test.tsx` → 1 passed.
- `npx tsc --noEmit` → no NEW errors. One pre-existing unrelated error remains:
  `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (asset
  typing, not touched by this fix).

### Deviations
- None from the root-cause plan. Took the "preferred" optional step (re-point AppSidebar)
  since it cleanly reproduced the ~30px wordmark.

### Open risks
- Visual review recommended on the marketing Header (240→40) and onboarding/PersonaPrompt
  top bars (80→30) — heights chosen to match the dashboard ~30px reference, but not
  visually confirmed in-browser. Not a dual-renderer surface (no `.published.tsx` pair).

---

## B10 — Unpublish menu row renders literal `cloud_off` text; "Unpublish" label overflows

**Files changed**
- `src/components/dashboard/ProjectCardMenu.tsx` (modified)
- `public/fonts/material-symbols-rounded/icons.txt` (modified)
- `src/components/dashboard/ProjectCardMenu.test.tsx` (created)

### What changed
- **ProjectCardMenu.tsx:277** — swapped the Unpublish row's `<AppIcon name="cloud_off" size={17} />`
  for `name="visibility_off"` (same size). `cloud_off` is absent from the shipped Material
  Symbols woff2 subset, so the browser painted the raw ligature name as text; with
  `.app-icon { white-space:nowrap }` inside the fixed 186px menu that wide literal blew out the
  row and pushed "Unpublish" off-edge. `visibility_off` IS in the subset (icons.txt line ~176,
  and it already renders live at CorrectionBoard.tsx:203) and reads as the natural opposite of
  the `visibility` glyph on the "Visit site" row. Added an inline comment noting the intent to
  restore `cloud_off` after a font-subset regen. No CSS / menu-width change (root cause was the
  glyph width, so a normal ~17px glyph fixes the truncation).
- **icons.txt** — added `cloud_off` in alphabetical position with an inline `#` comment marking it
  as the ideal Unpublish glyph, pending a woff2 subset regen. This alone does NOT fix the bug (the
  shipped font still lacks the glyph); it just records the want so a future regen restores it.

### Regression test
`src/components/dashboard/ProjectCardMenu.test.tsx` (react-dom/client + React.act idiom, per
GlobalAppHeader.menus.test.tsx — no @testing-library in repo):
- Renders `<ProjectCardMenu>` for a PUBLISHED project (publishState: 'published') so the
  isPublished-gated Unpublish row mounts; opens the Radix dropdown via the keyboard path
  (Enter on the focused trigger — jsdom has no PointerEvent, and Radix opens on pointerdown).
- Parses `icons.txt` into a "shipped subset" Set, treating any line containing `#` as a
  comment / documented-pending entry (excluded) — so the pending `cloud_off` entry is NOT
  counted as shipped.
- Asserts every rendered `.app-icon` glyph ∈ subset, and that a menu item contains "Unpublish".
- Comment documents that icons.txt is a lower-bound proxy (woff2 GSUB is authoritative), guarding
  the specific subset-drop class.

**Before/after:** pre-fix (`name="cloud_off"`) → FAILS `AssertionError: glyph "cloud_off" is not
in the shipped subset` (subset = 179 entries, cloud_off excluded via the pending-comment rule).
Post-fix → both tests PASS (2 passed). Verified by temporarily reverting the glyph.

### Deviations
- None. Used the preferred full-render test (no fallback needed).

### Gate
- `npx vitest run src/components/dashboard/ProjectCardMenu.test.tsx` → 2 passed.
- `npx tsc --noEmit` → only the pre-existing unrelated `src/app/page.tsx:6` founder.jpg
  TS2307 error; no new errors.

### Open risks
- The proper `cloud_off` glyph is still not shipped in the woff2 subset; a future font-subset
  regen (using the now-recorded icons.txt entry) can restore it and revert the swap. Low priority
  — `visibility_off` is an acceptable, correct-reading substitute.

---

## B8 — out-of-credits path: slow, cold copy, dead-end CTA

**Files changed**
- `src/hooks/useWizardStore.ts` — added upfront full-run credit gate in `fetchStrategy` + cost helpers + `CREDIT_COSTS` import.
- `src/modules/wizard/generation/errorMessage.ts` — new shared `OUT_OF_CREDITS_COPY` constant (heading/body/ctaLabel/ctaHref).
- `src/components/onboarding/wizard/GeneratingSlot.tsx` — credit block now uses the shared constant (warm copy + `/dashboard/billing` CTA).
- `src/components/onboarding/wizard/StructureSlot.tsx` — credit block now uses the shared constant.
- `src/hooks/useWizardStore.b8.test.ts` — NEW: upfront-gate regression tests.
- `src/components/onboarding/wizard/creditBlocks.b8.test.tsx` — NEW: CTA-target + warm-copy regression tests for both slots.

### (a) Upfront gate — placement + pageCount
Placed inside the store's `fetchStrategy` action — the single earliest generation trigger for `thing`/`trust` (StructureSlot fires it on mount, before any structure confirmation; the strategy AI call is the earliest charged spend). The gate runs AFTER the synchronous `strategyStatus='fetching'` flip (preserving the existing concurrent-call collapse) and as the FIRST awaited op, before the adapter is lazy-loaded / any `/strategy` call fires:
- `GET /api/credits/balance` once → `totalAvailable`.
- Compare against `estimateFullRunCost(estimateRunPageCount(s))` = `STRATEGY_GENERATION + GENERATE_COPY × pageCount` (single page → 5).
- `pageCount` derivation (`estimateRunPageCount`): a seeded `sitemap` length if present (work-multipage / resumed runs); else, for a multipage template, the count of default-included page archetypes; else 1.
- Insufficient → set `strategyStatus='error' + strategyCreditsError=true + strategyError='Out of credits.'` and RETURN with **zero** AI calls / zero partial charge. Sufficient → proceeds to generation exactly as before.
- A balance-endpoint hiccup (non-`totalAvailable` payload / throw) → `available=null` → does NOT block; the existing per-route 402 gates remain the backstop. This also keeps every pre-existing `fetchStrategy` test green (their fetch stubs return `{}` for the balance URL).

Costs imported from `@/lib/creditCosts` (prisma-free, client-safe) per the risky-surface rule. No risky-surface file touched.

Scope note: the gate covers `thing`/`trust` (single + multi). The WORK multipage (atelier LLM) path runs its charged calls through `GeneratingSlot`'s `runWorkLLMGeneration`, not `fetchStrategy`; it keeps its existing per-route 402 credits handling (now with the corrected CTA/copy in the shared credit block). Adding an equivalent upfront gate to the work path was out of B8's reported scope (thing/trust two-stage partial-charge) — logged here, not implemented.

### (b) Warm copy — ONE shared constant
`OUT_OF_CREDITS_COPY` in `errorMessage.ts` (a PLAIN, no-`'use client'` module both slots already import for `humanizeGenerationError`):
- heading: "You're out of credits"
- body: "Your page is ready to write — top up and we'll build it right now."
- ctaLabel: "Top up now"
- ctaHref: "/dashboard/billing"

### (c) CTA — corrected target
Both slots' primary CTA now → `/dashboard/billing` (the real top-up/checkout flow), label "Top up now". Old dead-end `/dashboard/settings` + "View plans" removed. GeneratingSlot's secondary "Continue to editor without copy" and StructureSlot's "Try again" are preserved.

**Reused OutOfCreditsModal?** No — fixed the inline blocks. The modal is a Radix dialog wired to `useModalManager`/portal machinery not present in the wizard slot chrome; dropping it in would have been a larger, non-minimal change. The inline blocks match the surrounding slot layout and now share the same copy/CTA source of truth as intended by the diagnosis' "otherwise just fix the inline blocks" branch.

### Tests — added + before/after
- `useWizardStore.b8.test.ts` (4 tests): cost math (5 for 1 page, 11 for 3); INSUFFICIENT (balance 1 < 5) → balance checked, NO strategy/copy call, credits-error state; SUFFICIENT (999) → strategy call DOES fire (guards against an inert always-block); balance hiccup → does not block. Pre-fix: no balance call exists and strategy fires unconditionally → the "no strategy call" assertion fails (also `estimateFullRunCost` did not exist → import failure).
- `creditBlocks.b8.test.tsx` (2 tests): render GeneratingSlot (driven to credits via mocked `runGeneration`) AND StructureSlot (store set to `strategyCreditsError`) → primary CTA `href === '/dashboard/billing'`, label "Top up now", body = warm copy, and NO `/dashboard/settings` / "View plans" / "Top up to continue". Pre-fix: CTA was `/dashboard/settings` → fails (also `OUT_OF_CREDITS_COPY` did not exist).

Results: new tests 6/6 pass; existing `useWizardStore.test.ts` 83/83 pass (concurrency + 402 idempotency unaffected); `errorMessage.test.ts` 5/5 pass. `tsc --noEmit` clean except the known unrelated `src/app/page.tsx:6` founder.jpg error.

### Deviations
- WORK multipage upfront gate not added (scope note above).
- Modal not reused (rationale above).

### Open risks / founder sign-off
- Copy wording ("You're out of credits" / "Your page is ready to write — top up and we'll build it right now." / "Top up now") is a reasonable default pending founder validation on preview.
- `pageCount` at strategy time is an ESTIMATE for multipage; if a user ADDS pages at the structure gate beyond the estimate, the per-page copy gate remains the backstop (may still show a credits error mid-fan-out, but now with the corrected warm CTA). The reported bug (single-page two-stage partial charge) is fully resolved.

### B8 follow-up — WORK engine upfront gate + shared gate module

**Additional files changed**
- `src/lib/creditRunGate.ts` — NEW plain/client-safe gate module: `estimateFullRunCost`, `estimateCopyOnlyCost`, `isRunUnaffordable` (the `GET /api/credits/balance` check). Shared by BOTH the client store and the plain work adapter.
- `src/hooks/useWizardStore.ts` — `estimateFullRunCost` + the inline balance-fetch moved OUT to `creditRunGate`; `fetchStrategy` now calls `isRunUnaffordable(estimateFullRunCost(estimateRunPageCount(s)))`. `estimateRunPageCount` stays local (needs store types). Import swapped from `@/lib/creditCosts` → `@/lib/creditRunGate`.
- `src/modules/wizard/generation/work.llm.ts` — added the upfront gate to `runWorkLLMGeneration` (the work multipage/atelier LLM fan-out entry point).
- `src/modules/wizard/generation/work.llm.b8.test.ts` — NEW work-path regression tests.
- `src/hooks/useWizardStore.b8.test.ts` — updated `estimateFullRunCost` import to `@/lib/creditRunGate`.

**Work entry point** — `runWorkLLMGeneration` in `src/modules/wizard/generation/work.llm.ts`, called DIRECTLY by `GeneratingSlot` for `engine==='work' && isWorkMultipage()` on the allow-list (atelier). This is a PLAIN module that must never import the store (firewall) — hence the shared `creditRunGate` module rather than reusing the store's helper.

**Work charge model (verified in the routes)** — same shape as thing/trust: `/api/audience/work/strategy` charges `CREDIT_COSTS.STRATEGY_GENERATION` (2) once (route.ts:128), then `/api/audience/work/generate-copy` charges `CREDIT_COSTS.GENERATE_COPY` (3) per page (route.ts:220). `runWorksFanOut` is LLM-free (zero charge). So work full-run cost = `STRATEGY_GENERATION + GENERATE_COPY × pages` = `estimateFullRunCost(pages)`.

**Estimator / pageCount** — accurate upfront: `input.pages` is the CONFIRMED sitemap, seeded chargeless from the page-archetype menu (never an LLM fetch), so `pageCount = input.pages.length` is exact for a fresh single run — no mid-fan-out gap. When a strategy is pre-supplied (`input.strategy`), the strategy charge is skipped, so cost = `estimateCopyOnlyCost(pages)`.

**Placement** — right before the "Fresh run" strategy call, AFTER the resume block. A resumable run (`isResumableGeneration`) returns earlier via `runFanOut`, so its already-paid strategy is never re-gated with the full cost; the per-page 402 remains the backstop for resume and for any structure-gate add-pages overrun. Insufficient ⇒ `return { status: 'credits' }`, which `GeneratingSlot`'s existing `mpResult.status==='credits'` handler renders via the shared warm out-of-credits block (heading/body/CTA already fixed in the first pass). Same constraints held: client-side + `/api/credits/balance` only; no risky-surface file touched; balance hiccup does not block.

**New tests + before/after** — `work.llm.b8.test.ts` (3): INSUFFICIENT (balance 1 < 8 for 2 pages) → balance checked, NO `/api/audience/work/strategy` or `/generate-copy` call, `status:'credits'`; SUFFICIENT (999) → strategy call DOES fire (guards against inert always-block); balance hiccup → does not block. Pre-fix: no balance call exists and the strategy call fires unconditionally → the "no strategy call" assertion fails (also `runWorkLLMGeneration` had no gate).

**Results** — all b8 files 9/9 pass; existing `useWizardStore.test.ts` + `errorMessage.test.ts` + `work.llm.test.ts` 107/107 pass; `tsc --noEmit` clean except the known unrelated `src/app/page.tsx:6` founder.jpg error.

**Deviations from the follow-up** — none. WORK is now covered end-to-end (fast-fail + warm copy + correct CTA). The granth (work single-page) generator and the non-allow-list skeleton path make ZERO charged LLM calls, so they need no gate.
