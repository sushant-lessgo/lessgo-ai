# scale-03 — images at generation

Source: scalePlan §3 step 10, §4 #27, gap list. Depends: scale-01 (Brief for category/palette; no router needed). Feature-flagged.

## Goal
Pages reveal with real images, not gray boxes. The machinery exists and is orphaned — this is a wiring job.

## Scope IN
1. **Wire `src/lib/generation/fetchImages.ts`** (`fetchPexelsImagesParallel` + palette-scored `pickBestImage`) into the generation fan-out — called after palette is known (template/look picked pre-strategy, §3 step 6), per page, parallel with or after copy.
2. **Re-key `src/lib/generation/imageSlots.ts`** from legacy layout names to current template block layout names (meridian/vestria first — pilot scope; hearth/lex/surge next).
3. Slot query = category + slot modifier + style (existing logic); score by palette mode/temperature (existing).
4. **T2 placeholders** (§8 timing tiers): slots whose asset the user promised ("my photos") render labeled placeholder, NOT stock — stock only for generic/illustrative slots. Slot map marks `stockable: boolean`.
5. Editor image toolbar (exists, live) remains the override path — generated images are defaults, user swaps freely.
6. `IMAGES_AT_BIRTH` env/flag: off = today's behavior (pilot isolation, scalePlan §9).

## Scope OUT
Brand-kit extraction, user uploads in wizard, Insta import (P5) · new image providers.

## Acceptance
Flag on: full generation for a saas + a manufacturer fixture produces pages where every stockable slot has a palette-scored image; promised-asset slots show placeholders; generation time increase < ~10s/page (parallel fetch); flag off: byte-identical behavior. Unit test: `pickBestImage` deterministic for fixed candidate fixture.

## Open questions
1. Pexels rate limits at fan-out scale — cache per (query, palette) in KV? (coder measures first)
