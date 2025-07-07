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
    
    // Secondary CTAs - Use base color for hierarchy
    ctaSecondary: `bg-${baseColor}-100`,
    ctaSecondaryHover: `bg-${baseColor}-200`,
    ctaSecondaryText: `text-${baseColor}-700`,
    
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
  const contrastMaps = {
    subtle: {
      textPrimary: `text-${baseColor}-700`,
      textSecondary: `text-${baseColor}-500`,
      textMuted: `text-${baseColor}-400`,
      textOnLight: `text-${baseColor}-700`,
    },
    balanced: {
      textPrimary: `text-${baseColor}-800`,
      textSecondary: `text-${baseColor}-600`,
      textMuted: `text-${baseColor}-400`,
      textOnLight: `text-${baseColor}-800`,
    },
    high: {
      textPrimary: `text-${baseColor}-900`,
      textSecondary: `text-${baseColor}-700`,
      textMuted: `text-${baseColor}-500`,
      textOnLight: `text-${baseColor}-900`,
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