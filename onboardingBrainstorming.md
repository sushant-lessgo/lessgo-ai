# Onboarding Brainstorming & Historical Decisions

This file contains historical approaches, superseded decisions, and brainstorming notes from the landing page generation system design. Content here may be useful for future reference but is not part of the current implementation.

---

## Superseded Approaches

### Section Selection (Arc-Based) — Superseded by Option B

#### Old Approach
- 600 LOC in objectionFlowEngine.ts
- 56 stacking rules (awareness × sophistication × stage × goal × category)
- 7 complex intersection escape hatches
- Bloat→cut cycle (adds 10 sections, cuts to 7)

#### Intermediate Approach (before Option B)
- **AI-guided simplified rules**
- AI infers: friction level, proof availability, differentiation need, mental model (emotional/analytical/technical)
- Simple rules map variables to section list
- ~5 principles instead of 56 rules

#### Section Order (Arc-Based)
- **4 story arc types:**
  1. Emotional: hero→problem→beforeAfter→solution→proof→cta
  2. Differentiation: hero→uniqueMechanism→features→proof→cta
  3. Trust-first: hero→socialProof→security→features→proof→cta
  4. Speed-to-offer: hero→pricing→proof→objections→cta
- AI infers arc type → simple template applies

**Why superseded:** Arc-based approach is narrative-driven, not psychology-driven. Doesn't account for offer strength, landing goal weight, or objection sequence. See "Option B" in newOnboarding.md.

---

### UIBlock Selection (Per-Section Rules) — Superseded by AI Flow

#### Old Approach
- 7,000 LOC across 19 picker files
- Global system trying to fit all sections
- Complex, produces similar outputs

#### Intermediate Approach
- **Per-section picking logic** (not global)
- Each section has its own 1-3 decision points
- ~50-100 LOC per section, isolated
- Sensible defaults

#### Per-Section Guiding Principles

| Section | Key Differentiator | Default |
|---------|-------------------|---------|
| Header | Nav complexity | Standard nav |
| Hero | Has screenshot? Has social proof? | LeftCopyRightImage |
| Problem | Emotional vs analytical | Pain points list |
| BeforeAfter | Has metrics? Has images? | TextListTransformation |
| UniqueMechanism | Technical depth | Simple differentiation |
| Features | Has metrics? Has images? | IconGrid |
| HowItWorks | Has video? Technical? | ThreeStepHorizontal |
| UseCase | Segment count | Use case cards |
| Results | Has hard metrics? | Metrics grid |
| Testimonials | Has video? Has ratings? | QuoteGrid |
| SocialProof | Has logos? Has metrics? | Stats bar |
| Comparison | Named vs anonymous | Anonymous comparison |
| Integration | Integration count | Logo grid |
| Security | Has compliance? | Trust badges |
| Pricing | Pricing model type | TierCards |
| Objection | Objection count | Objection cards |
| FAQ | Question count | Simple accordion |
| FounderNote | Has photo? | Photo + message |
| PrimaryCTA | Offer type | Clean CTA |
| Close | Final tone | Simple CTA |
| Footer | Link count | Multi-column |

**Why superseded:** Rules couldn't capture nuance. Dynamic questions break rule-based selection. AI handles context better. See "UIBlock Selection Flow" in newOnboarding.md.

---

### Copy Generation (Old Approach)

#### Current Approach
- Element-by-element JSON structure
- Complex card count coordination

#### Intermediate Approach
- **Keep structured JSON output** (easy to parse)
- **One big prompt with full page context** (AI sees whole story)
- AI generates all sections in one call for coherence
- Better model + research layer = quality lift

#### NOT doing
- Narrative-first then extract (doubles tokens, extraction risk)
- Per-element calls (loses coherence)

**Why superseded:** More detailed flow documented in "Copy Generation Flow" appendix in newOnboarding.md.

---

## Historical LOC Reduction Estimates

| System | Old LOC | Estimated New LOC |
|--------|---------|-------------------|
| Background selection | 150 | ~20 (vibe mapping) |
| Accent selection | 250 | ~20 (reuse vibe) |
| Section selection | 600 + 1772 | ~100 (AI-guided rules) |
| UIBlock selection | 7,000 | ~400 (per-section logic) |
| Optional elements | 500+ | ~0 (AI decides or static defaults) |
| Card count | 300+ | ~0 (array.length) |
| **Total** | **~12,500** | **~500** |

Note: Actual implementation may vary. This was early estimation.

---

## Old Implementation Order

1. **Vibe inference** - Single AI call for vibe
2. **Background/Accent** - Use vibe for both
3. **Section selection** - AI-guided simple rules
4. **UIBlock per-section logic** - 21 simple pickers
5. **Element handling** - AI text + static defaults for user-preferred
6. **Card system** - Remove, use array.length
7. **Copy generation** - Full context, structured output
8. **Taxonomy cleanup** - Remove unused, simplify rest

**Why superseded:** Replaced by 9-step generation flow.

---

## UIBlock Selection Signals (Simplified) — Superseded

### Selection Philosophy

```
IF clear signal → Specific UIBlock
ELSE → RANDOM(2-3 safe defaults)
```

This ensures **visual variety** without needing complex signal logic. Every regeneration can look different.

### Signal Categories

#### Tier 1: AI-Inferred (from one-liner + research)
| Signal | Inferred From |
|--------|---------------|
| `isTechnicalProduct` | Keywords: "automate", "API", "developer" |
| `isEnterprise` | Target: "teams", "business", B2B context |
| `isVisualCreativeTool` | Category: design, video, creative |
| `hasProprietaryAlgorithm` | Keywords: "AI", "ML", "algorithm" |
| `hasFramework` | Keywords: "method", "system", "framework" |
| `hasTransformationStory` | Implied before→after in value prop |
| `vibe` | Word choice, tone, category |

#### Tier 2: User Checkboxes (Step 3 Asset Availability)
| Signal | Checkbox |
|--------|----------|
| `hasProductImages` | Product screenshots |
| `hasFeatureImages` | Feature visuals |
| `hasStepImages` | Process/step images |
| `hasBeforeAfterImages` | Before/after visuals |
| `hasDemoVideo` | Demo video |
| `hasFounderVideo` | Founder video message |
| `hasFounderPhotos` | Founder photos |
| `hasVideoTestimonials` | Video testimonials |
| `hasCustomerLogos` | Customer logos |
| `hasCertifications` | Certifications/badges |
| `hasPressMentions` | Press mentions |
| `hasRatings` | Review platform ratings |

#### Tier 3: Strategy-Derived
| Signal | Derived From |
|--------|--------------|
| `hasPersonas` | Strategy defines multiple personas |
| `hasDistinctIndustries` | Strategy identifies industry segments |
| `hasGuarantee` | One Offer includes guarantee |
| `hasUrgency` | One Offer includes urgency |
| `pricingModel` | Landing goal + product type |
| `hasMonthlyYearly` | Pricing structure |
| `hasFAQCategories` | FAQ content has categories |

#### Tier 4: Computed After Generation
| Signal | Computed From |
|--------|---------------|
| `sectionCount` | Number of selected sections |
| `hasCompellingMetrics` | Generated content includes stats |
| `hasTimelineProgression` | Generated results show time progression |

**Why superseded:** AI now curates contextual questions per product. Rules with fixed signals couldn't handle dynamic options.

---

## Option A: Objection-Based Section Selection (Buckets + Rules)

This was an intermediate approach between arc-based and full AI-direct selection.

### The Concept

```
One Reader + One Idea
        ↓
Simulate objections in sequence
        ↓
Classify each objection into bucket
        ↓
Rules map buckets to sections
        ↓
Output: Section list
```

### Objection Buckets

| Bucket | Example Objections |
|--------|-------------------|
| DIFFERENTIATION | "I've heard this before", "What's different?" |
| MECHANISM | "How does it work?", "Is it complicated?" |
| PROOF | "Does it actually work?", "Show me results" |
| TRUST | "Is it safe?", "Who else uses this?" |
| FIT | "Is this for me?", "Will it work for my case?" |
| FRICTION | "How much?", "What's the catch?" |

### Problems with Option A

- Bucket → Section rules don't capture nuance
- Needed profile modifiers for different audiences
- Profiles recreated complexity we were trying to avoid
- Rules couldn't handle judgment calls like "skip UniqueMechanism for overwhelmed audience"

**Why superseded:** Option B (AI-direct) is simpler and handles context better. See newOnboarding.md appendix.

---

---

## Appendix: Original Signal Requirements (Full Extraction)

This appendix captures ALL signals extracted from the original selection logic analysis, before simplification.

### Signals by Section (Original)

#### BeforeAfter
| Signal | Used For |
|--------|----------|
| `hasCompellingMetrics` | → StatComparison |
| `hasBeforeAfterImages` | → BeforeAfterSlider, SplitCard |
| `interactive` (preference) | → BeforeAfterSlider |
| `premium vibe` | → SplitCard |
| `painPointCount >= 4` | → TextListTransformation |
| `hasPersonas` | → PersonaJourney |

#### Features
| Signal | Used For |
|--------|----------|
| `hasFeatureMetrics` | → MetricTiles |
| `hasFeatureImages` | → SplitAlternating, Carousel |
| `featureCount <= 4` | → SplitAlternating (with images) |
| `featureCount > 4` | → Carousel (with images) |
| `hasFeatureCategories` | → Tabbed |
| `featureCount >= 8` | → MiniCards |

#### HowItWorks
| Signal | Used For |
|--------|----------|
| `hasDemoVideo` | → VideoWalkthrough |
| `isTechnicalProduct` | → AccordionSteps |
| `hasStepImages` | → ZigzagImageSteps, VisualStoryline |
| `emphasizesSpeed/duration` | → VerticalTimeline |
| `vibe=playful/bold` | → AnimatedProcessLine |

#### Testimonials
| Signal | Used For |
|--------|----------|
| `hasVideoTestimonials` | → VideoTestimonials |
| `hasRatings` | → RatingCards |
| `reviewPlatforms` | → RatingCards |
| `hasTransformationStory` | → BeforeAfterQuote |
| `hasSegments/hasPersonas` | → SegmentedTestimonials |
| `vibe=emotional/pain-led` | → PullQuoteStack |
| `vibe=friendly/playful` | → AvatarCarousel |

#### Problem
| Signal | Used For |
|--------|----------|
| `wantsPathComparison` | → SideBySideSplit |
| `hasPersonas` | → PersonaPanels |

#### SocialProof
| Signal | Used For |
|--------|----------|
| `hasCertifications` | → IndustryBadgeLine |
| `hasPressMentions` | → MediaMentions |
| `hasCustomerLogos` | → LogoWall, SocialProofStrip |
| `wantsFull` | → LogoWall |
| `wantsCompact` | → SocialProofStrip |
| `wantsGrowthStory` | → UserCountBar |

#### Results
| Signal | Used For |
|--------|----------|
| `isVisualCreativeTool` | → ResultsGallery |
| `hasTimelineProgression` | → TimelineResults |
| `vibe=playful/casual` | → EmojiOutcomeGrid |
| `wantsListFormat` | → StackedWinsList |
| `wantsMetricsOnly` | → StatBlocks |
| `hasPersonas` | → PersonaResultPanels |

#### UniqueMechanism
| Signal | Used For |
|--------|----------|
| `hasCompetitorComparison` | → PropertyComparisonMatrix |
| `hasProprietaryAlgorithm` | → AlgorithmExplainer |
| `hasFramework/Methodology` | → MethodologyBreakdown |
| `wantsBehindTheScenesProcess` | → ProcessFlowDiagram |
| `isTechnicalProduct` | → TechnicalAdvantage |
| `wantsVerticalLayout` | → StackedHighlights |

#### Pricing
| Signal | Used For |
|--------|----------|
| `pricingModel=usage-based` | → SliderPricing |
| `pricingModel=enterprise/custom` | → CallToQuotePlan |
| `hasMonthlyAndYearlyPricing` | → ToggleableMonthlyYearly |
| `needsDetailedFeatureComparison` | → FeatureMatrix |

#### ObjectionHandle
| Signal | Used For |
|--------|----------|
| `hasGuarantee/riskReversal` | → BoldGuaranteePanel |
| `needsMythBusting` | → MythVsRealityGrid |

#### FAQ
| Signal | Used For |
|--------|----------|
| `hasManyFAQs` | → SegmentedFAQTabs |
| `needsCategories` | → SegmentedFAQTabs |
| `wantsConversationalTone` | → ChatBubbleFAQ |
| `wantsGridLayout` | → TwoColumnFAQ |
| `wantsMinimalList` | → InlineQnAList |

#### UseCases
| Signal | Used For |
|--------|----------|
| `hasDistinctIndustries` | → IndustryUseCaseGrid |
| `hasDistinctRoles` | → PersonaGrid, RoleBasedScenarios |
| `hasPersonas` | → PersonaGrid, RoleBasedScenarios |

#### FounderNote
| Signal | Used For |
|--------|----------|
| `hasFounderVideo` | → VideoNoteWithTranscript |
| `hasFounderPhotos` | → SideBySidePhotoStory |
| `richAssets` | → SideBySidePhotoStory |
| `longFounderNarrative` | → StoryBlockWithPullquote |

#### Hero
| Signal | Used For |
|--------|----------|
| `vibe=premium/bold` | → SplitScreen |
| `noCtaNeeded (awareness stage)` | → Minimalist |
| `wantsVisualFirst` | → ImageFirst |
| `wantsCentered` | → CenterStacked |
| `hasProductImages=false` | → CenterStacked |

#### Header
| Signal | Used For |
|--------|----------|
| `wantsCenteredLogo` | → CenteredLogoHeader |
| `sectionCount <= 4` | → MinimalNavHeader |

#### CTA
| Signal | Used For |
|--------|----------|
| `hasUrgency/limitedOffer` | → CountdownLimitedCTA |
| `wantsDualPath` | → SideBySideCTA |
| `isEnterprise` | → CTAWithBadgeRow |
| `needsTrustBadges` | → CTAWithBadgeRow |
| `hasProductMockup` | → VisualCTAWithMockup |
| `wantsValueSummary` | → ValueStackCTA |

### Original Signal Classification

#### Category 1: Asset Availability (User Checkboxes)
| Signal | Currently in Step 3? |
|--------|----------------------|
| `hasBeforeAfterImages` | ❌ No - ADD |
| `hasFeatureImages` | ❌ No - ADD |
| `hasStepImages` | ❌ No - ADD |
| `hasDemoVideo` | ✅ Yes |
| `hasVideoTestimonials` | ❌ No - ADD |
| `hasCustomerLogos` | ✅ Yes |
| `hasFounderVideo` | ❌ No - ADD |
| `hasFounderPhotos` | ✅ Yes |
| `hasProductMockup/hasProductImages` | ✅ Yes |
| `hasCertifications` | ❌ No - ADD |
| `hasPressMentions` | ❌ No - ADD |
| `hasRatings` | ❌ No - ADD |

#### Category 2: AI-Inferred (from one-liner + research)
| Signal | Source |
|--------|--------|
| `hasCompellingMetrics` | Research/IVOC |
| `hasTransformationStory` | Research |
| `hasCompetitorComparison` | Research |
| `hasProprietaryAlgorithm` | One-liner ("AI" keyword) |
| `hasFramework/Methodology` | One-liner |
| `hasGuarantee/riskReversal` | Landing goal + offer |
| `hasUrgency/limitedOffer` | Landing goal + offer |
| `isTechnicalProduct` | One-liner keywords |
| `isEnterprise` | Target audience |
| `isVisualCreativeTool` | Category |
| `needsMythBusting` | IVOC objections |
| `vibe` | Word choice, category |

#### Category 3: Structure Signals (Derived)
| Signal | Derived From |
|--------|--------------|
| `featureCount` | Generated features array length |
| `painPointCount` | Generated pain points array length |
| `sectionCount` | Selected sections count |
| `hasManyFAQs` | FAQ count threshold |
| `hasFeatureCategories` | Features have category field |
| `hasDistinctIndustries` | Strategy personas/segments |
| `hasDistinctRoles` | Strategy personas/segments |
| `hasSegments/hasPersonas` | Strategy personas defined |
| `longFounderNarrative` | Founder story length |
| `hasTimelineProgression` | Results content |

#### Category 4: Pricing Model
| Signal | Source |
|--------|--------|
| `pricingModel` | User input or inference |
| `hasMonthlyAndYearlyPricing` | Pricing structure |
| `needsDetailedFeatureComparison` | Tier complexity |

#### Category 5: PROBLEMATIC "Wants" Signals (Removed/Randomized)
These signals had no clear input source and were replaced with RANDOM():
- `wantsPathComparison`
- `wantsFull` / `wantsCompact`
- `wantsGrowthStory`
- `wantsListFormat`
- `wantsMetricsOnly`
- `wantsBehindTheScenesProcess`
- `wantsVerticalLayout`
- `wantsConversationalTone`
- `wantsGridLayout`
- `wantsMinimalList`
- `wantsVisualFirst`
- `wantsCentered`
- `wantsCenteredLogo`
- `wantsDualPath`
- `wantsValueSummary`
- `interactive` (preference)
- `needsCategories`
- `needsTrustBadges`
- `richAssets`
- `emphasizesSpeed/duration`
- `noCtaNeeded`

### Validation: 3 Product Test

Tested signal inference with 3 diverse products:

#### Product 1: Invoce.ai ("Chat with AI to create invoices in seconds")
- **AI can infer:** isTechnicalProduct=false, isEnterprise=false, vibe=Light Trust, hasTransformationStory=true
- **Cannot infer:** hasCompetitorComparison, hasCompellingMetrics, hasGuarantee
- **UIBlock accuracy:** 7/8 correct

#### Product 2: Canary ("Learn languages with music, practice with people")
- **AI can infer:** isTechnicalProduct=false, isEnterprise=false, vibe=Warm Friendly, hasTransformationStory=true
- **Cannot infer:** hasFramework (maybe), hasSegments
- **UIBlock accuracy:** 7/8 correct

#### Product 3: NativeBridge ("Automate mobile testing on real devices with AI")
- **AI can infer:** isTechnicalProduct=true, isEnterprise=true, vibe=Dark Tech, hasProprietaryAlgorithm=true
- **Cannot infer:** hasCompetitorComparison, hasCompellingMetrics
- **UIBlock accuracy:** 8/8 correct

**Conclusion:** AI can reliably infer ~8 signals. User checkboxes cover ~12 signals. Strategy derives ~7 signals. ~20 "wants" signals eliminated via RANDOM().

---

## Appendix: Section Selection Logic (Arc + Rules Based) — Superseded

This appendix defines how sections were selected and ordered using arc-based templates. Superseded by Option B (AI-direct).

### Overview

**Input:** One-liner + user inputs from Steps 1-6
**Output:** Ordered list of section IDs

**Process:**
1. AI infers 5 variables
2. AI picks 1 arc
3. Arc provides skeleton with placeholders
4. Simple rules expand placeholders into sections
5. Final ordered section list

### Step 1: AI-Inferred Variables

AI infers these 5 variables from one-liner + research + user inputs:

| Variable | Options | Inferred From |
|----------|---------|---------------|
| `frictionLevel` | low / medium / high | Landing goal, price point, sales cycle |
| `proofAvailability` | none / low / medium / high | Asset checkboxes (Step 3) |
| `differentiationNeed` | low / medium / high | Market competitiveness, uniqueness of product |
| `mentalModel` | emotional / analytical / technical | Target audience, product type |
| `arc` | emotional / differentiation / trust-first / speed-to-offer | Combination of above + product type |

#### Friction Level Mapping

| Landing Goal | Default Friction |
|--------------|------------------|
| waitlist | low |
| signup | low |
| free-trial | low |
| download | low |
| buy | medium |
| demo | high |

#### Arc Selection Logic

| Condition | Arc |
|-----------|-----|
| `mentalModel` = emotional AND product is delight/gift | **emotional** |
| `frictionLevel` = high OR `isEnterprise` = true | **trust-first** |
| `differentiationNeed` = high AND has unique mechanism | **differentiation** |
| `frictionLevel` = low AND simple product AND price is selling point | **speed-to-offer** |
| Default | **differentiation** |

### Step 2: Arc Skeletons

#### Emotional Arc
```
header → hero → [magic] → [proof] → [conversion] → cta → footer
```

#### Differentiation Arc
```
header → hero → [differentiator] → [proof] → [conversion] → cta → footer
```

#### Trust-First Arc
```
header → hero → [proof-early] → [story] → [proof-late] → [conversion] → cta → footer
```

#### Speed-to-Offer Arc
```
header → hero → pricing → [proof] → [conversion] → cta → footer
```

### Step 3: Placeholder Expansion Rules

#### [magic] - For Emotional Arc
| Condition | Expands To |
|-----------|------------|
| `hasDemoVideo` = true | howItWorks, features |
| `isVisualCreativeTool` = true | howItWorks, results, features |
| Default | howItWorks, features |

#### [differentiator] - For Differentiation Arc
| Condition | Expands To |
|-----------|------------|
| Has unique mechanism + pain-focused | problem, uniqueMechanism, features, howItWorks |
| Has unique mechanism | uniqueMechanism, features, howItWorks |
| Pain-focused product | problem, features, howItWorks |
| Default | features, howItWorks |

#### [proof-early] - For Trust-First Arc
| Condition | Expands To |
|-----------|------------|
| `hasCustomerLogos` = true | socialProof |
| `hasRatings` = true | socialProof |
| Neither | *(skip)* |

#### [story] - For Trust-First Arc
| mentalModel | Expands To |
|-------------|------------|
| emotional | problem, beforeAfter, features |
| analytical | problem, features, howItWorks, results |
| technical | features, howItWorks |

#### [proof] / [proof-late] - Universal
| Condition | Sections Added |
|-----------|----------------|
| `hasTestimonials` = true | testimonials |
| `hasCustomerLogos` = true (if not in proof-early) | socialProof |
| Has metrics/results | results |
| `hasFounderPhoto` = true AND early stage | founderNote |
| `proofAvailability` = none | *(skip all)* |

#### [conversion] - Universal
| Condition | Sections Added |
|-----------|----------------|
| `frictionLevel` = high | objectionHandle, faq, pricing |
| `frictionLevel` = medium | faq, pricing |
| `frictionLevel` = low + `landingGoal` = buy | faq, pricing |
| `frictionLevel` = low + `landingGoal` != buy | faq |

**Why superseded:** Arc is narrative-driven, not psychology-driven. Doesn't account for offer strength or real objection sequence.

---

## Appendix: UIBlock Selection Logic (Rules Based) — Superseded

This appendix defines how UIBlocks were selected using rules per section. Superseded by AI-direct flow.

### Section-by-Section Selection

#### Header (3 UIBlocks)
```
sectionCount ≤ 5 → MinimalNavHeader
else → RANDOM(NavWithCTAHeader, CenteredLogoHeader)
```

#### Hero (5 UIBlocks)
```
vibe = Bold Energy → SplitScreen
else → RANDOM(LeftCopyRightImage, CenterStacked, ImageFirst)
```

#### Problem (3 UIBlocks)
**Question:** "How do you want to frame the problem?"
```
oneReader has multiple personas → PersonaPanels
answer = pain points → CollapsedCards
answer = old vs new → SideBySideSplit
```

#### BeforeAfter (7 UIBlocks)
**Question:** "What do you have for the transformation story?"
```
answer = images + vibe premium → SplitCard
answer = images → BeforeAfterSlider
answer = metrics → StatComparison
answer = text → RANDOM(SideBySideBlock, StackedTextVisual, TextListTransformation)
```

#### Features (6 UIBlocks)
**Questions:** "Do you have images for individual features?" + "Can features be grouped?"
```
hasImages + hasCategories → Tabbed
hasImages + noCategories → RANDOM(Carousel, SplitAlternating)
noImages + hasCategories → Tabbed
noImages + noCategories → RANDOM(IconGrid, MiniCards)
```

#### HowItWorks (7 UIBlocks)
**Question:** "Do you have a demo video or step-by-step images?"
```
answer = video → VideoWalkthrough
answer = images → RANDOM(ZigzagImageSteps, VisualStoryline)
mentalModel = technical → AccordionSteps
vibe = Bold Energy → AnimatedProcessLine
else → RANDOM(ThreeStepHorizontal, VerticalTimeline)
```

#### Testimonials (9 UIBlocks)
**Question:** "What type of testimonials do you have?"
```
answer = video → VideoTestimonials
answer = platform → RatingCards
vibe = Warm Friendly → AvatarCarousel
mentalModel = emotional → PullQuoteStack
else → RANDOM(QuoteGrid, StripWithReviews)
```

#### SocialProof (6 UIBlocks)
**Question:** "What social proof do you want to highlight?"
```
answer = logos prominent → LogoWall
answer = logos compact → SocialProofStrip
answer = press → MediaMentions
answer = certifications → IndustryBadgeLine
answer = growth → UserCountBar
```

#### Results (7 UIBlocks)
**Question:** "How are your results best shown?"
```
answer = gallery → ResultsGallery
answer = metrics → RANDOM(StatBlocks, OutcomeIcons)
answer = timeline → TimelineResults
answer = list → StackedWinsList
vibe = Warm Friendly → EmojiOutcomeGrid
```

#### UniqueMechanism (7 UIBlocks)
**Question:** "What makes your product unique?"
```
answer = AI → AlgorithmExplainer
answer = methodology → MethodologyBreakdown
answer = comparison → PropertyComparisonMatrix
answer = process → ProcessFlowDiagram
answer = general → RANDOM(SecretSauceReveal, StackedHighlights)
```

#### Pricing (5 UIBlocks)
**Question:** "How is your product priced?"
```
answer = tiers → TierCards
answer = monthly+yearly → ToggleableMonthlyYearly
answer = usage → SliderPricing
answer = custom → CallToQuotePlan
```

#### ObjectionHandle (3 UIBlocks)
**Question:** "How do you want to handle objections?"
```
whatUserGets contains guarantee → BoldGuaranteePanel
answer = guarantee → BoldGuaranteePanel
answer = myths → MythVsRealityGrid
answer = direct → VisualObjectionTiles
```

#### FAQ (5 UIBlocks)
**Question:** "Do your FAQs fall into categories?"
```
answer = yes → SegmentedFAQTabs
vibe = Warm Friendly → ChatBubbleFAQ
else → RANDOM(AccordionFAQ, TwoColumnFAQ, InlineQnAList)
```

#### UseCases (4 UIBlocks)
**Question:** "How do you segment your users?"
```
answer = role → RANDOM(PersonaGrid, RoleBasedScenarios)
answer = industry → IndustryUseCaseGrid
answer = use case → UseCaseCarousel
```

#### FounderNote (4 UIBlocks)
**Question:** "Do you have a founder video message?"
```
answer = yes → VideoNoteWithTranscript
answer = no → RANDOM(SideBySidePhotoStory, LetterStyleBlock)
```

#### CTA (6 UIBlocks)
```
whatUserGets contains urgency → CountdownLimitedCTA
frictionLevel = high → CTAWithBadgeRow
else → RANDOM(CenteredHeadlineCTA, SideBySideCTA, ValueStackCTA)
```

#### Footer (1 UIBlock)
Always ContactFooter.

**Why superseded:** Rules couldn't capture nuance. Dynamic questions break rule-based selection. AI handles context better.

---

## Appendix: Objection-Based Section Selection (Option A — Buckets) — Superseded

Full detail of the intermediate "buckets" approach before AI-direct.

### The Concept

```
One Reader (full profile)
        +
One Idea (full argument)
        ↓
AI simulates: What objections arise in sequence?
        ↓
Objections (ordered, natural language)
        ↓
Bucket classification
        ↓
Bucket + Context → Section mapping
        ↓
Final section list (ordered)
```

### Objection Buckets

| Bucket | Example Objections |
|--------|-------------------|
| **TRUST** | "Is this legit?", "Who else uses this?" |
| **MECHANISM** | "How does it work?" |
| **DIFFERENTIATION** | "Why is this different?", "Why will this work when others didn't?" |
| **VALUE** | "What do I get?" |
| **FIT** | "Is this for me?", "Will it work for my situation?" |
| **RISK** | "What if it fails?", "Will I become dependent?" |
| **COST** | "How much?", "Is it worth it?" |
| **FRICTION** | "What's the catch?", "Is it really free?", "Privacy?" |
| **PROOF** | "Does it actually work?", "Show me results" |

### Bucket → Section Mapping

| Bucket | Possible Sections | Selection Factors |
|--------|-------------------|-------------------|
| TRUST | SocialProof, Testimonials, FounderNote | Has logos? Has testimonials? Early stage? |
| MECHANISM | HowItWorks | User experience explanation |
| DIFFERENTIATION | UniqueMechanism | Technical/scientific explanation |
| VALUE | Features, Results | Has metrics? Has feature images? |
| FIT | UseCases, Problem | Multiple personas? Need problem agitation? |
| RISK | ObjectionHandle, Testimonials | Has guarantee? Testimonials address risk? |
| COST | Pricing | Has clear pricing? |
| FRICTION | FAQ, Hero | Common questions? Offer clarity needed? |
| PROOF | Results, Testimonials | Has metrics? Has quotes? |

### Why Superseded

- Bucket → Section rules still don't capture nuance
- Needed profile modifiers for different audiences
- Profiles recreated complexity we were trying to avoid
- Rules couldn't handle judgment calls like "skip UniqueMechanism for overwhelmed audience"

**Replaced by Option B:** AI directly picks sections based on objections without intermediate bucket classification.

---

## Notes for Future Reference

- Pre-built IVOC database moved to productBacklog.md (V1.5)
- Competitor research deferred to V2 (see productBacklog.md)
- Landing page types (Ad, SEO, Social) deferred to V2
- Multi-page website support deferred to V2
