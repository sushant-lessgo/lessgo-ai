# Image Toolbar Implementation SOP Guide

## Table of Contents
1. [Problem Analysis Framework](#problem-analysis-framework)
2. [Implementation Requirements](#implementation-requirements)  
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Testing & Validation](#testing--validation)
6. [Best Practices](#best-practices)

---

## Problem Analysis Framework

### Initial Diagnostic Questions
When an image toolbar isn't working, systematically check these areas:

#### 1. **Click Event Detection**
- Is the click handler firing at all?
- Are there console logs from the component's click handler?
- Is the component in edit mode when clicked?

#### 2. **Image Rendering Path**
- Is an actual image being displayed or just a placeholder?
- What is the value of the image content field?
- Are there overlays or CSS preventing clicks?

#### 3. **Toolbar System Integration**
- Is the `handleImageToolbar` function being called?
- Are the FloatingToolbars receiving the correct state?
- Is the image ID format matching the parsing logic?

#### 4. **Store State Analysis**  
- What is the `activeToolbar` value?
- Does `hasActiveToolbar` return true?
- Is the `targetId` correct in the toolbar state?

### Debug Logging Strategy

Add these debug logs to trace the flow:

```typescript
// In component click handler
console.log('🖼️ Image clicked, mode:', mode, 'sectionId:', sectionId);
console.log('🖼️ Calling handleImageToolbar with:', { imageId, position });

// In FloatingToolbars
console.log('🎪 FloatingToolbars state:', { activeToolbar, hasActiveToolbar, toolbarTarget });
console.log('🖼️ ImageToolbar render check:', { shouldShow, hasTargetId, isImageActive });

// In ImageToolbar component  
console.log('🖼️🖼️🖼️ ImageToolbar initialized with props:', { targetId, position });
```

---

## Implementation Requirements

### Required Components
- `useImageToolbar` hook from `@/hooks/useImageToolbar`
- `FloatingToolbars` component in the edit layout
- `ImageToolbar` component for the actual toolbar UI
- Edit store with toolbar state management

### Required Props/State
- `mode` - Must be 'edit' for toolbar to appear
- `sectionId` - Unique identifier for the section
- Image content field (e.g., `hero_image`, `mockup_image`)

### File Structure Dependencies
```
src/
├── hooks/
│   ├── useImageToolbar.ts
│   └── editStore/uiActions.ts
├── app/edit/[token]/components/
│   ├── ui/FloatingToolbars.tsx
│   └── toolbars/ImageToolbar.tsx
└── modules/UIBlocks/[Category]/[Component].tsx
```

---

## Step-by-Step Implementation

### Step 1: Import Required Dependencies

```typescript
import { useImageToolbar } from '@/hooks/useImageToolbar';
```

### Step 2: Initialize the Hook

```typescript
export default function YourUIBlockComponent(props: LayoutComponentProps) {
  // ... other hooks
  
  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();
  
  // ... rest of component
}
```

### Step 3: Add Click Handler to Images

For **actual uploaded images**:

```typescript
<img
  src={blockContent.your_image_field}
  alt="Your Image"
  className="w-full h-auto cursor-pointer"
  data-image-id={`${sectionId}-your_image_field`} // CRITICAL: Use underscore to match field name
  onMouseUp={(e) => {
    if (mode === 'edit') {
      e.stopPropagation();
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const imageId = `${sectionId}-your_image_field`;
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      handleImageToolbar(imageId, position);
    }
  }}
  onClick={(e) => {
    if (mode === 'edit') {
      e.stopPropagation();
      e.preventDefault();
    }
  }}
/>
```

### Step 4: Add Click Handler to Placeholder Components

For **placeholder/mockup components**:

```typescript
// Make the placeholder component accept onClick prop
const YourPlaceholderComponent = React.memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
  <div className="relative cursor-pointer" onClick={onClick}>
    {/* Your placeholder content */}
  </div>
));

// In your main component's render
<YourPlaceholderComponent 
  onClick={(e) => {
    if (mode === 'edit') {
      e.stopPropagation();
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const imageId = `${sectionId}-your_image_field`;
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      handleImageToolbar(imageId, position);
    }
  }}
/>
```

### Step 5: Content Schema Configuration

Ensure your content schema includes the image field:

```typescript
const CONTENT_SCHEMA = {
  your_image_field: { 
    type: 'string' as const, 
    default: '' 
  },
  // ... other fields
};

// And in your content interface
interface YourComponentContent {
  your_image_field?: string;
  // ... other fields
}
```

### Step 6: Component Metadata

Update your component metadata to include the image field:

```typescript
export const componentMeta = {
  // ... other metadata
  contentFields: [
    { key: 'your_image_field', label: 'Your Image', type: 'image', required: false },
    // ... other fields
  ],
};
```

---

## Common Issues & Solutions

### Issue 1: Image Toolbar Not Appearing
**Symptoms**: No toolbar shows when clicking image
**Debug**: Check for these logs:
- Component click handler logs ❌ Missing
- FloatingToolbars state logs ✅ Present
- ImageToolbar initialization logs ❌ Missing

**Solution**: Click handler not firing. Usually caused by:
- Placeholder component not having click handler
- Image not actually rendered (showing placeholder instead)
- CSS overlays preventing clicks

**Fix**: Add click handler to both actual images AND placeholder components.

### Issue 2: Wrong Image ID Format
**Symptoms**: ImageToolbar initializes but can't update content
**Debug**: ImageToolbar logs show parsing warnings or wrong elementKey

**Root Cause**: Mismatch between image ID format and content field name
- Image ID: `sectionId-image-field` (with dashes)
- Content field: `image_field` (with underscores)

**Solution**: Use underscores in image ID to match content field:
```typescript
// ❌ Wrong - uses dashes
data-image-id={`${sectionId}-image-field`}

// ✅ Correct - uses underscores to match content field
data-image-id={`${sectionId}-image_field`}
```

### Issue 3: Event Propagation Issues
**Symptoms**: Parent toolbars appear instead of image toolbar
**Solution**: Always add both `stopPropagation()` and `preventDefault()`:
```typescript
onMouseUp={(e) => {
  if (mode === 'edit') {
    e.stopPropagation();  // Prevents parent handlers
    e.preventDefault();   // Prevents default browser behavior
    // ... rest of handler
  }
}}
```

### Issue 4: Placeholder Not Clickable
**Symptoms**: Uploaded images work, placeholder doesn't
**Solution**: Ensure placeholder component:
1. Accepts `onClick` prop
2. Has `cursor-pointer` class
3. Passes click event to handler

### Issue 5: Position Calculation Issues
**Symptoms**: Toolbar appears in wrong location
**Solution**: Use consistent positioning logic:
```typescript
const rect = e.currentTarget.getBoundingClientRect();
const position = {
  x: rect.left + rect.width / 2,  // Center horizontally
  y: rect.top - 10                // 10px above top
};
```

---

## Testing & Validation

### Manual Testing Checklist

#### ✅ Basic Functionality
- [ ] Click on uploaded image shows image toolbar
- [ ] Click on placeholder/mockup shows image toolbar  
- [ ] Toolbar appears in correct position
- [ ] Upload new image works
- [ ] Replace existing image works
- [ ] Remove image works

#### ✅ Edge Cases
- [ ] Works when no image is uploaded (placeholder state)
- [ ] Works when custom image exists
- [ ] Multiple components on same page don't conflict
- [ ] Toolbar hides when clicking elsewhere

#### ✅ Browser Console
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] All debug logs removed in production

### Debug Log Validation

When testing, you should see this log sequence:

1. **Component click**: `🖼️ [Component] clicked, mode: edit`
2. **Hook call**: `🖼️ Calling handleImageToolbar with: {imageId, position}`
3. **Store update**: `🎪 FloatingToolbars state changed: {activeToolbar: 'image'}`
4. **Toolbar render**: `🖼️ ImageToolbar initialized with props`

If any step is missing, that's where the issue lies.

---

## Best Practices

### 1. **Consistent Image ID Formatting**
Always use underscores in image IDs to match content field names:
```typescript
// Content field: hero_image
// Image ID: `${sectionId}-hero_image` ✅
```

### 2. **Handle Both Image States**
Always implement click handlers for both:
- Actual uploaded images
- Placeholder/mockup components

### 3. **Proper Event Handling**
```typescript
// Complete event handling pattern
onMouseUp={(e) => {
  if (mode === 'edit') {
    e.stopPropagation();
    e.preventDefault();
    // ... toolbar logic
  }
}}
onClick={(e) => {
  if (mode === 'edit') {
    e.stopPropagation();
    e.preventDefault();
  }
}}
```

### 4. **Debug-Friendly Development**
Add temporary debug logs during development, but remove them before production:
```typescript
// ✅ Development
console.log('🖼️ Debug info:', { mode, sectionId, imageId });

// ✅ Production - remove all debug logs
// (clean code)
```

### 5. **Reusable Placeholder Pattern**
Make placeholder components reusable:
```typescript
const PlaceholderComponent = React.memo(({ 
  onClick 
}: { 
  onClick?: (e: React.MouseEvent) => void 
}) => (
  <div className="relative cursor-pointer" onClick={onClick}>
    {/* Content */}
  </div>
));
```

### 6. **Content Schema Validation**
Always include image fields in:
- Content interface TypeScript types
- CONTENT_SCHEMA defaults  
- Component metadata for tools

### 7. **Position Calculation**
Use consistent positioning that works across different screen sizes:
```typescript
// Center horizontally, position above
const position = {
  x: rect.left + rect.width / 2,
  y: rect.top - 10
};
```

---

## Implementation Example: VisualCTAWithMockup Case Study

This guide was created based on successfully implementing image toolbar functionality for the VisualCTAWithMockup component. Here's what was discovered and fixed:

### Original Problem
- Image toolbar wasn't appearing when clicking the mockup
- No console logs from component click handlers
- FloatingToolbars showed `activeToolbar: null`

### Root Cause Analysis  
1. **No click handler on placeholder**: The `ProductMockup` component didn't have click functionality
2. **Image ID mismatch**: Using `mockup-image` instead of `mockup_image`
3. **Missing both states**: Only handled uploaded images, not the placeholder

### Solution Applied
1. Made `ProductMockup` component accept `onClick` prop
2. Added click handlers to both image and placeholder
3. Fixed image ID format: `${sectionId}-mockup_image`
4. Added proper event handling with `stopPropagation()`

### Results
- ✅ Image toolbar now works for both states
- ✅ Consistent behavior with other UIBlock components
- ✅ Clean, maintainable code
- ✅ Proper event handling prevents conflicts

This implementation now serves as the reference standard for all future image toolbar implementations in UIBlock components.