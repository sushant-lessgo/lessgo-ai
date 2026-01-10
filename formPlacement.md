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


===================

# Fix Form-Connected Buttons in Hero & PrimaryCTA UIBlocks

## Problem
When users attach forms to CTA buttons (via ButtonConfigurationModal), UIBlocks render regular CTAButton instead of FormConnectedButton. This breaks inline form functionality - forms appear at section bottom instead of replacing the button inline.

## Root Cause
UIBlocks check for `buttonConfig.type === 'link-with-input'` but not `buttonConfig.type === 'form'`. Form-connected buttons fall through to default CTAButton rendering.

## Solution Overview
Add form type check to all Hero and PrimaryCTA UIBlocks. When `buttonConfig.type === 'form'`, render FormConnectedButton which handles:
- Single-field forms → InlineFormInput (replaces button)
- Multi-field forms → Button with scroll/modal behavior

Also disable secondary_cta_text generation by default (user adds manually via "add optional element").

---

## Implementation Steps

### Step 1: Disable Secondary CTA Generation
**File:** `src/modules/sections/selectOptionalElements.ts`
**Line:** ~1668

Change secondary_cta_text rule:
```typescript
{
  element: "secondary_cta_text",
  conditions: [
    { variable: "landingPageGoals", values: ["free-trial", "demo", "book-call"], weight: 4 },
    { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }
  ],
  minScore: 999  // Changed from 5 - effectively disables generation
}
```

**Rationale:** Prevent AI from generating secondary CTAs automatically. Users add manually if needed.

---

### Step 2: Fix Hero UIBlocks (4 files)

**Pattern to apply:**
```tsx
import { FormConnectedButton } from '@/components/forms/FormConnectedButton';

// In button rendering section:
{(() => {
  const buttonConfig = content[sectionId]?.elements?.cta_text?.metadata?.buttonConfig;
  const baseClassName = "..."; // Extract existing className

  if (buttonConfig?.type === 'link-with-input') {
    return <CTAButtonWithInput ... />;  // Keep existing if present
  } else if (buttonConfig?.type === 'form') {
    return (
      <FormConnectedButton
        buttonConfig={buttonConfig}
        sectionId={sectionId}
        elementKey="cta_text"
        size="large"
        variant="primary"
        colorTokens={colorTokens}
        className={baseClassName}
      >
        {blockContent.cta_text}
      </FormConnectedButton>
    );
  } else {
    return <CTAButton ... />;  // Keep existing
  }
})()}
```

**Files to modify:**
1. `src/modules/UIBlocks/Hero/centerStacked.tsx`
   - Lines 407-466: Primary CTA
   - Lines 469-526: Secondary CTA
   - Note: Already has link-with-input checks

2. `src/modules/UIBlocks/Hero/imageFirst.tsx`
   - Lines 488-496: Primary CTA
   - Lines 499-509: Secondary CTA
   - Note: Missing link-with-input checks (skip for now)

3. `src/modules/UIBlocks/Hero/leftCopyRightImage.tsx`
   - Lines 505-513: Primary CTA
   - Lines 516-526: Secondary CTA
   - Note: Missing link-with-input checks (skip for now)

4. `src/modules/UIBlocks/Hero/splitScreen.tsx`
   - Lines 494-530: Primary CTA (within link-with-input block)
   - Lines 580-652: Primary/Secondary CTAs (standard block)
   - Note: Complex conditional structure, already has link-with-input

**Skip:** `minimalist.tsx` (no buttons)

---

### Step 3: Fix PrimaryCTA UIBlocks (7 files)

**Same pattern as Hero, with adjustments:**
- Element keys may differ (`cta_text`, `left_cta_text`, `right_cta_text`)
- Secondary CTA variant: use `variant="secondary"` (standardized)
- For secondary CTA: pass `buttonConfig={{ ...secondaryButtonConfig, ctaType: 'secondary' }}`

**Files to modify:**

1. `src/modules/UIBlocks/PrimaryCTA/CenteredHeadlineCTA.tsx`
   - Lines 256-276: Primary CTA
   - Lines 279-303: Secondary CTA
   - Has link-with-input checks

2. `src/modules/UIBlocks/PrimaryCTA/CountdownLimitedCTA.tsx`
   - Find Primary CTA section
   - No link-with-input checks (skip those)

3. `src/modules/UIBlocks/PrimaryCTA/CTAWithBadgeRow.tsx`
   - Primary + Secondary CTAs
   - No link-with-input checks (skip those)

4. `src/modules/UIBlocks/PrimaryCTA/SideBySideCTA.tsx` **SPECIAL CASE**
   - Lines 149-169: LEFT CTA (`left_cta_text`, variant="primary")
   - Lines 221-241: RIGHT CTA (`right_cta_text`, variant="secondary")
   - Has link-with-input checks
   - Both buttons need independent form checks

5. `src/modules/UIBlocks/PrimaryCTA/TestimonialCTACombo.tsx`
   - Primary + Secondary CTAs
   - No link-with-input checks (skip those)

6. `src/modules/UIBlocks/PrimaryCTA/ValueStackCTA.tsx`
   - Primary + Secondary CTAs
   - No link-with-input checks (skip those)

7. `src/modules/UIBlocks/PrimaryCTA/VisualCTAWithMockup.tsx`
   - Primary + Secondary CTA (`secondary_cta` element key)
   - No link-with-input checks (skip those)

**Skip:** `CTAWithFormField.tsx` (already uses FormRenderer)

---

## Key Implementation Details

### Import Addition
Add to each modified file:
```tsx
import { FormConnectedButton } from '@/components/forms/FormConnectedButton';
```

### Size Mapping
Extract from existing button className:
- `px-12 py-6` → size="large"
- `px-8 py-4` → size="medium"
- Default: "large" for all Hero/CTA sections

### Variant Mapping
- Primary CTA → `variant="primary"`
- Secondary CTA → `variant="secondary"` (standardized across all files)

### Secondary CTA Pattern
```tsx
{((blockContent.secondary_cta_text && blockContent.secondary_cta_text !== '___REMOVED___') || mode === 'edit') && (() => {
  const secondaryButtonConfig = content[sectionId]?.elements?.secondary_cta_text?.metadata?.buttonConfig;

  if (secondaryButtonConfig?.type === 'link-with-input') {
    return <CTAButtonWithInput ... variant="secondary" />;
  } else if (secondaryButtonConfig?.type === 'form') {
    return (
      <FormConnectedButton
        buttonConfig={{ ...secondaryButtonConfig, ctaType: 'secondary' }}  // Add ctaType
        sectionId={sectionId}
        elementKey="secondary_cta_text"
        size="large"
        variant="secondary"
        colorTokens={colorTokens}
        className={baseClassName}
      >
        {blockContent.secondary_cta_text || 'Watch Demo'}
      </FormConnectedButton>
    );
  } else {
    return <CTAButton ... variant="secondary" />;
  }
})()}
```

### Button Icons (Known Limitation)
- FormConnectedButton doesn't support `leadingIcon`/`trailingIcon`
- When form is attached to button with icons, icons won't display
- Document as acceptable limitation
- Don't pass icon props to FormConnectedButton

### ClassName Extraction
For readability, extract className before IIFE:
```tsx
const primaryClassName = "px-12 py-6 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5";

{(() => {
  // ... checks
  return <FormConnectedButton className={primaryClassName} ... />;
})()}
```

---

## Critical Files

1. **src/modules/sections/selectOptionalElements.ts** - Disable secondary_cta_text
2. **src/components/forms/FormConnectedButton.tsx** - Reference for understanding behavior
3. **src/modules/UIBlocks/Hero/centerStacked.tsx** - Most complete Hero pattern
4. **src/modules/UIBlocks/PrimaryCTA/CenteredHeadlineCTA.tsx** - Clean PrimaryCTA pattern
5. **src/modules/UIBlocks/PrimaryCTA/SideBySideCTA.tsx** - Dual-CTA special case

---

## Implementation Order

1. ✅ Disable secondary_cta_text in selectOptionalElements.ts
2. Fix Hero UIBlocks (establish pattern):
   - centerStacked.tsx
   - imageFirst.tsx
   - leftCopyRightImage.tsx
   - splitScreen.tsx
3. Fix PrimaryCTA UIBlocks (follow pattern):
   - CenteredHeadlineCTA.tsx (reference)
   - CountdownLimitedCTA.tsx
   - CTAWithBadgeRow.tsx
   - TestimonialCTACombo.tsx
   - ValueStackCTA.tsx
   - VisualCTAWithMockup.tsx
   - SideBySideCTA.tsx (LAST - most complex)

---

## Testing & Verification

### Test Scenarios (per modified UIBlock)

**1. Single-field form on primary CTA:**
- Create page with UIBlock
- Create form with 1 email field
- Attach form to primary CTA button (behavior: scroll/modal doesn't matter)
- **Expected:** InlineFormInput replaces button (email input + submit side-by-side)
- Test submission, verify success state

**2. Multi-field form on primary CTA:**
- Create form with 2+ fields
- Attach to primary CTA with behavior = "scrollTo"
- **Expected:** Button renders normally, clicking scrolls to PrimaryCTA section
- Verify full form renders in PrimaryCTA section

**3. Multi-field form with modal:**
- Set behavior = "openModal"
- **Expected:** Button renders, clicking opens modal with form

**4. Secondary CTA form (always modal):**
- Attach form to secondary CTA
- **Expected:** Button renders with secondary variant, clicking opens modal
- Single or multi-field should both use modal (per placement logic)

**5. Regression: Regular buttons:**
- Button with no form attached
- **Expected:** Regular CTAButton behavior (no changes)

**6. Regression: Link-with-input buttons (if present):**
- Button with link-with-input type
- **Expected:** CTAButtonWithInput renders (no changes)

### Manual Test Steps

1. Create new landing page
2. Choose hero UIBlock (e.g., centerStacked)
3. Click primary CTA button → open ButtonConfigurationModal
4. Select "Native Form"
5. Create new form with 1 email field
6. Save
7. **Verify:** Email input + submit button replaces CTA button inline
8. Enter email, submit
9. **Verify:** Success message appears inline
10. Repeat for multi-field form (scroll and modal behaviors)

### Expected Behavior Summary

| Form Type | CTA Type | Behavior Setting | Expected Rendering |
|-----------|----------|------------------|-------------------|
| Single-field | Primary | Any | InlineFormInput (replaces button) |
| Single-field | Secondary | Any | Button → Modal |
| Multi-field | Primary | scrollTo | Button → Scroll to CTA section |
| Multi-field | Primary | openModal | Button → Modal |
| Multi-field | Secondary | Any | Button → Modal |

---

## Edge Cases

1. **Missing buttonConfig:** Falls through to default CTAButton (safe)
2. **Invalid form (no fields):** FormConnectedButton renders disabled button with "Configure CTA"
3. **Button icons:** Icons don't display on form-connected buttons (known limitation)
4. **Props availability:** userId/publishedPageId may not be available (FormConnectedButton handles gracefully)
5. **className complexity:** Extract to variable for readability

---

## Success Criteria

- [ ] Secondary_cta_text minScore set to 999 in selectOptionalElements.ts
- [ ] All 4 Hero UIBlocks support form-connected buttons
- [ ] All 7 PrimaryCTA UIBlocks support form-connected buttons
- [ ] Single-field forms render inline (InlineFormInput)
- [ ] Multi-field forms render as button with scroll/modal
- [ ] Secondary CTAs use variant="secondary" consistently
- [ ] Existing link-with-input and regular buttons still work (regression)
- [ ] Manual testing confirms inline forms submit successfully
