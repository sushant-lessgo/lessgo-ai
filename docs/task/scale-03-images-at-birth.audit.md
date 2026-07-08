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
