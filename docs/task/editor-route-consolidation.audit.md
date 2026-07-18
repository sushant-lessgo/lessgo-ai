# editor-route-consolidation — implementation audit

## Phase 1 — Inline preview mode (real Edit/Preview flip)

**Files changed**
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` (modified)
- `src/app/edit/[token]/components/layout/EditLayout.tsx` (modified)
- `src/app/edit/[token]/components/ui/PreviewButton.tsx` (deleted)
- `e2e/editor-preview-mode.spec.ts` (new)
- `playwright.config.ts` (modified — authed-spec allowlist)

### Per-file

**EditHeaderRightPanel.tsx**
- Removed the `PreviewButton` import (component deleted).
- Added a single-scalar `mode` selector: `useEditStore((s) => s.mode)`.
- Replaced the inert segmented control (a static `Edit` span + the navigating
  `PreviewButton`) with two real buttons inside the same `role="group"
  aria-label="Edit or preview"` shell. Each button calls
  `storeApi.getState().setMode('edit'|'preview')`; `aria-current` follows the
  live `mode` (`mode !== 'preview'` for Edit, `mode === 'preview'` for Preview).
  Active/inactive segment styling preserved from the original (raised chip vs
  ghost). No store changes needed — `setMode('preview')` already clears
  selection + hides the toolbar in `coreActions.ts`.
- The Publish split-button is UNTOUCHED — still wired to `handlePreviewClick` /
  `isNavigating` from `usePreviewNavigation(tokenId)`, which therefore stays
  alive this phase (per plan step 2).

**EditLayout.tsx**
- Gated the `LeftPanel` wrapper `<div>` and its mobile overlay behind
  `mode !== 'preview'`, so the rail is unmounted in preview mode for a clean
  read view. No other structural change. The `.app-chrome` attach map is
  intact: the rail wrapper (which carries `.app-chrome`) is simply not rendered
  in preview; the canvas (`MainContent`) and its ancestors still never receive
  `.app-chrome`. Canvas read-only behavior comes for free from the renderer's
  existing `mode!=='preview'` branches.

**PreviewButton.tsx** — deleted. Grep confirmed the only importer was the
segmented control in EditHeaderRightPanel (now rewired). The
`usePreviewNavigation` hook it used to receive props for is still owned by
EditHeaderRightPanel for the Publish button, so no lifecycle owner was lost.

**e2e/editor-preview-mode.spec.ts** (new) — authed spec modeled on
`toolbar-dispatch.spec.ts`: seeds a mock-mode Meridian draft via the real
persona → `/api/start` → `seedDraft` path (the existing shared helper; no new
infra invented), opens `/edit/{token}`, then asserts the flip:
1. first-load `data-mode="edit"` + `[contenteditable="true"]` present + rail
   (`[aria-label="Left rail panel"]`) present;
2. click Preview → `data-mode="preview"`, zero `[contenteditable="true"]`, rail
   count 0, Preview segment `aria-current="true"`;
3. click Edit → `data-mode="edit"`, editable again, rail returns.

`data-mode` reads off the renderer `<main data-mode={mode}>`
(`LandingPageRenderer.tsx:761`). Rail marker is LeftPanel's SegmentedControl
`aria-label="Left rail panel"` (a stable existing attribute).

**playwright.config.ts** — added `/editor-preview-mode\.spec\.ts/` to the
`authed` project's `testMatch` allowlist (an unregistered spec silently runs
zero tests).

### Decisions / deviations
- **`aria-current`** rendered as the boolean-derived string (`"true"`/`"false"`)
  via `aria-current={mode !== 'preview'}` — React serializes aria booleans to
  the string form, which the spec asserts against. Conservative and standard.
- **next-env.d.ts**: this fresh worktree had never been built, so the
  Next-generated `next-env.d.ts` was absent and `tsc` failed with a single
  environmental `TS2307` on an image import in the UNMODIFIED `src/app/page.tsx`.
  Regenerated the standard gitignored `next-env.d.ts` stub (two `///
  <reference>` lines) so tsc could see Next's image-module types. It is
  gitignored (`git check-ignore` confirmed) — not a tracked-source edit and not
  in the repo diff. After that, tsc is fully clean. No production file outside
  Files-touched was changed.

### Green gate (run from WORKDIR)
- `npx tsc --noEmit` → **EXIT 0** (clean, after regenerating gitignored
  next-env.d.ts as noted).
- `npm run test:run` → **EXIT 0** — 250 files passed / 1 skipped; 4035 tests
  passed / 14 skipped.
- `npm run lint` → **EXIT 0** — only pre-existing warnings (techpremium/vestria
  `<img>` LCP warnings + a ph-provider exhaustive-deps warning); NONE in the
  files this phase touched.

### Playwright spec status
- **Not run locally.** The authed spec needs a live dev server plus the
  `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD` / `CLERK_SECRET_KEY`
  environment (the spec `test.skip`s itself without them, per the existing
  authed-spec convention). Those creds/server were not available in this
  implementation environment, so the spec was authored + registered but not
  executed. It should run green on the QA preview / a configured local dev run
  via `npx playwright test editor-preview-mode`.

### Open risks
- Playwright spec is unexecuted here (see above) — first real run happens on the
  configured e2e environment; watch for the mock-mode Meridian seed rendering a
  contenteditable headline within the 60s budget (same pattern the toolbar specs
  rely on, so low risk).
- Preview mode currently just unmounts the rail; the chromeless sub-route,
  mobile iframe, reveal fold, and publish relocation are later phases — no
  behavior beyond the in-place mode flip was added.

## Phase 2 — Chromeless editor-preview sub-route

**Files changed**
- `src/app/edit/[token]/preview/page.tsx` (new)
- `e2e/editor-preview-route.spec.ts` (new)
- `playwright.config.ts` (modified — authed-spec allowlist)

### Per-file

**src/app/edit/[token]/preview/page.tsx** (new) — a `"use client"` standalone
chromeless render of the draft. `EditorPreviewPage` mounts `EditProvider` with
the SAME preview-optimized options as `preview/[token]/page.tsx:66-71`
(`resetOnTokenChange: false`, `prefetchBaselineForReview: false`) plus the shared
`showLoadingState`/`showErrorBoundary`. The main `/edit` route's provider is NOT
touched, so the ~68 KB baseline-skip is preserved without any provider
rearchitecture (baseline stays lazy via `ensureBaseline()`). The body,
`EditorPreviewSiteOnly`, is a verbatim mirror of that page's `PreviewSiteOnly`
(`?chrome=0`) branch: `setMode('preview')` on mount + a one-shot default-to-home
effect, then `#landing-preview` → `LandingPageRenderer`. No header, no panels, no
publish surface.

### Key decisions

- **Baseline-skip preserved without touching `/edit`:** duplicated the provider
  option block (`resetOnTokenChange:false` + `prefetchBaselineForReview:false`)
  rather than share a config — the constraint was "don't touch the main provider,"
  which a new route with its own provider satisfies directly.
- **No `.app-chrome` in the tree:** the page imports ONLY `EditProvider`, the
  store hooks, and `LandingPageRenderer` — nothing from `@/app/edit/**` (the
  editor shell/panels that carry `.app-chrome`). The root layout does not add
  `.app-chrome` (that class lives inside `EditLayout` / the preview action-bar
  wrapper, neither of which is in this tree). The canvas therefore has no
  `.app-chrome` ancestor — asserted by the e2e `closest('.app-chrome')` check.
- **No Suspense boundary needed (Suspense trap avoided):** unlike
  `preview/[token]/page.tsx`, this route reads NO `useSearchParams`/`usePathname`
  at page level — the chromeless render is unconditional (it's the route's whole
  purpose), so there is no `?chrome=0` flag to read and the
  `missing-suspense-with-csr-bailout` build failure cannot arise. Confirmed: the
  build compiled the route cleanly with no Suspense wrapper.
- **Deliberate documented duplication:** did NOT refactor
  `preview/[token]/page.tsx` (it retires in a follow-on) — a header comment in the
  new file records why (churn on a load-bearing flow, dual-renderer/bleed risk,
  no payoff before retirement).
- **Distinct testid:** `data-testid="editor-preview-chromeless"` (vs the preview
  page's `preview-chromeless`) so the two chromeless surfaces stay
  independently targetable.

**e2e/editor-preview-route.spec.ts** (new) — authed spec modeled on
`editor-preview-mode.spec.ts`: seeds a mock-mode Meridian draft via
persona → `/api/start` → `seedDraft`, opens `/edit/{token}/preview`, and asserts
(all REAL, would fail on regression):
1. the chromeless container renders AND the renderer main is `data-mode="preview"`
   AND the seeded hero copy (`/Ship on Friday/i`) is visible — the loadDraft /
   preview-provider data-integrity check (fails on a blank/broken sub-route);
2. zero `[contenteditable="true"]` — read-only;
3. `page.evaluate` → `document.getElementById('landing-preview').closest('.app-chrome')`
   is `false` (canvas exists AND has no app-chrome ancestor) — fails on chrome
   bleed OR a missing canvas.

**playwright.config.ts** — added `/editor-preview-route\.spec\.ts/` to the
`authed` project's `testMatch` allowlist (an unregistered spec silently runs zero
tests).

### Green gate (run from WORKDIR)
- `npx tsc --noEmit` → **EXIT 0** (next-env.d.ts already present from phase 1).
- `npm run test:run` → **EXIT 0** — 250 files passed / 1 skipped; 4035 tests
  passed / 14 skipped.
- `npm run lint` → **EXIT 0** — only pre-existing warnings (techpremium/vestria
  `<img>` LCP + ph-provider exhaustive-deps); NONE in phase-2 files.
- `npm run build` → **EXIT 0** — new `/edit/[token]/preview` route compiled
  (1.39 kB / 443 kB first-load, vs `/edit`'s 805 kB — confirms the lean
  chromeless tree). No Suspense build error.

### Playwright spec status
- **Not run locally.** Same reason as phase 1: the authed spec needs a live dev
  server + `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD` / `CLERK_SECRET_KEY`
  (it `test.skip`s itself without them). Authored + registered; first real run
  happens on the configured e2e environment / QA preview via
  `npx playwright test editor-preview-route`.

### Open risks
- Sub-route is directly navigable now but its framing (XFO SAMEORIGIN) lands in
  phase 3 — until then it renders standalone only; the mobile-iframe consumer is
  phase 4.
- Spec unexecuted here (see above) — watch the mock-mode Meridian seed rendering
  the hero copy within the 60s budget (same pattern the phase-1 / toolbar specs
  rely on, so low risk).

## Phase 3 — XFO: SAMEORIGIN on the sub-route (additive)

**Files changed**
- `next.config.js` — headers() sources (added sub-route SAMEORIGIN rule + narrowed DENY negative-lookahead; comment block updated to describe three sources).
- `e2e/xfo-headers.spec.ts` (new) — request-context XFO route-gate spec.
- `playwright.config.ts` — registered `xfo-headers.spec.ts` in the `public` (no-auth) project testMatch allowlist.

### next.config.js headers block — before / after

BEFORE (the two XFO sources, verbatim):
```
      {
        source: '/preview/:token+',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/((?!preview/).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
```

AFTER (the three XFO sources, verbatim):
```
      {
        source: '/preview/:token+',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      // editor-route-consolidation phase 3: the editor preview SUB-ROUTE is framable
      // same-origin (mobile-view iframe, phase 4). Single-segment `:token` ONLY — the
      // framable surface is exactly `/edit/{token}/preview`, nothing else under /edit.
      {
        source: '/edit/:token/preview',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/((?!preview/)(?!edit/[^/]+/preview$).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
```

### Why the three sources stay mutually exclusive
Matching is done by Next against the pathname; the DENY source's captured group begins
immediately after the leading `/`.
- `/preview/:token+` — one-or-more segments ⇒ matches `/preview/{token}` (and deeper),
  NOT bare `/preview`. SAMEORIGIN.
- `/edit/:token/preview` — path-to-regexp single named segment `:token` (`[^/]+`) then the
  literal `/preview`. Matches exactly `/edit/{token}/preview`, NOT `/edit/{token}` and NOT
  `/edit/{token}/preview/extra` (path-to-regexp anchors the full path). SAMEORIGIN.
- `/((?!preview/)(?!edit/[^/]+/preview$).*)` — DENY for every path that (a) does not start
  with `preview/` AND (b) is not exactly `edit/{token}/preview`. Walkthrough:
  - `/edit/x/preview` → lookahead `(?!edit/[^/]+/preview$)` sees the forbidden form ⇒ DENY
    source does NOT match; handled by the SAMEORIGIN sub-route rule above. ✔ one header.
  - `/edit/x` → no `/preview$`, lookahead passes ⇒ DENY. The sub-route rule doesn't match. ✔
  - `/preview/x` → excluded by `(?!preview/)`; DENY doesn't match; SAMEORIGIN `/preview/:token+`
    matches. ✔ (this legacy rule STAYS this phase — StepReveal still frames it until phase 5.)
  - `/edit/x/preview/extra` → the `$` anchor fails, lookahead passes ⇒ DENY; the single-segment
    sub-route rule does NOT match ⇒ the framable surface is not widened. ✔
  - `/` and `/dashboard` → DENY. ✔
No path matches two XFO sources, so the header value is order-independent (no reliance on
Next's last-wins dedupe).

### path-to-regexp runtime validation
The negative-lookahead-in-path form mirrors the pre-existing working rule's structure exactly
(same `/(...)` wrapping, same escaping, `$` inside a lookahead is a plain regex anchor). Next
compiles `source` via path-to-regexp at build time; `npm run build` completed with NO invalid-
header / invalid-source warning (only pre-existing bundle-size + Sentry deprecation warnings),
and both `/edit/[token]` and `/edit/[token]/preview` appear in the route manifest. Config shape
is validated; the actual runtime header values are the founder's `curl -I` HUMAN GATE.

### Green gate results (run from WORKDIR)
- `npx tsc --noEmit` — PASS (no output).
- `npm run lint` — PASS (only pre-existing `no-img-element` / `exhaustive-deps` warnings; no errors).
- `npm run build` — PASS. No headers/config warning. `/edit/[token]/preview` listed (1.39 kB).
  Non-fatal pre-existing warnings only: "Bundle size exceeds 5KB target" and the Sentry
  `sentry.client.config.ts` deprecation notice.

### e2e status
`e2e/xfo-headers.spec.ts` written as a `request`-context spec (no browser/auth) asserting exact
`x-frame-options` per URL: `/edit/{t}/preview`→SAMEORIGIN, `/edit/{t}`→DENY, `/preview/{t}`→
SAMEORIGIN, `/`→DENY, `/dashboard`→DENY. Registered in the `public` project. NOT executed here
(needs the dev webServer; self-skips when no server is reachable, matching phase-1/2 specs). Runs
under `npm run test:e2e`.

### Deviations
- Registered the new spec in `playwright.config.ts` (public project allowlist) — an implicit
  Files-touched addition the phase brief pre-authorized for spec registration. One-line change,
  no behavioral impact.

### Open risks
- XFO is a RUNTIME header; the build validates config SHAPE only. The founder/orchestrator
  `curl -I` HUMAN GATE (four URLs, exactly one XFO each) is the real behavioral check. Failure
  mode downstream is a silently blank same-origin iframe (phase 4).
- The legacy `/preview/:token+` SAMEORIGIN rule is intentionally retained this phase (phase 5
  retires it alongside the reveal move).

### Orchestrator curl -I verification (RUN 2026-07-18, worktree dev on :3022)
Deterministic half of the XFO human gate — PASSED. Exactly one XFO header per URL
(headers apply even on 404, proving path-match is route-existence-independent):

| URL | X-Frame-Options |
|---|---|
| `/edit/{t}/preview` | SAMEORIGIN ✓ |
| `/edit/{t}` | DENY ✓ |
| `/edit/{t}/preview/extra` | DENY ✓ (subtle `$`-anchor case — framable surface NOT widened) |
| `/preview/{t}` | SAMEORIGIN ✓ |
| `/` | DENY ✓ |
| `/dashboard` | DENY ✓ |

Mutual exclusivity confirmed at runtime. Founder's remaining confirm = "iframe actually
renders, not silent-blank" — folds into phase-4 e2e + merge-gate preview QA (decision:
consolidate the 3 founder-facing gates at the merge gate, since reveal/publish/pilot
sign-off need the QA preview deploy which the pipeline can't produce mid-run without a push).

## Phase 4 — Mobile-view iframe toggle

**Files changed**
- `src/app/edit/[token]/components/ui/DeviceToggle.tsx` (modified — wired the dead toggle)
- `src/app/edit/[token]/components/ui/MobilePreviewFrame.tsx` (new)
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` (modified — mount DeviceToggle in preview mode)
- `src/app/edit/[token]/components/layout/EditLayout.tsx` (modified — canvas swap + reset effect + remount key)
- `e2e/editor-preview-mode.spec.ts` (extended — mobile-iframe test)

### DeviceToggle shape reconciliation
The file previously rendered THREE inert buttons (desktop/tablet/mobile) whose
commented handler called `setGlobalSettings({ deviceMode })`. Reconciled per the
plan-review note:
- **Tablet DROPPED.** The store type is `deviceMode: 'desktop' | 'mobile'`
  (`src/types/store/state.ts:188`) and `setDeviceMode` (`layoutActions.ts:698`)
  only accepts those two — tablet was never representable. Now two buttons.
- **`setDeviceMode` used**, not `setGlobalSettings` — the dedicated 2-value action
  (called via `useEditStoreApi().getState().setDeviceMode(...)`).
- Highlight reads the single-scalar selector `useEditStore((s) => s.globalSettings.deviceMode)`
  (selector form, not the banned bare subscription). Restyled to match the
  Edit/Preview segmented shell for visual consistency; `aria-label="Preview device"`.

Note: a SEPARATE greyed device `SegmentedControl` still lives in
`GlobalAppHeader.tsx` (`Coming what="device previews"`), which is OUT of this
phase's Files-touched and was left untouched. The plan explicitly wires the new
real toggle into `EditHeaderRightPanel` (preview-only), not that greyed slot — so
in preview mode the real toggle renders in the right panel. Reconciling/removing
the greyed center slot is not in Phase 4 scope; logged here as a known follow-up.

### Save-before-frame + key-remount mechanism
`MobilePreviewFrame` forces `await storeApi.getState().save()` in a mount effect
and gates the `<iframe>` behind a `ready` flag — the iframe never loads until the
draft is persisted, so the sub-route's own `EditProvider.loadDraft` reads the
just-edited copy (handoff = DB reload, NOT postMessage, per spec — no live
cross-document channel added). Save failure still shows the iframe (renders the
last-persisted draft; the editor's own save-error UI owns that signal) — chosen as
the conservative option so a transient save error doesn't hard-block the preview.

Fresh remount per entry: `EditLayout` conditionally renders `MobilePreviewFrame`
only when `mode==='preview' && deviceMode==='mobile'` (so it naturally unmounts on
desktop/edit), AND passes a `key={mobileEntryKey}` that increments on each
transition INTO mobile view (a `wasMobilePreview` ref edge-detector). Re-entering
mobile therefore remounts the component → re-runs save → reloads the iframe fresh;
no stale iframe survives a desktop↔mobile round-trip.

### deviceMode reset on preview-exit
An `EditLayout` effect resets `deviceMode` to `'desktop'` whenever
`mode !== 'preview'` (guarded on `deviceMode !== 'desktop'` so it only fires on the
edge) via `storeState?.setDeviceMode?.('desktop')` — no new store logic, pure
presentation reset. Next preview session starts on the inline canvas.

### EditHeaderRightPanel
Imported `DeviceToggle`; render `{mode === 'preview' && <DeviceToggle />}` after
the Edit/Preview segmented group. Absent in edit mode. No other change; Publish
split-button untouched (phase 6).

### e2e (extended `editor-preview-mode.spec.ts`)
Added one test: edit the hero headline (append a unique marker, commit via blur) →
assert device toggle absent in edit mode → Preview (toggle appears, Desktop stays
inline, no iframe) → Mobile → assert the iframe mounts, its `src` matches
`/edit/{token}/preview`, its boundingBox width is ~390px (>380 && <400), and —
the data-integrity crux — `frameLocator` sees the EDITED headline marker inside
the iframe (proves save-before-frame ran AND the framed sub-route actually
rendered, so it fails deterministically on a silent-blank XFO frame or a stale
draft) → Desktop returns inline (iframe unmounts, still preview mode) → Edit
(toggle vanishes, canvas editable again). Real assertions throughout — would fail
on regression, not a manual TODO.

### Green gate (run from WORKDIR)
- `npx tsc --noEmit` → **EXIT 0** (clean).
- `npm run test:run` → **EXIT 0** — 250 files passed / 1 skipped; 4035 tests
  passed / 14 skipped (unchanged from phases 1-3; no unit regressions).
- `npm run lint` → **EXIT 0** — only pre-existing warnings (techpremium/vestria
  `<img>` LCP + ph-provider exhaustive-deps); NONE in phase-4 files.
- `npm run build` → **EXIT 0** — `/edit/[token]` (805 kB) and `/edit/[token]/preview`
  (443 kB) both compile with the new `MobilePreviewFrame` + iframe dependency; no
  Suspense/headers errors.

### Playwright spec status
**Not executed locally** — same convention as phases 1-3: the authed spec
`test.skip`s itself without `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD` /
`CLERK_SECRET_KEY` + a live dev server, which aren't available in this
implementation environment. Authored + already registered (the spec file was
allowlisted in phase 1). First real run happens on the configured e2e env / QA
preview via `npx playwright test editor-preview-mode`. The mobile-iframe test
depends on the phase-3 XFO SAMEORIGIN rule (curl-verified) to render — if that
regressed, `frameLocator` would time out (deterministic catch).

### Open risks
- Duplicate device control surface: the real `DeviceToggle` (preview-only, right
  panel) coexists with the still-present greyed `SegmentedControl` in
  `GlobalAppHeader` (out of scope). Follow-up sweep should remove/replace the
  greyed slot — flagged, not fixed (out of Files-touched).
- iframe render correctness is a RUNTIME concern gated by XFO; unit/build can't
  prove it. The extended e2e is the deterministic check but is unexecuted here —
  real run on the QA preview is the founder-facing confirm (folds into the merge
  gate per phase-3 note).

## Phase 5 — Reveal folds onto the edit route + retire /preview SAMEORIGIN

**Files changed**
- `src/components/onboarding/journey/steps/StepBuilding.tsx` (modified — success routes to editor reveal)
- `src/components/onboarding/journey/steps/StepReveal.tsx` (deleted)
- `src/components/onboarding/journey/JourneyShell.tsx` (modified — dropped step-6 body + registration; resume-to-6 redirect)
- `src/app/generate/[token]/components/PageRevealAnimation.tsx` (deleted — moved)
- `src/components/reveal/PageRevealAnimation.tsx` (new — moved home + `data-testid="page-reveal"`)
- `src/app/generate/[token]/page.tsx` (modified — import path only)
- `src/app/edit/[token]/page.tsx` (modified — reveal wiring in EditPageContent)
- `next.config.js` (modified — removed `/preview` SAMEORIGIN rule; simplified DENY)
- `e2e/work-onboarding.spec.ts` (modified — both journey-completion tests rewired to the editor reveal + once-fires counter)
- `e2e/xfo-headers.spec.ts` (modified — `/preview/x` now DENY)
- `e2e/workPlan.spec.ts` (modified — scope-extended by orchestrator; step-reveal waits rewired to editor-landing)

### Per-file

**StepBuilding.tsx** — On `result.ok`, `setJourneyStep(6)` became `router.push('/edit/{tokenId}?reveal=1')`. Added `useRouter()` and `const tokenId = useWizardStore((s) => s.tokenId)` (exactly as the retired StepReveal read it). Updated the two rationale comment blocks; nothing deleted.

**The one-drive guard was preserved byte-for-byte.** The only edits inside the mount effect are (a) the success branch and (b) comment wording. Still: `startedFor` ref keyed on `attempt`, NO cleanup return, NO cancelled flag, deps `[attempt]` with the eslint-disable. The cleanup/cancelled variants (known bugs that orphan generation) were NOT reintroduced. The guard block reads verbatim: `if (startedFor.current === attempt) return; startedFor.current = attempt;` then the async IIFE, closing with `// eslint-disable-next-line react-hooks/exhaustive-deps` and `}, [attempt]);`.

**JourneyShell.tsx** — Removed the StepReveal import. `STEP_BODIES` retyped `Partial<Record<JourneyStep, …>>` with the `6: StepReveal` entry dropped. `LAST_STEP` 6 to 5. `ready` now also requires `!!Body`, and the body render is gated on `ready && seam && Body &&` so an undefined body can never render.
- In-scope edge case handled (logged under Deviations): `resolveWorkResumeStep` still returns `6` for finished content (`src/modules/wizard/work/resumeStep.ts` — out of Files-touched, unchanged). With no step-6 body a resume-to-6 would crash on an undefined `Body`. Intercepted inside the resume effect (a Files-touched file): `if (step === 6) { router.push('/edit/{tokenId}?reveal=1'); return; }` — the SAME destination StepBuilding pushes to on fresh success. No `.app-chrome`/reveal surface was introduced inside JourneyShell.

**PageRevealAnimation** moved from `src/app/generate/[token]/components/` to `src/components/reveal/`. Component body identical; added a header comment and `data-testid="page-reveal"` on the animated container. Importer grep result: the ONLY importer was `src/app/generate/[token]/page.tsx` — re-pointed to `@/components/reveal/PageRevealAnimation`. No importer outside Files-touched. `/generate` still reveals this slice.

**edit/[token]/page.tsx** — `EditPageContent` reads the reveal flag via `window.location.search` in a mount effect, NOT `useSearchParams` — deliberately, to avoid the `missing-suspense-with-csr-bailout` build trap (no `<Suspense>` needed; the subtree is already `'use client'` behind EditProvider's hydration gate). When `reveal=1`: `store.getState().setMode('preview')` (reveal = the clean site first; phase-1 segmented control is the go-edit affordance), `setRevealing(true)`, then `router.replace('/edit/{tokenId}')` to strip the param. A `revealHandled` ref makes the effect run once (StrictMode-safe). When revealing, `EditLayout` is wrapped in `<PageRevealAnimation sectionsCount={sections.length}>` (sections from `useEditStoreContext`); else bare. `EditProvider` bootstrap UNCHANGED. Confirmed `loadFromDraft` (`persistenceActions.ts`) never writes `state.mode`, so the pre-load `setMode('preview')` survives the async load. Also removed two dead `useState`s (`loadingState`/`errorMessage`) that only had a no-op setter.

**next.config.js — /preview framer grep + XFO decision.**
- Grepped the whole repo for `<iframe` framing `/preview`: the ONLY match was `StepReveal.tsx` (now deleted). The surviving `/preview/{token}` references — `src/app/admin/page.tsx`, `src/app/preview/[token]/privacy/page.tsx`, `src/components/dashboard/work/WorkLibraryClient.tsx` — are all plain `<a href>` NAVIGATIONS, which XFO does not affect. Checked all three explicitly per the plan's list.
- DECISION: REMOVED the `/preview/:token+` SAMEORIGIN rule. The framable surface is now exactly the `/edit/:token/preview` sub-route. DENY source simplified from `/((?!preview/)(?!edit/[^/]+/preview$).*)` to `/((?!edit/[^/]+/preview$).*)`. The two remaining sources stay mutually exclusive (`/edit/{token}/preview` = SAMEORIGIN; everything else incl. `/preview/{token}` and bare `/edit/{token}` = DENY). Comment block rewritten.

**e2e/xfo-headers.spec.ts** — `/preview/{token}` expectation flipped SAMEORIGIN to DENY; matrix comment updated.

**e2e/work-onboarding.spec.ts** — both journey-completion tests rewired:
- Test 1: a passive `page.on('request')` counter on `POST /api/audience/work/strategy` set up before `plan-build`; the retry loop "done" signal is now `page.waitForURL(/\/edit\/{token}/)`; after landing asserts `strategyCalls === 1` (one-drive guard pin), `page-reveal` container visible, reveal param consumed (`expect.poll` on `URL.search === ''`), and template output visible in the PAGE document. DB assertions (finalContent, generationProgress tripwire, stamps) preserved. Added: reload `/edit` to `page-reveal` count 0 (no re-animate) + sections still render; then `goto('/onboarding/{token}')` to `waitForURL(/edit/)` as the finalContent-to-seam plumbing pin (now exercises the resume-6-to-editor redirect).
- Test 2 (atelier2 REAL fan-out): retry loop "done" to `waitForURL(/edit/)`; reveal covers asserted on `page` via `page-reveal` + `page.locator('img[src=...]')` (not the old frameLocator).

### Deviations
- Resume-to-6 redirect (in-scope, JourneyShell) — conservative: redirect to the editor reveal rather than crash; keeps `resumeStep.ts`/`work.ts`/`types.ts` (out of Files-touched) untouched. `JourneyStep` type still declares `6`; `STEP_BODIES` is `Partial` to accommodate the gap.
- Removed two dead `useState`s in EditPageContent — unused, conservative.

### Green gate (run from WORKDIR)
- `npx tsc --noEmit` -> EXIT 0 (clean).
- `npm run test:run` -> EXIT 0 — 250 files passed / 1 skipped; 4035 tests passed / 14 skipped (no unit regressions; `resumeStep.test.ts` / `journeyAgnostic.test.ts` green).
- `npm run lint` -> EXIT 0 — only pre-existing warnings (techpremium/vestria `<img>` LCP + ph-provider exhaustive-deps); NONE in phase-5 files.
- `npm run build` -> EXIT 0 — no `missing-suspense-with-csr-bailout` (Suspense trap avoided via the `window.location.search` mount-effect read). Route graph intact: `/edit/[token]` (810 kB), `/edit/[token]/preview` (443 kB), `/generate/[token]` (451 kB) all compiled.

### e2e status
Both specs authored/updated + already registered in `playwright.config.ts`. Not executed here — same convention as phases 1-4 (authed specs self-skip without `E2E_CLERK_*` creds + a live dev server; xfo self-skips without a reachable server). First real run on the configured e2e env / QA preview.

### workPlan.spec.ts rewire (orchestrator-approved scope extension, +1 file)
The orchestrator approved extending phase 5 by ONE file to fix the break this change caused. `e2e/workPlan.spec.ts` waited for `getByTestId('step-reveal')` after generation (the race in the retry loop ~line 179, and a final assert ~line 195); with StepReveal deleted that testid never appears, so the spec would TIME OUT. Rewired both, consistent with `work-onboarding.spec.ts`:
- Added `const editUrl = new RegExp('/edit/' + token)` before the retry loop.
- Loop "done" branch: `page.getByTestId('step-reveal').waitFor(...)` → `page.waitForURL(editUrl, ...)`.
- Final assert: `expect(step-reveal).toBeVisible()` → `page.waitForURL(editUrl, { timeout: 120_000 })` **plus** `expect(page.getByTestId('page-reveal')).toBeVisible()` — a REAL landing assertion (fails if generation didn't reach the editor reveal). Nothing else in the spec touched; the downstream DB/structure invariants are unchanged. Re-ran tsc/test:run/lint (all green); build skipped (no non-spec code change this round).

### Open risks
- XFO is a RUNTIME header — the build only validates config shape. The HUMAN GATE (`curl -I`: `/edit/{t}/preview`->SAMEORIGIN, `/preview/{t}`->DENY now, `/edit/{t}`->DENY, `/`+`/dashboard`->DENY, mutually exclusive) is the real check.
- Reveal correctness on `/edit` is a runtime concern the e2e pins deterministically but is unexecuted here — the founder's one real work journey on the QA preview is the gate.
- `workPlan.spec.ts` break (above) — the single explicit out-of-scope item.
