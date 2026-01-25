# UIBlock Archive System - Requirements

## Problem Statement

Current archive approach is incomplete:
- Files moved to `archive/uiblocks-extra/` but references remain active in 15+ config files
- Commenting out code is inconsistent and error-prone
- Picker files still score/return archived layouts causing runtime crashes
- No single source of truth for what's archived vs active

## Goals

1. **Clean separation** - Active code has zero references to archived layouts
2. **Recoverable** - Archived code can be restored by moving files back
3. **Single source of truth** - `layoutNames.ts` defines what's active
4. **Move don't comment** - All archived code goes to archive files, not commented

## V3 Flow Context

The new onboarding (V3) completely replaces the old picker-based system:

| Old Flow | New V3 Flow |
|----------|-------------|
| `generateSectionLayouts.ts` | NOT USED |
| `pick*.ts` (21 files) | NOT USED - `selectUIBlocksV3.ts` instead |
| `layoutPickers.ts` | NOT USED |
| `selectOptionalElements.ts` | NOT USED - AI decides |
| `getLayoutRequirements.ts` | Still used for card count extraction |

**Keep (still used in V3):**
- `selectUIBlocksV3.ts` - Deterministic UIBlock selection
- `compositionRules.ts` - Validation rules
- `getLayoutRequirements.ts` - Card count strategy
- `layoutNames.ts` - Source of truth for active layouts

---

## Current Active Layout Count (After Recent Archive)

| Section | Active Layouts | Picker Needed? |
|---------|----------------|----------------|
| header | 1 (MinimalNavHeader) | NO |
| footer | 1 (ContactFooter) | NO |
| founderNote | 1 (LetterStyleBlock) | NO |
| socialProof | 1 (LogoWall) | NO |
| hero | 4 | YES |
| beforeAfter | 3 | YES |
| features | 4 | YES |
| faq | 4 | YES |
| pricing | 4 | YES |
| testimonials | 5 | YES |
| problem | 3 | YES |
| results | 3 | YES |
| howItWorks | 4 | YES |
| useCases | 3 | YES |
| uniqueMechanism | 6 | YES |
| objectionHandling | 2 | YES |
| cta | 3 | YES |

**Sections needing picker archive:** header, footer, founderNote, socialProof

---

## Files That Reference UIBlock Layouts

### Tier 1: Core Registries (Must Stay in Sync)

| File | Contains | Archive Strategy |
|------|----------|------------------|
| `src/modules/uiblock/layoutNames.ts` | Layout name arrays | **SOURCE OF TRUTH** - only active layouts |
| `src/modules/generatedLanding/componentRegistry.ts` | Component imports & registry | Remove archived imports/entries |
| `src/modules/generatedLanding/componentRegistry.published.ts` | Published component registry | Remove archived imports/entries |
| `src/modules/sections/layoutRegistry.ts` | TypeScript const arrays | Remove archived entries |
| `src/modules/uiblock/uiblockTags.ts` | Tags & orientations | Remove archived entries |
| `src/utils/layoutSectionTypeMapping.ts` | Layout → section type map | Remove archived entries |

### Tier 2: Schemas & Element Definitions

| File | Contains | Archive Strategy |
|------|----------|------------------|
| `src/modules/sections/layoutElementSchema.ts` | Element schemas per layout | **SPLIT** into active + archived files |
| `src/modules/sections/selectOptionalElements.ts` | Optional element rules | **ARCHIVE ENTIRE FILE** (AI decides now) |

### Tier 3: Picker Files (ALL ARCHIVE - V3 doesn't use)

V3 uses `selectUIBlocksV3.ts` instead. Archive ALL picker files:

| File | Archive Strategy |
|------|------------------|
| `src/modules/sections/pickHeader.ts` | **ARCHIVE** |
| `src/modules/sections/pickFooter.ts` | **ARCHIVE** |
| `src/modules/sections/pickFounderNoteLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickSocialProofLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickSecurityLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickCloseLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickComparisonLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickIntegrationLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickHero.ts` | **ARCHIVE** |
| `src/modules/sections/pickBeforeAfter.ts` | **ARCHIVE** |
| `src/modules/sections/pickFeature.ts` | **ARCHIVE** |
| `src/modules/sections/pickHowItWorks.ts` | **ARCHIVE** |
| `src/modules/sections/pickProblemLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickTestimonialLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickResultsLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickUniqueMechanism.ts` | **ARCHIVE** |
| `src/modules/sections/pickUseCaseLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickObjectionLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickFAQLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickPricingLayout.ts` | **ARCHIVE** |
| `src/modules/sections/pickPrimaryCTALayout.ts` | **ARCHIVE** |
| `src/modules/sections/layoutPickers.ts` | **ARCHIVE** |
| `src/modules/sections/layoutPickerInput.ts` | **ARCHIVE** |
| `src/modules/sections/generateSectionLayouts.ts` | **ARCHIVE** |
| `src/modules/sections/selectOptionalElements.ts` | **ARCHIVE** |

### Tier 4: Generation & Selection Logic

| File | Contains | Archive Strategy |
|------|----------|------------------|
| `src/modules/sections/getLayoutRequirements.ts` | Layout requirements | **UPDATE** - remove archived layout examples |
| `src/modules/uiblock/selectionPrompt.ts` | AI prompt with layout lists | **UPDATE** - regenerate from layoutNames.ts |
| `src/modules/uiblock/selectUIBlocksV3.ts` | Deterministic selections | **KEEP** (active, don't touch) |
| `src/modules/uiblock/compositionRules.ts` | Validation rules | **KEEP** (active, don't touch) |

### Tier 5: Prompt & Copy Generation

| File | Contains | Archive Strategy |
|------|----------|------------------|
| `src/modules/prompt/buildPrompt.ts` | Layout descriptions for AI | Remove archived layout descriptions |
| `src/modules/prompt/parseAiResponse.ts` | Special layout processors | Move archived processors to archive |

### Tier 6: Editor UI & Legacy Hooks

| File | Contains | Archive Strategy |
|------|----------|------------------|
| `src/hooks/usePageGeneration.ts` | Old generation flow | **ARCHIVE** (not used in V3) |
| `src/hooks/editStore/regenerationActions.ts` | Uses generateSectionLayouts | **UPDATE** - remove picker imports |
| `src/app/edit/[token]/components/layout/MainContent.tsx` | Default layouts | **UPDATE** - use active layouts |

### Tier 7: Component Files

| Location | Archive Strategy |
|----------|------------------|
| `src/modules/UIBlocks/{Section}/{Layout}.tsx` | Move to `archive/uiblocks/{Section}/` |
| `src/modules/UIBlocks/{Section}/{Layout}.published.tsx` | Move to `archive/uiblocks/{Section}/` |

---

## Archive File Structure

```
archive/
├── uiblocks/                          # Component files
│   ├── Header/
│   │   ├── NavWithCTAHeader.tsx
│   │   ├── NavWithCTAHeader.published.tsx
│   │   └── ...
│   ├── Hero/
│   ├── Problem/
│   └── ...
│
├── schemas/                           # Schema definitions
│   ├── layoutElementSchema.archived.ts
│   └── selectOptionalElements.archived.ts
│
├── pickers/                           # Archived picker files
│   ├── pickHeader.ts
│   ├── pickFooter.ts
│   ├── pickFounderNoteLayout.ts
│   ├── pickSocialProofLayout.ts
│   ├── pickSecurityLayout.ts
│   ├── pickCloseLayout.ts
│   ├── pickComparisonLayout.ts
│   └── pickIntegrationLayout.ts
│
└── prompts/                           # Archived prompt snippets
    └── layoutDescriptions.archived.ts
```

---

## Implementation Steps

### Phase 1: Create Archive Infrastructure

```bash
mkdir -p archive/schemas
mkdir -p archive/pickers
mkdir -p archive/prompts
mkdir -p archive/hooks
```

### Phase 2: Archive Entire Files (V3 doesn't use)

Move these files to archive (entire file, not split):

```bash
# Pickers (all 21 + registry + input)
mv src/modules/sections/pick*.ts archive/pickers/
mv src/modules/sections/layoutPickers.ts archive/pickers/
mv src/modules/sections/layoutPickerInput.ts archive/pickers/

# Generation
mv src/modules/sections/generateSectionLayouts.ts archive/pickers/
mv src/modules/sections/selectOptionalElements.ts archive/schemas/

# Hooks
mv src/hooks/usePageGeneration.ts archive/hooks/
```

### Phase 3: Split Schema File

1. Create `archive/schemas/layoutElementSchema.archived.ts` with archived layout schemas
2. Remove archived layout schemas from `src/modules/sections/layoutElementSchema.ts`
3. Keep only active layouts in source file

### Phase 4: Clean Up Registry References

For each archived layout, REMOVE (not comment) from:
- [ ] `layoutNames.ts` - remove from arrays
- [ ] `componentRegistry.ts` - remove imports + entries
- [ ] `componentRegistry.published.ts` - remove imports + entries
- [ ] `layoutSectionTypeMapping.ts` - remove mappings
- [ ] `layoutRegistry.ts` - remove from arrays
- [ ] `uiblockTags.ts` - remove tags + orientations

### Phase 5: Update Remaining Files

- [ ] `buildPrompt.ts` - remove archived layout descriptions
- [ ] `parseAiResponse.ts` - move archived processors to archive
- [ ] `getLayoutRequirements.ts` - update examples to active layouts
- [ ] `selectionPrompt.ts` - regenerate from layoutNames.ts
- [ ] `MainContent.tsx` - update defaults to active layouts
- [ ] `regenerationActions.ts` - update/remove picker imports

### Phase 6: Move Component Files

```bash
# Move archived TSX files to archive/uiblocks/{Section}/
mv src/modules/UIBlocks/{Section}/{ArchivedLayout}.tsx archive/uiblocks/{Section}/
mv src/modules/UIBlocks/{Section}/{ArchivedLayout}.published.tsx archive/uiblocks/{Section}/
```

### Phase 7: Validate

1. `npm run build` - no compile errors
2. `npm run dev` - test V3 generation flow
3. Grep validation:
   ```bash
   # Should return ZERO results in src/
   grep -r "StackedPainBullets" src/
   grep -r "NavWithCTAHeader" src/
   # etc for each archived layout
   ```

---

## Full List of Archived Layouts

### By Section

| Section | Archived | Remaining Active |
|---------|----------|------------------|
| **Header** | NavWithCTAHeader, CenteredLogoHeader, FullNavHeader | MinimalNavHeader |
| **Hero** | Minimalist | leftCopyRightImage, centerStacked, splitScreen, imageFirst |
| **Footer** | SimpleFooter, LinksAndSocialFooter, MultiColumnFooter | ContactFooter |
| **FounderNote** | FounderCardWithQuote, MissionQuoteOverlay, TimelineToToday, FoundersBeliefStack, VideoNoteWithTranscript, SideBySidePhotoStory, StoryBlockWithPullquote | LetterStyleBlock |
| **SocialProof** | MediaMentions, UserCountBar, IndustryBadgeLine, MapHeatSpots, StackedStats, StripWithReviews, SocialProofStrip | LogoWall |
| **Problem** | StackedPainBullets, BeforeImageAfterText, EmotionalQuotes | CollapsedCards, SideBySideSplit, PersonaPanels |
| **BeforeAfter** | BeforeAfterSlider, TextListTransformation, VisualStoryline, StatComparison, PersonaJourney | SideBySideBlocks, StackedTextVisual, SplitCard |
| **Features** | FeatureTestimonial, MiniCards, Tabbed | IconGrid, SplitAlternating, MetricTiles, Carousel |
| **HowItWorks** | IconCircleSteps, ZigzagImageSteps, AnimatedProcessLine | ThreeStepHorizontal, VerticalTimeline, AccordionSteps, VideoWalkthrough |
| **Results** | BeforeAfterStats, QuoteWithMetric, EmojiOutcomeGrid, TimelineResults, OutcomeIcons, PersonaResultPanels | StatBlocks, StackedWinsList, ResultsGallery |
| **Testimonials** | SegmentedTestimonials, RatingCards, InteractiveTestimonialMap | QuoteGrid, VideoTestimonials, AvatarCarousel, BeforeAfterQuote, PullQuoteStack |
| **Pricing** | FeatureMatrix, SegmentBasedPricing, CardWithTestimonial, MiniStackedCards | TierCards, ToggleableMonthlyYearly, SliderPricing, CallToQuotePlan |
| **ObjectionHandle** | ObjectionAccordion, QuoteBackedAnswers, ProblemToReframeBlocks, SkepticToBelieverSteps, BoldGuaranteePanel | MythVsRealityGrid, VisualObjectionTiles |
| **FAQ** | QuoteStyleAnswers, IconWithAnswers, TestimonialFAQs, ChatBubbleFAQ | AccordionFAQ, TwoColumnFAQ, InlineQnAList, SegmentedFAQTabs |
| **UseCases** | CustomerJourneyFlow, InteractiveUseCaseMap, UseCaseCarousel, WorkflowDiagrams | IndustryUseCaseGrid, PersonaGrid, RoleBasedScenarios |
| **UniqueMechanism** | AlgorithmExplainer, InnovationTimeline, SystemArchitecture | MethodologyBreakdown, ProcessFlowDiagram, PropertyComparisonMatrix, SecretSauceReveal, StackedHighlights, TechnicalAdvantage |
| **CTA** | CTAWithBadgeRow, SideBySideCTA, CountdownLimitedCTA, CTAWithFormField, TestimonialCTACombo | CenteredHeadlineCTA, VisualCTAWithMockup, ValueStackCTA |

### Entire Sections Archived

| Section | All Layouts Archived |
|---------|---------------------|
| **Security** | AuditResultsPanel, PenetrationTestResults, PrivacyCommitmentBlock, SecurityChecklist, SecurityGuaranteePanel, TrustSealCollection |
| **Close** | MockupWithCTA, BonusStackCTA, LeadMagnetCard, EnterpriseContactBox, ValueReinforcementBlock, LivePreviewEmbed, SideBySideOfferCards, MultistepCTAStack |
| **Comparison** | BasicFeatureGrid, CheckmarkComparison, YouVsThemHighlight, ToggleableComparison, CompetitorCallouts, AnimatedUpgradePath, PersonaUseCaseCompare, LiteVsProVsEnterprise |
| **Integration** | LogoGrid, CategoryAccordion, InteractiveStackDiagram, UseCaseTiles, BadgeCarousel, TabbyIntegrationCards, ZapierLikeBuilderPreview, LogoWithQuoteUse |

---

## Notes

- **MOVE don't comment** - All archived code goes to archive files
- **layoutNames.ts** is the source of truth for active layouts
- **selectUIBlocksV3.ts** and **compositionRules.ts** - DON'T TOUCH
- Run `npm run build` after each phase to catch errors early
- Archive files don't need to be compilable (they're just for reference/recovery)
