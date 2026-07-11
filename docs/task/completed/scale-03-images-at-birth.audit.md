# scale-03 — images at birth · implementation audit

## Phase 1 — flag, slot map re-key, `stockable`, slot expansion

**Files changed**
- `src/lib/generation/flag.ts` (new)
- `src/lib/generation/imageSlots.ts` (modified)
- `src/lib/generation/imageSlots.test.ts` (new)

### What changed

**`flag.ts` (new):** `isImagesAtBirthEnabled()` → `process.env.NEXT_PUBLIC_IMAGES_AT_BIRTH === 'true'`, mirroring the `src/lib/testimonials/flag.ts` idiom. `NEXT_PUBLIC_` because the only reader is client component `GeneratingStep.tsx`.

**`imageSlots.ts`:**
- `ImageSlot` gains required `stockable: boolean` and optional `collection?: { key; imageField; perItemQueryField? }`. Existing `orientation`/`modifier`/`useSilhouette` kept.
- Deleted all 7 legacy `UIBLOCK_IMAGE_SLOTS` entries (leftCopyRightImage, centerStacked, splitScreen, imageFirst, SplitCard, VisualCTAWithMockup, LetterStyleBlock).
- Re-keyed to the normative Slot inventory: meridian = zero entries (header comment documents the zero-stockable ruling); `VestriaIndustriesGrid` = the one `stockable:true` collection entry; `VestriaTailoredHero`/`VestriaFullBleedHero`/`VestriaAboutStats`/`VestriaCatalogueGrid` documented as `stockable:false` (one-boolean future flip).
- Added `ImageFetchSpec` type (sectionId, elementPath, optional collectionWrite, orientation, queryModifier — no `sectionType`) and `expandImageSlots(content)`: keyed by sectionId, driven by each entry's own `.layout`, skips missing/unknown layouts, stockable-only, one spec per collection item with itemId captured and `perItemQueryField` value appended to the modifier.
- `getImageSlotsForUIBlocks` kept untouched (still called by `fetchImages.ts`; deleted in Phase 2).

**`imageSlots.test.ts` (new):** 6 cases — stockable-only/promised-excluded, collection one-spec-per-item with itemId + title in modifier, sectionId-keyed (no sectionType leak), meridian-layout → empty, unknown/missing layout → empty, empty industries array → empty.

### Key decisions / deviations
- Collection item id read from `item.id`; items without an `id` or non-object items are skipped defensively (conservative — avoids emitting an unwritable spec). Logged here as an in-scope judgment call.
- `perItemQueryField` value only appended when it is a non-empty string on the item; otherwise the base modifier is used trimmed.
- Empty/non-array collection field → no specs (covered by test).
- No changes to `fetchImages.ts` — it only reads `elementKey`/`orientation`/`modifier`/`useSilhouette`, all preserved; the new required `stockable` field and `ImageFetchSpec` do not affect its call to `getImageSlotsForUIBlocks`.

### Verification results
- `npx tsc --noEmit` — clean (no output, exit 0).
- `npm run test:run` — `Test Files 65 passed | 1 skipped (66)`, `Tests 892 passed | 2 skipped (894)`. New `imageSlots.test.ts` (6 tests) green; `fetchImages.ts` still compiles.

### Notes for impl-reviewer
- No file touched outside the three Phase-1 Files-touched entries.
- `getImageSlotsForUIBlocks` and its `fetchImages.ts` caller are intentionally left intact this phase (removed in Phase 2).

## Phase 2 — fetch/query/score refactor + vestria palette profiles

**Files changed**
- `src/lib/generation/fetchImages.ts` — modified
- `src/lib/generation/imageSlots.ts` — modified (deleted `getImageSlotsForUIBlocks` only)
- `src/modules/templates/vestria/imageKeywords.ts` — modified (added `PALETTE_IMAGE_PROFILES`)
- `src/lib/generation/fetchImages.test.ts` — new
- `src/lib/README.md` — modified (doc line fix)

### `src/lib/generation/fetchImages.ts`
- Dropped `vibe?: string` + `VIBE_MODIFIERS`. `buildSearchQuery` is now exported and takes `(categories, modifier, styleKeywords?)`: `first-2-categories + modifier + styleKeywords`, trimmed, capped to 8 words, empty → `'business professional'`.
- Replaced `fetchSingleImage`/`fetchPexelsImagesParallel` with `fetchSingleSpec` + exported `fetchImagesForSpecs(specs, { categories, styleKeywords })` → `Map<`${sectionId}.${elementPath}`, ImageFetchResult>`. Same 100ms stagger, 5s `fetchWithTimeout`, error-swallowing result shape. Result carries `spec.sectionId`/`spec.elementPath` in the legacy-named `sectionType`/`elementKey` fields (keeps `pickBestImage`'s console.log + map keying stable).
- `pickBestImage` + `scoreCandidate` + `hexToHSL` scoring math and signatures unchanged; console.log left as-is.

### `src/lib/generation/imageSlots.ts`
- Deleted `getImageSlotsForUIBlocks` (sole caller was the removed `fetchPexelsImagesParallel`). Phase-1 `expandImageSlots`/`ImageFetchSpec`/`ImageSlot` untouched.

### `src/modules/templates/vestria/imageKeywords.ts`
- Added `PALETTE_IMAGE_PROFILES: Record<VestriaPalette, {mode,temperature,baseColor}>` (verified the 8-member `VestriaPalette` union first). All `mode:'light'` (bone/light pages). Entries chosen:
  - cobalt: light / cool / `#2f5fe0`
  - brass: light / warm / `#b08a3c`
  - emerald: light / cool / `#1f8a5b`
  - safety: light / warm / `#e8632a`
  - claret: light / warm / `#8f2d3f`
  - teal: light / cool / `#14807f`
  - aubergine: light / neutral / `#5b3a5a`
  - indigo: light / cool / `#3a3f8f`
- Temperature judgment calls (plan left open): emerald → cool (green reads cool here); aubergine → neutral (muted plum, avoids forcing warm/cool). `PALETTE_IMAGE_KEYWORDS` kept as the query-phrase source.

### `src/lib/generation/fetchImages.test.ts` (new)
- Deterministic `pickBestImage`: 5-candidate fixture (blue/orange/navy/lgreen/ygreen) engineered for >25pt winner margins. Asserted winning URLs:
  - light/cool base `#2f5fe0` → `https://dl/blue.jpg`
  - light/warm base `#e8632a` → `https://dl/orange.jpg`
  - dark/neutral base `#1a1a2e` → `https://dl/navy.jpg`
  - no-candidates (`[]` and `undefined`) → `imageUrl` passthrough.
- `buildSearchQuery`: composition, 8-word cap, empty→`'business professional'`.
- `fetchImagesForSpecs` (stubbed `fetch`): results keyed `${sectionId}.${elementPath}`; non-ok → `HTTP 503` error, null url; rejection → error, null url, no throw.

### `src/lib/README.md`
- Updated the two image-machinery table rows to name the new surface (`fetchImagesForSpecs`/`pickBestImage`, `expandImageSlots`) instead of the removed helpers.

### Deviations
- Silhouette short-circuit NOT reimplemented in `fetchImagesForSpecs`: `ImageFetchSpec` has no `useSilhouette` field (Phase-1 noted non-blocker; pilot has no silhouette slots). Removed the now-orphaned `SILHOUETTE_PATH` constant with its sole (deleted) caller rather than leave dead code. Conservative + in-scope; logged here.

### Tests
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: `Test Files 66 passed | 1 skipped (67)` · `Tests 902 passed | 2 skipped (904)`.

### Open risks
- None new. `fetchImagesForSpecs` has no unit-level timeout test (5s real timer) — covered indirectly via the rejection test; acceptable per plan ("timeout/error → {imageUrl:null,error}").

## Phase 3 — orchestrator + GeneratingStep wiring

**Files changed**
- `src/lib/generation/imagesAtBirth.ts` (new) — `injectImagesForPage` orchestrator.
- `src/lib/generation/imagesAtBirth.test.ts` (new) — real-assembly mocked-fetch tests.
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — 2 gated injection blocks + 2 import lines.

**imagesAtBirth.ts**
- `injectImagesForPage({content, templateId, paletteId, categories})` mutates `content` IN PLACE (decision 5), no `sectionLayouts` param — `expandImageSlots(content)` drives slot lookup off each entry's `.layout`.
- Pilot allow-list `{meridian, vestria}`; meridian → empty slot map → `{requested:0,filled:0}` return. `styleKeywords`/`profile` resolved via STATIC LEAF import from `@/modules/templates/vestria/imageKeywords` (`PALETTE_IMAGE_KEYWORDS`, `PALETTE_IMAGE_PROFILES`). Unknown paletteId → `FALLBACK_PROFILE {light,neutral,#888888}` (no crash).
- `fetchImagesForSpecs` → per result-with-candidates `pickBestImage(result, profile.mode, profile.temperature, profile.baseColor)` → flat write `content[sectionId].elements[elementPath]`; collection write finds item by `collectionWrite.itemId` in `elements[key]` array, sets `[imageField]` (skip if item vanished). Null/error/no-candidate → nothing written.
- Whole body wrapped in try/catch → logged no-op on any throw. Wall time via `performance.now()` guard (0 if unavailable).
- Reuses `SectionData` from `@/types/core/content` (no parallel type).

**GeneratingStep.tsx — call sites (both `if (isImagesAtBirthEnabled())`)**
- **runFanOut (multi-page vestria):** inserted AFTER `mergePageIntoFinalContent(...)`, BEFORE `await saveFC(fc)`. `content: fc.pages[page.archetypeKey].content` (home + non-home, same object).
  - paletteId resolved to mirror the completion posthog logic (line ~400): `style.stylePalettePicked ? style.paletteId : defaultVestriaPalette`, reading `useProductGenerationStore.getState()`. Quote of the mirrored source: `paletteId: finalStyle.stylePalettePicked ? finalStyle.paletteId : defaultVestriaPalette`.
  - categories resolved from `ob.onboardingData.understanding` matching the strategy call's manufacturer field (line ~665 `categories: isMfr ? understanding.productCategories ?? understanding.categories ?? [] : ...`): here `ob.understanding?.productCategories ?? ob.understanding?.categories ?? []`.
- **runCopyAndSave (single-page meridian + `explicitVestria && !sitemap`):** inserted AFTER `buildFinalContent(...)`/hero-variant apply, BEFORE the `saveDraft` POST. `content: finalContent.content`, `templateId`/`paletteId` = the existing save-time locals (`templateId = explicitVestria ? 'vestria' : PILOT_TEMPLATE`, `paletteId = explicitVestria ? styleState.paletteId : PILOT_PALETTE`).
  - categories computed from closure `isMfr`/`understanding` mirroring the strategy call: `isMfr ? understanding.productCategories ?? understanding.categories ?? [] : understanding.categories ?? []`.
- **posthog:** matched the file's existing idiom `posthog?.capture('event', {...})`. Emitted `posthog?.capture('images_at_birth', { ...stats, page })` — `page: page.archetypeKey` (fan-out) / `page: 'single-page'` (single). Both fully inside the flag-gated block (flag-off path untouched).

**Test approach**
- Real-assembly mis-wire guard: `fc` built via REAL `buildMultiPageSkeleton` + `mergePageIntoFinalContent` (templateId 'vestria') with a fixture `SitemapPage` carrying an `industries` section + 3 generated items; read back THROUGH `fc.pages[key].content[secId].elements.industries[i].image`. (Plan line 147 named `createInitialFinalContent`, which does not exist — used `buildMultiPageSkeleton` per the resume-anchor NIT.)
- (a) non-home industries all filled; (b) home shared-ref visible in both `fc.pages.home.content` and `fc.content`; (c) hero_image/about_image remain absent; (d) meridian deep-equal unchanged + zero fetch calls; (e) fetch rejection → unchanged, no throw.
- Deviation: test (b) originally used paletteId `brass` (warm) and asserted the blue URL; brass scoring correctly picks the neutral-gray candidate (gray hue h=0 counts as warm). Switched (b) to `cobalt` (light/cool) so the blue candidate wins deterministically — the case only exercises the shared-ref invariant, not scoring. Logged here.

**Verification**
- `npx tsc --noEmit`: clean.
- `npm run test:run`: 907 passed | 2 skipped (68 files); new file 5/5.
- `npm run build`: succeeded.

**Open risks:** none new beyond decision-7 accepted risks (Pexels hotlinks, ~6s resume window). Phase 4 is the human QA gate (no code).
