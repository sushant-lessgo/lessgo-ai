# Background Assignment Simplification

## Problem
`enhancedBackgroundLogic.ts` uses complex 6-step algorithm with old taxonomy fields, but:
1. `sectionList.ts` already defines background per section type
2. V3 flows are deterministic - no need for profile-based logic
3. Old fields (awarenessLevel, marketSophisticationLevel) no longer relevant

---

## Current Flow (Complex)

```
Strategy → Sections → enhancedBackgroundLogic.ts (6 steps) → Backgrounds
                              ↓
                    - User profile analysis
                    - Conversion priority matrix (Tier 1-4)
                    - Smart upgrades
                    - Rhythm enforcement
                    - Adjacency checks
                    - Final validation
```

**Files:**
- `enhancedBackgroundLogic.ts:257-411` - 150+ lines of complexity
- `backgroundIntegration.ts:276-292` - Orchestrator

---

## New Flow (Simple)

```
Strategy → Sections → sectionList.background + rhythm → Backgrounds
```

**Use existing sectionList.ts definitions:**

| Section | sectionList.background | Maps To |
|---------|------------------------|---------|
| Header | neutral | neutral |
| Hero | primary-highlight | primary |
| Problem | neutral | neutral |
| BeforeAfter | neutral | neutral |
| UseCases | neutral | neutral |
| Features | secondary-highlight | secondary |
| UniqueMechanism | secondary-highlight | secondary |
| HowItWorks | neutral | neutral |
| Results | neutral | neutral |
| Testimonials | neutral | neutral |
| SocialProof | divider-zone | divider |
| ObjectionHandling | secondary-highlight | secondary |
| Pricing | secondary-highlight | secondary |
| FounderNote | neutral | neutral |
| FAQ | divider-zone | divider |
| CTA | primary-highlight | primary |
| Footer | neutral | neutral |

---

## Implementation

### New Function (~30 lines)

```ts
import { sectionList } from '@/modules/sections/sectionList';

type BackgroundType = 'primary' | 'secondary' | 'neutral' | 'divider';

const BACKGROUND_MAP: Record<string, BackgroundType> = {
  'primary-highlight': 'primary',
  'secondary-highlight': 'secondary',
  'divider-zone': 'divider',
  'neutral': 'neutral',
};

export function assignSectionBackgrounds(
  sections: string[]
): Record<string, BackgroundType> {
  const result: Record<string, BackgroundType> = {};
  let consecutiveHighlights = 0;

  for (const section of sections) {
    const sectionMeta = sectionList[section];
    const baseline = sectionMeta?.background || 'neutral';
    let bg = BACKGROUND_MAP[baseline] || 'neutral';

    // Rhythm: max 2 consecutive highlights (primary/secondary)
    const isHighlight = bg === 'primary' || bg === 'secondary';

    if (isHighlight && consecutiveHighlights >= 2) {
      // Downgrade to neutral, but never downgrade Hero/CTA
      if (section !== 'hero' && section !== 'cta') {
        bg = 'neutral';
      }
    }

    // Track consecutive
    if (bg === 'primary' || bg === 'secondary') {
      consecutiveHighlights++;
    } else {
      consecutiveHighlights = 0;
    }

    result[section] = bg;
  }

  return result;
}
```

---

## Files to Change

| File | Action |
|------|--------|
| `src/modules/Design/background/enhancedBackgroundLogic.ts` | Archive entire file |
| `src/modules/Design/background/backgroundIntegration.ts` | Replace orchestrator with simple function |
| `src/hooks/editStore/generationActions.ts:61-72` | Update call site |

---

## Files to Archive

Move to `archive/background-legacy/`:
- `enhancedBackgroundLogic.ts` (entire file)

---

## What Gets Removed

- `CONVERSION_PRIORITIES` matrix
- `analyzeUserProfile()` function
- Tier-based upgrade logic
- Profile tag matching
- 6-step algorithm
- ~400 lines of complex code

---

## What Stays

- `sectionList.ts` background definitions (source of truth)
- `backgroundIntegration.ts` (simplified)
- `backgroundSelection.ts` (primary background CSS generation)
- Simple rhythm enforcement (max 2 consecutive)

---

## Verification

1. Generate waitlist page → check backgrounds alternate correctly
2. Generate buy page → check Hero=primary, CTA=primary, Features=secondary
3. Check no 3+ consecutive highlighted sections
4. Visual review in preview mode

---

## Benefits

| Before | After |
|--------|-------|
| 400+ lines | ~30 lines |
| Profile-based complexity | Simple lookup |
| Old taxonomy dependencies | None |
| Hard to maintain | Easy to modify |
| 6-step algorithm | 1-step + rhythm |
