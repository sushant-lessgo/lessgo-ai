# UIBlock Layout Selection - Business Rules for Flow-Aware Coherence

**Last Updated**: 2025-10-09
**Purpose**: Define comprehensive business rules for selecting optimal UIBlock layouts for each section type, ensuring tonal coherence and objection flow alignment

---

## Core Principle

**"The best section with the wrong layout is still a conversion killer."**

UIBlock selection must answer: **"What is this section trying to achieve RIGHT NOW in the user's mental journey, and which layout best serves that purpose?"**

Pickers cannot make isolated decisions. They must understand:
- Their role in the objection flow
- What previous sections established
- What tone/complexity was set
- Where they sit in the mental journey

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Overall Cohesiveness Rules](#2-overall-cohesiveness-rules)
3. [Flow-Aware Picker Architecture](#3-flow-aware-picker-architecture)
4. [Section-Specific UIBlock Rules](#4-section-specific-uiblock-rules)
   - [Hero](#41-hero-section)
   - [Problem](#42-problem-section)
   - [Before/After](#43-beforeafter-section)
   - [Features](#44-features-section)
   - [Unique Mechanism](#45-unique-mechanism-section)
   - [How It Works](#46-how-it-works-section)
   - [Results](#47-results-section)
   - [Testimonials](#48-testimonials-section)
   - [Social Proof](#49-social-proof-section)
   - [Comparison](#410-comparison-section)
   - [Objection Handling](#411-objection-handling-section)
   - [FAQ](#412-faq-section)
   - [Pricing](#413-pricing-section)
   - [Integration](#414-integration-section)
   - [Security](#415-security-section)
   - [Use Cases](#416-use-cases-section)
   - [Founder Note](#417-founder-note-section)
   - [CTA](#418-cta-section)
   - [Close](#419-close-section)
   - [Header](#420-header-section)
   - [Footer](#421-footer-section)
5. [Implementation Priority System](#5-implementation-priority-system)
6. [Asset-Aware Substitution Matrix](#6-asset-aware-substitution-matrix)
7. [Validation Checklist](#7-validation-checklist)

---

## 1. Core Principles

### 1.1 Objection Purpose is Paramount

**Priority Order**:
1. **Objection purpose** (5-6 points) - What job does this section need to do RIGHT NOW?
2. **Asset availability** (hard constraint: -100 for impossible)
3. **Audience sophistication + Awareness** (3-4 points)
4. **Stage/Goal/Category context** (2-3 points)
5. **Tone/Style preferences** (1-2 points)

**Critical Insight**: The same section at different positions serves different purposes.

**Example**:
- Problem section at position 2 (unaware flow) → **Identify** the problem → `StackedPainBullets` (clarity)
- Problem section at position 2 (problem-aware flow) → **Agitate** the pain → `EmotionalQuotes` (validation)

### 1.2 Flow Context Matters

**Pickers must know**:
- `sectionPurpose`: What objection am I solving? ('identify-problem', 'agitate-pain', 'show-solution', 'differentiate', 'prove', 'close')
- `positionInFlow`: Where am I in the sequence? (e.g., 3 of 8)
- `previousSection`: What did we just do? (type, layout, tone)
- `nextSection`: What comes next? (type, purpose)
- `flowTone`: What tone was established? ('emotional', 'analytical', 'balanced')

### 1.3 Tonal Consistency

**Flow Tone Tracking**:
```
If early section uses emotional layout (EmotionalQuotes, EmojiOutcomeGrid):
  → Set flowTone = 'emotional'
  → Subsequent sections boost relatable, accessible layouts
  → Subsequent sections penalize heavy analytical layouts

If early section uses analytical layout (CollapsedCards, StatBlocks):
  → Set flowTone = 'analytical'
  → Subsequent sections boost data-driven, technical layouts
  → Subsequent sections penalize overly casual layouts
```

**Anti-Pattern**: Emotional problem → Technical features → Cold stats → Warm testimonial = Tonal whiplash

### 1.4 Complexity Alignment

**Flow Complexity Tracking**:
```
If early sections are simple (IconGrid, StackedPainBullets):
  → Set flowComplexity = 'simple'
  → Maintain scannable, accessible layouts

If early sections are detailed (SplitAlternating, CollapsedCards):
  → Set flowComplexity = 'detailed'
  → Allow more comprehensive layouts
```

### 1.5 Asset Substitution Strategy

**Two-Level Substitution**:

1. **Layout-level** - "I can't use this specific UIBlock, pick another within this section"
   - Example: BeforeAfter section needs images → use `TextListTransformation` instead of `BeforeAfterSlider`

2. **Strategy-level** - "This section itself isn't viable, substitute entire section"
   - Example: BeforeAfter section + no images + MVP stage → Consider using `UniqueMechanism` section instead
   - This ties back to section-level asset substitution (sectionBusinessRules.md Rule 6)

---

## 2. Overall Cohesiveness Rules

### 2.1 Cross-Section Tonal Coherence

**Rule 2.1.1: Maintain Flow Tone Across Sections**

**When flowTone is 'emotional'**:
- Boost: Relatable layouts (IconGrid, EmojiOutcomeGrid, StackedWinsList, EmotionalQuotes)
- Penalize: Heavy analytical (CollapsedCards, StatBlocks, SplitAlternating)
- Keep language simple and accessible

**When flowTone is 'analytical'**:
- Boost: Data-driven layouts (StatBlocks, BeforeAfterStats, QuoteWithMetric, MetricTiles)
- Penalize: Overly casual (EmojiOutcomeGrid, playful carousels)
- Use quantitative proof

**When flowTone is 'balanced'**:
- Allow mix of both
- Prioritize based on section purpose

**Rule 2.1.2: Early Section Sets the Tone**

The section at **position 3** (first after hero) sets the flow tone:
- If `EmotionalQuotes` → flowTone = 'emotional'
- If `CollapsedCards` → flowTone = 'analytical'
- If `StackedPainBullets` → flowTone = 'balanced'

### 2.2 Cross-Section Complexity Alignment

**Rule 2.2.1: Maintain Complexity Level**

**When flowComplexity is 'simple'**:
- Features: Boost IconGrid, MiniCards (scannable)
- Results: Boost OutcomeIcons, StackedWinsList (digestible)
- Testimonials: Use simple layouts, not detailed case studies

**When flowComplexity is 'detailed'**:
- Features: Allow SplitAlternating (comprehensive)
- Results: Allow QuoteWithMetric, PersonaResultPanels (in-depth)
- Testimonials: Detailed customer stories acceptable

### 2.3 Sequential Context Rules

**Rule 2.3.1: "What Did We Just Do?" Context**

**If previousSection is 'problem' with emotional tone**:
- Next section should offer **relief**
- Boost: BeforeAfter (show transformation), Features (show solution)
- Layout tone: Maintain emotional accessibility

**If previousSection is 'uniqueMechanism'**:
- Next section should **validate the mechanism**
- If Results section: Boost BeforeAfterStats (quantify mechanism impact)
- If Testimonials: Boost quotes that mention the unique approach

**If previousSection is 'features'**:
- Next section should **prove it works**
- Results or Testimonials with concrete outcomes

**Rule 2.3.2: "What Comes Next?" Context**

**If nextSection is 'cta'**:
- Current section must be **decisive**, not educational
- Boost: Punchy proof (StatBlocks, StackedWinsList), NOT lengthy explainers
- Avoid: Complex how-it-works, detailed case studies

**If nextSection is 'objectionHandling'**:
- Current section should **set up the objections** by making bold claims
- Results with strong metrics lead naturally into "but what about..." objections

### 2.4 Section Pairing Rules

**Rule 2.4.1: Problem → BeforeAfter Pairing**

When `problem` and `beforeAfter` both exist and are within 2 positions:
- Problem shows **pain** → BeforeAfter shows **relief**
- If Problem uses EmotionalQuotes → BeforeAfter should use relatable transformation (not just metrics)
- If Problem uses StackedPainBullets → BeforeAfter can use TextListTransformation (structured)

**Rule 2.4.2: UniqueMechanism → Results Pairing**

When `uniqueMechanism` exists and `results` follows within 2-3 positions:
- Results must **validate the unique approach**
- Boost layouts that show cause-effect (BeforeAfterStats, TimelineResults)
- Avoid generic metric dumps (StatBlocks without context)

**Rule 2.4.3: Features → Results Pairing**

When `features` comes early and `results` comes later:
- Features shows capabilities → Results proves outcomes
- Results should reference feature benefits, not just generic wins

### 2.5 Visual Rhythm Rules

**Rule 2.5.1: Alternate Dense and Light Sections**

Track content density as sections are selected:
- **Heavy sections**: SplitAlternating, CollapsedCards, FeatureTestimonial, QuoteWithMetric
- **Light sections**: IconGrid, OutcomeIcons, EmojiOutcomeGrid, MiniCards

Pattern: Avoid 3+ heavy sections in a row (creates fatigue)

If 2 heavy sections in a row, boost light layouts for next section.

**Rule 2.5.2: Breathing Rhythm**

Every 3rd section should provide visual relief:
- Position 3, 6, 9 → Prefer lighter, more scannable layouts
- Positions 4-5, 7-8 → Can use denser layouts

---

## 3. Flow-Aware Picker Architecture

### 3.1 Enhanced Picker Input Interface

**Current Input** (from `layoutPickerInput.ts`):
```typescript
interface LayoutPickerInput {
  awarenessLevel, toneProfile, startupStage, marketCategory,
  landingPageGoals, targetAudience, pricingModel,
  marketSophisticationLevel, copyIntent, problemType,
  assetAvailability
}
```

**Proposed Enhanced Input**:
```typescript
interface EnhancedLayoutPickerInput extends LayoutPickerInput {
  // NEW: Flow context
  sectionPurpose: 'identify-problem' | 'agitate-pain' | 'show-solution'
                 | 'differentiate' | 'prove' | 'close' | 'educate';
  positionInFlow: number;           // e.g., 3 (of 8 total)
  totalSectionsInFlow: number;      // e.g., 8 total

  previousSection?: {
    type: string;                   // e.g., "problem"
    layout: string;                 // e.g., "EmotionalQuotes"
    tone: 'emotional' | 'analytical' | 'balanced';
    density: 'light' | 'medium' | 'heavy';
  };

  nextSection?: {
    type: string;                   // e.g., "cta"
    purpose: string;                // e.g., "close"
  };

  flowTone: 'emotional' | 'analytical' | 'balanced';
  flowComplexity: 'simple' | 'moderate' | 'detailed';
}
```

### 3.2 Flow-Aware Hard Rules Pattern

Instead of static scoring, implement **purpose-driven hard rules**:

```typescript
// Purpose-based rule (highest priority)
if (
  sectionPurpose === 'agitate-pain' &&      // This section's job in flow
  awarenessLevel === "problem-aware" &&     // They already know problem exists
  positionInFlow <= 3                        // Early in journey
) {
  return "EmotionalQuotes";  // Hard rule: emotional validation needed NOW
}

// Position-aware rule
if (
  sectionPurpose === 'prove' &&
  nextSection?.type === 'cta' &&            // Leading into close
  positionInFlow >= totalSectionsInFlow - 2  // Near end of flow
) {
  // Need punchy, decisive proof - not lengthy case studies
  if (startupStage === 'mvp') {
    return "StackedWinsList";  // Quick, credible wins
  } else {
    return "BeforeAfterStats";  // Tangible transformation
  }
}
```

### 3.3 Tone Consistency Scoring Adjustments

After establishing flow tone, adjust scoring:

```typescript
// Flow tone adjustments (apply in all pickers)
if (flowTone === 'emotional') {
  scores.EmotionalLayout += 5;     // Boost emotional layouts
  scores.AnalyticalLayout -= 3;    // Penalize analytical layouts
}

if (flowTone === 'analytical') {
  scores.AnalyticalLayout += 5;    // Boost analytical layouts
  scores.CasualLayout -= 3;        // Penalize overly casual layouts
}

// Complexity alignment
if (flowComplexity === 'simple') {
  scores.ScanneableLayout += 4;    // Maintain simplicity
  scores.DetailedLayout -= 2;      // Avoid complexity creep
}
```

---

## 4. Section-Specific UIBlock Rules

### 4.1 Hero Section

**Purpose in Objection Flow**:
- **Always position 1**: Capture attention, communicate value proposition, set expectations

**Available Layouts**:
1. **CenteredHero** - Simple, focused value prop for clear offerings
2. **SplitHero** - Image + text for visual products
3. **VideoHero** - Demo-led for complex products
4. **MinimalHero** - Ultra-clean for sophisticated audiences

**Hard Rules**:

**HR-4.1.1: MVP Stage + Unaware Audience**
```
IF startupStage in ['pre-mvp', 'mvp-development']
   AND awarenessLevel === 'unaware'
THEN use CenteredHero (clear, simple value prop)
```

**HR-4.1.2: Product-Aware + Visual Product**
```
IF awarenessLevel in ['product-aware', 'most-aware']
   AND marketCategory in ['Design & Creative Tools', 'E-commerce Platform']
   AND assetAvailability.productImages === true
THEN use SplitHero (show product immediately)
```

**HR-4.1.3: Technical Product + Sophisticated Audience**
```
IF marketSophisticationLevel >= 'level-4'
   AND targetAudience in ['builders', 'enterprise']
   AND assetAvailability.demoVideo === true
THEN use VideoHero (show, don't tell)
```

**Flow-Aware Rules**:
- Hero sets initial tone for entire page
- If CenteredHero used → Suggests simple, accessible flow → Set flowTone = 'balanced', flowComplexity = 'simple'
- If VideoHero used → Suggests demo-led flow → Set flowComplexity = 'moderate'

**Scoring Dimension Priority**:
1. Awareness level (5 points)
2. Asset availability (hard constraint)
3. Market sophistication (4 points)
4. Target audience (3 points)
5. Tone profile (2 points)

---

### 4.2 Problem Section

**Purpose in Objection Flow**:
- **Early flow** (position 2-3, unaware): **Identify** the problem they don't know exists
- **Early flow** (position 2-3, problem-aware): **Agitate** the pain for emotional validation
- **Middle flow** (position 5-6): **Validate** specific pain points before solution

**Available Layouts**:
1. **StackedPainBullets** - Clear list for problem identification
2. **EmotionalQuotes** - Personal stories for pain agitation
3. **BeforeImageAfterText** - Visual problem illustration
4. **CollapsedCards** - Organized pain points for complex problems
5. **PersonaPanels** - Multiple problem types for diverse audiences

**Hard Rules**:

**HR-4.2.1: Problem-Aware Early Flow = Agitation**
```
IF awarenessLevel === 'problem-aware'
   AND sectionPurpose === 'agitate-pain'
   AND positionInFlow <= 3
THEN use EmotionalQuotes (emotional validation REQUIRED)
```

**HR-4.2.2: Unaware Early Flow = Identification**
```
IF awarenessLevel === 'unaware'
   AND sectionPurpose === 'identify-problem'
   AND positionInFlow <= 3
THEN use StackedPainBullets (clarity over emotion)
```

**HR-4.2.3: Enterprise Complex Problems**
```
IF targetAudience === 'enterprise'
   AND problemType in ['compliance-or-risk', 'lost-revenue-or-inefficiency']
   AND marketSophisticationLevel >= 'level-4'
THEN use CollapsedCards (organized, analytical)
```

**HR-4.2.4: Multiple Personas**
```
IF targetAudience in ['businesses', 'enterprise']
   AND marketSophisticationLevel >= 'level-3'
   AND awarenessLevel in ['unaware', 'problem-aware']
THEN use PersonaPanels (address different pain points)
```

**Flow-Aware Rules**:

**If problem section at position 3** (sets tone):
- EmotionalQuotes → flowTone = 'emotional', boost emotional layouts for rest of flow
- StackedPainBullets → flowTone = 'balanced'
- CollapsedCards → flowTone = 'analytical', boost analytical layouts

**If previousSection is 'hero'**:
- Problem continues the narrative
- Layout should match hero's sophistication level

**If nextSection is 'beforeAfter'**:
- Problem should agitate (show pain) → BeforeAfter shows relief
- Emotional problem layout → Emotional transformation layout

**Asset Requirements**:
- **BeforeImageAfterText** requires: productImages OR conceptImages
- Others: Text-based, no hard asset requirements

**Asset Substitution**:
```
IF BeforeImageAfterText selected AND !assetAvailability.productImages
THEN substitute with StackedPainBullets (text-based alternative)
```

**Scoring Dimension Priority**:
1. **Objection purpose** (6 points) - NEW: Agitate vs Identify
2. Copy intent (5 points)
3. Problem type (4 points)
4. Awareness level (4 points)
5. Target audience (4 points)
6. Market sophistication (3 points)

---

### 4.3 Before/After Section

**Purpose in Objection Flow**:
- **Early flow** (position 3-5, MVP): Show **vision** of transformation
- **Middle flow** (position 5-7): Show **tangible** before/after change
- **After problem section**: Provide **relief** after agitating pain

**Available Layouts**:
1. **BeforeAfterSlider** - Interactive visual transformation
2. **VisualStoryline** - Step-by-step visual journey
3. **TextListTransformation** - Text-based before/after
4. **SideBySideComparison** - Direct visual comparison

**Hard Rules**:

**HR-4.3.1: MVP Stage = Vision-Based Only**
```
IF startupStage in ['pre-mvp', 'mvp-development']
THEN use TextListTransformation (vision, not product screenshots)
     OR remove BeforeAfter section entirely if vision doesn't fit
```

**HR-4.3.2: After Emotional Problem = Relatable Transformation**
```
IF previousSection.type === 'problem'
   AND previousSection.tone === 'emotional'
THEN boost TextListTransformation, VisualStoryline (relatable)
     penalize metric-heavy layouts
```

**HR-4.3.3: Visual Product Categories**
```
IF marketCategory in ['Design & Creative Tools', 'Marketing & Sales Tools']
   AND assetAvailability.productImages === true
THEN use BeforeAfterSlider OR VisualStoryline (show visual impact)
```

**Flow-Aware Rules**:

**If follows problem section** (pairing rule):
- Problem agitated → BeforeAfter soothes
- Emotional problem → Relatable transformation (not cold metrics)
- Analytical problem → Structured comparison (SideBySideComparison)

**If early in flow** (position 3-4):
- Sets expectation for proof level
- Visual transformation → Suggests visual-first flow

**Asset Requirements**:
- **BeforeAfterSlider** requires: productImages (before/after shots)
- **VisualStoryline** requires: productImages OR conceptImages (sequence)
- **TextListTransformation** requires: None (text-based)
- **SideBySideComparison** requires: productImages

**Asset Substitution**:
```
IF visual layout selected AND !assetAvailability.productImages
THEN IF startupStage === 'mvp'
       THEN use TextListTransformation (vision-based)
     ELSE remove BeforeAfter section (strategy-level substitution)
```

**Scoring Dimension Priority**:
1. **Asset availability** (hard constraint: -100 if impossible)
2. **Previous section context** (5 points) - NEW
3. Startup stage (4 points)
4. Market category (3 points)
5. Awareness level (3 points)

---

### 4.4 Features Section

**Purpose in Objection Flow**:
- **Early flow** (position 3-5): Show **what it does** to unaware/problem-aware
- **Middle flow** (position 5-7): **Differentiate capabilities** for solution-aware
- **Free-trial goal**: Quick **scannability** - "just try it"

**Available Layouts**:
1. **IconGrid** - Scannable, simple features (3x3 or 4x4 grid)
2. **SplitAlternating** - Detailed feature explanations with images
3. **FeatureTestimonial** - Features + customer validation
4. **MetricTiles** - Features with quantifiable benefits
5. **MiniCards** - Compact feature cards
6. **Carousel** - Interactive feature showcase

**Hard Rules**:

**HR-4.4.1: Free Trial = Scannable REQUIRED**
```
IF landingGoal in ['free-trial', 'signup']
THEN use IconGrid OR MiniCards (quick comprehension)
     NEVER SplitAlternating (too detailed for "just try it")
```

**HR-4.4.2: Technical Product + Sophisticated Audience**
```
IF targetAudience in ['builders', 'enterprise']
   AND marketSophisticationLevel >= 'level-4'
   AND marketCategory in ['Engineering & Development Tools', 'AI Tools']
THEN use SplitAlternating (detailed explanations needed)
```

**HR-4.4.3: Established Company + High Friction**
```
IF startupStage in ['growth', 'scale']
   AND landingGoal in ['buy-now', 'contact-sales']
   AND targetAudience === 'enterprise'
THEN use FeatureTestimonial (trust-building)
```

**HR-4.4.4: MVP + Simple Flow**
```
IF startupStage in ['pre-mvp', 'mvp-development']
   AND awarenessLevel in ['unaware', 'problem-aware']
   AND marketSophisticationLevel <= 'level-2'
THEN use IconGrid (clear, simple value props)
```

**Flow-Aware Rules**:

**If flowTone is 'emotional'**:
- Boost IconGrid, Carousel (relatable, accessible)
- Penalize SplitAlternating (too technical for emotional flow)

**If flowComplexity is 'simple'**:
- Boost IconGrid, MiniCards (maintain simplicity)
- Penalize SplitAlternating, FeatureTestimonial (complexity creep)

**If previousSection is 'problem' or 'beforeAfter'**:
- Features shows **solution** to established pain
- Use layouts that feel like relief, not overwhelming detail

**If nextSection is 'results' or 'testimonials'**:
- Features sets up capabilities → Results proves they work
- Allow more comprehensive layouts (will be validated next)

**Asset Requirements**:
- **SplitAlternating** requires: productImages (feature screenshots)
- **Carousel** requires: productImages (multiple feature visuals)
- **FeatureTestimonial** requires: testimonials + optionally productImages
- **IconGrid, MiniCards, MetricTiles**: No hard asset requirements (icon-based)

**Asset Substitution**:
```
IF SplitAlternating OR Carousel selected
   AND !assetAvailability.productImages
THEN boost IconGrid, MiniCards (icon-based alternatives, +30 points)
```

**Scoring Dimension Priority**:
1. **Landing goal context** (5 points) - NEW: Free-trial needs scannability
2. **Flow complexity** (4 points) - NEW
3. Awareness level (5 points)
4. Market sophistication (4 points)
5. Target audience (4 points)

---

### 4.5 Unique Mechanism Section

**Purpose in Objection Flow**:
- **Early flow** (position 2-4, level-3+): **Differentiate immediately** - "why this works when others fail"
- **Middle flow** (position 5-7): Explain **unique approach** before proving it

**Available Layouts**:
1. **MechanismDiagram** - Visual explanation of unique approach
2. **ThreeStepProcess** - Simplified 3-step differentiation
3. **ComparisonMechanism** - "Old way vs Our way"
4. **DetailedApproach** - In-depth technical explanation

**Hard Rules**:

**HR-4.5.1: Level-3+ = Differentiation Required**
```
IF marketSophisticationLevel >= 'level-3'
   AND sectionPurpose === 'differentiate'
THEN mechanism section is REQUIRED in flow
     Layout choice based on audience sophistication
```

**HR-4.5.2: Technical Audience = Detailed Explanation**
```
IF targetAudience in ['builders', 'enterprise']
   AND marketCategory in ['Engineering & Development Tools', 'AI Tools']
THEN use DetailedApproach (technical credibility)
```

**HR-4.5.3: Non-Technical + Early Stage**
```
IF targetAudience in ['founders', 'creators', 'marketers']
   AND startupStage in ['pre-mvp', 'mvp-development', 'mvp-launched']
THEN use ThreeStepProcess (simple, accessible)
```

**HR-4.5.4: Competitive Market = Comparison Focus**
```
IF marketSophisticationLevel in ['level-3', 'level-4']
   AND copyIntent === 'desire-led'
THEN use ComparisonMechanism ("old way" vs "our way")
```

**Flow-Aware Rules**:

**If early in flow** (position 2-4, solution-aware):
- Mechanism IS the hook → Must be immediately clear
- Boost ThreeStepProcess (quick comprehension)
- Avoid DetailedApproach (too early for depth)

**If nextSection is 'results' or 'testimonials'** (pairing rule):
- Mechanism claims uniqueness → Next section validates it
- Results should reference the mechanism ("Our [unique approach] led to...")

**If previousSection is 'problem'**:
- Problem showed pain → Mechanism shows "why our solution is different"
- Smooth transition from pain to unique relief

**Asset Requirements**:
- **MechanismDiagram** requires: customDiagrams OR productImages
- **ComparisonMechanism** requires: optionally competitorLogos
- **ThreeStepProcess, DetailedApproach**: Text-based, no hard requirements

**Asset Substitution**:
```
IF MechanismDiagram selected AND !assetAvailability.customDiagrams
THEN use ThreeStepProcess (text-based alternative)
```

**Scoring Dimension Priority**:
1. **Market sophistication** (6 points) - Determines differentiation need
2. **Position in flow** (5 points) - NEW: Early vs middle affects complexity
3. Target audience (4 points)
4. Market category (3 points)
5. Tone profile (2 points)

---

### 4.6 How It Works Section

**Purpose in Objection Flow**:
- **Early flow** (unaware): **Educate** on how solution works
- **Middle flow**: **Clarify process** for implementation-curious
- **Developer-focused**: **Technical validation**

**Available Layouts**:
1. **StepByStep** - Numbered process steps (3-5 steps)
2. **VisualFlow** - Flowchart-style explanation
3. **AnimatedDemo** - Interactive or video demonstration
4. **AccordionSteps** - Expandable detailed steps

**Hard Rules**:

**HR-4.6.1: Unaware Audience = Simple Steps**
```
IF awarenessLevel === 'unaware'
   AND sectionPurpose === 'educate'
THEN use StepByStep (clear, numbered process)
     Max 3-5 steps (avoid overwhelming)
```

**HR-4.6.2: Developer Tools = Technical Depth**
```
IF marketCategory in ['Engineering & Development Tools', 'Developer Tools & APIs']
   AND targetAudience in ['builders', 'developers']
THEN use AccordionSteps (detailed technical explanation)
     OR AnimatedDemo (code walkthrough)
```

**HR-4.6.3: Complex Process = Visual Flow**
```
IF problemType in ['manual-repetition', 'time-freedom-or-automation']
   AND marketSophisticationLevel >= 'level-3'
THEN use VisualFlow (process visualization)
```

**Flow-Aware Rules**:

**If flowComplexity is 'simple'**:
- Boost StepByStep (maintain simplicity)
- Penalize AccordionSteps (too detailed)
- Max 3 steps

**If flowComplexity is 'detailed'**:
- Allow AccordionSteps (in-depth explanation)
- Use 4-6 steps

**If previousSection is 'uniqueMechanism'**:
- Mechanism showed "what's different" → HowItWorks shows "how to use it"
- Layout should explain the unique approach in action

**If nextSection is 'cta' or 'close'**:
- HowItWorks too late in flow (slows momentum)
- Use simplified layout (StepByStep, 3 steps max)

**Asset Requirements**:
- **VisualFlow** requires: customDiagrams OR processImages
- **AnimatedDemo** requires: demoVideo OR interactiveDemo
- **StepByStep, AccordionSteps**: Text-based, optionally stepImages

**Asset Substitution**:
```
IF VisualFlow selected AND !assetAvailability.customDiagrams
THEN use StepByStep (text-based alternative)

IF AnimatedDemo selected AND !assetAvailability.demoVideo
THEN use AccordionSteps (detailed text alternative)
```

**Scoring Dimension Priority**:
1. **Awareness level** (5 points) - Unaware needs education
2. **Flow complexity** (4 points) - NEW
3. Market category (4 points)
4. Target audience (3 points)
5. Problem type (3 points)

---

### 4.7 Results Section

**Purpose in Objection Flow**:
- **Middle flow** (position 5-7): **Prove value** with outcomes
- **After uniqueMechanism**: **Validate mechanism** works
- **Before CTA**: Create **urgency** and decisiveness

**Available Layouts**:
1. **StatBlocks** - Big numbers, bold metrics
2. **BeforeAfterStats** - Quantified transformation
3. **QuoteWithMetric** - Customer testimonial + metric
4. **EmojiOutcomeGrid** - Visual outcomes (MVP-friendly)
5. **TimelineResults** - Progress over time
6. **OutcomeIcons** - Icon-based wins (MVP-friendly)
7. **StackedWinsList** - List of qualitative wins
8. **PersonaResultPanels** - Results by customer segment

**Hard Rules**:

**HR-4.7.1: MVP Stage = NEVER Metric-Heavy Layouts**
```
IF startupStage in ['pre-mvp', 'mvp-development', 'mvp-launched']
THEN NEVER use StatBlocks, BeforeAfterStats, QuoteWithMetric
     MUST use OutcomeIcons, EmojiOutcomeGrid, OR StackedWinsList
     (Vision-based, aspirational outcomes only)
```

**HR-4.7.2: Enterprise + Established = Testimonial + Metric**
```
IF targetAudience === 'enterprise'
   AND startupStage in ['growth', 'scale']
   AND marketSophisticationLevel >= 'level-4'
THEN use QuoteWithMetric (credible customer proof with numbers)
```

**HR-4.7.3: After UniqueMechanism = Validate Mechanism**
```
IF previousSection.type === 'uniqueMechanism'
THEN IF startupStage in ['growth', 'scale']
       use BeforeAfterStats (show mechanism impact)
     ELSE use StackedWinsList (qualitative validation)
```

**HR-4.7.4: Before CTA = Decisive Proof**
```
IF nextSection.type === 'cta'
   AND positionInFlow >= totalSectionsInFlow - 2
THEN IF startupStage === 'mvp'
       use StackedWinsList (quick, credible wins)
     ELSE use BeforeAfterStats OR StatBlocks (punchy, clear)
     NEVER TimelineResults OR PersonaResultPanels (too detailed)
```

**Flow-Aware Rules**:

**If flowTone is 'emotional'**:
- Boost EmojiOutcomeGrid, StackedWinsList (relatable outcomes)
- Penalize cold metrics (StatBlocks without context)

**If flowTone is 'analytical'**:
- Boost StatBlocks, BeforeAfterStats (quantitative proof)
- Penalize emoji-based layouts

**If previousSection.tone is 'emotional'**:
- Maintain emotional connection
- Use QuoteWithMetric (human story + number) NOT pure StatBlocks

**If previousSection is 'features'**:
- Features showed capabilities → Results proves outcomes
- Use layouts that tie outcomes to features (PersonaResultPanels)

**Asset Requirements**:
- **QuoteWithMetric** requires: testimonials (named customers)
- **BeforeAfterStats** requires: Real metrics (growth data)
- **TimelineResults** requires: Historical data over time
- **OutcomeIcons, EmojiOutcomeGrid, StackedWinsList**: No hard requirements (vision-based)

**Asset Substitution**:
```
IF QuoteWithMetric selected AND !assetAvailability.testimonials
THEN substitute with StatBlocks OR BeforeAfterStats (metric-based)

IF metric-heavy layout selected AND startupStage is MVP
THEN OVERRIDE with OutcomeIcons OR StackedWinsList (HARD CONSTRAINT)
```

**Scoring Dimension Priority**:
1. **Startup stage** (6 points) - CRITICAL: Determines proof credibility
2. **Previous section context** (5 points) - NEW
3. **Next section context** (4 points) - NEW: Before CTA affects choice
4. Target audience (4 points)
5. Copy intent (4 points)
6. Problem type (4 points)

---

### 4.8 Testimonials Section

**Purpose in Objection Flow**:
- **Middle flow** (position 6-7): Build **trust** through peer validation
- **Before pricing**: **Justify value** with customer stories
- **Before CTA**: **Final confidence** boost

**Available Layouts**:
1. **TestimonialCards** - Card-based customer quotes
2. **VideoTestimonials** - Customer video stories
3. **FeaturedQuote** - Single large testimonial
4. **TestimonialCarousel** - Rotating customer stories
5. **IndustryTestimonials** - Grouped by industry/persona

**Hard Rules**:

**HR-4.8.1: No Testimonials Asset = Remove Section**
```
IF !assetAvailability.testimonials
THEN remove Testimonials section entirely
     Substitute with founderNote (MVP) OR socialProof (logos)
     (This is strategy-level substitution)
```

**HR-4.8.2: Before Pricing = Justify Value**
```
IF nextSection.type === 'pricing'
THEN use FeaturedQuote OR TestimonialCards
     Include ROI-focused testimonials
     Avoid casual, brief quotes
```

**HR-4.8.3: Enterprise + Multiple Personas**
```
IF targetAudience === 'enterprise'
   AND marketSophisticationLevel >= 'level-3'
THEN use IndustryTestimonials (peer validation by role/industry)
```

**HR-4.8.4: Video Available = Use It**
```
IF assetAvailability.videoTestimonials === true
   AND landingGoal in ['buy-now', 'contact-sales', 'subscribe']
THEN use VideoTestimonials (highest trust builder)
```

**Flow-Aware Rules**:

**If flowTone is 'emotional'**:
- Boost FeaturedQuote, VideoTestimonials (personal stories)
- Show relatable customer journeys

**If flowTone is 'analytical'**:
- Use TestimonialCards with metrics
- Include company names, logos, specific outcomes

**If previousSection is 'results'**:
- Results showed numbers → Testimonials humanize them
- Use quotes that reference specific outcomes

**If nextSection is 'cta'**:
- Testimonials are final trust signal
- Use strongest, most decisive testimonials
- FeaturedQuote (impactful) > Carousel (browse-y)

**Asset Requirements**:
- **All testimonial layouts** require: testimonials (customer quotes, names)
- **VideoTestimonials** requires: videoTestimonials
- **IndustryTestimonials** requires: testimonials from multiple industries/roles

**Asset Substitution**:
```
IF Testimonials section selected AND !assetAvailability.testimonials
THEN strategy-level substitution:
     IF startupStage in ['pre-mvp', 'mvp-development']
       substitute entire section with founderNote
     ELSE IF assetAvailability.customerLogos
       substitute with socialProof section
     ELSE substitute with beforeAfter (vision-based trust)
```

**Scoring Dimension Priority**:
1. **Asset availability** (CRITICAL: testimonials required)
2. **Next section context** (5 points) - NEW: Before pricing/CTA
3. **Previous section context** (4 points) - NEW
4. Target audience (4 points)
5. Market sophistication (3 points)

---

### 4.9 Social Proof Section

**Purpose in Objection Flow**:
- **Early flow** (position 2-3, level-4+): **Credibility gate** for skeptical markets
- **Middle flow**: **Market validation** - "others trust them"
- **Enterprise flow**: **Authority signals**

**Available Layouts**:
1. **LogoGrid** - Customer/partner logo grid
2. **StatsBar** - User count, growth metrics
3. **AwardsBadges** - Awards, certifications, press
4. **TrustSignals** - Mixed social proof (logos + stats + awards)

**Hard Rules**:

**HR-4.9.1: No Logos/Stats = Remove Section**
```
IF !assetAvailability.customerLogos
   AND !assetAvailability.userCount
   AND !assetAvailability.awards
THEN remove SocialProof section entirely
     Substitute with testimonials OR founderNote
```

**HR-4.9.2: Level-4+ Early Positioning = Credibility Gate**
```
IF marketSophisticationLevel >= 'level-4'
   AND positionInFlow <= 3
THEN SocialProof must be early (position 2-3)
     Use TrustSignals (comprehensive proof upfront)
```

**HR-4.9.3: Enterprise Audience = Logo Focus**
```
IF targetAudience === 'enterprise'
   AND assetAvailability.customerLogos === true
THEN use LogoGrid (peer validation through recognizable brands)
     Prioritize enterprise logos
```

**HR-4.9.4: Consumer Product = Stats Focus**
```
IF targetAudience in ['founders', 'creators', 'consumers']
   AND assetAvailability.userCount > 0
THEN use StatsBar (popularity signals)
     "Join 50,000+ users" more effective than enterprise logos
```

**Flow-Aware Rules**:

**If early in flow** (position 2-3):
- Social proof sets credibility baseline
- Use comprehensive layout (TrustSignals with everything)
- Affects flowTone: Sets analytical, credibility-focused tone

**If after problem/beforeAfter**:
- Social proof validates the solution exists
- Use LogoGrid (simple validation, not overwhelming)

**If before features/pricing**:
- Social proof builds trust before asking for commitment
- Use TrustSignals (make case before showing details)

**Asset Requirements**:
- **LogoGrid** requires: customerLogos (minimum 6-8 recognizable brands)
- **StatsBar** requires: userCount OR growthMetrics OR marketShare
- **AwardsBadges** requires: awards OR certifications OR pressLogos
- **TrustSignals** requires: At least 2 of the above

**Asset Substitution**:
```
IF SocialProof selected AND insufficient assets
THEN strategy-level substitution:
     IF assetAvailability.testimonials
       use Testimonials section instead
     ELSE IF assetAvailability.founderPhoto
       use founderNote section
     ELSE remove section, strengthen results/features
```

**Scoring Dimension Priority**:
1. **Asset availability** (CRITICAL: logos/stats/awards required)
2. **Market sophistication** (5 points) - Level-4+ needs early proof
3. **Position in flow** (4 points) - NEW
4. Target audience (4 points)
5. Landing goal (3 points)

---

### 4.10 Comparison Section

**Purpose in Objection Flow**:
- **Middle flow** (level-3+, high-friction goals): **Differentiate** vs competitors
- **After features + uniqueMechanism**: Show **superiority** with data
- **NEVER** for free-trial or personal categories

**Available Layouts**:
1. **ComparisonTable** - Feature-by-feature matrix
2. **BeforeAfterComparison** - "Old solution vs Our solution"
3. **WhyUsGrid** - Reasons to choose us over others

**Hard Rules**:

**HR-4.10.1: Free-Trial/Signup = FORBIDDEN**
```
IF landingGoal in ['free-trial', 'signup']
THEN NEVER include Comparison section
     Cognitive dissonance: "just try it" vs "make serious decision"
```

**HR-4.10.2: Personal Categories = FORBIDDEN**
```
IF marketCategory in [
     'Personal Productivity Tools',
     'Health & Wellness',
     'Fitness & Exercise',
     'Mental Health & Mindfulness'
   ]
THEN NEVER include Comparison section
     Personal mental model conflicts with analytical comparison
```

**HR-4.10.3: MVP Stage = FORBIDDEN**
```
IF startupStage in ['pre-mvp', 'mvp-development', 'mvp-launched']
THEN NEVER include Comparison section
     Cannot back claims with data
```

**HR-4.10.4: Comparison AFTER Features + Mechanism**
```
IF Comparison section exists
THEN must come AFTER both features AND uniqueMechanism
     User must understand value before comparing
```

**Flow-Aware Rules**:

**Must follow features AND uniqueMechanism**:
- Features showed capabilities
- UniqueMechanism showed differentiation
- Comparison proves superiority with data

**If before results/testimonials**:
- Comparison makes bold claims → Results/Testimonials validate them

**Position in flow**:
- Never early (position < 5)
- Optimal: Position 6-7 (after value established)

**Asset Requirements**:
- **ComparisonTable** requires: Real data to back claims
- **BeforeAfterComparison** requires: Clear differentiation points
- Cannot fake: If no clear superiority, don't use Comparison

**Asset Substitution**:
```
IF Comparison section planned BUT startupStage is MVP
THEN substitute entire section with uniqueMechanism (differentiation without comparison)

IF Comparison section planned BUT landingGoal is free-trial
THEN remove section entirely (wrong for low-friction goal)
```

**Scoring Dimension Priority**:
1. **Landing goal** (CRITICAL: Forbidden for free-trial)
2. **Market category** (CRITICAL: Forbidden for personal)
3. **Startup stage** (CRITICAL: Forbidden for MVP)
4. **Position in flow** (5 points) - NEW: Must be after features
5. Market sophistication (4 points)

---

### 4.11 Objection Handling Section

**Purpose in Objection Flow**:
- **Late flow** (position 7-8): **Remove barriers** before CTA
- **Level-4+ markets**: **Address skepticism** explicitly
- **High-friction goals**: **Risk reversal**

**Available Layouts**:
1. **AccordionFAQ** - Expandable objection answers
2. **TwoColumnObjections** - Objection + Answer side-by-side
3. **ObjectionCards** - Card-based objection handling
4. **RiskReversalFocus** - Guarantee/refund emphasis

**Hard Rules**:

**HR-4.11.1: Before CTA Positioning**
```
IF ObjectionHandling exists
THEN must be at position 7-8 (late flow, before CTA)
     NEVER early (creates doubt too soon)
```

**HR-4.11.2: Level-4+ = Required**
```
IF marketSophisticationLevel >= 'level-4'
   AND landingGoal in ['buy-now', 'subscribe', 'contact-sales']
THEN ObjectionHandling section REQUIRED
     Use AccordionFAQ OR TwoColumnObjections
```

**HR-4.11.3: Buy-Now = Risk Reversal**
```
IF landingGoal in ['buy-now', 'subscribe']
   AND marketSophisticationLevel >= 'level-3'
THEN use RiskReversalFocus (money-back guarantee, free trial period)
```

**Flow-Aware Rules**:

**Must come late in flow**:
- After establishing value (features, results, testimonials)
- Before final CTA
- Removes final barriers

**If flowTone is 'analytical'**:
- Use TwoColumnObjections (systematic, data-backed answers)

**If flowTone is 'emotional'**:
- Use ObjectionCards (relatable concerns, empathetic answers)

**If previousSection is 'pricing'**:
- Objections likely price-related
- Focus on value justification, risk reversal

**Asset Requirements**:
- **All layouts**: Require understanding of common objections
- **RiskReversalFocus**: Requires guarantee/refund policy

**Scoring Dimension Priority**:
1. **Position in flow** (CRITICAL: Must be late)
2. **Market sophistication** (5 points) - Level-4+ requires this
3. Landing goal (4 points)
4. Flow tone (3 points) - NEW

---

### 4.12 FAQ Section

**Purpose in Objection Flow**:
- **Late flow** (position 7-9): **Remove friction** with quick answers
- **Alternative to objectionHandling**: Lighter, more general

**Available Layouts**:
1. **AccordionFAQ** - Expandable Q&A
2. **TwoColumnFAQ** - Questions left, answers right
3. **CategoryFAQ** - Grouped by topic

**Hard Rules**:

**HR-4.12.1: FAQ OR ObjectionHandling, Not Both**
```
IF objectionHandling section exists
THEN FAQ is optional (similar purpose)
ELSE FAQ is recommended for all flows
```

**HR-4.12.2: Late Positioning**
```
IF FAQ exists
THEN must be at position 7-9 (before CTA)
```

**Flow-Aware Rules**:

**If flowComplexity is 'simple'**:
- Use AccordionFAQ (clean, expandable)
- Keep answers brief

**If flowComplexity is 'detailed'**:
- Use CategoryFAQ (organized by topic)
- More comprehensive answers

**Asset Requirements**: None (questions can be inferred)

**Scoring Dimension Priority**:
1. Landing goal (3 points)
2. Market sophistication (3 points)
3. Flow complexity (3 points) - NEW

---

### 4.13 Pricing Section

**Purpose in Objection Flow**:
- **Most-aware flows**: **Early** (position 3-4) - they want the offer
- **Buy-now flows**: **Middle** (position 6-7) - after value established
- **Before objectionHandling**: Set up price objections

**Available Layouts**:
1. **ThreeTierPricing** - Classic 3-tier table
2. **ComparisonPricing** - Plan comparison with checkmarks
3. **SinglePrice** - One clear price point
4. **CustomQuote** - Enterprise "contact us"

**Hard Rules**:

**HR-4.13.1: MVP Stage = Usually Unavailable**
```
IF startupStage in ['pre-mvp', 'mvp-development']
THEN pricing section often removed (not finalized)
     Exception: If clear pricing exists, use SinglePrice
```

**HR-4.13.2: Most-Aware = Early Positioning**
```
IF awarenessLevel === 'most-aware'
THEN pricing section at position 3-4 (they want offer immediately)
     Use ThreeTierPricing OR SinglePrice (clear, upfront)
```

**HR-4.13.3: Custom Quote for Enterprise**
```
IF pricingModel === 'custom-quote'
   OR targetAudience === 'enterprise'
THEN use CustomQuote layout ("Contact sales")
```

**Flow-Aware Rules**:

**If early in flow** (most-aware):
- Pricing IS the value prop
- Use clear, simple layouts

**If middle flow** (buy-now):
- After features/results proved value
- Now justify price
- Use ComparisonPricing (show value per tier)

**If before objectionHandling**:
- Pricing sets up price objections
- Objection handling addresses "too expensive" concern

**Asset Requirements**:
- Requires finalized pricing information
- **ThreeTierPricing**: 3 distinct plans
- **CustomQuote**: No pricing needed

**Scoring Dimension Priority**:
1. **Awareness level** (5 points) - Most-aware wants it early
2. **Position in flow** (5 points) - NEW
3. Pricing model (4 points)
4. Landing goal (3 points)

---

### 4.14 Integration Section

**Purpose in Objection Flow**:
- **Middle flow** (position 5-7): **Address compatibility** concerns
- **Developer/Enterprise audiences**: **Technical validation**
- **After features**: Show **ecosystem fit**

**Available Layouts**:
1. **LogoGrid** - Partner/integration logos
2. **CategoryIntegrations** - Grouped by category (CRM, email, etc.)
3. **APIShowcase** - Technical integration details

**Hard Rules**:

**HR-4.14.1: No Integration Logos = Remove OR Text-Based**
```
IF !assetAvailability.integrationLogos
THEN IF marketCategory in ['Engineering & Development Tools']
       use APIShowcase (API-first messaging)
     ELSE remove Integration section
       mention compatibility in features section instead
```

**HR-4.14.2: Developer Tools = Required**
```
IF marketCategory in ['Engineering & Development Tools', 'Developer Tools & APIs']
   AND targetAudience in ['builders', 'developers']
THEN Integration section REQUIRED (position 5-6)
     Use APIShowcase OR CategoryIntegrations
```

**HR-4.14.3: Enterprise = Show Ecosystem**
```
IF targetAudience === 'enterprise'
   AND landingGoal === 'contact-sales'
THEN use CategoryIntegrations (comprehensive integration story)
```

**Flow-Aware Rules**:

**If previousSection is 'features'**:
- Features showed capabilities → Integration shows ecosystem fit
- Smooth transition: "Here's what it does → Here's how it fits"

**If flowTone is 'analytical'**:
- Use CategoryIntegrations (organized, comprehensive)

**Asset Requirements**:
- **LogoGrid** requires: integrationLogos (minimum 8-12 partners)
- **CategoryIntegrations** requires: integrationLogos grouped by type
- **APIShowcase** requires: API documentation (optional logos)

**Asset Substitution**:
```
IF Integration section planned AND !assetAvailability.integrationLogos
THEN IF API exists
       use APIShowcase (technical approach)
     ELSE remove section, add compatibility note to features
```

**Scoring Dimension Priority**:
1. **Asset availability** (CRITICAL: logos or API required)
2. **Market category** (5 points) - Developer tools need this
3. Target audience (4 points)
4. Landing goal (3 points)

---

### 4.15 Security Section

**Purpose in Objection Flow**:
- **Middle flow** (position 5-7): **Enterprise trust** building
- **Healthcare/Legal/Financial**: **Compliance validation**
- **After features, before results**: Technical confidence

**Available Layouts**:
1. **CertificationBadges** - SOC2, GDPR, HIPAA badges
2. **SecurityFeatures** - List of security capabilities
3. **ComplianceGrid** - Compliance standards matrix

**Hard Rules**:

**HR-4.15.1: Healthcare/Legal/Financial = Required**
```
IF marketCategory in [
     'Healthcare Technology',
     'Legal Technology',
     'Financial Services',
     'Personal Finance Management'
   ]
THEN Security section REQUIRED (position 5-6)
     Use CertificationBadges OR ComplianceGrid
```

**HR-4.15.2: Enterprise Audience = Required**
```
IF targetAudience === 'enterprise'
   AND landingGoal === 'contact-sales'
THEN Security section REQUIRED
     Use CertificationBadges (visible trust signals)
```

**HR-4.15.3: No Certifications = Features-Based**
```
IF !assetAvailability.securityCertifications
THEN use SecurityFeatures (security capabilities, not badges)
     OR remove section if not critical
```

**Flow-Aware Rules**:

**If before pricing**:
- Security validates value
- Justifies higher enterprise pricing

**If after features**:
- Features showed what it does → Security shows it's safe

**Asset Requirements**:
- **CertificationBadges** requires: securityCertifications (SOC2, GDPR, etc.)
- **SecurityFeatures** requires: Security documentation
- **ComplianceGrid** requires: Multiple compliance standards

**Asset Substitution**:
```
IF CertificationBadges selected AND !assetAvailability.securityCertifications
THEN use SecurityFeatures (capability-based security)
     OR if not critical, remove and mention in features
```

**Scoring Dimension Priority**:
1. **Market category** (CRITICAL: Required for regulated industries)
2. **Target audience** (5 points) - Enterprise needs this
3. Landing goal (4 points)
4. Asset availability (hard constraint)

---

### 4.16 Use Cases Section

**Purpose in Objection Flow**:
- **Middle flow** (position 5-7): Show **relevance** to user's situation
- **Multiple personas**: Different **use scenarios**
- **After features**: Apply capabilities to real situations

**Available Layouts**:
1. **PersonaUseCases** - Use cases by persona/role
2. **IndustryUseCases** - Use cases by industry
3. **ScenarioCards** - Specific scenario stories

**Hard Rules**:

**HR-4.16.1: Multiple Personas = Persona-Based**
```
IF targetAudience in ['businesses', 'enterprise', 'marketers']
   AND marketSophisticationLevel >= 'level-3'
THEN use PersonaUseCases (different roles see themselves)
```

**HR-4.16.2: After Features Positioning**
```
IF UseCases exists
THEN should follow features section
     Features = capabilities → UseCases = application
```

**Flow-Aware Rules**:

**If previousSection is 'features'**:
- Features showed what it does → UseCases shows how to use it
- Make use cases tie to feature highlights

**If flowTone is 'emotional'**:
- Use ScenarioCards (relatable stories)

**If flowTone is 'analytical'**:
- Use PersonaUseCases OR IndustryUseCases (organized)

**Asset Requirements**: None (use cases can be crafted)

**Scoring Dimension Priority**:
1. Target audience (4 points)
2. Market sophistication (3 points)
3. Previous section context (3 points) - NEW

---

### 4.17 Founder Note Section

**Purpose in Objection Flow**:
- **MVP/Early stage**: **Personal credibility** when no customer proof
- **Founder-led audiences**: **Authentic connection**
- **Substitutes testimonials**: When no testimonials available

**Available Layouts**:
1. **PersonalLetter** - Letter format with founder photo
2. **FounderStory** - Narrative story format
3. **VisionStatement** - Future-focused founder message

**Hard Rules**:

**HR-4.17.1: MVP Substitution for Testimonials**
```
IF startupStage in ['pre-mvp', 'mvp-development', 'mvp-launched']
   AND !assetAvailability.testimonials
   AND trust-building section needed
THEN use FounderNote section (personal credibility)
     Preferred layout: PersonalLetter OR FounderStory
```

**HR-4.17.2: Founder Audience = Recommended**
```
IF targetAudience in ['founders', 'creators']
   AND copyIntent === 'pain-led'
THEN FounderNote recommended (position 6-7)
     Use FounderStory (relatable journey)
```

**HR-4.17.3: No Founder Photo = Remove**
```
IF !assetAvailability.founderPhoto
THEN remove FounderNote section
     OR use text-only about section in footer
```

**Flow-Aware Rules**:

**If flowTone is 'emotional'**:
- Boost FounderStory (personal, relatable)

**If replaces testimonials**:
- Position where testimonials would go (position 6-7)
- Personal story builds trust similarly

**Asset Requirements**:
- **All layouts** require: founderPhoto (strongly recommended)
- **PersonalLetter** requires: founderPhoto + signature
- **FounderStory**: Founder background story

**Asset Substitution**:
```
IF FounderNote selected AND !assetAvailability.founderPhoto
THEN remove section OR add text-only founder bio to footer
```

**Scoring Dimension Priority**:
1. **Startup stage** (6 points) - MVP needs this
2. **Asset availability** (5 points) - Testimonials unavailable?
3. Target audience (4 points)
4. Copy intent (3 points)

---

### 4.18 CTA Section

**Purpose in Objection Flow**:
- **Always position -2** (second to last, before footer): **Close the deal**
- **After all objections handled**: Make the ask

**Available Layouts**:
1. **CenteredCTA** - Single, focused CTA button
2. **TwoStepCTA** - Primary + Secondary action
3. **FormCTA** - Embedded form for lead capture
4. **RiskReversalCTA** - CTA with guarantee/refund emphasis

**Hard Rules**:

**HR-4.18.1: Fixed Position**
```
CTA section ALWAYS at second-to-last position (before footer)
This is non-negotiable per section ordering rules
```

**HR-4.18.2: Buy-Now = Risk Reversal**
```
IF landingGoal in ['buy-now', 'subscribe']
   AND marketSophisticationLevel >= 'level-3'
THEN use RiskReversalCTA (reduce purchase anxiety)
```

**HR-4.18.3: Lead Capture Goals = Form CTA**
```
IF landingGoal in ['waitlist', 'early-access', 'demo', 'book-call']
THEN use FormCTA (collect info directly)
     Keep form simple (2-3 fields max)
```

**HR-4.18.4: Simple Goals = Centered CTA**
```
IF landingGoal in ['free-trial', 'signup', 'download']
THEN use CenteredCTA (single, clear action)
     Avoid decision paralysis with too many options
```

**Flow-Aware Rules**:

**After objectionHandling**:
- All barriers removed → Clear CTA
- Use simple, direct layout

**If flowTone is 'emotional'**:
- CTA copy should be encouraging, supportive
- "Start your journey" vs "Sign up now"

**If flowTone is 'analytical'**:
- CTA copy should be clear, value-focused
- "Get started - 14 day free trial"

**Asset Requirements**: None (button/form elements)

**Scoring Dimension Priority**:
1. **Landing goal** (6 points) - Determines CTA type
2. **Market sophistication** (4 points)
3. Flow tone (3 points) - NEW

---

### 4.19 Close Section

**Purpose in Objection Flow**:
- **Alternative to CTA**: More comprehensive closing section
- **High-friction goals**: Final push with multiple elements

**Available Layouts**:
1. **ValueRecapClose** - Recap benefits + CTA
2. **UrgencyClose** - Scarcity/urgency + CTA
3. **TestimonialClose** - Final testimonial + CTA

**Hard Rules**:

**HR-4.19.1: Close OR CTA, Usually Not Both**
```
Most flows use CTA section (simple)
Close section used for high-friction, complex sales
```

**HR-4.19.2: High-Friction = Close Section**
```
IF landingGoal in ['buy-now', 'contact-sales', 'subscribe']
   AND marketSophisticationLevel >= 'level-4'
THEN use Close section instead of simple CTA
     Use ValueRecapClose OR TestimonialClose
```

**Flow-Aware Rules**:

**If after long flow** (8+ sections):
- Use ValueRecapClose (remind them why they're here)

**If objections handled**:
- Use UrgencyClose (create action momentum)

**Scoring Dimension Priority**:
1. Landing goal (5 points)
2. Market sophistication (4 points)
3. Total sections in flow (3 points) - NEW

---

### 4.20 Header Section

**Purpose in Objection Flow**:
- **Always position 0** (very first): Navigation, branding

**Available Layouts**:
1. **SimpleHeader** - Logo + CTA button
2. **NavigationHeader** - Logo + nav links + CTA
3. **MinimalHeader** - Logo only

**Hard Rules**:

**HR-4.20.1: Landing Page = Simple**
```
For dedicated landing pages (not website homepage):
Use SimpleHeader OR MinimalHeader (avoid navigation distraction)
```

**HR-4.20.2: Website Integration = Navigation**
```
If landing page is part of larger website:
Use NavigationHeader (consistent with site navigation)
```

**Scoring Dimension Priority**:
1. Landing page type (standalone vs website)
2. Tone profile (2 points)

---

### 4.21 Footer Section

**Purpose in Objection Flow**:
- **Always position -1** (very last): Legal, secondary links, trust signals

**Available Layouts**:
1. **SimpleFooter** - Links + legal
2. **ComprehensiveFooter** - Sitemap-style with categories
3. **TrustFooter** - Trust badges + links + legal

**Hard Rules**:

**HR-4.21.1: Enterprise/Regulated = Trust Footer**
```
IF marketCategory in ['Healthcare Technology', 'Legal Technology', 'Financial Services']
   OR targetAudience === 'enterprise'
THEN use TrustFooter (security badges, certifications in footer)
```

**HR-4.21.2: Simple Landing Page = Simple Footer**
```
IF totalSectionsInFlow <= 6
THEN use SimpleFooter (don't overwhelm at the end)
```

**Scoring Dimension Priority**:
1. Market category (3 points)
2. Total sections in flow (3 points)

---

## 5. Implementation Priority System

### 5.1 Unified Weight System

**All pickers must use consistent weight values**:

1. **Objection purpose in flow** (5-6 points) - NEW, HIGHEST
   - What job does this section do RIGHT NOW?
   - Example: Problem at position 2, problem-aware = agitate (6pts for EmotionalQuotes)

2. **Asset availability** (hard constraint: -100 for impossible, +30 for boosted alternatives)
   - Cannot fake what we don't have
   - Smart substitution within section

3. **Audience sophistication + Awareness** (3-4 points)
   - How do they process information?
   - What's their mental starting state?

4. **Flow context** (3-4 points) - NEW
   - Previous section context (what tone was set?)
   - Next section context (where are we going?)
   - Position in flow (early/middle/late)

5. **Stage/Goal/Category context** (2-3 points)
   - Business context modifiers

6. **Tone/Style preferences** (1-2 points)
   - Fine-tuning, not primary driver

### 5.2 Hard Rules vs Scoring

**Use hard rules** (immediate return) for:
- Non-negotiable constraints (MVP stage = no metric-heavy results)
- Obvious perfect matches (Problem-aware early = agitate)
- Forbidden combinations (Free-trial + comparison table)

**Use scoring** for:
- Balancing multiple factors
- Gradual preferences
- Subtle optimizations

### 5.3 Implementation Phases

**Phase 1: Add Flow Context to Pickers** (Week 1)
- Extend `LayoutPickerInput` with flow context fields
- Update section selector to track and pass:
  - `sectionPurpose` (per section type + position)
  - `positionInFlow`, `totalSectionsInFlow`
  - `previousSection` context
  - `nextSection` context
  - `flowTone`, `flowComplexity`

**Phase 2: Implement Purpose-Based Hard Rules** (Week 2)
- Add hard rules to each picker based on section-specific rules above
- Priority: Problem, Features, Results, Testimonials (highest impact)

**Phase 3: Add Cross-Section Coherence** (Week 3)
- Implement flow tone tracking
- Pass tone/complexity to subsequent pickers
- Add scoring adjustments based on established flow

**Phase 4: Sequential Context Rules** (Week 4)
- Implement previous/next section awareness
- Add pairing rules (problem→beforeAfter, mechanism→results)
- "Before CTA" special handling

**Phase 5: Validation & Refinement** (Week 5)
- Test flows end-to-end
- Validate tonal consistency
- Refine scoring weights based on results

---

## 6. Asset-Aware Substitution Matrix

### 6.1 Layout-Level Substitution

**Within Section - Pick Different Layout**:

| Section | Primary Layout | Asset Required | Substitute Layout | Substitute Asset |
|---------|---------------|----------------|-------------------|------------------|
| Problem | BeforeImageAfterText | productImages | StackedPainBullets | None |
| BeforeAfter | BeforeAfterSlider | productImages | TextListTransformation | None |
| BeforeAfter | VisualStoryline | productImages | TextListTransformation | None |
| Features | SplitAlternating | productImages | IconGrid | None |
| Features | Carousel | productImages | MiniCards | None |
| Features | FeatureTestimonial | testimonials | IconGrid OR MetricTiles | None |
| Results | QuoteWithMetric | testimonials | StatBlocks OR BeforeAfterStats | Metrics |
| Testimonials | VideoTestimonials | videoTestimonials | TestimonialCards | testimonials |
| Social Proof | LogoGrid | customerLogos | StatsBar | userCount |
| Integration | LogoGrid | integrationLogos | APIShowcase | API docs |
| Security | CertificationBadges | certifications | SecurityFeatures | None |

### 6.2 Strategy-Level Substitution

**Entire Section Replacement**:

| Section Needed | Asset Missing | Startup Stage | Substitute Section | Reasoning |
|----------------|---------------|---------------|-------------------|-----------|
| Testimonials | testimonials | MVP | founderNote | Personal credibility |
| Testimonials | testimonials | Scaling | socialProof | Market validation |
| Results | metrics | MVP | beforeAfter | Vision-based |
| Social Proof | logos/stats | MVP | founderNote | Personal trust |
| Integration | logos | Any | Remove, mention in features | Avoid doubt |
| BeforeAfter | productImages | MVP | uniqueMechanism | Technical vision |

### 6.3 Objection Coverage Maintenance

**Never Leave Gaps**:

```
IF objection = "trust"
   AND testimonials section planned
   AND !assetAvailability.testimonials
THEN substitute section to maintain trust coverage:
     IF startupStage is MVP → founderNote
     ELSE IF customerLogos available → socialProof
     ELSE → beforeAfter (vision-based trust)

DO NOT simply remove testimonials (leaves trust gap)
```

**Key Principle**: Asset substitution should maintain objection flow coverage, not create gaps.

---

## 7. Validation Checklist

Before finalizing UIBlock selections, validate:

### ✅ Flow Context Applied
- [ ] All pickers receive flow context (purpose, position, previous, next, tone, complexity)
- [ ] Purpose-based hard rules implemented for critical sections
- [ ] Pickers understand their role in the objection journey

### ✅ Tonal Coherence
- [ ] Flow tone established by early sections
- [ ] Subsequent sections adjusted for tone consistency
- [ ] No emotional → analytical → emotional whiplash

### ✅ Complexity Alignment
- [ ] Flow complexity tracked (simple/moderate/detailed)
- [ ] Layouts maintain complexity level across sections
- [ ] No simple → complex → simple oscillation

### ✅ Sequential Context
- [ ] Previous section context influences current layout
- [ ] Next section context considered (especially before CTA)
- [ ] Pairing rules applied (problem→beforeAfter, mechanism→results)

### ✅ Visual Rhythm
- [ ] Dense and light sections alternated
- [ ] Breathing rhythm maintained (every 3rd section lighter)
- [ ] No 3+ heavy sections in a row

### ✅ Asset Availability
- [ ] All layouts have required assets OR smart substitution applied
- [ ] Layout-level substitution within sections
- [ ] Strategy-level substitution across sections (when needed)
- [ ] No objection gaps created by missing assets

### ✅ Hard Constraints Respected
- [ ] MVP stages never get metric-heavy results layouts
- [ ] Free-trial/personal categories exclude comparison
- [ ] Problem-aware flows have emotional validation early
- [ ] Forbidden section/layout combinations blocked

### ✅ Purpose Alignment
- [ ] Each layout choice serves its objection purpose
- [ ] Problem section agitates OR identifies (based on awareness)
- [ ] Results section validates previous claims (mechanism/features)
- [ ] Testimonials positioned to build trust at right moment

### ✅ Position Rules
- [ ] Early sections (3-4) set the tone
- [ ] Middle sections (5-7) educate → differentiate → prove
- [ ] Late sections (8-9) remove barriers, create urgency
- [ ] CTA always second-to-last, header first, footer last

---

## 8. Conclusion

UIBlock selection is not an isolated decision - it's a critical part of the objection flow journey.

**Key Takeaway**: The same section with different layouts can succeed or fail based on:
- Where it sits in the flow (position)
- What it's trying to achieve (purpose)
- What came before (previous context)
- What comes next (sequential planning)
- What tone was established (coherence)

**Implementation Priority**:
1. Add flow context to picker inputs (enables everything else)
2. Implement hard rules for critical sections (problem, features, results)
3. Add tone/complexity tracking and coherence scoring
4. Implement sequential context awareness

**Success Metrics**:
- ✅ Consistent tone across entire page
- ✅ Layouts match their purpose in the journey
- ✅ Adjacent sections complement each other
- ✅ No asset-driven gaps in objection coverage
- ✅ MVP stages never use inappropriate metric-heavy layouts
- ✅ User feedback: "The page flows naturally"

---

**Remember**: "What is this section trying to achieve RIGHT NOW, and which layout best serves that purpose?"
