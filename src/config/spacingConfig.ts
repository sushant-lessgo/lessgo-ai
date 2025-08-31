/**
 * Standardized spacing configuration for consistent spacing across all components
 */

export type SpacingLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type ComponentDensity = 'compact' | 'normal' | 'spacious';

/**
 * Spacing tokens in pixels (for reference)
 * These map to Tailwind spacing classes
 */
export const SPACING_TOKENS = {
  xs: 8,    // 0.5rem
  sm: 16,   // 1rem
  md: 24,   // 1.5rem
  lg: 32,   // 2rem
  xl: 48,   // 3rem
  '2xl': 64, // 4rem
  '3xl': 96, // 6rem
} as const;

/**
 * Tailwind padding classes for different spacing levels
 */
export const PADDING_CLASSES: Record<SpacingLevel, string> = {
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
  '2xl': 'p-16',
  '3xl': 'p-24',
};

/**
 * Responsive padding classes that adapt to screen size
 */
export const RESPONSIVE_PADDING: Record<SpacingLevel, string> = {
  xs: 'p-2',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6 lg:p-8',
  lg: 'p-6 md:p-8 lg:p-10',
  xl: 'p-8 md:p-10 lg:p-12',
  '2xl': 'p-10 md:p-12 lg:p-16',
  '3xl': 'p-12 md:p-16 lg:p-24',
};

/**
 * Gap classes for grid and flex layouts
 */
export const GAP_CLASSES: Record<SpacingLevel, string> = {
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
  '2xl': 'gap-16',
  '3xl': 'gap-24',
};

/**
 * Responsive gap classes that adapt to screen size
 */
export const RESPONSIVE_GAP: Record<SpacingLevel, string> = {
  xs: 'gap-2',
  sm: 'gap-3 md:gap-4',
  md: 'gap-4 md:gap-6 lg:gap-8',
  lg: 'gap-6 md:gap-8 lg:gap-10',
  xl: 'gap-8 md:gap-10 lg:gap-12',
  '2xl': 'gap-10 md:gap-12 lg:gap-16',
  '3xl': 'gap-12 md:gap-16 lg:gap-24',
};

/**
 * Vertical spacing (margin-bottom) classes
 */
export const VERTICAL_SPACING: Record<SpacingLevel, string> = {
  xs: 'mb-2',
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
  xl: 'mb-12',
  '2xl': 'mb-16',
  '3xl': 'mb-24',
};

/**
 * Responsive vertical spacing classes
 */
export const RESPONSIVE_VERTICAL: Record<SpacingLevel, string> = {
  xs: 'mb-2',
  sm: 'mb-3 md:mb-4',
  md: 'mb-4 md:mb-6 lg:mb-8',
  lg: 'mb-6 md:mb-8 lg:mb-10',
  xl: 'mb-8 md:mb-10 lg:mb-12',
  '2xl': 'mb-10 md:mb-12 lg:mb-16',
  '3xl': 'mb-12 md:mb-16 lg:mb-24',
};

/**
 * Component density presets
 * Maps density levels to appropriate spacing levels
 */
export const DENSITY_SPACING: Record<ComponentDensity, {
  padding: SpacingLevel;
  gap: SpacingLevel;
  vertical: SpacingLevel;
}> = {
  compact: {
    padding: 'sm',
    gap: 'sm',
    vertical: 'sm',
  },
  normal: {
    padding: 'md',
    gap: 'md',
    vertical: 'md',
  },
  spacious: {
    padding: 'lg',
    gap: 'lg',
    vertical: 'lg',
  },
};

/**
 * UIBlock-specific spacing configurations
 * Default spacing for different component types
 */
export const UIBLOCK_SPACING = {
  hero: {
    padding: 'xl' as SpacingLevel,
    gap: 'lg' as SpacingLevel,
    contentGap: 'md' as SpacingLevel,
  },
  problem: {
    padding: 'lg' as SpacingLevel,
    gap: 'lg' as SpacingLevel,
    cardGap: 'md' as SpacingLevel,
  },
  solution: {
    padding: 'lg' as SpacingLevel,
    gap: 'md' as SpacingLevel,
    featureGap: 'sm' as SpacingLevel,
  },
  features: {
    padding: 'lg' as SpacingLevel,
    gap: 'lg' as SpacingLevel,
    itemGap: 'md' as SpacingLevel,
  },
  pricing: {
    padding: 'lg' as SpacingLevel,
    gap: 'lg' as SpacingLevel,
    cardPadding: 'md' as SpacingLevel,
  },
  testimonial: {
    padding: 'lg' as SpacingLevel,
    gap: 'md' as SpacingLevel,
    cardPadding: 'md' as SpacingLevel,
  },
  cta: {
    padding: 'xl' as SpacingLevel,
    gap: 'md' as SpacingLevel,
    buttonGap: 'sm' as SpacingLevel,
  },
  footer: {
    padding: 'lg' as SpacingLevel,
    gap: 'lg' as SpacingLevel,
    linkGap: 'sm' as SpacingLevel,
  },
} as const;

/**
 * Helper function to get responsive spacing classes
 * @param level - The spacing level
 * @param type - The type of spacing (padding, gap, vertical)
 * @param responsive - Whether to use responsive classes
 */
export function getSpacingClass(
  level: SpacingLevel,
  type: 'padding' | 'gap' | 'vertical' = 'padding',
  responsive: boolean = true
): string {
  if (responsive) {
    switch (type) {
      case 'padding':
        return RESPONSIVE_PADDING[level];
      case 'gap':
        return RESPONSIVE_GAP[level];
      case 'vertical':
        return RESPONSIVE_VERTICAL[level];
    }
  } else {
    switch (type) {
      case 'padding':
        return PADDING_CLASSES[level];
      case 'gap':
        return GAP_CLASSES[level];
      case 'vertical':
        return VERTICAL_SPACING[level];
    }
  }
}

/**
 * Helper function to get density-based spacing
 * @param density - The component density
 * @param type - The type of spacing
 */
export function getDensitySpacing(
  density: ComponentDensity,
  type: 'padding' | 'gap' | 'vertical'
): string {
  const level = DENSITY_SPACING[density][type];
  return getSpacingClass(level, type);
}

/**
 * Helper function to get UIBlock-specific spacing
 * @param blockType - The type of UIBlock
 * @param spacingType - The specific spacing needed
 */
export function getUIBlockSpacing(
  blockType: keyof typeof UIBLOCK_SPACING,
  spacingType: string
): string {
  const config = UIBLOCK_SPACING[blockType];
  const level = (config as any)[spacingType] as SpacingLevel;
  
  if (!level) {
    // Default fallback
    return getSpacingClass('md', 'padding');
  }
  
  // Determine the type based on the spacingType name
  let type: 'padding' | 'gap' | 'vertical' = 'padding';
  if (spacingType.toLowerCase().includes('gap')) {
    type = 'gap';
  } else if (spacingType.toLowerCase().includes('vertical') || spacingType.toLowerCase().includes('margin')) {
    type = 'vertical';
  }
  
  return getSpacingClass(level, type);
}

/**
 * Helper to combine multiple spacing classes
 */
export function combineSpacing(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}