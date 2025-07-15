// /app/edit/[token]/components/ui/colorSemanticUpdates.ts
import type { ColorTokens, ColorIntensityLevel, TextContrastLevel } from '@/types/core';

/**
 * Update interactive colors (CTAs, links, focus states) based on new accent color
 */
export function updateInteractiveColors(
  newAccentColor: string, 
  baseColor: string, 
  currentTokens: ColorTokens
): ColorTokens {
  return {
    ...currentTokens,
    
    // Interactive Elements - All use the new accent color
    accent: `bg-${newAccentColor}-600`,
    accentHover: `bg-${newAccentColor}-700`,
    accentBorder: `border-${newAccentColor}-600`,
    
    // Primary CTAs - Use accent color for consistency
    ctaBg: `bg-${newAccentColor}-600`,
    ctaHover: `bg-${newAccentColor}-700`,
    ctaText: 'text-white',
    
    // Secondary CTAs - Use safe colors for hierarchy
    ctaSecondary: `bg-gray-100`,
    ctaSecondaryHover: `bg-gray-200`,
    ctaSecondaryText: `text-gray-700`,
    
    // Ghost CTAs - Use accent color
    ctaGhost: `text-${newAccentColor}-600`,
    ctaGhostHover: `bg-${newAccentColor}-50`,
    
    // Links - Match accent color for consistency
    link: `text-${newAccentColor}-600`,
    linkHover: `text-${newAccentColor}-700`,
    
    // Focus borders - Use accent for interactive consistency
    borderFocus: `border-${newAccentColor}-500`,
  };
}

/**
 * Update text contrast levels while maintaining hierarchy
 */
export function updateTextContrast(
  level: TextContrastLevel, 
  baseColor: string, 
  currentTokens: ColorTokens
): ColorTokens {
  // ✅ CONSERVATIVE: Always use safe gray colors instead of base colors
  // This prevents blue text on purple backgrounds and similar issues
  const contrastMaps = {
    subtle: {
      textPrimary: 'text-gray-700',        // Subtle but readable
      textSecondary: 'text-gray-500',      // Light gray
      textMuted: 'text-gray-400',          // Very light gray
      textOnLight: 'text-gray-700',        // Subtle on light backgrounds
    },
    balanced: {
      textPrimary: 'text-gray-800',        // Good readability  
      textSecondary: 'text-gray-600',      // Medium gray
      textMuted: 'text-gray-400',          // Light gray
      textOnLight: 'text-gray-800',        // Balanced on light backgrounds
    },
    high: {
      textPrimary: 'text-gray-900',        // Maximum contrast
      textSecondary: 'text-gray-700',      // Dark gray
      textMuted: 'text-gray-500',          // Medium gray
      textOnLight: 'text-gray-900',        // High contrast on light backgrounds
    },
  };

  return {
    ...currentTokens,
    ...contrastMaps[level],
    
    // Dark text colors remain consistent
    textOnDark: 'text-white',
    textOnAccent: 'text-white',
    textInverse: 'text-white',
  };
}

/**
 * Scale overall color intensity while preserving relationships
 */
export function updateOverallIntensity(
  level: ColorIntensityLevel, 
  currentTokens: ColorTokens
): ColorTokens {
  const intensityMultipliers = {
    soft: { main: 400, hover: 500, border: 300 },
    medium: { main: 600, hover: 700, border: 500 },
    bold: { main: 700, hover: 800, border: 600 },
  };

  const multiplier = intensityMultipliers[level];

  // Helper to replace color intensity in CSS classes
  const adjustColorIntensity = (cssClass: string, newIntensity: number): string => {
    if (!cssClass) return cssClass;
    
    // Replace common intensity patterns
    return cssClass
      .replace(/-(\d{3})\b/g, `-${newIntensity}`)
      .replace(/-(\d{2})\b/g, `-${newIntensity}`);
  };

  return {
    ...currentTokens,
    
    // Adjust interactive elements
    accent: adjustColorIntensity(currentTokens.accent, multiplier.main),
    accentHover: adjustColorIntensity(currentTokens.accentHover, multiplier.hover),
    accentBorder: adjustColorIntensity(currentTokens.accentBorder, multiplier.border),
    
    // Adjust CTAs
    ctaBg: adjustColorIntensity(currentTokens.ctaBg, multiplier.main),
    ctaHover: adjustColorIntensity(currentTokens.ctaHover, multiplier.hover),
    
    // Adjust secondary CTAs (lighter)
    ctaSecondary: adjustColorIntensity(currentTokens.ctaSecondary, Math.max(50, multiplier.main - 500)),
    ctaSecondaryHover: adjustColorIntensity(currentTokens.ctaSecondaryHover, Math.max(100, multiplier.main - 400)),
    
    // Adjust links
    link: adjustColorIntensity(currentTokens.link, multiplier.main),
    linkHover: adjustColorIntensity(currentTokens.linkHover, multiplier.hover),
    
    // Adjust borders
    borderFocus: adjustColorIntensity(currentTokens.borderFocus, multiplier.border),
    
    // Adjust surface colors based on intensity
    surfaceElevated: level === 'soft' 
      ? adjustColorIntensity(currentTokens.surfaceElevated, 25)
      : level === 'bold'
        ? adjustColorIntensity(currentTokens.surfaceElevated, 100)
        : currentTokens.surfaceElevated,
        
    surfaceSection: level === 'soft'
      ? adjustColorIntensity(currentTokens.surfaceSection, 50)
      : level === 'bold'
        ? adjustColorIntensity(currentTokens.surfaceSection, 200)
        : currentTokens.surfaceSection,
  };
}

/**
 * Validate color accessibility and compatibility
 */
export function validateColorTokens(
  tokens: ColorTokens, 
  backgroundSystem: { baseColor: string; accentColor: string }
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required tokens
  const requiredTokens = ['ctaBg', 'textPrimary', 'link'];
  requiredTokens.forEach(token => {
    if (!tokens[token as keyof ColorTokens]) {
      errors.push(`Missing required token: ${token}`);
    }
  });

  // Check CSS class format
  Object.entries(tokens).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('bg-') && !value.match(/^bg-\w+-\d+/)) {
      warnings.push(`Potentially invalid CSS class: ${key} = ${value}`);
    }
  });

  // Check for accessibility concerns
  if (tokens.ctaBg === tokens.ctaSecondary) {
    warnings.push('Primary and secondary CTAs use the same color');
  }

  // Check color harmony
  if (backgroundSystem.accentColor !== extractColorFromClass(tokens.link)) {
    warnings.push('Link color does not match accent color - may impact consistency');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract base color name from Tailwind CSS class
 */
function extractColorFromClass(cssClass: string): string {
  if (!cssClass) return '';
  
  const match = cssClass.match(/(?:bg-|text-|border-)(\w+)-\d+/);
  return match ? match[1] : '';
}

/**
 * Generate preview data for semantic controls
 */
export function generateColorPreview(tokens: ColorTokens): {
  cta: { bg: string; text: string; hover: string };
  text: { primary: string; secondary: string; muted: string };
  links: { normal: string; hover: string };
} {
  return {
    cta: {
      bg: tokens.ctaBg,
      text: tokens.ctaText,
      hover: tokens.ctaHover,
    },
    text: {
      primary: tokens.textPrimary,
      secondary: tokens.textSecondary,
      muted: tokens.textMuted,
    },
    links: {
      normal: tokens.link,
      hover: tokens.linkHover,
    },
  };
}

/**
 * Smart accent color suggestions based on base color
 */
export function getAccentSuggestions(baseColor: string): Array<{
  color: string;
  label: string;
  reasoning: string;
  harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic';
}> {
  const suggestions = [
    { color: baseColor, label: `Match ${baseColor}`, reasoning: 'Monochromatic harmony', harmony: 'monochromatic' as const },
    { color: 'purple', label: 'Purple', reasoning: 'Versatile and modern', harmony: 'analogous' as const },
    { color: 'blue', label: 'Blue', reasoning: 'Trust and reliability', harmony: 'analogous' as const },
    { color: 'green', label: 'Green', reasoning: 'Growth and action', harmony: 'complementary' as const },
    { color: 'orange', label: 'Orange', reasoning: 'Energy and enthusiasm', harmony: 'complementary' as const },
    { color: 'red', label: 'Red', reasoning: 'Urgency and attention', harmony: 'triadic' as const },
  ];

  // Filter out duplicate of base color and return top suggestions
  return suggestions
    .filter((suggestion, index) => index === 0 || suggestion.color !== baseColor)
    .slice(0, 6);
}