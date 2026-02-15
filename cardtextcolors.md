# Card & Text Color Bugs — Full UIBlock Audit

## Bug Patterns

| Pattern | Description | Severity |
|---------|-------------|----------|
| **A** | Hardcoded `text-gray-*` on card-internal text (ignores card system colors) | Critical |
| **B** | Hardcoded `bg-white`/`bg-gray-50` card backgrounds (invisible on light, wrong on dark) | Critical |
| **C** | `dynamicTextColors` (Tailwind classes like `text-gray-200`) used as inline CSS `color` values — **invalid CSS** | Critical |
| **D** | Missing card system entirely (no `getCardStyles`/`getPublishedCardStyles`) | High |
| **E** | Hardcoded hex text colors in published files (no theme awareness) | High |

### Systemic Root Cause (Pattern C)

`useLayoutComponent.ts` lines 340-361: `hexToTailwindClass()` converts valid hex colors (`#f9fafb`) to Tailwind class strings (`text-gray-50`), then returns them as `dynamicTextColors`. Any component doing `style={{ color: dynamicTextColors?.body }}` gets invalid CSS like `color: "text-gray-200"`.

---

## CLEAN Components (no action needed)

These properly use `getCardStyles`/`getPublishedCardStyles` for card internals:

- TierCards (edit + published)
- CallToQuotePlan (edit + published)
- IconGrid (edit + published)
- ThreeStepHorizontal (edit + published)
- AccordionSteps.published.tsx
- VerticalTimeline.published.tsx
- Carousel.published.tsx
- StackedPainBullets (edit + published)
- QuoteGrid (edit + published)
- StatBlocks (edit + published)
- StackedWinsList (edit + published)
- ResultsGallery (edit + published)
- StackedHighlights (edit + published)
- SecretSauceReveal (edit + published)
- TechnicalAdvantage (edit + published)
- ProcessFlowDiagram (edit + published)
- PersonaGrid (edit + published)
- IndustryUseCaseGrid (edit + published)
- RoleBasedScenarios (edit + published)
- CenteredHeadlineCTA (edit + published)
- ValueStackCTA.published.tsx
- Header (edit + published)
- Footer (edit + published)

---

## BUGGY Components

### Pricing

#### ToggleableMonthlyYearly.tsx
- **A** ~15 instances: tier name (L222,229 `text-gray-900`), prices (L242,253,262 `text-gray-900`), labels (L237,248 `text-gray-500`), description (L285,292 `text-gray-600`), features (L322,343 `text-gray-700`)
- **B** 3+ instances: billing toggle (L551 `bg-gray-100`), card inner areas

#### ToggleableMonthlyYearly.published.tsx
- **E** 5 instances: billing toggle area hardcoded colors

---

### Features

#### MetricTiles.tsx
- **A**: metric value colors hardcoded
- **B**: L178 `bg-gray-50`, L93-95 ROI gradient hardcoded

#### MetricTiles.published.tsx
- **B**: L172, L64-71 hardcoded backgrounds

#### Carousel.tsx
- **A**: L99,103,571,596,621,625 hardcoded text colors
- **B**: L87,585,569,617,639 hardcoded card backgrounds
- **D**: partial — imports card system but doesn't use it for all cards

#### SplitAlternating.tsx
- **A**: L125,129 hardcoded text
- **B**: L115 hardcoded background
- **C**: L168,174,183,190 dynamicTextColors as CSS value
- **D**: no card system

---

### HowItWorks

#### VerticalTimeline.tsx
- **A**: L397 hardcoded text
- **B**: L213,360,370 hardcoded backgrounds

#### AccordionSteps.tsx
- **B**: L280,357 hardcoded backgrounds

#### VideoWalkthrough.tsx
- **A**: L293,301 hardcoded text
- **B**: L292,390,454 hardcoded backgrounds
- **C**: L134,337,442 dynamicTextColors as CSS value
- **D**: partial card system usage

#### VideoWalkthrough.published.tsx
- **D**: no card system
- **E**: L47-67,281 hardcoded hex colors

---

### BeforeAfter (ALL buggy)

#### SplitCard.tsx
- **A**: L349,379 hardcoded text
- **B**: L130,341,371 `bg-white` cards
- **C**: L193 dynamicTextColors as CSS value
- **D**: no card system

#### SplitCard.published.tsx
- **A**: L269,292 hardcoded text
- **B**: L87,265,288 hardcoded backgrounds
- **D**: no card system

#### SideBySideBlock.tsx
- **B**: L83,97,112 hardcoded backgrounds
- **C**: L161,164 dynamicTextColors as CSS value
- **D**: no card system

#### SideBySideBlock.published.tsx
- **B**: L60,78,90 hardcoded backgrounds
- **D**: no card system
- **E**: L192,208,266,282 hardcoded hex

#### StackedTextVisual.tsx
- **B**: L90,111,133 hardcoded backgrounds
- **C**: L249,265 dynamicTextColors as CSS value
- **D**: no card system

#### StackedTextVisual.published.tsx
- **B**: L52,73,96 hardcoded backgrounds
- **D**: no card system
- **E**: L199,208 hardcoded hex

---

### Testimonials

#### PullQuoteStack.tsx
- **A**: L180,205,218 hardcoded text
- **B**: L59-69 hardcoded backgrounds
- **D**: no card system

#### PullQuoteStack.published.tsx
- **D**: no card system
- **E**: L166,181,184 hardcoded hex

#### BeforeAfterQuote.tsx
- **A**: L231,240,264,275,284,319,325+ (~10 instances) hardcoded text
- **B**: L179,283 hardcoded backgrounds
- **C**: latent (dynamicTextColors available but not primary path)
- **D**: no card system

#### BeforeAfterQuote.published.tsx
- **B**: L142 hardcoded background
- **D**: no card system
- **E**: L155,157,169,171,176,177,188,189 (~8 instances) hardcoded hex

#### VideoTestimonials.tsx
- **A**: L217,230,263,287,295,310,313 (~7 instances) hardcoded text
- **B**: L180,286,464,470 hardcoded backgrounds
- **C**: L354,277 dynamicTextColors as CSS value
- **D**: partial card system

#### VideoTestimonials.published.tsx
- **B**: L132 hardcoded background
- **D**: no card system
- **E**: L191,192,225,230,233 hardcoded hex

---

### UniqueMechanism

#### MethodologyBreakdown.tsx
- **A**: L470 minor hardcoded text

#### PropertyComparisonMatrix.tsx
- **A**: L154,184,203,233,241 hardcoded text
- **B**: L151 hardcoded background
- **D**: no card system

#### PropertyComparisonMatrix.published.tsx
- **B**: L134 hardcoded background
- **D**: no card system
- **E**: L153,180,202,228 hardcoded hex

---

### ObjectionHandle

#### VisualObjectionTiles (edit + published)
- Minor: `border-gray-100` inside cards (cosmetic, not critical)

#### MythVsRealityGrid.tsx
- **A**: L265,274 hardcoded text
- **D**: no card system

#### MythVsRealityGrid.published.tsx
- **D**: no card system
- **E**: L150,192 hardcoded hex

---

### FAQ (ALL buggy)

#### AccordionFAQ.tsx
- **B**: L60-75 hardcoded backgrounds
- **D**: no card system

#### AccordionFAQ.published.tsx
- **B**: L121-122 hardcoded backgrounds
- **D**: no card system
- **E**: link colors hardcoded

#### TwoColumnFAQ.tsx
- **A**: L126,274 hardcoded text
- **C**: L134,150 dynamicTextColors as CSS value

#### TwoColumnFAQ.published.tsx
- **A**: L54 hardcoded text
- **E**: L139 hardcoded hex

#### SegmentedFAQTabs.tsx
- **A**: L92,102,112,495 hardcoded text
- **B**: L94,104,114 hardcoded backgrounds
- **D**: no card system

#### SegmentedFAQTabs.published.tsx
- **B**: L37,44,51 hardcoded backgrounds
- **D**: no card system
- **E**: link colors hardcoded

#### InlineQnAList.tsx
- **A**: L244,154 hardcoded text
- **C**: L163,180 dynamicTextColors as CSS value

#### InlineQnAList.published.tsx
- **E**: L55,141 hardcoded hex

---

### FounderNote

#### LetterStyleBlock.tsx
- **A**: L114 hardcoded text
- **B**: L170 `bg-white` letter container
- **C**: L181,197,217,233,300,322,341 (~7 instances) dynamicTextColors as CSS value
- **D**: no card system

#### LetterStyleBlock.published.tsx
- **B**: L108 hardcoded background
- **D**: no card system
- **E**: fallback hex colors throughout

---

### SocialProof

#### LogoWall.tsx
- **A**: L206,267,276,288,307,245 hardcoded text
- **B**: L217,276,288 hardcoded backgrounds
- **D**: no card system

#### LogoWall.published.tsx
- **A**: L125,129,139,149 hardcoded text
- **B**: L110,129 hardcoded backgrounds
- **D**: no card system

---

### Hero / CTA

Bugs only in decorative placeholder components (HeroImagePlaceholder, DashboardPlaceholder, ProductMockup) — not section content. Main hero/CTA content is **clean**.

---

## Summary Stats

| Category | Buggy Files | Clean Files |
|----------|------------|-------------|
| Pricing | 2 | 4 |
| Features | 4 | 2 |
| HowItWorks | 4 | 4 |
| BeforeAfter | 6 | 2 |
| Testimonials | 6 | 4 |
| UniqueMechanism | 3 | 8 |
| ObjectionHandle | 3 | 2 |
| FAQ | 8 | 0 |
| FounderNote | 2 | 0 |
| SocialProof | 2 | 0 |
| Hero/CTA/Header/Footer | 0 | 8 |
| **Total** | **40** | **34** |

## Fix Priority

### Tier 1 — Systemic fix (unblocks many components)
1. **Fix `useLayoutComponent.ts`**: Remove `hexToTailwindClass()`. Return hex values directly as `dynamicTextColors` instead of Tailwind classes. This fixes Pattern C everywhere.

### Tier 2 — Highest visual impact (dark palettes completely broken)
2. **BeforeAfter** (6 files): All 3 components + published counterparts. Zero card system usage.
3. **FAQ** (8 files): All 4 components + published counterparts. Zero card system usage.
4. **FounderNote** (2 files): LetterStyleBlock edit + published. `bg-white` + Pattern C.
5. **Testimonials** (6 files): PullQuoteStack, BeforeAfterQuote, VideoTestimonials + published.

### Tier 3 — Moderate impact
6. **SocialProof/LogoWall** (2 files): Hardcoded throughout.
7. **Pricing/ToggleableMonthlyYearly** (2 files): Card system imported but not used for internal text.
8. **Features** (4 files): MetricTiles, Carousel, SplitAlternating.
9. **HowItWorks** (4 files): VerticalTimeline, AccordionSteps, VideoWalkthrough.

### Tier 4 — Minor
10. **UniqueMechanism** (3 files): PropertyComparisonMatrix, MethodologyBreakdown, MythVsRealityGrid.
11. **ObjectionHandle** (1 file): VisualObjectionTiles border color.
