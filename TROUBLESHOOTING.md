# Troubleshooting Guide - Real Issues & Solutions

## ⚠️ Critical Traps to Avoid

Based on actual bugs fixed in this codebase, here are the real issues and their solutions.

## 🔴 Text Editing Issues (Most Common)

### 1. Infinite Loop from Re-render Cycles (b45684f)
**What Happened**: Text editing created infinite re-render loops requiring 5774+ lines of code to fix
**The Trap**: 
- Store updates trigger component re-renders
- Re-renders trigger store updates
- Cycle continues infinitely

**Real Solution Implemented**:
```javascript
// Added multiple guard systems:
// - bulletproofFormatExecution.ts
// - reEntrancyGuard.ts  
// - editorActivityState.ts
// - strictModeSafeListeners.ts

// Key fix: Check if actively typing before store updates
if (!isActivelyTyping) {
  updateElementContent(sectionId, elementKey, content);
}
```

**Files Created to Fix This**:
- `src/utils/bulletproofFormatExecution.ts` (542 lines)
- `src/utils/emergencyCleanup.ts` (354 lines)
- `src/utils/toolbarWatchdog.ts` (147 lines)

### 2. Cursor Jumping While Typing (ead96a9)
**What Happened**: Cursor would jump to beginning/end when typing
**The Trap**: 
- React re-renders reset cursor position
- Store echo detection was missing

**Real Fix**:
```javascript
// InlineTextEditor.tsx
const handleContentChange = useCallback(() => {
  // Save cursor position
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  
  // Update content
  // ...
  
  // Restore cursor with requestAnimationFrame
  requestAnimationFrame(() => {
    if (range) {
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
}, []);
```

### 3. Text Loss When Clicking Elsewhere (aa390db)
**What Happened**: All text disappears when clicking outside
**The Trap**: 
- Blur handler was overwriting content
- React feedback loop between blur and store update

**Real Fix**:
```javascript
// Added content echo detection
const isEcho = lastContent.current === newContent && 
               Date.now() - lastUserInput.current > 100;

if (!isEcho) {
  // Only update if not an echo
  updateContent(newContent);
}
```

### 4. Text Toolbar Not Visible (Issues 2 & 3)
**What Happened**: Toolbar appears off-screen or partially hidden
**The Trap**: 
- No viewport constraints
- Fixed positioning without boundary checks

**Real Fix**:
```javascript
// TextToolbarMVP.tsx
const constraints = {
  minWidth: 300,
  maxWidth: 400,
  maxHeight: 80
};

// Check viewport boundaries
if (position.x + width > window.innerWidth) {
  position.x = window.innerWidth - width - 10;
}
```

## 🟡 Field Editing Issues

### 5. Auto-confirmed Fields Can't Be Edited (fe67ca0)
**What Happened**: Fields with high confidence couldn't be manually edited
**The Trap**: 
- Auto-confirmation logic blocked manual edits
- No force manual flag existed

**Failed Attempts** (3 tries to fix):
1. First try (3c43530) - Added edit button but state didn't persist
2. Second try (b3ffa5c) - State persisted but UI didn't update
3. Final fix (fe67ca0) - Added `forceManualFields` array

**Real Fix**:
```javascript
// useOnboardingStore.ts
forceManualFields: CanonicalFieldName[];

// Check before auto-confirm
if (confidence >= 0.85 && !isFieldForceManual(field)) {
  // Auto-confirm only if not forced manual
}
```

### 6. Modal Clicks Not Working (6389064)
**What Happened**: Clicking inside modals did nothing
**The Trap**: 
- Event propagation was stopped at wrong level
- Z-index conflicts with overlays

**Real Fix**:
```javascript
// Stop propagation only on backdrop, not modal content
<div className="modal-backdrop" onClick={(e) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
}}>
  <div className="modal-content">
    {/* Clicks work here */}
  </div>
</div>
```

## 🟠 Color & Background Issues

### 7. Background Custom Color Not Working (3c3ded9)
**What Happened**: Custom colors wouldn't apply to backgrounds
**Failed Attempts** (2 tries):
1. First try (a6cce2d) - Applied but didn't persist
2. Second try (3c3ded9) - Fixed persistence

**The Trap**: 
- CSS variable generation was inconsistent
- Theme state and CSS variables out of sync

**Real Fix**:
```javascript
// Generate CSS variables consistently
const cssVars = {
  '--bg-primary': customColor || theme.colors.primary,
  // Always fallback to theme
};
```

### 8. Headline Color Mismatch (8b73f35, 26e88f8)
**What Happened**: Headlines showed wrong colors
**The Trap**: 
- Multiple color systems competing
- Inline styles overriding CSS variables

**Real Fix**:
```javascript
// Single source of truth for colors
const colorTokens = getColorTokens();
// Never use inline styles for theme colors
```

## 🔵 Generation & Navigation Issues

### 9. Flash at Generate (6ffa189)
**What Happened**: Screen flashes white during generation
**The Trap**: 
- Component unmounting before navigation
- No loading state preservation

**Real Fix**:
```javascript
// Keep component mounted during transition
const [isNavigating, setIsNavigating] = useState(false);

if (isNavigating) {
  return <GenerationAnimation />;
}
```

### 10. Multi-project Edit Store Errors (94b9f16)
**What Happened**: Multiple projects caused store conflicts
**The Trap**: 
- Global store singleton
- No token-based isolation

**Real Fix**:
```javascript
// StoreManager with token-scoped instances
const storeManager = {
  stores: new Map<string, EditStore>(),
  getEditStore(tokenId: string) {
    if (!this.stores.has(tokenId)) {
      this.stores.set(tokenId, createEditStore());
    }
    return this.stores.get(tokenId);
  }
};
```

## 🟣 Typography Issues (8ae9e06, 933096d)

**What Happened**: Font changes didn't apply correctly
**The Trap**: 
- Font loading race conditions
- CSS specificity conflicts

**Real Fix**:
```javascript
// Preload fonts and wait
await document.fonts.load('16px "Font Name"');
// Then apply
```

## Debug Commands That Actually Help

### For Text Editing Issues
```javascript
// Check if in formatting loop
console.log('Formatting in progress:', 
  window.__EDIT_STORE__?.getState().formattingInProgress);

// Reset text editing state
window.__EDIT_STORE__?.getState().setFormattingInProgress(false);
window.__EDIT_STORE__?.getState().clearSelection();

// Check for re-render loops
let renderCount = 0;
const unsubscribe = window.__EDIT_STORE__.subscribe(() => {
  console.log('Render #', ++renderCount);
  if (renderCount > 10) {
    console.error('POSSIBLE INFINITE LOOP');
    unsubscribe();
  }
});
```

### For Field Issues
```javascript
// See why field won't update
const state = useOnboardingStore.getState();
console.log('Field is force manual:', 
  state.isFieldForceManual('marketCategory'));
console.log('Field confidence:', 
  state.confirmedFields.marketCategory?.confidence);
```

### For Color Issues
```javascript
// Check color token generation
console.log('Color tokens:', window.__EDIT_STORE__?.getState().getColorTokens());

// Check CSS variables
console.log('CSS vars:', 
  getComputedStyle(document.documentElement).getPropertyValue('--accent'));
```

## Patterns That Cause Problems

### ❌ Don't Do This:
```javascript
// Creates infinite loops
useEffect(() => {
  store.updateContent(content);
}, [content]); // content changes trigger effect again

// Event handler conflicts
onClick={handleClick}
onMouseDown={handleMouseDown} // Both fire, causing double updates

// Direct DOM manipulation in React
element.innerHTML = newContent; // Breaks React's virtual DOM
```

### ✅ Do This Instead:
```javascript
// Use guards
useEffect(() => {
  if (!isUpdating) {
    store.updateContent(content);
  }
}, [content, isUpdating]);

// Single event handler
onClick={(e) => {
  e.stopPropagation();
  handleClick(e);
}}

// Let React handle DOM
setContent(newContent);
```

## Files That Have Caused Most Issues

1. **InlineTextEditor.tsx** - 15+ bug fixes
2. **TextToolbarMVP.tsx** - 10+ iterations
3. **useOnboardingStore.ts** - Field confirmation logic
4. **FloatingToolbars.tsx** - Positioning bugs
5. **EditableText.tsx** - Content sync issues

## Emergency Nuclear Options

When nothing else works:

```javascript
// Complete reset
localStorage.clear();
sessionStorage.clear();
modalEmergencyReset.resetAllModals();
useOnboardingStore.getState().reset();
window.location.href = '/dashboard'; // Full page reload

// Kill all listeners (memory leak fix)
window.__EDIT_STORE__?.destroy?.();
delete window.__EDIT_STORE__;

// Stop all animations
document.querySelectorAll('*').forEach(el => {
  el.style.animation = 'none';
  el.style.transition = 'none';
});
```

## Lessons Learned

1. **React re-renders are the enemy** - Always guard against render loops
2. **Store echoes cause bugs** - Differentiate user input from store updates
3. **Multiple truth sources = bugs** - Single source of truth always
4. **Event propagation is tricky** - Be explicit about stopPropagation
5. **CSS specificity wars** - Use CSS variables, not inline styles
6. **Async race conditions** - Always check if component is still mounted
7. **Global singletons break multi-instance** - Use token-scoped instances

## If You're Adding New Features

**Before coding**, check if your feature involves:
- Text editing → Study the 5000+ lines of guards already added
- Store updates → Check for re-render cycles
- Modals → Test click propagation
- Colors → Use the existing color token system
- Navigation → Preserve state during transitions

These patterns have already caused bugs. Learn from history!