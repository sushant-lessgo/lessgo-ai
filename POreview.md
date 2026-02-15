
# PO Review — Image-Background Compatibility

## Decision

**Ship now: Options 1 + 2.** Smarter fetch + CSS safety net. ~60 lines. Zero cost, zero latency, zero risk.

**Phase 2: Option 3.** Sharp tint for editor-selected images. 5 lines on existing pipeline.

**Kill for now: Options 4, 5, 6.** Revisit only if Phase 1+2 results are unacceptable after testing.

**Phase 3 (if needed): Option 7 as OPTIONAL choice** — not default. See below.

---

## Reasoning

### Why 1 + 2 is enough to ship

Users can change images in editor. Generation doesn't need perfect harmony — it needs "not jarring." Smarter queries + over-fetch scoring eliminates the worst mismatches (bright white office photo on midnight-slate hero). CSS treatment catches the rest with subtle correction. 80% solution at near-zero effort.

The remaining 20% is users who care deeply about image-palette harmony. Those users will replace the stock photo anyway — they have their own product screenshots, team photos, brand imagery. Stock images are a starting point, not the final answer.

### Why kill duotone (Option 4) as default

SaaS founders are our audience. They want their page to look like THEIR brand, not a design template with a filter. Duotone is a strong aesthetic choice — great for Linear and Stripe who chose it deliberately. Forcing it on every generated page makes all pages look the same.

If we offer it, it should be an editor toggle per image — "Apply color treatment" → options include duotone, tint, none. Not now.

### Why kill curated library (Option 5)

Two founders generating pages for invoicing SaaS and invoicing SaaS get the same hero image from the mood-matched library. Feels template-y. Defeats the "AI-generated, unique to you" promise.

Pexels with smarter queries gives category-relevant images. A curated library gives mood-relevant but category-blind images. Category relevance > mood matching for user perception of quality.

### Why kill AI images (Option 6)

- $0.20/page is acceptable at small scale but it's a variable cost that grows linearly
- Quality variance — DALL-E/Flux produce great results 70% of the time, uncanny valley 30%
- +2-4s latency during the save step — user just finished co-designing, momentum is high, don't add wait time
- Revisit when quality is >95% reliable and cost drops

### Why Option 7 is interesting but only as a choice

Abstract visuals (mesh gradients, geometric SVG, blobs) FROM palette colors = perfect harmony by definition. Many top SaaS sites use this (Vercel, Linear, Arc). It's modern.

But making it the DEFAULT removes the "real" feel of stock photography. Users expecting a landing page with product-relevant imagery get abstract shapes instead.

**Right approach**: Offer as a choice in the editor image toolbar — "Stock photo" vs "Abstract visual." Abstract generates client-side from palette values, zero latency, zero cost. Stock photo uses Pexels with smart scoring.

Not in scope for this phase. Worth building when editor image toolbar gets a refresh.

---

## Answers to 5 Questions

**1. Phase 1 sufficient to ship?**
Yes. Users can replace images in editor. Generation needs "not jarring," not "perfect harmony."

**2. Duotone on-brand for SaaS founders?**
No as default. Too opinionated. Consider as optional editor treatment later.

**3. AI images — acceptable cost?**
Not justified. Quality variance makes it unreliable. Revisit when quality improves.

**4. Abstract hero visuals — too generic?**
As default, yes. As an editor option alongside stock photos, no — it's a legitimate modern choice.

**5. "Auto color match" toggle per image?**
Yes, but Phase 2. Simple toggle in image toolbar that applies CSS treatment from Option 2. Low effort when Option 2 CSS utility already exists.

---

## Implementation Direction (Options 1 + 2)

### Option 1: Smarter Fetching

File: `src/lib/generation/fetchImages.ts` + `src/lib/generation/pexelsApi.ts`

**Query enhancement:**
- Current: `"Invoicing Accounting"` (category only)
- New: append vibe-aware modifiers
  - Dark Tech → `"dark moody technology"`
  - Light Trust → `"bright clean professional"`
  - Warm Friendly → `"warm vibrant people"`
  - Bold Energy → `"colorful dynamic bold"`
  - Calm Minimal → `"minimal clean white"`

**Over-fetch + score:**
- Fetch `per_page: 8` instead of 1 (single API call, same cost)
- After user picks palette, score all 8 by color distance between `photo.avg_color` and palette primary hue
- Pick lowest distance
- Color distance: simple HSL hue difference is sufficient, no need for CIEDE2000

**Timing:**
- Pexels fetch fires on mount (unchanged)
- Results stored in ref/array (not just first)
- After palette choice known, score + pick best
- If palette choice happens before Pexels returns (unlikely but possible), store palette choice, score when results arrive

### Option 2: CSS Color Treatment

File: new utility `src/lib/generation/imageColorTreatment.ts` (or inline)

```ts
function getImageTreatment(paletteMode: 'dark' | 'light', temperature: 'cool' | 'neutral' | 'warm'): string {
  if (paletteMode === 'dark') return 'brightness(0.85) saturate(0.9)';
  if (temperature === 'warm') return 'sepia(0.06) saturate(1.05)';
  if (temperature === 'cool') return 'saturate(0.95) brightness(1.02)';
  return 'none';
}
```

Apply as `style={{ filter }}` on image containers in renderers. Subtle enough to not look filtered, enough to pull image toward palette temperature.

Applied in: `LandingPageRenderer`, `LandingPagePublishedRenderer`, `EditablePageRenderer` — wherever `<img>` or image containers render.

### Verify

1. Generate with Dark Tech vibe → hero image is dark/moody, not bright white
2. Generate with Light Trust → images feel clean/professional
3. CSS treatment visually subtle — toggle on/off to verify it's helping not hurting
4. No latency increase — Pexels returns 8 in same time as 1
5. Score function picks sensible "closest" image (log scoring to console for debugging)
