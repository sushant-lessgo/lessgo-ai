ImageFirst (Hero_v7) - Design Review 
                                                                                                                                                                              VERDICT: ⚠️ NEEDS WORK                                                                                                                                                                                                                                                                                                                                 
  ---                                                                                                                                                                         Elements rendered:                                                                                                                                                        
  - ✅ hero_image (top, centered, with shadow)
  - ✅ badge_text
  - ✅ headline (centered)
  - ✅ subheadline
  - ✅ primary CTA + secondary CTA
  - ✅ trust_items
  - ✅ supporting_text
  - ✅ social proof row

  ---
  Strengths:
  - Image-first creates immediate visual hook
  - Image shadow/reflection treatment looks good
  - Center alignment is consistent
  - Headline is good length (2 lines)

  ---
  Issues:

  1. [Critical] Element order is wrong

  1. Current flow:
  [Image]
  [Badge]
  [Headline]
  [Subheadline]
  [CTAs]
  [Trust items]        ← odd position
  [Supporting text]    ← should be BEFORE CTAs
  [Social proof]

  1. Expected flow:
  [Image]
  [Badge]
  [Headline]
  [Subheadline]
  [Supporting text]    ← context before action
  [CTAs]
  [Trust items]        ← reinforcement after CTA
  [Social proof]

  1. → Fix: Move supporting_text above CTAs
  2. [Major] Transition from image to copy is weak
    - Large image → tiny badge feels abrupt
    - No visual bridge between image and text content
  → Consider: reduce gap OR increase badge visual weight
  3. [Minor] Image dominates viewport
    - Copy likely pushed below fold on laptops
    - Acceptable for "image-first" intent, but note the tradeoff
  4. [Minor] Social proof row dense
    - Same issue as CenterStacked
    - Avatars + count + stars + reviews all inline

  ---
  Priority Fixes:

  1. Reorder elements: supporting_text before CTAs
  2. Tighten image-to-badge gap or add visual transition
  3. Consider social proof row spacing
