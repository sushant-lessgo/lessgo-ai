# Service Route — Onboarding & Generation Spec

Parallel onboarding + generation path for **service businesses** (agencies, consultants, coaches, freelancers, productized services, local services). Separate from existing v3 product flow.

**Enable:** `NEXT_PUBLIC_SERVICE_ROUTE=true`

---

## 1. Mental Model

**Single bifurcation at onboarding entry.** Project gets `projectType: 'product' | 'service'`. From that point the two routes do not share generation code — but they DO share:

- Edit renderer (`/edit/[token]`)
- Preview renderer (`/preview/[token]`)
- Publish renderer (`/p/[slug]`)
- Auto-save / draft persistence
- Image picker
- Form builder
- Inline editing toolbars

What differs:
- Onboarding flow + UI
- Strategy + copy LLM prompts
- Section taxonomy
- UIBlock library (new, Hearth-only)
- Design tokens (Hearth)

The renderer reads `projectType` from Project + resolves the correct UIBlock library. One-line branch, not a fork.

```
Onboarding Gateway
  ├── product → existing v3 flow → existing UIBlocks (frozen)
  └── service → NEW flow → NEW UIBlocks (Hearth)

Edit / Preview / Publish (shared)
  └── resolveBlock(blockId, projectType) → product or service block
```

---

## 2. Quick Reference

### Core Types

```typescript
type ProjectType = 'product' | 'service';

type ServiceType =
  | 'agency'              // creative/marketing/dev agency
  | 'consultancy'         // strategic advisory
  | 'coaching'            // 1:1 or group coaching
  | 'freelance'           // solo expertise
  | 'productized-service' // fixed-scope offerings
  | 'local-service';      // home services, salon, clinic, etc.

type ServiceAwareness =
  | 'search-aware-cold'        // Googled the service category
  | 'search-aware-comparing'   // shopping multiple providers
  | 'referral-driven'          // came from a recommendation
  | 'relationship-warming';    // knew founder, deciding to engage

type ServiceGoal =
  | 'book-call'        // book discovery / consultation
  | 'request-quote'    // tailored proposal
  | 'apply'            // application-gated
  | 'download-portfolio'
  | 'subscribe-newsletter';

type HearthPalette =
  | 'terracotta' | 'ochre' | 'rose' | 'moss' | 'sage'
  | 'plum' | 'indigo' | 'teal' | 'charcoal';
```

### 17 Service Sections

| Category | Sections |
|---|---|
| **Fixed** | Header, Hero, CTA, Footer |
| **Offer** | Services, Approach, Process |
| **Proof** | Testimonials, ClientLogos, Outcomes, CaseStudies |
| **Trust** | TeamAndFounder, ObjectionHandle, FAQ |
| **Targeting** | IndustriesServed |
| **Conversion** | Packages |
| **Optional** | Problem, Transformation (for coaching) |

Notable diffs vs product:
- `Features` → `Services`
- `UseCases` → `IndustriesServed`
- `Pricing` → `Packages` (different semantics: tiers / quote / custom)
- `FounderNote` → `TeamAndFounder` (expanded, more central)
- `Results` → `Outcomes`
- `UniqueMechanism` → `Approach`
- `HowItWorks` → `Process`
- New: `CaseStudies`
- `Transformation` (= legacy BeforeAfter renamed for service framing)

### ~32 Service UIBlocks (target)

| Section | Blocks |
|---|---|
| Header (1) | WarmNavHeader |
| Hero (3) | PetalFramedHero, TextLedHero, VideoHero |
| Services (3) | IconServiceCards, DetailedServiceList, ServiceMatrix |
| Approach (2) | MethodologyStatement, PrincipleGrid |
| Process (3) | StepTimeline, ProcessCards, AccordionProcess |
| Outcomes (2) | StatHighlights, OutcomeStories |
| CaseStudies (2) | FeaturedCaseStudy, CaseStudyGrid |
| Testimonials (3) | PullQuoteWithMark, ClientStoryCards, VideoTestimonialGrid |
| ClientLogos (1) | WarmLogoWall |
| TeamAndFounder (2) | FounderLetter, TeamGrid |
| IndustriesServed (1) | IndustryGrid |
| Packages (3) | TieredPackages, CustomQuoteCallout, HybridPackagesPlusQuote |
| ObjectionHandle (1) | TrustSignalList |
| FAQ (2) | AccordionFAQ, TwoColumnFAQ |
| Problem (1) | TransformationProblem |
| Transformation (1) | ClientTransformation |
| CTA (2) | BookCallCTA, QuoteRequestCTA |
| Footer (1) | ContactFooterRich |

**Each block × 2 renderers (edit + published) = ~64 files.**

---

## 3. Onboarding Flow

### Step 0: Gateway (NEW — applies before any path)

Single screen, two cards.

```
"What are you building?"

[A tool people use themselves]    [Work you do for them]
 SaaS, app, plugin                  Agency, consulting, coaching
 → product route                    → service route
```

Picked answer → `projectType` set on draft Project. Hard-lock after Step 2 (warn on switch, requires re-gen).

### Step 1: One-Liner

```
"Boutique branding studio for direct-to-consumer skincare brands"
```

Same UX as product route. AI extracts in Step 2.

### Step 2: Understanding (AI extract, no web search)

| Field | Example |
|---|---|
| Service Type | agency |
| Service Categories | Branding, Packaging Design |
| Industries | Skincare, Beauty, DTC |
| Target Clients | Founders launching DTC skincare brands |
| Services | Brand identity, Packaging, Web design |
| Delivery Model | remote |

User confirms / edits in one screen.

### Step 3: Landing Goal

| Goal | Label |
|---|---|
| book-call | Book a discovery call |
| request-quote | Request a quote |
| apply | Apply to work with us |
| download-portfolio | Download portfolio |
| subscribe-newsletter | Get free resource |

### Step 4: Offer

```
"Free 30-min brand audit, no obligation"
```

### Step 5: Asset Availability

**Main assets:**
| Asset | Enables |
|---|---|
| Client testimonials | Testimonials section |
| Client logos | ClientLogos section |
| Client outcomes (numeric) | Outcomes section |
| Case studies / portfolio | CaseStudies section |
| Team photos | TeamGrid in TeamAndFounder |
| Founder photo | FounderLetter in TeamAndFounder |

**Testimonial type** (if hasTestimonials): text / photos / video / transformation-story.

### Step 6: Style — Hearth Palette Picker (NEW for service)

```
"Pick your palette"

[Terracotta]  [Ochre]  [Rose]
[Moss]        [Sage]   [Plum]
[Indigo]      [Teal]   [Charcoal]

Default pre-selected from industry signal:
  beauty/wellness → rose
  food/local → terracotta
  professional services → indigo
  finance/legal → charcoal
  health/coaching → sage
  agriculture/sustainability → moss
```

Family is **always Hearth** for service route at v1 (no choice). Variant always default. Only knob = palette.

### Step 7: Strategy (API: `/api/service/strategy`)

**Cost: 2 credits** (same as product).

Single AI call generates service-tailored strategy.

```json
{
  "awareness": "search-aware-comparing",

  "oneClient": {
    "who": "Founder of a DTC skincare brand at $300k–$2M ARR",
    "coreDesire": "A brand identity that doesn't look like every other clean-girl brand",
    "corePain": "Designers either give cookie-cutter work or charge agency rates",
    "pains": ["Generic visual language", "Slow turnaround", "Price opacity"],
    "desires": ["Distinctive identity", "Clear timeline", "Predictable cost"],
    "objections": ["Will they understand my brand?", "What if I don't like it?", "How long does this take?"]
  },

  "ourPosition": {
    "promise": "Distinctive brand identity in 6 weeks, fixed price",
    "approach": "Strategy-first, founder-collaborative process",
    "credibility": "40+ DTC brands launched, $80M raised collectively"
  },

  "servicePresentation": {
    "format": "packages",   // 'packages' | 'quote-only' | 'hybrid'
    "showProcess": true,
    "showCaseStudies": true
  },

  "sectionDecisions": {
    "includeTransformation": false,
    "includeProblem": false,
    "includeApproach": true,
    "isHighTouch": true
  },

  "uiblockDecisions": {
    "heroBlock": "PetalFramedHero",
    "servicesBlock": "DetailedServiceList",
    "processBlock": "StepTimeline",
    "packagesBlock": "TieredPackages",
    "casestudiesBlock": "FeaturedCaseStudy",
    "testimonialsBlock": "PullQuoteWithMark",
    "ctaBlock": "BookCallCTA"
  }
}
```

**Differences from product strategy:**
- `oneReader` → `oneClient`
- `oneIdea` → `ourPosition` (promise / approach / credibility — services are about the *provider*, not just the offering)
- New `servicePresentation` block (packages vs quote vs hybrid)
- `vibe` field **removed** (palette is user-picked, design is Hearth)
- `featureAnalysis` → not used for services (services are not feature-bullet-able)

### Step 8: Section Selection (Deterministic)

#### Awareness Templates

**search-aware-cold** (Googled "X service near me"):
```
Hero → Approach → Services → Process → Trust → CaseStudies → Packages → CTA → FAQ
```

**search-aware-comparing** (multiple tabs open):
```
Hero → Services → Approach → Trust → CaseStudies → Process → Packages → ObjectionHandle → CTA → FAQ
```

**referral-driven** (someone sent them):
```
Hero → TeamAndFounder → Trust → Services → Process → CaseStudies → Packages → CTA
```

**relationship-warming** (knew founder, deciding to engage):
```
Hero → Services → Packages → Process → CTA → Trust
```

**Trust order:** Outcomes → Testimonials → ClientLogos (include those available, in this order, capped at 2 to avoid trust-stacking).

**Optional sections:**
- `Problem` only if `includeProblem` AND awareness = cold
- `Transformation` only if `includeTransformation` AND service type ∈ {coaching, consultancy}
- `IndustriesServed` only if `industries.length >= 3`

**TeamAndFounder placement:** always present, but two modes:
- `referral-driven` → top-of-page (after Hero)
- others → mid-page (between Process and Packages)

### Step 9: UIBlock Selection (Deterministic)

| Section | Selection Logic |
|---|---|
| Header | Always: WarmNavHeader |
| Hero | LLM hint (heroBlock). Default: PetalFramedHero. NoPhoto → TextLedHero. HasDemoVideo → VideoHero |
| Services | LLM hint. Default: 3 services → IconServiceCards, 4-6 → DetailedServiceList, 6+ → ServiceMatrix |
| Approach | LLM hint. Default: MethodologyStatement |
| Process | LLM hint. Default: <5 steps → StepTimeline, ≥5 → AccordionProcess |
| Outcomes | hasNumericOutcomes → StatHighlights, else OutcomeStories |
| CaseStudies | 1 case → FeaturedCaseStudy, ≥2 → CaseStudyGrid |
| Testimonials | type=text → PullQuoteWithMark or ClientStoryCards (rhythm); type=video → VideoTestimonialGrid |
| ClientLogos | Always: WarmLogoWall |
| TeamAndFounder | hasFounderPhoto AND no team → FounderLetter; team>1 → TeamGrid |
| IndustriesServed | Always: IndustryGrid |
| Packages | servicePresentation.format → TieredPackages \| CustomQuoteCallout \| HybridPackagesPlusQuote |
| ObjectionHandle | Always: TrustSignalList |
| FAQ | ≤6 → TwoColumnFAQ, >6 → AccordionFAQ |
| Problem | Always: TransformationProblem |
| Transformation | Always: ClientTransformation |
| CTA | goal=book-call → BookCallCTA; goal=request-quote → QuoteRequestCTA |
| Footer | Always: ContactFooterRich |

**No rhythm tracking like v3.** Hearth has its own visual rhythm via `cream` / `cream-1` / `cream-2` surface alternation declared by `sectionRules`.

### Step 10: Copy Generation (API: `/api/service/generate-copy`)

**Cost: 3 credits** (same as product).

Single AI call. Voice spec baked in (warm, editorial, founder-to-founder, italic accent encouraged).

### Step 11: Page Assembly

- Layout: sections in order
- Design: Hearth tokens + chosen palette injected into `:root`
- Copy: AI-generated, role-named fields
- Images: Pexels with warm/service-leaning keywords
- Surface assignment: `family.sectionRules` (alternates cream / cream-2)

---

## 4. Element Schema (Service)

### Differences from Product Schema

Service blocks use the same fillMode + requirement system, but with role-named fields instead of legacy names:

| Legacy | Service |
|---|---|
| `badge_text` | `eyebrow` |
| `subheadline` | `lede` |
| `quote_text` | `quote` |
| (none) | `meta` (captions, signatures, micro-text) |

`headline`, `cta_text`, `description`, `image` — same names.

### Italic-Accent Convention

Hearth's signature is italic accent within display text. Schema convention:

```typescript
headline: { type: "string", requirement: "required", fillMode: "ai_generated" }
// AI is told: wrap 1-2 emphasized words in <em>...</em> — renderer styles those as italic accent-deep
```

Renderer-side: replace `<em>` with `<em class="accent-italic">`.

### Founder / Team Specific

```typescript
TeamAndFounder.elements: {
  founder_name: required
  founder_role: required
  founder_photo: manual_preferred (default placeholder)
  founder_signature_image: manual_preferred (optional)
  letter_body: ai_generated (3-5 short paras, warm voice)
}
```

### Service Card Constraints

```typescript
Services.collections.services: {
  constraints: { min: 3, max: 6 }
  fields: {
    id: system
    title: ai_generated
    description: ai_generated
    icon: manual_preferred (smart-default at render via getIconFromText)
    cta_text: optional ai_generated   // "Learn more" per service, optional
  }
}
```

### Package Constraints

```typescript
Packages.collections.packages: {
  constraints: { min: 1, max: 3 }   // services rarely have 4+ tiers
  fields: {
    id: system
    name: ai_generated         // "Essential" / "Studio" / "Bespoke"
    price_display: ai_generated_needs_review   // "$5,000" or "from $5k" — verify
    timeline: ai_generated     // "4-6 weeks"
    features: ai_generated (array of strings, 4-7)
    cta_text: ai_generated     // "Book a call" / "Request quote"
    is_featured: optional      // highlight middle tier
  }
}
```

---

## 5. Design System (Hearth Only at v1)

### Token Contract

CSS variables emitted on `:root` based on `{paletteId}`:

```css
:root {
  /* Accent — palette-driven */
  --accent:        oklch(...)    /* per palette */
  --accent-deep:   oklch(...)    /* per palette */
  --accent-ink:    oklch(...)    /* on accent fill */
  --accent-wash:   oklch(... / 0.10)

  /* Neutrals — baked across all palettes */
  --cream:         oklch(0.97 0.015 80)
  --cream-1:       oklch(0.95 0.02  75)
  --cream-2:       oklch(0.92 0.025 72)
  --sand:          oklch(0.84 0.03  70)
  --ink:           oklch(0.22 0.02  40)
  --ink-2:         oklch(0.42 0.015 40)
  --ink-3:         oklch(0.58 0.012 40)

  /* Baked accent neighbors */
  --sage:          oklch(0.72 0.045 135)
  --clay:          oklch(0.78 0.08  55)

  /* Lines / shadows */
  --line:          oklch(0.22 0.02 40 / 0.10)
  --line-soft:     oklch(0.22 0.02 40 / 0.06)
  --shadow-card:   0 20px 40px -24px oklch(0.30 0.04 40 / 0.18), ...
  --shadow-lift:   0 40px 70px -30px oklch(0.30 0.04 40 / 0.22), ...

  /* Type */
  --font-display:  "Fraunces", Georgia, serif
  --font-body:     "DM Sans", ui-sans-serif, system-ui, sans-serif

  /* Space — 8px base, spacious */
  --s-1..s-10:     4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 96 / 140

  /* Radius — organic-soft */
  --r-sm:          10px
  --r-md:          14px
  --r-lg:          20px
  --r-xl:          28px
  --r-petal:       120px 120px 24px 120px   /* asymmetric hero frame */

  /* Section rhythm */
  --sec-pad-y:     140px
  --sec-pad-x:     clamp(24px, 5vw, 80px)
  --max-w:         1240px
}

html { background: var(--cream); color: var(--ink); }
```

`<html data-palette="<paletteId>">` set on mount for any palette-specific selectors.

### 9 Hearth Palettes

| Palette | Accent (oklch) | Industries Hint |
|---|---|---|
| terracotta | 0.62 0.15 40 | food, local, restaurants, lifestyle |
| ochre | 0.72 0.13 75 | crafts, sustainability, wellness |
| rose | 0.66 0.14 12 | beauty, skincare, fashion |
| moss | 0.55 0.08 145 | agriculture, sustainability, garden |
| sage | 0.70 0.06 150 | health, therapy, coaching |
| plum | 0.45 0.10 340 | luxury, fine arts, boutique |
| indigo | 0.42 0.12 265 | professional services, B2B agencies |
| teal | 0.55 0.10 195 | tech-adjacent services, modern dev shops |
| charcoal | 0.30 0.02 40 | finance, legal, formal services |

Each palette config: `accent`, `accentDeep`, `accentInk`, `accentWash`, optional `linkColor`.

### Section Rules (Hearth)

```typescript
sectionRules: {
  header: 'cream',
  hero: 'cream',
  services: 'cream-2',         // band shift
  approach: 'cream',
  process: 'cream-2',
  outcomes: 'cream',
  caseStudies: 'cream-1',      // softer card-like band
  testimonials: 'cream-2',
  clientLogos: 'cream',
  teamAndFounder: 'cream',
  industriesServed: 'cream-2',
  packages: 'cream',
  objectionHandle: 'cream-2',
  faq: 'cream',
  problem: 'cream-2',
  transformation: 'cream-1',
  cta: 'cream',                // hero-like emphasis
  footer: 'cream-2'
}
```

User can override per-section in editor (existing infra).

### Image Keywords (Pexels placeholders)

```typescript
serviceImageKeywords: {
  default: 'warm professional craft natural light',
  beauty: 'beauty skincare natural minimal warm',
  agency: 'studio workspace warm natural light',
  coaching: 'people conversation warm sunlight',
  food: 'food artisan craft natural',
  local: 'local artisan warm community',
  // ...per palette/industry
}
```

---

## 6. Copy Voice — Hearth

Baked into `copyPromptService.ts`. No per-vibe branching.

```typescript
const HEARTH_VOICE = {
  toneProfile: "warm, unhurried, founder-to-founder, editorial confidence",
  cadenceRules: [
    "One long sentence, then one short.",
    "Use serif-italic emphasis sparingly — wrap 1-2 emphasized words in <em>.",
    "Avoid corporate jargon: 'unlock', 'empower', 'leverage', 'solutions', 'synergy'.",
    "Prefer concrete nouns: 'a packaging refresh', not 'brand transformation deliverables'.",
    "Speak as a craftsperson, not a salesperson."
  ],
  lexicon: {
    preferred: ["craft", "consider", "shape", "build", "invite", "offer", "tend to", "with care"],
    forbidden: ["unlock", "revolutionary", "game-changing", "synergy", "leverage", "solutions", "best-in-class"]
  },
  examples: {
    hero: [
      "Brand identity that <em>stays with you</em>.",
      "We design <em>quietly</em>. The work speaks loud."
    ],
    eyebrow: [
      "EST 2018 · BROOKLYN",
      "BRAND STUDIO"
    ],
    lede: [
      "A six-week studio engagement for founders who want their brand to feel as deliberate as their product."
    ]
  },
  roleNotes: {
    eyebrow: "Tracked uppercase, mono-feel via DM Sans 500. Often paired with a horizontal line.",
    quote: "Italic Fraunces. Preceded by a small italic mark glyph (large open-quote)."
  }
}
```

LLM is given this spec verbatim in prompt. No vibe-to-tone mapping like product route.

---

## 7. Database Changes

### Project Model

```prisma
model Project {
  // existing fields stay...
  projectType   String   @default("product")  // 'product' | 'service'
  paletteId     String?                       // 'terracotta', 'moss', etc. — null for product
}

model PublishedPage {
  // existing fields stay...
  projectType   String   @default("product")
  paletteId     String?
}
```

**Migration:**
- Backfill existing rows with `projectType = 'product'`, `paletteId = null`. Safe — product route doesn't read these.
- `projectType` is required going forward; default + backfill keeps old rows valid.
- No `familyId`, no `variantId`, no `overrides` JSON. Family is implied (`product` → existing v3 / `service` → Hearth). Variant is always default.

### Generation Store

```typescript
// new: src/hooks/useServiceGenerationStore.ts
interface ServiceGenerationState {
  projectType: 'service';
  oneLiner: string;
  serviceType: ServiceType;
  serviceCategories: string[];
  industries: string[];
  targetClients: string;
  services: string[];
  deliveryModel: 'remote' | 'in-person' | 'hybrid';
  goal: ServiceGoal;
  offer: string;
  paletteId: HearthPalette;

  // assets
  hasTestimonials: boolean;
  hasClientLogos: boolean;
  hasOutcomes: boolean;
  hasCaseStudies: boolean;
  hasTeamPhotos: boolean;
  hasFounderPhoto: boolean;
  testimonialType: 'text' | 'photos' | 'video' | 'transformation' | null;
}
```

`useOnboardingStore` (existing) remains for product route.

---

## 8. Routing

```
/onboarding                              # gateway page (NEW)
/onboarding/product/...                  # existing v3 onboarding (untouched)
/onboarding/service/                     # NEW
├── /one-liner
├── /understanding
├── /goal
├── /offer
├── /assets
├── /style                               # palette picker
└── /generating                          # progress + result

/api/service/strategy                    # NEW — service-specific strategy
/api/service/generate-copy               # NEW — service-specific copy

/edit/[token]                            # SHARED — branches on projectType
/preview/[token]                         # SHARED
/p/[slug]                                # SHARED
```

Existing v3 endpoints (`/api/v3/strategy`, `/api/v3/generate-copy`) untouched, only used by product route.

---

## 9. Renderer Integration (Shared Code)

`LandingPageRenderer.tsx` and `LandingPagePublishedRenderer.tsx` get one branch:

```tsx
const blockResolver = project.projectType === 'service'
  ? resolveServiceBlock
  : resolveProductBlock;

const tokenInjector = project.projectType === 'service'
  ? <HearthThemeInjector paletteId={project.paletteId} />
  : <ExistingVibeThemeInjector ... />;
```

Everything else — auto-save, inline editing, image picker, form builder, drag-drop, section toolbar, text toolbar, publishing, slug check — **untouched**.

The existing edit toolbars work on service blocks because:
- Element keys still go through the same content schema
- contenteditable hooks bind to `data-element-key`
- Image picker writes to the same content shape
- Form builder same

UIBlock authoring constraint: every service block must use the same `data-element-key` + `data-section-id` conventions as product blocks. This is the only requirement for editor compatibility.

---

## 10. Edit Surface Adjustments (Service Projects Only)

| Surface | Change |
|---|---|
| Theme panel | Show palette picker (9 swatches). No vibe, no font picker, no accent custom. Family/variant hidden. |
| Section toolbar — surface picker | Show `cream / cream-1 / cream-2` only |
| Text toolbar — color swatches | Show role-based: `ink / ink-2 / ink-3 / accent / accent-deep` only. Custom hex behind flyout. |
| Text toolbar — italic | Mark italic to use Fraunces with `font-style: italic` + accent-deep color (existing italic toggle reused, stylesheet handles the rest) |
| Image picker | Service-specific Pexels keywords pre-fill |
| Form builder | Default form template = "Book a call" with name/email/message + optional Calendly embed link |

For product projects, edit surface is unchanged.

---

## 11. File Structure (New)

```
src/app/onboarding/
├── page.tsx                              # gateway
└── service/
    ├── one-liner/page.tsx
    ├── understanding/page.tsx
    ├── goal/page.tsx
    ├── offer/page.tsx
    ├── assets/page.tsx
    ├── style/page.tsx
    └── generating/page.tsx

src/app/api/service/
├── strategy/route.ts
└── generate-copy/route.ts

src/modules/service/
├── strategy/
│   ├── promptsService.ts
│   ├── parseStrategyService.ts
│   └── sectionSelectionService.ts
├── uiblock/
│   ├── selectUIBlocksService.ts
│   └── layoutNamesService.ts
├── copy/
│   ├── copyPromptService.ts
│   └── voiceHearth.ts
├── sections/
│   └── serviceElementSchema.ts
├── design/
│   ├── tokens.ts                         # token contract + defaults
│   ├── palettes.ts                       # 9 Hearth palettes
│   ├── sectionRules.ts
│   ├── HearthThemeInjector.tsx
│   └── imageKeywords.ts
├── blocks/
│   ├── Header/WarmNavHeader.tsx
│   ├── Header/WarmNavHeader.published.tsx
│   ├── Hero/PetalFramedHero.tsx
│   ├── Hero/PetalFramedHero.published.tsx
│   ├── Hero/TextLedHero.tsx
│   ├── Hero/TextLedHero.published.tsx
│   └── ... (~32 sections × 2)
├── resolveServiceBlock.ts                # blockId → component lookup
└── index.ts

src/lib/schemas/
└── strategyService.schema.ts             # Zod for service strategy output

src/types/
└── service.ts                            # ServiceStrategyOutput, ProjectType, etc.

src/hooks/
└── useServiceGenerationStore.ts
```

Estimated total new files: **~80** (32 blocks × 2 + ~16 module files + onboarding pages + API routes).

---

## 12. Migration Sequence

1. **Week 1: Foundation.**
   - `projectType` + `paletteId` Prisma migration. Backfill existing rows to `'product'`.
   - Onboarding gateway page (`/onboarding/page.tsx`).
   - Renderer one-line branch wired (returns 404 / placeholder for service path until blocks ship).
   - Service onboarding flow scaffolding (pages + store, no AI yet).

2. **Week 2: Hearth design system.**
   - `tokens.ts`, `palettes.ts`, `HearthThemeInjector.tsx` ported from `Hearth - Warm Service.html`.
   - `sectionRules.ts` (cream alternation map).
   - Test injection on a static demo page. Verify all CSS vars resolve.

3. **Week 3: Generation backend.**
   - `/api/service/strategy` + `promptsService.ts` + Zod schema.
   - `/api/service/generate-copy` + `copyPromptService.ts` + `voiceHearth.ts`.
   - `sectionSelectionService.ts` + `selectUIBlocksService.ts` (deterministic).
   - End-to-end test with mock blocks (raw JSON output, no UI yet).

4. **Week 4: Block batch 1 — Hero, Services, CTA, Footer, Header (8 blocks × 2 = 16 files).**
   - Hero: PetalFramedHero, TextLedHero, VideoHero
   - Services: IconServiceCards
   - CTA: BookCallCTA
   - Header: WarmNavHeader
   - Footer: ContactFooterRich
   - Compare side-by-side with Hearth HTML.
   - Lock the authoring pattern.

5. **Week 5: Block batch 2 — Process, Approach, Packages, Testimonials, TeamAndFounder (10 blocks × 2 = 20 files).**

6. **Week 6: Block batch 3 — Outcomes, CaseStudies, FAQ, ObjectionHandle, ClientLogos, IndustriesServed, Problem, Transformation (14 blocks × 2 = 28 files).**

7. **Week 7: Edit surface + QA.**
   - Theme panel palette picker (service projects only).
   - Section toolbar surface options.
   - Text toolbar color/italic adjustments.
   - End-to-end test: full service onboarding → preview → publish.
   - Visual QA against `Hearth - Warm Service.html`.

**Total: ~7 weeks solo, with ~5 weeks on UIBlocks alone.**

---

## 13. Risks

1. **Hearth HTML covers some sections, not all.** PetalFramedHero, services, packages, testimonials are easy to derive from the HTML. CaseStudies, IndustriesServed, ObjectionHandle, Approach — extrapolate from family rules. May need designer review checkpoint mid-Week 5.

2. **Service awareness model is new.** v3's problem-aware/solution-aware doesn't fit. New 4-state model (search-aware-cold/comparing/referral/relationship) is untested in prompts. Plan: ship, log LLM outputs, refine in Week 7.

3. **Italic-accent convention requires LLM cooperation.** Prompt must reliably get LLM to wrap 1-2 words in `<em>...</em>`. Risk: inconsistent. Mitigation: post-process — if LLM doesn't emit `<em>`, run a deterministic emphasis-picker (highlight 1 noun in headline).

4. **Existing edit infrastructure assumes element keys are stable across blocks.** Service blocks use new keys (e.g., `service_card_title`, not `feature_title`). All inline-edit hooks need to recognize these — but if they're keyed by `data-element-key` strings (not enum), it should just work. Verify Week 1.

5. **Image placeholder warmth.** Current Pexels integration uses vibe-keyword map. Service route needs warm-leaning keywords overrides. Small but real change in `imageKeywords.ts`.

6. **Bundle size.** ~32 service blocks ship even if user is on product route. Code-split per `projectType` if it matters; defer to post-launch.

7. **Switching projectType mid-flow.** If user picks wrong path in gateway and corrects after Step 3, partial draft data is wasted. Acceptable: warn + restart.

---

## 14. What Does NOT Change

- Existing v3 product flow (`/onboarding/product/*`, `/api/v3/*`) — frozen.
- Existing `src/modules/UIBlocks/` (48 product blocks) — frozen.
- Existing `useOnboardingStore` — only used by product route.
- Existing `useEditStoreLegacy` — used by both routes for edit/preview/publish.
- Auto-save / draft persistence — same `/api/saveDraft`, `/api/loadDraft`.
- Token-based project access (`/p/[slug]`, `/preview/[token]`) — same.
- Form builder + form submission — same.
- PostHog tracking — same (add `projectType` as a property).
- Image picker UI + Pexels integration — same (keyword set differs per project type).

---

## 15. Open Questions

1. Gateway wording — "tool people use" vs "work you do for them"? Or simpler "Product / Service"?
2. Allow projectType switch after Step 2 (with re-gen warning), or hard-lock from start?
3. Hearth-only at launch confirmed (no Meridian variant of service path)?
4. Service section list final — adopt the 17 above, or trim to ~12?
5. UIBlock count — 32 acceptable, or trim to ~25 (1-2 blocks per section average)?
6. Awareness model — keep 4-state proposal, or simplify to 2 (cold / warm)?
7. Italic-accent convention — `<em>` wrapping in copy, or a separate field like `headline_emphasis: string`?
8. Calendly / Cal.com integration for BookCallCTA — bundle in v1, or "embed your calendar link" copy-paste only?
9. Service-specific image picker keywords — bake in `imageKeywords.ts`, or let each palette declare its own?
10. Existing v3 projects with service-leaning content (agencies that used product route) — leave alone, or surface a "convert to service route" option?
11. Default palette pre-selection — derive from industry signal in Step 2, or always start at terracotta?
12. Renderer branching key — `project.projectType`, or compute from presence of `paletteId` (paletteId set ⇒ service)?
13. Service published pages on `/p/[slug]` — same slug pool as product, or separate namespace (`/s/[slug]`)?
14. Founder photo upload during onboarding (Step 5 assets), or only in editor post-gen?
15. Copy length: services often need longer paragraphs (2-3 sentences vs product's punchy 1-liners). Tune in `copyPromptService.ts`?
