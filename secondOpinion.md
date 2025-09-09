Short version: it’s the absolute-positioned flip faces + transforms creating a stacking context, while the card containers don’t contribute intrinsic height.

Details:

* Each card’s front/back is `absolute inset-0` inside a `relative w-full h-full` flipper. Absolute children don’t add height, so the layout relies entirely on the wrapper height you hardcoded per grid item (`h-[450px]`). Where that height isn’t respected or mismatches (different breakpoints/content counts), the card containers effectively collapse and later blocks (CTA, bottom summary) render “through” the same vertical space—i.e., they overlap. &#x20;
* The flipper sets a 3D transform even at rest (`transformStyle: 'preserve-3d'` + `transform: rotateY(0deg)`), which creates a new stacking context. With no explicit z-index layering for subsequent sections, transformed cards can paint above adjacent content, worsening the visual overlap.&#x20;
* Your own debug shows each grid item is a fixed-height **relative** box (`relative h-[450px] overflow-hidden`), so the only thing preventing bleed is that fixed height. Any variance (extra steps, different viewport, edit-mode controls) exposes the fundamental issue: absolutely positioned card faces and 3D transforms decouple the cards from normal document flow, so the CTA/trust/summary area gets drawn into the same space. &#x20;

That’s why cards, CTAs, and the bottom summary are overlapping.

===

Updated advice

Short answer: no — Claude’s change removed the original overlap, but it introduced clipping, so the cards render only partially.

Why:

1. The grid wrapper around each card is `relative h-[450px] overflow-hidden`. During the 3D flip, the card exceeds its tile’s bounds and gets **clipped by that overflow-hidden**, so you only see part of it.  &#x20;

2. **Perspective is applied on a different ancestor** than the one doing the clipping. The inner flipper rotates in 3D, but the outer grid item (with `overflow-hidden`) is the clipping ancestor, so any rotated content beyond 450px is cut off. (See the flipper using `transformStyle: 'preserve-3d'` and the wrapper with perspective separate from the clipping parent.) &#x20;

3. The file contains **two divergent FlipCard implementations** (one root uses `relative w-full h-[450px]`, another uses `group h-full` and relies on the parent height). This inconsistency can produce partial height inheritance and inconsistent rendering depending on which version is compiled/used. &#x20;

4. Both faces are `absolute inset-0` with their own `overflow-hidden`, and the content areas are scrollable; combined with the fixed 450px tile, longer content appears “cut off,” reinforcing the partial-visibility symptom.&#x20;

So: the overlap problem is addressed, but the current architecture still causes partial visibility due to clipping + perspective ancestry and the duplicate component definitions.


