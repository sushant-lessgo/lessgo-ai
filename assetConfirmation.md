# Asset Availability Confirmation - PRD

## Sprint 7 - Asset-Aware Layout Selection

---

## 📋 Problem Statement

**Current Issue:**
Layout pickers select UIBlocks based purely on business/marketing criteria (awareness level, tone, audience, sophistication, etc.) without considering whether users have the required assets (images, videos, logos, testimonials, etc.).

**Impact:**
- Users see layouts requiring product images when they only have an idea
- Testimonial-heavy sections selected for MVPs with no customers
- Video walkthroughs chosen when users have no video content
- Results in placeholder-heavy pages that look incomplete
- Forces users to regenerate or manually change layouts

**Example Scenarios:**
- Early-stage founder with just an idea → Gets `imageFirst` hero (needs product screenshots)
- MVP with no customers → Gets `VideoTestimonials` (needs customer videos)
- Solo founder → Gets `SideBySidePhotoStory` founder note (needs founder photos)

---

## 🎯 Objectives

1. **Intelligent Layout Selection** - Pick layouts that match available assets from first generation
2. **Set Proper Expectations** - Users know what assets they'll need to add later
3. **Reduce Regeneration** - Get the right layouts on first try
4. **Progressive Enhancement** - Allow users to upgrade layouts as assets become available

---

## 🔍 Solution Overview

**Add Asset Availability Confirmation Step:**
- Insert after feature confirmation modal
- Before main page generation
- Quick checkbox form (5-10 seconds to complete)
- Feeds into layout picker logic

**Flow:**
```
[Onboarding Form]
    ↓
[Feature Confirmation Modal]
    ↓
[Asset Availability Modal] ← NEW
    ↓
[Generating... with asset-aware layout selection]
    ↓
[Edit page with smart layouts]
```

---

## 📐 Detailed Requirements

### 1. Asset Availability Modal UI

**Location:** After feature confirmation, before generation starts

**Design Specifications:**

```
┌──────────────────────────────────────────────────┐
│  🎨 Almost there! Quick asset check              │
│                                                  │
│  This helps us choose the perfect layouts       │
│  for your page. You can add these later.        │
│                                                  │
│  What do you have ready?                        │
│                                                  │
│  ☐ Product screenshots or mockups               │
│     └─ For hero, features, CTA sections         │
│                                                  │
│  ☐ Customer/company logos (3+)                  │
│     └─ For social proof, case studies           │
│                                                  │
│  ☐ Customer testimonials or reviews             │
│     └─ For testimonial sections                 │
│                                                  │
│  ☐ Your photo (founder/team)                    │
│     └─ For founder note, about sections         │
│                                                  │
│  ☐ Integration partner logos                    │
│     └─ For integration sections                 │
│                                                  │
│  ☐ Product demo video                           │
│     └─ For how it works, hero sections          │
│                                                  │
│  [Skip - Use Text-Only Layouts]                 │
│  [Continue to Generation] ←── Primary Button    │
└──────────────────────────────────────────────────┘
```

**Interaction Rules:**
- All checkboxes unchecked by default (conservative approach)
- Can check/uncheck multiple items

- "Continue" button → Proceed with selected assets


**Smart Defaults Based on Startup Stage:**
- `idea`: All unchecked
- `mvp`: Pre-check "Product screenshots"
- `traction`: Pre-check "Product screenshots" + "Customer testimonials"
- `growth/scale`: Pre-check all except "Product demo video"

---

### 2. Data Model Changes

**New Type Definition:** `src/types/core/index.ts`

```typescript
export interface AssetAvailability {
  productImages: boolean;
  customerLogos: boolean;
  testimonials: boolean;
  founderPhoto: boolean;
  integrationLogos: boolean;
  demoVideo: boolean;
}
```

**Update LayoutPickerInput:** `src/modules/sections/layoutPickerInput.ts`

```typescript
export interface LayoutPickerInput {
  // ... existing fields

  // NEW: Asset availability
  assetAvailability?: AssetAvailability;
}
```

**Store Updates:**

Add to `useOnboardingStore`:
```typescript
interface OnboardingState {
  // ... existing fields

  assetAvailability: AssetAvailability | null;
}

interface OnboardingActions {
  // ... existing actions

  setAssetAvailability: (availability: AssetAvailability) => void;
}
```

---

### 3. Layout Picker Logic Updates

**Priority:** Update all 19 pickers to be asset-aware

#### Critical Pickers (Phase 1 - High Impact):

**pickHeroLayout:**
```typescript
if (!assetAvailability?.productImages) {
  // Heavily penalize image-dependent layouts
  scores.imageFirst -= 100;
  scores.leftCopyRightImage -= 50;
  scores.splitScreen -= 50;

  // Boost text-focused layouts
  scores.centerStacked += 30;
}
```

**pickTestimonialLayout:**
```typescript
if (!assetAvailability?.testimonials) {
  // Remove all testimonial-heavy layouts from consideration
  return null; // Skip testimonial section entirely
}

if (!assetAvailability?.demoVideo) {
  scores.VideoTestimonials -= 100;
}
```

**pickSocialProofLayout:**
```typescript
if (!assetAvailability?.customerLogos) {
  scores.LogoWall -= 100;
  scores.MediaMentions -= 100;

  // Fallback to stat-based proof
  scores.StackedStats += 50;
  scores.UserCountBar += 30;
}
```

**pickFounderNoteLayout:**
```typescript
if (!assetAvailability?.founderPhoto) {
  scores.SideBySidePhotoStory -= 100;
  scores.VideoNoteWithTranscript -= 100;

  // Boost text-only layouts
  scores.LetterStyleBlock += 50;
  scores.FoundersBeliefStack += 30;
}
```

**pickHowItWorksLayout:**
```typescript
if (!assetAvailability?.demoVideo) {
  scores.VideoWalkthrough -= 100;
}

if (!assetAvailability?.productImages) {
  scores.ZigzagImageSteps -= 50;
}
```

**pickIntegrationLayout:**
```typescript
if (!assetAvailability?.integrationLogos) {
  scores.LogoGrid -= 100;
  scores.LogoWithQuoteUse -= 100;
  scores.BadgeCarousel -= 80;

  // Fallback to text-based integration displays
  scores.CategoryAccordion += 50;
  scores.TabbyIntegrationCards += 30;
}
```

#### Secondary Pickers (Phase 2 - Medium Impact):

**pickPrimaryCTALayout, pickCloseLayout:**
```typescript
if (!assetAvailability?.productImages) {
  scores.VisualCTAWithMockup -= 100;
  scores.MockupWithCTA -= 80;
  scores.LivePreviewEmbed -= 80;
}

if (!assetAvailability?.testimonials) {
  scores.TestimonialCTACombo -= 100;
}
```

**pickResultsLayout:**
```typescript
if (!assetAvailability?.testimonials) {
  scores.QuoteWithMetric -= 100;
  scores.BeforeAfterStats -= 50; // Needs customer data
}
```

**pickProblemLayout:**
```typescript
if (!assetAvailability?.productImages) {
  scores.BeforeImageAfterText -= 100;
}
```

**pickFeatureLayout:**
```typescript
if (!assetAvailability?.productImages) {
  scores.SplitAlternating -= 30;
  scores.Carousel -= 50;

  // Boost icon-based layouts
  scores.IconGrid += 30;
  scores.MiniCards += 20;
}
```

#### Lower Priority Pickers (Phase 3 - Low Impact):

- pickComparisonLayout
- pickUseCaseLayout
- pickFAQLayout
- pickObjectionLayout
- pickSecurityLayout
- pickUniqueMechanism

---

### 4. Section Selection Updates

**Update getSectionsFromRules:** `src/modules/sections/getSectionsFromRules.ts`

Pass `assetAvailability` to all picker functions:

```typescript
const pickerInput: LayoutPickerInput = {
  ...baseInputFromFields,
  assetAvailability: onboardingStore.assetAvailability || undefined,
};

const heroLayout = pickHeroLayout(pickerInput);
const testimonialLayout = pickTestimonialLayout(pickerInput);
// ... etc
```

**Section Exclusion Logic:**

```typescript
// If no testimonials, skip testimonial section entirely
if (!assetAvailability?.testimonials) {
  selectedSections = selectedSections.filter(s => s !== 'testimonial');
}

// If no customer logos, skip social proof
if (!assetAvailability?.customerLogos) {
  selectedSections = selectedSections.filter(s => s !== 'socialProof');
}

// If no integration logos, skip integration section
if (!assetAvailability?.integrationLogos) {
  selectedSections = selectedSections.filter(s => s !== 'integration');
}
```

---

### 5. UI/UX Flow Integration

**Modal Manager Updates:** `src/hooks/useModalManager.ts`

```typescript
// Add new modal type
type ModalType =
  | 'inferredField'
  | 'missingFields'
  | 'featureConfirmation'
  | 'assetAvailability' // NEW
  | 'publishing';

// Add to modal queue after feature confirmation
const handleFeatureConfirmationComplete = () => {
  queueModal({
    type: 'assetAvailability',
    onComplete: handleAssetAvailabilityComplete,
  });
};

const handleAssetAvailabilityComplete = (availability: AssetAvailability) => {
  onboardingStore.setAssetAvailability(availability);
  proceedToGeneration();
};
```

**Component Location:** `src/app/create/[token]/components/AssetAvailabilityModal.tsx` (NEW)

---

### 6. Persistence & API

**Draft Saving:**
- Include `assetAvailability` in draft saves
- Allow users to update asset availability later from editor settings

**Generation API:** `src/app/api/generate-landing/route.ts`

```typescript
// Include assetAvailability in generation request
const generationInput = {
  ...confirmedFields,
  assetAvailability: requestBody.assetAvailability,
};
```

---

## 🎨 Visual Design Specs

### Modal Styling
- **Width:** 600px max-width
- **Padding:** 32px
- **Checkboxes:** Large, easy to tap (20px)
- **Helper text:** Gray-600, 14px font
- **Icons:** Asset type icons next to each checkbox
- **Buttons:**
  - Primary: "Continue to Generation"
  - Secondary: "Skip - Use Text-Only Layouts"

### Animation
- Fade in from bottom
- Checkboxes have subtle hover effect
- Smooth transition to generation screen


---

## 🎯 Two-Layer Asset-Aware Strategy

### Layer 1: Section Selection (Binary Decision)

**Purpose:** Determine if a section should exist at all

**Location:** `getSectionsFromRules.ts`

**Logic:** HARD EXCLUSIONS - Skip entire sections that are meaningless without assets

```typescript
export function getSectionsFromRules(
  input: LayoutPickerInput,
  assetAvailability?: AssetAvailability
): SelectedSection[] {

  let sections = [...initialSectionSelection];

  // HARD EXCLUSIONS - Remove sections entirely

  if (!assetAvailability?.testimonials) {
    // Testimonial section is meaningless without testimonials
    sections = sections.filter(s => s !== 'testimonial');
  }

  if (!assetAvailability?.customerLogos && !assetAvailability?.testimonials) {
    // Social proof needs either logos OR testimonials to be effective
    sections = sections.filter(s => s !== 'socialProof');
  }

  if (!assetAvailability?.integrationLogos) {
    // Integration section only makes sense with partner logos
    sections = sections.filter(s => s !== 'integration');
  }

  return sections;
}
```

**Exclusion Rules:**

| Section | Excluded When | Reasoning |
|---------|---------------|-----------|
| **Testimonial** | No testimonials | Empty testimonial section looks fake/weak |
| **Social Proof** | No logos AND no testimonials | Need at least one form of social proof |
| **Integration** | No integration logos | Integration section without logos is pointless |

---

### Layer 2: Layout Pickers (Granular Decision)

**Purpose:** Choose the best layout variant for sections that SHOULD exist

**Location:** All 19 individual picker files

**Logic:** SOFT ADJUSTMENTS - Adjust scoring to prefer text-heavy/asset-light layouts

```typescript
export function pickHeroLayout(input: LayoutPickerInput): HeroLayout {
  const { assetAvailability } = input;

  // ... existing scoring logic

  // SOFT ADJUSTMENTS - Penalize asset-heavy layouts
  if (!assetAvailability?.productImages) {
    scores.imageFirst -= 100;
    scores.leftCopyRightImage -= 50;
    scores.splitScreen -= 50;

    // Boost text-focused layouts
    scores.centerStacked += 30;
  }

  return highestScoringLayout;
}
```

**Layout Adjustment Rules:**

| Section | Without Assets | Strategy | Example Adjustment |
|---------|---------------|----------|-------------------|
| **Hero** | No product images | Keep section, pick text-only | `centerStacked` instead of `imageFirst` |
| **Problem** | No images | Keep section, pick text-based | `StackedPainBullets` instead of `BeforeImageAfterText` |
| **Features** | No images | Keep section, use icons | `IconGrid` instead of `SplitAlternating` |
| **How It Works** | No video | Keep section, use steps | `ThreeStepHorizontal` instead of `VideoWalkthrough` |
| **Results** | No testimonials | Keep section, use stats | `StatBlocks` instead of `QuoteWithMetric` |
| **Use Cases** | No images | Keep section, text-based | `PersonaGrid` instead of visual variants |
| **Pricing** | N/A | Always keep, no assets needed | No changes |
| **FAQ** | N/A | Always keep, no assets needed | No changes |
| **Comparison** | No images | Keep section, text tables work | `BasicFeatureGrid` instead of visual |
| **Security** | No badges | Keep section, text-based | `SecurityChecklist` instead of `TrustSealCollection` |
| **Objection** | No images | Keep section, text-based | `ObjectionAccordion` instead of visual |
| **Founder Note** | No photo | Keep section, letter format | `LetterStyleBlock` instead of `SideBySidePhotoStory` |
| **Close/CTA** | No mockups | Keep section, text CTA | `CenteredHeadlineCTA` instead of `VisualCTAWithMockup` |

---

### Decision Matrix: Include vs Exclude

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Does the section ADD VALUE without assets?            │
│                                                         │
│         YES                           NO                │
│          ↓                             ↓                │
│    KEEP SECTION                  EXCLUDE SECTION        │
│    (Layer 2: Adjust Layout)      (Layer 1: Skip it)   │
│                                                         │
│  Examples:                        Examples:            │
│  • Hero (text value prop)         • Testimonials       │
│  • Features (icon + text)         • Social Proof*      │
│  • Founder Note (letter)          • Integration        │
│  • How It Works (steps)                                │
│  • Pricing (always)                                    │
│                                                         │
│  * Unless has testimonials as fallback                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Implementation Checklist

**Layer 1: Section Selection**
- [ ] Add `assetAvailability` parameter to `getSectionsFromRules`
- [ ] Implement hard exclusion logic for Testimonial section
- [ ] Implement hard exclusion logic for Social Proof section
- [ ] Implement hard exclusion logic for Integration section
- [ ] Add fallback logic (e.g., keep Social Proof if has testimonials)
- [ ] Test edge cases (no assets at all, partial assets)

**Layer 2: Layout Pickers**
- [ ] Pass `assetAvailability` to all picker functions
- [ ] Update all 19 pickers with asset-aware scoring adjustments
- [ ] Test that text-only layouts are selected when appropriate
- [ ] Verify no asset-heavy layouts selected without assets
- [ ] Document penalty values for consistency

---

### Why Both Layers Are Necessary

**Section Selection Alone:** Would skip sections entirely but can't optimize layouts for remaining sections

**Layout Pickers Alone:** Would pick wrong layouts for sections that shouldn't exist

**Together:** Creates intelligent, asset-aware pages that look complete and professional regardless of available assets

---

### Example Outcomes

**Scenario 1: Idea Stage (No Assets)**
- ❌ **Excluded:** Testimonial, Social Proof, Integration
- ✅ **Included with text-only layouts:**
  - Hero → `centerStacked`
  - Features → `IconGrid`
  - How It Works → `ThreeStepHorizontal`
  - Founder Note → `LetterStyleBlock`
  - Close → `CenteredHeadlineCTA`

**Scenario 2: Growth Stage (Full Assets)**
- ✅ **All sections included**
- ✅ **Asset-rich layouts selected:**
  - Hero → `imageFirst`
  - Testimonial → `VideoTestimonials`
  - Social Proof → `LogoWall`
  - Integration → `LogoGrid`
  - Founder Note → `SideBySidePhotoStory`

**Scenario 3: MVP (Partial Assets: Product images only)**
- ❌ **Excluded:** Testimonial, Social Proof, Integration
- ✅ **Included with mixed layouts:**
  - Hero → `leftCopyRightImage` (has images)
  - Features → `SplitAlternating` (can use images)
  - How It Works → `IconCircleSteps` (no video)
  - Founder Note → `LetterStyleBlock` (no photo)
  - Close → `MockupWithCTA` (has product images)