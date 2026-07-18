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
