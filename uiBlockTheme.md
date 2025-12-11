# UIBlock Theme Implementation Guide

Guide for converting any UIBlock component to respect the manual theme override system.

## Overview

**UIBlock Theme System** provides three visual themes:
- 🔥 **Warm**: Orange/red tones for energetic, inviting feel (food, lifestyle, consumer apps)
- ❄️ **Cool**: Blue tones for professional, calm feel (fintech, healthcare, B2B)
- ⚖️ **Neutral**: Gray tones for balanced, subtle feel (general purpose)

**Priority**: `manualThemeOverride` (user selection) > `autoDetectedTheme` (taxonomy-based) > `'neutral'` (fallback)

## Architecture

### Type Definitions (storeTypes.ts)

```typescript
// Theme type (line 182)
export type Theme = {
  // ... existing fields
  uiBlockTheme?: 'warm' | 'cool' | 'neutral'; // Manual override
};

// Layout component props (line 335)
export interface LayoutComponentProps {
  // ... existing fields
  manualThemeOverride?: 'warm' | 'cool' | 'neutral'; // Passed from EditablePageRenderer
}
```

### Data Flow

1. **User Selection** → `ColorSystemModalMVP` → `updateTheme({ uiBlockTheme: 'warm' })`
2. **Store** → `theme.uiBlockTheme` persists in Zustand store
3. **EditablePageRenderer** → Passes `manualThemeOverride={theme?.uiBlockTheme}` to all UIBlocks
4. **UIBlock Component** → Checks priority: manual > auto > neutral

## Conversion Steps

### Step 1: Import Theme Detection

```typescript
import { selectUIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
import type { UIBlockTheme } from '@/modules/Design/ColorSystem/selectUIBlockThemeFromTags';
```

### Step 2: Update Component Props Interface

```typescript
// Extend LayoutComponentProps to get manualThemeOverride
interface YourComponentProps extends LayoutComponentProps {}
```

### Step 3: Replace Theme Detection Logic

**BEFORE:**
```typescript
const theme = props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral';
```

**AFTER:**
```typescript
// Detect theme: manual override > auto-detection > neutral fallback
const theme = React.useMemo(() => {
  if (props.manualThemeOverride) return props.manualThemeOverride;
  if (props.userContext) return selectUIBlockTheme(props.userContext);
  return 'neutral';
}, [props.manualThemeOverride, props.userContext]);
```

### Step 4: Update Debug Logging (Optional)

**BEFORE:**
```typescript
React.useEffect(() => {
  console.log('🎨 ComponentName theme detection:', {
    sectionId,
    hasUserContext: !!props.userContext,
    userContext: props.userContext,
    detectedTheme: theme
  });
}, [theme, props.userContext, sectionId]);
```

**AFTER:**
```typescript
React.useEffect(() => {
  console.log('🎨 ComponentName theme detection:', {
    sectionId,
    hasManualOverride: !!props.manualThemeOverride,
    manualTheme: props.manualThemeOverride,
    hasUserContext: !!props.userContext,
    userContext: props.userContext,
    finalTheme: theme
  });
}, [theme, props.manualThemeOverride, props.userContext, sectionId]);
```

## Complete Examples

### Example 1: OutcomeIcons (Icon Backgrounds)

```typescript
export default function OutcomeIcons(props: OutcomeIconsProps) {
  const {
    sectionId,
    blockContent,
    handleContentUpdate,
    // ... other props from useLayoutComponent
  } = useLayoutComponent<OutcomeIconsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // ✅ Theme detection with priority
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Apply theme to icon backgrounds
  const getIconColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        border: 'border-orange-200'
      },
      cool: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      neutral: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200'
      }
    }[theme];
  };

  const colors = getIconColors(theme);

  return (
    <div className="grid gap-6">
      {outcomes.map((outcome, idx) => (
        <div key={idx} className={`p-4 rounded-lg ${colors.bg} ${colors.border}`}>
          <div className={colors.text}>{outcome.icon}</div>
          {/* ... rest of component */}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: StackedPainBullets (Shadow & Hover Effects)

```typescript
export default function StackedPainBullets(props: StackedPainBulletsProps) {
  const { sectionId, blockContent, handleContentUpdate } = useLayoutComponent<StackedPainBulletsContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // ✅ Theme detection
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Theme-based styling
  const getPainColors = (theme: UIBlockTheme) => {
    return {
      warm: {
        border: 'border-orange-200',
        borderHover: 'hover:border-orange-300',
        iconBg: 'bg-orange-100',
        iconText: 'text-orange-600'
      },
      cool: {
        border: 'border-blue-200',
        borderHover: 'hover:border-blue-300',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600'
      },
      neutral: {
        border: 'border-gray-200',
        borderHover: 'hover:border-gray-300',
        iconBg: 'bg-gray-100',
        iconText: 'text-gray-600'
      }
    }[theme];
  };

  const colors = getPainColors(theme);

  return (
    <div className="space-y-4">
      {painPoints.map((pain, idx) => (
        <div key={idx} className={`border ${colors.border} ${colors.borderHover} p-4 rounded-lg`}>
          <div className={`${colors.iconBg} ${colors.iconText} p-2 rounded`}>
            {pain.icon}
          </div>
          {/* ... rest of component */}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Using Design Tokens (Advanced)

```typescript
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

export default function IconGrid(props: IconGridProps) {
  // ... useLayoutComponent setup

  // ✅ Theme detection
  const theme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // Use design tokens for consistent shadows/hovers
  const shadow = shadows[theme].medium;
  const hover = cardEnhancements[theme].hover;

  return (
    <div className="grid grid-cols-3 gap-6">
      {features.map((feature, idx) => (
        <div key={idx} className={`${shadow} ${hover} p-6 rounded-lg bg-white`}>
          {/* ... feature content */}
        </div>
      ))}
    </div>
  );
}
```

## Design Tokens Reference

Use centralized tokens from `@/modules/Design/designTokens`:

```typescript
import { shadows, cardEnhancements } from '@/modules/Design/designTokens';

// Shadows
shadows.warm.small    // 'shadow-sm shadow-orange-100/50'
shadows.warm.medium   // 'shadow-md shadow-orange-200/30'
shadows.cool.small    // 'shadow-sm shadow-blue-100/50'
shadows.cool.medium   // 'shadow-md shadow-blue-200/30'
shadows.neutral.small // 'shadow-sm'
shadows.neutral.medium// 'shadow-md'

// Card Enhancements
cardEnhancements.warm.hover    // 'hover:shadow-lg hover:shadow-orange-200/40'
cardEnhancements.cool.hover    // 'hover:shadow-lg hover:shadow-blue-200/40'
cardEnhancements.neutral.hover // 'hover:shadow-lg'
```

## Common Color Patterns

### Icon Backgrounds
```typescript
const iconColors = {
  warm: 'bg-orange-100 text-orange-600',
  cool: 'bg-blue-100 text-blue-600',
  neutral: 'bg-gray-100 text-gray-600'
}[theme];
```

### Borders
```typescript
const borderColors = {
  warm: 'border-orange-200 hover:border-orange-300',
  cool: 'border-blue-200 hover:border-blue-300',
  neutral: 'border-gray-200 hover:border-gray-300'
}[theme];
```

### Accent Backgrounds
```typescript
const accentBg = {
  warm: 'bg-orange-50',
  cool: 'bg-blue-50',
  neutral: 'bg-gray-50'
}[theme];
```

## Testing Checklist

### Manual Testing
1. ✅ Open edit mode at `/edit/[token]`
2. ✅ Open Edit Header → Color section
3. ✅ Verify theme selector shows current theme
4. ✅ Select "Warm" → verify component shows orange styling
5. ✅ Select "Cool" → verify component shows blue styling
6. ✅ Select "Neutral" → verify component shows gray styling
7. ✅ Refresh page → verify theme persists
8. ✅ Click "Reset to Auto" → verify returns to auto-detected theme

### Debug Logging
Enable console to verify theme detection:
```typescript
React.useEffect(() => {
  console.log('🎨 ComponentName theme:', {
    sectionId,
    manualOverride: props.manualThemeOverride,
    autoDetected: props.userContext ? selectUIBlockTheme(props.userContext) : null,
    finalTheme: theme
  });
}, [theme, props.manualThemeOverride, props.userContext, sectionId]);
```

### Visual Verification
- **Warm**: Orange icons, borders, shadows
- **Cool**: Blue icons, borders, shadows
- **Neutral**: Gray icons, borders, shadows

## Migration Checklist

Converting an existing UIBlock:

- [ ] Import `selectUIBlockTheme` and `UIBlockTheme` type
- [ ] Extend `LayoutComponentProps` in component props interface
- [ ] Replace theme detection with priority logic using `React.useMemo`
- [ ] Add dependency array: `[props.manualThemeOverride, props.userContext]`
- [ ] Update debug logging to include `manualThemeOverride`
- [ ] Test all three themes (warm/cool/neutral)
- [ ] Verify manual override takes precedence
- [ ] Verify auto-detection still works
- [ ] Verify theme persists after refresh

## Troubleshooting

### Theme not changing?
1. Check `EditablePageRenderer` passes `manualThemeOverride` prop
2. Verify `useLayoutComponent` doesn't override theme logic
3. Check console for theme detection logs
4. Ensure component uses `props.manualThemeOverride` in useMemo dependencies

### Auto-detection not working?
1. Verify `props.userContext` contains taxonomy fields
2. Check `selectUIBlockTheme()` receives correct user context
3. Review taxonomy tags in console logs
4. Ensure `EditablePageRenderer` builds userContext from `meta.validatedFields`

### Theme not persisting?
1. Check `updateTheme()` is called correctly in `ColorSystemModalMVP`
2. Verify Zustand store is saving `theme.uiBlockTheme`
3. Check auto-save is triggered after theme change
4. Review draft persistence in store

## Related Files

### Core Implementation
- `src/types/storeTypes.ts` - Type definitions
- `src/app/edit/[token]/components/ui/ColorSystemModalMVP.tsx` - Theme selector UI
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx` - Prop propagation
- `src/modules/Design/ColorSystem/selectUIBlockThemeFromTags.ts` - Auto-detection logic
- `src/modules/Design/designTokens.ts` - Design tokens (shadows, hovers)

### Example Components
- `src/modules/UIBlocks/Results/OutcomeIcons.tsx`
- `src/modules/UIBlocks/Problem/StackedPainBullets.tsx`
- `src/modules/UIBlocks/Hero/centerStacked.tsx`
- `src/modules/UIBlocks/Features/IconGrid.tsx`

## Best Practices

1. **Use React.useMemo**: Theme detection should be memoized for performance
2. **Consistent Priority**: Always check `manualThemeOverride` first
3. **Design Tokens**: Prefer centralized tokens over inline color classes
4. **Debug Logging**: Keep debug logs to help troubleshoot theme issues
5. **Fallback**: Always provide `'neutral'` as final fallback
6. **Type Safety**: Use `UIBlockTheme` type for theme-based logic
7. **Dependencies**: Include both `manualThemeOverride` and `userContext` in useMemo deps

## FAQ

**Q: Can I add custom themes?**
A: Yes, extend the `'warm' | 'cool' | 'neutral'` union type in `storeTypes.ts` and add color mappings in components.

**Q: Should all UIBlocks support themes?**
A: Only UIBlocks with visual polish (icons, shadows, hovers) need theme support. Text-only sections can skip this.

**Q: What if a component uses both theme and accent color?**
A: Theme controls icons/shadows, accent color controls CTAs/links. They work independently.

**Q: How do I test without taxonomy data?**
A: Use manual override in ColorSystemModalMVP. Auto-detection requires validatedFields in store.

**Q: Can I override theme per section?**
A: No, theme is global (stored in `theme.uiBlockTheme`). All UIBlocks use the same theme.

## Summary

1. Import theme detection utilities
2. Add theme priority logic with `React.useMemo`
3. Define theme-based color mappings
4. Apply colors to icons, borders, shadows, hovers
5. Test manual override, auto-detection, and persistence

**Priority**: `manualThemeOverride` > `autoDetectedTheme` > `'neutral'`

**Result**: Users can override auto-detected themes in Edit Header → Color section.
