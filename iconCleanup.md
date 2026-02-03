# Icon System Cleanup Project

## Goal
Standardize on **PascalCase Lucide names** as system default.
Keep emoji rendering for user choice only (not encouraged).

---

## Final Format Decision

| Format | Example | Status |
|--------|---------|--------|
| `"Clock"` | PascalCase Lucide | **STANDARD** - system default |
| `"🎯"` | Emoji | **SUPPORTED** - user choice only, not in defaults |
| `"lucide:clock"` | Prefixed Lucide | **REMOVE** - unnecessary prefix |
| `"svg:target"` | Legacy SVG | **REMOVE** - deprecated |

---

## Actual File Paths (Corrected)

| File | Path | Action |
|------|------|--------|
| iconStorage.ts | `src/lib/iconStorage.ts` | ARCHIVE |
| iconMapping.ts | `src/utils/iconMapping.ts` | ARCHIVE |
| iconSearchIndex.ts | `src/lib/iconSearchIndex.ts` | **KEEP** - IconPicker depends on it |
| iconCategoryMap.ts | `src/lib/iconCategoryMap.ts` | KEEP + enhance |
| getIcon.ts | `src/lib/getIcon.ts` | KEEP + simplify |
| lucideIconCategories.ts | `src/lib/lucideIconCategories.ts` | KEEP - IconPicker categories |
| lucideIconRegistry.ts | `src/lib/lucideIconRegistry.ts` | KEEP - IconPicker registry |
| iconUsageTracker.ts | `src/lib/iconUsageTracker.ts` | KEEP - recent/popular icons |

---

## Files to Archive

Move to `archive/icons-legacy/`:

| File | Source | Reason |
|------|--------|--------|
| iconStorage.ts | `src/lib/iconStorage.ts` | Prefix encoding no longer needed |
| iconMapping.ts | `src/utils/iconMapping.ts` | Merged into iconCategoryMap.ts |

---

## Files to Modify

### 1. `src/components/ui/IconEditableText.tsx`

**Remove:**
- `import { decodeIcon, lucideNameToPascalCase } from '@/lib/iconStorage'`
- All `decodeIcon()` calls
- SVG fallback map (lines 96-109)

**New renderIconValue():**
```tsx
import * as LucideIcons from 'lucide-react';

const renderIconValue = (iconValue: string) => {
  if (!iconValue) return null;

  const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 };
  const size = sizeMap[iconSize];

  // PascalCase Lucide (system default)
  if (/^[A-Z][a-zA-Z0-9]*$/.test(iconValue)) {
    const IconComponent = (LucideIcons as any)[iconValue];
    if (IconComponent) {
      return <IconComponent size={size} strokeWidth={2} className="inline-block" />;
    }
  }

  // Emoji (user choice - supported but not encouraged)
  if (/\p{Emoji}/u.test(iconValue)) {
    return <span className="text-current" style={{ fontSize: `${size}px` }}>{iconValue}</span>;
  }

  // Fallback for invalid names
  return <LucideIcons.Sparkles size={size} strokeWidth={2} className="inline-block text-gray-400" />;
};
```

### 2. `src/components/published/IconPublished.tsx`

**Same pattern as above.** Remove decodeIcon, support PascalCase + emoji.

### 3. `src/components/ui/IconPicker.tsx`

**Remove:**
- `import { encodeIcon } from '@/lib/iconStorage'`
- `encodeIcon()` call at line 128

**Modify handleIconSelect():**
```tsx
const handleIconSelect = (icon: IconSearchEntry) => {
  // Return raw name - no encoding
  // Lucide: "Clock" (PascalCase)
  // Emoji: "🎯" (character)
  const iconValue = icon.type === 'lucide'
    ? lucideNameToPascalCase(icon.name)  // kebab → PascalCase
    : icon.name;  // emoji as-is

  trackUsage(icon.name, icon.type);
  onChange(iconValue);
  onClose();
};
```

**Keep:**
- Lucide icon grid with search (primary)
- Emoji tab (secondary - available, not prominent)
- `iconSearchIndex` dependency
- `lucideIconCategories` dependency

### 4. `src/lib/iconCategoryMap.ts`

**Enhance with unified `inferIconFromText()`:**

Merge logic from:
- `getPainIconFromText()` from StackedPainBullets.tsx (lines 45-82)
- `getContextualIcon()` from StatBlocks.tsx (lines 52-66)
- Categories from `src/utils/iconMapping.ts`

```tsx
// Returns PascalCase Lucide names only
export function inferIconFromText(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Time-related
  if (text.includes('time') || text.includes('hour') || text.includes('slow') || text.includes('wait')) {
    return 'Clock';
  }
  // Disconnection/integration
  if (text.includes('disconnect') || text.includes('integration') || text.includes('sync')) {
    return 'Unlink';
  }
  // Deadlines/urgency
  if (text.includes('deadline') || text.includes('miss') || text.includes('late') || text.includes('urgent')) {
    return 'AlertTriangle';
  }
  // Burnout/fatigue
  if (text.includes('burn') || text.includes('exhaust') || text.includes('tired') || text.includes('overwhelm')) {
    return 'Battery';
  }
  // Loss/decline
  if (text.includes('losing') || text.includes('lost') || text.includes('decline') || text.includes('drop')) {
    return 'TrendingDown';
  }
  // Chaos/disorganization
  if (text.includes('chaos') || text.includes('mess') || text.includes('scattered')) {
    return 'Shuffle';
  }
  // Manual work
  if (text.includes('manual') || text.includes('repetitive') || text.includes('tedious')) {
    return 'Hand';
  }
  // Customer/users
  if (text.includes('customer') || text.includes('user') || text.includes('client')) {
    return 'Users';
  }
  // Satisfaction/rating
  if (text.includes('satisfaction') || text.includes('rating') || text.includes('happy')) {
    return 'Heart';
  }
  // Revenue/growth
  if (text.includes('revenue') || text.includes('growth') || text.includes('increase')) {
    return 'TrendingUp';
  }
  // Speed/efficiency
  if (text.includes('speed') || text.includes('fast') || text.includes('efficiency')) {
    return 'Zap';
  }
  // Money/cost
  if (text.includes('money') || text.includes('cost') || text.includes('price') || text.includes('budget')) {
    return 'DollarSign';
  }
  // Security
  if (text.includes('security') || text.includes('secure') || text.includes('protect')) {
    return 'Shield';
  }
  // Analytics/data
  if (text.includes('analytics') || text.includes('data') || text.includes('metrics') || text.includes('insight')) {
    return 'BarChart3';
  }
  // Settings/config
  if (text.includes('setting') || text.includes('config') || text.includes('customize')) {
    return 'Settings';
  }
  // Communication
  if (text.includes('email') || text.includes('message') || text.includes('chat')) {
    return 'Mail';
  }
  // Calendar/schedule
  if (text.includes('calendar') || text.includes('schedule') || text.includes('appointment')) {
    return 'Calendar';
  }
  // Search/find
  if (text.includes('search') || text.includes('find') || text.includes('discover')) {
    return 'Search';
  }
  // Award/achievement
  if (text.includes('award') || text.includes('achievement') || text.includes('winner')) {
    return 'Trophy';
  }
  // Goal/target
  if (text.includes('goal') || text.includes('target') || text.includes('objective')) {
    return 'Target';
  }
  // Rocket/launch
  if (text.includes('launch') || text.includes('start') || text.includes('begin')) {
    return 'Rocket';
  }

  // Default fallback
  return 'Sparkles';
}
```

### 5. `src/lib/getIcon.ts`

**Simplify to use `inferIconFromText()`:**
```tsx
import { inferIconFromText } from './iconCategoryMap';

export function getIcon(category?: string, context?: { title?: string; description?: string }): string {
  // Priority 1: Derive from context
  if (context?.title || context?.description) {
    return inferIconFromText(context.title || '', context.description);
  }

  // Priority 2: Category mapping (if needed)
  // ... existing category logic

  // Fallback
  return 'Sparkles';
}
```

---

## Complete UIBlocks List (with icon fields)

All UIBlocks that need the unified pattern:

### Problem
- [x] `Problem/StackedPainBullets.tsx` - has `getPainIconFromText`, remove + use `inferIconFromText`
- [x] `Problem/StackedPainBullets.published.tsx`

### Features
- [ ] `Features/IconGrid.tsx` - has `getIcon`, update import
- [ ] `Features/IconGrid.published.tsx`
- [ ] `Features/SplitAlternating.tsx` - icon field
- [ ] `Features/SplitAlternating.published.tsx`
- [ ] `Features/Carousel.tsx` - benefit_icon_1, benefit_icon_2
- [ ] `Features/Carousel.published.tsx`
- [ ] `Features/MetricTiles.tsx` - metrics collection has icon
- [ ] `Features/MetricTiles.published.tsx`

### Results
- [ ] `Results/StatBlocks.tsx` - has `getContextualIcon`, remove + use `inferIconFromText`
- [ ] `Results/StatBlocks.published.tsx`
- [ ] `Results/StackedWinsList.tsx` - win_icon field
- [ ] `Results/StackedWinsList.published.tsx`

### BeforeAfter
- [ ] `BeforeAfter/SideBySideBlock.tsx` - before_icon, after_icon (defaults: ❌, ✅)
- [ ] `BeforeAfter/SideBySideBlock.published.tsx`
- [ ] `BeforeAfter/SplitCard.tsx` - before_icon, after_icon, upgrade_icon
- [ ] `BeforeAfter/SplitCard.published.tsx`
- [ ] `BeforeAfter/StackedTextVisual.tsx` - before_icon, after_icon, transition_icon
- [ ] `BeforeAfter/StackedTextVisual.published.tsx`

### HowItWorks
- [ ] `HowItWorks/AccordionSteps.tsx` - steps.icon
- [ ] `HowItWorks/AccordionSteps.published.tsx`
- [ ] `HowItWorks/ThreeStepHorizontal.tsx` - steps.icon
- [ ] `HowItWorks/ThreeStepHorizontal.published.tsx`
- [ ] `HowItWorks/VerticalTimeline.tsx` - steps.icon
- [ ] `HowItWorks/VerticalTimeline.published.tsx`

### ObjectionHandle
- [ ] `ObjectionHandle/VisualObjectionTiles.tsx` - objections.icon
- [ ] `ObjectionHandle/VisualObjectionTiles.published.tsx`

### UniqueMechanism
- [ ] `UniqueMechanism/MethodologyBreakdown.tsx` - methodology_icon, principles.icon
- [ ] `UniqueMechanism/MethodologyBreakdown.published.tsx`
- [ ] `UniqueMechanism/ProcessFlowDiagram.tsx` - benefits.icon
- [ ] `UniqueMechanism/ProcessFlowDiagram.published.tsx`
- [ ] `UniqueMechanism/SecretSauceReveal.tsx` - secrets.icon
- [ ] `UniqueMechanism/SecretSauceReveal.published.tsx`
- [ ] `UniqueMechanism/StackedHighlights.tsx` - highlights.icon
- [ ] `UniqueMechanism/StackedHighlights.published.tsx`
- [ ] `UniqueMechanism/TechnicalAdvantage.tsx` - advantages.icon
- [ ] `UniqueMechanism/TechnicalAdvantage.published.tsx`

### UseCases
- [ ] `UseCases/IndustryUseCaseGrid.tsx` - industries.icon
- [ ] `UseCases/IndustryUseCaseGrid.published.tsx`
- [ ] `UseCases/PersonaGrid.tsx` - personas (no icon in schema, verify)
- [ ] `UseCases/RoleBasedScenarios.tsx` - scenarios (no icon in schema, verify)

### Pricing
- [ ] `Pricing/CallToQuotePlan.tsx` - contact_cards.icon
- [ ] `Pricing/CallToQuotePlan.published.tsx`

### Testimonials
- [ ] `Testimonials/BeforeAfterQuote.tsx` - before_icon, after_icon, transformations icons
- [ ] `Testimonials/BeforeAfterQuote.published.tsx`

### Footer
- [ ] `Footer/ContactFooter.tsx` - social_links.icon
- [ ] `Footer/ContactFooter.published.tsx`

**Total: ~46 files to update**

---

## UIBlock Update Pattern

For every UIBlock:

```tsx
// REMOVE local icon derivation functions (getPainIconFromText, getContextualIcon, etc.)

// ADD import
import { inferIconFromText } from '@/lib/iconCategoryMap';

// In render - unified pattern:
const iconName = item.icon || inferIconFromText(item.title, item.description);
const Icon = (LucideIcons as any)[iconName] ?? LucideIcons.Sparkles;
return <Icon className="w-6 h-6" />;
```

---

## Mock Data Updates

Update `src/app/dev/uiblock/_lib/mockDataGenerator.ts`:

Replace all emoji defaults with Lucide PascalCase names:

| Current | Replace With |
|---------|--------------|
| `before_icon: '😤'` | `before_icon: 'Frown'` |
| `after_icon: '😌'` | `after_icon: 'Smile'` |
| `before_icon: '📧'` | `before_icon: 'Mail'` |
| `after_icon: '🚀'` | `after_icon: 'Rocket'` |
| `icon: '🔍'` | `icon: 'Search'` |
| etc. | etc. |

---

## Schema Default Updates

Update `src/modules/sections/layoutElementSchema.ts`:

Replace emoji defaults with Lucide names:

| Line | Current | Replace With |
|------|---------|--------------|
| 310 | `default: "❌"` | `default: "XCircle"` |
| 311 | `default: "✅"` | `default: "CheckCircle"` |
| 593 | `default: "✅"` | `default: "Check"` |
| 594 | `default: "⏱️"` | `default: "Clock"` |

---

## Archive Structure

```
archive/icons-legacy/           ← NEW FOLDER
├── iconStorage.ts              ← from src/lib/
└── iconMapping.ts              ← from src/utils/

src/lib/                        ← CLEANED
├── iconCategoryMap.ts          ← ENHANCED (unified inferIconFromText)
├── iconSearchIndex.ts          ← KEEP (IconPicker search)
├── lucideIconCategories.ts     ← KEEP (IconPicker categories)
├── lucideIconRegistry.ts       ← KEEP (IconPicker registry)
├── iconUsageTracker.ts         ← KEEP (recent/popular)
└── getIcon.ts                  ← SIMPLIFIED
```

---

## Execution Order

1. Create `archive/icons-legacy/` folder
2. Enhance `iconCategoryMap.ts` with `inferIconFromText()`
3. Update `IconEditableText.tsx` with clean implementation
4. Update `IconPublished.tsx` with same pattern
5. Update `IconPicker.tsx` - remove encodeIcon, return raw names
6. Update schema defaults (4 lines)
7. Update mock data (emojis → Lucide names)
8. Update all UIBlocks (~46 files) to use unified pattern
9. Archive `iconStorage.ts` and `iconMapping.ts`
10. Delete imports to archived files (surfaces any missed usages)
11. Test all icon scenarios

---

## Verification Checklist

1. **Edit mode:** Select any UIBlock with icons, verify Lucide renders (not text)
2. **Published mode:** Same verification
3. **IconPicker:** Opens, shows Lucide grid, selecting icon updates correctly
4. **Emoji selection:** User picks emoji in IconPicker, renders correctly
5. **Smart derivation:** Remove icon from content, verify auto-derived icon renders
6. **Invalid name:** Set `icon: "InvalidName"`, verify fallback (Sparkles) renders
7. **Before/After blocks:** Verify XCircle/CheckCircle defaults work

---

## Success Criteria

- [ ] System defaults use PascalCase Lucide names only
- [ ] User-selected emojis still render correctly
- [ ] No `lucide:` prefix in storage or code
- [ ] No `svg:` prefix anywhere
- [ ] IconPicker returns raw PascalCase (Lucide) or raw emoji
- [ ] All UIBlocks render icons correctly in edit + published
- [ ] Smart derivation works when icon field empty
- [ ] `iconStorage.ts` and `iconMapping.ts` archived
- [ ] Single `inferIconFromText()` function (no duplicates)

---

## Migration Note

From newUIBlockElements.md:
> "No page is live in production so no migration is required. No backward compatibility required."

No runtime normalization or DB migration scripts needed. Clean slate implementation.
