# Hooks & State Management Documentation

## Overview

This directory contains all custom React hooks and state management stores for Lessgo. The architecture uses a dual-store system that can cause synchronization issues if not properly understood.

## Store Architecture

### Primary Stores

#### 1. useOnboardingStore
**File**: `useOnboardingStore.ts`
**Purpose**: Manages the onboarding flow and field confirmation
**Scope**: `/create/[token]` route primarily, but also used in `/edit/[token]`

```typescript
// Key state
{
  oneLiner: string;
  confirmedFields: Record<CanonicalFieldName, ConfirmedFieldData>;
  validatedFields: Partial<InputVariables>;
  hiddenInferredFields: HiddenInferredFields;
  featuresFromAI: FeatureItem[];
  forceManualFields: CanonicalFieldName[];
}
```

#### 2. useEditStoreLegacy
**File**: `useEditStoreLegacy.ts`
**Purpose**: Main editor state management
**Scope**: `/edit/[token]` route

```typescript
// Key state
{
  sections: string[];
  content: Record<string, any>;
  sectionLayouts: Record<string, string>;
  selectedSection: string | null;
  selectedElement: ElementSelection | null;
  theme: ThemeState;
  autoSave: AutoSaveState;
}
```

### Supporting Stores

#### 3. useModalManager
**File**: `useModalManager.ts`
**Purpose**: Orchestrates modal states and field editing
**Dependencies**: Uses both useOnboardingStore and useEditStoreLegacy

#### 4. usePageGeneration
**File**: `usePageGeneration.ts`
**Purpose**: Manages the page generation flow
**Dependencies**: Bridges onboarding store to edit store

## Common State Issues & Solutions

### Issue 1: State Not Syncing Between Stores
**Symptom**: Changes in onboarding store don't reflect in edit store
**Debug**:
```javascript
// Check both stores
console.log('Onboarding:', useOnboardingStore.getState());
console.log('Edit:', window.__EDIT_STORE__?.getState());
```
**Fix**: Ensure proper data transfer in `usePageGeneration` hook

### Issue 2: Field Updates Not Persisting
**Symptom**: Edited fields revert to original values
**Debug**:
```javascript
// Check field states
const state = useOnboardingStore.getState();
console.log('Confirmed:', state.confirmedFields);
console.log('Validated:', state.validatedFields);
console.log('Force Manual:', state.forceManualFields);
```
**Fix**: Check if field is in `forceManualFields` array

### Issue 3: Store Memory Leaks
**Symptom**: Performance degradation over time
**Debug**:
```javascript
// Check store subscriptions
console.log('Active subscriptions:', store.listeners.size);
```
**Fix**: Ensure cleanup in useEffect hooks

### Issue 4: Auto-save Race Conditions
**Symptom**: Save status flickering or stuck
**Debug**:
```javascript
// Check auto-save state
const { autoSave } = useEditStore.getState();
console.log('Auto-save:', autoSave);
```
**Fix**: Check debounce timing in `useAutoSave` hook

## Hook Dependencies Map

```
usePageGeneration
  ├── useOnboardingStore
  └── storeManager (EditStore)

useModalManager
  ├── useOnboardingStore
  └── useEditStoreLegacy

useAutoSave
  └── useEditStoreLegacy

useEditor
  └── useEditStoreLegacy

useToolbarActions
  ├── useEditStoreLegacy
  └── useSelectionPriority
```

## Debugging Commands

### Store Inspection
```javascript
// Get onboarding store state
useOnboardingStore.getState()

// Get edit store state (if initialized)
window.__EDIT_STORE__?.getState()

// Reset onboarding store
useOnboardingStore.getState().reset()

// Check specific field
useOnboardingStore.getState().validatedFields.marketCategory
```

### Store Monitoring
```javascript
// Subscribe to store changes
const unsubscribe = useOnboardingStore.subscribe(
  state => console.log('Store updated:', state)
);

// Monitor specific field
const unsubscribe = useOnboardingStore.subscribe(
  state => state.validatedFields,
  validatedFields => console.log('Fields updated:', validatedFields)
);
```

### Emergency Resets
```javascript
// Reset all modal states
modalEmergencyReset.resetAllModals()

// Clear formatting state
useEditStore.getState().setFormattingInProgress(false)

// Clear selection
useEditStore.getState().clearSelection()
```

## Performance Hooks

### useOptimizedEditStore
- Uses selectors to minimize re-renders
- Implement when experiencing performance issues

### usePerformanceMonitor
- Tracks render counts and timing
- Enable in development for optimization

## Common Bug Patterns

### 1. Stale Closures
**Issue**: Callbacks using old state values
**Solution**: Use `getState()` directly or `useCallback` with proper dependencies

### 2. Subscription Leaks
**Issue**: Components not unsubscribing
**Solution**: Always return cleanup function in useEffect

### 3. Infinite Loops
**Issue**: State updates triggering themselves
**Solution**: Check effect dependencies and use proper guards

### 4. Race Conditions
**Issue**: Multiple async operations conflicting
**Solution**: Use proper async handling and state flags

## Testing Hooks

### Mock Store for Testing
```javascript
// Create mock store
const mockStore = {
  oneLiner: 'Test product',
  validatedFields: { marketCategory: 'SaaS' },
  setOneLiner: jest.fn(),
  reset: jest.fn()
};

// Use in tests
jest.mock('@/hooks/useOnboardingStore', () => ({
  useOnboardingStore: () => mockStore
}));
```

## Best Practices

1. **Always cleanup subscriptions** in useEffect
2. **Use selectors** to minimize re-renders
3. **Avoid direct mutations** - always create new objects
4. **Check for mounted state** before updates
5. **Use TypeScript** for type safety
6. **Document complex state flows** with comments

## Migration Path

Currently migrating from:
- `useEditStore` → `useEditStoreLegacy`
- Individual stores → Unified store manager

Check for deprecated patterns and update accordingly.