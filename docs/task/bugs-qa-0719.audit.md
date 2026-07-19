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

---

## B1 — "Uploaded 8 photos, only 4 uploaded" (work-engine photo ingestion)

**Files changed**
- `src/lib/media/compressImageClient.ts` (NEW) — client-side downscale/re-encode util.
- `src/lib/media/uploadClient.ts` — calls the compress seam before each POST; injectable `compress` option.
- `src/lib/media/uploadClient.test.ts` — B1 regression tests (seam + SVG passthrough).

**Root cause** — Onboarding POSTs each RAW full-res image File to `/api/upload-image`. On Vercel a serverless Function 413s AT THE EDGE any body > ~4.5 MB before the handler runs. Full-res photographer JPEGs routinely exceed 4.5 MB → those requests 413 → land in the client `failed` bucket → only sub-4.5MB photos survive ("8 → 4"). No client-side downscale existed even though the server pipeline already downscales to 2400px WebP. (Precedent: the VIDEO path was moved to direct-to-Blob to dodge this same 413; images never got equivalent treatment.)

**Fix (root-cause)** — Added a client raster downscale/re-encode step BEFORE building the multipart body, so uploaded bytes stay well under the ~4.5MB edge cap. The server sharp pipeline (`route.ts` / `processImage`) is UNTOUCHED and remains the authoritative producer of the stored WebP + blur + checksum + assetId. Direct-to-Blob was NOT adopted (rejected for B1 — it bypasses that pipeline).

**compress util contract** (`compressImageForUpload(file) => Promise<File>`):
- Max longest edge = 2400px (`CLIENT_MAX_EDGE`, mirrors server `MAX_WIDTH`).
- Format = WebP, quality 0.85 (`CLIENT_WEBP_QUALITY`, mirrors server `WEBP_QUALITY`=85).
- Uses `createImageBitmap` → `<canvas>` draw → `canvas.toBlob('image/webp', 0.85)`.
- PASSTHROUGH (return the untouched original) when: SVG (`image/svg+xml`) or GIF (`image/gif`); non-image type; no canvas/`createImageBitmap` (SSR/jsdom); decode fails; toBlob returns null; OR the re-encode is NOT smaller than the original.
- NEVER throws — any failure falls back to the original File (edge cap + server validation remain the backstop).
- Preserves the original filename stem (extension → `.webp`) and `lastModified`.

**Seam injection for tests** — `UploadImageFilesOptions.compress?: CompressImageFn`; defaults to the real `compressImageForUpload`. `uploadOne` awaits `compress(file)` and POSTs the result, but returns the ORIGINAL `file` in `UploadedImage.file` so `ShowWorkStep` can still join EXIF dates / `webkitRelativePath` by File identity (those are read from originals pre-upload — `ShowWorkStep.tsx` NOT changed). Tests inject a fake `compress` returning a small WebP Blob (jsdom has no real canvas encode).

**Size-guard change** — The onboarding path (`uploadClient.ts`) had NO client-side size guard; the only guard is the server route's `MAX_FILE_SIZE = 10MB`, left UNTOUCHED per scope (a sane server safety net; after client compression images are typically <1MB, well under both it and the ~4.5MB edge cap). So the correct fix is bounding the payload client-side, not relaxing a guard. No guard was weakened.

**Regression test + before/after** — `uploadClient.test.ts`:
- "routes a large raster through the compress seam" — feeds a ~6MB `image/jpeg`, injects a fake compress → asserts the seam was called with the original, the FormData file sent to `fetch` is `image/webp` and smaller than the original, and `uploaded[0].file` is still the original. PRE-FIX: FAILS ("expected compress to be called 1 times, got 0" — old `uploadOne` appended the untouched original). POST-FIX: PASSES.
- "passthrough: SVG uploaded unchanged" — default compress; asserts the POSTed file IS the original SVG.
- Verified: `git stash` of the fix → `vitest run` → 1 failed / 7 passed (the B1 seam test fails). Restored → 8/8 pass.
- LIMITATION (documented in-test): jsdom has no canvas encode, so tests pin the CODE-LEVEL contract "client routes each file through the compress seam and POSTs the result" — not real canvas re-encoding. The actual 413 only manifests on Vercel (dev has no 4.5MB cap).

**Fast-follow (NOT done — out of scope)** — The EDITOR image-upload path `src/hooks/editStore/formsImageActions.ts` (`uploadImage`, client guard `10MB` at line ~313) has the IDENTICAL bug: it POSTs raw Files to `/api/upload-image` with a 10MB guard > the ~4.5MB edge cap. It should call the same new `compressImageForUpload` before POST. Left as a documented fast-follow ticket — editor-store internals are a risky surface and this was not founder-reported.

**Results** — `vitest run src/lib/media/uploadClient.test.ts` → 8/8 pass. `tsc --noEmit` clean except the known unrelated `src/app/page.tsx:6` founder.jpg error.

**Deviations** — none.
