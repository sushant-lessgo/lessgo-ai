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

## Phase 5 (Batch B1)

**Files changed:**
- `src/hooks/useOptimizedEditStore.ts` (modified — all 26 bare `useEditStore()` destructures → narrow selectors)

### What changed

Converted every bare whole-store subscription in the shared shim (26 total) to a
narrow `useEditStore(selector)` — object selectors wrapped in `useShallow`
(`zustand/react/shallow`). Public return shape of every wrapper preserved
byte-for-byte; downstream consumers (~27 refs) unchanged and gain narrow
subscriptions for free. No `useEditStoreApi().getState()` was needed — action
wrappers select the store's stable action refs directly through `useShallow`
(stable object identity while refs unchanged), which also preserves the exact
referential-identity semantics consumers previously got from the bare store.

Imports: added `useShallow`; kept `useMemo`/`useCallback` (still used by computed +
element-editor hooks) and the `EditStore` type import (unchanged, lint-clean).
`useBatchUpdates` dropped its unused `const store = useEditStore()` entirely — it
only returned a `useCallback` that calls `updates()` and never read the store, so
the whole-store subscription was pure dead churn; return shape (the callback) is
identical.

### Over-narrow guard (D4.2) — subscribed-vs-exposed field enumeration

State-selector wrappers (selector subscribes to exactly the returned field(s)):

| Wrapper | Selector subscribes to | Returns / exposes | Wide enough? |
|---|---|---|---|
| `useEditMode` | `mode` | `mode` | yes |
| `useEditingMode` | `editMode` | `editMode` | yes |
| `useSelectedSection` | `selectedSection` | `selectedSection` | yes |
| `useSelectedElement` | `selectedElement` | `selectedElement` | yes |
| `useToolbarState` | `toolbar` | `toolbar` (object ref) | yes |
| `useSections` | `sections` | `sections` | yes |
| `useSectionLayouts` | `sectionLayouts` | `sectionLayouts` | yes |
| `useContent` | `content` | `content` | yes |
| `useSection(id)` | `content[id]` | `content[id]` | yes |
| `useSectionLayout(id)` | `sectionLayouts[id]` | `sectionLayouts[id]` | yes |
| `useSectionElements(id)` | `content[id]?.elements` | `elements \|\| {}` | yes (empty-`{}` fallback kept in body, NOT selector, to avoid new-ref subscribe loop) |
| `useElement(id,key)` | `content[id]?.elements?.[key] \|\| ''` | that value or `''` | yes |
| `useTheme` | `theme` | `theme` | yes |
| `useGlobalSettings` | `globalSettings` | `globalSettings` | yes |
| `useLeftPanel` | `leftPanel` | `leftPanel` | yes |
| `useAIGeneration` | `aiGeneration` | `aiGeneration` | yes |
| `usePersistenceState` | `persistence` | `persistence` | yes |
| `useIsSaving` | `persistence.isSaving` | `persistence.isSaving` | yes |
| `useIsDirty` | `persistence.isDirty` | `persistence.isDirty` | yes |

Action-selector wrappers (`useShallow`, all fields are stable action refs):

| Wrapper | Subscribes to (all action refs) | Exposes (same keys) |
|---|---|---|
| `useEditActions` | setMode, setEditMode, setActiveSection, selectElement | identical |
| `useToolbarActions` | showToolbar, hideToolbar, showSectionToolbar, showElementToolbar, hideElementToolbar, hideSectionToolbar | identical |
| `useContentActions` | addSection, removeSection, moveSection, updateSectionLayout, setSection, updateElementContent, duplicateSection, markAsCustomized | identical |
| `useAIActions` | regenerateSection, regenerateElement, generateVariations, showElementVariations, hideElementVariations, applyVariation, setGenerationMode | identical |
| `usePersistenceActions` | save, loadFromDraft, export, triggerAutoSave, forceSave, clearAutoSaveError | identical |
| `useStorePerformance` | getPerformanceStats, resetPerformanceStats | identical |
| `useBatchUpdates` | — (no store subscription; removed dead one) | returns the same `useCallback` |

Computed/derived hooks (`useHasContent`, `useSectionCompletion`, `usePageCompletion`,
`useIsElementSelected`, `useIsSectionSelected`, `useElementEditor`) were already
built on the wrapper hooks above (no bare `useEditStore()`) — untouched in body,
inherit narrower subscriptions transitively.

**Return-shape confirmation:** every wrapper's public return is byte-for-byte
unchanged (same keys, same value semantics — action wrappers still hand back the
real store refs). Downstream files: zero edits (the point of B1).

### Verification

- **Grep** `rg "useEditStore\(\s*\)" src/hooks/useOptimizedEditStore.ts` → zero (exit 1).
- **`npx tsc --noEmit`** → clean (exit 0).
- **`npm run test:run`** → 2508 passed / 11 skipped (159 files), exit 0.
- **`npx next lint --file …useOptimizedEditStore.ts`** → no warnings or errors.
- **renderProbe smoke** (worktree dev :3021, `NEXT_PUBLIC_DEBUG_EDITOR=true`,
  authed, `--smoke=type,select,undo,redo,palette,modal`) → **all 6 PASS**,
  `allPassed: true`. Founder :3000 untouched; server stopped after.

### renderProbe commit counts vs baseline

| Metric | Baseline | Phase 5 (B1) | Verdict |
|---|---|---|---|
| React commits during 20-char burst | 6 | 6 | flat |
| React commits / keystroke | 0.3 | 0.3 | flat |
| React commits on commit (blur) | 3 | 3 | flat |
| Store mutations observed | 1 | 1 | flat |
| JS heap delta (post-GC) | +0.6 – +0.9 MB | +0.656 MB | flat (in range) |
| Palette-swap re-commits | 4–5 | **4** (isolated run ×3) | ≤ baseline |

Note on palette count: the combined 6-smoke run reported 6 palette re-commits, but
that window is contaminated by trailing commits from the preceding undo/redo
smokes (the counter is coarse and the count is captured across a fixed 600ms
post-click window). Re-running `--smoke=palette` in isolation ×3 gave a stable **4**
— at/below the 4–5 baseline. No metric is higher than baseline in isolation; no
over-broad selector churn.

### Deviations from plan

- Chose to keep all action refs inside `useShallow` selectors (rather than moving
  them to `useEditStoreApi().getState()`) — the plan explicitly allows either, and
  this path preserves the exact referential-identity semantics downstream
  consumers relied on (they receive the real store action refs, not wrappers).
- `useBatchUpdates`: removed its dead whole-store subscription outright (it read
  nothing). Conservative and in-scope — return value (the callback) is identical.

### Open risks

- None functional. B1 only narrows subscriptions; no persist/commit path touched.
  The palette combined-run count contamination is a measurement artifact of the
  probe's fixed-window counter, not a code regression (isolated = 4 ≤ baseline).

---

## Phase 6 (Batch B2) — renderer + selection hot path

**Files changed:**
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/edit/[token]/components/selection/ElementDetector.tsx`

11 bare `useEditStore()` sites converted to narrow selectors / `useEditStoreApi()`.
Phase-3-done narrow selector at `LandingPageRenderer.tsx:132` (useShallow) NOT retouched.

### LandingPageRenderer.tsx — 1 site

| Site | Component | Subscribed | Fields read on render path | Disposition |
|---|---|---|---|---|
| `MissingLayoutComponent` | `mode` | `mode` (JSX conditional line ~78) | `useEditStore((s) => s.mode)` |

### EditablePageRenderer.tsx — 2 sites

| Site | Component | Subscribed | Fields read on render path | Disposition |
|---|---|---|---|---|
| ~67 | `EditablePageRenderer` | `audienceType, templateId` | `audienceType`+`templateId` → useTemplateModule, usesTemplateModule, getComponent | `useShallow` object selector |
| ~215 | (inner render fn) | `onboardingData, theme` | `onboardingData` → validatedFields/hiddenFields/userContext memo/debug; `theme` → `theme?.uiBlockTheme` in originalProps memo + dep array | `useShallow` object selector |

### ElementDetector.tsx — 3 sites

| Site | Component | Subscribed | Fields read on render path | Disposition |
|---|---|---|---|---|
| ~17 | `ElementDetector` | `mode` | `mode` → JSX className/conditional (106,111), effect deps (100), handler guard | `useEditStore((s) => s.mode)` |
| ~21 | `ElementDetector` | `selectedElement, selectedSection` | both → selection-feedback effect deps (46) | `useShallow` object selector |
| ~157 | `ElementBoundaryVisualizer` | `mode` | `mode` → effect deps (194), early-return + render (209) | `useEditStore((s) => s.mode)` |

### SelectionSystem.tsx — 5 sites (the trap file)

Full component-body field enumeration done before narrowing. Handling of the 5 destructures:

| # | Orig line | Component | Orig destructure | Every field's usage (whole body) | Disposition |
|---|---|---|---|---|---|
| 1 | 54 | `SelectionSystem` | `{ mode }` | mode → a11y effect (60,109 deps), verify-marker effect (125,147 deps), focus effect (167,172 deps), JSX (179,183) | **consolidated** with #2 |
| 2 | 56 | `SelectionSystem` | `{ selectedSection, selectedElement, multiSelection }` | selectedSection → a11y effect (72) + deps; selectedElement → a11y (100) + focus (152) + deps; multiSelection → a11y (80) + deps | **consolidated** into one `useShallow({mode,selectedSection,selectedElement,multiSelection})` — all four are render-subscribed via effect deps, so a single wide selector preserves reactivity exactly |
| 3 | 200 | `VerifyMarkerControls` | `{ tokenId, trackChange }` | tokenId → onClick only (`persistDismissedFlags(tokenId)`); trackChange → onClick only | **handler-only → `useEditStoreApi()`**; `const { tokenId, trackChange } = storeApi.getState()` inside onClick. No render subscription (correct — neither is read at render) |
| 4 | 401 | `SelectionIndicators` | `{ selectedSection, selectedElement, multiSelection }` | ALL THREE UNUSED — the component's JSX (405–423) is entirely commented out | **conservative:** kept the same 3-field subscription via `useShallow` (preserves exact prior behavior/subscription set; lint status unchanged — vars were already unused-destructured under the bare call). Not dropped, to avoid any behavior change in a hot-path file. Logged as Deviation. |
| 5 | 487 | `KeyboardNavigationHelper` | `{ mode }` | mode → keydown effect (491,506 deps), early-return + render (508) | `useEditStore((s) => s.mode)` |

**SelectionSystem consolidation summary:** 5 destructures → main component's #1+#2 merged into ONE wide `useShallow` selector (all four selection/mode fields, every one render-subscribed via effect deps — merging is behavior-identical and avoids two store subscriptions); #3 moved to non-reactive `useEditStoreApi().getState()` (handler-only); #4 kept as-is (conservative, unused-but-preserved); #5 single-field selector. Selection state (selectedSection/selectedElement/multiSelection/mode) stays subscribed wherever the component renders/effects from it — no over-narrowing.

### Deviations

- **SelectionIndicators (#4):** its three subscribed selection fields are dead (JSX commented out). Conservative choice per in-scope-ambiguity rule: preserved the identical subscription via `useShallow` rather than dropping the vars, keeping behavior/lint byte-equivalent to pre-change. A future cleanup could drop them, but that is out of this batch's no-behavior-change mandate.

### Grep-zero per file

`rg "useEditStore\(\s*\)"` on all 4 touched files → 0 matches (exit 1).

### Verification

- `npx tsc --noEmit` → exit 0.
- `npm run test:run` → 2508 passed, 11 skipped (158 files) → exit 0.
- `npm run lint` → exit 0 (only pre-existing `no-img-element`/`exhaustive-deps` warnings; none in touched files).
- **renderProbe smoke** (authed, worktree dev server PORT=3021, `NEXT_PUBLIC_DEBUG_EDITOR=true`, mock-GPT; never :3000): `--smoke=select,type,undo,redo,palette,modal` → **all 6 PASS** (`allPassed: true`). Discriminating checks: `select` PASS (toolbar[text-mvp] visible), `undo` PASS (reverted), `redo` PASS (reapplied).

**Commit counts vs baseline (all ≤ baseline):**

| Metric | Baseline | Post-B2 | Δ |
|---|---|---|---|
| Commits during 20-char burst | 6 | 6 | flat |
| Commits on commit (blur) | 3 | 3 | flat |
| Store mutations observed | 1 | 1 | flat |
| Palette-swap re-commits | 4–5 | 4 | ≤ |
| Heap delta (post-GC) | +0.6–0.9 MB | +0.647 MB | flat |

Dev server stopped after probe (PID killed, :3021 → 000; :3000 never touched, confirmed 000/not running).

### Open risks

- None functional. Only store-subscription lines changed; no persist/commit/renderer-layout/dual-pair edits. SelectionSystem #4 dead-var subscription intentionally preserved (see Deviations).

---

## Phase 7 (Batch B3) — useEditor.ts + SectionCRUD (HOT list finish + PERF CHECKPOINT)

**Files changed:**
- `src/hooks/useEditor.ts` (1 bare aggregate destructure → `useShallow` selector; public return shape byte-preserved)
- `src/app/edit/[token]/components/content/SectionCRUD.tsx` (3 bare sites → narrow selectors)
- `docs/task/editor-phase-4-store-finish.baseline.md` (post-phase-7 perf-checkpoint column)
- `docs/task/editor-phase-4-store-finish.audit.md` (this section)

4 bare `useEditStore()` sites converted → the HOT list (B1–B3) is now complete.

### `useEditor.ts` — 1 site (aggregation shim, D2 refactor not exempt)

Converted the single 13-field bare aggregate destructure to one `useShallow` object
selector of exactly those 13 fields. Destructure names, all callback bodies, every
`useCallback`/`useEffect` dependency array, and the public return shape are
byte-for-byte unchanged — the hook re-renders only when one of its 13 subscribed
fields changes instead of on every store mutation.

**Return-shape preservation (exposed vs subscribed), like B1:**

| Return-shape key | Kind | Source |
|---|---|---|
| `handleEditorClick` | callback | local `useCallback` |
| `handleKeyboardNavigation` | callback | local `useCallback` |
| `enterTextEditMode` | callback | local `useCallback` |
| `exitTextEditMode` | callback | local `useCallback` |
| `determineClickTarget` | callback | local `useCallback` |
| `calculateToolbarPosition` | callback | local `useCallback` |
| `determineElementType` | callback | local `useCallback` |
| `selectedSection` | state | subscribed |
| `selectedElement` | state | subscribed |
| `mode` | state | subscribed |

Return shape identical to pre-change; downstream consumers NOT edited.

**Over-narrow guard (D4.2) — subscribed 13 fields vs render-path reads:**

| Field | Kind | Read on render path? | Where |
|---|---|---|---|
| `mode` | state | yes | `handleEditorClick`/`handleKeyboardNavigation` guards + `useEffect` deps (381,391) + return |
| `selectedSection` | state | yes | `handleKeyboardNavigation` Tab logic (343) + dep array + return |
| `selectedElement` | state | yes | returned (exposed to consumers) |
| `isTextEditing` | state | yes | `determineClickTarget` (36) + its dep array (110) |
| `textEditingElement` | state | yes | `determineClickTarget` (36,46) + dep array (110) |
| `toolbar` | state | yes | `determineClickTarget` (36,53) + dep array (110) |
| `showToolbar` | action ref | callback-only | subscribed for stable ref (in dep arrays) |
| `hideToolbar` | action ref | callback-only | " |
| `setActiveSection` | action ref | callback-only | " |
| `selectElement` | action ref | callback-only | " |
| `announceLiveRegion` | action ref | callback-only | " |
| `setTextEditingMode` | action ref | callback-only | " |
| `updateElementContent` | action ref | callback-only | used in `enterTextEditMode`/`exitTextEditMode` onblur/onkeydown/exit |

Action refs kept inside the `useShallow` selector (stable object identity while refs
unchanged) — same choice as B1, preserves referential identity in the callback dep
arrays with zero body/dep-array edits. No field the callbacks/deps read was dropped.

### `SectionCRUD.tsx` — 3 sites

| # | Line | Component | Orig | Fields read on render path | Disposition |
|---|---|---|---|---|---|
| 1 | 108 | `SectionActionsMenu` | `{ content, sections }` | `content[sectionId]` (109); `sections.indexOf` (110) + `sections.length` (136) | `useShallow({content,sections})` — both render-read, kept |
| 2 | 282 | `BulkSectionActions` | `{ sections, content }` | `sections` in `handleSelectAll` (285) + dep (286). `content` NEVER read in this component | narrowed to `useEditStore((s) => s.sections)` — dropped dead `content` (see Deviations) |
| 3 | 443 | `SectionList` | `{ sections, content }` | `sections.map` (500) + `.length` (571); `content[sectionId]` (501) → `section.elements` (542) | `useShallow({sections,content})` — both render-read, kept |

`sections` in #2 is used only inside `handleSelectAll` but captured in that callback's
closure + dep array, so it must stay reactively subscribed — a single-field selector
(`(s) => s.sections`, ref-stable, no `useShallow` needed) preserves that exactly.

### Deviations

- **`BulkSectionActions` (#2) dead `content` dropped.** Confirmed via full-body grep
  (`content[`, `content.` — zero matches in lines 276–353) that `content` was never
  referenced in this component; the bare destructure subscribed to it as pure churn.
  Dropping it is correct narrowing (D4.2 over-narrow guard only bans dropping
  *render-read* fields), not a behavior change — the var was unused, so no observable
  output changes. Chose to drop rather than preserve (unlike B2's SelectionIndicators
  dead-var keep) because here it's a single genuinely-unreferenced field in a
  cold-rendered component and subscribing to the whole `content` object would re-render
  the component on every text-edit commit for nothing. `sections` (the one real read)
  stays subscribed. Note: `SectionActionsMenu` (#1) also computes an unused `section`
  var from `content[sectionId]` (line 109), but there `content` indexing IS evaluated
  on the render path, so `content` was kept subscribed — conservative.

### Grep-zero

`rg "useEditStore\(\s*\)"` on both touched files → 0 matches (exit 1).

### Verification

- `npx tsc --noEmit` → PASS (exit 0).
- `npm run test:run` → 2508 passed / 11 skipped (159 files), exit 0.
- `npm run lint` → PASS (exit 0); only pre-existing `no-img-element`/`exhaustive-deps`
  warnings, none in the two touched files.
- **renderProbe smoke** (authed, worktree dev :3021, `NEXT_PUBLIC_DEBUG_EDITOR=true`,
  mock-GPT; :3000 never touched) `--smoke=type,select,undo,redo,palette,modal` →
  **all 6 PASS** (`allPassed: true`). Section-CRUD-relevant `select`/`undo`/`redo`
  all green (select → toolbar[text-mvp] visible; undo reverted; redo reapplied).
- **Authed edit-persistence E2E** (`E2E_PORT=3021 npx playwright test edit-persistence`)
  → **2/2 pass** (auth setup + throttled-edit-persists-no-silent-loss). Confirms the
  hot-path selector work didn't break the commit/persist path.
- Dev server stopped after (PID killed, :3021 → 000; :3000 confirmed not running/000).

### ⭐ HOT-PATH PERF CHECKPOINT — post-phase-7 vs baseline

| Metric | Baseline | Post-phase-7 | Verdict |
|---|---|---|---|
| React commits during 20-char burst | 6 | 6 | flat |
| React commits / keystroke | 0.3 | 0.3 | flat |
| React commits on commit (blur) | 3 | 3 | flat |
| Store mutations observed | 1 | 1 | flat |
| JS heap delta (post-GC) | +0.6 – +0.9 MB | +0.667 MB | flat (in range) |
| Palette-swap re-commits | 4–5 | 4 | ≤ baseline |

Commit counts ≤ baseline, heap flat — matches phase-7 expectation. Recorded in
`editor-phase-4-store-finish.baseline.md` as the "post-phase-7 (hot paths done)" row
(the number Gate B reviews for the hot-path half).

### Open risks

- None functional. Only store-subscription lines changed; no persist/commit path,
  no renderer/dual-pair, no ad-hoc `set()`, named-op discipline intact. The dropped
  `content` in `BulkSectionActions` was verified dead before removal.

## Phase 8 (Batch B4) — theme surfaces (cold)

### Files changed
- `src/app/edit/[token]/components/ui/ThemeSelector.tsx`
- `src/app/edit/[token]/components/ui/ThemePopover.tsx`
- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx`
- `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx`
- `src/app/edit/[token]/components/ui/StyleBrowserModal.tsx`
- `src/app/edit/[token]/components/ui/ColorPicker/SolidColorPicker.tsx`

All 6 resolved paths confirmed via `rg` (each had exactly one bare `useEditStore()` site).

### Per-file field-enumeration (D4.2: subscribed vs render-read)

| File | Bare-site line | Subscribed (selector) | Render-read | Action-only (handlers) |
|---|---|---|---|---|
| ThemeSelector.tsx | 8 | `theme`, `getColorTokens` | `theme.colors.accentColor`, `getColorTokens()` | — (dead `handleColorChange`, all commented) |
| ThemePopover.tsx | 56 | `theme`, `updateTheme`, `recalculateTextColors` | `theme.colors.*` (palette/texture/accent/backgrounds) | `updateTheme`, `recalculateTextColors` |
| ServiceThemePopover.tsx | 49 | `audienceType`,`templateId`,`variantId`,`paletteId`,`themeValues`,`sections`,`pages`,`updateMeta`,`triggerAutoSave` | all first 7 (guard, active ids, look, fit-filter `deriveSwapSite(sections,pages)`) | `updateMeta`, `triggerAutoSave` |
| VestriaThemePopover.tsx | 67 | same 9 as Service | same 7 render + `deriveSwapSite(sections,pages)` | `updateMeta`, `triggerAutoSave` |
| StyleBrowserModal.tsx | 33 | `theme` (single-field selector) | `theme.colors.paletteId` (active highlight) | — (swap via `usePaletteSwap`) |
| SolidColorPicker.tsx | 14 | `theme` (single-field selector) | `theme.colors.base/accentColor` (brand-color memo) | — |

No over-narrowing: every subscribed field is either render-read or a stable action ref
used in handlers. No render-read field was dropped from a subscription.

### Conversion classification
- **Render-read (useShallow object selector):** ThemeSelector, ThemePopover, ServiceThemePopover, VestriaThemePopover. Actions kept in the shallow selector as stable refs (no `getState()` needed — they never trigger re-renders under shallow-equal).
- **Render-read (single-field selector):** StyleBrowserModal, SolidColorPicker (each reads only `theme`).
- **Pure-action (`useEditStoreApi()` only):** none — all 6 read theme state to render.

### Verification
- Grep zero: all 6 files → zero bare `useEditStore(\s*)`.
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 2508 passed | 11 skipped (159 files).
- `npm run lint`: pass (only pre-existing `<img>` / exhaustive-deps warnings, none in touched files).

### renderProbe smoke (authed, worktree :3021, DEBUG_EDITOR + mock-GPT)
`PROBE_URL=http://localhost:3021 --smoke=palette,modal,select,undo,redo` → `allPassed: true`.

| Smoke | Result |
|---|---|
| palette (discriminating) | PASS — mint→cyan via popover, **4** React re-commits |
| modal | PASS — popover active swatch reflects store paletteId="cyan" |
| select | PASS — store.textEditing + text-mvp toolbar visible |
| undo | PASS |
| redo | PASS |

- Palette-swap re-commits: **4** vs baseline 4–5 → ≤ baseline.
- Heap delta +0.76 MB (baseline +0.6–0.9 MB) → flat.
- Burst commits 6, commits/keystroke 0.3, commits-on-blur 3 → flat vs baseline.

Dev server stopped after probe (:3021 no longer LISTEN; :3000 untouched).

### Open risks
- None. Store-subscription lines only; no persist/commit path, no renderer/dual-pair,
  no ad-hoc `set()`, named-op discipline intact. `ThemeSelector.handleColorChange` was
  already fully commented-out dead code before this change (unrelated to the conversion).
