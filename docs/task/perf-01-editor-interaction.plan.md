# perf-01 — editor interaction cost — implementation plan

**Branch:** `feature/perf-01-editor-interaction` (subagents hard-stop on mismatch)
**Spec:** `docs/task/perf-01-editor-interaction.spec.md`
**Rev:** 2 (plan-review round 1 folded: normalizeCtas per-section memoization added, orderedSections memo split, TS overloads, autosave-trigger check, persist line refs)

## Overview

Make one edit cost one section: today every store write (even toolbar toggles) re-renders all ~100 `useEditStoreLegacy()` subscribers and synchronously stringifies ~70KB to localStorage. Fix in three legs: (1) debounce the persist write, (2) give the store hook selector support and move render-hot subscribers to narrow slices with stable/memoized outputs, (3) stabilize the renderer's per-section props (normalizeCtas re-clones cta-bearing sections every keystroke — the real prop-churn source), memo blocks, split the orderedSections memo, and add a cheap cold-load skeleton. No UX change, no published-renderer changes, no persist-shape change.

## Progress log

- phase 1 debounced localStorage persist: done (review loops 1, ship)
- phase 2 selector support in store hook: done (review loops 1, ship)
- phase 3 shared base block hook (stable refs): done (review loops 1, ship)
- phase 4 renderer props stabilization + memo + skeleton: done (review loops 1, ship)
- phase 5 render-hot leaf call sites → selectors: pending
- phase 6 event-handler call sites → getState: pending
- phase 7 full verification + manual QA gate: pending

---

## Phase 1 — Debounced localStorage persist

Biggest isolated win, zero coupling to the render work. Persist shape is UNCHANGED (same `partialize`, same key, no version bump) → old drafts load as-is → **no human gate needed** (spec's candidate gate only applies to a shape change, which we avoid).

**Files touched**
- `src/stores/editStore.ts`

**Steps**
1. Debounce the storage adapter's custom `setItem` (`editStore.ts:466-473` — note: `:394-430` is `partialize`, don't touch it) with a trailing ~1000ms idle timer. Keep only the LATEST pending value; each new write resets the timer.
2. Flush guarantees so drafts aren't lost: on `beforeunload` and `pagehide` (and visibility→hidden as belt-and-braces), synchronously stringify + write the LATEST pending value (not a stale snapshot). Check `storeManager.ts` teardown path — if store instances are destroyed on token switch, flush there too; if not, no change.
3. Do NOT touch `partialize`, storage key, or `version`. UI-chrome fields are already excluded from `partialize` (scout-verified), so no re-slicing needed — record this in the audit so reviewers don't chase the spec's "move UI-chrome out" wording.
4. Guard: debounce timer + pending value live per-store-instance (token-scoped factory), not module-global, to avoid cross-project flush bleed.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- Manual (dev): open /edit, DevTools → Application → localStorage; type continuously in a headline → zero writes while typing; stop ~1s → exactly one write. Hard-reload → draft content intact (back-compat probe: an existing pre-change draft also loads). Close tab mid-typing, reopen → last keystrokes present (flush check).

---

## Phase 2 — Selector support in `useEditStoreLegacy`

Infrastructure only; no caller changes. All ~103 existing no-arg call sites keep compiling and behaving identically.

**Files touched**
- `src/hooks/useEditStoreLegacy.ts`

**Steps**
1. Add selector support via **TypeScript function OVERLOADS** — `function useEditStoreLegacy(): EditStoreState` and `function useEditStoreLegacy<T>(selector: (s: EditStoreState) => T): T` — with a single implementation signature. Do NOT use a lone optional-param signature (`selector?`): it makes the ~103 zero-arg callers infer a union/`unknown` return and property access fails tsc. Implementation: `useStore(store, selector)` when given, whole-store when omitted.
2. Callers pair with `useShallow` from `zustand/react/shallow` for object selectors — no custom shallow logic here.
3. Add `useEditStoreApi()` (or equivalent) returning the context store INSTANCE (non-reactive) so event-handler hooks can call `.getState()` against the correct token-scoped store instead of the global last-mounted `useEditStoreLegacy.getState()`. Keep the existing static `getState` untouched for back-compat.
4. Type the selector against the store's state type exported from `src/stores/editStore.ts` (use the existing exported state type; do not restructure types).

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green (proves zero-arg back-compat across all call sites).

---

## Phase 3 — Shared base block hook (stable refs)

The 8 per-template block hooks are byte-identical clones except a log tag (scout-verified). Decision: extract ONE shared base hook and re-point the 8 as thin wrappers. Tradeoff: touches all templates at once, but the alternative (fixing the same subtle memoization logic 8 times) guarantees drift; clone-identity makes the consolidation mechanical and low-risk. Wrapper signatures/return shapes stay identical so no block component changes in this phase.

**Files touched**
- `src/modules/templates/shared/useTemplateBlock.ts` (new — base hook; takes a log-tag param)
- `src/modules/templates/meridian/hooks/useMeridianBlock.ts`
- `src/modules/templates/techpremium/hooks/useTechPremiumBlock.ts`
- `src/modules/templates/hearth/hooks/useServiceBlock.ts`
- `src/modules/templates/surge/hooks/useServiceBlock.ts`
- `src/modules/templates/lex/hooks/useLexBlock.ts`
- `src/modules/templates/lumen/hooks/useLumenBlock.ts`
- `src/modules/templates/granth/hooks/useGranthBlock.ts`
- `src/modules/templates/vestria/hooks/useVestriaBlock.ts`

**Steps**
1. Base hook subscribes via selectors only: `content[sectionId]` (single stable slice ref), `mode`, and `updateElementContent` (store actions are stable identities). Use `useShallow` where an object is selected. No whole-store subscription remains.
2. Memoize `blockContent = extractLayoutContent(...)` with `useMemo` keyed on the STABLE `content[sectionId]` ref + layout id — NOT on the derived `elements`/`excludedElements` locals (their `|| {}` / `Array.isArray ? : []` fallbacks mint fresh refs every render; compute those fallbacks INSIDE the memo).
3. Wrap `handleContentUpdate` / `handleCollectionUpdate` in `useCallback` keyed on `[sectionId, updateElementContent]`.
4. Each of the 8 template hooks becomes a one-line wrapper passing its log tag; exported names/signatures unchanged. Firewall note: shared hook is a plain client module consumed by template code — does not cross the dispatch firewall (no template code enters main bundle via it) and touches nothing `.published.*`.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green (template dispatch + generation-contract + render-parity tests cover the hook path).
- Manual (dev): edit a hero headline on one product (meridian) + one service (hearth) template — text commits on blur/Enter, cards/collections still editable.
- React Profiler spot-check: typing in one section no longer re-renders other sections' block bodies via these hooks (renderer/prop cascade still present until phase 4 — check hook-level renders, not full tree).

---

## Phase 4 — Renderer: per-section prop stabilization, memo-at-resolution, orderedSections split, import-gate skeleton

**Corrected premise (plan-review B1):** blocks do NOT receive only `{ sectionId }`. The `usesTemplate` branch (`LandingPageRenderer.tsx:492-499`) renders `<LayoutComponent sectionId isEditable publishedPageId pageOwnerId {...(data || {})} />` — it SPREADS the section's NORMALIZED content as props. That `data` flows from the `content` memo at `:137-154`, which calls `normalizeCtas()` on every `rawContent` change; per `src/utils/normalizeCtas.ts:201-262` every section with a resolvable `elementMetadata[*].cta` gets RE-CLONED each call (fresh `elementMetadata`/section refs). So editing the hero mints fresh props for header/footer/every cta-bearing section → `React.memo` shallow-compare fails → they re-render regardless of phase-3/5 subscription narrowing (churn is parent-driven via props). Stabilizing those props is the load-bearing step of this phase; memo without it is dead weight.

**Files touched**
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/utils/normalizeCtas.ts`
- `src/utils/normalizeCtas.memo.test.ts` (new — parity test memoized vs pure)

**Steps**
1. **Stabilize normalization output per section (B1 fix).** In `normalizeCtas.ts`, add a per-section memoizing layer (e.g. exported `createNormalizeCtasMemo()` factory holding a `sectionKey → {inputSectionRef, ctxSignature, outputSection}` cache; renderer holds the instance in a `useRef`). A section's normalized clone is recomputed ONLY when (a) its raw section ref changed, or (b) the cta-resolution-relevant context changed. Define that ctx signature from what `ctaToButtonConfig` actually consumes — goal, forms, currentPagePath, page path list + form-bearing page — explicitly EXCLUDING live page content values (on multipage, `buildNormalizeCtasContext` embeds `rawContent` in `ctx.pages`, so naive whole-ctx equality would invalidate every keystroke; derive the signature from paths/form-location only — verify against `buildNormalizeCtasContext` at implement time). The pure `normalizeCtas()` stays untouched (published exporter + existing tests depend on it); the memo layer is a plain module (no `'use client'` — published/client boundary safe, though only the editor consumes it). Renderer's `:137` memo switches to the memoized variant. Unchanged sections now keep their prior refs across keystrokes.
2. **Parity test.** New `normalizeCtas.memo.test.ts`: memoized output deep-equals pure `normalizeCtas` output across representative fixtures (single-page + multipage + GOAL_REF bridge cases — reuse fixtures from the 4 existing normalizeCtas test files); plus ref-stability assertions (untouched section keeps identity across a second call; changed section gets fresh identity; goal/forms/form-location change invalidates).
3. **Narrow root subscriptions.** Replace the full-store subscribe (`:108` `const storeState = useEditStore()` + destructure `:109-127`) with selector picks (`useShallow`) of exactly the fields the render body reads (sections, sectionLayouts, theme, content, mode, errors, audienceType, templateId, variantId, paletteId, themeValues, goal, forms, pages, currentPageId + stable actions). Callback-only reads → `useEditStoreApi().getState()`.
4. **Memo-at-resolution.** Wrap resolved block components in `React.memo` once, cached in a `Map`/`WeakMap` keyed by the resolved component, so the renderer's re-renders don't cascade into unchanged blocks. Effective ONLY because step 1 made the spread `data` props ref-stable for unchanged sections and phase 3 made hooks self-sufficient — hence ordering. Note `isEditable`/`publishedPageId`/`pageOwnerId` are stable across edits.
5. **Split the `orderedSections` memo (B2 fix).** Do NOT just narrow the combined memo's deps — its body also maps `data: content[sectionId]` for every section (`:263-329`), so dropping `content` from deps would serve stale `data` (spread props like normalized `buttonConfig`/`elementMetadata` wouldn't update on the EDITED section). Instead split:
   - **Memo A — background assignments:** `assignEnhancedBackgroundsToAllSections(allSectionIds, …)` (`:286-298`) keyed `[sections, sectionLayouts, validatedFields, hiddenInferredFields]` (id list derives from sections filtered by layout presence; the function reads only ids + onboarding fields). Stable across text edits — this is the per-edit cost being removed. Keep `dynamicBackgroundSystem`/`theme.colors.sectionBackgrounds.secondary` (current combined deps) on whichever memo actually reads them — verify at implement time.
   - **Memo B — finalSections mapping:** cheap per-section map producing `{ id, order, background, layout, data }` (incl. the `content[sectionId]?.backgroundType` manual-override read), keyed `[sections, sectionLayouts, content, memo-A output]`. Re-runs on edits (cheap), and with step 1 in place `content[sectionId]` refs are stable for unchanged sections — so memo'd blocks see stable `data`.
6. **Import-gate skeleton.** At `:887`, replace `return null` with a neutral skeleton — plain min-height container(s) approximating section rhythm, NO `tmpl.ThemeInjector` (that is what's loading), no template CSS vars. Hooks-order safe (all hooks run above `:887`). Cold-load only; warm nav path unchanged. Accepted mild transient CLS (scout-flagged, low severity).

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green (incl. new memo parity test + all 4 existing normalizeCtas test files untouched-and-green).
- React Profiler (dev): hero focus + type + blur → only the hero section's blocks commit; header/footer/cta-bearing sections do NOT re-render (the B1 acceptance probe).
- Manual: GOAL_REF CTA buttons still resolve correctly in editor + preview, single-page AND multipage (change goal/form placement → buttons update); background alternation unchanged; cold-load /preview/[token] shows skeleton then content; warm nav identical; product page unaffected.

---

## Phase 5 — Render-hot leaf call sites → selectors

Mechanical sweep: every render-hot component/hook below switches from no-arg `useEditStore()` to a narrow selector (`useShallow` for object picks); values used only in event handlers move to `getState()` via `useEditStoreApi()`. No behavior/markup changes. **InlineTextEditorV2 constraint: it reads only actions (setTextEditingMode/showToolbar/hideToolbar) — select those actions (stable refs) and NOTHING else; do NOT make it controlled, do not touch its contentEditable/commit-on-blur-Enter logic (`:79-95`).** All files here are edit-side only — no `.published.tsx` counterparts exist for these concerns; dual-renderer parity untouched.

**Files touched**
- `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx`
- Template block components (direct store readers):
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
- Edit-primitive helpers: `src/modules/templates/vestria/blocks/editPrimitives.tsx`, `src/modules/templates/granth/blocks/editPrimitives.tsx`
- Shared blocks: `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx`, `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.tsx`, `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.tsx`
- Forms/nav/ui: `src/components/forms/FormPlacementRenderer.tsx`, `src/components/forms/FormConnectedButton.tsx`, `src/components/ui/HeaderLogo.tsx`, `src/components/navigation/NavigationEditor.tsx`, `src/components/navigation/NavItemToolbar.tsx`
- Render-hot hooks (invoked inside blocks): `src/hooks/useSmartTextColors.ts`, `src/hooks/useUniversalElements.ts`, `src/hooks/useToolbarPositioning.ts`

**Steps**
1. Per file: identify render-read fields vs handler-only reads; render-reads → selector (+`useShallow` if object); handler-only → `getState()`. Actions selected individually (stable).
2. No markup/class/logic changes — subscription plumbing only. If a file turns out to genuinely need whole-store during render (unexpected), leave it and log in the audit rather than force-fit.
3. If a file was already fixed via phase 3 (uses the block hook only), skip and note in audit.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- React Profiler: full acceptance probe — hero focus + type + blur cycle re-renders one section's blocks only (this phase clears the last stragglers: headers/footers/forms that self-subscribe).
- Manual smoke: header/footer/nav editing, form CTA button, lead form, image gallery block on one template each — all interactions work as before.

---

## Phase 6 — Event-handler-only call sites → `getState()`

These hooks subscribe whole-store but only READ in handlers; their host components (often near the root) re-render on every mutation and cascade. Switch to non-reactive `useEditStoreApi().getState()` inside handlers. Per scout: verify each file for render-time reads first — any hook that DOES read during render gets a narrow selector for just those fields instead.

**Files touched**
- `src/utils/ctaHandler.ts`
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

**Steps**
1. Per file: replace no-arg subscription with `useEditStoreApi()`; read via `.getState()` inside callbacks; keep returned callback identities stable (`useCallback` where consumers depend on identity).
2. **Trigger-mechanics check FIRST for `useAutoSave`/`useStatePersistence` (review fold #2):** before converting, confirm how change detection is DRIVEN. If autosave schedules via an effect/render pass that only fires because the whole-store subscription re-renders the host on every edit, a blind switch to `getState()` silently stops autosave triggering on edits — a regression the "don't alter cadence" guard won't catch. In that case keep a minimal reactive subscription to the change signal only (e.g. `lastUpdated` or the `content` slice ref via selector) as the trigger, and use `getState()` for payload reads. Change SUBSCRIPTION mechanics only — cadence/payload logic is perf-02 scope.
3. Any other render-time read discovered → narrow selector for that field only; note in audit.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green.
- Manual smoke: add/delete section, add/delete element, undo/redo, palette swap, reset, image toolbar, modal open/close, preview nav, CTA click.
- Autosave regression probe (explicit): make an edit, wait for autosave window → `saveDraft` request appears in network tab; repeat after idle.

---

## Phase 7 — Full verification + manual QA — **HUMAN GATE**

No code changes expected (bug-fix follow-ups only, each logged in audit). User sign-off required before merge to main: Profiler/6×-throttle checks are inherently manual.

**Files touched**
- (none planned; fixes discovered here get their own scoped commits listing files in the audit)

**Steps / checks**
1. `npx tsc --noEmit`, `npm run test:run`, `npm run build` — all green locally (no CI; per project rule this must precede any push).
2. Manual-test P0 checklist (`/manual-test` skill) on one product template (meridian) + one service template (hearth): editor↔published parity, editor interactions, publish flow unaffected (publish is store-state driven — scout confirmed the preview DOM scrape is dead code; we did not touch it).
3. Acceptance probes on naayom-scale project (prod token `Ix_Ki4FMSWKB` or an equivalent local clone — do NOT edit prod data; use a copied/dev project):
   - Chrome 6× CPU throttle: hero focus + type + blur visibly smooth.
   - React Profiler: cycle re-renders 1 section's blocks only (header/footer/cta-bearing sections stay quiet — B1 probe).
   - localStorage: zero writes while typing; ≤1 debounced write after idle; reload restores draft.
   - /preview/[token] on 6× throttle: cold load shows skeleton→content, first render smooth, no full-tree re-render storms, visually identical to before.
   - GOAL_REF/CTA spot-check on multipage: buttons resolve to correct form/page after edits (normalizeCtas memo correctness under real data).
4. If Profiler still shows storms from singleton chrome (toolbars/EditHeader/modals — the ~35 deferred call sites), record findings; fixing them is a follow-up decision at this gate, not silent scope creep.
5. Perf-track decision gate (spec): record whether 6×-throttle result reclassifies perf-02.

**Verification**
- All acceptance criteria in spec checked off; user approves merge.

---

## Explicitly out of scope (spec Scope-OUT — do not touch)

- No UX change; no per-section edit buttons.
- No `.published.tsx` / published-renderer / registry.published changes anywhere (pure `normalizeCtas()` untouched; memo layer is editor-only).
- No virtualization/iframe canvas.
- No autosave cadence/export changes (perf-02), no image work (perf-03), no baseline/finalContent split.
- Singleton-chrome call sites (~35) deferred; dead preview-DOM scrape left alone.

## Unresolved questions

1. Naayom prod token for QA — ok to load prod project read-only in dev editor, or want a cloned dev-project token prepared first?
2. If phase-7 Profiler still shows chrome-driven storms, fix ~35 singleton call sites in this branch or split to follow-up?
3. Skeleton look: plain neutral gray min-height bands acceptable, or want spinner/brand touch? (plan assumes neutral bands)
