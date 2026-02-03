Overall agree with direction - single format is cleaner. But have some concerns/questions:                                                                                      
  ---                                                                                                                                                                            Questions
                                                                                                                                                                               
  1. Emoji removal - are you sure?
    - Mock data uses emojis extensively (😤→😌, 📧→🚀 in before/after blocks)
    - Users may intentionally want emojis for emotional context
    - Emojis = zero bundle size, Lucide = ~400KB import
    - Is this a product decision or just technical cleanup?
  2. "No migration needed" but...
    - Lines 131-132 describe runtime migration (strip prefix, replace emoji)
    - This IS migration, just at read-time
    - What about performance on pages with 50+ icons?
    - What about saved drafts with existing emojis?
  3. iconSearchIndex.ts - can IconPicker work without it?
    - It powers the search functionality
    - If archived, how does Lucide search work?

  ---
  File Path Issues

  POreview.md says:          Actual location:
  ─────────────────────────────────────────────
  src/lib/icons/iconMapping.ts    →  src/utils/iconMapping.ts
  src/lib/icons/iconSearchIndex.ts →  Need to verify

  ---
  Missing UIBlocks from List

  Line 106-114 is incomplete. Also need:
  - StackedWinsList.tsx (has getContextualIcon)
  - SplitAlternating.tsx (icon field)
  - SideBySideBlock.tsx (before_icon, after_icon)
  - SplitCard.tsx (icons)
  - Carousel.tsx (benefit_icon_1, benefit_icon_2)
  - CallToQuotePlan.tsx (icon in contact_cards)
  - VisualObjectionTiles.tsx (icon field)
  - IndustryUseCaseGrid.tsx (icon field)
  - And ~10 more with icon fields

  ---
  Suggestions

  1. Consider hybrid approach:
  // Support both PascalCase Lucide AND emoji
  const renderIcon = (value: string) => {
    // Lucide: starts with uppercase
    if (/^[A-Z]/.test(value)) {
      const Icon = LucideIcons[value];
      if (Icon) return <Icon />;
    }
    // Emoji: has emoji character
    if (/\p{Emoji}/u.test(value)) {
      return <span>{value}</span>;
    }
    // Fallback
    return <LucideIcons.Sparkles />;
  };
  1. This removes prefix complexity while keeping emoji support.
  2. Bundle size mitigation:
  // Instead of: import * as LucideIcons from 'lucide-react'
  // Use dynamic import for published pages:
  const Icon = dynamic(() => import('lucide-react').then(m => m[iconName]));
  3. Add lucideIconCategories.ts to archive list if removing IconPicker's Lucide functionality
  4. Consolidation target should be explicit:
    - Merge getPainIconFromText() from StackedPainBullets
    - Merge getContextualIcon() from StatBlocks
    - Merge iconMapping.ts categories
    - All into single inferIconFromText() in iconCategoryMap.ts

  ---
  Bottom Line

  Agree: Single format, remove prefixes, consolidate derivation logic
  Disagree: Removing emoji support entirely (product impact)
  Missing: Complete UIBlock list, file path verification, bundle size consideration