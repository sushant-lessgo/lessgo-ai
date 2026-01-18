# Create/[token] Flow Documentation

## Overview

The `/create/[token]` route is the onboarding and landing page generation flow for Lessgo. It guides users through:
1. Entering their startup idea
2. Confirming AI-inferred fields about their business
3. Editing features
4. Generating a complete landing page

## Architecture

### Core Components

- **`page.tsx`**: Entry point that loads existing drafts from the database
- **`ClientLayout.tsx`**: Main layout wrapper with OnboardingUIContext provider
- **`RightPanel.tsx`**: Primary UI panel handling the step-by-step flow
- **`LeftPanel.tsx`**: Shows confirmed fields and progress
- **`InputStep.tsx`**: Initial input form for startup idea
- **`FieldConfirmationCard.tsx`**: UI for confirming/editing each field
- **`FeatureEditor.tsx`**: Feature editing interface
- **`GenerationAnimation.tsx`**: Visual feedback during page generation

### State Management

#### useOnboardingStore
Primary store managing the onboarding flow:

```typescript
{
  // User's initial input
  oneLiner: string;
  
  // AI predictions with confidence scores (canonical field names as keys)
  confirmedFields: {
    marketCategory: { value: "SaaS", confidence: 0.92, alternatives: [...] },
    targetAudience: { value: "Developers", confidence: 0.85 },
    // ...
  };
  
  // User-validated values (canonical field names as keys)
  validatedFields: {
    marketCategory: "SaaS",
    targetAudience: "Developers",
    // ...
  };
  
  // Hidden AI-inferred fields (not shown to user)
  hiddenInferredFields: {
    persona: "Technical Decision Maker",
    painPoints: [...],
    // ...
  };
  
  // Current step in the flow
  stepIndex: number;
  
  // AI-generated features
  featuresFromAI: FeatureItem[];
  
  // Fields that require manual selection (bypass auto-confirmation)
  forceManualFields: CanonicalFieldName[];
}
```

## Generation Flow

### Phase 1: Initial Input
1. User enters startup idea in `InputStep`
2. Call `/api/infer-fields` to get AI predictions
3. Store predictions in `confirmedFields`
4. Begin field confirmation flow

### Phase 2: Field Confirmation
For each field in order:
1. Check confidence level:
   - **≥ 0.85**: Auto-confirm and advance
   - **< 0.85**: Show `FieldConfirmationCard` for manual confirmation
2. User can edit any field (marks as `forceManual`)
3. Confirmed values move from `confirmedFields` → `validatedFields`
4. Auto-save draft after each confirmation

### Phase 3: Market Insights
After all fields confirmed:
1. Call `/api/market-insights` with validated fields
2. Receive:
   - Features (shown to user for editing)
   - Hidden inferred fields (used in generation)
3. User can edit features in `FeatureEditor`

### Phase 4: Page Generation
1. User clicks "Generate Landing Page"
2. `usePageGeneration` hook orchestrates:
   - Section determination based on business rules
   - Layout selection for each section
   - Background/theme generation
   - Content generation via `/api/generate-landing`
3. Store complete page state in `useEditStoreLegacy`
4. Navigate to `/edit/[token]`

## Field System

### Canonical vs Display Names
- **Canonical**: Internal field names used in code (`marketCategory`, `targetAudience`)
- **Display**: User-facing names ("Market Category", "Target Audience")
- Mapping defined in `src/types/core/index.ts`

### Field Order
```typescript
const CANONICAL_FIELD_ORDER = [
  'marketCategory',
  'marketSubcategory', 
  'targetAudience',
  'keyProblem',
  'startupStage',
  'landingPageGoals',
  'pricingModel'
];
```

### Field Dependencies
- Changing `marketCategory` invalidates `marketSubcategory`
- Dependencies handled in `useOnboardingStore.confirmField()`

## API Endpoints

### `/api/infer-fields`
- **Input**: User's startup description
- **Output**: AI predictions for all fields with confidence scores
- **Includes**: Field validation against predefined options

### `/api/validate-fields`
- **Input**: Field name and value
- **Output**: Validated value with confidence
- **Purpose**: Validate individual field values

### `/api/market-insights`
- **Input**: All validated fields
- **Output**: Features and hidden inferred fields
- **Purpose**: Generate contextual business insights

### `/api/generate-landing`
- **Input**: Complete business context and sections
- **Output**: Full landing page content
- **Purpose**: Generate all copy and content

### `/api/saveDraft` & `/api/loadDraft`
- **Purpose**: Persist and restore onboarding state
- **Saves**: All store state including partial progress

## Key Features

### Auto-Confirmation
Fields with confidence ≥ 0.85 are automatically confirmed:
```typescript
if (confidence >= 0.85 && !validatedFields[field] && !isForceManual) {
  confirmField(field, value);
  setStepIndex(stepIndex + 1);
}
```

### Force Manual Mode
When user clicks "edit" on a field:
1. Field added to `forceManualFields`
2. Bypasses auto-confirmation
3. Shows edit UI even for high-confidence fields

### Progressive Enhancement
- Draft auto-saves after each step
- Can resume from any point
- Graceful fallbacks for API failures

### Confidence-Based UI
Different UIs based on confidence:
- **High (≥ 0.85)**: Auto-confirm
- **Medium (0.7-0.85)**: Show with confirm/edit options
- **Low (< 0.7)**: Show alternatives or full option list

## Component Communication

```
InputStep
  ↓ (onSuccess)
RightPanel 
  ↓ (setConfirmedFields)
useOnboardingStore
  ↓ (confirmedFields, validatedFields)
LeftPanel (displays progress)
  ↓ (reopenFieldForEditing)
FieldConfirmationCard (edit mode)
```

## Error Handling

- API failures show user-friendly messages
- Partial generation results are saved
- Draft persistence prevents data loss
- Validation errors guide user to correct input

## Debugging

### Key Console Logs
- Field confirmation: `"Confirming field: [name] = [value]"`
- Auto-confirmation: `"Auto-confirming [field] with confidence [score]"`
- Store updates: `"✅ Store populated from draft"`

### Common Issues

1. **Field not updating**: Check if field is in `forceManualFields`
2. **Auto-confirm not working**: Verify confidence ≥ 0.85 and not force manual
3. **Generation fails**: Check all required fields are validated
4. **Navigation fails**: Ensure tokenId is present

## Testing Checklist

- [ ] Initial input accepts various startup descriptions
- [ ] Fields auto-confirm when confidence ≥ 0.85
- [ ] Manual edit mode works for all fields
- [ ] Back navigation updates correctly
- [ ] Draft saves and loads properly
- [ ] Features can be edited
- [ ] Generation completes successfully
- [ ] Navigation to edit page works