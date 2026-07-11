# i18n-phase-1 — implementation audit

## Phase 1 — Content-model types + locale resolver (foundation)

**Files changed**
- `src/types/core/content.ts` (modified)
- `src/lib/i18n/localeContent.ts` (new)
- `src/lib/i18n/localeContent.test.ts` (new)

### What changed

`src/types/core/content.ts`
- Added `LocaleConfig` = `{ locales: string[]; defaultLocale: string }` (D4).
- Added `LocaleContentOverlay` = `{ [locale]: { [sectionId]: { [elementKey]: string | string[] } } }` (D1, text-only overlay).
- Extended `LandingPageContent` with optional `localeContent?: LocaleContentOverlay` and `localeConfig?: LocaleConfig`. Both OPTIONAL → legacy single-locale content is untouched.

`src/lib/i18n/localeContent.ts` (plain module, NOT `'use client'`)
- `resolveLocaleElements(base, overlay?, locale?) => Record<sectionId, SectionData>`
- `getEffectiveElementValue(base, overlay?, locale?, sectionId, elementKey) => string | string[] | undefined`
- `isMultiLocale(config?) => boolean` (true iff config exists and `locales.length > 1`)
- `SUPPORTED_LOCALES` readonly tuple = `['en','ja','es','pt','fr','it','id','nl','th','vi','de','pl']` (en first = default) + derived `SupportedLocale` union type.

### Shape decisions
- **Merge granularity = per-elementKey shallow override.** Overlay carries text only (`string | string[]`), so an overlaid key wholesale-replaces the base value for that key. Merge = `{ ...section.elements, ...sectionOverlay }` inside a fresh `SectionData` (`{ ...section, elements: ... }`). Base and `base.elements` are never mutated.
- **Nested V2 collection values** (arrays of objects, e.g. gallery `images`) are NOT deep-merged — when no overlay key exists for them they pass through by reference untouched; when overlaid, the whole value is replaced. Test `passes nested V2 collection values through untouched` asserts the collection is returned by identity (`toBe`).
- **Referential no-op fast path.** When `overlay`/`locale` is absent, or the locale has no overlay entry, `resolveLocaleElements` returns `base` AS-IS (same reference) — nothing to merge. Sections lacking an overlay entry keep their original `SectionData` reference; only sections with overlay get a new object. Keeps future perf/memo work honest.
- **Iterate base keys only.** Stray overlay sections not present in base are ignored (D1: overlay never introduces structure).
- `getEffectiveElementValue` return type is `string | string[] | undefined` — the text-reader contract Phase 3b consumes; base collection values fall outside its intended use.

### Deviations from plan
- The plan mentions `ProjectContent` (declared in `saveDraft`/`loadDraft` route files) gaining `localeConfig?`. Those route files are OUT of Phase 1's Files-touched (they belong to Phase 2). Per the task's own note ("canonical page type extension goes here in content.ts"), I added `localeConfig?` to the canonical `LandingPageContent` in content.ts only. The route-level `ProjectContent` typing is Phase 2's job. No out-of-scope files touched.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/lib/i18n/localeContent.test.ts` — `Test Files 1 passed (1)`, `Tests 14 passed (14)`.
- `npm run test:run` (full suite) — `Test Files 129 passed | 1 skipped (130)`, `Tests 2030 passed | 3 skipped (2033)`. Nothing else broke.
- No-import check: `grep -rn "lib/i18n\|localeContent" src/ --include=*.ts --include=*.tsx` (excluding the module itself) returns only `src/types/core/content.ts:106` — the `localeContent?` field name, a coincidental substring match, NOT an import. Zero runtime/production code imports the module → zero behavior change.

### Open risks / notes for next phases
- `getEffectiveElementValue` typed for text (`string | string[] | undefined`); Phase 3b readers that need collection values should read via `resolveLocaleElements(...).elements[key]` instead.
- The resolver's shallow-per-key semantics mean per-item text INSIDE a collection (e.g. a testimonial quote in an array) cannot be independently localized with the current overlay shape — only whole top-level elementKeys. If per-collection-item localization is needed later, the overlay type must be extended.
- `resolveLocaleElements` returns `base` by identity on the no-op path; callers must treat the result as read-only (as they already do with `state.content`).

## Phase 2 — Persistence: saveDraft/loadDraft locale-aware

**Files changed**
- `src/lib/validation.ts` — `DraftSaveSchema`: added optional top-level `localeConfig`.
- `src/app/api/saveDraft/route.ts` — destructure `localeConfig`; comment + wholesale-replace merge for `localeConfig`; comment the existing `...finalContent` spread as the `localeContent` ride-along site.
- `src/app/api/loadDraft/route.ts` — pass `localeConfig` through the whitelisted response (it WAS being stripped).
- `src/app/api/saveDraft/i18n.test.ts` (new) — tests (a)–(f).

### Schema changes
`DraftSaveSchema` gained one field: `localeConfig: z.object({ locales: z.array(z.string().max(20)).max(50), defaultLocale: z.string().max(20) }).optional()` — matches the Phase-1 `LocaleConfig` type. OPTIONAL, so legacy payloads validate unchanged. `localeContent` was deliberately NOT added to the schema: it rides inside `finalContent` (which is `z.unknown()`), so it already passes through untouched; declaring it top-level would be wrong. Comment in the schema documents this.

### Two merge mechanisms (as implemented + commented)
1. **`localeContent` — spread-ride (D1).** Lives inside `finalContent`; rides the existing shallow `{ ...existingContent.finalContent, ...finalContent, lastSaved }` spread (route ~line 161). Payload OMITS key ⇒ stored map PRESERVED; payload INCLUDES key ⇒ whole map REPLACED. No deep-merge added. Correctness rests on the store-side invariant (Phase 3a): every save that includes `localeContent` exports the COMPLETE map (all locales, all pages). Comment block added at the spread site stating this dependency.
2. **`localeConfig` — top-level wholesale-replace (D4).** Sibling of `finalContent`/`baseline`; does NOT ride the finalContent spread. Replaced wholesale exactly like `baseline`: present ⇒ overwrite; absent ⇒ preserved by the `...existingContent` spread at `updatedContent` construction. Read from the parsed value (it's validated), not raw body. Comment block added at the replace site mirroring the baseline comment.

### loadDraft — did it need edits? YES.
The GET response object WHITELISTS top-level keys (does not spread `content`). `finalContent` is returned whole, so the `localeContent` overlay inside it passes through untouched — no edit needed for the overlay. But top-level `localeConfig` was NOT in the whitelist and would have been silently dropped, so one line was added: `localeConfig: content.localeConfig ?? null` (mirrors `baseline`). Null for legacy projects.

### Test list (all pass)
- (a) legacy payload round-trips byte-identical (back-compat) — PASS
- (b) legacy project grows NO `localeContent`/`localeConfig` keys across a save→load→save cycle (deep recursive key scan) — PASS
- (c) EN edit carrying the full map keeps the existing NL overlay — PASS
- (d) SAFETY-CRITICAL: payload OMITTING `localeContent` preserves the stored overlay (spread semantics) — PASS
- (e) `localeConfig` wholesale-replace + absent-preserves (mirrors baseline) + load round-trip — PASS
- (f) multi-page + multi-locale full-map round-trip (root + subpage overlays) + partial/empty-map detectability scaffold — PASS

Test harness runs the REAL `DraftSaveSchema` and REAL route merge logic against a shared in-memory store; only auth/prisma/security/rateLimit/admin are mocked (sibling API-test pattern).

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — `Test Files 130 passed | 1 skipped (131); Tests 2036 passed | 3 skipped (2039)`. New tests included; no single-locale regressions.

### Deviations
None. In-scope judgment call: `localeContent` left off the schema (rides `z.unknown()` finalContent) rather than adding a redundant nested schema — conservative, matches D1's "rides the existing spread."

### Notes for Phase 3a (CONTRACT)
- **Full-map export invariant is load-bearing.** saveDraft's `localeContent` correctness depends ENTIRELY on the store always exporting the COMPLETE `localeContent` map on every save that touches locales — all declared locales' authored overlays, across the multi-page working-copy park boundary. A save that emits a partial/empty map WILL wipe the omitted locale(s) (the whole map is replaced when the key is present). Enforce with the dev-mode assertion (plan 3a step 7) before the payload leaves the store.
- Test (f) contains a route-side `declaredLocalesFullyPresent(config, localeContent)` scaffold demonstrating partial-map detectability; 3a's store-side flush assertion should mirror this shape so it plugs into the same fixture.
- A legacy store must NEVER send `localeConfig: null` — the schema is `.optional()` (rejects null). Omit the key entirely when there is no config (the route preserves absent = existing).

## Phase 3a — Editor store state layer: activeLocale, write paths, history, persistence

**Files changed**
- `src/types/store/state.ts` — `ContentSlice`: added `localeConfig?`, `activeLocale`, `localeContent`. `EditHistoryEntry`: added optional `locale`.
- `src/types/store/actions.ts` — `ContentActions`: added `setActiveLocale`.
- `src/stores/editStore.ts` — init defaults (`localeConfig:null`, `activeLocale:'en'`, `localeContent:{}`); partialize persists the three fields.
- `src/hooks/editStore/coreActions.ts` — shadowed-copy comments on the DEAD `setSection` + `updateElementContent` (no branching).
- `src/hooks/editStore/contentActions.ts` — locale helpers; `updateElementContent` locale branch (text→overlay); image-src guard comment; `setActiveLocale`; `bulkUpdateSection` locale branch; LIVE `setSection` locale-shared + caller-proof comment.
- `src/hooks/editStore/aiActions.ts` — regen guard on `regenerateSection`/`regenerateElement`/`regenerateElementWithVariations`/`generateVariations`.
- `src/hooks/editStore/generationActions.ts` — guard on `updateFromAIResponse` (the single AI write funnel).
- `src/hooks/editStore/collectionHelpers.ts` — verdict comment (materialized writes are locale-shared derived; no branch).
- `src/hooks/editStore/historyHelpers.ts` — `ContentHistoryEntry.locale`; stamp locale in `pushContentHistoryEntry` + locale in coalesce guard (groundwork).
- `src/app/edit/[token]/components/ui/useUndoRedo.ts` — doc comment: undo/redo is locale-aware (routes by `entry.locale`).
- `src/hooks/editStore/uiActions.ts` — `undo`/`redo` `'content'` restore is locale-aware: a locale-tagged entry restores into `state.localeContent[entry.locale][sectionId][storageKey]`; default entries restore base as before.
- `src/hooks/editStore/persistenceActions.ts` — `assertFullLocaleExport`; `applySnapshot` restores overlay; `loadFromDraft` restores `localeConfig`/`activeLocale`; `export()` ships complete overlay inside finalContent + assertion; `save()` sends top-level `localeConfig` (omitted when falsy).
- `src/hooks/editStore/i18nStoreState.test.ts` (new) — 19 store tests (incl. 4 locale undo/redo).

### Data-model resolution (matches committed Phase 2; deviates from D1 prose)
Phase 2's committed test (f) stores overlays for a root section AND a subpage section together in a SINGLE `finalContent.localeContent` map keyed by globally-unique sectionId (`${type}-${uuid}`). 3a therefore models `state.localeContent` as a PROJECT-GLOBAL overlay (one map, all pages), NOT the per-page-blob split D1's prose describes. Consequence: no per-page localeContent parking, so NO `pageHelpers.ts`/`pageActions.ts` edits — a page switch (which only rewrites `state.content`) leaves the sectionId-keyed overlay and project-global `activeLocale` untouched. This is the phase's key structural decision and keeps 3a inside its Files-touched list.

### DELIVERABLE #1 — text-write inventory (grep of element/content writers across `src/hooks/editStore/`, incl. coreActions.ts)
- `updateElementContent` (LIVE, contentActions ~60): BRANCHED. Non-default locale + text (string / all-string array, incl. dotted V2 collection-field strings) → `localeContent[locale][sectionId][key]`; base untouched; pushes a locale-TAGGED history entry (undo/redo routes it to the overlay). Collection OBJECT-arrays fall through to base (locale-shared structure).
- `updateElementContent` (DEAD, coreActions ~149): shadowed by contentActions (spread order core→content). Comment only, NOT branched.
- image-src guard (contentActions ~82): locale-AGNOSTIC refusal of `data:`/`blob:` (media never overlaid). Commented.
- `bulkUpdateSection` (contentActions ~470): BRANCHED — text values → overlay; non-text skipped; no history.
- `setSection` (LIVE, contentActions ~314): LOCALE-SHARED (base). Deliverable #2 proof below.
- `setSection` (DEAD, coreActions ~140): shadowed; comment only.
- `updateFromAIResponse` (LIVE, generationActions ~123): writes base unconditionally + GUARD no-op on non-default locale. Also the funnel for `regenerationActions.regenerateContentOnly/regenerateDesignAndCopy` → covered here (regenerationActions.ts NOT touched; dependency stated).
- `updateFromAIResponse` (stub, contentActions ~560): warn-only, no write.
- `regenerateSection` (aiActions): writes base; GUARDED no-op on non-default locale.
- `regenerateElement`/`regenerateElementWithVariations`/`generateVariations` (aiActions): GUARDED no-op — closes the variation→`applyVariation`→`updateElementContent` path so no AI value reaches an overlay (variation panel can't open in a non-default locale).
- `applyVariation` (aiActions): calls `updateElementContent`; unreachable in non-default locale (entry points guarded). Documented, not branched.
- `initializeSections` (generationActions): empty section shells (structural, generation-time = default). Base.
- structural/metadata setters (addExistingSection, removeSection, move*, updateSectionLayout, setBackgroundType, setSectionBackground, duplicateSection, markAsCustomized, importSectionContent, validateContent): structure/metadata, not element text → base, no branch.
- `collectionHelpers.ts` (syncCollection/materialize*/setSectionField): DERIVED locale-shared materialization from base records → base. Verdict comment; no branch. Per-locale card text is a 3b READ concern.
- `createForm` + image-upload writes (formsImageActions.ts, NOT in scope): form bindings + image src = structure/media = locale-shared → base. Correctly need no branching.

Net: no AI write can land in an overlay, and no AI write can clobber base from a non-default-locale session (aiActions entry guards + updateFromAIResponse funnel guard).

### DELIVERABLE #2 — `setSection` caller proof (structural-only ⇒ locale-shared is safe)
Grep of `setSection(` across `src/`, payload shapes by caller:
- `useUniversalElements.ts` (updateElementPosition/updateElementProps/addElement/removeElement(s)/removeAllElements/duplicateElement/reorderElements/moveElement*/copyElementToSection) → `{ elements: <map> }` = element-STRUCTURE CRUD. Inline text edits in this hook go through `updateElementContent` (imported at line 34), NOT setSection.
- `useElementCRUD.ts` (4 sites) → `{ elements: <map> }` = same class.
- `BlockVariantSelector.tsx:250` → `{ elements: clampedElements }` (variant-swap clamp, structural).
- `LayoutChangeModal.tsx:47` → `{ elements: migratedData }` (layout migration, structural).
- `ElementToolbar.tsx:61`, `ElementToggleModal.tsx:140/170` → `{ aiMetadata: {…excludedElements} }` (metadata).
- `ButtonConfigurationModal.tsx:379`, footer blocks → `{ elementMetadata/buttonConfig }` (config).
- `useSectionCRUD.ts:206/314` → whole `sectionData` (add/duplicate section); `:364` `{ [field]: value }` via `batchUpdateSections`, which has NO callers in the repo (dead path).
Conclusion: no caller passes an inline element-TEXT edit through setSection (those exclusively use `updateElementContent`). Structural ops preserve element KEYS, so the (sectionId,key)-keyed overlay stays valid. setSection stays base (locale-shared); test asserts a structural setSection under `activeLocale='nl'` mutates base only, overlay byte-identical. Edge (documented): cross-section element MOVE/COPY changes the (sectionId,key) address → an existing overlay for the moved key orphans; acceptable for v1 (no toggle in 3a).

### Undo/redo locale design (COMPLETE — uiActions.ts in scope per coordinator approval)
Locale-aware undo/redo is fully implemented:
1. Every `'content'` history entry carries `entry.locale` — stamped in `pushContentHistoryEntry` (defaults to `state.activeLocale`) and set explicitly by the contentActions non-default-locale branch. The coalesce guard includes `top.locale === entry.locale` so EN and NL edits never coalesce into one entry.
2. Non-default-locale text edits DO push history now (locale-tagged, raw-value snapshot `{ storageKey: elementKey, value }`, keyed to the overlay target).
3. `uiActions.undo`/`redo` `'content'` restore routes by the entry: if `entry.locale && entry.locale !== defaultLocale` → restore into `state.localeContent[entry.locale][sectionId][storageKey]` (base never touched); else → restore base `state.content[...].elements[storageKey]` exactly as before. The default-locale legacy branches (elementKey-wrapped / whole-elements) are unchanged.
4. `setActiveLocale` NO LONGER clears history — a locale switch preserves the stack; a mixed EN/NL undo sequence replays each entry against its own locale's target.
Undo of the FIRST NL edit restores `undefined` into the overlay key → readers fall back to base (correct: "no translation yet"); `undefined` values are dropped by `JSON.stringify` on save so the overlay stays clean. Existing non-locale undo/redo types (theme/section/layout/fullContent/sectionSwap) are untouched (sectionSwap regression test still green).

**Fix 1 (base-write entries default to the DEFAULT locale — review follow-up):** `pushContentHistoryEntry` previously default-stamped `entry.locale = state.activeLocale`. That mis-routed a locale-SHARED base edit that happens under a non-default active locale — specifically a collection OBJECT-array edit (not text → falls through to the base write at contentActions, yet still pushes history with no explicit locale). Stamped `nl`, its undo would have routed to `localeContent.nl` (failing to revert the base array AND injecting a non-text array into the text-only overlay, which then persists via export). Fixed: base-write entries now default to `state.localeConfig?.defaultLocale ?? 'en'`; the overlay text branch still sets `locale` explicitly, so only the implicit base default changed. Latent-only today (no toggle), but the **Phase-4 precondition is now discharged**. Regression test added: under `activeLocale='nl'`, a collection object-array edit writes base, leaves `localeContent.nl` untouched, stamps the entry `'en'`, and undo reverts the base array.

### Full-map export assertion (contract i)
`export()` emits `state.localeContent` inside `finalContent` only when non-empty → legacy export byte-identical (no key). `assertFullLocaleExport(storeMap, emitted)` (dev-only) `console.error`s if any store locale with authored overlays is missing/empty in the emitted map (guards future filtered-map refactors; can't fire today — emitted IS the store map by reference). Test mirrors Phase-2 test(f)'s `declaredLocalesFullyPresent(config, exported.localeContent)` → true. `save()` sends `localeConfig` top-level, OMITTED when falsy (contract ii: never null); test asserts a legacy save has no `localeConfig` key and no `finalContent.localeContent`.

### Deviations
- `storeTypes.ts` does NOT exist. Plan named `src/hooks/editStore/storeTypes.ts`; store types actually live in `src/types/store/state.ts` (fields) + `src/types/store/actions.ts` (action). Edited those as the plan's clear intent (adding the fields it explicitly calls for). No unrelated files touched.
- Project-global overlay (not per-page blobs) — see Data-model resolution. Follows committed Phase 2 test(f); avoids `pageHelpers.ts`/`pageActions.ts` (out of scope).
- `uiActions.ts` was added to Phase 3a scope by coordinator approval (mid-phase) to complete locale-aware undo/redo — no longer a deferral.
- `partialize` persists `activeLocale` (per step 7) but `loadFromDraft` re-derives it to `defaultLocale` on load — a persisted non-default editing locale never survives reload (matches "init = defaultLocale"). Conservative; documented.

### Verification
- `npx tsc --noEmit` — clean.
- `npx vitest run src/hooks/editStore/i18nStoreState.test.ts` — 20 passed (incl. the 4 locale undo/redo tests + the Fix-1 collection-undo test: NL two-edit undo restores previous overlay value + EN base intact + redo re-applies to overlay; first-NL-edit undo → base fallback; history survives a locale switch, EN-after-switchback undoes against base; collection object-array edit under NL undoes against base with overlay untouched).
- `npx vitest run .../sectionSwap.test.ts` — green (non-locale undo/redo regression intact after the uiActions change).
- `npm run test:run` — 131 passed | 1 skipped (132) files; 2056 passed | 3 skipped (2059) tests (was 2036 in Phase 2; +20). Phase 2's `saveDraft/i18n.test.ts` green; no regressions.
- Manual reasoning: legacy project loads with `localeConfig=null`, `activeLocale='en'`, `localeContent={}`. Every write takes the base branch identical to today; `export()` emits no `localeContent`; `save()` omits `localeConfig`. Nothing reads `activeLocale` for display (3b pending) → zero behavior/storage diff.

### Contract notes for Phase 3b
- Readers 3b must thread (resolve overlay FIRST, then extract): the plan's known set (`useUniversalElements.ts`, `useTemplateBlock.ts`, shared blocks LeadForm/FollowStrip/StoreBadges, `NavigationEditor.tsx`, `HeaderLogo.tsx`, `FormPlacementRenderer.tsx`, `InlineTextEditorV2.tsx`, `collectionHelpers.ts` read side). Add the `collectionHelpers` materialize READ path — card `name`/`oneLiner` should resolve records through the overlay before building cards.
- Dotted-key overlays: non-default-locale edits of a V2 collection FIELD store under the verbatim dotted key (e.g. `localeContent.nl[sectionId]["features.f1.visual"]`). `resolveLocaleElements` (Phase 1) merges per top-level elementKey and will NOT patch a collection item from a dotted key — 3b must special-case dotted overlay keys (or accept Phase-1's limitation: only whole top-level elementKeys localize).
- Empty-overlay reference-churn guard (Phase 1 carry-forward): writers NEVER persist empty section maps — `writeOverlayText` only creates a `localeContent[locale][sectionId]` node when a value is actually written; `export()`/`save()` only emit `localeContent` when non-empty. So `resolveLocaleElements` keeps its no-op fast path (returns `base` by identity) for untranslated sections — 3b's `useTemplateBlock` memo must key on a NARROW `localeContent?.[activeLocale]?.[sectionId]` selector (+ `activeLocale`), never the whole map, to preserve the perf-01/02 win.
- Regen in NL is fully blocked (guards); Phase 4 adds the UI disable.
- Undo/redo is locale-aware and complete (no follow-up needed): the restore routing lives in `uiActions.undo`/`redo`, keyed on `entry.locale`.

## Phase 3b — Editor read-site threading

**Files changed**
- `src/modules/templates/shared/useTemplateBlock.ts` — THREADED (central block funnel).
- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx` — THREADED (`form_headline`).
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.tsx` — THREADED (`strip_heading`).
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.tsx` — THREADED (`badge_label`).
- `src/hooks/editStore/collectionHelpers.ts` — READ-side verdict comment only (LEAVE, documented limitation).
- `src/components/DebugPanel.tsx` — dev-only locale switch (flag-gated, throwaway; Phase-4 removal).

No other files edited. Named readers that turned out NOT to need a code change are recorded below with their LEAVE verdict + reason.

### DELIVERABLE — full read-site enumeration

Grep of `state.content` / `s.content` / `.elements[` / `content[sectionId]` across `src/app/edit/`, `src/hooks/`, `src/modules/generatedLanding/`, `src/components/`, `src/modules/templates/shared/`.

THREAD = locale-relevant text reader routed through the shared resolver keyed on `activeLocale`. LEAVE = structural / media / metadata / prop-driven reader (reason given).

| # | Read site | Verdict | Reason |
|---|-----------|---------|--------|
| 1 | `src/modules/templates/shared/useTemplateBlock.ts:41` (`s.content[sectionId]`) | THREAD | The ONE block-resolution funnel; every per-template block hook (useMeridianBlock/useVestriaBlock/useTechPremiumBlock/useServiceBlock/useLexBlock/useLumenBlock/useGranthBlock) delegates here — threading it localizes ALL template blocks' text. |
| 2 | `sharedBlocks/LeadForm/LeadForm.tsx:23` | THREAD | Reads editable heading `form_headline` directly from `content[sectionId]` (does NOT use useTemplateBlock). `form_id`/`form.fields`/submit text live in the forms slice = locale-shared -> left. |
| 3 | `sharedBlocks/FollowStrip/FollowStrip.tsx:24` | THREAD | Editable `strip_heading`. `links_json` = social URL structure -> left. |
| 4 | `sharedBlocks/StoreBadges/StoreBadges.tsx:23` | THREAD | Editable `badge_label`. `appstore_url`/`playstore_url` = media/structure -> left. |
| 5 | `src/hooks/useUniversalElements.ts:33,99,132,...` | LEAVE | Element-CRUD / retrieval / search / validation hook. Not the canvas text-render path (that is useTemplateBlock). Its ops operate on base element STRUCTURE by key; localizing here would corrupt structural operations and the (sectionId,key) address space. |
| 6 | `src/hooks/editStore/collectionHelpers.ts` (`recordOf`/`cardFromEntry`) | LEAVE (documented) | Materialized catalog/related/home-teaser cards. Per-collection-ITEM text (`name`/`oneLiner`/`cardSpec`) sits inside an `items[]`/`related[]` object array; `resolveLocaleElements` merges per whole TOP-LEVEL elementKey and cannot patch an array item from a dotted overlay key (Phase-1 limitation). Cards render default-locale text in every locale in v1. Verdict comment added in-file; no read change. |
| 7 | `src/components/navigation/NavigationEditor.tsx:28,65` (`navigationConfig.items`) | LEAVE | Nav labels live in the `navigationConfig` store slice, NOT in the sectionId-keyed content overlay. 3a created NO per-locale write path for nav labels (`updateNavItem` not branched), so there is nothing to resolve. Nav labels are locale-shared in v1 (documented limitation). |
| 8 | `src/components/ui/HeaderLogo.tsx:18` (`globalSettings.logoUrl`) | LEAVE | Reads the logo IMAGE url = media = locale-shared (D1). No text. |
| 9 | `src/components/forms/FormPlacementRenderer.tsx:39,62` | LEAVE | Scans `element.metadata.buttonConfig` (button->form bindings) for placement — reads METADATA, not localizable text. Form field/label text comes from the forms slice (not overlaid in v1). Structural. |
| 10 | `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx` | LEAVE | Fully PROP-driven (`content` prop). Does not read `state.content`; its caller (useTemplateBlock-backed block) passes overlay-resolved text, and its `onContentChange`->`updateElementContent` is locale-branched (3a). Flipping `activeLocale` re-extracts upstream -> new `content` prop via its existing sync effect. |
| 11 | `src/modules/generatedLanding/LandingPageRenderer.tsx:300,330,341` | LEAVE | Reads section data for the background-assignment pass, layout resolution, and a section-level `data` spread. Text extraction is delegated to blocks via useTemplateBlock (header comment confirms blocks own the store-read/extract). Section-level/structural reader. |
| 12 | `src/hooks/useElementCRUD.ts` (many `section.elements[key]`) | LEAVE | Element structural CRUD (position/props/move/duplicate). Same class as #5. |
| 13 | `src/components/EditProvider.tsx:155-156` (`...elements.center_hero_image`) | LEAVE | Reads the hero IMAGE for LCP preload = media. |
| 14 | `src/components/toolbars/ButtonConfigurationModal.tsx:38,175,303,343` | LEAVE | Button-config editing (metadata/config), not localizable body text. |
| 15 | `src/components/DebugPanel.tsx:191` (`storeState.content[key].elements`) | LEAVE | Debug element-count readout (structural). (Also the dev-switch host — see below.) |
| 16 | `src/app/edit/[token]/components/ui/ElementToggleModal.tsx:128` (`v2.elements[key]`) | LEAVE | Reads the layout-element SCHEMA defaults, not store content. |
| 17 | `src/hooks/useReviewState.ts` (JSDoc reference) | LEAVE | Comment/JSDoc only; not a live content read for display. |

Net THREAD set = 4 code sites (#1–#4); #1 covers every template block. All named-from-review readers appear (useUniversalElements #5, useTemplateBlock #1, shared blocks #2–#4, NavigationEditor #7, HeaderLogo #8, FormPlacementRenderer #9, InlineTextEditorV2 #10, collectionHelpers #6). Post-inspection verdicts (several LEAVE) justified above.

### Threading approach (parity-ordering invariant, D1)
Every threaded site resolves overlay FIRST via the SHARED helper, THEN extracts — never a hand-rolled merge:
- useTemplateBlock wraps the single section into `{ [sectionId]: sectionContent }` + `{ [activeLocale]: { [sectionId]: sectionOverlay } }`, calls `resolveLocaleElements(...)`, pulls `[sectionId]`, and only THEN runs the existing `extractLayoutContent`. Same helper + same order the Phase-5 published export will use.
- LeadForm / FollowStrip / StoreBadges use `getEffectiveElementValue(base, overlay, locale, sectionId, key)` for their single editable heading (`form_headline` / `strip_heading` / `badge_label`).

### Perf guard (perf-01/02 — reviewer will check subscription width)
useTemplateBlock adds exactly TWO narrow selectors:
- `useEditStore((s) => s.activeLocale)` — a string primitive.
- `useEditStore((s) => s.localeContent?.[s.activeLocale]?.[sectionId])` — ONLY this section's overlay slice, NOT the whole `localeContent` map, NOT the whole store.

Both added to the `blockContent` memo deps (alongside the pre-existing `sectionContent` ref). For a legacy store `activeLocale==='en'` and `localeContent==={}`, so the second selector returns `undefined` every render (referentially stable), memo deps don't change, and inside the memo the `sectionOverlay && sectionContent` guard is false -> `resolvedSection === sectionContent` (same reference, helper never invoked) -> extract runs on identical input. Result: ZERO extra renders, ZERO ref churn, byte-identical output vs pre-3b. Shared blocks apply the same narrow-selector pattern. Preserves the perf-01/02 win (memo on stable slice refs, no whole-store subscription).

### Dotted-collection-key handling decision
ACCEPTED Phase-1's whole-top-level-key limitation (did NOT special-case dotted keys). A non-default-locale edit of a V2 collection field is stored under a verbatim dotted key (e.g. `localeContent.nl[sectionId]["features.f1.visual"]`); `resolveLocaleElements` merges it as a NEW top-level element key rather than patching the `features` array item, so `extractLayoutContent` (reads `features`) does not pick it up. Per-item collection text is NOT localized in v1 (whole top-level string/string[] elementKeys ARE). Conservative, consistent-with-Phase-1 choice; collectionHelpers comment (#6) documents the same for materialized cards. Fixing needs an overlay-type extension (later phase) — out of 3b scope.

### Dev-only locale switch (named)
Location: `src/components/DebugPanel.tsx` — a flag-gated `DevLocaleSwitch` block + subcomponent, rendered only when `EDITOR_DEBUG` (`NEXT_PUBLIC_DEBUG_EDITOR==='true'`), so dead-code-eliminated in prod. DebugPanel is the existing editor debug surface the Files-touched entry anticipates ("a guarded block in an existing editor debug surface"). Renders one pill per declared locale (or `en`/`nl` for a legacy back-compat check) and calls `setActiveLocale`. CLEARLY marked for Phase-4 removal (real `LanguageToggle` replaces it). Re-renders with the store via DebugPanel's existing `store.subscribe` metrics loop.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — Test Files 131 passed | 1 skipped (132); Tests 2056 passed | 3 skipped (2059) — IDENTICAL count to post-3a; zero regressions. No new test file added: the only new logic is the shared resolver, whose merge/fallback/no-op-identity semantics are already fully covered by Phase-1's `localeContent.test.ts` (including the single-section overlay shape + base-fallback the threaded sites rely on).
- Manual (reasoned + partial): back-compat proven by construction — legacy store (`activeLocale='en'`, `localeContent={}`, `localeConfig=null`) makes both narrow selectors return `undefined`, the resolve guard short-circuits to the base reference, extract runs unchanged -> zero visual/behavior diff (matches the null full-suite delta). The dev switch (DebugPanel, `NEXT_PUBLIC_DEBUG_EDITOR=true`) is wired so a tester can flip en<->nl and confirm template blocks (#1) + the three shared blocks (#2–#4) show overlay copy with base fallback, flip back -> EN intact; legacy project -> no diff. Full interactive click-through of a seeded 2-locale project needs the Phase-4 toggle/locale-config UI to declare locales through the app (no acceptance UI in 3b); the resolve logic itself is exercised by the Phase-1 unit tests.

### Deviations
- Several named-set readers -> LEAVE (not THREAD) after inspection: NavigationEditor (#7, nav labels in a separate slice with no 3a overlay write path), HeaderLogo (#8, media), FormPlacementRenderer (#9, buttonConfig metadata), InlineTextEditorV2 (#10, prop-driven), useUniversalElements (#5, structural CRUD), collectionHelpers (#6, per-item text unsupported by the overlay shape). Chose the conservative option (leave + document) rather than force-thread a reader whose data is not in the overlay or would corrupt structure. Each enumerated above with reason.
- Dev switch hosted in `DebugPanel.tsx` rather than a standalone new file: a standalone component would be dead code (nothing mounts it) without editing an out-of-scope editor host; the Files-touched entry explicitly permits "a guarded block in an existing editor debug surface," and DebugPanel is that surface. No editor header/layout file (Phase-4 territory) touched.
- No new test file: 3b introduced no new merge logic (uses Phase-1's tested helpers); avoided creating a test file not on the Files-touched list.

### Notes for Phase 4 / 5
- Phase 4 must REMOVE the `DevLocaleSwitch` block in `DebugPanel.tsx` (and its `EDITOR_DEBUG` import if unused) when the real `LanguageToggle` lands.
- Phase 5 export must resolve via the SAME `resolveLocaleElements` at the SAME point (overlay-first, then extract) — parity mirrors useTemplateBlock exactly.
- Known v1 LEAVE gaps to surface to the founder (Phase 4/8 or later): (a) nav labels locale-shared (no overlay path); (b) per-collection-item card text locale-shared (overlay-shape limitation); (c) form field labels + logo/media locale-shared. None are regressions (never localizable) — they bound "what NL mode translates" in v1.

## Phase 4 — Editor language toggle + locale config UI

**Files changed**
- `src/app/edit/[token]/components/editor/LanguageToggle.tsx` (new) — the EN<->NL toggle pills.
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx` (new) — the "Languages" declaration popover.
- `src/app/edit/[token]/components/layout/EditHeader.tsx` — hosts both new components in the header's left cluster.
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` — regen disable on the "Regen Copy" (regenerate-all) button.
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` — regen disable on the element "Regenerate" button.
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx` — regen disable on the AI sparkle (text variations) button.
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — regen disable on the section "Regenerate Content" menu item.
- `src/components/DebugPanel.tsx` — removed the Phase-3b dev-only `DevLocaleSwitch` block + its `EDITOR_DEBUG` import.

### Header host
The editor top bar is `src/app/edit/[token]/components/layout/EditHeader.tsx`. `LanguageToggle` + `LocaleSettings` were added to its left cluster (after `designControls`). `LanguageToggle` is invisible until `isMultiLocale(localeConfig)`; `LocaleSettings` is a small globe "Languages" button always present (the declaration entry point).

### LanguageToggle
- Visible ONLY when `isMultiLocale(localeConfig)`. Renders one pill per `localeConfig.locales` labelled by uppercased code (display-name via a small `LOCALE_DISPLAY_NAMES` map: en->English, nl->Nederlands, ...). Active pill highlighted; default locale's pill title notes "(default)".
- Click -> `setActiveLocale(loc)` (3a action). 3b threaded all readers on `activeLocale`, so every Editable re-points to the clicked locale — ONE toggle, no side-by-side (spec decision 3).
- Uses narrow selectors (`s.localeConfig`, `s.activeLocale`, `s.setActiveLocale`) — no whole-store subscription.

### LocaleSettings ("Languages" popover)
- Globe button + click-outside popover. Lists declared locales (default badged, non-default get Remove) and an "Add a language" grid of `SUPPORTED_LOCALES` minus already-declared minus the default.
- **Writes via `useEditStoreApi().setState((s) => ...)` (immer recipe) + `triggerAutoSave()`** — there is NO `setLocaleConfig` store action, and adding one would touch `contentActions.ts`/`actions.ts` (outside this phase's Files-touched). The direct-setState pattern is already used elsewhere (`PublishedPageClient.tsx`) and the immer middleware supports recipe-style `store.setState`. In-scope decision.
- **First add:** `localeConfig` seeded `{ locales: [existingDefault, added], defaultLocale: existingDefault }`; `existingDefault = cfg?.defaultLocale || activeLocale || 'en'` (legacy single-locale => 'en').
- **Remove:** `confirmDialog` warns that it deletes that locale's translations, then removes it from `locales` AND `delete s.localeContent[code]`. If that drops to <=1 locale, `s.localeConfig = null` and `activeLocale` reset to default; if the removed locale was active (still multi), `activeLocale` reset to default.
- Add doesn't auto-switch `activeLocale` (author declares first, then toggles to translate).

### Default-locale-change decision: LOCKED (v1)
Default is fixed to the original/base language and cannot be changed in the UI (badged "Default", no control). Reason: the flat `content` map IS the default locale's copy (D1); making a different locale the default would require swapping base<->overlay (heavier, error-prone). Conservative + safe for v1; noted in the panel helper text and here.

### Null-config safety (CRITICAL)
- Store field `localeConfig` may be `null` (legacy) or a valid config; it is NEVER left as a single-locale config after a removal — dropping to one locale sets it to `null`.
- `persistenceActions.save()` (line ~367) emits the key only when truthy: `...(state.localeConfig ? { localeConfig } : {})`. So `null`/absent => the payload OMITS the key, never `localeConfig: null` (which the `DraftSave` `.optional()` schema would 400 on). A legacy/single-locale project emits no `localeConfig` on save — consistent with the Phase-2 zero-locale-keys law (still green).

### Regen disable (minimal set, 4 controls)
All disabled when `!!localeConfig && activeLocale !== localeConfig.defaultLocale` (pairs with 3a's store-level regen guard that no-ops + warns):
1. `EditHeaderRightPanel.tsx` — "Regen Copy" (regenerate-all) button: `disabled`, tooltip "Switch to the default language to regenerate."
2. `ElementToolbar.tsx` — element "Regenerate" button: `disabled` + greyed + tooltip; onClick early-returns when disabled.
3. `TextToolbarMVP.tsx` — AI sparkle (text variations): `disabled` + greyed + tooltip.
4. `SectionToolbar.tsx` — "Regenerate Content" advanced-menu item: `disabled` (menu renderer already greys disabled items) + label suffix "(default language only)". (Pre-existing TODO stub, but disabling keeps the surface consistent.)
Keyboard-driven regen in `MainContent.tsx` was left to 3a's store guard (not a button/menu item) to keep the set minimal.

### Unauthored-field affordance: DEFERRED (TODO)
Step 4 (subtle marker on base-fallback fields in a non-default locale) was NOT shipped. It needs per-field overlay-presence checks inside the read/render sites (`InlineTextEditorV2.tsx` / block renderers), which are Phase-3b files outside this phase's Files-touched — implementing it would expand scope. Left a `// TODO(i18n)` in `LanguageToggle.tsx`.

### Dev switch removal
The Phase-3b `DevLocaleSwitch` block, its `{EDITOR_DEBUG && ...}` render site, and the now-unused `import { EDITOR_DEBUG }` were removed from `src/components/DebugPanel.tsx` (replaced by the real toggle). A one-line comment marks where it was.

### Deviations
- **No new store action.** localeConfig writes go through `setState` from the UI rather than a dedicated action, to stay inside Files-touched. Conservative; documented above.
- **"Languages" button is a new header element for single-locale projects.** The plan's regression note says a single-locale project shows "no toggle, no UI diff." The LanguageToggle (pills) honors that (invisible until a 2nd locale is declared) and the editing/canvas/toolbar behavior is byte-identical. But the task's step 2 explicitly requires a header-reachable "Languages" entry point to DECLARE a 2nd locale (acceptance #1 needs it) — unavoidably one new small control. Interpreted "no UI diff" as the editing surface / toggle, added a minimal globe button. Flagged for the founder at the Phase-6 gate.
- **Unauthored-field affordance TODO'd** (see above).

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — Test Files 131 passed | 1 skipped (132); Tests 2056 passed | 3 skipped (2059). Identical to post-3a/3b — zero regressions. No new test file added (Phase 4 is UI wiring over already-tested store/resolver logic; a test file would be outside Files-touched).
- **Manual:** could not drive a real browser in this environment. Verified by code reasoning:
  - (a) 2-locale round-trip: adding a locale sets a 2-locale `localeConfig` (save persists it, line 367); NL text edits go to `state.localeContent` via 3a's locale branch; `export()` emits the overlay inside finalContent; on reload `activeLocale` re-derives to default, `localeConfig` restores, toggle reappears, both overlays present -> both locales survive. Clicking a pill calls 3a's `setActiveLocale`, which 3b's threaded readers observe -> all Editables re-point.
  - (b) single-locale/legacy: `isMultiLocale(null)` false -> no toggle pills; every write takes the base branch; `save()` omits `localeConfig` (line 367) -> no `localeConfig: null`; only new element is the globe button (see deviation).
  - (c) regen disabled on non-default locale: all four controls compute `regenLocaleLocked` from `activeLocale !== localeConfig.defaultLocale`.
  - **Needs a human at the Phase-6 gate:** actual browser click-through (toggle flip visually re-points text, autosave+reload persistence, regen tooltip render, single-locale no-visible-diff eyeball).

## Phase 4 — REVIEW FIX (two blocking data-integrity bugs)

Post-review fix for the localeConfig persistence path. REVISES the Phase-2/D1 merge contract: absent-preserve now has a null/{}-CLEAR counterpart.

**Additional files changed (this fix)**
- `src/lib/validation.ts` — `DraftSaveSchema.localeConfig`: `.optional()` -> `.nullable().optional()` (accepts explicit null = clear-signal; absent still preserves).
- `src/app/api/saveDraft/route.ts` — comment-only: documented the clear-contract (undefined=preserve / null=clear / object=replace); the existing `if (localeConfig !== undefined)` guard already assigns null correctly.
- `src/types/store/state.ts` — added `localeEngaged: boolean` to `ContentSlice`; revised the `localeConfig` doc to the clear-contract.
- `src/stores/editStore.ts` — init `localeEngaged: false`; added it to `partialize` (localStorage rehydration path).
- `src/hooks/editStore/persistenceActions.ts` — `loadFromDraft` sets `localeEngaged` from the loaded config/overlay; `save()` emits `localeConfig: null` when falsy-but-engaged (omits when never engaged); `export()` emits `localeContent: {}` when empty-but-engaged (omits when never engaged).
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx` — add/remove recipes now set `s.persistence.isDirty = true` and `s.localeEngaged = true`; header comment updated to the clear-contract.
- `src/app/api/saveDraft/i18n.test.ts` — added route tests (g),(h),(i).
- `src/hooks/editStore/i18nStoreState.test.ts` — added a "Phase-4 engaged flag / clear-contract" block (6 tests: engaged derivation on load, explicit null/{} clear emission, never-engaged omit, export()-empty-engaged, and the isDirty dirty-gate via the debounced triggerAutoSave).

### BLOCKING #1 — config writes never marked the store dirty
`LocaleSettings.addLocale`/`removeLocale` mutated via `setState` but never set `persistence.isDirty`. The LIVE `triggerAutoSave` is the uiActions one (wins by spread order) which debounces via `setTimeout(2000)` and only schedules WHEN `isDirty` — and `loadFromDraft` resets `isDirty=false` on mount. So a declare-then-leave never persisted. FIX: both recipes now set `s.persistence.isDirty = true` (matching how the store's own actions flip it), so the existing `triggerAutoSave()` schedules the save. Store test proves the dirty-gate fires (fake timers advance past the 2s debounce -> `/api/saveDraft` called).

### BLOCKING #2 — locale REMOVAL was unrepresentable ("absent=preserve" can't express "clear")
Dropping to single-locale set `localeConfig=null` + deleted the overlay, but `save()` OMITTED falsy localeConfig and `export()` OMITTED empty localeContent, while the route PRESERVES on absent -> the DB kept the stale config+overlay, which resurrected on reload.

FIX — explicit clear-contract, **absent = preserve (unchanged, legacy-safe); explicit `null`/`{}` = clear**:
- Schema `.nullable().optional()` (accepts the null signal).
- Route: `if (localeConfig !== undefined) updatedContent.localeConfig = localeConfig` already assigns null on null (verified; comment added). localeContent's explicit `{}` rides the `...finalContent` spread and replaces the stored map. loadDraft already returns `localeConfig ?? null` (cleared reads back as null=legacy).
- Store emission decided by the **engaged flag** (below).

### Engaged-flag mechanism (chosen)
`localeEngaged: boolean` on the store. Semantics: the project is "engaged" if it currently has a config/overlay OR ever had one this session.
- Set true in `loadFromDraft` when the loaded payload has a non-null `localeConfig` OR a non-empty `localeContent` (computed right after `applySnapshot`, which restores the overlay).
- Set true in `LocaleSettings.addLocale`/`removeLocale` (same recipe as the isDirty fix).
- Restored via `partialize` on the localStorage rehydration path (no separate derivation needed — the persisted flag rides).
- Emission rule (save()/export()):
  * `localeConfig` truthy -> send it (replace). Falsy + engaged -> send `null` EXPLICITLY (clear). Falsy + never-engaged (pure legacy) -> OMIT (byte-identical).
  * `localeContent` non-empty -> send full map (replace; full-map invariant asserted). Empty + engaged -> send `{}` EXPLICITLY (clear). Empty + never-engaged -> OMIT.
Net: a removed locale's config + overlay are actively cleared in the DB; a legacy project that never touched the locale system still emits ZERO locale keys (Phase-2 zero-locale-keys law intact — the engaged flag is false).

### Multi->multi removal (unbroken)
`removeLocale` on a 3+-locale project keeps the config multi and sends the COMPLETE remaining overlay map (3a full-map invariant), so no surviving locale is wiped. Route test (i) proves nl survives, de is gone.

### Contract revision note
This REVISES the Phase-2/D1 `localeContent`/`localeConfig` merge contract: the original "absent key = preserve; present = replace" now has an explicit clear counterpart — `null` (localeConfig) / `{}` (localeContent) = CLEAR. The route comments, schema comment, and store `state.ts` doc all state this. Absent still means preserve, so every legacy path is unchanged.

### Tests
- Route `i18n.test.ts`: (g) declare->remove->reload clears BOTH config and overlay (no resurrection); (h) nullable schema keeps the zero-locale-keys law for legacy; (i) multi->multi removal preserves the remaining overlays. Phase-2 (a)-(f) all still pass.
- Store `i18nStoreState.test.ts`: engaged derivation on load (config -> true, legacy -> false); clear-emission (engaged+empty sends `null`+`{}`); never-engaged omits both; export() empty-engaged -> `{}`, never-engaged -> omit; dirty-gate (isDirty set -> debounced triggerAutoSave fires with the config).

### Verification (post-fix)
- `npx tsc --noEmit` — clean.
- `npm run test:run` — Test Files 131 passed | 1 skipped (132); Tests 2065 passed | 3 skipped (2068). +9 vs the pre-fix 2056 (3 route + 6 store). Phase-2 (a)-(f) and all prior suites green; zero regressions.
- Still not browser-driven; the Phase-6 human gate should eyeball the declare->translate->remove->reload cycle live.

## Phase 5 — Static export: per-locale docs + hreflang + `switcher.v1.js`

**Files changed:**
- `src/lib/staticExport/htmlGenerator.ts` — head/script multi-locale emission
- `src/lib/staticExport/renderPublishedExport.ts` — per-locale render loop + hreflang URL builder
- `src/lib/staticExport/switcherBehaviors.js` (new) — shared template-agnostic switcher IIFE
- `scripts/buildAssets.js` — added `switcherBehaviors.js` -> `switcher.v1.js` to the file map
- `src/lib/staticExport/__tests__/i18nStaticExport.test.ts` (new) — Phase 5 tests

### htmlGenerator.ts — head-tag emission logic (multi vs single)
`StaticHTMLOptions` gained 3 OPTIONAL fields: `locale`, `localeConfig`, `localeAlternates`.
`buildHTMLDocument` computes `multiLocale = localeConfig && locales.length > 1`.
- `<html lang="{escapeHTML(locale || 'en')}">` — replaces the hardcoded `"en"`. Single-locale (no `locale`) resolves to `en` -> byte-identical.
- MULTI-LOCALE only: (a) self-canonical is the EXISTING `<link rel="canonical">` (its `canonicalPath` is already the locale-prefixed path for non-default docs — so it self-references correctly with no new code); (b) reciprocal `<link rel="alternate" hreflang=...>` for every locale + (c) `x-default` are appended to the canonical line via `hreflangTags` (fed from `localeAlternates`); switcher = inline `<script>window.__lessgoLocales={locales,defaultLocale,current}</script>` (with `<`->unicode-escape guard) + `<script src="{assetBase}/assets/switcher.v1.js" defer>`, appended to the existing lumen script line via `switcherTags`.
- SINGLE-LOCALE (absent/1-locale config): `hreflangTags` and `switcherTags` are BOTH empty and are appended to already-present lines, adding ZERO bytes -> output byte-identical to pre-change (proven by test 3, which asserts `withConfig.html === baseline.html`).
- Injection points are appended to EXISTING interpolations (canonical line, lumen line) precisely so the empty single-locale case introduces no new whitespace/comment bytes.

### renderPublishedExport.ts — locale loop shape + resolve-then-extract
- Input gained `localeConfig?: LocaleConfig | null`. `multiLocale = isMultiLocale(localeConfig)`; `locales`/`defaultLocale` derived. When single/absent, ALL new code is skipped or passes `undefined` locale opts -> default path byte-identical.
- `buildAlternates(barePath)` closure builds the reciprocal set from the SAME `resolveCanonicalURL({slug,canonicalDomain,canonicalPath})` the self-canonical uses (imported into this file). Per-locale path: default -> `barePath`; non-default -> `/{loc}` or `/{loc}{barePath}`. Returns `[...locales, x-default->default]`. That is how per-locale absolute URLs are derived — single source, so self-canonical and self-alternate agree.
- The EXISTING default-locale root + subpage `generateStaticHTML` calls were left structurally intact; they only additionally pass `locale/localeConfig/localeAlternates` guarded by `multiLocale ? ... : undefined` (default root uses `buildAlternates('/')`, default subpage `buildAlternates(path)`).
- NEW block (runs only when `multiLocale`): outer loop over non-default locales x inner loop over pages (root + subpages). For each locale it FIRST resolves the overlay — `resolveLocaleElements(contentData, contentData.localeContent, loc)` for root and `resolveLocaleElements(subFlat, subFlat.localeContent, loc)` for each subpage — THEN feeds the resolved content into `buildPageMetadata` (extract) and `generateStaticHTML` (render). This is the D1 parity-ordering invariant: same helper + same resolve->extract order as the editor read path. Docs land at `/{loc}` (pageName `loc`) and `/{loc}{bare}` (pageName `loc/sub`), share the primary's `version`, and are pushed into `allBlobs` + `extraRoutes[path]`. Each doc is wrapped in try/catch (a failed locale doc can't block the rest).
- Overlay source (CORRECTED after review): overlays are PROJECT-GLOBAL. The entire `localeContent` map (root AND subpage sections) lives in the ROOT `finalContent.localeContent`, keyed by globally-unique sectionId; subpage `ProjectPage.content` carries NO `localeContent` key. So BOTH the root branch AND the subpage branch feed the SAME `contentData.localeContent` map to `resolveLocaleElements`. Because sectionIds are globally unique and `subFlat` only holds that subpage's section keys, only that subpage's own sections get overlaid (no cross-page contamination). If a project has no overlay for a locale, `resolveLocaleElements` returns base -> that locale renders default copy at its path (acceptable; not an error).
  - REVIEW FIX (blocking bug): the subpage branch originally read `resolveLocaleElements(subFlat, subFlat.localeContent, loc)` where `subFlat.localeContent` is always `undefined` -> non-default SUBPAGE docs silently rendered English. Corrected to `resolveLocaleElements(subFlat, contentData.localeContent, loc)`.
- CONSERVATIVE CALL (logged): CTA form-page detection for locale docs uses a locale-scoped `locPageInputs` (localized content, locale-PREFIXED paths) so a primary CTA on a locale page targets the SAME locale's form page, not the default-locale one.

### switcher IIFE (switcherBehaviors.js) — boot/redirect/guard
- Idempotent boot guard `window.__lessgoSwitcherBooted`. Reads `window.__lessgoLocales`; no-op if `<2` locales.
- Boot resolution order: `localStorage['lessgo.lang']` -> `geo-country` cookie (lowercased, accepted only if it names a declared locale — imperfect ISO-country heuristic by design) -> `navigator.language` (first subtag). If the resolved locale is in the list AND != `current`, `location.replace` to the sibling path (`segAt` strips a leading non-default-locale segment to get the bare path, `buildPath` re-prefixes; query+hash preserved).
- Redirect-loop guard: `sessionStorage['lessgo.langRedirected']` set BEFORE the redirect (once per session); plus the `resolved === current` short-circuit means the redirected doc will not bounce (target doc's `current` equals the resolved locale). Only ever redirects to a locale in the embedded list (page guaranteed to exist).
- Renders its OWN fixed-position pill (bottom-right, inline styles, one button/locale) — template-agnostic, no template markup dependency (D2). Click persists `localStorage['lessgo.lang']` + `location.href` navigates to that locale's path. Crawler-safe because the same doc ships reciprocal hreflang + self-canonical (D3).
- CAVEAT: prefix swap assumes the locale segment is the FIRST path segment (true for custom-domain / `{slug}.lessgo.site` served blobs — the canonical published surface). On the `/p/{slug}` SSR-fallback path the segment is not first; not handled in v1 (note for the Phase-6 human gate, which tests a real publish).

### buildAssets.js
Added `{ src: 'switcherBehaviors.js', out: 'switcher.v1.js' }` (NEW filename per the immutable-asset versioning contract; never mutated an existing asset). Verified `public/assets/switcher.v1.js` emits (2.12 KB minified).

### extraRoutes shape — PHASE 6 MUST HONOR
Per-locale entries added to `extraRoutes` use the SAME shape as subpage entries: key = the served path string with leading slash, value = blob URL. Concretely:
- default locale: `/` (primary, NOT in extraRoutes — it is the version pointer) and `/{subpage}` (existing).
- non-default locale root: key `"/{loc}"` (e.g. `"/nl"`).
- non-default locale subpage: key `"/{loc}/{subpath}"` (e.g. `"/nl/about"`).
All also appear in `allBlobs` (`{path, blobKey, blobUrl, sizeBytes}`) inside the version metadata. Phase 6's `atomicPublishWithRetry` writes `route:{domain}:{path}` keys straight from `extraRoutes` exactly as it does for subpages — NO new key shape. Phase 6 must (a) pass `localeConfig` (read from project content) into `renderPublishedExport`, and (b) add the reserved-path collision guard so a subpage slug cannot equal a declared locale code (a `/nl` locale doc vs a `nl` subpage would collide on the same KV key).

### Review fix + added test (post-review)
- BLOCKING BUG fixed: subpage locale docs read the overlay from the wrong source (`subFlat.localeContent`, always undefined) so translated subpages published in English. One-line fix: feed the project-global root map — `resolveLocaleElements(subFlat, contentData.localeContent, loc)`.
- NEW loop-level test `src/lib/staticExport/__tests__/renderPublishedExportI18n.test.ts`: drives `renderPublishedExport` itself (mocking the blobUploader/prisma/blob/getPublishedGoal boundaries, real `generateStaticHTML`) with a root+subpage, 2-locale project whose nl overlay carries BOTH a root and a subpage section in the single root `localeContent` map. Asserts `/nl` renders the root overlay, `/nl/about` renders the SUBPAGE overlay (the previously-broken path), `/` and `/about` stay English, and `extraRoutes` = `{/about, /nl, /nl/about}`.

### Verification
- `npx tsc --noEmit` — clean.
- `node scripts/buildAssets.js` — emits `switcher.v1.js` (2.12 KB); all other assets unchanged.
- `npm run build` — FULL build ran green earlier (buildPublishedCSS + buildAssets + next build all completed; published CSS unaffected). Not re-run after the fix (no buildAssets/asset change; only renderPublishedExport.ts logic + a test).
- `npm run test:run` — Test Files 133 passed | 1 skipped (134); Tests 2069 passed | 3 skipped (2072). +4 vs pre-Phase-5 2065 (3 generateStaticHTML tests + 1 loop-level test). Includes single-locale byte-identical snapshot, hreflang reciprocity, resolve-before-render, and the multi-page subpage-overlay loop test; all prior suites green, zero regressions.
- NOT browser-driven: live switcher boot/redirect/pill + geo default are exercised at the Phase-6 human gate (real publish of a 2-locale project).
