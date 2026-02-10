# Dynamic Card Layout System

## Problem

Static 3-column grids break visual balance when card count != 3:

```
2 cards on 3-col grid:
┌────────┐ ┌────────┐ ┌────────┐
│ Card 1 │ │ Card 2 │ │ EMPTY  │  ← Feels incomplete
└────────┘ └────────┘ └────────┘

4 cards on 3-col grid:
┌────────┐ ┌────────┐ ┌────────┐
│ Card 1 │ │ Card 2 │ │ Card 3 │
└────────┘ └────────┘ └────────┘
┌────────┐
│ Card 4 │ ← Orphan, left-aligned
└────────┘
```

---

## Solution

Dynamic grid columns + card sizing based on count.

---

## Utility Function

Create `src/utils/dynamicCardLayout.ts`:

```tsx
export interface SplitLayoutConfig {
  firstRowCount: number;
  firstRowGrid: string;
  firstRowCard: string;
  secondRowGrid: string;
  secondRowCard: string;
}

export interface CardLayoutConfig {
  gridClass: string;
  cardClass: string;
  containerClass: string;
  splitLayout?: SplitLayoutConfig;  // For 5-card special case
}

export function getDynamicCardLayout(count: number): CardLayoutConfig {
  switch (count) {
    case 1:
      return {
        gridClass: 'grid grid-cols-1 justify-items-center',
        cardClass: 'p-10 w-full max-w-lg',
        containerClass: 'max-w-2xl mx-auto'
      };

    case 2:
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-8',
        cardClass: 'p-8 lg:p-10',
        containerClass: 'max-w-4xl mx-auto'
      };

    case 3:
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8',
        cardClass: 'p-6 lg:p-8',
        containerClass: 'max-w-6xl mx-auto'
      };

    case 4:
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-6',
        cardClass: 'p-6 lg:p-8',
        containerClass: 'max-w-5xl mx-auto'
      };

    case 5:
      // Special: use splitLayout for 3+2 arrangement
      return {
        gridClass: '', // Not used - see splitLayout
        cardClass: '',
        containerClass: 'max-w-6xl mx-auto',
        splitLayout: {
          firstRowCount: 3,
          firstRowGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8',
          firstRowCard: 'p-6 lg:p-8',
          secondRowGrid: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-6 lg:mt-8',
          secondRowCard: 'p-8 lg:p-10'
        }
      };

    default: // 6+
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        cardClass: 'p-5 lg:p-6',
        containerClass: 'max-w-6xl mx-auto'
      };
  }
}

// Helper to check if layout needs split rendering
export function isSplitLayout(count: number): boolean {
  return count === 5;
}
```

---

## Visual Spec

| Count | Columns | Card Padding | Container Width | Behavior |
|-------|---------|--------------|-----------------|----------|
| 1 | 1 | 40px | max-w-2xl | Centered, generous |
| 2 | 2 | 32-40px | max-w-4xl | Side by side, balanced |
| 3 | 3 | 24-32px | max-w-6xl | Standard 3-col |
| 4 | 2x2 | 24-32px | max-w-5xl | 2 rows, balanced |
| 5 | 3+2 split | 24-32px / 32-40px | max-w-6xl | Top 3 standard, bottom 2 centered+larger |
| 6+ | 3-col wrap | 20-24px | max-w-6xl | Natural wrap, compact |

```
1 card:     ┌──────────────────┐
            │     Centered     │
            └──────────────────┘

2 cards:    ┌──────────┐ ┌──────────┐
            │  Larger  │ │  Larger  │
            └──────────┘ └──────────┘

3 cards:    ┌───────┐ ┌───────┐ ┌───────┐
            │ Std   │ │ Std   │ │ Std   │
            └───────┘ └───────┘ └───────┘

4 cards:    ┌─────────┐ ┌─────────┐
            │ Balanced│ │ Balanced│
            ├─────────┤ ├─────────┤
            │ Balanced│ │ Balanced│
            └─────────┘ └─────────┘

5 cards:    ┌───────┐ ┌───────┐ ┌───────┐
            │ Std   │ │ Std   │ │ Std   │
            └───────┘ └───────┘ └───────┘
               ┌──────────┐ ┌──────────┐
               │  Larger  │ │  Larger  │  ← Centered, larger padding
               └──────────┘ └──────────┘
```

---

## Files to Update (26 total)

### Category A: Static Grids (11 files)
No count-awareness at all — always uses fixed 3-col.

| File | Line | Issue |
|------|------|-------|
| `UniqueMechanism/SecretSauceReveal.tsx` | 309 | Static `lg:grid-cols-3` |
| `UniqueMechanism/SecretSauceReveal.published.tsx` | 114 | Static `lg:grid-cols-3` |
| `Features/IconGrid.tsx` | 330 | Static `lg:grid-cols-3` |
| `Features/IconGrid.published.tsx` | 137 | Static `lg:grid-cols-3` |
| `UseCases/IndustryUseCaseGrid.tsx` | 311 | Static `lg:grid-cols-3` |
| `UseCases/IndustryUseCaseGrid.published.tsx` | 117 | Static `lg:grid-cols-3` |
| `Features/Carousel.published.tsx` | 115 | Static `lg:grid-cols-3` |
| `Testimonials/PullQuoteStack.tsx` | 305 | Static `md:grid-cols-3` |
| `Testimonials/PullQuoteStack.published.tsx` | ~same | Static `md:grid-cols-3` |
| `HowItWorks/VideoWalkthrough.tsx` | 401 | Static `md:grid-cols-3` (demo_stats) |
| `HowItWorks/VideoWalkthrough.published.tsx` | 291 | Static `md:grid-cols-3` (demo_stats) |

### Category B: Count-Aware but Inconsistent (15 files)
Has some count logic but missing: 5-card split, dynamic padding, consistent max-widths.

| File | Line | Issues |
|------|------|--------|
| `Features/Carousel.tsx` | 590-593 | ❌ uses 3-6 cols, ❌ no 1-2 handling, ❌ no 5-split, ❌ no padding |
| `Features/MetricTiles.tsx` | 316-322 | ❌ 4-col for 4 cards, ❌ no 5-split, ❌ no padding scale, ❌ 2-card no max-w |
| `Features/MetricTiles.published.tsx` | ~74 | Same issues |
| `UseCases/PersonaGrid.tsx` | 333-339 | ❌ 4-col for 4, ❌ 5-col for 5!, ❌ no padding scale |
| `UseCases/PersonaGrid.published.tsx` | 83-86 | Same issues |
| `Testimonials/QuoteGrid.tsx` | 410-413 | ❌ no 5-split, ❌ no padding scale |
| `Testimonials/QuoteGrid.published.tsx` | 149-150 | Same issues |
| `UniqueMechanism/MethodologyBreakdown.tsx` | 279-284 | ✅ 2x2 for 4, ❌ no 5-split, ❌ no padding scale, ❌ 2-card no max-w |
| `UniqueMechanism/MethodologyBreakdown.published.tsx` | 104-106 | Same issues |
| `Results/StatBlocks.tsx` | 401-405 | ❌ missing 1-card, ❌ 4-col for 4, ❌ no 5-split, ❌ no padding scale |
| `Results/StatBlocks.published.tsx` | 74 | Same issues |
| `UniqueMechanism/TechnicalAdvantage.tsx` | 284-289 | ✅ 2x2 for 4, ❌ no 5-split, ❌ no padding scale, ❌ 2-card no max-w |
| `UniqueMechanism/TechnicalAdvantage.published.tsx` | 112-114 | Same issues |
| `UniqueMechanism/ProcessFlowDiagram.tsx` | 139-143 | ❌ no 5-split, ❌ no padding scale |
| `UniqueMechanism/ProcessFlowDiagram.published.tsx` | 103-107 | Same issues |

### Excluded (Verified OK)

| File | Reason |
|------|--------|
| `Pricing/TierCards.tsx` | Semantic pricing tiers, has good logic |
| `Problem/StackedPainBullets.tsx` | Vertical stack, not grid |
| `ObjectionHandle/MythVsRealityGrid.tsx` | Semantic pairs (myth vs reality = 2-col) |
| `ObjectionHandle/VisualObjectionTiles.tsx` | Has flex-centering solution already |
| `UseCases/RoleBasedScenarios.tsx` | No grid layout |
| `Features/SplitAlternating.tsx` | Alternating rows, not card grid |

---

## Current Logic Comparison

| Component | 1 card | 2 cards | 3 cards | 4 cards | 5 cards | Padding |
|-----------|--------|---------|---------|---------|---------|---------|
| **Utility (target)** | ✅ centered, max-w-lg | ✅ max-w-4xl, larger | ✅ 3-col | ✅ 2x2 | ✅ 3+2 split | ✅ dynamic |
| MetricTiles | ✅ centered | ❌ no max-w | ✅ | ❌ 4-col | ❌ orphans | ❌ static |
| PersonaGrid | ✅ max-w-md | ✅ max-w-3xl | ✅ | ❌ 4-col | ❌ 5-col! | ❌ static |
| QuoteGrid | ✅ max-w-2xl | ✅ max-w-4xl | ✅ | ✅ 2-col | ❌ orphans | ❌ static |
| MethodologyBreakdown | ✅ max-w-2xl | ❌ no max-w | ✅ | ✅ 2x2 | ❌ orphans | ❌ static |
| StatBlocks | ❌ missing | ✅ max-w-3xl | ✅ | ❌ 4-col | ❌ orphans | ❌ static |
| TechnicalAdvantage | ✅ max-w-2xl | ❌ no max-w | ✅ | ✅ 2x2 | ❌ orphans | ❌ static |
| **Static 7 files** | ❌ | ❌ | ✅ | ❌ orphan | ❌ orphans | ❌ static |

---

## Implementation Pattern

### Before
```tsx
<div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(item => (
      <Card className="p-8" ... />
    ))}
  </div>
</div>
```

### After (Standard)
```tsx
import { getDynamicCardLayout, isSplitLayout } from '@/utils/dynamicCardLayout';

const layout = getDynamicCardLayout(items.length);

// Standard layout (1-4 or 6+ items)
{!isSplitLayout(items.length) && (
  <div className={layout.containerClass}>
    <div className={layout.gridClass}>
      {items.map(item => (
        <Card className={layout.cardClass} ... />
      ))}
    </div>
  </div>
)}
```

### After (5-card Split Layout)
```tsx
// 5-card split layout
{isSplitLayout(items.length) && layout.splitLayout && (
  <div className={layout.containerClass}>
    {/* First row: 3 cards */}
    <div className={layout.splitLayout.firstRowGrid}>
      {items.slice(0, layout.splitLayout.firstRowCount).map(item => (
        <Card className={layout.splitLayout.firstRowCard} ... />
      ))}
    </div>

    {/* Second row: 2 cards, centered and larger */}
    <div className={layout.splitLayout.secondRowGrid}>
      {items.slice(layout.splitLayout.firstRowCount).map(item => (
        <Card className={layout.splitLayout.secondRowCard} ... />
      ))}
    </div>
  </div>
)}
```

### Combined Helper Component (Optional)
```tsx
// src/components/layout/DynamicCardGrid.tsx
export function DynamicCardGrid<T>({
  items,
  renderCard
}: {
  items: T[];
  renderCard: (item: T, cardClass: string) => React.ReactNode;
}) {
  const layout = getDynamicCardLayout(items.length);

  if (isSplitLayout(items.length) && layout.splitLayout) {
    const { firstRowCount, firstRowGrid, firstRowCard, secondRowGrid, secondRowCard } = layout.splitLayout;
    return (
      <div className={layout.containerClass}>
        <div className={firstRowGrid}>
          {items.slice(0, firstRowCount).map(item => renderCard(item, firstRowCard))}
        </div>
        <div className={secondRowGrid}>
          {items.slice(firstRowCount).map(item => renderCard(item, secondRowCard))}
        </div>
      </div>
    );
  }

  return (
    <div className={layout.containerClass}>
      <div className={layout.gridClass}>
        {items.map(item => renderCard(item, layout.cardClass))}
      </div>
    </div>
  );
}
```

---

## Card Class Merging

Cards may have existing classes. Merge carefully:

```tsx
// If card has existing bg/border classes, only override padding
<Card className={`bg-white border rounded-2xl ${layout.cardClass}`} />

// Or use cn() utility
<Card className={cn(existingClasses, layout.cardClass)} />
```

---

## Edge Cases

1. **0 items**: Return empty/null from component (don't render grid)
2. **Min/max enforcement**: Components enforce min:2 max:4 — utility handles all counts anyway
3. **Responsive**: All breakpoints covered (mobile=1col, tablet=2col, desktop=varies)

---

## Verification

After implementation, test each component with:
- 1 card (if allowed)
- 2 cards
- 3 cards
- 4 cards
- 5 cards (verify 3+2 split, bottom row centered)
- 6+ cards (if allowed)

Check on desktop, tablet, mobile viewports.

### 5-Card Verification Checklist
- [ ] Top 3 cards in standard 3-col grid
- [ ] Bottom 2 cards visually centered
- [ ] Bottom 2 cards have larger padding than top 3
- [ ] Gap between rows is consistent (mt-6 lg:mt-8)
- [ ] Mobile: all 5 stack vertically
- [ ] Tablet: top row 2+1, bottom row 2 centered

---

## Summary

| Metric | Count |
|--------|-------|
| Total files to update | **26** |
| Static grids (Category A) | 11 |
| Inconsistent logic (Category B) | 15 |
| Excluded (verified OK) | 6 |
| New utility file to create | 1 (`src/utils/dynamicCardLayout.ts`) |
| Optional helper component | 1 (`src/components/layout/DynamicCardGrid.tsx`) |

### Benefits of Consolidation
1. **Consistency** — All card grids behave identically
2. **5-card fix** — Split layout eliminates orphan problem
3. **Dynamic padding** — Cards scale appropriately to count
4. **Single source of truth** — One utility to maintain
5. **Easier testing** — Test utility once, covers all components

---

## Alternative Pattern (Reference)

`VisualObjectionTiles.tsx` uses flex-centering instead of grid:

```tsx
const getContainerClasses = (count: number) => {
  if (count === 4) return 'grid grid-cols-1 md:grid-cols-2 gap-8';
  return 'flex flex-wrap justify-center gap-8';
};

const getCardClasses = (count: number) => {
  if (count === 4) return ''; // grid handles sizing
  return 'w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.4rem)]';
};
```

This centers partial rows automatically. Consider adopting if simpler than split layout.
