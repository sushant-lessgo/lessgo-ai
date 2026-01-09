# Form Placement Refactor Implementation Plan

## Context

Current problem: When user selects "scroll to form" in hero, form renders below CTA button causing bad UX (user clicks button to scroll to form right below it).

Target: Intelligent form placement based on field count and CTA type:
- Single-field forms → inline replacement of CTA button (email input + submit)
- Multi-field forms → separate placement in Primary CTA section with scroll/modal behavior
- Secondary CTAs → always modal

## Architecture Changes

### 1. Form Placement Logic (Core Intelligence)

**New file:** `src/utils/formPlacement.ts`

```typescript
// Core placement rules
determineFormPlacement(form, ctaType, sectionType, hasPrimaryCTASection): PlacementResult {
  fieldCount = form.fields.length
  isSingleField = fieldCount === 1

  // Guardrail: no fields = invalid
  if (fieldCount === 0) return { placement: 'invalid' }

  // Secondary CTA: always modal
  if (ctaType === 'secondary') {
    return { placement: 'modal', renderAs: 'button' }
  }

  // Single-field: always inline in same section
  if (isSingleField) {
    return {
      placement: 'inline',
      renderAs: 'inputWithButton',
      section: sectionType  // hero or primaryCTA
    }
  }

  // Multi-field: place in Primary CTA section
  if (hasPrimaryCTASection) {
    return {
      placement: 'primaryCTA',
      renderAs: form.behavior === 'openModal' ? 'button-to-modal' : 'button-to-scroll',
      targetSection: 'cta'
    }
  }

  // Fallback: force modal
  return { placement: 'modal', renderAs: 'button' }
}
```

### 2. Button Type Detection

**Update:** `src/types/core/content.ts`

Add CTA type tracking to button config:
```typescript
interface ButtonConfig {
  type: 'link' | 'form' | 'link-with-input';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary';  // NEW
  url?: string;
  inputConfig?: {...};
}
```

### 3. Inline Form Component

**New component:** `src/components/forms/InlineFormInput.tsx`

Single-field inline form (email input + submit button side-by-side):
- Renders input field + submit button in flex layout
- Matches CTA button styling/sizing
- Replaces button in hero/CTA sections
- Handles validation, submission, success states
- Mobile responsive (stack on small screens)

### 4. FormPlacementRenderer Refactor

**File:** `src/components/forms/FormPlacementRenderer.tsx`

Current logic: renders forms for all `scrollTo` buttons at section bottom

New logic:
1. Scan section for form-connected buttons
2. For each button, call `determineFormPlacement()`
3. Based on result:
   - `inline` → render `InlineFormInput`
   - `primaryCTA` → render full form in primary CTA section
   - `modal` → skip (handled by button component)
4. Track which forms already rendered (avoid duplicates)

### 5. Button Configuration Modal Updates

**File:** `src/components/forms/ButtonConfigurationModal.tsx`

Changes:
1. Add `ctaType` selection (primary/secondary radio)
2. For single-field forms:
   - Hide/disable "Open in Modal" option
   - Show note: "Single-field forms display inline"
3. For multi-field + no primary CTA section:
   - Show warning: "Modal only (no CTA section)"
   - Disable scroll option

### 6. Section Type Detection Helper

**New utility:** `src/utils/sectionHelpers.ts`

```typescript
getSectionType(sectionId: string): 'hero' | 'cta' | 'other'
hasPrimaryCTASection(sections: string[]): boolean
findPrimaryCTASection(sections: string[]): string | null
```

## Implementation Steps

### Phase 1: Core Utilities & Types
1. Create `src/utils/formPlacement.ts` with placement logic
2. Create `src/utils/sectionHelpers.ts` with section detection
3. Update `ButtonConfig` type in `src/types/core/content.ts`
4. Add `ctaType` field to button metadata

### Phase 2: Inline Form Component
1. Create `InlineFormInput.tsx` component
2. Support all single-field types (email, text, tel)
3. Match CTA button styling (variant, size, colors)
4. Add validation + submission handling
5. Mobile responsive layout

### Phase 3: FormPlacementRenderer Refactor
1. Import `determineFormPlacement` utility
2. Refactor rendering logic to use placement rules
3. Handle inline vs full form rendering
4. Track rendered forms (avoid duplicates)
5. Support both hero + primary CTA inline rendering

### Phase 4: Button Component Updates
1. Update `FormConnectedButton.tsx`:
   - Check placement result before rendering
   - For inline forms, return `InlineFormInput`
   - For scroll behavior, scroll to primary CTA section
2. Update click handlers for new placement logic

### Phase 5: Button Configuration UI
1. Update `ButtonConfigurationModal.tsx`:
   - Add CTA type selector (primary/secondary)
   - Conditionally show/hide behavior options
   - Add warnings for edge cases
2. Set default CTA type based on section/variant



### Phase 6: Editor Experience
1. Update form field editor to show field count impact
2. Show placement preview when editing form
3. Add tooltips explaining placement rules
4. Disable invalid combinations (e.g., single-field modal)

## Critical Files to Modify

| File | Changes |
|------|---------|
| `src/utils/formPlacement.ts` | NEW - Core placement logic |
| `src/utils/sectionHelpers.ts` | NEW - Section detection |
| `src/components/forms/InlineFormInput.tsx` | NEW - Inline form component |
| `src/components/forms/FormPlacementRenderer.tsx` | REFACTOR - Use new placement rules |
| `src/components/forms/FormConnectedButton.tsx` | UPDATE - Render based on placement |
| `src/components/forms/ButtonConfigurationModal.tsx` | UPDATE - CTA type + conditional UI |
| `src/types/core/content.ts` | UPDATE - Add `ctaType` to ButtonConfig |
| `src/hooks/editStore/formActions.ts` | UPDATE - Track CTA type in store |

## Edge Cases & Handling

| Scenario | Handling |
|----------|----------|
| No fields in form | Render disabled button + "Configure CTA" error |
| Fields change 1→2 | Auto-move to primary CTA section, change button to scroll/modal |
| Fields change 2→1 | Auto-move to inline in hero/CTA sections |
| No primary CTA section + multi-field | Force modal, show editor notice |
| Non-hero/CTA section with form button | Scroll to primary CTA section (ignore behavior setting) |
| Multiple inline forms (hero + CTA) | Both render same inline form (dual placement) |
| Secondary CTA with single field | Override to modal (not inline) |

## Verification & Testing

### Manual Testing Steps:
1. **Single-field form in hero:**
   - Create form with 1 email field
   - Attach to primary CTA in hero
   - Verify inline input renders (not button)
   - Submit form, verify success state

2. **Single-field in hero + primary CTA section:**
   - Verify inline form appears in BOTH sections
   - Test submission from both locations

3. **Multi-field form with scroll:**
   - Create form with 2+ fields
   - Set behavior to "scroll to form"
   - Verify button in hero, full form in primary CTA section
   - Click button, verify scroll to primary CTA

4. **Multi-field form with modal:**
   - Set behavior to "open in modal"
   - Verify modal opens on click
   - Verify form not rendered inline

5. **Secondary CTA:**
   - Create secondary CTA with single-field form
   - Verify opens in modal (not inline)

6. **No primary CTA section:**
   - Remove primary CTA section
   - Add multi-field form to hero
   - Verify forced modal behavior

7. **Form in other sections:**
   - Add form button in features section
   - Verify scrolls to primary CTA section

8. **Field count changes:**
   - Start with single-field form (inline)
   - Add second field
   - Verify switches to primary CTA placement
   - Remove field, verify returns to inline


## Notes

- Inline form styling must match CTA button aesthetics (size, variant, colors)
- Mobile: inline forms stack vertically on small screens
- Success state: show inline (not navigate away)
- Form validation: same rules as modal/full forms
- Analytics: track placement type on submission events
