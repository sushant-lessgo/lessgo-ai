# Optional Elements Bug Documentation

## Bug Summary
Optional elements that fail conditional criteria are still appearing in the UI with default content, when they should be completely excluded from the section.

## Root Cause Analysis

### The Conditional Element System
The system has a sophisticated conditional element selection mechanism:

1. **Mandatory Elements**: Always included (e.g., `headline`, `cta_text`)
2. **Optional Elements**: Only included if they meet specific scoring criteria based on user onboarding data

### The Bug
When optional elements don't meet their criteria:
- ✅ **Correctly excluded from AI generation** - AI only generates mandatory elements
- ❌ **Incorrectly included in UI** - Component shows them with default content from CONTENT_SCHEMA

## Evidence from Hero centerStacked Investigation

### Schema Definition (`layoutElementSchema.ts`)
```javascript
centerStacked: [
  { element: "headline", mandatory: true },        // ✅ Always generated
  { element: "cta_text", mandatory: true },        // ✅ Always generated  
  { element: "subheadline", mandatory: false },    // ❌ Conditional but showing in UI
  { element: "supporting_text", mandatory: false } // ❌ Conditional but showing in UI
]
```

### Conditional Rules (`selectOptionalElements.ts`)

**`subheadline`** requires (minScore: 5):
- `awarenessLevel`: ["unaware", "problem-aware"] (weight: 4)
- `copyIntent`: ["pain-led"] (weight: 3) 
- `landingPageGoals`: ["waitlist", "early-access", "signup"] (weight: 2)

**`supporting_text`** requires (minScore: 5):
- `targetAudience`: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"] (weight: 4)
- `marketSophisticationLevel`: ["level-1", "level-2"] (weight: 3)

### User's Actual Values (from debug logs)
```
awarenessLevel: 'solution-aware'          // ❌ Doesn't match criteria
targetAudience: 'Product Marketers'       // ❌ Doesn't match criteria  
marketSophisticationLevel: 'level-3'      // ❌ Doesn't match criteria
landingGoal: 'Start Free Trial'           // ❌ Doesn't match criteria
```

### Expected vs Actual Behavior

**Expected Behavior:**
- AI generates only: `headline`, `cta_text` 
- UI shows only: `headline`, `cta_text`
- Total fields visible: 2

**Actual Behavior:**
- AI generates only: `headline`, `cta_text` ✅
- UI shows: `headline`, `cta_text`, `subheadline` (with default), `supporting_text` (with default) ❌
- Total fields visible: 4

## The Problem Location

The issue is in the `useLayoutComponent` hook and `extractLayoutContent` function:

1. **AI Generation**: Correctly uses conditional logic → generates 2 fields
2. **Store Population**: Correctly stores only the 2 generated fields  
3. **UI Rendering**: `extractLayoutContent()` merges store data with CONTENT_SCHEMA defaults → shows 4 fields

### Code Flow
```javascript
// 1. AI generates only mandatory elements ✅
{ headline: "...", cta_text: "..." }

// 2. Store correctly saves only generated elements ✅  
section.elements = { headline: "...", cta_text: "..." }

// 3. UI incorrectly adds defaults for optional elements ❌
extractLayoutContent(elements, CONTENT_SCHEMA) 
// Returns: { headline: "...", cta_text: "...", subheadline: "default", supporting_text: "default" }
```

## Impact

### Current Issues
1. **Confusing UX**: Users see fields that shouldn't exist
2. **Regeneration Confusion**: Section regeneration tries to regenerate fields that weren't originally generated
3. **Inconsistent Behavior**: Generation logic differs from UI rendering logic

### Regeneration Impact
This bug was discovered while investigating section regeneration. The regeneration was working correctly, but users expected to regenerate 4 fields when only 2 were actually AI-generated.

## Solution Requirements

The optional element system needs to be consistent across:

1. **AI Generation**: ✅ Already working - uses conditional logic
2. **Store Population**: ✅ Already working - stores only generated elements
3. **UI Rendering**: ❌ Needs fix - should respect conditional logic

### Proposed Fix
Modify `extractLayoutContent` or `useLayoutComponent` to:
1. Check which elements were actually AI-generated (using conditional logic)
2. Only show defaults for elements that meet the conditional criteria
3. Completely exclude optional elements that don't meet criteria

### Files to Investigate
- `src/hooks/useLayoutComponent.ts` - Where defaults are applied
- `src/types/storeTypes.ts` - `extractLayoutContent` function  
- `src/modules/sections/selectOptionalElements.ts` - Conditional logic (already correct)
- `src/modules/sections/layoutElementSchema.ts` - Element definitions (already correct)

## Test Case
Create a user profile that triggers different optional element combinations and verify:
1. AI generates only appropriate elements
2. Store contains only generated elements  
3. UI shows only generated elements (no defaults for excluded optionals)

## Related Systems
This bug likely affects all sections with optional elements, not just Hero. Each section type may have different optional elements that are incorrectly showing defaults.

## Separation of Concerns
This is a separate bug from the regeneration feature. Regeneration is working correctly - it regenerates whatever elements exist in the store. The issue is that the store/UI system is inconsistent about which elements should exist.

---

**Status**: Documented for separate resolution
**Priority**: Medium (affects UX consistency but doesn't break core functionality)
**Type**: Logic inconsistency between generation and rendering systems