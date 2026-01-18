# New Generation System - Agreed Decisions

## Overview

This document captures all decisions made for simplifying the landing page generation system. The goal is to replace ~12,500 LOC of complex rules with a simpler, AI-driven approach.

---

## Prerequisite

The entire taxonomy file becomes useless.. to be deleted../ 

Whatever remains.. for example below can be done via type system


  type LandingGoal = 'waitlist' | 'signup' | 'free-trial' | 'buy' | 'demo' | 'download';
  type Vibe = 'Dark Tech' | 'Light Trust' | 'Warm Friendly' | 'Bold Energy' | 'Calm Minimal';
  type PricingModel = 'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based' | 'enterprise';

## Generation Flow (User Journey)

### Step Details

#### Step 1: One-Liner
User provides product description.
```
"AI-powered invoice generator for freelancers"
```

#### Step 2: Understanding + Features (Always Show)
AI extracts from one-liner (no web search, pure comprehension):

| Field | Example (Invoce.ai) |
|-------|---------------------|
| **Categories** | Invoicing, Accounting (can be multiple) |
| **Target Audiences** | Freelancers, Small businesses (can be multiple) |
| **What it does** | Creates invoices via AI chat |
| **Key features** | AI-powered creation, Multi-currency, Payment reminders |

**AI Output:**

```json
{
  "categories": ["Invoicing", "Accounting"],
  "audiences": ["Freelancers", "Small businesses"],
  "whatItDoes": "Creates invoices via AI chat",
  "features": [
    "AI-powered invoice creation",
    "Multi-currency support",
    "Payment reminders"
  ]
}
```

**Always show playback** — no confidence logic.

Why:
- Multiple categories/audiences = AI can miss some
- Features can't be reliably inferred from one-liner
- User validation improves downstream quality
- One screen is acceptable friction

**UI (one screen):**

```
┌─────────────────────────────────────────────────┐
│ We understood your product as:                  │
│                                                 │
│ Category:                                       │
│ [Invoicing ×] [Accounting ×] [+ Add]           │
│                                                 │
│ Target audience:                                │
│ [Freelancers ×] [Small businesses ×] [+ Add]   │
│                                                 │
│ What it does:                                   │
│ [Creates invoices via AI chat              ]   │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Key features we found:                          │
│ [☑ AI-powered invoice creation             ]   │
│ [☑ Multi-currency support                  ]   │
│ [☑ Payment reminders                       ]   │
│ [☑ Client management                       ]   │
│ [+ Add feature]                                 │
│                                                 │
│           [Looks good]                          │
└─────────────────────────────────────────────────┘
```

**Format choices:**
- Tags/chips for categories + audiences (multi-value, add/remove)
- Text field for "what it does"
- Checklist for features (add/remove)
- One screen, clear sections

**Note:** Startup Stage removed - asset availability + landing action provide sufficient signals for all downstream decisions.

#### Step 3: Landing Action + Offer
Two inputs that define page purpose:

**Question 1:** "What should visitors do on your page?"

**6 Landing Goals (simplified from 12):**

| Goal | Label | Behavior |
|------|-------|----------|
| **waitlist** | Join waitlist | Pre-launch, email capture |
| **signup** | Sign up / Start free | Self-serve, freemium |
| **free-trial** | Start free trial | Self-serve, time-limited |
| **buy** | Buy now / Subscribe | Transaction, needs pricing |
| **demo** | Book demo / Talk to sales | Sales-led, full form |
| **download** | Download app | App/extension, store links |

**Question 2:** "What does the user get in exchange?"

| Input | Example |
|-------|---------|
| Landing goal | "signup" |
| What user gets | "14-day free trial, no credit card required" |

**The offer input helps AI judge friction level:**
- signup + free trial no CC = low friction
- signup + requires payment = medium friction
- demo + enterprise pricing = high friction

This informs:
- **Friction level** in strategy phase
- **One Action** (derived from landing goal)
- **CTA copy** throughout page
- **Section selection** (waitlist doesn't need pricing, buy-now does)
- **Form complexity** (email only vs full form)

#### Step 4: Asset Availability
User confirms what assets they have via simple checkboxes.

| Asset | What It Enables |
|-------|-----------------|
| testimonials | Testimonials section inclusion |
| socialProof (logos, ratings, user counts — whatever you have) | SocialProof section inclusion |
| concreteResults | Results section inclusion |

**3 checkboxes only.** These affect SECTION selection.

All other asset questions (demo video, feature images, step images, etc.) are asked post-section-selection for UIBlock selection.

**Assumptions:**
- Founder photo always available (not asked)

#### Step 5: Research

| Research Type | Approach | Cost |
|---------------|----------|------|

| **IVOC (Voice of Customer)** | Tavily search + LLM extraction | ~$0.05 |

**IVOC System: Tavily-Based**

```
One-liner
    ↓
LLM classifies: Audience + Category
    ↓
Tavily search: "[category] [audience] pain points reviews"
    ↓
LLM extracts IVOC schema
    ↓
Store result in database (for future use)
    ↓
Feed to copy generation
```

**IVOC Schema (what we extract):**
```json
{
  "pains": ["Chasing payments", "Looking unprofessional"],
  "desires": ["Get paid faster", "Look legit"],
  "objections": ["Is it secure?", "Hidden fees?"],
  "firmBeliefs": ["Clients always pay late"],
  "shakableBeliefs": ["I need an accountant"],
  "commonPhrases": ["get paid faster", "in seconds"]
}
```

**Database accumulation:**
- Every Tavily result stored with audience + category key
- Builds pre-built database organically over time
- Future: lookup first, Tavily fallback (see productBacklog.md)

**Database Schema (IVOCCache table):**

```prisma
model IVOCCache {
  id              String   @id @default(cuid())

  // Lookup keys (composite unique)
  category        String   // "Invoicing", "Project Management"
  audience        String   // "Freelancers", "Small businesses"

  // IVOC data
  pains           String[] // ["Chasing payments", "Looking unprofessional"]
  desires         String[] // ["Get paid faster", "Look legit"]
  objections      String[] // ["Is it secure?", "Hidden fees?"]
  firmBeliefs     String[] // ["Clients always pay late"]
  shakableBeliefs String[] // ["I need an accountant"]
  commonPhrases   String[] // ["get paid faster", "in seconds"]

  // Metadata
  sourceQuery     String   // Tavily query used
  sourceUrls      String[] // URLs Tavily pulled from
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  usageCount      Int      @default(1) // Track reuse frequency

  @@unique([category, audience])
  @@index([category])
  @@index([audience])
}
```

**Lookup Flow:**
```
1. User confirms category + audience (from Step 2)
           ↓
2. Query: SELECT * FROM IVOCCache WHERE category = X AND audience = Y
           ↓
3. Found? → Use cached IVOC, increment usageCount
   Not found? → Tavily search → LLM extract → INSERT new row
```

**MVP approach:**
- Exact match only (no fuzzy matching)
- First category + first audience used for lookup
- No TTL (cache forever)
- Future: embeddings for fuzzy match, merge strategies

**Total research cost:** ~$0.05-0.06/generation (skipped if cache hit)

#### Step 6: Strategy + Section Selection

One API call that does:
1. Generate One Reader (full profile)
2. Generate One Idea (full argument)
3. Determine vibe
4. Simulate objections → Select sections

**Strategy Output Schema:**

```json
{
  "vibe": "Light Trust",

  "oneReader": {
    "who": "Freelance designer billing 5+ clients monthly",
    "coreDesire": "Get paid faster without awkward follow-ups",
    "corePain": "Chasing payments feels unprofessional",
    "beliefs": "Clients always pay late, invoicing is tedious",
    "awareness": "Solution-aware",
    "sophistication": "Medium",
    "emotionalState": "Frustrated"
  },

  "featureAnalysis": [
    {
      "feature": "AI invoice creation",
      "benefit": "Create invoices in seconds",
      "benefitOfBenefit": "Spend time on creative work, not admin"
    },
    {
      "feature": "Multi-currency support",
      "benefit": "Bill international clients easily",
      "benefitOfBenefit": "Grow your business globally"
    },
    {
      "feature": "Payment reminders",
      "benefit": "Auto-follow-up on late payments",
      "benefitOfBenefit": "Never feel awkward chasing money"
    }
  ],

  "oneIdea": {
    "bigBenefit": "Spend time on creative work, not admin",
    "uniqueMechanism": "AI creates and sends invoices from a chat",
    "reasonToBelieve": "10,000+ freelancers, avg 14 days faster payment"
  },

  "objections": [
    { "thought": "Will clients take AI invoices seriously?", "section": "SocialProof" },
    { "thought": "How does it actually work?", "section": "HowItWorks" },
    { "thought": "Is my payment info secure?", "section": "FAQ" },
    { "thought": "What do other freelancers say?", "section": "Testimonials" }
  ],

  "sections": ["Header", "Hero", "SocialProof", "HowItWorks", "Features", "Testimonials", "CTA", "FAQ", "Footer"]
}
```

**Field Definitions:**

| Field | Purpose |
|-------|---------|
| `vibe` | Design direction (Dark Tech, Light Trust, Warm Friendly, Bold Energy, Calm Minimal) |
| `oneReader` | Full profile of ONE specific person |
| `featureAnalysis` | Each feature → benefit → benefit of benefit (for One Reader) |
| `oneIdea` | Complete argument: benefit + mechanism + proof (derived from strongest BoB) |
| `objections` | Simulated objection sequence with mapped sections |
| `sections` | Final ordered section list (deduplicated) |

**Feature Analysis:**

| Field | Description |
|-------|-------------|
| `feature` | What it does (from Step 2) |
| `benefit` | What it means for the user |
| `benefitOfBenefit` | Deeper emotional/life outcome for One Reader |

Why feature analysis:
- One Idea emerges from strongest benefit-of-benefit
- Features section copy is benefit-focused
- Consistency between features and One Idea
- Ties features to One Reader's desires/pains

**One Reader Fields:**

| Field | Description |
|-------|-------------|
| `who` | Specific person description |
| `coreDesire` | What they want most |
| `corePain` | What hurts most |
| `beliefs` | About themselves, world, industry |
| `awareness` | Unaware / Problem-aware / Solution-aware / Product-aware / Most-aware |
| `sophistication` | Low / Medium / High (how many similar solutions seen) |
| `emotionalState` | Overwhelmed / Neutral / Motivated / Skeptical |

**One Reader vs Personas (Clarification):**

Step 2 may capture multiple audiences (e.g., "Freelancers, Small businesses"). How these relate:

| Concept | Purpose | Scope |
|---------|---------|-------|
| **One Reader** | Primary conversion target | Single person, drives copy tone + objection sequence |
| **Personas** | Secondary segments | Multiple, shown in persona-aware UIBlocks |

**Relationship:**
- AI picks ONE primary audience → becomes One Reader (drives entire page voice)
- Other audiences → available as personas for specific UIBlocks (PersonaGrid, PersonaPanels, etc.)
- Persona-aware UIBlocks only selected when `hasPersonas=true` (multiple audiences confirmed)

**One Idea Fields:**

| Field | Description |
|-------|-------------|
| `bigBenefit` | What they get (outcome) |
| `uniqueMechanism` | Why this works differently (the "how" that makes it believable) |
| `reasonToBelieve` | Proof points (stats, testimonials, credentials) |

**Section Selection Logic (Option B):**

```
AI role-plays as One Reader seeing One Idea:
"What goes through my mind before I take action?"
        ↓
Generates objection sequence
        ↓
For each objection → picks best section to answer it
        ↓
Deduplicates (same section from multiple objections = one)
        ↓
Outputs ordered section list
```

See Appendix "Option B — AI-Direct Section Selection" for full details.

**Not in Strategy (handled elsewhere):**
- oneOffer → User input in Step 3
- oneAction → Derived from landing goal
- assets → From Step 4 checkboxes
- features → From Step 2

**How Strategy Feeds Downstream:**

| Decision | Uses |
|----------|------|
| Background, Accent, Font | `vibe` → Step 7 |
| Section selection | `objections` → `sections` |
| UIBlock selection | `vibe`, `oneReader.emotionalState`, `oneReader.sophistication` |
| Copy generation | `oneReader`, `oneIdea`, `featureAnalysis`, `objections` |

#### Step 7: Design (Automatic)

Derives visual design from `vibe`. No API call — simple mappings.

**Background Selection:**
```
vibe → background archetype → random from pool
```

| Vibe | Background Archetype |
|------|---------------------|
| Dark Tech | dark gradients, deep colors |
| Light Trust | light gradients, soft colors |
| Warm Friendly | warm tones, soft gradients |
| Bold Energy | vibrant gradients, high contrast |
| Calm Minimal | neutral, minimal patterns |

**Accent Color Selection:**
```
vibe → accent energy → filter by baseColor + energy → random
```

| Vibe | Accent Energy |
|------|---------------|
| Dark Tech | High (vibrant accents on dark) |
| Light Trust | Medium (professional accents) |
| Warm Friendly | Medium-warm (approachable accents) |
| Bold Energy | High (saturated, attention-grabbing) |
| Calm Minimal | Low (subtle accents) |

**Font Selection:**
```
vibe → font theme
```

| Vibe | Primary Font | Body Font |
|------|-------------|-----------|
| Dark Tech | Sora | Inter |
| Light Trust | Inter | Inter |
| Warm Friendly | DM Sans | DM Sans |
| Bold Energy | Sora | DM Sans |
| Calm Minimal | Playfair Display | Inter |

See sections "1. Background Selection", "2. Accent Color Selection", "6. Font Selection" for detailed mapping tables.

#### Step 8: UIBlock Selection

For each section, AI selects the best UIBlock.

**Process:**
1. AI attempts auto-selection from context (vibe, oneReader, assets)
2. If unclear → generates questions for user
3. User answers in batch (one screen)
4. AI finalizes UIBlock selection

**Page composition rules (built into AI prompt):**
- Max 2 text-heavy blocks in sequence
- Max 1 accordion-style block per page
- At least 1 image-based block in middle sections
- Vary layouts for visual interest

See Appendix "UIBlock Selection Flow" for full details.

#### Step 9: Copy Generation

Single API call generates copy for all sections.

**Input:**
- Strategy (oneReader, oneIdea, featureAnalysis, objections)
- Sections + UIBlocks
- Element schema per UIBlock

**Output:**
- Copy for all `ai_generated` elements
- Placeholders for `ai_generated_needs_review` elements (user verifies)

See Appendix "Copy Generation Flow" for full details.

#### Step 10: Page Assembly + Guidance

Assemble final page with all components:

- **Layout:** Sections in order with selected UIBlocks
- **Design:** Background, accent, fonts from Step 7
- **Copy:** AI-generated content from Step 9
- **Images:** Placeholders (Pexels/stock) for user to replace
- **Flags:** `ai_generated_needs_review` elements marked "⚠️ Verify this"
- **Guidance:** Clear prompts — "Upload your logo", "Replace hero image", "Verify these stats"

---

## Placeholder Images Strategy

### Problem
At generation time, what images to show? Needs to:
1. Not spoil wow factor (look polished, not broken)
2. User understands they should replace (not mistake for final)
3. Be contextually appropriate where possible

### Image Taxonomy

| Type | Examples | Can Auto-Select? | Approach |
|------|----------|------------------|----------|
| **Product Visual** | Hero screenshot, product mockup | ✗ No | Pexels context-matched |
| **Process Visual** | Step images, flow diagrams | ✓ Partial | Pexels vibe-matched |
| **Feature Visual** | Feature screenshots, demos | ✓ Partial | Pexels vibe-matched |
| **Founder/Team** | Founder photo, team pics | ✗ No | Silhouette placeholder |
| **Customer Faces** | Testimonial avatars | ✗ No | Initials circle |
| **Results/Output** | User-generated gallery | ✗ No | Upload UI placeholder |

### Strategy by Image Type

**1. Hero Image**
- **Source:** Pexels API, context-matched
- **Query:** `{category} {vibe keywords} business`
- **Example:** "Invoicing professional business software"
- **Fallback:** Vibe-matched generic tech/business image

**2. Feature/Step Visuals**
- **Source:** Pexels API, vibe-matched (decorative)
- **Query:** Based on vibe, not product-specific
- **Rationale:** Less pressure to replace, adds visual polish

| Vibe | Pexels Query Keywords |
|------|----------------------|
| Dark Tech | technology dark modern abstract |
| Light Trust | business professional clean minimal |
| Warm Friendly | people collaboration team warm |
| Bold Energy | creative vibrant dynamic startup |
| Calm Minimal | minimal simple clean neutral |

**3. Founder/Customer Photos**
- **Source:** Static placeholder (silhouette, initials)
- **Rationale:** Must be real, cannot fake
- **Current approach correct** - no change needed

### Pexels Integration

**Already integrated:** `src/services/pexelsApi.ts`

**Free plan limits (sufficient for MVP):**
- 200 requests/hour
- 20,000 requests/month
- ~6,600 page generations/month capacity

**Optimization:**
- Use `per_page=80` to batch fetch
- Cache responses 24hrs (same vibe/category = reuse)
- One call per image type, not per image

**Attribution required:**
- Footer link: "Photos by Pexels" or per-image photographer credit

### UX Signal for Placeholders

User must understand: "This is a suggestion, not final"

**Options (TBD which to implement):**
- Subtle badge overlay: "Stock photo - click to replace"
- Different border treatment for placeholder images
- First-time tooltip: "Replace placeholder images with your own"
- Editor guidance panel highlighting images to replace

### Implementation Notes

**At generation time (Step 10: Page Assembly):**
```
1. For each image slot in selected UIBlocks:
   - Determine image type (hero, feature, step, founder, etc.)
   - If auto-selectable → Pexels query based on vibe/category
   - If not → use static placeholder
2. Store Pexels image URLs in content
3. Flag as `placeholder: true` for editor UI treatment
```

**Cache strategy:**
```
Key: {vibe}:{category}:{image_type}
Value: Array of Pexels image URLs
TTL: 24 hours
```

### Image Sizing & Aspect Ratios

**Current State (Problems):**
- UIBlocks use fixed heights (`h-80`, `h-96`, `min-h-[500px]`) with `object-cover`
- No CSS `aspect-ratio` property used anywhere
- Portrait image in landscape slot = aggressive cropping, bad results
- No upload validation for aspect ratio mismatch
- Pexels queries don't filter by orientation

**Current UIBlock Image Handling:**

| UIBlock | Image Slot | Height | Fit | Issue |
|---------|------------|--------|-----|-------|
| Hero/LeftCopyRightImage | hero_image | `min-h-[500px]` | cover | Tall images make section huge |
| FounderNote | story_image | `h-96` (384px) | cover | Portrait expected but not enforced |
| FounderNote | secondary_image | `h-64` (256px) | cover | Fixed crop |
| Features/SplitAlternating | feature_visual_N | `h-80` (320px) | cover | Fixed crop |
| BeforeAfter | before/after_visual | `h-80` (320px) | cover | Fixed crop |
| Results/ResultsGallery | image_N | `h-auto` | contain | Only block with flexible height |

**Agreed Solution (implement at build time):**

1. **Pexels orientation filter** - Query with `orientation=landscape|portrait|square` based on slot
2. **CSS aspect-ratio** - Replace fixed heights with `aspect-ratio: 16/9` etc.
3. **Upload validation** - Soft warning on mismatch, offer crop tool
4. **Per-slot schema** - Define expected aspect ratio per image slot

**Expected Aspect Ratios by Section:**

| Section | Orientation | Aspect Ratio |
|---------|-------------|--------------|
| Hero | landscape | 16:9 or 4:3 |
| Features | landscape | 16:9 |
| HowItWorks steps | landscape | 16:9 |
| FounderNote main | portrait/square | 3:4 or 1:1 |
| FounderNote secondary | landscape | 16:9 |
| Results gallery | any | preserve original |
| BeforeAfter | landscape | 16:9 |

**Image Slot Schema (future implementation):**

```typescript
interface ImageSlot {
  key: string;                    // "hero_image", "feature_visual_0"
  expectedAspectRatio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  preferredOrientation: 'landscape' | 'portrait' | 'square';
  minWidth?: number;              // e.g., 800
  containerStrategy: 'aspect-ratio' | 'fixed-height' | 'auto';
}
```

**Implementation priority:**
1. First: Pexels orientation filter (auto-selection fix)
2. Second: CSS aspect-ratio on containers (display fix)
3. Third: Upload validation + crop tool (user upload fix)

---

## 8. Brand Assets

### Signup
- **Auth only** - name/email
- No brand questions at signup

### Brand Assets Collection
- Collected in **Editor** (Brand Assets section)
- Also accessible in **Dashboard**
- Clearly labeled as **account-wide** (applies to all landing pages)

### Brand Assets

| Asset | Use |
|-------|-----|
| Logo | Header, footer |
| Founder photo | FounderNote section |
| Company name | Footer, legal, copy |
| Social links | Footer |

### Behavior
- First generation → Brand Assets empty → user uploads
- Saved to account
- Future generations → pre-filled from account
- Per-page override possible if needed

---

## 9. Page Type

### MVP Assumption
- **Single-page website** always
- All sections on one scrollable page
- Navigation = anchor links (#features, #pricing, #faq)
- No separate routes/pages

### Post-MVP (see productBacklog.md)
- Multi-page support (/features, /pricing pages)
- Landing page types (Ad, SEO, Social-specific)

---

## 10. Section List (Locked for MVP)

### Final List: 17 Sections

| Category | Section | Purpose |
|----------|---------|---------|
| **Fixed** | header | Navigation |
| | hero | Hook + primary CTA |
| | cta | Conversion section |
| | footer | Links + legal |
| **Story** | problem | Emotional pain point |
| | beforeAfter | Transformation visualization |
| | features | Core value props |
| | uniqueMechanism | Differentiation |
| | howItWorks | Process clarity |
| **Proof** | testimonials | Customer quotes |
| | socialProof | Logos + stats |
| | results | Metrics + outcomes |
| | founderNote | Human touch (early-stage substitute) |
| **Conversion** | pricing | Plans + pricing |
| | objectionHandle | Overcome doubts |
| | faq | Common questions |
| **Targeting** | useCases | Multiple audience segments |

### Removed for MVP (5 sections)
- ~~miscellaneous~~ - Announcements, not essential
- ~~closeSection~~ - Redundant with CTA variants
- ~~comparisonTable~~ - Complex, rarely needed
- ~~security~~ - Specialty for regulated industries
- ~~integrations~~ - Specialty for B2B ecosystem

### Section Selection Approach
Selection based on 4 signals (not 56 rules):
1. **Friction level** - low/medium/high based on landing goal
2. **Proof availability** - what assets user has
3. **Differentiation need** - market sophistication
4. **Mental model** - emotional/analytical/technical

*Detailed selection rules TBD*

---

## UIBlock Reference (88 total)

| Section | UIBlocks |
|---------|----------|
| **Header** (3) | NavWithCTAHeader, MinimalNavHeader, CenteredLogoHeader |
| **Hero** (5) | LeftCopyRightImage, CenterStacked, ImageFirst, SplitScreen, Minimalist |
| **Problem** (3) | CollapsedCards, SideBySideSplit, PersonaPanels |
| **BeforeAfter** (7) | SideBySideBlock, StackedTextVisual, SplitCard, BeforeAfterSlider, StatComparison, TextListTransformation, PersonaJourney |
| **Features** (6) | IconGrid, MiniCards, MetricTiles, Carousel, SplitAlternating, Tabbed |
| **HowItWorks** (7) | ThreeStepHorizontal, VideoWalkthrough, AccordionSteps, VerticalTimeline, ZigzagImageSteps, AnimatedProcessLine, VisualStoryline |
| **UniqueMechanism** (7) | SecretSauceReveal, StackedHighlights, TechnicalAdvantage, AlgorithmExplainer, MethodologyBreakdown, PropertyComparisonMatrix, ProcessFlowDiagram |
| **SocialProof** (6) | LogoWall, UserCountBar, StackedStats, MediaMentions, SocialProofStrip, IndustryBadgeLine |
| **Results** (7) | StatBlocks, OutcomeIcons, TimelineResults, ResultsGallery, StackedWinsList, EmojiOutcomeGrid, PersonaResultPanels |
| **Testimonials** (9) | QuoteGrid, RatingCards, VideoTestimonials, AvatarCarousel, PullQuoteStack, BeforeAfterQuote, SegmentedTestimonials, StripWithReviews, QuoteBackedAnswers |
| **Pricing** (5) | TierCards, ToggleableMonthlyYearly, SliderPricing, CallToQuotePlan, FeatureMatrix |
| **ObjectionHandle** (3) | VisualObjectionTiles, BoldGuaranteePanel, MythVsRealityGrid |
| **FAQ** (5) | AccordionFAQ, TwoColumnFAQ, InlineQnAList, SegmentedFAQTabs, ChatBubbleFAQ |
| **UseCases** (4) | UseCaseCarousel, IndustryUseCaseGrid, PersonaGrid, RoleBasedScenarios |
| **FounderNote** (4) | LetterStyleBlock, StoryBlockWithPullquote, VideoNoteWithTranscript, SideBySidePhotoStory |
| **CTA** (6) | CenteredHeadlineCTA, CTAWithBadgeRow, SideBySideCTA, CountdownLimitedCTA, VisualCTAWithMockup, ValueStackCTA |
| **Footer** (1) | ContactFooter |

### Persona-Aware UIBlocks

If multiple audiences → these blocks show per-persona content:

| Section | UIBlock |
|---------|---------|
| Problem | PersonaPanels |
| BeforeAfter | PersonaJourney |
| Results | PersonaResultPanels |
| UseCases | PersonaGrid, RoleBasedScenarios |
| Testimonials | SegmentedTestimonials |

---

## Appendix: Option B — AI-Direct Section Selection (Recommended)

This appendix documents a simpler alternative to bucket-based section selection. Instead of intermediate classification layers, AI directly picks sections based on objections.

### Why Option B Over Option A

**Option A (Buckets + Rules + Profiles):**
```
Objections → Bucket classification → Rules → Profile modifiers → Sections
```

**Problems with Option A:**
- Bucket → Section rules don't capture nuance
- Needed profile modifiers for different audiences
- Profiles recreated complexity we were trying to avoid
- Rules couldn't handle judgment calls like "skip UniqueMechanism for overwhelmed audience"

**Option B (AI-Direct):**
```
Objections → AI picks best section for each → Deduplicate → Sections
```

**Why Option B works:**
- AI naturally handles context (audience, emotional state, sophistication)
- No rules to maintain or update
- Simpler implementation
- More flexible, adapts to any product type

---

### The Flow

```
Input:
  - One Reader (full profile)
  - One Idea (benefit + mechanism + proof)
  - Context (landing goal, offer, available assets)
        ↓
AI simulates objection sequence:
  "I'm the One Reader. I see this One Idea. What goes through my mind?"
        ↓
For EACH objection:
  AI picks the best section to answer it
        ↓
Deduplicate (same section from multiple objections = one section)
        ↓
Output: Ordered section list
```

---

### AI Prompt Structure

**Input to AI:**

```
Product: [Name] - "[One-liner]"

One Reader:
- Who: [Specific person description]
- Core desire: [What they want most]
- Core pain: [What hurts most]
- Beliefs: [About themselves, world, industry]
- Awareness: [Unaware/Problem/Solution/Product/Most aware]
- Sophistication: [Low/Medium/High — how many similar solutions seen]
- Emotional state: [Overwhelmed/Neutral/Motivated/Skeptical]

One Idea:
- Big Benefit: [What they get]
- Unique Mechanism: [Why this works differently]
- Reason to Believe: [Proof points]

Context:
- Landing goal: [waitlist/signup/free-trial/buy/demo/download]
- Offer: [What user gets, pricing]
- Available assets: [Testimonials, Logos, Results — yes/no for each]
```

**AI Task:**

```
Role-play as the One Reader seeing the One Idea.
Generate objections in sequence until ready to take action.
For each objection, pick the BEST section to answer it.
Output the final section list (deduplicated, ordered).
```

**AI Output Format:**

```
Objection 1: "[Thought]"
→ Best answered by: [Section] — [Brief reasoning]

Objection 2: "[Thought]"
→ Best answered by: [Section] — [Brief reasoning]

...

Final Section List:
Header → Hero → [Section] → [Section] → ... → CTA → Footer
[X sections total]
```

---

### Available Sections Reference

| Section | What It Answers |
|---------|-----------------|
| **Hero** | Hook + promise + primary CTA |
| **SocialProof** | "Is this legit? Who else uses this?" (logos, stats) |
| **UniqueMechanism** | "Why is this different? Why will it work?" (technical/scientific) |
| **HowItWorks** | "How do I use it?" (experience, simplicity) |
| **Features** | "What do I get?" (capabilities, customization) |
| **Results** | "Does it work?" (metrics, stats, outcomes) |
| **Testimonials** | "Are there people like me?" (stories, quotes) |
| **Problem** | "Do you understand my pain?" (agitation) |
| **UseCases** | "Is this for me?" (personas, segments) |
| **Pricing** | "How much?" (tiers, value) |
| **ObjectionHandle** | "What about [specific risk]?" (guarantees, concerns) |
| **FAQ** | "Small questions" (friction, details) |
| **FounderNote** | "Who's behind this?" (early-stage trust) |
| **CTA** | "What do I do now?" (conversion) |
| **Header** | Navigation (always first) |
| **Footer** | Links, legal (always last) |

---

### Implementation Notes

**Fixed sections (always included):**
- Header (first)
- Hero (second)
- CTA (near end)
- Footer (last)

**FAQ placement rule:**
- Low friction offers (free, download, cheap): FAQ after CTA
- Higher friction offers (buy, demo): FAQ before CTA

**What AI should NOT do:**
- Add sections for objections that don't exist
- Include Problem section when audience is already in pain
- Add Results when no meaningful metrics exist
- Force UniqueMechanism for simple products

---

## Appendix: UIBlock Selection Flow (Locked)

This appendix documents the finalized flow for UIBlock selection. Replaces the rule-based approach in earlier sections.

### Why AI Over Rules

**Problem with rules:**
- Dynamic questions needed for good UX (tailored to product)
- Dynamic questions break rule-based selection (rules don't know custom options)
- AI judgment needed for question curation, not just answer mapping

**Solution:** AI handles end-to-end with conversational context.

---

### The Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Call 1: Strategy + Section Selection                        │
│                                                             │
│ Input: Product context, One Reader, One Idea, etc.          │
│ Output: Strategy + Selected sections                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Call 2: UIBlock Selection Attempt                           │
│                                                             │
│ Input: Sections + Context from Call 1                       │
│ Task: "Select UIBlock for each section.                     │
│        If determinable from context → select.               │
│        If need user input → send question."                 │
│                                                             │
│ Output:                                                     │
│ {                                                           │
│   "uiblocks": {                                             │
│     "Header": "NavWithCTAHeader",      // auto-selected     │
│     "Hero": "LeftCopyRightImage",      // auto-selected     │
│     "HowItWorks": null,                // needs input       │
│     "Testimonials": null               // needs input       │
│   },                                                        │
│   "questions": [                                            │
│     {                                                       │
│       "section": "HowItWorks",                              │
│       "question": "Do you have a demo video or steps?",     │
│       "options": ["Demo video", "Step screenshots", "Neither"]│
│     },                                                      │
│     {                                                       │
│       "section": "Testimonials",                            │
│       "question": "What testimonials do you have?",         │
│       "options": ["App Store reviews", "Video", "Written"]  │
│     }                                                       │
│   ]                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Questions exist?
                     /           \
                   No             Yes
                   ↓               ↓
              Done (2 calls)    Show questions to user
                                  ↓
                              User answers
                                  ↓
┌─────────────────────────────────────────────────────────────┐
│ Call 3: Finalize UIBlocks                                   │
│                                                             │
│ Input: Sections + Context + User answers                    │
│ Task: "User answered. Finalize UIBlock selection."          │
│                                                             │
│ Output:                                                     │
│ {                                                           │
│   "uiblocks": {                                             │
│     "HowItWorks": "ZigzagImageSteps",                       │
│     "Testimonials": "RatingCards"                           │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
                 Merge with Call 2 UIBlocks
                              ↓
                            Done
```

---

### Call Summary

| Step | What happens | API calls |
|------|--------------|-----------|
| 1 | Strategy + Sections | 1 |
| 2 | UIBlock attempt + questions (if needed) | 1 |
| 3 | User answers → Final UIBlocks | 0 or 1 |
| **Total** | | **2-3 calls** |

---

### Model Recommendation

| Task | Model tier | Why |
|------|------------|-----|
| Strategy + Sections | Mid (GPT-4o-mini / Sonnet) | Needs reasoning |
| UIBlock selection | Mid (GPT-4o-mini / Sonnet) | Contextual questions |

Top-tier (GPT-4o / Opus) is overkill. Low-tier (GPT-3.5 / Haiku) may miss nuance.

---

### Cost Estimate

| Approach | Tokens per page | Cost per 1000 pages (GPT-4o-mini) |
|----------|-----------------|-----------------------------------|
| 2 calls (no questions) | ~3000 | ~$0.45 |
| 3 calls (with questions) | ~4500 | ~$0.68 |

---

### AI Prompt Guidelines

**Call 2 prompt structure:**
```
You have selected these sections: [list]

Product context:
- Name: [name]
- One-liner: [one-liner]
- vibe: [vibe]
- Audience: [one reader summary]

For each section, select the best UIBlock.
- If you can determine from context → select it
- If you need user input → provide a question with 2-4 options

Page composition rules (ensure visual variety):
- Max 2 text-heavy blocks in sequence
- Max 1 accordion-style block per page
- At least 1 image-based block in middle sections
- Vary layouts (grid, stack, carousel, split)
- Avoid: 3+ similar layouts adjacent

Available UIBlocks per section:
[Reference table]

Output JSON:
{
  "uiblocks": { "Section": "UIBlock" or null },
  "questions": [ { "section", "question", "options" } ]
}
```

**Call 3 prompt structure:**
```
User answered your questions:
- HowItWorks: "Step screenshots"
- Testimonials: "App Store reviews"

Finalize UIBlock selection for these sections.

Output JSON:
{
  "uiblocks": { "Section": "UIBlock" }
}
```

---

### What AI Should Auto-Select (No Questions)

| Section | Auto-select when |
|---------|------------------|
| Header | Always (based on sectionCount) |
| Hero | Always (based on vibe) |
| Footer | Always (ContactFooter) |
| CTA | Always (based on frictionLevel) |
| Pricing | If pricing model known from offer |

### What AI Should Ask About

| Section | Ask when |
|---------|----------|
| HowItWorks | Video/screenshots/neither unclear |
| Testimonials | Type of testimonials unknown |
| SocialProof | Logo display preference |
| Results | How results are best shown |
| UniqueMechanism | What makes product unique |
| Features | Images/categories available |
| FAQ | Categories exist or not |
| FounderNote | Video available or not |

---

### Key Principles

1. **AI curates questions** — options tailored to product context
2. **Batch questions** — all questions in one UI, not sequential
3. **Auto-select when possible** — minimize user questions
4. **Context carries forward** — Call 2 and 3 share conversation context
5. **Mid-tier model sufficient** — don't overspend on top-tier
6. **Page-level coherence** — AI checks visual variety while selecting (max 2 text-heavy adjacent, max 1 accordion, vary layouts)

---

### UIBlock Questions UI Implementation

**Decision:** New component (not reusing TaxonomyModalManager)

**Why new component:**
- Different context (content editing vs user data collection)
- Batch questions on one screen (not sequential like onboarding)
- Triggers block regeneration, not page save
- Simpler scope (2-5 questions typically)

**Create:** `src/app/edit/[token]/components/modals/UIBlockQuestionsModal.tsx`

**Reuse from existing:**
- `BaseModal` as shell (portal, a11y, responsive)
- `TaxonomyTile` for choice options (selection tiles with badges)
- Similar visual styling to existing modals

**Component Interface:**
```typescript
interface UIBlockQuestion {
  id: string
  section: string  // "HowItWorks", "Testimonials"
  question: string
  options: string[]
}

interface UIBlockQuestionsModalProps {
  isOpen: boolean
  questions: UIBlockQuestion[]
  onClose: () => void
  onSubmit: (answers: Record<string, string>) => void
}
```

**UI Layout:**
- Single screen showing all questions
- Each question = section header + options as TaxonomyTiles
- Submit button at bottom
- No sequential flow (unlike onboarding)

---

## Appendix: Copy Generation Flow (Locked)

This appendix documents how copy is generated for all AI-generated elements across the page.

### Overview

**Input:**
- Full context (One Reader, One Idea, Strategy, Objections)
- All sections + UIBlocks selected
- Element schema per UIBlock (from layoutElementSchema)

**Output:**
- Copy for all AI-generated elements across all sections
- Single API call for entire page

### Why Single Call

| Approach | Pros | Cons |
|----------|------|------|
| **One call (entire page)** | Consistent voice, full context, cheaper | Large output |
| **Section-by-section** | Smaller outputs | More calls, loses consistency |

**Decision:** One call. AI needs full context to maintain voice and avoid repetition.

---

### Three Generation Types

| Type | Meaning | UI Treatment | Example |
|------|---------|--------------|---------|
| `ai_generated` | AI creates, ready to use | No flag | headline, subheadline, cta_text |
| `manual_preferred` | User must provide | Upload/input UI | logo_urls, hero_image, video_url |
| `ai_generated_needs_review` | AI creates placeholder, user verifies | ⚠️ "Verify this" flag | stats, testimonials, integrations, pricing |

**Element inclusion logic:**
- `ai_generated`: AI returns value → include. Returns NULL → exclude. No config needed.
- `manual_preferred`: Default ON/OFF per element in UIBlock schema. User adds/deletes.

**Why `ai_generated_needs_review`:**
- User doesn't start from zero
- AI gives realistic placeholder ("40% faster", "500+ customers")
- User confirms OR replaces with real data
- Clear signal: this needs human verification

**Elements that should be `ai_generated_needs_review`:**

| Element Type | Why |
|--------------|-----|
| Testimonial quotes | Can't invent customer quotes — legal/trust |
| Customer names/companies | Factual, must be real |
| Stats/metrics | Real business numbers |
| Integration names | Factual claims |
| Pricing details | Business decision |
| Algorithm/product names | User's branding |

---

### Element Schema Structure

Each UIBlock defines its elements:

```typescript
{
  sectionElements: [
    { element: "headline", mandatory: true, generation: "ai_generated" },
    { element: "hero_image", mandatory: true, generation: "manual_preferred" },
    { element: "stat_value", mandatory: false, generation: "ai_generated_needs_review" },
  ],
  cardStructure: {
    type: "cards",
    elements: ["step_titles", "step_descriptions"],
    generation: "ai_generated"
  },
  cardRequirements: { min: 3, max: 6, optimal: [3, 4] }
}
```

---

### AI Prompt for Copy Generation

```
You are generating copy for a landing page.

Context:
- Product: [name] - [one-liner]
- One Reader: [full profile]
- One Idea: [benefit + mechanism + proof]
- Vibe: [vibe]
- Objections addressed: [list]

Generate copy for these sections and elements:

Section: Hero (leftCopyRightImage)
Elements needed:
- headline (ai_generated)
- subheadline (ai_generated)
- cta_text (ai_generated)
- trust_item_1, trust_item_2, trust_item_3 (ai_generated)

Section: Results (StatBlocks)
Elements needed:
- headline (ai_generated)
- cards (3-4): stat_values, stat_labels, stat_descriptions (ai_generated_needs_review)

[... continue for all sections]

Output JSON matching element names exactly.
Respect card count limits.
Keep copy concise — fits layout without overflow.
```

---

### Design Constraints for AI

| Constraint | Why | How |
|------------|-----|-----|
| Character limits | Prevent layout overflow | Schema defines max length per element |
| Card count | Respect UIBlock limits | Schema defines min/max, AI stays in range. Quality > quantity. |
| Vibe alignment | Copy tone matches design | Prompt includes vibe, AI adapts |
| No placeholder text | Real copy only | AI generates actual content, not "Lorem ipsum" |

**Card count philosophy:**
- Card count = array.length (output, not input)
- Soft guidance in prompt: "3-6 features" as range
- AI generates what's meaningful — 4 compelling features > 8 generic ones

---

## Appendix: Schema & Design Review (Required)

Before MVP lock, two reviews must happen.

### Part 1: Schema Rework

**Scope:**

| Area | Current State | Required Change |
|------|---------------|-----------------|
| Generation types | 2 types (ai_generated, manual_preferred) | Add 3rd: ai_generated_needs_review |
| Card structure | Legacy nested format | Simplify/flatten |
| Element naming | Inconsistent (stat_1_number vs stat_values) | Standardize |
| Completeness | All elements listed | Mark truly optional, let AI skip |
| Mandatory flags | Some incorrect | Audit each UIBlock |

**Sync requirement — three sources must match:**

```
layoutElementSchema.ts     →  "what elements exist"
UIBlock component (React)  →  "what gets rendered"
Published page schema      →  "what gets stored/served"
```

**Recommendation:** Single source of truth. One TypeScript definition, all three import from it.

**Checklist:**
- [ ] Define 3 generation types with clear rules
- [ ] Audit each UIBlock's elements
- [ ] Simplify card structure
- [ ] Standardize element naming
- [ ] Ensure sync: schema ↔ component ↔ published
- [ ] Add character limits per element
- [ ] Document card count constraints

---

### Part 2: Visual Design Review

**Scope:** Review each UIBlock visually to ensure it looks beautiful.

| Factor | Check |
|--------|-------|
| Spacing | Consistent, breathable |
| Typography | Hierarchy clear, readable |
| Proportions | Balanced, professional |
| Responsive | Works on desktop/tablet/mobile |
| Edge cases | Long text, missing images, min/max cards |
| Color harmony | Works with all vibes |

**Checklist:**
- [ ] Review each UIBlock (all ~70 blocks)
- [ ] Fix spacing/typography issues
- [ ] Test with real content (not lorem ipsum)
- [ ] Test edge cases per block
- [ ] Verify responsive behavior
- [ ] Ensure works with all color vibes

---

### UIBlocks to Review

| Section | UIBlocks | Count |
|---------|----------|-------|
| Hero | leftCopyRightImage, centerStacked, splitScreen, imageFirst, minimalist | 5 |
| SocialProof | LogoWall, MediaMentions, UserCountBar, SocialProofStrip, StackedStats, IndustryBadgeLine | 6 |
| UniqueMechanism | AlgorithmExplainer, MethodologyBreakdown, ProcessFlowDiagram, SecretSauceReveal, StackedHighlights, TechnicalAdvantage, PropertyComparisonMatrix | 7 |
| HowItWorks | ThreeStepHorizontal, VerticalTimeline, ZigzagImageSteps, VideoWalkthrough, AccordionSteps, AnimatedProcessLine, VisualStoryline | 7 |
| Features | IconGrid, MiniCards, Carousel, Tabbed, SplitAlternating, MetricTiles | 6 |
| Results | StatBlocks, OutcomeIcons, StackedWinsList, EmojiOutcomeGrid, TimelineResults, ResultsGallery, PersonaResultPanels | 7 |
| Testimonials | QuoteGrid, RatingCards, AvatarCarousel, PullQuoteStack, VideoTestimonials, SegmentedTestimonials, BeforeAfterQuote, StripWithReviews, QuoteBackedAnswers | 9 |
| Problem | CollapsedCards, SideBySideSplit, PersonaPanels | 3 |
| BeforeAfter | SideBySideBlock, StackedTextVisual, TextListTransformation, BeforeAfterSlider, SplitCard, StatComparison, PersonaJourney | 7 |
| Pricing | TierCards, ToggleableMonthlyYearly, SliderPricing, FeatureMatrix, CallToQuotePlan | 5 |
| ObjectionHandle | VisualObjectionTiles, BoldGuaranteePanel, MythVsRealityGrid | 3 |
| FAQ | AccordionFAQ, TwoColumnFAQ, SegmentedFAQTabs, ChatBubbleFAQ, InlineQnAList | 5 |
| UseCases | UseCaseCarousel, PersonaGrid, RoleBasedScenarios, IndustryUseCaseGrid | 4 |
| FounderNote | LetterStyleBlock, SideBySidePhotoStory, StoryBlockWithPullquote, VideoNoteWithTranscript | 4 |
| CTA | CenteredHeadlineCTA, CTAWithBadgeRow, CountdownLimitedCTA, VisualCTAWithMockup, SideBySideCTA, ValueStackCTA | 6 |
| Header | NavWithCTAHeader, MinimalNavHeader, CenteredLogoHeader | 3 |
| Footer | ContactFooter | 1 |

**Total: ~88 UIBlocks**
