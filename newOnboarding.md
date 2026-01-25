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

> **V3 Simplified Flow:** Set `NEXT_PUBLIC_SIMPLIFIED_ONBOARDING_V3=true` in `.env.local` to enable simplified flow that skips Research (Step 5) and uses deterministic section selection. See [Appendix: V3 Simplified Section Selection](#appendix-v3-simplified-section-selection).

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

> **V3:** This step is SKIPPED. Strategy uses deterministic templates instead.

Voice of Customer research via Perplexity (primary) or Tavily (fallback).

**Provider:** `RESEARCH_PROVIDER` env var (`perplexity` | `tavily`)

**Request payload:**
```typescript
{
  category: categories.join(', '),        // All categories, not just first
  audience: audiences.join(', '),         // All audiences, not just first
  productDescription: whatItDoes          // Product context for targeted search
}
```

**Perplexity config:**
```typescript
{
  model: 'sonar',  // or 'sonar-pro' for better quality
  search_domain_filter: [
    'reddit.com', 'g2.com', 'capterra.com',
    'trustpilot.com', 'producthunt.com', 'indiehackers.com'
  ],
  search_recency_filter: 'year',
  response_format: { type: 'json_schema', ... }
}
```

**IVOC Schema:**
```json
{
  "pains": ["my knees hurt after every run", "can't stick to any routine"],
  "desires": ["just need simple workout plans", "personalized plans without the BS"],
  "objections": ["too expensive for what it is", "free trials lock you in"],
  "firmBeliefs": ["consistency beats fancy gadgets"],
  "shakableBeliefs": ["apps can't replace a trainer"],
  "commonPhrases": ["I tried it and quit", "waste of my money"]
}
```

**Quality rules:**
- First-person language ("I hate...", "my...")
- Short phrases (under 10 words)
- Specific, not generic ("trackers die mid-workout" not "pain points")

**Quality gate:** Reject if contains garbage phrases:
- "target audience", "pain points", "market research", "pricing transparency"

**Fallback chain:**
```
Perplexity (if enabled) → Tavily → GPT-4o fallback
```

**Cache strategy:**
- Key: `categoryKey + audienceKey`
- Provider-aware: Perplexity cache not used when Tavily selected (and vice versa)
- Low-quality results not cached

### Step 6: Strategy + Section Selection

> **V3:** Uses `/api/v3/strategy` with simplified prompt. LLM detects awareness level + optional sections, then deterministic templates select final sections. See [Appendix: V3 Simplified Section Selection](#appendix-v3-simplified-section-selection).

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
Store research results by category + audience:
- Fields: `pains`, `desires`, `objections`, `firmBeliefs`, `shakableBeliefs`, `commonPhrases`
- Metadata: `source` (perplexity/tavily/gpt-fallback), `model`, `rawSources`, `query`
- Provider-aware: cache lookup respects current provider setting
- Quality gate: low-quality results skipped from cache
- No TTL (cache forever)

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

---

## Appendix: V3 Simplified Section Selection

> V3 skips IVOC research. Uses deterministic templates based on awareness + landing goal.

### Awareness Level Detection (LLM)

Given: [product, audience, problem, category]

Choose ONE awareness level that will resonate with the most users:

| Level | Description |
|-------|-------------|
| **problem-aware-cold** | Knows problem exists but low emotional intensity. Not urgently seeking solutions. Needs to be reminded why this matters. |
| **problem-aware-hot** | Feels the pain intensely. Actively frustrated. Urgently wants relief. "Hair on fire" problem. |
| **solution-aware-skeptical** | Knows solutions exist. Has seen/tried alternatives. Hesitant, needs convincing why THIS one is different. |
| **solution-aware-eager** | Knows solutions exist. Ready to act. Just needs to confirm this is the right choice. |

### Optional Section Decisions (LLM)

Pick **AT MOST 1-2** of these. Default to false unless STRONG case.

| Section | YES when | NO when |
|---------|----------|---------|
| **BeforeAfter** | Transformation is VISUAL and emotionally striking. Clear painful "before" and aspirational "after". | Abstract/technical products. B2B tools where transformation isn't visual. |
| **UniqueMechanism** | Genuinely novel approach explainable in ONE sentence. Clear differentiation from competitors. | "AI-powered" (not unique). Standard tech. Too technical to explain simply. |
| **ObjectionHandle** | Chose "solution-aware-skeptical" AND specific objections you can overcome. | Audience is eager (don't plant doubts). Would raise concerns they didn't have. |

### Templates

#### 1. Waitlist (pre-product)

UniqueMechanism is ALWAYS included. LLM section decisions ignored.

**Problem-aware-cold:**
```
Hero → Problem → UniqueMechanism → Features → [UseCases] → HowItWorks → Trust → CTA
```

**Problem-aware-hot:**
```
Hero → UniqueMechanism → Features → [UseCases] → HowItWorks → Trust → CTA
```

**Solution-aware (both):**
```
Hero → UniqueMechanism → Features → [UseCases] → HowItWorks → Trust → CTA
```

#### 2. Product Ready (all other landing goals)

LLM section decisions apply.

**Problem-aware-cold:**
```
Hero → Problem → [LLM sections] → Trust → Features → [UseCases] → HowItWorks → Pricing → CTA → FAQ
```

**Problem-aware-hot:**
```
Hero → [LLM sections] → Trust → Features → [UseCases] → HowItWorks → Pricing → CTA → FAQ
```

**Solution-aware-skeptical:**
```
Hero → Trust → [LLM sections] → Features → [UseCases] → HowItWorks → Pricing → CTA → FAQ
```

**Solution-aware-eager:**
```
Hero → Features → [UseCases] → HowItWorks → Trust → Pricing → CTA → FAQ
```
(No LLM sections for eager - they don't need extra convincing)

### Trust Section Rules

**Order:** Results → Testimonials → SocialProof (strongest to weakest)

**Include:** All available based on user's asset availability answers.

**FounderNote fallback:** Add only if < 2 trust sections available.

### UseCases Rule

Include **only if:** `isB2B === true AND hasMultipleAudiences === true`

### Section Order Reference

```
[LLM sections] = BeforeAfter → UniqueMechanism → ObjectionHandle (in this order if included)
[Trust] = Results → Testimonials → SocialProof → FounderNote (include available, FounderNote if < 2 others)
[UseCases] = only if B2B + multiple audiences
```

---

## Appendix: UIBlock Selection Rules

### Header

**Always:** `MinimalNavHeader`

No variation needed. Simple, works for all cases.

---

### Hero

**Available UIBlocks:**
| UIBlock | Layout |
|---------|--------|
| LeftCopyRightImage | Side by side (copy left, image right) |
| CenterStacked | Centered, image below headline |
| ImageFirst | Image dominant, copy secondary |
| SplitScreen | 50/50 dramatic split |

**Selection Logic:**

```
1. If waitlist → CenterStacked

2. AI judges product type (single call, 3 outcomes):
   - "behind-the-scenes": API, automation, analytics, infrastructure
   - "visual-ui-hero": Visual product where UI IS the selling point (design tools, visual builders)
   - "visual-ui-supports": Visual product but copy leads, UI supports (dashboards, apps, SaaS)

3. If behind-the-scenes → CenterStacked

4. If visual (ui-hero or ui-supports):
   - No proof assets (hasTestimonials=false AND hasSocialProof=false) → CenterStacked
   - Has proof assets → continue...

5. If visual + has proof:
   - "visual-ui-hero" → ImageFirst
   - "visual-ui-supports" → LeftCopyRightImage
     - Vibe upgrade: Dark Tech OR Bold Energy → SplitScreen
```

**Summary Table:**

| Condition | Hero UIBlock |
|-----------|--------------|
| Waitlist | CenterStacked |
| Behind-the-scenes | CenterStacked |
| Visual + no proof (early stage) | CenterStacked |
| Visual + proof + UI is THE selling point | ImageFirst |
| Visual + proof + UI supports copy | LeftCopyRightImage |
| ↳ + Dark Tech / Bold Energy vibe | SplitScreen |

**Default fallback:** CenterStacked (safe when no compelling image expected)

---

### Problem

**Available UIBlocks:** CollapsedCards, SideBySideSplit, PersonaPanels

**Selection Logic:**

```
If isB2B AND audiences.length > 1 → PersonaPanels
Else → CollapsedCards
```

Rarely selected section (only problem-aware-cold). Keep simple.

---

### BeforeAfter

**Available UIBlocks:** SideBySideBlock, StackedTextVisual, SplitCard

**Removed:** PersonaJourney, StatComparison, BeforeAfterSlider, TextListTransformation

**UIBlock Types:**
| Type | UIBlocks |
|------|----------|
| Image-based | SplitCard |
| Text-based | SideBySideBlock, StackedTextVisual |

**Selection Logic:**

```
If previous section is image-based → random(SideBySideBlock, StackedTextVisual)
If previous section is text-based → SplitCard
```

Creates visual rhythm by alternating image/text layouts.

---

### Features

**Available UIBlocks:** IconGrid, MetricTiles, Carousel, SplitAlternating

**Removed:** MiniCards, Tabbed

| UIBlock | Structure | Best for |
|---------|-----------|----------|
| IconGrid | Icon + title + description | Standard features |
| MetricTiles | Icon + title + number + description | Features with quantifiable benefits |
| Carousel | Interactive | Many features (5+) |
| SplitAlternating | Image + text, alternating | Visual products |

**Selection: AI picks**

LLM recommends based on feature analysis (count, benefits, product type).

---

### HowItWorks

**Available UIBlocks:** VideoWalkthrough, ThreeStepHorizontal, AccordionSteps, VerticalTimeline

**Removed:** ZigzagImageSteps, AnimatedProcessLine, VisualStoryline

| UIBlock | Direction |
|---------|-----------|
| VideoWalkthrough | - (video takes priority) |
| ThreeStepHorizontal | Horizontal |
| AccordionSteps | Vertical |
| VerticalTimeline | Vertical |

**Selection Logic:**

```
If hasDemoVideo → VideoWalkthrough

Else:
  If previous section horizontal → random(AccordionSteps, VerticalTimeline)
  If previous section vertical → ThreeStepHorizontal
```

**User question:** "Do you have a demo video?"

Creates layout rhythm by alternating horizontal/vertical.

---

### UniqueMechanism

**Available UIBlocks:** SecretSauceReveal, StackedHighlights, TechnicalAdvantage, MethodologyBreakdown, PropertyComparisonMatrix, ProcessFlowDiagram

**Removed:** AlgorithmExplainer

| UIBlock | Orientation | Best For |
|---------|-------------|----------|
| SecretSauceReveal | Horizontal (grid) | Multiple unique elements, "secrets" |
| StackedHighlights | Vertical | Simple list of differentiators |
| TechnicalAdvantage | Horizontal (grid) | Technical/developer audience |
| MethodologyBreakdown | Horizontal (hero + grid) | Framework/methodology explanation |
| PropertyComparisonMatrix | Vertical (table) | Direct "Us vs Them" comparison |
| ProcessFlowDiagram | Horizontal | Unique process (5 steps) |

**Selection: AI picks**

LLM recommends based on:
- The unique mechanism it identified in strategy
- Audience type (technical vs general)
- Nature of differentiation (process, comparison, methodology, etc.)

---

### SocialProof

**One flexible UIBlock** that adapts based on what user has.

**Elements (show if user has):**
| Element | Content |
|---------|---------|
| Logo wall | Client/company logos |
| Media strip | "As seen in..." press logos |
| Badges | Certifications, awards, ratings |

**Selection: No UIBlock choice needed**

UIBlock renders only the elements user indicates they have.

Asset availability questions TBD (see Testimonials & Results for final list).

---

### Testimonials

**Available UIBlocks:** QuoteGrid, PullQuoteStack, AvatarCarousel, VideoTestimonials, BeforeAfterQuote

**Removed:** RatingCards, SegmentedTestimonials, QuoteBackedAnswers, StripWithReviews (moved to SocialProof)

| UIBlock | B2B/B2C | Type |
|---------|---------|------|
| QuoteGrid | B2B | Text + Photos |
| PullQuoteStack | B2C | Text |
| AvatarCarousel | B2C | Photos |
| VideoTestimonials | Both | Video |
| BeforeAfterQuote | Both | Transformation |

**Asset Availability - User selects ONE:**
- Text quotes
- Photos with quotes
- Video testimonials
- Transformation stories

**Selection Logic:**

| User Selection | B2B | B2C |
|----------------|-----|-----|
| Text quotes | QuoteGrid | PullQuoteStack |
| Photos with quotes | QuoteGrid | AvatarCarousel |
| Video | VideoTestimonials | VideoTestimonials |
| Transformation | BeforeAfterQuote | BeforeAfterQuote |

---

### Results

**Available UIBlocks:** StatBlocks, StackedWinsList, ResultsGallery

**Removed:** OutcomeIcons, EmojiOutcomeGrid, PersonaResultPanels, TimelineResults

| UIBlock | Orientation |
|---------|-------------|
| StatBlocks | Horizontal |
| StackedWinsList | Vertical |
| ResultsGallery | - (for visual products) |

**Selection Logic:**

```
If visual-ui-hero → ResultsGallery

Else:
  If previous section horizontal → StackedWinsList (vertical)
  If previous section vertical → StatBlocks (horizontal)
```

Uses Hero AI judgment + layout rhythm.

---

### Pricing

**Available UIBlocks:** TierCards, ToggleableMonthlyYearly, SliderPricing, CallToQuotePlan

**Removed:** FeatureMatrix

| UIBlock | When |
|---------|------|
| TierCards | Default, simple tiers |
| ToggleableMonthlyYearly | Subscription with monthly + yearly |
| SliderPricing | Usage-based pricing |
| CallToQuotePlan | Enterprise / no public pricing |

**Selection: AI picks** (based on offer + landingGoal + isB2B)

| Offer contains | UIBlock |
|----------------|---------|
| "contact", "quote", "custom", "enterprise" | CallToQuotePlan |
| "per user", "per seat", "usage" | SliderPricing |
| Both monthly + yearly pricing | ToggleableMonthlyYearly |
| Default | TierCards |

No user question needed.

---

### ObjectionHandle

**Available UIBlocks:** VisualObjectionTiles, MythVsRealityGrid

**Removed:** BoldGuaranteePanel (guarantees belong in Hero/CTA)

| UIBlock | Format |
|---------|--------|
| VisualObjectionTiles | Tiles addressing multiple objections |
| MythVsRealityGrid | Myth vs Reality format |

**Selection: AI picks**

LLM has objections from `oneReader.objections`. Judges:
- General objections → VisualObjectionTiles
- Myths/misconceptions to bust → MythVsRealityGrid

---

### FAQ

**Available UIBlocks:** InlineQnAList, TwoColumnFAQ, AccordionFAQ, SegmentedFAQTabs

**Removed:** ChatBubbleFAQ

**Selection: AI estimates FAQ count**

LLM estimates practical question count based on:
- Objections from `oneReader.objections`
- Product complexity
- Pricing model
- Landing goal

| Question Count | UIBlock |
|----------------|---------|
| 1-6 | InlineQnAList |
| 7-10 | TwoColumnFAQ |
| 11-14 | AccordionFAQ |
| 15+ | SegmentedFAQTabs |

---

### UseCases

**Available UIBlocks:** IndustryUseCaseGrid, PersonaGrid, RoleBasedScenarios

**Removed:** UseCaseCarousel

Only included when `isB2B AND hasMultipleAudiences`.

| UIBlock | Orientation | When |
|---------|-------------|------|
| IndustryUseCaseGrid | - | Audiences are industries |
| PersonaGrid | Horizontal | Audiences are roles |
| RoleBasedScenarios | Vertical | Audiences are roles |

**Selection Logic:**

```
If audiences are industries (Finance, Healthcare, etc.) → IndustryUseCaseGrid

If audiences are roles/personas:
  If previous section horizontal → RoleBasedScenarios (vertical)
  If previous section vertical → PersonaGrid (horizontal)
```

AI judges industry vs role + rhythm-based for role audiences.

---

### FounderNote

**Always:** `LetterStyleBlock`

**Removed:** StoryBlockWithPullquote, VideoNoteWithTranscript, SideBySidePhotoStory

Only included as trust fallback when < 2 other trust sections available.

**Note:** Component needs to support optional founder image placeholder (works with or without photo).

**Selection: No choice needed.**

---

### CTA

**Available UIBlocks:** CenteredHeadlineCTA, VisualCTAWithMockup, ValueStackCTA

**Removed:** CTAWithBadgeRow, SideBySideCTA, CountdownLimitedCTA

| UIBlock | When |
|---------|------|
| CenteredHeadlineCTA | Default, simplicity wins |
| VisualCTAWithMockup | Product-led SaaS (visual products) |
| ValueStackCTA | Direct buy, value reinforcement, long pages |

**Selection Logic:**

```
If landingGoal === 'buy' → ValueStackCTA
If visual product (visual-ui-hero/supports) → VisualCTAWithMockup
Else → CenteredHeadlineCTA
```

---

## Appendix: V3 UIBlock Selection Implementation Status

> Implemented 2025-01-24

### Completed

1. **Types expanded** (`src/types/generation.ts`)
   - AssetAvailability: hasDemoVideo, testimonialType, socialProofTypes
   - UIBlockDecisions type added
   - SimplifiedStrategyOutput updated

2. **AssetAvailabilityStep UI** (`src/app/create/[token]/components/steps/AssetAvailabilityStep.tsx`)
   - Demo video checkbox
   - Testimonial type radio group (conditional)
   - Social proof types checkboxes (conditional)

3. **Orientation metadata** (`src/modules/uiblock/uiblockTags.ts`)
   - UIBlockOrientation type
   - uiblockOrientations map
   - Helper functions

4. **Strategy schema** (`src/lib/schemas/strategyV3.schema.ts`)
   - UIBlockDecisionsSchema
   - Added to SimplifiedStrategyResponseSchema

5. **Strategy prompt** (`src/modules/strategy/promptsV3.ts`)
   - Step 7: uiblockDecisions

6. **Deterministic selection** (`src/modules/uiblock/selectUIBlocksV3.ts`)
   - All section selection logic implemented

7. **UIBlockStep** (`src/app/create/[token]/components/steps/UIBlockStep.tsx`)
   - V3: Uses selectUIBlocksV3() (no API call)
   - V2: Still uses /api/v2/uiblock-select

8. **Strategy API** (`src/app/api/v3/strategy/route.ts`)
   - Accepts expanded asset fields
   - Returns uiblockDecisions

### Pending

1. **FlexibleSocialProof component** - Create adaptive SocialProof UIBlock
   - Currently falls back to LogoWall
   - Needs to render logos + media + badges based on user selection

2. **Archive removed UIBlocks** - Move to archive folder
   - See plan for list of UIBlocks to archive
   - Update layoutNames.ts and componentRegistry.ts
