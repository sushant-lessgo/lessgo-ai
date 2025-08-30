# Delete Button Visibility Fix Documentation

## Problem Statement
Delete buttons for elements in UI blocks were functionally present (clickable, showing tooltips) but visually invisible due to hover state issues with Tailwind CSS.

## Root Cause Analysis

### Issue 1: Component DOM Structure
`EditableAdaptiveText` and similar React components don't place the `className` prop on their root DOM element, breaking sibling relationships needed for `peer-hover` selectors.

### Issue 2: Tailwind JIT Compilation
Tailwind's JIT compiler doesn't generate CSS for named group patterns (e.g., `group-hover/customer-item:opacity-100`) unless they're explicitly in the safelist. The default safelist only includes `group-hover:opacity-100`.

### Issue 3: Background Color Conflicts
Initial attempts used `bg-white/80` which made buttons invisible against white/light backgrounds.

## The Solution

### Pattern to Use: Standard Group Hover

```jsx
// ✅ CORRECT PATTERN
<div className="relative group flex items-center space-x-2">
  {/* Your content elements */}
  <EditableAdaptiveText ... />
  
  {/* Delete button */}
  {mode === 'edit' && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleContentUpdate('field_name', '___REMOVED___');
      }}
      className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200"
      title="Remove this item"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )}
</div>
```

### Key Requirements

1. **Container must have `group` class**: The parent container wrapping both content and delete button needs `className="relative group ..."`

2. **Use standard group-hover**: Button should use `opacity-0 group-hover:opacity-100` (NOT named groups like `group-hover/name:opacity-100`)

3. **No background on button**: Use only text color styling: `text-red-500 hover:text-red-700`

4. **Simple transition**: Use `transition-opacity duration-200` for smooth appearance

## Common Pitfalls to Avoid

### ❌ DON'T: Use Named Groups
```jsx
// This won't work - Tailwind JIT doesn't compile it
<div className="group/customer-item">
  <button className="group-hover/customer-item:opacity-100">
```

### ❌ DON'T: Use Peer Selectors
```jsx
// This is fragile - component may not put peer class on DOM
<span className="peer">
  <EditableAdaptiveText />
</span>
<button className="peer-hover:opacity-100">
```

### ❌ DON'T: Add Background Colors
```jsx
// Background makes button invisible on similar colored backgrounds
<button className="bg-white/80 hover:bg-white">
```

### ❌ DON'T: Nest Groups
```jsx
// Nested structure breaks hover detection
<div className="group">
  <div className="flex">
    <span>content</span>
  </div>
  <button className="group-hover:opacity-100"> // Won't work reliably
</div>
```

## Implementation Checklist

When adding delete buttons to UI blocks:

- [ ] Parent container has `className="relative group ..."`
- [ ] Delete button uses `opacity-0 group-hover:opacity-100`
- [ ] Button styling is minimal: `ml-2 text-red-500 hover:text-red-700 transition-opacity duration-200`
- [ ] Button is a direct child of the group container (not deeply nested)
- [ ] Button only appears in edit mode: `{mode === 'edit' && (...)}`
- [ ] Click handler uses `___REMOVED___` marker for deletion
- [ ] Event propagation is stopped: `e.stopPropagation()`

## Files That Need This Fix

Based on our investigation, these files use incorrect delete button patterns:

1. `src/modules/UIBlocks/HowItWorks/VerticalTimeline.tsx`
2. `src/modules/UIBlocks/Features/Tabbed.tsx`
3. `src/modules/UIBlocks/Features/SplitAlternating.tsx`
4. `src/modules/UIBlocks/PrimaryCTA/CTAWithBadgeRow.tsx`
5. `src/modules/UIBlocks/Hero/centerStacked.tsx`
6. `src/modules/UIBlocks/Features/Carousel.tsx`
7. `src/modules/UIBlocks/Features/Timeline.tsx`
8. `src/modules/UIBlocks/Features/MiniCards.tsx`
9. `src/components/layout/EditableTrustIndicators.tsx`

## Example Fix Applied

### Before (Broken):
```jsx
<div className="relative group/rating-item flex items-center">
  <EditableAdaptiveText className="peer" />
  <button className="opacity-0 peer-hover:opacity-100 bg-white/80">
```

### After (Working):
```jsx
<div className="relative group flex items-center">
  <EditableAdaptiveText />
  <button className="opacity-0 group-hover:opacity-100 text-red-500">
```

## Testing

To verify the fix works:
1. Enter edit mode
2. Hover over the entire row containing the element
3. Red X delete button should appear
4. Clicking the button should remove the element
5. Button should work across different background colors/themes

## Why This Works

1. **Standard patterns**: Uses Tailwind patterns that are guaranteed to be in the safelist
2. **Simple DOM structure**: Doesn't rely on component internals or complex sibling relationships
3. **Visible styling**: Red text color is visible on all backgrounds without needing background colors
4. **Reliable hover**: Entire row is hoverable, not just tiny text areas