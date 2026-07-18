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
