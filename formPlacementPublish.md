# Forms Integration Playbook for Published UIBlocks

## Overview

This playbook documents how to integrate form rendering into published UIBlocks (Hero and PrimaryCTA sections). The pattern is based on the implementation in `splitScreen.published.tsx`.

---

## Status Summary

### Hero UIBlocks (5 total)
- ✅ **splitScreen.published.tsx** - COMPLETE (reference implementation)
- ⏳ **Minimalist.published.tsx** - NEEDS IMPLEMENTATION
- ⏳ **centerStacked.published.tsx** - NEEDS IMPLEMENTATION
- ⏳ **imageFirst.published.tsx** - NEEDS IMPLEMENTATION
- ⏳ **leftCopyRightImage.published.tsx** - NEEDS IMPLEMENTATION

### PrimaryCTA UIBlocks (5 total)
- ✅ **CTAWithFormField.published.tsx** - COMPLETE (uses FormIsland - different pattern)
- ⏳ **CenteredHeadlineCTA.published.tsx** - NEEDS IMPLEMENTATION
- ⏳ **TestimonialCTACombo.published.tsx** - NEEDS IMPLEMENTATION
- ⏳ **ValueStackCTA.published.tsx** - NEEDS IMPLEMENTATION
- ⏳ **VisualCTAWithMockup.published.tsx** - NEEDS IMPLEMENTATION

**Total to implement:** 8 UIBlocks

---

## Reference Implementation

**File:** `src/modules/UIBlocks/Hero/splitScreen.published.tsx`

This is the gold standard implementation that all other UIBlocks should follow.

### Key Components

1. **Imports** (lines 25-27):
```typescript
import { FormMarkupPublished } from '@/components/published/FormMarkupPublished';
import { InlineFormMarkupPublished } from '@/components/published/InlineFormMarkupPublished';
import { determineFormPlacement } from '@/utils/formPlacement';
```

2. **Props Access** (line 222):
```typescript
// Extract button metadata for form detection
const sectionData = props.content?.[sectionId];
const ctaElement = sectionData?.elements?.cta_text;
const buttonConfig = ctaElement?.metadata?.buttonConfig;
```

3. **Form Detection & Rendering Logic** (lines 358-421):
```typescript
// Check if button is form-connected
if (!buttonConfig || buttonConfig.type !== 'form') {
  return <CTAButtonPublished ... />;
}

// Get form from content
const form = props.content?.forms?.[buttonConfig.formId];
if (!form) {
  console.warn(`Form not found: ${buttonConfig.formId}`);
  return <CTAButtonPublished ... />;
}

// Determine placement
const placement = determineFormPlacement(
  form,
  buttonConfig.ctaType || 'primary',
  'hero',  // or 'cta' for PrimaryCTA sections
  props.sections || []
);

// Render inline form (single-field)
if (placement.placement === 'inline') {
  return <InlineFormMarkupPublished ... />;
}

// Otherwise render as button (scroll to form or open modal)
return <CTAButtonPublished ... />;
```

---

## Implementation Pattern (Step-by-Step)

### Step 1: Add Imports

Add these three imports at the top of the file:

```typescript
import { FormMarkupPublished } from '@/components/published/FormMarkupPublished';
import { InlineFormMarkupPublished } from '@/components/published/InlineFormMarkupPublished';
import { determineFormPlacement } from '@/utils/formPlacement';
```

### Step 2: Extract Button Metadata

Find where the CTA button is rendered and extract the button configuration:

```typescript
// Extract button metadata for form detection
const sectionData = props.content?.[sectionId];
const ctaElement = sectionData?.elements?.cta_text;
const buttonConfig = ctaElement?.metadata?.buttonConfig;
```

**Note:** The element key might differ:
- Primary CTA: `cta_text`
- Secondary CTA: `secondary_cta_text`

### Step 3: Replace Button Rendering with Conditional Logic

Replace the direct `<CTAButtonPublished>` render with this pattern:

```typescript
{(() => {
  // Check if button is form-connected
  if (!buttonConfig || buttonConfig.type !== 'form') {
    return (
      <CTAButtonPublished
        text={cta_text}
        backgroundColor={accentColor}
        textColor="#FFFFFF"
        className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4"
      />
    );
  }

  // Get form from content
  const form = props.content?.forms?.[buttonConfig.formId];
  if (!form) {
    console.warn(`Form not found: ${buttonConfig.formId}`);
    return (
      <CTAButtonPublished
        text={cta_text}
        backgroundColor={accentColor}
        textColor="#FFFFFF"
        className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4"
      />
    );
  }

  // Determine placement
  const placement = determineFormPlacement(
    form,
    buttonConfig.ctaType || 'primary',
    'hero',  // Change to 'cta' for PrimaryCTA sections
    props.sections || []
  );

  // Render inline form (single-field)
  if (placement.placement === 'inline') {
    return (
      <InlineFormMarkupPublished
        form={form}
        publishedPageId={publishedPageId || ''}
        pageOwnerId={pageOwnerId || ''}
        size="large"
        variant="primary"
        colorTokens={colorTokens}
        className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
      />
    );
  }

  // Otherwise render as button (scroll to form or open modal)
  return (
    <CTAButtonPublished
      text={cta_text}
      backgroundColor={accentColor}
      textColor="#FFFFFF"
      className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg px-8 py-4"
    />
  );
})()}
```

### Step 4: Update Section Type Parameter

In the `determineFormPlacement` call:
- **Hero UIBlocks:** Use `'hero'` as 3rd parameter
- **PrimaryCTA UIBlocks:** Use `'cta'` as 3rd parameter

```typescript
const placement = determineFormPlacement(
  form,
  buttonConfig.ctaType || 'primary',
  'hero',  // or 'cta'
  props.sections || []
);
```

---

## Common Variations

### Variation 1: Secondary CTA

If the UIBlock has a secondary CTA button:

```typescript
// Extract secondary button metadata
const secondaryCtaElement = sectionData?.elements?.secondary_cta_text;
const secondaryButtonConfig = secondaryCtaElement?.metadata?.buttonConfig;
```

Then apply the same pattern to the secondary button render.

### Variation 2: Multiple CTA Buttons

Some UIBlocks may have multiple CTA buttons. Apply the pattern to each one separately.

### Variation 3: Custom Button Styling

Preserve the existing button styling classes when creating the fallback `<CTAButtonPublished>` components.

---

## Testing Checklist

After implementing the pattern in a UIBlock:

### Editor Testing
- [ ] Create a new page with this UIBlock
- [ ] Connect a single-field form to the CTA button
- [ ] Preview page - verify form appears inline
- [ ] Connect a multi-field form
- [ ] Preview page - verify button appears (not inline form)

### Publish Testing
- [ ] Publish the page
- [ ] Check backend logs - verify no errors during static export
- [ ] Visit published page URL
- [ ] **Single-field form:** Verify inline form renders (email input + submit button)
- [ ] **Multi-field form:** Verify button renders with scroll/modal behavior
- [ ] Submit form - verify success message appears
- [ ] Check dashboard - verify submission recorded

### Edge Cases
- [ ] Test with no form connected - verify default button appears
- [ ] Test with invalid form ID - verify fallback button + warning logged
- [ ] Test with legacy content (no forms) - verify no errors

---

## Implementation Order (Recommended)

### Phase 1: Hero UIBlocks (Priority)
1. ⏳ **Minimalist.published.tsx** - Simplest layout, good starting point
2. ⏳ **centerStacked.published.tsx** - Similar to splitScreen
3. ⏳ **imageFirst.published.tsx** - Image-focused variant
4. ⏳ **leftCopyRightImage.published.tsx** - Complex layout

### Phase 2: PrimaryCTA UIBlocks
1. ⏳ **CenteredHeadlineCTA.published.tsx** - Simplest CTA variant
2. ⏳ **ValueStackCTA.published.tsx** - Standard CTA with features
3. ⏳ **TestimonialCTACombo.published.tsx** - CTA + testimonial
4. ⏳ **VisualCTAWithMockup.published.tsx** - CTA + visual element

---

## Code Locations Reference

### Files to Modify (8 total)

**Hero UIBlocks:**
- `src/modules/UIBlocks/Hero/Minimalist.published.tsx`
- `src/modules/UIBlocks/Hero/centerStacked.published.tsx`
- `src/modules/UIBlocks/Hero/imageFirst.published.tsx`
- `src/modules/UIBlocks/Hero/leftCopyRightImage.published.tsx`

**PrimaryCTA UIBlocks:**
- `src/modules/UIBlocks/PrimaryCTA/CenteredHeadlineCTA.published.tsx`
- `src/modules/UIBlocks/PrimaryCTA/TestimonialCTACombo.published.tsx`
- `src/modules/UIBlocks/PrimaryCTA/ValueStackCTA.published.tsx`
- `src/modules/UIBlocks/PrimaryCTA/VisualCTAWithMockup.published.tsx`

### Reference Files (Do Not Modify)
- `src/modules/UIBlocks/Hero/splitScreen.published.tsx` - Gold standard implementation
- `src/components/published/InlineFormMarkupPublished.tsx` - Inline form component
- `src/components/published/FormMarkupPublished.tsx` - Full form component
- `src/utils/formPlacement.ts` - Form placement utility

---

## Key Implementation Notes

### ✅ DO:
- Follow the exact pattern from splitScreen.published.tsx
- Preserve existing button styling and classes
- Use `console.warn` for missing forms (not `console.error`)
- Pass `props.sections || []` to determineFormPlacement (not wrapped in hasPrimaryCTASection)
- Use correct section type: 'hero' or 'cta'

### ❌ DON'T:
- Call `hasPrimaryCTASection()` when passing to determineFormPlacement (it's called internally)
- Modify the form placement logic - use the utility as-is
- Add new props to LayoutComponentProps - they're already there (content, sections)
- Change the form structure or keys

### 🔍 Common Issues:
- **"Form not found"** - Check that `props.content.forms` is being passed correctly
- **"sections.includes is not a function"** - Don't wrap sections array in hasPrimaryCTASection()
- **Button always shows instead of inline form** - Check buttonConfig.type === 'form' condition
- **Forms missing on published page** - Verify merge in `/p/[slug]/page.tsx` includes forms

---

## Related Documentation

- **Form Placement Logic:** `src/utils/formPlacement.ts`
- **Form Types:** `src/types/core/forms.ts`
- **Editor Integration:** `formPlacement.md`
- **Publish Flow:** `publishExport.md`

---

## Completion Tracking

Mark each UIBlock as you complete it:

### Hero
- [x] splitScreen.published.tsx ✅ COMPLETE
- [x] Minimalist.published.tsx ⏭️ SKIPPED (no CTA buttons)
- [x] centerStacked.published.tsx ✅ COMPLETE
- [x] imageFirst.published.tsx ✅ COMPLETE
- [x] leftCopyRightImage.published.tsx ✅ COMPLETE

### PrimaryCTA
- [x] CTAWithFormField.published.tsx ✅ COMPLETE (different pattern - FormIsland)
- [ ] CenteredHeadlineCTA.published.tsx
- [ ] TestimonialCTACombo.published.tsx
- [ ] ValueStackCTA.published.tsx
- [ ] VisualCTAWithMockup.published.tsx

**Progress:** 2/10 complete (20%)
