# Image-Background Compatibility — PO Decision Required

## Problem

After implementing v3 palette system (30 curated palettes with cohesive primary/secondary/neutral), stock images from Pexels often clash with section backgrounds. Warm sunset office photo on cold blue palette, bright white-bg stock image on dark moody hero — palette is cohesive but the image breaks it.

## Root Cause

Images fetch **in parallel** with palette selection. When Pexels API fires, we don't know which palette the user will pick. Current pipeline: search by product category → take first result → render with zero color treatment.

```
Mount ──┬── API: copy generation ──────────┐
        │                                   ├── Both done → Save → Editor
        ├── API: Pexels images (1st result) │
        │                                   │
        └── UI: User picks palette ─────────┘
```

---

## Options

### Option 1: Smarter Fetching

Two changes to existing Pexels fetch:
- **Vibe-aware queries**: Vibe IS known at fetch time. `"Invoicing Accounting"` becomes `"Invoicing Accounting dark moody technology"` for Dark Tech vibe.
- **Over-fetch + score**: Fetch 8 results instead of 1. After user picks palette, score all 8 by `avg_color` proximity to palette's primary hue. Pick closest.

| | |
|---|---|
| Effort | ~40 lines in `fetchImages.ts` + `pexelsApi.ts` |
| Cost | Zero — Pexels returns multiple in one call |
| Latency | Zero — already fetches in parallel |
| Quality | Medium-high. Better than random, still stock variance |

### Option 2: CSS Color Treatment at Render

Apply palette-aware CSS filters to image containers:
- Dark palette → `brightness(0.85) saturate(0.9)`
- Warm palette → `sepia(0.08)`
- Cool palette → `hue-rotate(-5deg)`

| | |
|---|---|
| Effort | ~20 lines — one utility function |
| Cost | Zero |
| Latency | Zero |
| Quality | Medium. Subtle shift. Won't fix fundamentally wrong image. |

### Option 3: Sharp Server-Side Tint

During existing Sharp compression step (already in pipeline), add `sharp.tint()` or `sharp.modulate()` to shift hue/saturation toward palette. Image saved already harmonized.

| | |
|---|---|
| Effort | ~5-10 lines in existing `/api/proxy-image/route.ts` |
| Cost | Zero — Sharp already runs |
| Latency | Zero — piggybacks on existing step |
| Quality | Medium-high. Permanent. Only runs on manual image selection, not auto-fetch. |

### Option 4: Duotone Treatment

Convert images to grayscale → map to palette dark/light tones. All images rendered in palette's color space. Used by Linear, Stripe, many 2025-26 SaaS sites.

| | |
|---|---|
| Effort | ~15 lines CSS |
| Cost | Zero |
| Latency | Zero |
| Quality | Very high harmony. Bold design choice — every image monochromatic. Not every brand wants this. |

### Option 5: Pre-Curated Image Library

Curate ~90 atmospheric images by mood cluster (dark-cool, dark-warm, light-cool, light-warm, light-neutral, dark-neutral). Use for hero/CTA where clash is most visible. Pexels still used for feature images inside cards.

```
1. Try Pexels with vibe-aware query (Option 1)
2. Score result against palette
3. If score < threshold → swap with curated mood-matched image
```

| | |
|---|---|
| Effort | Medium — source 90 images + scoring + storage |
| Cost | ~50MB storage |
| Latency | Zero for curated (local assets) |
| Quality | Guaranteed harmony for hero/CTA. Less personalized — dark office photo fits "Midnight Tech" but wrong for kids' learning app. |

### Option 6: AI-Generated Images

After palette pick, call DALL-E/Flux with palette-aware prompt. Perfect color match by instruction.

| | |
|---|---|
| Effort | Medium — new API integration + prompt engineering |
| Cost | ~$0.04-0.08/image, ~$0.20/page |
| Latency | +2-4s per image (during save spinner) |
| Quality | Highest match. But quality varies, uncanny valley risk, ongoing cost. |

### Option 7: Abstract Visuals for Hero/CTA

Generate SVG/CSS abstract visuals (mesh gradients, blobs, geometric) FROM palette colors. Photos only for features inside cards.

| | |
|---|---|
| Effort | Medium — design + build visual generator |
| Cost | Zero runtime |
| Latency | Zero — client-side from palette values |
| Quality | Perfect harmony by definition. Modern aesthetic. Not every audience wants abstract over "real" imagery. |

---

## Comparison

| Option | Harmony | Effort | Risk | Personalization |
|--------|---------|--------|------|-----------------|
| 1. Smarter fetch | Medium-High | Low | None | High (category-relevant) |
| 2. CSS treatment | Medium | Low | None | Unchanged |
| 3. Sharp tint | Medium-High | Very Low | None | Unchanged |
| 4. Duotone | Very High | Low | Polarizing design | Reduced |
| 5. Curated fallback | High | Medium | Repetitive for same-vibe users | Low for hero |
| 6. AI images | Highest | Medium | Cost + quality variance | Medium |
| 7. Abstract visuals | Perfect | Medium | Not for all brands | N/A |

---

## Suggested Phasing

**Phase 1 — ship now:** Options 1 + 2
- Smarter queries + over-fetch 8 + score by palette + CSS safety net
- ~60 lines total. Zero cost. Zero latency.

**Phase 2 — evaluate after Phase 1:** Option 3
- If still off, add Sharp tint during compression. 5 lines on existing pipeline.

**Phase 3 — if needed:** Option 5 or 7
- Curated fallback for hero/CTA if Pexels consistently fails
- Or abstract visuals for a more distinctive palette-native look

**Parking lot:** Options 4 and 6
- Duotone is a brand decision, not a technical fix
- AI images need separate cost/quality evaluation

---

## Questions for PO

1. Phase 1 sufficient to ship, or guaranteed harmony (Phase 3) required for launch?
2. Duotone — on-brand for Lessgo's target audience (SaaS founders)?
3. AI-generated images — acceptable ongoing cost (~$0.20/page)?
4. Abstract hero visuals — too generic for users expecting personalized output?
5. Should editor expose an "auto color match" toggle per image?
