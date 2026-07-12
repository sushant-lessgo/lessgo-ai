# editor-phase-4-store-finish — audit

## Phase 1 — Step A: dead-export removal

**Files changed:**
- `src/hooks/useEditStore.ts` (modified — deleted dead exports)
- `src/hooks/useEditStoreGlobal.ts` (deleted outright)

### What changed

**`src/hooks/useEditStore.ts`** — deleted four dead members, kept the live hook + type re-exports:
- Deleted `useCurrentEditStore(tokenId)` (was ~line 236).
- Deleted `useEditStoreSelector<T>(tokenId, selector, equalityFn)` (was ~line 259).
- Deleted the deprecated `createEditStore(tokenId?)` warn-shim (was ~line 314).
- Deleted the `export { useEditStoreLegacy as useEditStoreCompat } from './useEditStoreLegacy'` re-export (was ~line 325).
- KEPT: the live `useEditStore(tokenId, options)` token/SSR hook, the `window.__useEditStoreDebug` dev IIFE (untouched — moves in phase 2, not this phase), and `export type { EditStore, EditStoreInstance };`.

**`src/hooks/useEditStoreGlobal.ts`** — deleted the whole file (dead 4th compat layer; re-exported `useEditStoreLegacy as useEditStore`, `useEditStore as useEditStoreWithToken`, plus both types; zero importers in `src/`, only README mentions).

Diff summary: `useEditStore.ts` +1/-80, `useEditStoreGlobal.ts` -15. No logic changed in the kept `useEditStore(tokenId, opts)` hook. The REAL factory `createEditStore` in `src/stores/editStore.ts` was NOT touched.

### Confirm-dead-ness greps (step 3) — run over `src/`

**`rg "useCurrentEditStore|useEditStoreSelector|useEditStoreCompat" src/`** → only the definition file (pre-edit):
```
src\hooks\useEditStore.ts:236:export function useCurrentEditStore(tokenId: string) {
src\hooks\useEditStore.ts:259:export function useEditStoreSelector<T>(
src\hooks\useEditStore.ts:325:export { useEditStoreLegacy as useEditStoreCompat } from './useEditStoreLegacy';
```
Expected — all three are the definitions/re-export being deleted. No external consumers. ✅

**`rg "useEditStoreGlobal|useEditStoreWithToken" src/`** → only the shim itself + README mentions:
```
src\stores\README.md:65:name still says "Legacy". `useEditStoreGlobal.ts` re-exports the same wrapper.
src\hooks\useEditStoreGlobal.ts:11:export { useEditStore as useEditStoreWithToken } from './useEditStore';
src\hooks\README.md:27:`useEditStore` (both from this file and from `useEditStoreGlobal.ts`); most call
src\hooks\README.md:97:  `useEditStoreGlobal.ts` are the context-based no-token wrappers used everywhere.
```
Expected — the only code hit is the shim being deleted; README hits are docs (cleaned in phase 13 per plan). No `.ts`/`.tsx` importers. ✅

**`rg "createEditStore" src/`** → real factory + storeManager + editStore tests + the shim (pre-edit):
- `src/stores/editStore.ts` (lines 43, 370, 627, 632) — the REAL factory (untouched).
- `src/stores/storeManager.ts` (lines 14, 97) — imports the REAL factory.
- `src/stores/README.md` (lines 10, 62) — docs.
- `src/hooks/editStore/*.test.ts` (setItemAlt, sectionSwap, pageActions, imageWriteGuard, aiBaselinePatch, i18nStoreState) — all `import { createEditStore } from '@/stores/editStore'` (the REAL factory).
- `src/hooks/useEditStore.ts:314` — the deprecated shim being deleted.

No test or code imports `createEditStore` from `@/hooks/useEditStore`; every non-shim hit resolves to `@/stores/editStore`. Expected — matches plan step 3 exactly. ✅

Post-edit spot check: after deletion, `rg` for `useCurrentEditStore|useEditStoreSelector|useEditStoreCompat|useEditStoreGlobal|useEditStoreWithToken` in `src/**/*.{ts,tsx}` returns zero code hits (only README docs remain, deferred to phase 13).

### Verification

- **`npx tsc --noEmit`** → PASS (exit 0, zero errors). Note: the very first tsc run emitted a single transient error `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — a stale Next.js image-module `.d.ts` artifact unrelated to this change (the asset exists at `src/assets/images/founder.jpg`; the diff touches only the two store files, never `page.tsx`). It did not reproduce on any subsequent run; final confirmed exit code 0.
- **`npm run test:run`** → PASS. Test Files 155 passed | 1 skipped (156); Tests 2476 passed | 11 skipped (2487).
- **`npm run lint`** → PASS (no errors; only pre-existing `@next/next/no-img-element` and one `react-hooks/exhaustive-deps` warnings, all in unrelated template/provider files).

### Deviations

None. Scope executed exactly as specified. The dev IIFE and type re-exports were left in place (their move is phase 2 work).

### Open risks

None for phase 1. The `useEditStoreGlobal.ts` README references in `src/hooks/README.md` and `src/stores/README.md` now point at a deleted file — this is expected and scheduled for cleanup in phase 13 (docs close-out), per the plan.

## Phase 2 — Step A: façade unification (mechanical)

**Files changed:**
- `src/hooks/useEditStoreBootstrap.ts` (NEW)
- `src/hooks/useEditStore.ts` (rewritten)
- `src/hooks/useEditStoreLegacy.ts` (reduced to thin re-export)
- `src/components/EditProvider.tsx` (one import line + one call-site name)

### What changed
- **`useEditStoreBootstrap.ts` (new):** the old `useEditStore.ts` token/SSR hook body moved VERBATIM, function renamed `useEditStore` → `useEditStoreBootstrap`. Header comment "EditProvider-only bootstrap; do not import elsewhere." added. The `window.__useEditStoreDebug` dev IIFE (`process.env.NODE_ENV === 'development'` block referencing `storeManager`) moved WITH it — it lives here now, NOT in the reactive file. `export type { EditStore, EditStoreInstance }` retained.
- **`useEditStore.ts` (rewrite):** now the old `useEditStoreLegacy.ts` body verbatim — reactive `useEditStore(selector?)` overloads (function renamed from `useEditStoreLegacy`), `useEditStoreApi`, `globalStoreRef` set-on-render in both hooks, static `useEditStore.getState()`. Added explicit `export type { EditStore, EditStoreInstance }` (from `@/types/store` and `@/stores/editStore` respectively) — the legacy body did not carry these; added so `import type` consumers keep resolving after phase 3. Removed the legacy file's default export and `export { useEditStoreLegacy as useEditStore }` alias (no longer needed — this file's own function is named `useEditStore`).
- **`useEditStoreLegacy.ts` (thin re-export):** reduced to `export { useEditStore, useEditStore as useEditStoreLegacy, useEditStoreApi } from './useEditStore'` + `@deprecated delete in phase 3` header. Keeps the ~107 existing importers resolving until phase 3's sweep.
- **`EditProvider.tsx`:** import changed `useEditStore` from `@/hooks/useEditStore` → `useEditStoreBootstrap` from `@/hooks/useEditStoreBootstrap`; call site `useEditStore(tokenId, {...})` → `useEditStoreBootstrap(tokenId, {...})`. Nothing else changed.

### Default export decision
- `rg "import useEditStore(Legacy)? from" src/` → **zero hits** (no default importers). Therefore NO default export was added to either `useEditStore.ts` or the `useEditStoreLegacy.ts` shim. No default-import normalization needed.

### Confirmations
- Debug IIFE (`window.__useEditStoreDebug`) landed in `useEditStoreBootstrap.ts`, NOT in the reactive `useEditStore.ts`. Verified.
- Both type re-exports (`EditStore`, `EditStoreInstance`) present in `useEditStore.ts`. Verified.
- No logic lines altered — pure move/rename. `globalStoreRef` set-on-render semantics and static `.getState()` preserved exactly; `useEditStoreApi` unchanged.

### Deviations
- None.

### Test results
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — 2476 passed, 11 skipped (156 files).
- `npm run lint` — passes; only pre-existing warnings (no errors). The bootstrap-file `react-hooks/exhaustive-deps` warning on the useEffect is carried verbatim from the old file.
- `npm run build` — succeeded.

### Open risks
- The reactive `useEditStore.ts` carries a now-unused `useContext` import and unused `LegacyEditStoreContext` (both verbatim from the legacy body). Lint only warns, not errors, consistent with the prior legacy file. Left as-is to preserve pure-move discipline; can be swept in phase 3.

---

## Phase 3 — Step A: import sweep + delete legacy file

### Files changed (106 total)

**Deleted (1):**
- `src/hooks/useEditStoreLegacy.ts`

**Residue cleanup (1):**
- `src/hooks/useEditStore.ts` — removed unused `useContext` import + unused `LegacyEditStoreContext` const (step 4)

**Import sweep (104 code files)** — exact `rg -l "useEditStoreLegacy" src/` set (109) minus the 4 phase-13-owned READMEs and the deleted legacy file:

src/app/dev/blocks/TemplateBlocksStage.tsx · src/app/edit/[token]/components/content/ElementPicker.tsx · src/app/edit/[token]/components/content/SectionCRUD.tsx · src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx · src/app/edit/[token]/components/editor/LanguageToggle.tsx · src/app/edit/[token]/components/editor/LocaleSettings.tsx · src/app/edit/[token]/components/layout/EditHeader.tsx · src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx · src/app/edit/[token]/components/layout/GlobalAppHeader.tsx · src/app/edit/[token]/components/layout/PageSwitcher.tsx · src/app/edit/[token]/components/modals/LandingGoalsModal.tsx · src/app/edit/[token]/components/modals/TaxonomyModalManager.tsx · src/app/edit/[token]/components/primitives/EditableImageCollection.tsx · src/app/edit/[token]/components/primitives/EditableLogo.tsx · src/app/edit/[token]/components/selection/ElementDetector.tsx · src/app/edit/[token]/components/selection/SelectionSystem.tsx · src/app/edit/[token]/components/toolbars/ElementToolbar.tsx · src/app/edit/[token]/components/toolbars/ImageToolbar.tsx · src/app/edit/[token]/components/toolbars/SectionToolbar.tsx · src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx · src/app/edit/[token]/components/toolbars/ToolbarShell.tsx · src/app/edit/[token]/components/ui/AddSectionButton.tsx · src/app/edit/[token]/components/ui/ColorPicker/SolidColorPicker.tsx · src/app/edit/[token]/components/ui/CountdownConfigModal.tsx · src/app/edit/[token]/components/ui/DeviceToggle.tsx · src/app/edit/[token]/components/ui/EditablePageRenderer.tsx · src/app/edit/[token]/components/ui/ElementToggleModal.tsx · src/app/edit/[token]/components/ui/EnhancedAddSection.tsx · src/app/edit/[token]/components/ui/PreviewButton.tsx · src/app/edit/[token]/components/ui/ProductsModal.tsx · src/app/edit/[token]/components/ui/SaveStateChip.tsx · src/app/edit/[token]/components/ui/SaveStatus.tsx · src/app/edit/[token]/components/ui/SeoSettingsModal.tsx · src/app/edit/[token]/components/ui/ServiceThemePopover.tsx · src/app/edit/[token]/components/ui/StyleBrowserModal.tsx · src/app/edit/[token]/components/ui/ThemePopover.tsx · src/app/edit/[token]/components/ui/ThemeSelector.tsx · src/app/edit/[token]/components/ui/usePaletteSwap.ts · src/app/edit/[token]/components/ui/usePreviewNavigation.ts · src/app/edit/[token]/components/ui/useResetSystem.ts · src/app/edit/[token]/components/ui/useUndoRedo.ts · src/app/edit/[token]/components/ui/VestriaThemePopover.tsx · src/app/preview/[token]/page.tsx · src/app/preview/[token]/privacy/page.tsx · src/components/editor/PrivacyPolicyEditor.tsx · src/components/forms/FormBuilder.tsx · src/components/forms/FormConnectedButton.tsx · src/components/forms/FormPlacementRenderer.tsx · src/components/layout/GlobalFormBuilder.tsx · src/components/navigation/NavigationEditor.tsx · src/components/navigation/NavItemToolbar.tsx · src/components/social/SocialMediaEditor.tsx · src/components/toolbars/ButtonConfigurationModal.tsx · src/components/ui/HeaderLogo.tsx · src/hooks/useAutoSave.ts · src/hooks/useEditor.ts · src/hooks/useElementCRUD.ts · src/hooks/useElementPicker.ts · src/hooks/useImageToolbar.ts · src/hooks/useModalManager.ts · src/hooks/useOptimizedEditStore.ts · src/hooks/useSectionCRUD.ts · src/hooks/useSelectionPriority.ts · src/hooks/useSmartTextColors.ts · src/hooks/useUniversalElements.ts · src/modules/generatedLanding/LandingPageRenderer.tsx · src/modules/generatedLanding/sharedBlocks/__tests__/followStrip.parity.test.tsx · src/modules/generatedLanding/sharedBlocks/__tests__/leadForm.parity.test.tsx · src/modules/generatedLanding/sharedBlocks/__tests__/storeBadges.parity.test.tsx · src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.tsx · src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx · src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.tsx · src/modules/prompt/buildPrompt.ts · src/modules/templates/__tests__/renderParity.meridian.test.tsx · src/modules/templates/blockMocks/harness.ts · src/modules/templates/conformance.test.ts · src/modules/templates/granth/blocks/editPrimitives.tsx · src/modules/templates/hearth/blocks/Header/WarmNavHeader.tsx · src/modules/templates/lex/blocks/Header/LetterheadNav.tsx · src/modules/templates/lumen/blocks/About/LumenPhotographerAbout.tsx · src/modules/templates/lumen/blocks/Footer/LumenFooter.tsx · src/modules/templates/lumen/blocks/Header/LumenNav.tsx · src/modules/templates/lumen/blocks/Hero/LumenHero.tsx · src/modules/templates/lumen/blocks/Portfolio/LumenCategoryGallery.tsx · src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx · src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx · src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.tsx · src/modules/templates/shared/useTemplateBlock.ts · src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx · src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx · src/modules/templates/techpremium/blocks/Explainer/TechPremiumExplainer.tsx · src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx · src/modules/templates/techpremium/blocks/Gallery/TechPremiumGallery.tsx · src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx · src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.tsx · src/modules/templates/techpremium/blocks/ProductDetail/TechPremiumProductDetail.tsx · src/modules/templates/techpremium/blocks/Trust/TechPremiumTrust.tsx · src/modules/templates/templateConformance.ts · src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.editStore.test.tsx · src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.tsx · src/modules/templates/vestria/blocks/editPrimitives.tsx · src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx · src/stores/editStore.ts · src/utils/ctaHandler.ts

### What changed (per step)
- **Step 1 (path + name normalize):** mechanical two-pass perl over the 104 files — `s/useEditStoreLegacy as useEditStore/useEditStore/g` (collapse alias in import specifiers) then `s/useEditStoreLegacy/useEditStore/g` (remaining: module paths `@/hooks/useEditStoreLegacy` + `./useEditStoreLegacy`, bare-identifier importers + their `useEditStoreLegacy()` usages, test `vi.mock` factory keys, and the few in-file comment references). No default importers existed (`rg "import useEditStore(Legacy)? from" src/` = 0), so no default-to-named work was needed. Call-site FORMS unchanged: bare stayed bare (e.g. TemplateBlocksStage `const { loadFromDraft, setMode } = useEditStore()`), selectors stayed selectors. Diff spot-checks (GlobalFormBuilder, SaveStateChip multiline, useUndoRedo dual-import, PrivacyPolicyEditor bare-usage, conformance.test mock, editStore.ts comment) confirm only import lines, the 4 bare-identifier usage renames, mock paths/keys, and a handful of adjacent comment refs changed. `git diff | grep '^+'` filtered to non-import/comment content surfaced only expected lines (collapsed specifiers + `vi.mock('@/hooks/useEditStore'...)`).
- **Step 2 (conformance.test.ts):** `vi.mock('@/hooks/useEditStoreLegacy', …)` path → `@/hooks/useEditStore`; factory key `useEditStoreLegacy:` → `useEditStore:` (same for the 5 other mock files: renderParity.meridian, storeBadges/leadForm/followStrip parity, VestriaLeadForm.editStore). Mocks now expose `useEditStore` matching the swept block imports.
- **Step 3 (delete):** `src/hooks/useEditStoreLegacy.ts` removed. No temporary default export existed in `useEditStore.ts` (phase 2 found zero default importers), so nothing to drop there.
- **Step 4 (residue cleanup):** `useEditStore.ts` — deleted `import { useContext, createContext } from 'react';` and `const LegacyEditStoreContext = createContext<EditStoreInstance | null>(null);` (both confirmed unused via rg before removal). Clears the two phase-2 lint warnings.

### Final greps
- `rg "useEditStoreLegacy|useEditStoreCompat|useEditStoreGlobal|useEditStoreWithToken" src/` → hits ONLY in the 4 phase-13-owned READMEs (`src/stores/README.md`, `src/hooks/README.md`, `src/modules/generatedLanding/README.md`, `src/app/edit/[token]/README.md`). Zero in all code (.ts/.tsx). See Deviations.
- `rg -l "from '@/hooks/useEditStore'" src/ | wc -l` → 87; plus `rg -l "from './useEditStore'" src/` → 8 (relative importers) = 95 direct importers. Remaining swept files are comment-only (editStore.ts, templateConformance.ts, blockMocks/harness.ts) or `vi.mock`-only test files (no `from` import line). Close to plan's ~107 estimate (which counted the grep-l set including READMEs/comment-only files).
- `rg -n "useEditStore\(\s*\)" src/ -g "*.ts" -g "*.tsx" | wc -l` → 73 bare call sites remaining (Step B targets). This is 69 pre-sweep + the 4 bare-identifier renames (`useEditStoreLegacy()` → `useEditStore()`) the sweep required; the sweep changed no bare/selector forms. (Plan's "~30" estimate undershoots the actual bare-call population; not a defect — the sweep only renamed, did not create/convert any call form.)

### Deviations
- **4 README.md files deliberately NOT edited** — they still contain `useEditStoreLegacy`/`useEditStoreGlobal`. Plan phase 13 (lines 288-289) EXPLICITLY names `src/app/edit/[token]/README.md`, `src/hooks/README.md`, `src/stores/README.md` as its own files-touched, and phase-1 step 3 states "README hits are fine, cleaned in phase 13". Editing them now would step on the phase-13 gate. Conservative choice: leave all README/doc references for phase 13; remove the name only from code. Net: the task's literal `src/`-wide grep-ZERO is met for all CODE but shows the 4 expected README hits.
- Comment-only code refs (in `src/stores/editStore.ts`, `src/modules/templates/templateConformance.ts`, `src/modules/templates/blockMocks/harness.ts`) WERE updated (identifier swap only) since these files are in the grep-defined files-touched set and leaving them would keep the dead name alive in code — achieving code-level grep-zero.

### Verification
- `npx tsc --noEmit` — PASS (exit 0).
- `npm run test:run` — PASS: 155 files passed / 1 skipped; 2476 tests passed / 11 skipped. Includes all 6 store-mock conformance/parity suites (now mocking `@/hooks/useEditStore`).
- `npm run lint` — PASS (exit 0); only pre-existing `<img>`/exhaustive-deps warnings, none in swept files; the two phase-2 residue warnings are now gone.
- `npm run build` — PASS (exit 0).
- Authed `npx playwright test edit-persistence` — PASS (2 passed: auth setup + throttled-edit-persists-no-silent-loss). Infra note: the Playwright `webServer` command (`npm run dev`, hardwired to port 3000) exited early because port 3000 was held by the USER's main-repo dev server (`C:\Users\susha\lessgo-ai\node_modules\...`, PID 26236 — NOT killed). Re-ran with `E2E_PORT=3001` pointing Playwright at a worktree dev server started from THIS branch's code — tested the actual swept code; reactivity confirmed intact (typing → store → server → reload, no silent loss). Environment port-collision, not a code regression; the E2E spec was NOT modified.

### Open risks
- None functional. `useEditStore` is now the single reactive hook name across all code; the `useEditStoreLegacy` name/file is eliminated from code. Only the 4 READMEs still carry the old name, by design (phase-13 close-out). Gate A (founder merge + editor verify) follows.

---

## Phase 4 — Step B: baseline probe + measurement

### Files changed
- `e2e/tools/renderProbe.ts` (NEW) — reusable reactivity/perf probe.
- `docs/task/editor-phase-4-store-finish.baseline.md` (NEW) — recorded baseline numbers.
- `docs/task/editor-phase-4-store-finish.audit.md` (this section appended).

No `src/` changes (as scoped).

### What the probe does
Standalone tsx script (`e2e/tools/renderProbe.ts`, NOT `*.spec.ts` so Playwright's
default runner ignores it; e2e is excluded from the project tsconfig so it never
enters `tsc --noEmit`). It:
1. Authenticates using the exact Clerk pattern from `e2e/global.setup.ts` +
   `e2e/auth.setup.ts` (clerkSetup token + backend user-ensure + in-browser
   `setupClerkTestingToken`/`clerk.signIn`), inline (no Playwright fixtures).
2. Creates + seeds a Meridian draft via the real routes using the existing
   `e2e/helpers/seedDraft.ts` (same discovery as `edit-persistence.spec.ts`),
   opens `/edit/[token]`, waits for the hero `[data-element-key="headline"]`.
3. Runs 6 parameterizable reactivity smoke subcommands (`--smoke=type,select,undo,redo,palette,modal`,
   default all): each returns pass/fail with a DOM- and/or store-level assertion.
4. Measures perf: React-commit churn over a 20-char headline burst + on the
   blur-commit, plus CDP `Performance.getMetrics` `JSHeapUsedSize` delta with a
   forced GC (`HeapProfiler.collectGarbage`) around it.
5. Prints a machine-readable `PROBE_RESULT {json}` line; exit 0 iff all requested
   smokes pass.

Render-churn signal: the probe injects a **React-DevTools global-hook stub** via
`context.addInitScript` and counts `onCommitFiberRoot` calls. Rationale: the edit
page renders sections through `EditablePageRenderer`, which emits no per-render
debug log (only the *published* `LandingPageRenderer` does, and its hero log even
guards on `sectionId === 'hero'` which never matches the real `hero-<uuid>` id) —
so the plan's "count section-render logs" has nothing to count on the edit path.
The commit-hook count is a framework-level render signal independent of app logs.
The EDITOR_DEBUG `updateElementContent CALLED` log is retained as a secondary
store-mutation cross-check.

### Exact run command
Dev server (worktree, free port, never :3000):
```
PORT=3021 NEXT_PUBLIC_DEBUG_EDITOR=true NEXT_PUBLIC_USE_MOCK_GPT=true npm run dev
```
Probe:
```
PROBE_URL=http://localhost:3021 npx tsx e2e/tools/renderProbe.ts
```

### Baseline numbers (2 stable runs)
- React commits during 20-char burst: **6** → **0.3 / keystroke**
- React commits on commit (blur): **3**
- Store mutations observed (burst+commit): **1** (commit-on-blur confirmed)
- JS heap delta (post-GC): **+0.6 – +0.9 MB** (flat; pre-GC it was ±15 MB noise)
- Palette-swap re-commits: **4–5**

Full table + methodology in `editor-phase-4-store-finish.baseline.md`.

### Smoke-subcommand results
All 6 PASS against the UNMODIFIED editor (both runs, `allPassed: true`):
`type`, `select`, `undo`, `redo`, `palette`, `modal`. This proves the net is
green before any Step-B selector work.

### Deviations from the plan
1. **Render metric = React commits, not debug logs.** The plan (D4.4 / phase-4
   step 1a) assumed NEXT_PUBLIC_DEBUG_EDITOR per-render *section-render logs* to
   count. Those don't fire on the edit path (edit uses `EditablePageRenderer`, no
   per-render log; `LandingPageRenderer`'s logs are published-only + a dead
   `sectionId==='hero'` guard). Conservative in-scope fix: count React
   `onCommitFiberRoot` commits (framework-level, no `src/` change, no app-behavior
   change), keeping the debug-log `updateElementContent` count as a cross-check.
   The perf *intent* (detect over-broad re-render churn) is fully preserved and
   the number is stable/comparable across phases.
2. **Heap: forced GC.** Added CDP `HeapProfiler.collectGarbage` before each heap
   read so the delta reflects retained growth, not transient allocation noise
   (raw deltas swung -7…+15 MB run-to-run; post-GC ~+0.7 MB stable).
3. **Palette + modal smokes are UI-driven via the header "Style" popover**
   (`VestriaThemePopover` for the Meridian product-template project) rather than
   abstract "named modal by testid" — the editor has no store-level modal
   registry and few testids. Palette clicks a real swatch (asserts store paletteId
   + repaint); modal asserts the popover's active swatch reflects the store. Both
   are genuine store↔UI reactivity assertions.
4. **`select` toolbar detection** uses the `[data-toolbar-type]` attribute the
   toolbar actually carries (value `text-mvp`), after an initial z-index-style
   probe failed.

All four are within Files-touched (`e2e/tools/renderProbe.ts` only) — chosen as
the conservative, no-`src`-change options.

### Verification
- Probe runs **green (authed)** against the unmodified editor: 6/6 smokes pass,
  perf numbers produced. Baseline written.
- `npx tsc --noEmit` — PASS (exit 0). `renderProbe.ts` also passes an isolated
  typecheck (temp tsconfig including `e2e/tools` + `e2e/helpers`); the project
  tsconfig `exclude`s `e2e`, so it never affects the main gate.

### Setup notes / open risks
- The dev server MUST run with `NEXT_PUBLIC_USE_MOCK_GPT=true` for the probe to
  seed a draft without credits/LLM (mirrors the e2e webServer). Without it the
  strategy/copy routes hit real generation.
- `npx tsx` is fetched on demand by npx (not a repo dep); it transpiles only (no
  typecheck) — the isolated tsc above covers types.
- Batches (B1–B6) should drive `--smoke=<only the touched surfaces>` and re-run
  the full perf pass at the phase-7 and phase-10 checkpoints, appending columns to
  the baseline doc.
- One dev-server-lifecycle caveat: an early background start used a trailing `&`
  which detached the process; it was found on :3021 and killed, then restarted
  under the task runner. Nothing touched :3000 (founder server) at any point.
