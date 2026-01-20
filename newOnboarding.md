# New Generation System

Replace ~12,500 LOC of complex rules with AI-driven approach.

---

## 1. Quick Reference

### Core Types

```typescript
type LandingGoal = 'waitlist' | 'signup' | 'free-trial' | 'buy' | 'demo' | 'download';
type Vibe = 'Dark Tech' | 'Light Trust' | 'Warm Friendly' | 'Bold Energy' | 'Calm Minimal';
type PricingModel = 'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based' | 'enterprise';
```

### 17 Sections

| Category | Sections |
|----------|----------|
| **Fixed** | Header, Hero, CTA, Footer |
| **Story** | Problem, BeforeAfter, Features, UniqueMechanism, HowItWorks |
| **Proof** | Testimonials, SocialProof, Results, FounderNote |
| **Conversion** | Pricing, ObjectionHandle, FAQ |
| **Targeting** | UseCases |

### 88 UIBlocks

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

**Persona-aware UIBlocks** (when multiple audiences):
- Problem → PersonaPanels
- BeforeAfter → PersonaJourney
- Results → PersonaResultPanels
- UseCases → PersonaGrid, RoleBasedScenarios
- Testimonials → SegmentedTestimonials

---

## 2. Generation Flow

### Step 1: One-Liner
User provides product description.
```
"AI-powered invoice generator for freelancers"
```

### Step 2: Understanding + Features
AI extracts (no web search, pure comprehension):

| Field | Example |
|-------|---------|
| Categories | Invoicing, Accounting |
| Target Audiences | Freelancers, Small businesses |
| What it does | Creates invoices via AI chat |
| Features | AI-powered creation, Multi-currency, Payment reminders |

**Always show playback** — user confirms/edits on one screen.

### Step 3: Landing Action + Offer

**Question 1:** "What should visitors do?"

| Goal | Label |
|------|-------|
| waitlist | Join waitlist |
| signup | Sign up / Start free |
| free-trial | Start free trial |
| buy | Buy now / Subscribe |
| demo | Book demo |
| download | Download app |

**Question 2:** "What does user get?"
- Example: "14-day free trial, no credit card required"
- Helps AI judge friction level (low/medium/high)

### Step 4: Asset Availability
3 checkboxes:

| Asset | Enables |
|-------|---------|
| Testimonials | Testimonials section |
| Social Proof | SocialProof section |
| Concrete Results | Results section |

Other asset questions (demo video, feature images) asked during UIBlock selection.

### Step 5: Research (IVOC)
Tavily search + LLM extraction → Voice of Customer data.

**IVOC Schema:**
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

**Cache strategy:** Store by category + audience. Lookup first, Tavily fallback.

### Step 6: Strategy + Section Selection
One API call generates:

```json
{
  "vibe": "Light Trust",

  "oneReader": {
    "who": "Freelance designer billing 5+ clients monthly",
    "coreDesire": "Get paid faster without awkward follow-ups",
    "corePain": "Chasing payments feels unprofessional",
    "beliefs": "Clients always pay late, invoicing is tedious",
    "awareness": "solution-aware",
    "sophistication": "medium",
    "emotionalState": "frustrated"
  },

  "oneIdea": {
    "bigBenefit": "Spend time on creative work, not admin",
    "uniqueMechanism": "AI creates invoices from a chat",
    "reasonToBelieve": "10,000+ freelancers, avg 14 days faster"
  },

  "featureAnalysis": [
    {
      "feature": "AI invoice creation",
      "benefit": "Create invoices in seconds",
      "benefitOfBenefit": "Spend time on creative work, not admin"
    }
  ],

  "frictionAssessment": {
    "level": "low",
    "reasoning": "Free trial with no credit card is minimal commitment"
  },

  "allObjections": [
    { "thought": "Will clients take AI invoices seriously?", "theme": "trust", "intensity": "high", "preHandledByHero": false },
    { "thought": "Is my data secure?", "theme": "risk", "intensity": "medium", "preHandledByHero": false },
    { "thought": "How does it actually work?", "theme": "how", "intensity": "medium", "preHandledByHero": false },
    { "thought": "What if I don't like it?", "theme": "risk", "intensity": "low", "preHandledByHero": true }
  ],

  "objectionGroups": [
    {
      "theme": "trust",
      "objections": [{ "thought": "Will clients take AI invoices seriously?", "theme": "trust", "intensity": "high" }],
      "resolvedBy": "SocialProof",
      "reasoning": "Social proof shows real businesses using it successfully"
    },
    {
      "theme": "how",
      "objections": [{ "thought": "How does it actually work?", "theme": "how", "intensity": "medium" }],
      "resolvedBy": "HowItWorks",
      "reasoning": "Process explanation removes mystery around implementation"
    }
  ],

  "middleSections": ["SocialProof", "HowItWorks", "Features", "Testimonials", "FAQ"]
}
```

**Two-Phase Section Selection:**

**Phase 1: List ALL Objections (Pure Psychology)**
- Role-play as One Reader landing on the page
- List EVERY thought, concern, question that arises
- Tag each with: theme (trust/risk/fit/how/what/price/effort), intensity (low/medium/high)
- Mark `preHandledByHero: true` if offer already addresses it (e.g., "free trial no CC" handles risk)

**Phase 2: Group Objections → Map to Sections (Many:1)**
- Multiple objections can be resolved by ONE section
- Skip sections for objections pre-handled by Hero
- Pick 1-2 proof sections max (Testimonials/SocialProof/Results)
- Each section must earn its place by resolving meaningful objections

**Friction-Based Grouping:**
| Friction | Offer Examples | Section Count |
|----------|----------------|---------------|
| Low | free trial no CC, waitlist, download | 5-7 (aggressive grouping) |
| Medium | free trial with CC, freemium, demo | 6-8 |
| High | paid plans, annual, enterprise | 7-9 (more sections) |

**Canonical Section Order (enforced post-AI):**
```
Problem → BeforeAfter → UniqueMechanism → Features → HowItWorks →
UseCases → Testimonials → SocialProof → Results → Pricing →
ObjectionHandle → FAQ → FounderNote
```

**One Reader vs Personas:**
- One Reader = primary target, drives copy tone
- Other audiences = personas for persona-aware UIBlocks

### Step 7: Design
Derives from `vibe`. No API call.

| Vibe | Background | Accent | Primary Font | Body Font |
|------|------------|--------|--------------|-----------|
| Dark Tech | dark gradients | High energy | Sora | Inter |
| Light Trust | light gradients | Medium | Inter | Inter |
| Warm Friendly | warm tones | Medium-warm | DM Sans | DM Sans |
| Bold Energy | vibrant gradients | High | Sora | DM Sans |
| Calm Minimal | neutral | Low | Playfair Display | Inter |

### Step 8: UIBlock Selection
For each section, AI selects best UIBlock.

**Process:**
1. AI attempts auto-selection from context
2. If unclear → generates questions for user
3. User answers in batch (one screen)
4. AI finalizes selection

**Page composition rules:**
- Max 2 text-heavy blocks in sequence
- Max 1 accordion-style block per page
- At least 1 image-based block in middle
- Vary layouts for visual interest

### Step 9: Copy Generation
Single API call for entire page.

**Three element types:**

| Type | Meaning | Example |
|------|---------|---------|
| `ai_generated` | Ready to use | headline, cta_text |
| `manual_preferred` | User provides | logo, hero_image |
| `ai_generated_needs_review` | AI placeholder, user verifies | stats, testimonials, pricing |

**Element inclusion:**
- `ai_generated`: Returns value → include. Returns NULL → exclude.
- `manual_preferred`: Default ON/OFF per element in schema.

**Card count:** Output, not input. Soft guidance "3-6 features". Quality > quantity.

### Step 10: Page Assembly
- Layout: Sections in order with UIBlocks
- Design: Background, accent, fonts
- Copy: AI-generated content
- Images: Pexels placeholders
- Flags: `ai_generated_needs_review` marked "Verify this"

---

## 3. Design System

### Placeholder Images

| Type | Approach |
|------|----------|
| Hero/Feature images | Pexels API, vibe-matched |
| Founder/Customer photos | Silhouette/initials placeholder |

**Pexels queries by vibe:**

| Vibe | Keywords |
|------|----------|
| Dark Tech | technology dark modern abstract |
| Light Trust | business professional clean minimal |
| Warm Friendly | people collaboration team warm |
| Bold Energy | creative vibrant dynamic startup |
| Calm Minimal | minimal simple clean neutral |

**Image aspect ratios:**

| Section | Orientation | Ratio |
|---------|-------------|-------|
| Hero | landscape | 16:9 or 4:3 |
| Features | landscape | 16:9 |
| FounderNote main | portrait/square | 3:4 or 1:1 |
| Results gallery | any | preserve original |

---

## 4. Supporting Systems

### Brand Assets
- Collected in Editor (Brand Assets section)
- Account-wide: Logo, Founder photo, Company name, Social links
- First gen → empty → user uploads → saved for future

### IVOC Cache
Store Tavily results by category + audience:
- `pains`, `desires`, `objections`, `firmBeliefs`, `shakableBeliefs`, `commonPhrases`
- Exact match lookup, no TTL (cache forever)

### Page Type (MVP)
- Single-page website always
- Navigation = anchor links
- Multi-page support post-MVP

---

## 5. AI Prompt Templates

### Strategy Prompt

```
Product: [Name] - "[One-liner]"
Goal: [waitlist/signup/free-trial/buy/demo/download]
Offer: [What user gets]

Target Audience: [Primary audience]
Other personas: [Secondary audiences]

Features:
- [Feature 1]
- [Feature 2]

Voice of Customer Research:
- Pains: [from IVOC]
- Desires: [from IVOC]
- Objections: [from IVOC]
- Firm Beliefs: [from IVOC]
- Shakable Beliefs: [from IVOC]

Assets:
- Testimonials: yes/no
- Social Proof: yes/no
- Concrete Results: yes/no

Task (Two-Phase Objection Flow):

Step 1-4: Define One Reader, One Idea, Feature Analysis, Vibe

Step 5: Assess Friction
- Low: free trial no CC, waitlist, download
- Medium: free trial with CC, freemium, demo
- High: paid plans, annual, enterprise

Step 6: List ALL Objections (Pure Psychology)
- Role-play as One Reader landing on page
- List EVERY concern with theme/intensity/preHandledByHero

Step 7: Group Objections → Map to Sections (Many:1)
Principles:
- Multiple objections → ONE section
- Skip if preHandledByHero
- 1-2 proof sections max
- Each section must earn its place
- Low friction → aggressive grouping (5-7 sections)
- High friction → more sections (7-9)

Step 8: Output middleSections (Header/Hero/CTA/Footer added automatically)
```

### UIBlock Selection Prompt

```
Sections selected: [list]

Product context:
- Name: [name]
- One-liner: [one-liner]
- Vibe: [vibe]
- Audience: [one reader summary]

For each section, select best UIBlock.
- If determinable from context → select
- If need user input → provide question with 2-4 options

Page composition rules:
- Max 2 text-heavy blocks in sequence
- Max 1 accordion per page
- At least 1 image-based block in middle
- Vary layouts

Output:
{
  "uiblocks": { "Section": "UIBlock" or null },
  "questions": [ { "section", "question", "options" } ]
}
```

### Copy Generation Prompt

```
Context:
- Product: [name] - [one-liner]
- One Reader: [full profile]
- One Idea: [benefit + mechanism + proof]
- Vibe: [vibe]

Generate copy for these sections:

Section: Hero (leftCopyRightImage)
Elements: headline, subheadline, cta_text, trust_items (3)

Section: Results (StatBlocks)
Elements: headline, cards (3-4): stat_value, stat_label, stat_description

[... all sections]

Rules:
- Respect character limits
- Respect card count (min/max)
- Match vibe in tone
- No placeholder text
```

---

## 6. Pre-MVP Checklist

### Schema Rework

- [ ] Add 3rd generation type: `ai_generated_needs_review`
- [ ] Audit each UIBlock's elements
- [ ] Standardize element naming
- [ ] Add character limits per element
- [ ] Document card count constraints
- [ ] Ensure sync: schema ↔ component ↔ published

**Three sources must match:**
```
layoutElementSchema.ts  →  "what elements exist"
UIBlock component       →  "what gets rendered"
Published page schema   →  "what gets stored"
```

### Visual Design Review

- [ ] Review all 88 UIBlocks
- [ ] Fix spacing/typography issues
- [ ] Test with real content
- [ ] Test edge cases (long text, missing images, min/max cards)
- [ ] Verify responsive behavior
- [ ] Ensure works with all vibes

---

## Appendix: Available Sections Reference

| Section | What It Answers |
|---------|-----------------|
| Hero | Hook + promise + primary CTA |
| SocialProof | "Is this legit? Who else uses this?" |
| UniqueMechanism | "Why is this different?" |
| HowItWorks | "How do I use it?" |
| Features | "What do I get?" |
| Results | "Does it work?" |
| Testimonials | "Are there people like me?" |
| Problem | "Do you understand my pain?" |
| UseCases | "Is this for me?" |
| Pricing | "How much?" |
| ObjectionHandle | "What about [risk]?" |
| FAQ | "Small questions" |
| FounderNote | "Who's behind this?" |

**Fixed sections:** Header (first), Hero (second), CTA (near end), Footer (last)

**FAQ placement:**
- Low friction (free, download): FAQ after CTA
- High friction (buy, demo): FAQ before CTA

### Objection Themes

| Theme | Reader Question | Resolved By |
|-------|-----------------|-------------|
| trust | "Is this legit? Who else uses this?" | Testimonials, SocialProof, Results |
| risk | "What if it doesn't work? Can I cancel?" | ObjectionHandle, Hero (if low friction) |
| fit | "Is this for me / my situation?" | UseCases, Features |
| how | "How does it work? Is it hard to use?" | HowItWorks |
| what | "What exactly do I get?" | Features, UniqueMechanism |
| price | "Is it worth the cost?" | Pricing |
| effort | "How much work is this to set up?" | HowItWorks, BeforeAfter |

**Intensity levels:**
- High: Firm beliefs from research (hard to change)
- Medium: Shakable beliefs (can be addressed)
- Low: Generic concerns not in research
