# Icon Debugging Setup Summary

## Changes Made:

### 1. Environment Variables Added
- Added to `.env.local`:
  - `DEBUG_ICON_SELECTION=true` - For backend icon debugging
  - `DISABLE_BACKEND_LOGS=false` - Control all backend logging
  - `DEBUG_ELEMENT_SELECTION=false` - Disabled element selection logs
  - `NEXT_PUBLIC_DEBUG_ICON_SELECTION=true` - For client-side icon debugging

### 2. Logger Enhanced
- Added `logger.icon()` method in `src/lib/logger.ts` (line 124-131)
- Icon logs will show with 🎯 [ICON] prefix
- Only logs when `DEBUG_ICON_SELECTION=true` and not in production

## Remaining Manual Steps:

Due to file linter/formatter conflicts, please manually add the following debug logging:

### IconGrid.tsx (`src/modules/UIBlocks/Features/IconGrid.tsx`)

Add after line 160 (after the `icons` array is created):

```typescript
  // Debug logging for IconGrid
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] IconGrid - Raw icons from blockContent:', {
      icon_1: blockContent.icon_1,
      icon_2: blockContent.icon_2,
      icon_3: blockContent.icon_3,
      icon_4: blockContent.icon_4,
      icon_5: blockContent.icon_5,
    });
    console.log('🎯 [ICON] IconGrid - Titles:', titleList);
  }
```

And replace the `return titleList.map((title, index) => ({` section (lines 162-169) with:

```typescript
  return titleList.map((title, index) => {
    const iconValue = icons[index];
    const finalIcon = getValidatedIcon(iconValue, title);

    if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
      console.log(`🎯 [ICON] IconGrid - Feature ${index + 1} (${title}):`, {
        rawIcon: iconValue,
        isValid: iconValue && isValidIcon(iconValue),
        finalIcon,
        usedFallback: !iconValue || !isValidIcon(iconValue)
      });
    }

    return {
      id: `feature-${index}`,
      index,
      title,
      description: descriptionList[index] || 'Feature description not provided.',
      iconType: '',
      icon: finalIcon
    };
  });
```

### OutcomeIcons.tsx (`src/modules/UIBlocks/Results/OutcomeIcons.tsx`)

Add after line 47 (after the `descriptionList` is created):

```typescript
  // Debug logging for OutcomeIcons
  if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
    console.log('🎯 [ICON] OutcomeIcons - Raw data:', {
      iconTypes: iconTypes,
      titles: titles,
      iconList,
      titleList
    });
  }
```

And add inside the map function (after line 49):

```typescript
  return iconList.map((iconType, index) => {
    if (process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true') {
      console.log(`🎯 [ICON] OutcomeIcons - Item ${index + 1}:`, {
        iconType,
        title: titleList[index]
      });
    }

    return {
      id: `outcome-${index}`,
      iconType,
      title: titleList[index] || 'Great Outcome',
      description: descriptionList[index] || 'Amazing results await'
    };
  });
```

### StackedHighlights.tsx (`src/modules/UIBlocks/UniqueMechanism/StackedHighlights.tsx`)

Find the highlight parsing section and add similar logging for highlight icons.

## What This Will Show:

When you generate a landing page, the console will show:
1. **AI Output**: What the AI generates for each icon field (icon_1, icon_2, etc.)
2. **Validation**: Whether each icon value is valid or needs fallback
3. **Final Selection**: What icon actually gets used for each feature
4. **Fallback Detection**: When and why contextual fallback icons are used

## To Use:

1. Set `NEXT_PUBLIC_DEBUG_ICON_SELECTION=true` in `.env.local` (already done)
2. Restart your dev server (`npm run dev`)
3. Generate a landing page
4. Check browser console for 🎯 [ICON] logs

This will help identify why you're seeing question marks (❓) instead of proper icons in IconGrid.
