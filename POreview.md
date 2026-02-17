# PO Review — Social Proof Variants (snug-booping-reef.md)

**Status**: Approved with 4 recommendations

## What's correct
- All 4 heroes confirmed identical social proof rendering (CenterStacked, ImageFirst, LeftCopyRightImage, SplitScreen)
- All fields match exactly (`customer_avatars`, `customer_count`, `rating_value`, `rating_count`, `show_customer_avatars`, `show_social_proof`)
- `show_social_proof !== false` gate confirmed in all 4 blocks
- Schema, AvatarEditableComponent, ElementToggleModal — all verified against actual code
- `handleAvatarChange` defined per-hero (identical x4) — correct to consolidate

## Recommendation 1: Add generation-time variant selection (Step 0)

Plan only covers editor switching. Without generation-time selection, every page defaults to `avatar_stack` — defeating the purpose. The CORE value is variety across generated pages; editor switching is secondary.

Dev should add plumbing to write `social_proof_variant` to hero section elements during generation. Selection logic based on asset availability + strategy — PO to provide exact rules separately. But the write path must be in this plan.

## Recommendation 2: Separate published component

Plan says published versions pass `mode="preview"` to the same SocialProofBlock. But published components use `TextPublished`/`AvatarPublished` (server-safe), not `EditableAdaptiveText`/`AvatarEditableComponent` (client). Create `SocialProofBlock.published.tsx` separately — matches codebase pattern and avoids client/server boundary issues.

## Recommendation 3: ElementToggleModal is harder than described

Modal currently renders flat list of Switch toggles (binary on/off via excludedElements). No precedent for:
- Non-switch UI (radio group / card selector)
- Conditional visibility (variant selector only visible when `show_social_proof` is ON)
- String-value elements (everything is currently binary on/off)

This is the hardest part of the plan and gets the least detail. Dev should expect to add branching logic in the render loop to detect `social_proof_variant` and render different UI.

## Recommendation 4: Consolidate handleAvatarChange

Move into SocialProofBlock instead of passing as prop. It's identical across all 4 heroes — just calls `handleContentUpdate('customer_avatars', updatedArray)`. Eliminates 4 duplicate definitions.

## Verified non-issues
- `extractLayoutContent` handles `social_proof_variant` as string element — fallback `|| 'avatar_stack'` covers excluded case
- `renderStars()` duplicated 4x — extraction into shared component is correct
- Step ordering (interfaces should be Step 1-2 not Step 6) — minor, type errors will catch it
