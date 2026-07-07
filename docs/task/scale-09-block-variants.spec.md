# scale-09 — block variants per section (the variation moat)

Source: scalePlan D18, §10 P4, §4 #20. Depends: scale-07. Demand/priority-scheduled — build when convergence is stable.

## Goal
2–3 copy-compatible blocks per section type; selection = facts filter + template default + editor swap. Variation depth without touching the copy pipeline.

## Scope IN
1. **Block declarations** (D18): each block declares `{ consumes: canonical elements ⊆ engine contract, capacity: {cards: min–max}, requiresAssets?: [photos|logos|…] }`. A block needing content outside the contract = different section type, rejected at review.
2. **Eligibility filter** at assembly: `capacity fits strategy cardCount ∧ asset needs met (T2 booleans)`. No AI, no random.
3. **`defaultBlock` per (template, sectionType)** in registration (scale-01 registry) — today's implicit 1:1 maps (`selectBlocks.ts`/`selectUIBlocks.ts`) become explicit declarations.
4. **Fix surge testimonials `Math.random()`** (`selectUIBlocks.ts:34`) → declared default + swap. (Cheap; can be cherry-picked earlier if it annoys.)
5. **Editor swap**: `LayoutChangeModal` (exists) lists eligible blocks only; swap = re-render, zero regen (copy-compatibility guarantees it). Dual-renderer pairs for every new block.
6. **First variants** — pick by demand board / flagship priority, suggested: hero ×2 + features ×2 + testimonials ×2 on meridian and hearth (flagships).
7. Card-count mismatch policy: filter at selection; on manual swap to smaller-capacity block, clamp (drop weakest cards) with editor warning.

## Scope OUT
New section types · AI block-picking (never — D6) · wizard exposure of block choice (never — D18).

## Acceptance
Generate fixture ⇒ default blocks; swap in editor ⇒ identical copy re-rendered, parity green; block with `requiresAssets: photos` absent from eligibility when T2 said no photos, appears after photos uploaded. Conformance test extended: every declared block's consumed elements ⊆ engine contract. Surge testimonial block deterministic across regenerations.

## Open questions
1. Which sections get variants first — confirm hero/features/testimonials or let demand board decide.
