## Lifecycle

1. UIBlock type is chosen by Strategy and section selection
2. a. UIBlock in layoutElementSchema.ts has a list of all the elements for which
    * Copy is required ==> AI Generated
    * Copy is required but needs to be validated ==> AI generated but need validation
    * copy is not required ==> We keep defaults there (may be smart defaults no copy required)

    **Three element types:**

| Type | Meaning | Example |
|------|---------|---------|
| `ai_generated` | Ready to use | headline, cta_text |
| `manual_preferred` | User provides | logo, hero_image |
| `ai_generated_needs_review` | AI placeholder, user verifies | stats, testimonials, pricing |
2. b. UIBlock in layoutElementSchema.ts has a list of optional elements
   
   Here AI can choose based on overall storyline if copy is required.

    * Copy is required ==> AI Generated
    * Copy is required but needs to be validated ==> AI generated but need validation


3. A prompt is built with all  `ai_generated` and  `ai_generated_needs_review` for both required and optional

4. We receive output and render in UIBlock with

1. AI has generated then we display
2. Optional and AI is not generated then we dont display (user can add them amnually with Add element option in section toolbar)
3. All manual preferred we display with placeholder data.. User can delete if not want

5. These are saved in the database
6. User can add and delete elements
7. Elements can be nested (which are basically cards right now), Nested elements can be added or deleted together


## New pricinples

1. We can be liberal with AI Generated optional elements now because now AI is deciding so we donot need a complex logic to include or exclue them. We can trust AI to generate whatever is required. Strategic aim is to produce a good copy
2. We have significantly reduce number of UIBlcoks from 150+ to ~47. So now we need to have control over each UIBlock.. Specially design.. they need to look good.. Alone and as a part of a landing page
3. There has to be single thread between whats there in layoutElementSchema.ts, the original tsx uiblock file, the published uiblock file
4. For each UIblock published couterpart should exist
5. For each UIBlock uiBlockTheme.md should be implemented
6. No page is live in production so no migration is required. No backward compatibility required.

 ## Data Format Principles
  1. Arrays as source of truth - no pipe-separated strings
  2. Each array item has system-generated `id`
  3. No `___REMOVED___` markers - actually delete
  4. AI output = DB format = Component format

---

## Playbook for each UIBlock Audit

### Phase 1: Schema
1. Read original .tsx file
2. List all elements used (identify pipe-strings, numbered fields, `___REMOVED___` patterns)
3. Create new schema in layoutElementSchema as per Appendix
4. Identify optional ai_generated elements that could improve copy
5. **APPROVAL CHECKPOINT**: Get approval with reasoning

### Phase 2: Implementation
6. Update layoutElementSchema.ts with new schema
7. Update .tsx component to consume new array format
8. Remove legacy code (pipe parsing, numbered field loops, `___REMOVED___` checks)
9. Verify prompt generation includes correct elements
10. Verify rendering works with AI output

### Phase 3: Design
11. Check uiBlockTheme.md is applied
12. Review screenshot - analyze and suggest design improvements
13. **APPROVAL CHECKPOINT**: Get approval for design changes
14. Implement approved design changes

### Phase 4: Sync
15. Check .published.tsx exists, create if not
16. Sync .published.tsx with schema and original .tsx

# Appendix: Schema Structure

## Combined Schema (MVP Approach)

Single schema per UIBlock containing both shape and metadata. No separate files, no Zod validation for MVP.

### Fill Modes

| fillMode | Who Generates | Display Behavior |
|----------|---------------|------------------|
| `ai_generated` | AI | Display directly |
| `ai_generated_needs_review` | AI | Display with "verify" badge |
| `manual_preferred` | - | Show `default` placeholder, user can always delete |
| `system` | Code | Auto-generated (IDs, timestamps) |

### Requirement Types

| requirement | Applies To | Meaning |
|-------------|------------|---------|
| `required` | `ai_generated` | AI always generates |
| `optional` | `ai_generated` | AI decides based on storyline |
| `required`/`optional` | `manual_preferred` | Future reference only, not used in MVP |

### Schema Structure

```typescript
export const UIBlockSchema = {
  sectionType: "UIBlockName",

  // Section-level elements (appear once)
  elements: {
    elementName: {
      type: "string" | "boolean" | "number",
      requirement: "required" | "optional",
      fillMode: "ai_generated" | "manual_preferred" | "ai_generated_needs_review",
      default?: any  // Placeholder for manual_preferred
    }
  },

  // Repeatable items (cards, lists)
  collections: {
    collectionName: {
      requirement: "required" | "optional",
      fillMode: "ai_generated",
      constraints: { min: number, max: number },
      fields: {
        id: { type: "string", fillMode: "system" },
        fieldName: { type: "string", fillMode: "ai_generated", default?: any }
      }
    }
  }
} as const;
```

## Example: leftCopyRightImage

### Schema

```typescript
export const leftCopyRightImageSchema = {
  sectionType: "leftCopyRightImage",

  elements: {
    headline:           { type: "string", requirement: "required", fillMode: "ai_generated" },
    subheadline:        { type: "string", requirement: "required", fillMode: "ai_generated" },
    cta_text:           { type: "string", requirement: "required", fillMode: "ai_generated" },
    secondary_cta_text: { type: "string", requirement: "optional", fillMode: "ai_generated" },
    supporting_text:    { type: "string", requirement: "optional", fillMode: "ai_generated" },
    badge_text:         { type: "string", requirement: "optional", fillMode: "ai_generated" },
    hero_image:         { type: "string", fillMode: "manual_preferred", default: "/hero-placeholder.jpg" },
    customer_count:     { type: "string", requirement: "optional", fillMode: "ai_generated_needs_review" },
    rating_value:       { type: "string", requirement: "optional", fillMode: "ai_generated_needs_review" },
    rating_count:       { type: "string", requirement: "optional", fillMode: "ai_generated_needs_review" },
    show_social_proof:      { type: "boolean", fillMode: "manual_preferred", default: true },
    show_customer_avatars:  { type: "boolean", fillMode: "manual_preferred", default: true },
  },

  collections: {
    trust_items: {
      requirement: "optional",
      fillMode: "ai_generated",
      constraints: { min: 0, max: 5 },
      fields: {
        id:   { type: "string", fillMode: "system" },
        text: { type: "string", fillMode: "ai_generated" },
      }
    },
    customer_avatars: {
      requirement: "optional",
      fillMode: "ai_generated_needs_review",
      constraints: { min: 0, max: 6 },
      fields: {
        id:         { type: "string", fillMode: "system" },
        name:       { type: "string", fillMode: "ai_generated_needs_review" },
        avatar_url: { type: "string", fillMode: "manual_preferred", default: "" },
      }
    }
  }
} as const;
```

### DB Content (Clean)

```json
{
  "headline": "Transform Your Business with Smart Automation",
  "subheadline": "Streamline workflows, boost productivity...",
  "cta_text": "Start Free Trial",
  "secondary_cta_text": "Watch Demo",
  "hero_image": "/hero.jpg",
  "customer_count": "500+ happy customers",
  "rating_value": "4.9/5",
  "show_social_proof": true,

  "trust_items": [
    { "id": "t1", "text": "Free 14-day trial" },
    { "id": "t2", "text": "No credit card required" },
    { "id": "t3", "text": "Cancel anytime" }
  ],

  "customer_avatars": [
    { "id": "a1", "name": "Sarah Chen", "avatar_url": "https://..." },
    { "id": "a2", "name": "Alex Rivera", "avatar_url": "" }
  ]
}
```

## Example: IconGrid (with cards)

### Schema

```typescript
export const iconGridSchema = {
  sectionType: "IconGrid",

  elements: {
    headline:    { type: "string", requirement: "required", fillMode: "ai_generated" },
    subheadline: { type: "string", requirement: "optional", fillMode: "ai_generated" },
  },

  collections: {
    features: {
      requirement: "required",
      fillMode: "ai_generated",
      constraints: { min: 3, max: 9 },
      fields: {
        id:          { type: "string", fillMode: "system" },
        title:       { type: "string", fillMode: "ai_generated" },
        description: { type: "string", fillMode: "ai_generated" },
        icon:        { type: "string", fillMode: "manual_preferred" },  // No default - computed at render
      }
    }
  }
} as const;
```

### DB Content (Clean)

```json
{
  "headline": "Powerful Features Built for You",
  "subheadline": "Everything you need to streamline your workflow.",

  "features": [
    { "id": "f1", "title": "Real-time Collaboration", "description": "Work together seamlessly...", "icon": "Users" },
    { "id": "f2", "title": "Advanced Analytics", "description": "Get deep insights..." },
    { "id": "f3", "title": "Smart Automation", "description": "Automate repetitive tasks...", "icon": "Zap" }
  ]
}
```

Note: `f2` has no icon - component will derive it from title/description at render time.

## Before vs After Comparison

| Aspect | Before (Current) | After (New) |
|--------|------------------|-------------|
| Trust items | `trust_item_1`...`trust_item_5` + `trust_items` pipe string | `trust_items: [{id, text}]` |
| Features | `feature_titles` pipe + `feature_descriptions` pipe + `icon_1`...`icon_9` | `features: [{id, title, description, icon}]` |
| Removal | `"___REMOVED___"` marker | `array.filter()` |
| Add item | Find empty numbered slot | `array.push()` |
| Reorder | Not possible cleanly | `array` reorder |
| Schema | Flat list of 20+ fields | `elements` + `collections` |

---

## Icon Handling Pattern

Icons are `manual_preferred` with **no default in schema**. Smart default computed at render time.

### Why Not AI Generated?

- AI may hallucinate invalid icon names
- Need to include valid icon list in prompt
- Adds complexity for minimal benefit

### Schema

```typescript
icon: { type: "string", fillMode: "manual_preferred" }
// No default - computed at render
```

### DB Stores

```json
{ "icon": "Rocket" }   // User explicitly set
// or
{ }                     // No icon field - derive at render
```

### Component Renders

```tsx
import * as LucideIcons from 'lucide-react';

// Derive icon: user choice → smart default → fallback
const iconName =
  item.icon ??
  getIconFromText(item.title, item.description) ??
  "Sparkles";

// Always use fallback for invalid names
const Icon = (LucideIcons as any)[iconName] ?? LucideIcons.Sparkles;

return <Icon className="w-6 h-6" />;
```

### Benefits

| Aspect | Value |
|--------|-------|
| AI prompt | No icon instructions needed |
| DB | Pure content, no control flags |
| Invalid names | Fallback handles gracefully |
| User override | Just set `icon` field |
| Smart defaults | Derived from title/description |

## Appendix - UIBlock design evaluation

Evaluation Scope                                                                                                                                                                                                                                                                                                                                   
  I evaluate:                                                                                                                                                                 - Layout & composition
  - Visual hierarchy
  - Spacing/whitespace
  - Typography hierarchy (size, weight, line-height)
  - Alignment & grid consistency
  - Visual balance
  - CTA prominence
  - Image/icon sizing & placement
  - Color contrast & harmony
  - Visual rhythm

  I don't evaluate:
  - Copy/content quality
  - Schema correctness
  - Code implementation

  My Output Format

  For each UIBlock screenshot you show me:

  **VERDICT**: APPROVED / NEEDS WORK

  **Strengths:**
  - ...

  **Issues:** (if any)
  1. [Severity: Critical/Major/Minor] Issue description
     → Recommendation

  **Priority fixes:** (ordered)
  1. ...

## UIBlocks Audit

| # | Section | UIBlock | Status |
|---|---------|---------|--------|
| 1 | Hero | LeftCopyRightImage | ✅ Passed |
| 2 | Hero | CenterStacked | ✅ Passed |
| 3 | Hero | SplitScreen | ✅ Passed |
| 4 | Hero | ImageFirst | ✅ Passed |
| 5 | FounderNote | LetterStyleBlock | ✅ Passed |
| 6 | Problem | StackedPainBullets | ✅ Passed |
| 7 | Features | IconGrid | ✅ Passed |
| 8 | Features | SplitAlternating | ✅ Passed|
| 9 | Features | Carousel | ✅ Passed |
| 10 | Features | MetricTiles | ✅ Passed |
| 11 | BeforeAfter | SideBySideBlock | ✅ Passed |
| 12 | BeforeAfter | SplitCard | ✅ Passed |
| 13 | BeforeAfter | StackedTextVisual | ✅ Passed  |
| 14 | FAQ | AccordionFAQ | ✅ Passed |
| 15 | FAQ | InlineQnAList | ⬜ Pending |
| 16 | FAQ | SegmentedFAQTabs | ⬜ Pending |
| 17 | FAQ | TwoColumnFAQ | ✅ Passed |
| 18 | HowItWorks | AccordionSteps | ⬜ Pending |
| 19 | HowItWorks | ThreeStepHorizontal | ⬜ Pending |
| 20 | HowItWorks | VerticalTimeline | ⬜ Pending |
| 21 | HowItWorks | VideoWalkthrough | ⬜ Pending |
| 22 | ObjectionHandle | MythVsRealityGrid | ⬜ Pending |
| 23 | ObjectionHandle | VisualObjectionTiles | ⬜ Pending |
| 24 | Pricing | TierCards | ✅ Passed |
| 25 | Pricing | CallToQuotePlan | ✅ Passed |
| 26 | Pricing | SliderPricing | ⬜ Pending |
| 27 | Pricing | ToggleableMonthlyYearly | ⬜ Pending |
| 28 | Results | ResultsGallery | ⬜ Pending |
| 29 | Results | StackedWinsList | ⬜ Pending |
| 30 | Results | StatBlocks | ⬜ Pending |
| 31 | Testimonials | BeforeAfterQuote | ⬜ Pending |
| 32 | Testimonials | PullQuoteStack | ⬜ Pending |
| 33 | Testimonials | QuoteGrid | ⬜ Pending |
| 34 | Testimonials | AvatarCarousel | ⬜ Pending |
| 35 | Testimonials | VideoTestimonials | ⬜ Pending |
| 36 | UniqueMechanism | MethodologyBreakdown | ⬜ Pending |
| 37 | UniqueMechanism | ProcessFlowDiagram | ⬜ Pending |
| 38 | UniqueMechanism | PropertyComparisonMatrix | ⬜ Pending |
| 39 | UniqueMechanism | SecretSauceReveal | ⬜ Pending |
| 40 | UniqueMechanism | StackedHighlights | ⬜ Pending |
| 41 | UniqueMechanism | TechnicalAdvantage | ⬜ Pending |
| 42 | UseCases | IndustryUseCaseGrid | ⬜ Pending |
| 43 | UseCases | PersonaGrid | ⬜ Pending |
| 44 | UseCases | RoleBasedScenarios | ⬜ Pending |
| 45 | CTA | CenteredHeadlineCTA | ⬜ Pending |
| 46 | CTA | ValueStackCTA | ⬜ Pending |
| 47 | CTA | VisualCTAWithMockup | ⬜ Pending |
| 48 | SocialProof | LogoWall | ⬜ Pending |
| 49 | Header | MinimalNavHeader | ⬜ Pending |
| 50 | Footer | ContactFooter | ⬜ Pending |

**Legend:**
- ✅ Passed - Audit complete, V2 compliant
- 📋 Plan Approved - Ready for implementation
- ⚠️ Plan Needs Revision - Missing V2 schema conversion
- ⬜ Pending - Not yet audited
