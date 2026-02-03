 CTA Padding — Developer Instructions                                                                                                                                         

  Option A: Use existing "extra" preset                                                                                                                                           
  In LayoutSection.tsx, CTA sections should default to "extra" spacing:                                                                                                        
  
  // Line 50
  case 'extra':
    return 'py-20 md:py-24 lg:py-32'; // 80px → 96px → 128px

  Implementation: Set sectionSpacing['cta'] = 'extra' in store during generation.

  ---
  Option B: CTA-specific padding (Recommended)

  Add CTA case in getSpacingClass:

  // LayoutSection.tsx ~line 43
  const getSpacingClass = (spacing?: string, sectionType?: string): string => {
    // CTA always gets generous padding
    if (sectionType === 'cta' || sectionType === 'CenteredHeadlineCTA' ||
        sectionType === 'ValueStackCTA' || sectionType === 'VisualCTAWithMockup') {
      return 'py-16 md:py-20 lg:py-24'; // 64px → 80px → 96px
    }

    switch (spacing) {
      // ... existing cases
    }
  };

  Then pass sectionType to the function at line 57.

  ---
  Concrete Values
  ┌────────────┬──────────────────┬─────────────────┐
  │ Breakpoint │ Current (normal) │ Recommended CTA │
  ├────────────┼──────────────────┼─────────────────┤
  │ Mobile     │ 48px (py-12)     │ 64px (py-16)    │
  ├────────────┼──────────────────┼─────────────────┤
  │ Tablet     │ 56px (py-14)     │ 80px (py-20)    │
  ├────────────┼──────────────────┼─────────────────┤
  │ Desktop    │ 64px (py-16)     │ 96px (py-24)    │
  └────────────┴──────────────────┴─────────────────┘
  ---
  Quickest Fix

  If you want minimal code change, just update CTA components directly:

  // CenteredHeadlineCTA.tsx, ValueStackCTA.tsx, VisualCTAWithMockup.tsx
  // In the LayoutSection call, add:

  <LayoutSection
    ...
    className="py-16 md:py-20 lg:py-24"  // Override default
  >

  This will stack with existing padding from LayoutSection, so you may need noPadding={true} + the className.

  ---
  Pick Option B for clean architecture. Option A is quick but less explicit.