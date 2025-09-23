# Element Transform: Fixing UIBlock Content Delivery

## Current State

### Fragmented Architecture
The system has **three separate, disconnected pieces** that should work together:

1. **`layoutElementSchema.ts`** - Defines which elements exist per UIBlock
   ```typescript
   TimelineResults: [
     { element: "headline", mandatory: true },
     { element: "timeframes", mandatory: true },
     { element: "titles", mandatory: true },
     { element: "descriptions", mandatory: true },
     { element: "metrics", mandatory: false },
     // ... no scope or generation info
   ]
   ```

2. **`fieldClassification.ts`** - Defines AI vs manual generation
   ```typescript
   function classifyTimelineResultsField(fieldName: string) {
     if (field === 'timeframes' || field === 'titles' || field === 'descriptions') {
       return { category: 'ai_generated', confidence: 0.9 }
     }
   }
   ```

3. **Hard-coded Detection Logic** - Broken pattern matching
   ```typescript
   // In buildPrompt.ts - BROKEN
   const isCardBased = element.includes('titles') || element.includes('descriptions')
   // Missing: timeframes, metrics, and many other card-based elements
   ```



## Standard Operating Procedure (SOP): Transforming all UIBlocks/layouts
### Overview
For each UIBlock, Claude Code will systematically scan through multiple source files to gather all element information and consolidate it into a unified schema in `layoutElementSchema.ts`.

### Input Sources to Scan

#### 1. **UIBlock Component File** (`/src/modules/UIBlocks/[Category]/[ComponentName].tsx`)
**What to Extract:**
- Interface definitions (content schema)
- `CONTENT_SCHEMA` with default values
- Element names and their types
- Mandatory vs optional fields
- Any parsing logic that indicates card-based elements

**Example - TimelineResults.tsx:**
```typescript
interface TimelineResultsContent {
  headline: string;
  timeframes: string;        // ← Card element
  titles: string;           // ← Card element
  descriptions: string;     // ← Card element
  metrics?: string;         // ← Card element (optional)
  subheadline?: string;     // ← Section element (optional)
}

const CONTENT_SCHEMA = {
  timeframes: { default: 'Day 1|Week 2|Month 1|...' },  // ← Pipe-separated = card element
}
```

#### 2. **Field Classification** (`/src/modules/generation/fieldClassification.ts`)
**What to Extract:**
- Generation category: `'ai_generated' | 'manual_preferred'`
- Reasoning and user guidance
- Fallback strategies

**Example:**
```typescript
function classifyTimelineResultsField(fieldName: string) {
  if (field === 'timeframes') {
    return {
      category: 'ai_generated',      // ← Generation type
      reason: 'Timeline progression requires AI generation'
    }
  }
}
```

#### 3. **Layout Registry with Requirements** (`/src/modules/sections/layoutRegistryWithRequirements.ts`)
**What to Extract:**
- Card requirements (min, max, optimal)
- Card type ('cards', 'pairs', 'items', 'blocks')
- Component description

**Example:**
```typescript
TimelineResults: {
  component: 'TimelineResults',
  cardRequirements: {
    type: 'cards',                    // ← Card structure type
    min: 3, max: 6, optimal: [4, 5], // ← Card count constraints
    description: 'Timeline of results/achievements'
  }
}
```

#### 4. **Current Layout Element Schema** (`/src/modules/sections/layoutElementSchema.ts`)
**What to Extract:**
- Current element list and mandatory flags
- Any existing structure to preserve

**Example:**
```typescript
TimelineResults: [
  { element: "headline", mandatory: true },     // ← Preserve existing info
  { element: "timeframes", mandatory: true },
  // ...
]
```

### Analysis Process

#### Step 1: Correcting layoutElementSchema.ts

1.1 Creating master list of all elements... Consider /UIBlock code as source and make sure layoutElementSchema.ts has all the elements required by UIBlock
1.2 Determine Mandatory vs Optional (Copywriting-First Approach)
**Start with copywriting logic, not technical constraints:**

**Decision Process:**
1. **Evaluate Copywriting Necessity:**
   - Is this element essential to the core message?
   - Would removing it break the narrative flow?
   - Is it structural (mandatory) or decorative/supportive (potentially optional)?

2. **Ensure Alignment:**
   - Every `mandatory: false` element MUST have conditions in selectOptionalElements.ts
   - If no conditions exist for an optional element, either: 
    Define appropriate conditions based on copywriting logic

**Decision Tree:**
```
Is element core to UIBlock's purpose?
├─ YES → mandatory: true
└─ NO → Does it enhance specific scenarios?
    ├─ YES → mandatory: false + verify/add conditions in selectOptionalElements.ts
    └─ NO → mandatory: true (include by default)
```
NOTE: Within a card, all elements are mandatory

#### Step 2: Identify Element Scope
**Determine which elements are card-scoped vs section-scoped:**

**Card-Scoped Indicators:**
- Default values contain pipe separators (`|`)
- Element names in plural form (`titles`, `descriptions`, `questions`)
- Array parsing logic in component (`split('|')`)
- Field classification mentions "pipe-separated"

**Section-Scoped Indicators:**
- Single default values (no pipes)
- Singular element names (`headline`, `subheadline`)
- No array parsing logic
- Apply to entire section, not individual cards

#### Step 3: Map Generation Types
**From fieldClassification.ts:**
- Extract `category` for each element ('ai_generated' | 'manual_preferred')
- Note any special handling requirements

#### Step 4: Determine Card Structure
1. **From layoutRegistryWithRequirements.ts:**
2. **From UIBlock common sense if does not exist in layoutRegistryWithRequirements.ts**
- Extract card type: `'cards' | 'pairs' | 'items' | 'blocks'`
- Extract constraints: `min`, `max`, `optimal`
- Understand the card structure pattern

#### Step 5: Consolidate Information
**Merge all sources into unified schema:** 

Example:

 TimelineResults: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "timeline_period", mandatory: false, generation: "ai_generated" },
      { element: "success_title", mandatory: false, generation: "ai_generated" },
      { element: "success_subtitle", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon", mandatory: true, generation: "manual_preferred" },
      { element: "timeline_icon", mandatory: true, generation: "manual_preferred" },
      { element: "success_icon", mandatory: true, generation: "manual_preferred" }
    ],
    

    cardStructure: {
      type: "cards",
      elements: ["timeframes", "titles", "descriptions", "metrics"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Timeline of results/achievements'
    }
  },

#### Step 6: Component Verification

**How unified schema works with element selection:**

The unified schema integrates with the element selection system to create a complete pipeline from schema definition to copy generation:

**Integration Flow:**
```
1. Unified Schema Definition
   ↓
2. AI-Generated Elements Extracted (by generation type)
   ↓
3. Optional Elements Filtered (by business context via selectOptionalElements.ts)
   ↓
4. Final Element List for Copy Generation
```

**Schema-Driven Element Selection:**
- **Generation Type Filtering**: Only elements marked `generation: 'ai_generated'` get copy generation
- **Business Context Application**: Elements marked `mandatory: false` are evaluated against conditions
- **Card Structure Awareness**: Section vs card elements handled appropriately

So ensure


**Final validation step to ensure schema-component alignment:**

Make sure that UIBlock code is capable enough to receive dynamic Card counts and is able to generate dynamic number of cards as per the guidance from buildprompt.ts

Make sure that dynamic icons UIBlock is able to receive.. We implemented recently in stackedhighlights.tsx

MAKE SURE ADD AND REMOVE FUNCTIONALITY OF CARDS IN A UIBLOCK IS NOT IMPACTED

