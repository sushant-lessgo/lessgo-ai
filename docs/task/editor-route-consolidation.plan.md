# editor-route-consolidation — plan

**WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\editor-route-consolidation`
**Branch:** `feature/editor-route-consolidation`
**Spec:** `docs/task/editor-route-consolidation.spec.md` · **Scout:** `docs/task/editor-route-consolidation.scout.md`

## Overview

Make `/edit/[token]` the single home for preview, reveal, and publish on the **work journey** (pilot slice — nothing deleted). Preview becomes an in-editor mode flip (`setMode('preview')`, already load-bearing in `LandingPageRenderer`) plus a true-viewport mobile view via a new chromeless `/edit/[token]/preview` sub-route framed in an iframe; the work-journey reveal (STEP 06 `/preview?chrome=0` iframe) folds into the editor's first-load state (`?reveal=1`); the real publish flow (today only on `/preview`) is extracted into a shared hook and wired to the editor header's Publish shell. XFO SAMEORIGIN re-points from `/preview/:token+` onto the narrow sub-route, atomically with the reveal move.

## Progress log

- phase 1 inline preview mode (Edit/Preview flip): done (commit dd9d0e37, review loops 1, ship)
- phase 2 chromeless editor-preview sub-route: done (commit pending, review loops 1, ship)
- phase 3 XFO SAMEORIGIN on sub-route (additive): done (commit 3b34da3b, review loops 1, ship; curl -I runtime PASSED 6/6 URLs on worktree dev; founder visual iframe-render confirm folds into merge gate)
- phase 4 mobile-view iframe toggle: done (commit pending, review loops 1, ship; save-before-frame + key-remount + XFO-target verified; greyed GlobalAppHeader toggle coexistence = later sweep)
- phase 5 reveal fold onto edit route + /preview XFO retire: done (commit 6f04ef90, review loops 1, ship; one-drive guard preserved, Suspense dodged via window.location.search, /preview SAMEORIGIN retired — only StepReveal framed it; workPlan.spec + resume-step-6 intercept in scope; curl re-verify PASSED — /edit/:t/preview sole SAMEORIGIN, /preview now DENY; founder journey QA at merge gate)
- phase 6 publish relocation into editor header: done (commit pending, review loops 1, ship; shared usePublishFlow — /preview + editor no divergence; payload contract byte-identical; htmlContent-drop safe; tabManager now dead-code; founder publish e2e at merge gate)
- non-blocking follow-ups (later sweep): editor Publish button not gated on isPublishReady (store-derived gate); delete dead src/utils/tabManager.ts; remove greyed GlobalAppHeader device SegmentedControl; tidy stale PreviewButton comments in EditHeaderRightPanel
- pilot decision gate (founder sign-off): pending

## Global rules (all phases)

- Every phase ends green: `npx tsc --noEmit` · `npm run test:run` · `npm run lint`. `npm run build` additionally on phases 2, 3, 5, 6 (new route / config / route-graph changes).
- **No block-component edits anywhere** — this feature reuses renderers; if a phase seems to need a `.tsx`/`.published.tsx` block change, stop and escalate (dual-renderer trap).
- New authed Playwright specs must be added to the authed-spec list in `playwright.config.ts` (include it in Files touched where a new spec lands).
- `/preview` and `/generate` routes stay alive and functional this whole slice. `continueRouting.ts` `/generate` branch untouched ("Do NOT simplify").
- Publish-options dropdown stays greyed (`Coming what="publish options"`). Onboarding post-gen LOCK is OUT of scope.

---

## Phase 1 — Inline preview mode: real Edit/Preview flip

**Goal:** The inert segmented control in the editor header becomes a real mode toggle driving `setMode('edit'|'preview')` — clean read view in-place, no new tab. (Risky surfaces: editor store, editor header.)

**Files touched**
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx`
- `src/app/edit/[token]/components/layout/EditLayout.tsx`
- `src/app/edit/[token]/components/ui/PreviewButton.tsx` (delete — see steps)
- `e2e/editor-preview-mode.spec.ts` (new)
- `playwright.config.ts` (authed-spec list)

**Steps**
1. `EditHeaderRightPanel.tsx` (segmented control, lines ~167-182): replace inert "Edit" span + `PreviewButton` with two real buttons reading `mode` via selector (`useEditStore(s => s.mode)`) and calling `setMode` via store API. `aria-current` follows actual mode. `setMode('preview')` already clears selection + hides toolbar (`coreActions.ts:196-205`) — no store changes needed.
2. Do NOT touch the Publish split-button — it keeps `handlePreviewClick` (opens `/preview`) until phase 6. `usePreviewNavigation.ts` therefore stays alive this phase.
3. `EditLayout.tsx`: when `mode==='preview'`, hide `LeftPanel` and any edit-only affordances around the canvas so the read view is clean; canvas read-only behavior comes free from the renderer's existing `mode!=='preview'` branches (`LandingPageRenderer.tsx:64,539,574,610`). Preserve the "no canvas ancestor gets `.app-chrome`" rule (EditLayout.tsx:127-150) — header/panels stay chromed, canvas untouched.
4. Delete `PreviewButton.tsx` after grep confirms no other importers (scout: only the segmented control uses it).
5. New `e2e/editor-preview-mode.spec.ts` (authed, `seedDraft` helper): load `/edit/{token}` → assert `data-mode="edit"` + contentEditable present → click Preview → assert `data-mode="preview"`, zero `[contenteditable="true"]`, LeftPanel hidden → click Edit → editable again. Deterministic read-mode check, not a manual TODO.

**Verification:** tsc / test:run / lint green; `npx playwright test editor-preview-mode` green.

---

## Phase 2 — Chromeless editor-preview sub-route

**Goal:** `/edit/[token]/preview` — a standalone read-only, app-chrome-free render of the draft, bootstrapped with the preview-optimized provider config. This is the future iframe target (phase 4) and XFO surface (phase 3); it is directly navigable so it verifies standalone. (Risky surfaces: EditProvider bootstrap, dual-renderer surface — read-only reuse.)

**Files touched**
- `src/app/edit/[token]/preview/page.tsx` (new)
- `e2e/editor-preview-route.spec.ts` (new)
- `playwright.config.ts` (authed-spec list)

**Steps**
1. New `"use client"` page under `src/app/edit/[token]/preview/`. Mount `EditProvider` with the preview config exactly as `preview/[token]/page.tsx:66-71` does today: `prefetchBaselineForReview: false`, `resetOnTokenChange: false` — this preserves the ~68KB baseline-skip; the main `/edit` route's provider is NOT touched (constraint satisfied without provider rearchitecture; baseline stays lazy via `ensureBaseline()`).
2. On mount `setMode('preview')`; render the canvas modeled on the preview page's `?chrome=0` branch (`preview/[token]/page.tsx:106-136`): renderer + ThemeInjector/SSRTokens/fonts, no header, no panels, and **no `.app-chrome` class anywhere in the tree**.
3. Deliberate, documented duplication of the chrome=0 branch — do NOT refactor `preview/[token]/page.tsx` this phase (it retires in the follow-on; churn there now is risk without payoff).
4. New `e2e/editor-preview-route.spec.ts` (authed, `seedDraft`): navigate to `/edit/{token}/preview` → sections render; zero `[contenteditable="true"]`; assert the canvas root has NO `.app-chrome` ancestor (`page.evaluate` closest check); seeded copy text visible (data-integrity: loadDraft path works).

**Verification:** tsc / test:run / lint / `npm run build` green (new route compiles); Playwright spec green.

---

## Phase 3 — XFO: SAMEORIGIN on the sub-route (additive) — **HUMAN GATE**

**Goal:** Make `/edit/[token]/preview` framable, everything else in `/edit` stays DENY. Additive only — the existing `/preview/:token+` SAMEORIGIN rule **stays** (StepReveal still frames `/preview` until phase 5). (Risky surface: XFO/headers — runtime behavior, build can't catch mistakes.)

**Files touched**
- `next.config.js`
- `e2e/xfo-headers.spec.ts` (new)

**Steps**
1. `next.config.js` headers (currently lines 44-55): add `{ source: '/edit/:token/preview', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }` (single-segment `:token`, NOT `:token+` — don't widen the framable surface). Change the DENY source from `/((?!preview/).*)` to `/((?!preview/)(?!edit/[^/]+/preview$).*)` so the three sources stay mutually exclusive. Exact regex must be validated at runtime (path-to-regexp semantics), not assumed.
2. New `e2e/xfo-headers.spec.ts` (request-context, no browser needed): assert response `x-frame-options` header is exactly one value per URL — `/edit/x/preview` → SAMEORIGIN; `/edit/x` → DENY; `/preview/x` → SAMEORIGIN (still, this phase); `/` and `/dashboard` → DENY. This is the deterministic route-gate check.

**Verification:** tsc / lint / `npm run build` green; xfo-headers spec green.

**HUMAN GATE (XFO):** founder/orchestrator runs `curl -I` against dev or the QA preview deploy on the four URLs above; confirms exactly one XFO header per response, SAMEORIGIN only on the sub-route (and legacy `/preview`), DENY elsewhere. Do not proceed to phase 4 without this — the failure mode is a silently blank iframe.

---

## Phase 4 — Mobile-view iframe toggle

**Goal:** Wire the dead `DeviceToggle`/`setDeviceMode` so preview mode gets a true-viewport mobile view: `deviceMode==='mobile'` swaps the inline canvas for a phone-sized iframe of `/edit/{token}/preview` (real breakpoints fire; escapes `.app-chrome` by being a separate document). Desktop preview stays inline. (Risky surfaces: editor store; iframe depends on phase-3 XFO.)

**Files touched**
- `src/app/edit/[token]/components/ui/DeviceToggle.tsx`
- `src/app/edit/[token]/components/ui/MobilePreviewFrame.tsx` (new)
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx`
- `src/app/edit/[token]/components/layout/EditLayout.tsx`
- `e2e/editor-preview-mode.spec.ts` (extend)

**Steps**
1. `DeviceToggle.tsx`: restore the commented-out `onClick` (line ~23) → `setDeviceMode('desktop'|'mobile')` (`layoutActions.ts:698` — exists, inert today); highlight from `globalSettings.deviceMode` selector.
2. `EditHeaderRightPanel.tsx`: mount `DeviceToggle` only when `mode==='preview'`.
3. New `MobilePreviewFrame.tsx`: centered phone frame (~390×844) containing `<iframe src="/edit/{token}/preview">`. **Before mounting the iframe, await a forced `save()`** so the sub-route's `loadDraft` sees the latest edits (state handoff = DB reload, no postMessage — per spec, don't rearchitect). Remount (`key`) each time mobile view is entered so re-entry reloads fresh.
4. `EditLayout.tsx`: when `mode==='preview' && deviceMode==='mobile'`, render `MobilePreviewFrame` in place of the inline canvas. On leaving preview mode, reset `deviceMode` to `'desktop'` via a component effect (no new store logic).
5. Extend `e2e/editor-preview-mode.spec.ts`: (a) edit a headline → Preview → mobile → iframe with `src` containing `/edit/` + `/preview` visible at ~390px; `frameLocator` sees the **edited** text (save-before-frame data-integrity check); (b) toggle desktop → inline canvas returns; (c) back to Edit → editable.

**Verification:** tsc / test:run / lint / **`npm run build`** green (new `MobilePreviewFrame` + iframe route dependency — build is cheap insurance here); extended Playwright spec green (iframe actually renders content — catches silent XFO blank deterministically).

**Implementer notes (from plan-review):** `DeviceToggle.tsx:11-15` currently renders THREE buttons (desktop/tablet/**mobile**) and its commented handler calls `setGlobalSettings({ deviceMode })`, but this plan wires the 2-value `setDeviceMode('desktop'|'mobile')` (`layoutActions.ts:698`). Reconcile: drop/hide the tablet button (only desktop/mobile in scope) and pick ONE setter (prefer `setDeviceMode` — the dedicated action). Both files are already in Files-touched.

---

## Phase 5 — Reveal folds onto the edit route + retire /preview SAMEORIGIN — **HUMAN GATE**

**Goal:** Work-journey STEP 05 completion lands the user at `/edit/{token}?reveal=1` (editor first-load reveal); STEP 06 `/preview?chrome=0` iframe is dropped; the `/preview/:token+` SAMEORIGIN rule moves off in the SAME change (the config's "MUST MOVE WITH THE REVEAL" note). (Risky surfaces: reveal seam / one-drive guard, XFO, editor bootstrap.)

**Files touched**
- `src/components/onboarding/journey/steps/StepBuilding.tsx`
- `src/components/onboarding/journey/steps/StepReveal.tsx` (delete)
- `src/components/onboarding/journey/JourneyShell.tsx`
- `src/app/generate/[token]/components/PageRevealAnimation.tsx` (move → below)
- `src/components/reveal/PageRevealAnimation.tsx` (new location)
- `src/app/generate/[token]/page.tsx` (import path only)
- `src/app/edit/[token]/page.tsx` (and/or its `EditPageContent` if the reveal wiring lives there)
- `next.config.js`
- `e2e/work-onboarding.spec.ts` (extend)
- `e2e/xfo-headers.spec.ts` (update expectations)

**Steps**
1. `StepBuilding.tsx`: on `result.ok`, replace `setJourneyStep(6)` with `router.push('/edit/{tokenId}?reveal=1')` (tokenId from `useWizardStore` as StepReveal does today). **The one-drive-per-mount guard (lines 66-90: `startedFor` ref keyed on `attempt`, no cleanup, no cancelled flag) is carried over byte-for-byte** — cleanup/cancelled variants were tried and are known bugs. Everything else in the mount effect unchanged. Rationale comment (lines 22-26) updated, not deleted.
2. `JourneyShell.tsx`: remove the step-6/StepReveal registration; delete `StepReveal.tsx` (journey-internal; the `/preview` ROUTE itself is untouched). No reveal surface may be introduced inside `JourneyShell` (whole journey sits under `.app-chrome`, line 178 — bleed trap).
3. Move `PageRevealAnimation.tsx` to `src/components/reveal/` (shared home). **First grep for ALL importers** (not just `/generate`) and re-point each — any importer outside Files-touched forces a scope bump (tsc will catch a miss, but grep first to avoid the thrash). `/generate` keeps working (wizard still reveals there this slice).
4. Edit page: read `?reveal=1` after draft load. When present: set `mode='preview'` for the first paint (reveal = the clean site, matching today's reveal-then-open-editor UX; segmented control from phase 1 is the "go edit" affordance), wrap the canvas in `PageRevealAnimation` (`sectionsCount` from store), then `router.replace` to strip the param + a once-ref so refresh/back never re-animates. `EditProvider` bootstrap unchanged (full edit config — reveal is a first-load presentation state, not a provider mode). **⚠ Suspense trap (plan-review):** this codebase's `next build` HARD-FAILS with `missing-suspense-with-csr-bailout` if `useSearchParams` is used without a Suspense boundary (see `preview/[token]/page.tsx:38-52`). `/edit/[token]/page.tsx` is `'use client'` — either wrap the reveal-reading subtree in `<Suspense>`, OR read `window.location.search` in a mount effect (no Suspense needed). Do NOT add a bare `useSearchParams` or the phase-5 build gate breaks on first try.
5. `next.config.js`: grep the repo for any remaining `<iframe` framing `/preview` (check `preview/[token]/privacy`, `admin/page.tsx`, `WorkLibraryClient.tsx` — expected: StepReveal was the ONLY framer). If clean: delete the `/preview/:token+` SAMEORIGIN rule and simplify DENY to `/((?!edit/[^/]+/preview$).*)`. If a framer is found: leave the rule, document, and raise at the gate.
6. e2e: extend `e2e/work-onboarding.spec.ts` (mock-mode journey): complete generation → URL is `/edit/{token}` (reveal param consumed), reveal animation container visible, sections render; **route-intercept counter asserts the generation endpoint fired exactly once**; reload → no reveal animation. Update `xfo-headers.spec.ts`: `/preview/x` now DENY.

**Verification:** tsc / test:run / lint / `npm run build` green; both Playwright specs green.

**HUMAN GATE (XFO move + reveal):** `curl -I` re-verification (sub-route SAMEORIGIN, `/preview` now DENY, everything else DENY, mutually exclusive) AND founder runs one real work journey on the QA preview deploy: generation completes → lands in the editor reveal (renders, not blank), flip to edit works, no double generation.

---

## Phase 6 — Publish relocated into the editor header — **HUMAN GATE**

**Goal:** The editor header's Publish shell runs the real publish flow in-place (SlugModal → `/api/publish` → success card → domain upsell); no `/preview` hop. `/preview` keeps publishing too (shared hook — one source of truth, no divergence). (Risky surface: THE PUBLISH PATH — highest-risk phase; also editor header, tabManager lifecycle.)

**Files touched**
- `src/app/edit/[token]/components/publish/usePublishFlow.ts` (new)
- `src/app/edit/[token]/components/publish/PublishSuccessCard.tsx` (new)
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx`
- `src/app/preview/[token]/page.tsx` (refactor to consume the hook + card)
- `src/app/edit/[token]/components/ui/usePreviewNavigation.ts` (delete)
- `e2e/publish.spec.ts` (extend)
- `playwright.config.ts` (if list changes)

**Steps**
1. Extract `usePublishFlow(tokenId)` from `PreviewPageContent` (`preview/[token]/page.tsx:198-215, 351-502`): state (publishing / success / publishedUrl / error / slug+domain modal flags / customSlug / publishTitle / analyticsEnabled / existingPublished) + handlers — `openPublish` (force `save()`, seed slug/title via `generateSmartTitle`, fetch `GET /api/projects/{tokenId}/published-slug`), `doPublish` (assemble the multi-page payload via `export()`, `POST /api/publish`), domain-modal handoff. **Payload contract to `/api/publish` unchanged** (`slug,title,content{layout,content,forms,legalPages,subpages,chrome,seo},themeValues,tokenId,inputText,...`). Drop the vestigial `#landing-preview` innerHTML read (server ignores `htmlContent` — re-verify in `api/publish/route.ts` before removing).
2. Extract the inline "You're live!" JSX (preview page 655-767) into `PublishSuccessCard.tsx` (prop-driven).
3. `EditHeaderRightPanel.tsx`: Publish main button → `openPublish` (renders `SlugModal` + `CustomDomainModal` — both already self-contained prop-driven, lift as-is — plus `PublishSuccessCard` as an in-editor overlay/modal). Dropdown stays greyed. **`SlugModal onReview` (plan-review):** on `/preview` today `onReview={handleEdit}` navigates back to the editor (`preview/page.tsx:640`). In-editor there's no "back to editor" target — wire `onReview` to close the modal + flip to `mode='edit'` (or `mode='preview'` for a look), NOT a navigation. Resolve concretely at implement; don't leave it pointing at a dead handler.
4. Refactor `preview/[token]/page.tsx` to consume `usePublishFlow` + `PublishSuccessCard` — behavior-identical; `/preview` remains fully functional for admin + work-dashboard "Update site".
5. Delete `usePreviewNavigation.ts` (its last caller, the Publish button, is rewired; `PreviewButton` died in phase 1). Grep `getTabManager` to confirm the singleton's remaining owner set is consistent (no refcount — must have exactly one owner per tab role); remove the preview-side stash/focus/close code paths that are now dead.
6. Extend `e2e/publish.spec.ts` (authed): from `/edit/{token}` click Publish → SlugModal → confirm → success card shows URL → `GET /p/{slug}` returns 200 AND contains a seeded copy string (publish data-integrity, not endpoint-only). Keep any existing preview-route publish coverage green (both paths tested until retirement).

**Verification:** tsc / test:run / lint / `npm run build` green; publish spec green both paths.

**HUMAN GATE (publish path):** founder-verified publish end-to-end **from the editor** on the QA preview deploy: creates/updates `PublishedPage` + new `PublishedPageVersion`, blob + KV written, `/p/[slug]` serves, republish works, domain modal opens. No merge before this passes.

---

## Pilot decision gate (after phase 6) — **HUMAN GATE**

Founder sign-off on the QA preview: full work journey → in-editor reveal → Edit/Preview flip → mobile iframe view → in-editor publish → `/p/[slug]` live. `/preview` + `/generate` still function for admin / work-dashboard / wizard. On pass → follow-on spec retires the routes (admin, work-dashboard, error-boundary, privacy, wizard migration — explicitly NOT this slice).

## Unresolved questions

1. Reveal lands in **preview read-mode** first (flip to edit via control) — confirm, or straight into edit mode with animation?
2. Phase 5 removes `/preview` SAMEORIGIN only if grep finds no remaining framer — if privacy-preview turns out framed, OK to defer removal to retirement follow-on?
3. Mobile frame fixed ~390×844, desktop preview stays inline (no desktop iframe) — OK?
4. Publish success = in-editor modal overlay (extracted card) — OK, or inline panel?
5. Old "open preview in new tab" escape hatch disappears entirely with phase 1/6 — acceptable during pilot?
