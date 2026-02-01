# V3 Generation System

Single source of truth for AI-powered landing page generation.

**Enable:** `NEXT_PUBLIC_SIMPLIFIED_ONBOARDING_V3=true`

---

## 1. Quick Reference

### Core Types

```typescript
type LandingGoal = 'waitlist' | 'signup' | 'free-trial' | 'buy' | 'demo' | 'download';
type Vibe = 'Dark Tech' | 'Light Trust' | 'Warm Friendly' | 'Bold Energy' | 'Calm Minimal';
type Awareness = 'problem-aware-cold' | 'problem-aware-hot' | 'solution-aware-skeptical' | 'solution-aware-eager';
```

### 17 Sections

| Category | Sections |
|----------|----------|
| **Fixed** | Header, Hero, CTA, Footer |
| **Story** | Problem, BeforeAfter, Features, UniqueMechanism, HowItWorks |
| **Proof** | Testimonials, SocialProof, Results, FounderNote |
| **Conversion** | Pricing, ObjectionHandle, FAQ |
| **Targeting** | UseCases |

### 47 Active UIBlocks

| Section | UIBlocks |
|---------|----------|
| **Header** (1) | MinimalNavHeader |
| **Hero** (4) | LeftCopyRightImage, CenterStacked, SplitScreen, ImageFirst |
| **Problem** (1) | StackedPainBullets |
| **BeforeAfter** (3) | SideBySideBlocks, StackedTextVisual, SplitCard |
| **Features** (4) | IconGrid, SplitAlternating, MetricTiles, Carousel |
| **HowItWorks** (4) | ThreeStepHorizontal, VerticalTimeline, AccordionSteps, VideoWalkthrough |
| **UniqueMechanism** (6) | SecretSauceReveal, StackedHighlights, TechnicalAdvantage, MethodologyBreakdown, PropertyComparisonMatrix, ProcessFlowDiagram |
| **SocialProof** (1) | LogoWall |
| **Results** (3) | StatBlocks, StackedWinsList, ResultsGallery |
| **Testimonials** (4) | QuoteGrid, PullQuoteStack, VideoTestimonials, BeforeAfterQuote |
| **Pricing** (3) | TierCards, ToggleableMonthlyYearly, CallToQuotePlan |
| **ObjectionHandle** (2) | VisualObjectionTiles, MythVsRealityGrid |
| **FAQ** (4) | InlineQnAList, TwoColumnFAQ, AccordionFAQ, SegmentedFAQTabs |
| **UseCases** (3) | IndustryUseCaseGrid, PersonaGrid, RoleBasedScenarios |
| **FounderNote** (1) | LetterStyleBlock |
| **CTA** (3) | CenteredHeadlineCTA, VisualCTAWithMockup, ValueStackCTA |
| **Footer** (1) | ContactFooter |

---

## 2. Generation Flow

### Step 1: One-Liner
User provides product description.
```
"AI-powered invoice generator for freelancers"
```

### Step 2: Understanding
AI extracts (no web search):

| Field | Example |
|-------|---------|
| Categories | Invoicing, Accounting |
| Target Audiences | Freelancers, Small businesses |
| What it does | Creates invoices via AI chat |
| Features | AI-powered creation, Multi-currency, Payment reminders |

User confirms/edits on one screen.

### Step 3: Landing Goal
"What should visitors do?"

| Goal | Label |
|------|-------|
| waitlist | Join waitlist |
| signup | Sign up / Start free |
| free-trial | Start free trial |
| buy | Buy now / Subscribe |
| demo | Book demo |
| download | Download app |

### Step 4: Offer
"What does user get?"
- Example: "14-day free trial, no credit card required"

### Step 5: Asset Availability

**Main assets** (checkboxes):
| Asset | Enables |
|-------|---------|
| Testimonials | Testimonials section |
| Social Proof | SocialProof section |
| Concrete Results | Results section |
| Demo Video | VideoWalkthrough UIBlock |

**Testimonial type** (if hasTestimonials):
- Text quotes
- Photos with quotes
- Video testimonials
- Transformation stories

**Social proof types** (if hasSocialProof):
- Company/client logos
- Media mentions
- Certifications/badges

### Step 6: Strategy (API: `/api/v3/strategy`)

Single AI call generates:

```json
{
  "awareness": "solution-aware-skeptical",

  "oneReader": {
    "who": "Freelance designer billing 5+ clients monthly",
    "coreDesire": "Get paid faster without awkward follow-ups",
    "corePain": "Chasing payments feels unprofessional",
    "pains": ["Late payments", "Invoice formatting"],
    "desires": ["Automated reminders", "Professional look"],
    "objections": ["Is my data secure?", "Will clients trust AI invoices?"]
  },

  "oneIdea": {
    "bigBenefit": "Spend time on creative work, not admin",
    "uniqueMechanism": "AI creates invoices from a chat",
    "reasonToBelieve": "10,000+ freelancers, avg 14 days faster"
  },

  "vibe": "Light Trust",

  "featureAnalysis": [
    {
      "feature": "AI invoice creation",
      "benefit": "Create invoices in seconds",
      "benefitOfBenefit": "Spend time on creative work"
    }
  ],

  "sectionDecisions": {
    "includeBeforeAfter": false,
    "includeUniqueMechanism": true,
    "includeObjectionHandle": true,
    "isB2B": false
  },

  "uiblockDecisions": {
    "productType": "visual-ui-supports",
    "featuresUIBlock": "IconGrid",
    "uniqueMechanismUIBlock": "SecretSauceReveal",
    "pricingUIBlock": "TierCards",
    "objectionHandleUIBlock": "VisualObjectionTiles",
    "audienceType": "roles",
    "faqQuestionCount": 6
  }
}
```

### Step 7: Section Selection (Deterministic)

#### Awareness Levels

| Level | Description |
|-------|-------------|
| **problem-aware-cold** | Knows problem, low urgency. Needs reminder why it matters. |
| **problem-aware-hot** | Feels pain intensely. "Hair on fire" problem. |
| **solution-aware-skeptical** | Tried alternatives. Needs convincing why THIS is different. |
| **solution-aware-eager** | Ready to act. Just confirming right choice. |

#### Templates

**Waitlist (pre-product):**
UniqueMechanism always included, LLM section decisions ignored.
```
Header → Hero → [Problem if cold] → UniqueMechanism → Features → [UseCases] → HowItWorks → Trust → CTA → Footer
```

**Product Ready:**

| Awareness | Template |
|-----------|----------|
| cold | Hero → Problem → [LLM sections] → Trust → Features → [UseCases] → HowItWorks → Pricing → CTA → FAQ |
| hot | Hero → [LLM sections] → Trust → Features → [UseCases] → HowItWorks → Pricing → CTA → FAQ |
| skeptical | Hero → Trust → [LLM sections + ObjectionHandle] → Features → [UseCases] → HowItWorks → Pricing → CTA → FAQ |
| eager | Hero → Features → [UseCases] → HowItWorks → Trust → Pricing → CTA → FAQ |

**LLM sections** = BeforeAfter → UniqueMechanism → ObjectionHandle (in order if included)

**Trust order** = Results → Testimonials → SocialProof → FounderNote (include available, FounderNote only if <2 others)

**UseCases** = only if `isB2B AND hasMultipleAudiences`

### Step 8: UIBlock Selection (Deterministic)

| Section | Selection Logic |
|---------|-----------------|
| **Header** | Always: MinimalNavHeader |
| **Hero** | waitlist→CenterStacked, behind-scenes→CenterStacked, visual+no-proof→CenterStacked, visual-ui-hero→ImageFirst, visual-ui-supports→LeftCopyRightImage (Dark Tech/Bold Energy→SplitScreen) |
| **Problem** | Always: StackedPainBullets |
| **BeforeAfter** | Rhythm: prev horiz/grid→SideBySideBlocks\|StackedTextVisual, else→SplitCard |
| **Features** | From LLM: IconGrid\|MetricTiles\|Carousel\|SplitAlternating |
| **HowItWorks** | hasDemoVideo→VideoWalkthrough, else rhythm: prev horiz/grid→AccordionSteps\|VerticalTimeline, else→ThreeStepHorizontal |
| **UniqueMechanism** | From LLM: 6 options based on mechanism type |
| **SocialProof** | Always: LogoWall |
| **Testimonials** | Matrix by type×B2B: text→QuoteGrid\|PullQuoteStack, photos→QuoteGrid, video→VideoTestimonials, transformation→BeforeAfterQuote |
| **Results** | visual-ui-hero→ResultsGallery, else rhythm: prev horiz/grid→StackedWinsList, else→StatBlocks |
| **Pricing** | From LLM: TierCards\|ToggleableMonthlyYearly\|CallToQuotePlan |
| **ObjectionHandle** | From LLM: VisualObjectionTiles\|MythVsRealityGrid |
| **FAQ** | By count: ≤6→InlineQnAList, ≤10→TwoColumnFAQ, ≤14→AccordionFAQ, >14→SegmentedFAQTabs |
| **UseCases** | industry→IndustryUseCaseGrid, roles→rhythm: prev horiz/grid→RoleBasedScenarios, else→PersonaGrid |
| **FounderNote** | Always: LetterStyleBlock |
| **CTA** | buy→ValueStackCTA, visual→VisualCTAWithMockup, else→CenteredHeadlineCTA |
| **Footer** | Always: ContactFooter |

**Rhythm tracking:** Alternate horiz/vert/grid layouts for visual variety.

### Step 9: Copy Generation (API: `/api/v3/generate-copy`)

Single AI call generates all section content.

**Input:** Strategy + UIBlocks + product context
**Output:** JSON with section content matching element schemas

### Step 10: Page Assembly
- Layout: Sections in order with UIBlocks
- Design: Vibe-derived theme
- Copy: AI-generated content
- Images: Pexels placeholders
- Flags: `ai_generated_needs_review` marked "Verify this"

---

## 3. Element Schema

### Fill Modes

| fillMode | Who Generates | Display |
|----------|---------------|---------|
| `ai_generated` | AI | Display directly |
| `ai_generated_needs_review` | AI | Display with "verify" badge |
| `manual_preferred` | - | Show placeholder, user can delete |
| `system` | Code | Auto-generated (IDs) |

### Requirements

| requirement | Meaning |
|-------------|---------|
| `required` | AI always generates |
| `optional` | AI decides based on storyline |

### Schema Structure

```typescript
const UIBlockSchema = {
  sectionType: "UIBlockName",

  elements: {
    headline: { type: "string", requirement: "required", fillMode: "ai_generated" },
    hero_image: { type: "string", fillMode: "manual_preferred", default: "/placeholder.jpg" },
    customer_count: { type: "string", requirement: "optional", fillMode: "ai_generated_needs_review" },
  },

  collections: {
    features: {
      requirement: "required",
      fillMode: "ai_generated",
      constraints: { min: 3, max: 9 },
      fields: {
        id: { type: "string", fillMode: "system" },
        title: { type: "string", fillMode: "ai_generated" },
        description: { type: "string", fillMode: "ai_generated" },
        icon: { type: "string", fillMode: "manual_preferred" },
      }
    }
  }
};
```

### Data Format Principles

1. **Arrays as source of truth** - no pipe-separated strings
2. **System-generated IDs** - each array item has `id`
3. **No `___REMOVED___` markers** - actually delete
4. **AI output = DB format = Component format**

### Icon Handling

Icons are `manual_preferred` with no default in schema. Smart default computed at render:
```tsx
const iconName = item.icon ?? getIconFromText(item.title, item.description) ?? "Sparkles";
const Icon = LucideIcons[iconName] ?? LucideIcons.Sparkles;
```

---

## 4. Design System

### Vibes

| Vibe | Background | Accent | Primary Font | Body Font |
|------|------------|--------|--------------|-----------|
| Dark Tech | dark gradients | High energy | Sora | Inter |
| Light Trust | light gradients | Medium | Inter | Inter |
| Warm Friendly | warm tones | Medium-warm | DM Sans | DM Sans |
| Bold Energy | vibrant gradients | High | Sora | DM Sans |
| Calm Minimal | neutral | Low | Playfair Display | Inter |

### Placeholder Images

| Vibe | Pexels Keywords |
|------|-----------------|
| Dark Tech | technology dark modern abstract |
| Light Trust | business professional clean minimal |
| Warm Friendly | people collaboration team warm |
| Bold Energy | creative vibrant dynamic startup |
| Calm Minimal | minimal simple clean neutral |

---

## 5. API Reference

### `/api/v3/strategy`
**Cost:** 2 credits

**Request:**
```typescript
{
  productName: string;
  oneLiner: string;
  features: string[];
  landingGoal: LandingGoal;
  offer: string;
  primaryAudience: string;
  otherAudiences: string[];
  categories: string[];
  hasMultipleAudiences: boolean;
  // Assets
  hasTestimonials: boolean;
  hasSocialProof: boolean;
  hasConcreteResults: boolean;
  hasDemoVideo: boolean;
  testimonialType: 'text' | 'photos' | 'video' | 'transformation' | null;
  socialProofTypes: { hasLogos, hasMediaMentions, hasCertifications } | null;
}
```

**Response:** Strategy JSON + sections array + uiblocks map

### `/api/v3/generate-copy`
**Cost:** 3 credits

**Request:**
```typescript
{
  strategy: SimplifiedStrategyOutput;
  uiblocks: Record<string, string>;
  productName: string;
  oneLiner: string;
  offer: string;
  landingGoal: LandingGoal;
  features: string[];
}
```

**Response:** Section content map

---

## 6. Key Files

| File | Purpose |
|------|---------|
| `src/app/api/v3/strategy/route.ts` | Strategy endpoint |
| `src/app/api/v3/generate-copy/route.ts` | Copy generation endpoint |
| `src/modules/strategy/promptsV3.ts` | Strategy prompt builder |
| `src/modules/strategy/sectionSelectionV3.ts` | Deterministic section selection |
| `src/modules/uiblock/selectUIBlocksV3.ts` | Deterministic UIBlock selection |
| `src/modules/uiblock/layoutNames.ts` | Active layout registry (source of truth) |
| `src/modules/copy/copyPromptV3.ts` | Copy prompt builder |
| `src/modules/sections/layoutElementSchema.ts` | Element schemas per UIBlock |
| `src/lib/schemas/strategyV3.schema.ts` | Zod validation schemas |
| `src/types/generation.ts` | Type definitions |
| `src/hooks/useGenerationStore.ts` | Client-side flow state |

---

## 7. V3 vs Legacy

| Aspect | Legacy | V3 |
|--------|--------|-----|
| Research (IVOC) | Perplexity/Tavily web search | Skipped |
| Section selection | AI decides | Deterministic templates |
| UIBlock selection | AI + user questions | Deterministic + LLM hints |
| UIBlocks | 88+ | 47 (streamlined) |
| Picker files | 21 files | Archived (not used) |
| Element schemas | Pipe-separated strings | Clean arrays with IDs |

---

## Appendix: Section Reference

| Section | What It Answers |
|---------|-----------------|
| Hero | Hook + promise + primary CTA |
| Problem | "Do you understand my pain?" |
| BeforeAfter | Transformation visualization |
| UniqueMechanism | "Why is this different?" |
| Features | "What do I get?" |
| HowItWorks | "How do I use it?" |
| UseCases | "Is this for me?" |
| Testimonials | "Are there people like me?" |
| SocialProof | "Is this legit? Who else uses this?" |
| Results | "Does it work?" |
| Pricing | "How much?" |
| ObjectionHandle | "What about [risk]?" |
| FAQ | Small questions |
| FounderNote | "Who's behind this?" |
| CTA | Final conversion push |

---

## Appendix: UIBlock Orientation

Used for rhythm-based selection:

| Orientation | UIBlocks |
|-------------|----------|
| **horizontal** | ThreeStepHorizontal, StatBlocks, PersonaGrid, etc. |
| **vertical** | VerticalTimeline, StackedWinsList, AccordionSteps, etc. |
| **grid** | IconGrid, QuoteGrid, TierCards, etc. |

Previous section orientation tracked to alternate layouts.
