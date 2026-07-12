# perf-01 editor interaction — implementation audit

## Phase 1 — Debounced localStorage persist

**Files changed**
- `src/stores/editStore.ts`

**What changed**
- Added a module-level flush registry + one-time window-listener attach helper (`editStore.ts` ~line 39-62): `pendingFlushers: Set<() => void>`, `flushListenersAttached` guard, `attachFlushListeners()`. Listeners (`beforeunload`, `pagehide`, `visibilitychange→hidden`) are attached ONCE per app lifetime and iterate all registered per-instance flushers. SSR-safe (`typeof window !== 'undefined'` guard).
- Inside `createEditStore` (after `getStorageKey`, ~line 363-388): added per-instance debounce state `debounceTimer` + `pendingWrite`, and `writeNow()` which clears the timer, stringifies + writes the LATEST pending value, then nulls it. Registers `writeNow` in `pendingFlushers` and calls `attachFlushListeners()`.
- Storage adapter `setItem` (~line 490): now stores `{name, value}` as the latest pending write, resets a trailing 1000ms `setTimeout(writeNow)` on each call — keeps only the latest value.
- Storage adapter `removeItem` (~line 500): cancels any pending write + clears the timer before `localStorage.removeItem`, so a debounced setItem can't resurrect just-removed data.

**Debounce / flush / scoping design**
- Debounce: trailing 1000ms idle timer; each `setItem` overwrites `pendingWrite` and resets the timer → continuous typing produces zero writes; single write ~1s after idle.
- Flush: on tab teardown, `flushAll` runs every registered `writeNow` synchronously (stringify + write the LATEST pending value, not a stale snapshot). Belt-and-braces `visibilitychange→hidden` covers mobile/bfcache where unload may not fire.
- Per-instance scoping: `debounceTimer`/`pendingWrite`/`writeNow` live in the `createEditStore` closure (token-scoped factory), NOT module-global → no cross-project flush bleed. Only the listeners are shared/module-level (dedup'd), which is the intended app-lifetime pattern.

**storeManager finding**
- `storeManager.removeFromCache`/`destroyStore` only `delete this.storeCache[tokenId]` — no teardown method is invoked on the store instance, so there is no place to add a flush hook without editing storeManager.ts (out of scope, and not needed). On LRU eviction the pending `setTimeout` closure stays alive and still flushes ~1s later, so no draft loss. All flush handling lives entirely in editStore.ts's adapter lifecycle, as the plan's fallback allowed. storeManager.ts was NOT modified.

**Persist-shape note (spec "move UI-chrome out")**
- `partialize` (lines 415-451), storage key, and `version` are UNCHANGED. No version bump → old localStorage drafts load as-is, no migration. UI-chrome fields (toolbar, leftPanel, selection, aiGeneration, etc.) are already excluded from `partialize` — confirmed by inspection; no re-slicing was needed or done.

**Deviations**
- `removeItem` was made to cancel pending writes (conservative in-scope choice, not explicitly in steps) to prevent a race where a debounced write outlives a removal. Logged here per in-scope-ambiguity rule.

**Tests / typecheck**
- `npx tsc --noEmit`: green (no output).
- `npm run test:run`: green — 126 passed / 1 skipped files; 1998 passed / 3 skipped tests.

**Open risks**
- Flusher closures accumulate in `pendingFlushers` for the app lifetime (never removed — no teardown hook). Bounded/small: after flush `pendingWrite` is null, and store instances are few (LRU max 3, client-only editor). Acceptable per plan's "per-app-lifetime listener is fine".
- Debounce/flush behavior is inherently runtime; unit tests don't cover the timer path. Manual dev QA (localStorage write counting, close-tab-mid-typing) is in the plan's Phase 1 verification and Phase 7 gate.

## Phase 2 — Selector support in useEditStoreLegacy

**Files changed**
- `src/hooks/useEditStoreLegacy.ts`

**What changed**
- Added TS function OVERLOADS to `useEditStoreLegacy`:
  - `export function useEditStoreLegacy(): EditStore;`
  - `export function useEditStoreLegacy<T>(selector: (state: EditStore) => T): T;`
  - impl: `export function useEditStoreLegacy<T>(selector?: (state: EditStore) => T): EditStore | T` — passes `useStore(store, selector)` when a selector is given, `useStore(store)` when omitted. Zero-arg behavior byte-identical.
- Added `useEditStoreApi(): EditStoreInstance` — returns the context store INSTANCE (non-reactive) from `useEditStoreContext().store` for `.getState()` in event handlers against the correct token-scoped store. Existing static `useEditStoreLegacy.getState()` left untouched for back-compat.
- Imported `EditStore` from `@/types/store` (the real store state type; instance type stays `EditStoreInstance` from `@/stores/editStore`).

**Real state type used:** `EditStore` (from `@/types/store`). Store instance type: `EditStoreInstance`.

**Deviations:** none. No caller changes (infrastructure only, per phase scope).

**Tests:** `npx tsc --noEmit` green (proves zero-arg back-compat across all ~103 call sites). `npm run test:run` green — 126 files passed / 1 skipped; 1998 tests passed / 3 skipped.

**Open risks:** none — purely additive. `useEditStoreApi` unused until phases 5/6 wire it in.

## Phase 3 — Shared base block hook (stable refs)

**Files changed**
- `src/modules/templates/shared/useTemplateBlock.ts` (NEW — base hook)
- `src/modules/templates/meridian/hooks/useMeridianBlock.ts`
- `src/modules/templates/techpremium/hooks/useTechPremiumBlock.ts`
- `src/modules/templates/hearth/hooks/useServiceBlock.ts`
- `src/modules/templates/surge/hooks/useServiceBlock.ts`
- `src/modules/templates/lex/hooks/useLexBlock.ts`
- `src/modules/templates/lumen/hooks/useLumenBlock.ts`
- `src/modules/templates/granth/hooks/useGranthBlock.ts`
- `src/modules/templates/vestria/hooks/useVestriaBlock.ts`
- `src/modules/templates/__tests__/renderParity.meridian.test.tsx` (test-mock fix — added to Phase 3 by coordinator approval)

**Base hook — selector strategy + memo deps**
- Three narrow selector subscriptions (NO whole-store): `useEditStore(s => s.content[sectionId])` (stable slice ref), `useEditStore(s => s.mode)`, `useEditStore(s => s.updateElementContent)` (stable action identity). No `useShallow` needed — each pick is a primitive or a stable ref, so individual selectors avoid needless shallow overhead.
- `blockContent = useMemo(..., [sectionContent, layout, sectionId, logTag])`. The `elements` (`|| {}`) and `excludedElements` (`Array.isArray ? : []`) fallbacks + `getSchemaDefaults` + `extractLayoutContent` are computed INSIDE the memo body so they don't mint fresh refs each render. Derivation matches the originals byte-for-byte (same warn log on missing schema, same `{}` fallback) → identical output, just stable identity when `content[sectionId]` is unchanged.
- `handleContentUpdate` / `handleCollectionUpdate` wrapped in `useCallback` keyed `[sectionId, updateElementContent]`. `isExcluded` wrapped in `useCallback` keyed `[sectionContent]` (recomputes the exclusions array internally; result identical to originals).

**'use client' decision:** all 8 originals had `'use client'`; base hook keeps `'use client'`. Plain client hook module — imports nothing `.published.*`, imported by no published renderer.

**Per-clone difference discovered (scout's "byte-identical except log tag" was INACCURATE):** the 8 hooks have THREE distinct return shapes, not one:
- Shape A (meridian, techpremium, hearth, lex): `{ sectionId, mode, blockContent, handleContentUpdate, handleCollectionUpdate }`.
- Shape B (surge, granth, vestria): Shape A + `layout` + `isExcluded`.
- Shape C (lumen): Shape B + `editLang` (from an extra `useLumenEditLang()` subscription).
The base hook returns the Shape-B superset (`+layout +isExcluded`). Wrappers keep their EXACT original exported interface names (`UseXxxBlockProps`/`UseXxxBlockReturn`) and function signatures unchanged; each returns the base result typed to its own narrower return interface (Shapes A/B just structurally narrow the superset — extra runtime props are harmless, blocks destructure only what they read). Lumen additionally spreads `{ ...base, editLang }`, preserving its `useLumenEditLang` import. Log tags preserved (`useMeridianBlock`, `useTechPremiumBlock`, `useServiceBlock` ×2, `useLexBlock`, `useLumenBlock`, `useGranthBlock`, `useVestriaBlock`).

**Return-object identity:** wrappers still build a fresh return object per render (as originals did) — the stability wins are on `blockContent` + the handlers, which is where prop-churn matters.

**Test-mock fix (`renderParity.meridian.test.tsx`, coordinator-approved into Phase 3):** the mock was `useEditStoreLegacy: () => h.store.getState()`, which IGNORED the selector arg and always returned whole state. That worked with the pre-Phase-3 no-arg destructure; once the base hook subscribes via selectors, the mock handed whole state where the section slice was expected → `sectionContent.layout`/`.elements` undefined → empty blockContent → 8 parity divergences. Fixed the mock to honor the selector:
`useEditStoreLegacy: (selector?) => selector ? selector(h.store.getState()) : h.store.getState()`.
The mock was the bug (it silently discarded the selector), not the hook. This file does not stub `useEditStoreApi` or the static `.getState` (the EditProvider mock supplies the store to `useIsElementExcluded` separately), so no further mock changes were needed here.

**Other files with the same selector-ignoring pattern (NOT touched — deferred to Phase 5 per coordinator):** `sharedBlocks/__tests__/{followStrip,leadForm,storeBadges}.parity.test.tsx` and `vestria/blocks/Contact/VestriaLeadForm.editStore.test.tsx`. They currently PASS because the blocks they exercise still read whole-store; those blocks convert to selectors in Phase 5, at which point each needs the same one-line mock fix.

**Tests:** `npx tsc --noEmit` GREEN. `npm run test:run` GREEN — 126 files passed / 1 skipped; 1998 tests passed / 3 skipped.

**Open risks:** none. Production path unaffected — the real hook (EditProvider + zustand `useStore`) honors selectors correctly; the only test-side gap (the meridian mock) is now fixed.

## Phase 4 — Renderer: prop stabilization + memo + orderedSections split + import-gate skeleton

**Files changed**
- `src/utils/normalizeCtas.ts`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/utils/normalizeCtas.memo.test.ts` (NEW)

### `normalizeCtas.ts`

**Shared per-section helper (in-scope refactor — see Deviations):** extracted the per-section body of the pure `normalizeCtas` into a new module-private `normalizeSection(section, ctx)` that returns the SAME `section` ref when nothing resolves, else a shallow clone with `elementMetadata`/`elements` sub-objects replaced. Pure `normalizeCtas` now loops `Object.keys(content)` and calls `normalizeSection`, assembling the top-level clone exactly as before (`{ ...content }` only when a section ref changes). Output is logically byte-identical to the prior implementation (all 4 existing normalizeCtas test files stay green, incl. the `.toBe(content)` byte-identity assertions). BOTH the pure export and the memo call `normalizeSection`, so parity is structural (single source of truth), not duplicated-and-drift-prone.

**Memo layer design (`createNormalizeCtasMemo`)** — additive, plain module (NO `'use client'`), editor-only:
- Factory returns a closure holding a `Map<sectionKey, { inputSectionRef, ctxSignature, outputSection }>`.
- Per call: compute `ctxSignature` once; for each section, reuse the cached `outputSection` iff `inputSectionRef === section` AND `ctxSignature` unchanged; else recompute via `normalizeSection` and update the cache. Top-level clone assembled only for sections whose output ref differs from input — identical shape to the pure function.
- **Cache key:** `sectionKey` (the content map key). **ctx signature fields:** `computeCtxSignature` = `JSON.stringify({ goal, forms, currentPagePath, formPagePath })` — exactly what per-section resolution consumes (`ctaToButtonConfig` reads goal/forms/currentPagePath/formPagePath via `goalToDestination`; the flat-href bridge reads forms). Confirmed the plan-review correction: `buildNormalizeCtasContext` returns only those 4 fields (its `pages` arg is consumed to compute `formPagePath` then discarded — no live page content embedded), so the signature is content-free and stable across keystrokes.
- **Pruning:** when `cache.size > keys.length`, delete cache keys not in the current section-id set (bounded growth across a long add/delete session).

### `LandingPageRenderer.tsx`

**Root selector (step 3):** replaced `const storeState = useEditStore()` + full destructure with a single `useEditStore(useShallow((s) => ({...})))` picking exactly the render-read fields: `sections, sectionLayouts, theme, content, mode, errors, getColorTokens, updateFromBackgroundSystem, audienceType, templateId, variantId, paletteId, themeValues, goal, forms, pages, currentPageId`. All are read during the render body / in memos / in effects (verified by reading the whole component). No callback-only reads exist in this component, so `useEditStoreApi` was NOT needed/imported. (The tiny in-file `MissingLayoutComponent` keeps its own no-arg `useEditStore()` — not part of the root subscription; leaving it is conservative and in phase-5's leaf-sweep scope.)

**B1 wiring:** `content` memo now calls a `useRef(createNormalizeCtasMemo()).current` instance instead of the pure `normalizeCtas`. Single-page branch now also routes through `buildNormalizeCtasContext({goal,forms})` for a uniform ctx shape (equivalent output — builder with no `pages`/`formPagePath` yields `{goal,forms,currentPagePath:undefined,formPagePath:undefined}`). Multipage branch unchanged except the memoized call.

**Memo-at-resolution (step 4):** added `memoizedComponentCache = useRef(new WeakMap<ComponentType, MemoExoticComponent>()).current` + `getMemoizedComponent(Comp)` that lazily wraps each resolved block in `React.memo` ONCE and caches by component identity (registry returns stable refs). `renderSection` computes `MemoLayoutComponent = getMemoizedComponent(LayoutComponent)` after the null-guard and all three render branches (template / variable-system / legacy) render `<MemoLayoutComponent .../>`. Not called inline in JSX (that would mint a fresh type each render → remount storm).

**orderedSections split (B2, step 5):**
- **Memo A `backgroundAssignments`** — `assignEnhancedBackgroundsToAllSections(sectionIds, {onboarding defaults})`, deps `[sections, sectionLayouts, validatedFields, hiddenInferredFields]`. Section-id list derives from `sections` filtered by layout presence with `content[sectionId]?.layout` only as a FALLBACK. Added a LAYOUT-STABILITY ASSUMPTION code comment: typing never adds/removes a layout (structural mutations touch `sections`/`sectionLayouts`, which ARE deps), so keying without `content` is safe; a future content-only-layout mutation must re-add `content`. Used one `eslint-disable-next-line react-hooks/exhaustive-deps` for the intentional `content` omission.
- **Memo B `orderedSections`** — cheap per-section map to `{ id, order, background, layout, data: content[sectionId] }` incl. the `content[sectionId]?.backgroundType` manual-override read, deps `[sections, sectionLayouts, content, backgroundAssignments]`. Re-runs on edits (cheap); with B1 the `content[sectionId]` refs are stable for unchanged sections → memo'd blocks see stable `data`.
- **`dynamicBackgroundSystem` / `theme.colors.sectionBackgrounds.secondary` DROPPED from these memos' deps:** verified they are NOT read by the computation — `dynamicBackgroundSystem` appeared only in a `logger.debug` inside the old combined memo, and `theme.colors.sectionBackgrounds.secondary` was never referenced in the memo body (only in `renderSection` + JSX debug panels, which are unaffected). Both were spurious. The debug-only log referencing `dynamicBackgroundSystem` inside the memo was removed to keep deps honest.

**Import-gate skeleton (step 6):** replaced `if (!templateReady || !tmpl) return null;` with a neutral gray skeleton — up to 6 min-height bands (first 480px ≈ hero, rest 320px), alternating `#f3f4f6`/`#e5e7eb`, `aria-hidden`, NO `tmpl.ThemeInjector` / template CSS vars. All hooks run above this early return (hooks-order safe). Cold-load only; `sections` is guaranteed non-empty here (empty-state early return precedes it). Neutral bands per unresolved-Q3 assumption.

**Deviations**
- Extracted `normalizeSection` from the pure `normalizeCtas` body (the phase text said the pure export "stays UNTOUCHED"). Chose the shared-helper refactor over duplicating the intricate CTA/bridge logic because it makes memo-vs-pure parity STRUCTURAL (impossible to drift) — the conservative choice for the phase's hard constraint "memoized output MUST deep-equal pure output" and "don't break GOAL_REF/CTA resolution." The pure export's SIGNATURE and OUTPUT are unchanged (all 4 existing normalizeCtas test files, incl. byte-identity `.toBe(content)` assertions, stay green). Logged per in-scope-ambiguity rule.
- Single-page `content` memo branch routed through `buildNormalizeCtasContext` (was a bare `{goal,forms}` literal) for a uniform ctx shape feeding the memo signature. Output-equivalent.

**Test-mock fix:** NONE required. Searched for tests rendering `LandingPageRenderer` — only `normalizeCtas.parity.test.ts` references it (in a comment), none mount it. The step-3 selector conversion touched no test mock.

**New test `normalizeCtas.memo.test.ts`:** PARITY (single-page GOAL_REF, M3 flat-href bridge, real-assembly multipage cross-page dest, null-goal same-ref) all deep-equal / ref-equal the pure output; REF-STABILITY (i) untouched section keeps output identity, (ii) changed-ref section gets fresh identity, (iii) goal-change and form-location-change invalidate cached output and re-point, plus no-cta same-ref and cache-pruning cases. All fixtures produced by real `stampGoalRefCtas` / real multipage assembly (false-green guard).

**Tests / typecheck**
- `npx tsc --noEmit`: green (no output).
- `npm run test:run`: green — 127 files passed / 1 skipped (was 126, +1 for the new memo test); 2007 passed / 3 skipped.

**Open risks**
- React.memo default shallow-compare relies on B1 keeping unchanged sections' `data` refs stable and phase-3 blocks being self-sufficient; if a block reads a store slice WITHOUT a selector (phase-5 stragglers) it self-updates via its own subscription, so memo does not cause staleness — it only prevents parent-prop-driven re-render. Full one-section-per-edit acceptance is a phase-5/phase-7 Profiler check.
- Memo-A layout-stability assumption is documented in-code; a future content-only mutation that changes a section's layout would need `content` re-added to Memo-A deps.
- Skeleton CLS: neutral bands then real content pop-in on cold load (accepted, scout-flagged low severity). Runtime-only; not unit-covered.

## Phase 5 — Render-hot leaf call sites → selectors

**Files changed (source, 35)**
- `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx`
- `src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.tsx`
- `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx`
- `src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx`
- `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.tsx`
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx`
- `src/modules/templates/techpremium/blocks/ProductDetail/TechPremiumProductDetail.tsx`
- `src/modules/templates/techpremium/blocks/Gallery/TechPremiumGallery.tsx`
- `src/modules/templates/techpremium/blocks/Explainer/TechPremiumExplainer.tsx`
- `src/modules/templates/techpremium/blocks/Trust/TechPremiumTrust.tsx`
- `src/modules/templates/hearth/blocks/Header/WarmNavHeader.tsx`
- `src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx`
- `src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx`
- `src/modules/templates/lex/blocks/Header/LetterheadNav.tsx`
- `src/modules/templates/lumen/blocks/Header/LumenNav.tsx`
- `src/modules/templates/lumen/blocks/Footer/LumenFooter.tsx`
- `src/modules/templates/lumen/blocks/Hero/LumenHero.tsx`
- `src/modules/templates/lumen/blocks/Portfolio/LumenCategoryGallery.tsx`
- `src/modules/templates/lumen/blocks/About/LumenPhotographerAbout.tsx`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx`
- `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.tsx`
- `src/modules/templates/vestria/blocks/editPrimitives.tsx`
- `src/modules/templates/granth/blocks/editPrimitives.tsx`
- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx`
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.tsx`
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.tsx`
- `src/components/forms/FormPlacementRenderer.tsx`
- `src/components/forms/FormConnectedButton.tsx`
- `src/components/ui/HeaderLogo.tsx`
- `src/components/navigation/NavigationEditor.tsx`
- `src/components/navigation/NavItemToolbar.tsx`
- `src/hooks/useSmartTextColors.ts`
- `src/hooks/useUniversalElements.ts`
- `src/hooks/useToolbarPositioning.ts`

**Files changed (test mocks, 4)** — selector-honoring one-line fix:
- `src/modules/generatedLanding/sharedBlocks/__tests__/followStrip.parity.test.tsx`
- `src/modules/generatedLanding/sharedBlocks/__tests__/leadForm.parity.test.tsx`
- `src/modules/generatedLanding/sharedBlocks/__tests__/storeBadges.parity.test.tsx`
- `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.editStore.test.tsx`

### Per-file / grouped conversion

| File(s) | Render-read -> selector | Handler / action -> individual selector |
|---|---|---|
| InlineTextEditorV2 | (none) | setTextEditingMode, showToolbar, hideToolbar — three individual action selectors (stable). NOT controlled; contentEditable/commit-on-blur-Enter (:79-95) untouched. |
| Nav headers (Meridian, TechPremium, hearth, surge, lex, Lumen) | sections, pages, socialMediaConfig, legalPages — individual selectors (feed render useMemos / seed effect) | uploadImage (where present) |
| Upload hero/detail/about (EditorialPhotoHero, TechPremiumHero/ProductDetail/Explainer, LumenHero/About) | (none) | uploadImage (handler-only) |
| Footers (HairlineFooter, TechPremiumFooter) | content[sectionId] slice (own-section; render+handler read SAME slice -> replaced content?.[sectionId] with sectionContent var, pure plumbing), sections, pages | addForm, deleteForm, getFormById, setSection, uploadImage (TP) |
| Lumen/surge footers (LumenFooter, ContactFooterRich) | sections, pages | uploadImage (ContactFooterRich) |
| TechPremiumTrust | (none) | uploadImage |
| TechPremiumGallery | (none) | uploadImage, save |
| LumenCategoryGallery | (none) | uploadImage, save (save discovered at :68 — added its own selector) |
| VestriaTailoredHero | (none) | uploadVideo, uploadImage |
| VestriaLeadForm | forms?.[formId] — narrow single-form selector | (none) |
| vestria/granth editPrimitives (useXxxEditCtx) | sections, pages (render useMemo) | uploadImage (returned in ctx) |
| LeadForm/FollowStrip/StoreBadges (shared) | content[sectionId] slice; forms?.[formId] (LeadForm) | updateElementContent — handler references the selected var |
| FormPlacementRenderer | content[sectionId] slice, sections, forms slice (reactivity) | getAllForms |
| FormConnectedButton | sections, forms slice (reactivity for getFormById render read :148) | getFormById |
| HeaderLogo | globalSettings | setLogoUrl |
| NavigationEditor | navigationConfig, sections, sectionLayouts | updateNavItem, addNavItem, removeNavItem, reorderNavItems |
| NavItemToolbar | sections, sectionLayouts | navigationConfig (handler-only here), updateNavItem, removeNavItem, reorderNavItems |
| useSmartTextColors | theme (both hooks) | getColorTokens |
| useUniversalElements | content (kept reactive whole-map — feeds ~30 useCallback deps) | updateElementContent, setSection, trackChange/triggerAutoSave/announceLiveRegion (with existing || fallback) |
| useToolbarPositioning | (none) | showToolbar, hideToolbar (with || (()=>{}) fallback) |

### Selector strategy notes
- Individual selectors chosen throughout over useShallow object-picks: every selected field is a primitive, a stable slice ref, or a stable action identity, so individual picks are the narrowest subscription and avoid shallow-compare overhead. No file needed a multi-field object pick.
- Forms reactivity preserved (FormPlacementRenderer / FormConnectedButton): getAllForms/getFormById are actions deriving from the forms slice via getState() and do NOT re-render on form edits by themselves. To keep prior whole-store behavior (re-render when a form's fields change), added `const forms = useEditStore((s) => s.forms); void forms;` alongside the action selector. Deliberate correctness subscription, not churn.
- content in useUniversalElements left as whole-map subscription (not section-sliced): the hook's ~30 useCallbacks take content in deps and index arbitrary content[sectionId] (incl. cross-section move/copy). Narrowing would change callback identities / risk stale content in cross-section ops — out of plumbing-only scope. Whole-store -> content+actions is still a real narrowing (no longer re-renders on mode/toolbar/selection churn).

### InlineTextEditorV2 (hard guardrail)
Only the three actions re-pointed to individual selectors. No markup/logic change; DOM-as-source-of-truth contentEditable and commit-on-blur/Enter (:79-95) byte-identical. Not made controlled.

### Test-mock fixes (deferred from Phase 3)
The 4 mocks returned a fixed whole-store object, IGNORING the selector arg. Once their blocks switched to useEditStore((s) => ...), the mock handed whole state where a section slice / narrow form was expected -> would break. Applied the plan's pattern to each: wrap the state object in `useEditStoreLegacy: (selector?) => { const state = {...}; return selector ? selector(state) : state; }` (state kept lazily inside the returned fn to avoid vi.mock hoist/TDZ with referenced fixture consts). No other test-file changes. Repo-wide grep confirms only 5 mocks of useEditStoreLegacy exist; renderParity.meridian was already selector-honoring (Phase 3), the other 4 are now fixed.

### Deviations
- LumenCategoryGallery / TechPremiumGallery `save` action: read off the whole-store var beyond the single anticipated line. Added a dedicated save selector and re-pointed store.save?.() -> save?.(). In-scope plumbing.
- `void forms;` reactive-subscription idiom in the two form components — chosen over calling getAllForms()/getFormById() inside a selector (which would mint a fresh array/return each store tick -> useSyncExternalStore loop). Preserves exact behavior.
- content whole-map kept in useUniversalElements — narrowing deferred as behavior-risking / out of plumbing scope.
- Footers: replaced content?.[sectionId] textual reads with a sectionContent local (= the selected slice) so one slice backs both render and handler reads. Value-identical.

### Tests / typecheck
- `npx tsc --noEmit`: green (no output). One iteration fixed: LumenCategoryGallery store.save -> save after the initial store removal.
- `npm run test:run`: green — 127 files passed / 1 skipped; 2007 tests passed / 3 skipped (identical to Phase 4 baseline; incl. the 4 mock-fixed files).

### Open risks
- Profiler acceptance (one-section-per-edit) is a runtime check deferred to Phase 7; unit tests cannot observe subscription narrowing.
- useUniversalElements still re-renders its host on any content edit (whole content map). Host is not per-section, so no cross-section block churn is reintroduced; a future perf pass could narrow it if profiling flags it.

---

## Phase 6 — Event-handler-only call sites → getState()

**Files changed (13 planned; 12 modified, 1 intentionally unchanged):**
- `src/hooks/useSectionCRUD.ts`
- `src/hooks/useElementCRUD.ts`
- `src/hooks/useAutoSave.ts`
- `src/hooks/useStatePersistence.ts`
- `src/hooks/useElementPicker.ts`
- `src/hooks/useImageToolbar.ts`
- `src/hooks/useModalManager.ts`
- `src/hooks/useSelectionPriority.ts`
- `src/app/edit/[token]/components/ui/useUndoRedo.ts`
- `src/app/edit/[token]/components/ui/usePaletteSwap.ts`
- `src/app/edit/[token]/components/ui/useResetSystem.ts`
- `src/app/edit/[token]/components/ui/usePreviewNavigation.ts`
- `src/utils/ctaHandler.ts` — **inspected, left unchanged** (see below)

### FLAGGED: autosave / statePersistence trigger findings (plan step 2)

Two independent "autosave" mechanisms exist; I verified the trigger of each BEFORE converting.

**`useStatePersistence.ts` — RENDER-DRIVEN trigger. Kept a reactive change-signal.**
The auto-save effect (`if (hasChanged && editStore.isDirty) saveAuto()`) is DRIVEN by a render
pass: its dep array was `[editStore.isDirty, editStore.lastUpdated, …]`, and `lastUpdated`
changes on every edit → the effect re-fires each edit → schedules the save. A blind switch of
`editStore` to `getState()` would have dropped that reactive dep and SILENTLY STOPPED autosave
from firing on edits. Fix: kept a NARROW reactive subscription to just the change signal
`useEditStore(useShallow(s => ({ isDirty: s.isDirty, lastUpdated: s.lastUpdated })))` → `editIsDirty`
/ `editLastUpdated`. The effect deps now read those; payload/action reads (`export()`,
`loadFromDraft`, `clearAutoSaveError`, `clearError`) moved to `editStoreApi.getState()`. The
render-time `isDirty` read (return object) now uses `editIsDirty`. Whole-store subscription
removed (no more re-render on unrelated slices) with the trigger + cadence intact. The background
timer effect kept `editIsDirty` in its deps (preserves the original interval-recreation cadence)
and polls `editStoreApi.getState().isDirty` at fire time. Cadence/payload logic untouched (perf-02).

**`useAutoSave.ts` — TIME-DRIVEN trigger. getState is safe; narrowed for render reads.**
Its autosave trigger is the `setInterval(1000)` that polls `persistence.isDirty` and calls
`store.triggerAutoSave()` — it fires on a timer, NOT because a render occurred, so moving reads to
`getState()` does NOT stop it. However this hook READS `persistence.*` + `queuedChanges` DURING
render (the `status` memo, the snapshot/lastSaved/saveError effects) and returns `status` to UI.
So per the plan's "render-read → narrow selector" rule I kept a reactive subscription to just
`{ persistence, queuedChanges }` via `useShallow`, and moved all actions/methods
(`triggerAutoSave`, `forceSave`, `export`, `loadFromDraft`, `resolveConflict`, `clearAutoSaveError`,
`getPerformanceStats`, `tokenId`, `title`) to `storeApi.getState()`. Interval/online effects now
poll `getState()` inside their callbacks; deps `[…, storeApi]` (stable) so the interval is created
once instead of per-render — still fires every 1s.

### Per-file conversion

- **useSectionCRUD.ts** — getState. No render-time store reads (all `content`/`sections` reads are
  inside returned callbacks/handlers). Replaced `const store = useEditStore()` with
  `useEditStoreApi()`; snapshot stable actions once at render; each callback reads
  `const { content } = storeApi.getState()` / `{ sections }` fresh. Dropped unused `sectionLayouts`
  destructure. All `content`/`sections` deps replaced with `[storeApi, …]`.
- **useElementCRUD.ts** — getState. Same shape; ~18 callbacks each read `content` fresh via
  getState. Dropped unused `history` destructure. `content` deps → `storeApi`.
- **useElementPicker.ts** — getState. Only `announceLiveRegion` (a stable action) was read at
  render to build a fallback; moved that fallback + read inside `handleElementSelect`.
- **useImageToolbar.ts** — getState. All reads were already handler-only; `const store` now read
  from `storeApi.getState()` inside the callback.
- **useModalManager.ts** — getState. Only `triggerAutoSave` was subscribed; now
  `storeApi.getState().triggerAutoSave()` in the handler. (Its `useOnboardingStore` subscription is
  a different store, out of scope, untouched.)
- **usePreviewNavigation.ts** — getState. Handler-only `triggerAutoSave`.
- **useUndoRedo.ts** — KEPT SELECTORS (render-time read). `canUndo()`/`canRedo()` are CALLED during
  render to expose enabled flags, so a blind getState would freeze the buttons' enabled state.
  Gave two narrow reactive selectors `s => s.canUndo?.()` / `s => s.canRedo?.()` (re-render only
  when the boolean flips). Actions (`undo`/`redo`/`triggerAutoSave`) read via `storeApi.getState()`
  in the handlers.
- **usePaletteSwap.ts** — KEPT SELECTOR. Reads `theme.colors.textureId` at render → narrow selector
  `s => s.theme?.colors?.textureId || 'none'`. Actions read via getState in the handler.
- **useResetSystem.ts** — KEPT SELECTOR. Reads `onboardingData?.confirmedFields` at render → narrow
  selector for the derived boolean. Actions via getState in the handler.
- **useSelectionPriority.ts** — KEPT SELECTOR. Genuinely reads 6 UI-selection fields
  (`mode/isTextEditing/textEditingElement/selectedElement/selectedSection/toolbar`) DURING render
  (memoized selection object + effects). Narrowed the whole-store subscription to a `useShallow`
  pick of exactly those 6. These fields don't change on content keystrokes, so the host no longer
  re-renders on edits.
- **ctaHandler.ts** — UNCHANGED (deviation, see below).

### Deviations
- **ctaHandler.ts left unchanged.** `createCTAClickHandler()` is a plain (non-hook) factory that
  already uses static `useEditStore.getState()` — there is NO reactive subscription to remove (it
  contributes zero re-renders). Converting to `useEditStoreApi().getState()` would require a React
  hook context or a signature change to accept the store instance, rippling to its callers, none of
  which are in this phase's Files-touched list. Conservative choice: leave the non-reactive static
  getState as-is.
- **useAutoSave status perf-stats reactivity.** The `status` memo previously listed
  `store.getPerformanceStats()` (a fresh object each render) as a dep, so it recomputed every render
  while the whole store was subscribed. It now depends on `persistence.*` + `queuedChanges` + stable
  `storeApi`; perf numbers refresh when persistence changes (which is when saves — and thus perf
  stats — actually change). Displayed values are behavior-equivalent; only the recompute trigger
  narrowed. No cadence change.

### Render-time reads that STAYED selectors (not getState)
useUndoRedo (canUndo/canRedo booleans), usePaletteSwap (textureId), useResetSystem
(hasOriginalState), useSelectionPriority (6 UI fields), plus the change-signal subscriptions in
useStatePersistence (isDirty+lastUpdated) and useAutoSave (persistence+queuedChanges).

### Tests / typecheck
- `npx tsc --noEmit`: green (no output).
- `npm run test:run`: green — 127 files passed / 1 skipped; 2007 tests passed / 3 skipped (identical
  to the Phase 4/5 baseline). No test-mock fix required this phase.

### Open risks
- Autosave-fires-on-edit is verified structurally (trigger mechanics preserved) but the network-tab
  probe (`saveDraft` request after an edit + idle) is a runtime check deferred to the Phase 7 gate.
- The two CRUD hooks and the change-signal hooks (useStatePersistence/useAutoSave) still re-render
  their hosts when their subscribed signal changes (lastUpdated/persistence/queuedChanges change on
  edits) — that is inherent to change-detection design and matches prior behavior; the win is the
  removal of the whole-store subscription so unrelated-slice mutations no longer re-render them.
