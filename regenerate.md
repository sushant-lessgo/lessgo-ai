# Regeneration Functionality Documentation

## Overview

The Lessgo application implements a three-level AI content regeneration system that allows users to regenerate content at different granularities:

1. **Page Level** (Left Panel) - Regenerate entire page content with optional design changes
2. **Section Level** (Section Toolbar) - Regenerate content for individual sections
3. **Element Level** (Element Toolbar) - Regenerate content for individual text elements with variations

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Regeneration System                      │
├─────────────────────────────────────────────────────────────┤
│  Page Level        Section Level        Element Level       │
│  ├─ Left Panel     ├─ Section Toolbar   ├─ Element Toolbar │
│  ├─ Field Changes  ├─ Single Section    ├─ Single Element  │
│  └─ Full/Partial   └─ Context Aware     └─ With Variations │
├─────────────────────────────────────────────────────────────┤
│                 Shared Backend (API)                       │
│  ├─ /api/regenerate-content                               │
│  ├─ /api/regenerate-element (referenced but not found)     │
│  └─ regenerationActions.ts (Store Logic)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Page Level Regeneration (Left Panel)

### Location
**File**: `src/app/edit/[token]/components/layout/LeftPanel.tsx`

### Functionality
The left panel provides full-page regeneration capabilities triggered by field changes. It offers two regeneration modes:

#### Two Regeneration Modes

1. **Content-Only Regeneration** (Default)
   - Preserves existing design structure, layouts, and themes
   - Only updates text content based on field changes
   - Faster execution and safer for customized designs

2. **Design + Content Regeneration** 
   - Completely regenerates design including sections, layouts, and colors
   - Updates all content to match new business inputs
   - Shows confirmation warning before proceeding
   - **Warning**: "All your current customizations will be lost"

### Key Implementation Details

#### Change Detection System
```typescript
// Field change tracking logic
const handleRegenerateContent = async () => {
  if (!hasFieldChanges || isRegenerating) return;
  
  if (includeDesignRegeneration) {
    await regenerateAllContent?.();  // Full regeneration
  } else {
    await regenerateContentOnly?.(); // Content-only
  }
}
```

#### Field Change Detection
- Monitors `validatedFields` and `hiddenInferredFields` from dual store system
- Compares current field values against `originalFields` baseline
- Updates `hasFieldChanges` state to enable/disable regeneration button
- Resets baseline after successful regeneration

#### User Experience Features
- **Change Indicator**: Shows "✓ Content is up to date" or regeneration button
- **Design Warning Modal**: Confirms design regeneration consequences
- **Progress States**: Loading spinner with descriptive text
- **Checkbox Option**: "Also regenerate design" with warning system

### API Integration

#### Content-Only Flow
```typescript
const regenerateContentOnly = async () => {
  const response = await fetch('/api/regenerate-content', {
    method: 'POST',
    body: JSON.stringify({
      tokenId,
      fields: { ...validatedFields, ...hiddenInferredFields },
      preserveDesign: true
    })
  });
}
```

#### Store Actions Used
- `regenerateAllContent()` - Full page regeneration
- `updateOnboardingData()` - Syncs field data between stores
- Auto-save integration after regeneration

---

## 2. Section Level Regeneration (Section Toolbar)

### Location
**File**: `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`

### Functionality
Section-level regeneration allows users to regenerate content for individual sections while preserving other sections.

### Implementation

#### Toolbar Integration
```typescript
const advancedActions = [
  {
    id: 'regenerate-section',
    label: 'Regenerate Content',
    icon: 'refresh',
    handler: () => executeAction('regenerate-section', { sectionId }),
  },
];
```

#### Action Flow
1. **Trigger**: User clicks "Regenerate Content" in section's advanced actions menu
2. **Action**: Calls `executeAction('regenerate-section', { sectionId })`
3. **Processing**: Handled by `useToolbarActions` hook
4. **Backend**: Calls regeneration API with section-specific context

### Key Features
- **Section-Specific**: Only affects the targeted section
- **Context Aware**: Uses current page context for coherent regeneration
- **Advanced Menu**: Located in section toolbar's "⋯" menu
- **Icon**: Uses refresh icon for visual consistency

---

## 3. Element Level Regeneration (Element Toolbar)

### Location
**File**: `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`

### Functionality
The most granular level of regeneration, allowing users to regenerate individual text elements with a variations system.

### Key Features

#### Variations System
```typescript
const handleRegenerate = async () => {
  try {
    await regenerateElementWithVariations(
      elementSelection.sectionId, 
      elementSelection.elementKey, 
      5  // Generate 5 variations
    );
    announceLiveRegion('Generated variations');
  } catch (error) {
    console.error('Failed to generate variations:', error);
  }
};
```

#### User Experience Flow
1. **Trigger**: User clicks "Regenerate" button on element toolbar
2. **Processing**: Generates 5 content variations for the element
3. **Selection UI**: Shows variation picker modal with radio button selection
4. **Preview**: User can see all variations before applying
5. **Application**: Selected variation updates the element content

#### Variation Picker Modal
```typescript
// Variations display with selection interface
{elementVariations.variations.map((variation: any, index: number) => (
  <div
    key={index}
    className={`p-3 rounded-lg border cursor-pointer ${
      elementVariations.selectedIndex === index
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300'
    }`}
    onClick={() => setVariationSelection(index)}
  >
    {/* Variation content display */}
  </div>
))}
```

### Store Integration
- `regenerateElementWithVariations()` - Generates multiple options
- `setVariationSelection()` - Tracks selected variation
- `applyVariation()` - Applies selected variation to element
- `hideElementVariations()` - Closes variation picker

---

## Backend Implementation

### API Routes

#### 1. `/api/regenerate-content`
**File**: `src/app/api/regenerate-content/route.ts`

**Purpose**: Handles both content-only and design+copy regeneration

**Key Features**:
- **Mode Detection**: `preserveDesign` flag determines regeneration type
- **Fallback System**: OpenAI → Nebius → Mock data
- **Error Handling**: Comprehensive error recovery with mock fallbacks
- **Demo Support**: Special handling for demo tokens

**Request Structure**:
```typescript
{
  prompt: string,
  preserveDesign: boolean,
  currentDesign?: {
    sections: string[],
    sectionLayouts: Record<string, string>,
    theme: any
  },
  updatedInputs: InputVariables & HiddenInferredFields,
  newDesign?: {
    sections: string[],
    sectionLayouts: Record<string, string>,
    backgroundSystem: any
  }
}
```

**Response Structure**:
```typescript
{
  content: Record<string, any>,
  preservedElements: string[],
  updatedElements: string[],
  regenerationType: 'content-only' | 'design-and-copy',
  warnings?: string[]
}
```

#### 2. `/api/regenerate-element` (Referenced but not implemented)
**Note**: This endpoint is referenced in the API README but the actual route file was not found in the current codebase. This suggests it might be:
- Under development
- Located in a different path
- Handled by a different endpoint

### Store Actions

#### File: `src/hooks/editStore/regenerationActions.ts`

This file contains the core regeneration logic with two main functions:

##### Content-Only Regeneration
```typescript
const handleContentOnlyRegeneration = async (getState, setState) => {
  // 1. Set loading state
  // 2. Extract updated inputs from change tracking
  // 3. Create design context for preservation
  // 4. Call API with preserveDesign: true
  // 5. Update store with new content
  // 6. Trigger auto-save
}
```

##### Design + Copy Regeneration
```typescript
const handleDesignAndCopyRegeneration = async (getState, setState) => {
  // 1. Set loading state
  // 2. Regenerate background system
  // 3. Update section layouts
  // 4. Update theme with new background
  // 5. Generate copy with updated design context
  // 6. Update store and auto-save
}
```

##### Key Store Methods Provided
- `regenerateContentOnly()` - Content-only regeneration
- `regenerateDesignAndCopy()` - Full regeneration
- `regenerateWithInputs(preserveDesign)` - Unified interface
- `trackInputChange()` - Field change tracking
- `getHasFieldChanges()` - Change detection
- `resetChangeTracking()` - Reset after regeneration

---

## State Management

### Change Tracking System

The regeneration system includes sophisticated change tracking:

```typescript
// Change tracking structure
interface ChangeTracking {
  originalInputs: InputVariables & HiddenInferredFields;
  currentInputs: InputVariables & HiddenInferredFields;
  changedFields: CanonicalFieldName[];
  hasChanges: boolean;
  lastChangeTimestamp: number;
}
```

### Dual Store Integration

The system integrates with both stores:
- **Onboarding Store**: `useOnboardingStore` - Field management
- **Edit Store**: `useEditStoreLegacy` - Content and UI state

### Auto-Save Integration

All regeneration operations trigger auto-save:
```typescript
// Auto-save after regeneration
const { completeSaveDraft } = await import('@/utils/autoSaveDraft');
await completeSaveDraft(state.tokenId, {
  description: 'Content-only regeneration',
});
```

---

## User Experience Flows

### 1. Page Level Flow
```
User edits field → Change detected → Regeneration button enabled → 
User selects mode → Confirmation (if design) → Processing → 
Content updated → Auto-save → Success state
```

### 2. Section Level Flow  
```
User hovers section → Section toolbar appears → 
Advanced menu (⋯) → "Regenerate Content" → 
API call → Section updated → Auto-save
```

### 3. Element Level Flow
```
User selects element → Element toolbar appears → 
"Regenerate" button → Variations generated → 
Variation picker modal → User selects → 
Apply variation → Element updated → Auto-save
```

---

## Technical Architecture

### Code Organization

```
src/
├── app/edit/[token]/components/
│   ├── layout/LeftPanel.tsx           # Page-level regeneration
│   └── toolbars/
│       ├── SectionToolbar.tsx         # Section-level regeneration  
│       └── ElementToolbar.tsx         # Element-level regeneration
├── app/api/regenerate-content/
│   └── route.ts                       # Main regeneration API
├── hooks/editStore/
│   └── regenerationActions.ts         # Core regeneration logic
├── hooks/
│   └── useToolbarActions.ts           # Action handlers
└── utils/regeneration/
    ├── contentOnlyRegeneration.ts     # Content-only utility
    └── fullPageRegeneration.ts        # Full page utility
```

### Data Flow

```
UI Trigger → Action Handler → Store Action → API Call → 
Response Processing → Store Update → UI Update → Auto-save
```

### Error Handling Strategy

1. **UI Level**: Loading states, error messages, fallback options
2. **API Level**: Provider fallbacks (OpenAI → Nebius → Mock)
3. **Store Level**: Error state management and user notifications
4. **Network Level**: Timeout handling and retry logic

---

## Known Issues & Areas for Improvement

### Current Issues

1. **Missing Element API**: `/api/regenerate-element` referenced but not found
2. **Store Method Dependencies**: Some methods commented out due to missing implementations
3. **Error Recovery**: Limited user feedback on partial failures
4. **Performance**: No request queuing or rate limiting visible

### Suggested Improvements

#### 1. Enhanced Error Handling
- More granular error messages for users
- Retry mechanisms with exponential backoff
- Partial success handling (some sections succeed, others fail)

#### 2. User Experience Enhancements
- **Progress Indicators**: More detailed progress for long operations
- **Undo System**: Allow users to revert regenerations
- **Preview Mode**: Show preview before applying changes
- **Batch Operations**: Allow multiple sections to be regenerated together

#### 3. Performance Optimizations
- **Request Queuing**: Prevent concurrent regeneration requests
- **Caching**: Cache similar regeneration requests
- **Streaming**: Real-time updates for long regenerations
- **Background Processing**: Non-blocking regeneration for large content

#### 4. Technical Debt
- **Complete Element API**: Implement missing `/api/regenerate-element`
- **Store Consolidation**: Unify regeneration methods across store actions
- **Type Safety**: Improve TypeScript types for regeneration responses
- **Testing**: Add comprehensive tests for all regeneration flows

#### 5. Feature Enhancements
- **Selective Regeneration**: Choose specific elements within sections
- **Style Preservation**: More granular design preservation options
- **Version History**: Track regeneration history with rollback capability
- **A/B Testing**: Generate multiple page variations for testing

---

## Integration Points

### External Dependencies
- **OpenAI API**: Primary content generation
- **Nebius API**: Secondary/fallback provider  
- **Clerk**: User authentication for API access
- **Prisma/PostgreSQL**: State persistence and auto-save
- **PostHog**: Analytics tracking for regeneration usage

### Internal Dependencies
- **Prompt System**: `buildFullPrompt()` for context generation
- **Response Parsing**: `parseAiResponse()` for content extraction
- **Mock System**: `generateMockResponse()` for fallback content
- **Auto-save**: `completeSaveDraft()` for state persistence
- **Background System**: Design regeneration utilities

---

## Conclusion

The regeneration system is a sophisticated three-level architecture that provides users with flexible content regeneration options. While the current implementation is functional, there are opportunities for enhancement in error handling, user experience, and performance optimization.

The modular design allows for incremental improvements, and the comprehensive fallback system ensures reliability even when external services are unavailable. The dual-mode approach (content-only vs. design+copy) gives users control over the extent of changes while maintaining safety through confirmation dialogs for destructive operations.