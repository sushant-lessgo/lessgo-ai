# UIBlock Data Format Standardization

## Problem Summary

UIBlocks use 3 different data patterns causing:
1. **Rendering crashes** - AI returns arrays, components expect pipe-separated strings
2. **Schema confusion** - layoutElementSchema defines one format, AI generates another
3. **Maintenance burden** - parsing logic scattered across 63+ components

**Current Crash**: `MythVsRealityGrid.tsx` - AI returns `myth_reality_pairs: [{myth, reality}]` array, component calls `.split('|')` on it.

---

## Canonical Pattern (per SecondOpinion.md)

### 1. Arrays as source of truth
- AI generates arrays ✅
- DB/state/save format uses arrays ✅
- Validation operates on arrays ✅

### 2. Add `id` per item
- Helps React keys, reordering, diffing
- Prevents "edit jumps" when items inserted/removed

### 3. Normalize at boundary, once
- Single normalizer function per UIBlock type
- Component receives only canonical format
- No parsing logic inside components

### 4. Kill legacy formats long-term
- Pipe-separated strings ❌
- `___REMOVED___` markers ❌
- Parallel arrays (`questions[]` + `answers[]`) ❌

---

## Implementation Plan

### Phase 1: Foundation (normalizer infrastructure)

**Step 1.1: Create normalizer module structure**
```
src/modules/UIBlocks/normalizers/
├── index.ts              # Re-exports all normalizers
├── types.ts              # Shared canonical types
├── mythRealityNormalizer.ts  ✅ DONE
├── faqNormalizer.ts
├── featureNormalizer.ts
├── testimonialNormalizer.ts
├── stepNormalizer.ts
├── pricingNormalizer.ts
├── objectionNormalizer.ts
└── personaNormalizer.ts
```

**Step 1.2: Define canonical types** (`types.ts`)
```typescript
// Base item with id
interface BaseItem { id: string; }

// Canonical types
export type FAQItem = BaseItem & { question: string; answer: string };
export type FeatureItem = BaseItem & { title: string; description: string; icon?: string };
export type TestimonialItem = BaseItem & { quote: string; author: string; title?: string; company?: string; avatar?: string };
export type StepItem = BaseItem & { title: string; description: string; icon?: string; number?: number };
export type MythRealityItem = BaseItem & { myth: string; reality: string };
// etc.
```

### Phase 2: Fix Crashing Components (Priority)

**MythVsRealityGrid** - Currently crashes

| File | Action |
|------|--------|
| `normalizers/mythRealityNormalizer.ts` | ✅ DONE |
| `ObjectionHandle/MythVsRealityGrid.tsx` | Update to use normalizer |
| `ObjectionHandle/MythVsRealityGrid.published.tsx` | Update to use normalizer |

**VisualObjectionTiles** - Likely same issue

| File | Action |
|------|--------|
| `normalizers/objectionNormalizer.ts` | CREATE |
| `ObjectionHandle/VisualObjectionTiles.tsx` | Update to use normalizer |
| `ObjectionHandle/VisualObjectionTiles.published.tsx` | Update to use normalizer |

### Phase 3: Update Remaining UIBlocks (by category)

**FAQ (5 components)**
- AccordionFAQ, TwoColumnFAQ, InlineQnAList, SegmentedFAQTabs
- Create `faqNormalizer.ts`

**Features (3 components)**
- IconGrid, Carousel, SplitAlternating
- Create `featureNormalizer.ts`

**Testimonials (4 components)**
- AvatarCarousel, PullQuoteStack, QuoteGrid, BeforeAfterQuote
- Create `testimonialNormalizer.ts`

**HowItWorks (3 components)**
- ThreeStepHorizontal, VerticalTimeline, AccordionSteps
- Create `stepNormalizer.ts`

**Pricing (4 components)**
- TierCards, ToggleableMonthlyYearly, SliderPricing, CallToQuotePlan
- Create `pricingNormalizer.ts`

**UniqueMechanism (6 components)**
- StackedHighlights, ProcessFlowDiagram, MethodologyBreakdown, etc.
- Create `highlightNormalizer.ts`

**Problem/UseCases (4 components)**
- PersonaPanels, PersonaGrid, RoleBasedScenarios, CollapsedCards
- Create `personaNormalizer.ts`

### Phase 4: Update AI Prompt Element Schemas

**File**: `src/modules/copy/copyPromptV3.ts`

Add missing element schemas to `getElementSchemas()`:
```typescript
- myth_reality_items: array of { myth: string, reality: string }
- objection_tiles: array of { objection: string, response: string, icon?: string }
- highlight_items: array of { title: string, description: string, icon?: string }
```

### Phase 5: Update layoutElementSchema

**File**: `src/modules/sections/layoutElementSchema.ts`

Update cardStructure elements to use canonical array keys:
```typescript
MythVsRealityGrid: {
  cardStructure: {
    type: "pairs",
    elements: ["myth_reality_items"],  // was myth_reality_pairs
    generation: "ai_generated"
  }
}
```

---

## Files Summary

| Priority | File | Action |
|----------|------|--------|
| P0 | `normalizers/mythRealityNormalizer.ts` | ✅ DONE |
| P0 | `ObjectionHandle/MythVsRealityGrid.tsx` | Use normalizer |
| P0 | `ObjectionHandle/MythVsRealityGrid.published.tsx` | Use normalizer |
| P1 | `normalizers/types.ts` | Create canonical types |
| P1 | `normalizers/index.ts` | Export all normalizers |
| P1 | `normalizers/objectionNormalizer.ts` | Create for VisualObjectionTiles |
| P2 | `normalizers/faqNormalizer.ts` | Create |
| P2 | `normalizers/featureNormalizer.ts` | Create |
| P2 | `normalizers/testimonialNormalizer.ts` | Create |
| P2 | `normalizers/stepNormalizer.ts` | Create |
| P2 | `copy/copyPromptV3.ts` | Add element schemas |
| P3 | `sections/layoutElementSchema.ts` | Update element keys |

---

## Normalizer Pattern (Template)

Each normalizer follows this structure:

```typescript
// Canonical type
export type FooItem = { id: string; field1: string; field2: string };
export type FooCanonical = { headline: string; items: FooItem[] };

// Incoming type (supports all formats)
export type FooIncoming = {
  headline?: string;
  // Array format
  foo_items?: Array<{ field1: string; field2: string; id?: string }>;
  // Pipe-separated legacy
  field1_list?: string;
  field2_list?: string;
  // Individual numbered fields
  field1_1?: string; field2_1?: string;
  field1_2?: string; field2_2?: string;
  // ...
};

// Normalize function
export function normalizeFoo(content: FooIncoming): FooCanonical {
  // 1) Try array format first
  // 2) Try pipe-separated fallback
  // 3) Try individual fields fallback
  return { headline, items };
}

// Convert back for save (optional, for migration)
export function toIndividualFields(canonical: FooCanonical): Record<string, string>;
```

---

## Component Update Pattern

Before:
```typescript
const parseMythRealityPairs = (content) => {
  // Complex parsing logic
  if (content.myth_reality_pairs) {
    return content.myth_reality_pairs.split('|')...
  }
  // Individual fields fallback
  ...
};
```

After:
```typescript
import { normalizeMythReality } from '../normalizers';

const { items } = normalizeMythReality(blockContent);
// items is always canonical: { id, myth, reality }[]
```

---

## Verification

1. Run V3 onboarding flow end-to-end
2. Confirm MythVsRealityGrid renders without crash
3. Confirm VisualObjectionTiles renders
4. Test editing myth/reality pairs in editor
5. Test add/remove pairs functionality
6. Verify published pages render correctly

---

## Migration Notes

- Individual fields kept for editor UX (direct inline editing)
- `toIndividualFields()` converts canonical → numbered fields on save
- Long-term: migrate to array-only storage once all consumers updated


=========================================



