# editor-phase-4-store-finish — scout findings

Condensed from 4 scouts. All paths under the worktree `src/` unless noted.

## 1. The 3 access layers + collapse order

**`src/hooks/useEditStore.ts`** (token/SSR layer):
- `useEditStore(tokenId, opts)` — **LIVE**, imported ONLY by `components/EditProvider.tsx:9`. Async SSR hook: `storeManager.getEditStore(tokenId)` → awaits persist hydration → returns `{store, isInitialized, ...}`.
- `useCurrentEditStore`, `useEditStoreSelector` — **DEAD** (defined, never imported).
- `createEditStore(tokenId)` shim (line 314) — **DEAD** deprecated wrapper (warns, delegates to storeManager). NOT the real factory. Safe delete.
- `useEditStoreCompat` (re-export of legacy, line 325) — **DEAD**, no occurrences anywhere.
- type re-exports `EditStore`, `EditStoreInstance`.

**`src/hooks/useEditStoreLegacy.ts`** (ACTIVE façade, ~100+ callers):
- `useEditStoreLegacy()` / `(selector)` — reactive; reads token store from EditProvider context, `useStore(store, selector)`. Sets `globalStoreRef` each render. Also `export { useEditStoreLegacy as useEditStore }` (the name most files import) + default export.
- `useEditStoreApi()` — **non-reactive** instance for event handlers (`.getState()`).
- static `useEditStoreLegacy.getState()` (line 78) — reads last-mounted store off module-local `globalStoreRef`.

**Backing store (KEEP — correct arch):** `src/stores/editStore.ts` `createEditStore(tokenId)` (line 370, the REAL factory) → `src/stores/storeManager.ts` singleton `storeManager.getEditStore(tokenId)` (line 60), LRU `maxCachedStores=3`, never evicts current token.

**Bootstrap trace:** `EditProvider(tokenId)` → `useEditStore.ts::useEditStore` → storeManager → factory; publishes `contextValue.store` via `EditStoreContext.Provider`. Legacy hooks read store back out of that context + set `globalStoreRef`.

**Safe collapse order:** factory/manager = stable base. `useEditStore.ts` dead exports (useCurrentEditStore, useEditStoreSelector, createEditStore shim, useEditStoreCompat) removable first, zero call-site impact. Live `useEditStore(tokenId)` must remain for EditProvider until/unless provider refactored.

## 2. Static / non-reactive consumers (MUST keep working)

- `useEditStoreApi()` callers: `hooks/useSectionCRUD.ts:69`, `useModalManager.ts:37`, `useImageToolbar.ts:12`, `useElementPicker.ts:63`, `useElementCRUD.ts:61`, `useAutoSave.ts:145`, `app/edit/[token]/components/ui/{useUndoRedo.ts:21,useResetSystem.ts:13,usePreviewNavigation.ts:12,usePaletteSwap.ts:13,SaveStateChip.tsx:43}`, `.../editor/LocaleSettings.tsx:34`. Test mock: `modules/templates/conformance.test.ts:42`.
- static `.getState()` callers: `utils/ctaHandler.ts:58`, `.../layout/GlobalAppHeader.tsx:157`, `.../toolbars/TextToolbarMVP.tsx:126`; `modules/prompt/buildPrompt.ts:34` (type-only `ReturnType<typeof useEditStore.getState>`).
- Direct REAL factory `createEditStore` (stores/editStore.ts): `storeManager.ts:97` + `src/hooks/editStore/*.test.ts` (pageActions, sectionSwap, setItemAlt, imageWriteGuard, i18nStoreState, aiBaselinePatch).

## 3. Call-site inventory (Step B targets)

~70 caller files / ~200 sites. **Majority already selector-ized** (all template blocks, sharedBlocks, useTemplateBlock, primitives InlineTextEditorV2/EditableLogo/EditableImageCollection, LanguageToggle, LocaleSettings, useUniversalElements, useSmartTextColors, useUndoRedo, useResetSystem, usePaletteSwap) — SKIP.

**Phase-3 already done — DO NOT re-touch:** toolbars `ToolbarShell.tsx:90`, `TextToolbarMVP.tsx:108`, `SectionToolbar.tsx:41`, `ImageToolbar.tsx:48,484`, `ElementToolbar.tsx:37`; `SaveStateChip.tsx:47`, `useAutoSave.ts:146`, `useSelectionPriority.ts:35`, `LandingPageRenderer.tsx:132`, `EditProvider.tsx:111`.

**~30 bare whole-store sites (~26 files) = targets:**

HOT (batch first — render/selection/typing paths):
1. `modules/generatedLanding/LandingPageRenderer.tsx:64` — `{mode}` per section render.
2. `app/edit/[token]/components/ui/EditablePageRenderer.tsx:67` (`{audienceType,templateId}`), `:215` (`{onboardingData,theme}`).
3. `app/edit/[token]/components/selection/SelectionSystem.tsx:54,56,200,401,487` — 5 bare destructures on selection hot path.
4. `app/edit/[token]/components/selection/ElementDetector.tsx:17,21,157`.
5. **`hooks/useOptimizedEditStore.ts`** — ~20 bare `useEditStore()` destructures across ~30 wrapper hooks. **HIGHEST LEVERAGE** — shared shim; fixing here fixes many downstream (~27 refs) at once.
6. `hooks/useEditor.ts:28` — aggregate shim `{…}=useEditStore()`.
7. `app/edit/[token]/components/content/SectionCRUD.tsx:108,282,443` — `{content,sections}`.

COLD (batch later — modals/popovers/header/preview):
- Theme: `ui/{ThemeSelector.tsx:8,ThemePopover.tsx:56,ServiceThemePopover.tsx:49,VestriaThemePopover.tsx:67,StyleBrowserModal.tsx:33,ColorPicker/SolidColorPicker.tsx:14}`.
- Modals: `toolbars/ButtonConfigurationModal.tsx:143`, `forms/FormBuilder.tsx:44`, `layout/GlobalFormBuilder.tsx:7`, `social/SocialMediaEditor.tsx:45`, `ui/{ProductsModal.tsx:63,ElementToggleModal.tsx:40,CountdownConfigModal.tsx:31,SeoSettingsModal.tsx:31}`, `modals/{TaxonomyModalManager.tsx:41,LandingGoalsModal.tsx:32}`, `content/ElementPicker.tsx:37`.
- Header/chrome: `layout/{EditHeader.tsx:22,EditHeaderRightPanel.tsx:68,PageSwitcher.tsx:55}`, `ui/{EnhancedAddSection.tsx:34,AddSectionButton.tsx:11,PreviewButton.tsx:14,DeviceToggle.tsx:8,SaveStatus.tsx:8}`.
- Preview/legal (not in editor render loop): `app/preview/[token]/page.tsx:63`, `app/preview/[token]/privacy/page.tsx:39`, `components/editor/PrivacyPolicyEditor.tsx:27`.
- Dev-only (lint-exempt): `app/dev/blocks/TemplateBlocksStage.tsx:168`.

**Whole-store "need" flags:** No caller needs the *reactive* whole store. `const store=useEditStore()` cases (SocialMediaEditor, SeoSettingsModal, ProductsModal, PageSwitcher, LandingGoalsModal) only call action methods (stable refs) → narrow/getState selectors work. Real aggregation shims `hooks/useOptimizedEditStore.ts` + `hooks/useEditor.ts` intentionally expose slices → need explicit lint exemption OR refactor. `EditProvider.tsx:111` (token init) legit non-selector.

## 4. Test net for reactivity regressions (THIN — informs the human gate)

- **NO Vitest test asserts selector-change → React re-render.** `src/hooks/editStore/*.test.ts` are store-state-only (`getState().action()` → assert state); never mount a component. Block-parity suites render `.published.tsx` once (static markup). 
- **Only true typing→render→persist net:** `e2e/edit-persistence.spec.ts` — 6× CPU throttle via CDP, types marker into Meridian hero `[data-element-key="headline"]`, asserts saveDraft POST + localStorage + survives reload. It is a **silent-edit-loss net**, NOT a re-render-count/heap benchmark. **Self-skips without Clerk env** (`E2E_CLERK_USER_EMAIL/PASSWORD`, `CLERK_SECRET_KEY`). Run: `npm run test:e2e` or `npx playwright test edit-persistence`.
- Idle-CPU/heap numbers (77%→0.85%) were **manual DevTools CDP traces** (`reports/perf-editor-throttled6x-*.md`, NOT in this worktree), deferred to human gate per phase-3 audit.
- **⇒ A too-narrow-selector regression (store updates but component stops re-rendering) is caught by NO automated Vitest test and only incidentally by one gated E2E. Reactivity MUST be verified in a real browser, not "tests green."**

## 5. Phase-3 selector pattern to imitate (Step B)

Ref `app/edit/[token]/components/ui/useUndoRedo.ts` + phase-3 audit.
1. Split reactive reads from imperative: subscribe (narrow selector) ONLY to derived values/booleans that gate rendering; read actions + one-shot values via `useEditStoreApi()` `.getState()` in handlers (never subscribed).
2. Never `useEditStore()` bare. Replace with `useShallow` object selector pulling the EXACT fields used; actions are stable refs → zero re-render on unrelated mutations.
3. Keep selector WIDE enough to include every field the component reads to render — the Step-B trap is over-narrowing so a needed field is dropped and the component stops updating. Enumerate pulled fields explicitly per file.
4. Acceptance grep: `rg "useEditStore(Legacy)?\(\s*\)"` under target dir → **zero** bare subscriptions.

## 6. Named-op mutation surface (PRESERVE — "no ad-hoc set() outside these")

11 slice creators composed in `stores/editStore.ts:416-426`: `createCoreActions, createContentActions, createAIActions, createPersistenceActions, createGenerationActions, createUIActions, createFormsImageActions, createLayoutActions, createCSSVariableActions, createRegenerationActions, createPageActions` (all `src/hooks/editStore/*.ts`). (5 other `create*Actions` files NOT in composition root — folded/unused; verify before treating as live.)

Canonical ops by slice (the mutation surface; text edit = `updateElementContent`, image = formsImage ops, collection = pageActions):
- **coreActions**: setMode, setEditMode, setActiveSection, selectElement, setSection, updateElementContent, duplicateSection, markAsCustomized, setBackgroundType, setSectionBackground, setGoal, trackChange, triggerAutoSave, addExistingSection, removeSection, moveSection(Up/Down), updateSectionLayout.
- **contentActions**: updateElementContent, setItemAlt, setActiveLocale, setSection, bulkUpdateSection, importSectionContent, selectVariation, applySelectedVariation, updateFromAIResponse, …
- **layoutActions**: addSection, removeSection, reorderSections, duplicateSection, setLayout, setSectionLayouts, updateTheme, updateBaseColor, updateAccentColor, updateSectionBackground, updateFromBackgroundSystem, updateTypography, resetToGenerated, setDeviceMode, setZoomLevel, setLogoUrl(/Dark)/clearLogo, updateColorTokens, recalculateTextColors, initializeSections, nav ops, social ops.
- **uiActions**: undo, redo, pushHistory, canUndo, canRedo, clearHistory (undo/redo core — locale-aware via `historyHelpers.ts`), setMode/setEditMode/setActiveSection/selectElement, setMultiSelection, setTextEditingMode, toolbar show/hide, triggerAutoSave, convertCTAToForm, setError/clearError, setLoading, modal ops.
- **formsImageActions**: uploadImage, uploadImageFromObjectUrl, uploadVideo, replaceImage, selectStockPhoto, generateImageAltText, optimizeImage(/All), bulkUploadImages, cleanupUnusedImages; addForm, createForm, add/update/deleteFormField, updateFormSettings, connectFormIntegration, link/unlinkButtonToForm, importForm.
- **pageActions**: setCurrentPage, addPage, applyArchetype, addArchetypePage, deletePage, renamePage, updatePageSeo, ensureCatalogPage, addCollectionItem, reorderCollection, setCollectionItemCategory, setCollectionCategories.
- **ai/generation/regeneration**: regenerateSection, regenerateElement, showElementVariations, hideElementVariations, regenerateAllContent, applyVariation, generateVariations.
- **cssVariableActions**: CSS-var setters + getColorTokens.
- **persistenceActions**: save, forceSave, loadFromDraft, export, triggerAutoSave, clearAutoSaveError.

Undo discipline centralized in `uiActions.ts` (pushHistory/undo/redo) via `pushHistoryEntry`. **Exception to note (not necessarily fix):** `useUniversalElements` mutates via manual `setSection(sectionId, {elements})` spreads rather than a dedicated named element op — the one existing ad-hoc-ish path. Spec = PRESERVE discipline + don't introduce NEW ad-hoc; don't rewrite this.

## 7. Wrapper hooks (coupling = import line only)

All 4 are consumers, none re-export the store:
- `useOptimizedEditStore.ts` — ~30 memoized selector/action wrapper hooks; imports `useEditStoreLegacy as useEditStore`. Repoint import + is itself a Step-B target (bare destructures). Insulates ~27 downstream refs.
- `useUniversalElements.ts` — selector consumer; repoint import. (manual-spread exception above.)
- `useSmartTextColors.ts` — read-only theme derivation, selector consumer; repoint import.
- `useModalManager.ts` — uses `useEditStoreApi()` (non-reactive); change only if `useEditStoreApi` renames.
