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
