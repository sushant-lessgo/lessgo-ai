// improvedTextColors.ts - Advanced text color system with proper contrast and accessibility
// Replaces the fragile string-matching system in enhancedBackgroundLogic.ts

import { 
  analyzeBackground, 
  getTextColorsFromBackground, 
  BackgroundAnalysis 
} from './backgroundAnalysis';
import { 
  validateColorAccessibility, 
  ContrastLevel, 
  getSafeColorFallback 
} from './colorUtils';
import { getSmartAccentColor } from './colorHarmony';

/**
 * Text color configuration options
 */
export interface TextColorOptions {
  requireWCAG?: 'AA' | 'AAA';
  preferHighContrast?: boolean;
  brandColors?: {
    heading?: string;
    body?: string;
    muted?: string;
  };
  fallbackStrategy?: 'safe' | 'adaptive' | 'brand-first';
}

/**
 * Enhanced text color result with validation info
 */
export interface EnhancedTextColors {
  heading: string;
  body: string;
  muted: string;
  accent: string;
  accentCSS: string;
  validation: {
    headingValid: boolean;
    bodyValid: boolean;
    mutedValid: boolean;
    warnings: string[];
    confidence: number;
  };
  backgroundAnalysis: BackgroundAnalysis;
}

/**
 * Business context for color decisions
 */
export interface BusinessColorContext {
  marketCategory?: string;
  targetAudience?: string;
  landingPageGoals?: string;
  toneProfile?: string;
  awarenessLevel?: string;
  marketSophisticationLevel?: string;
}

/**
 * Get enhanced text colors for any background type with proper validation
 */
export function getEnhancedTextColors(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  backgroundCSS: string,
  businessContext: BusinessColorContext = {},
  options: TextColorOptions = {}
): EnhancedTextColors {
  
  try {
    // Analyze the background
    const backgroundAnalysis = analyzeBackground(backgroundCSS);
    
    // Get base text colors from background analysis
    const baseTextColors = getTextColorsFromBackground(backgroundAnalysis, {
      preferHighContrast: options.preferHighContrast,
      requireWCAG: options.requireWCAG
    });
    
    // Apply business context and validation
    const validatedColors = validateAndImproveTextColors(
      baseTextColors,
      backgroundAnalysis,
      businessContext,
      options
    );
    
    // Get smart accent color
    const accentResult = getSmartAccentColor(
      backgroundAnalysis.averageColor ? 
        `rgb(${backgroundAnalysis.averageColor.r}, ${backgroundAnalysis.averageColor.g}, ${backgroundAnalysis.averageColor.b})` :
        '#6b7280', // gray-500 fallback
      businessContext
    );
    
    return {
      ...validatedColors,
      accent: accentResult.accentColor,
      accentCSS: accentResult.accentCSS,
      backgroundAnalysis
    };
    
  } catch (error) {
    console.error('Enhanced text color generation failed:', error);
    return createSafeTextColorFallback(backgroundType, businessContext);
  }
}

/**
 * Validate and improve text colors based on accessibility requirements
 */
function validateAndImproveTextColors(
  baseColors: { heading: string; body: string; muted: string; confidence: number },
  backgroundAnalysis: BackgroundAnalysis,
  businessContext: BusinessColorContext,
  options: TextColorOptions
): {
  heading: string;
  body: string;
  muted: string;
  validation: {
    headingValid: boolean;
    bodyValid: boolean;
    mutedValid: boolean;
    warnings: string[];
    confidence: number;
  };
} {
  
  const warnings: string[] = [];
  const requiredLevel = options.requireWCAG === 'AAA' ? ContrastLevel.AAA_NORMAL : ContrastLevel.AA_NORMAL;
  
  // Get background color for validation
  const bgColorStr = backgroundAnalysis.averageColor ? 
    `rgb(${backgroundAnalysis.averageColor.r}, ${backgroundAnalysis.averageColor.g}, ${backgroundAnalysis.averageColor.b})` :
    '#ffffff';
  
  // Validate each text color
  const headingValidation = validateColorAccessibility(baseColors.heading, bgColorStr);
  const bodyValidation = validateColorAccessibility(baseColors.body, bgColorStr);
  const mutedValidation = validateColorAccessibility(baseColors.muted, bgColorStr);
  
  let heading = baseColors.heading;
  let body = baseColors.body;
  let muted = baseColors.muted;
  
  // Apply brand colors if provided and they meet requirements
  if (options.brandColors) {
    if (options.brandColors.heading) {
      const brandHeadingValidation = validateColorAccessibility(options.brandColors.heading, bgColorStr);
      if (brandHeadingValidation.contrastRatio >= requiredLevel || options.fallbackStrategy === 'brand-first') {
        heading = options.brandColors.heading;
        if (!brandHeadingValidation.isValid) {
          warnings.push('Brand heading color does not meet WCAG requirements');
        }
      } else {
        warnings.push('Brand heading color rejected due to poor contrast');
      }
    }
    
    if (options.brandColors.body) {
      const brandBodyValidation = validateColorAccessibility(options.brandColors.body, bgColorStr);
      if (brandBodyValidation.contrastRatio >= requiredLevel || options.fallbackStrategy === 'brand-first') {
        body = options.brandColors.body;
        if (!brandBodyValidation.isValid) {
          warnings.push('Brand body color does not meet WCAG requirements');
        }
      } else {
        warnings.push('Brand body color rejected due to poor contrast');
      }
    }
    
    if (options.brandColors.muted) {
      const brandMutedValidation = validateColorAccessibility(options.brandColors.muted, bgColorStr);
      if (brandMutedValidation.contrastRatio >= (requiredLevel * 0.8) || options.fallbackStrategy === 'brand-first') {
        muted = options.brandColors.muted;
        if (!brandMutedValidation.isValid) {
          warnings.push('Brand muted color has low contrast but may be acceptable for secondary text');
        }
      }
    }
  }
  
  // Handle low confidence backgrounds
  if (backgroundAnalysis.confidence < 0.7) {
    warnings.push('Background analysis has low confidence - using conservative text colors');
    
    if (options.fallbackStrategy === 'safe') {
      const safeColors = getSafeColorFallback(backgroundAnalysis.luminance);
      heading = safeColors.heading;
      body = safeColors.body;  
      muted = safeColors.muted;
    }
  }
  
  // Handle complex backgrounds
  if (backgroundAnalysis.complexity === 'complex' || backgroundAnalysis.hasHighContrast) {
    warnings.push('Complex background detected - using high contrast text colors');
    
    // For complex backgrounds, ensure maximum contrast
    if (backgroundAnalysis.isLight) {
      heading = addTextShadowIfNeeded(heading, true);
      body = addTextShadowIfNeeded(body, true);
    } else {
      heading = addTextShadowIfNeeded(heading, false);
      body = addTextShadowIfNeeded(body, false);
    }
  }
  
  // Calculate overall confidence
  const validationScores = [
    headingValidation.contrastRatio / 21, // Normalize to 0-1
    bodyValidation.contrastRatio / 21,
    mutedValidation.contrastRatio / 21
  ];
  const avgValidationScore = validationScores.reduce((a, b) => a + b, 0) / validationScores.length;
  const confidence = Math.min(backgroundAnalysis.confidence, avgValidationScore) * 100;
  
  return {
    heading,
    body,
    muted,
    validation: {
      headingValid: headingValidation.isValid,
      bodyValid: bodyValidation.isValid,
      mutedValid: mutedValidation.isValid,
      warnings,
      confidence: Math.round(confidence) / 100
    }
  };
}

/**
 * Add text shadow for complex backgrounds when needed
 */
function addTextShadowIfNeeded(color: string, isLightBackground: boolean): string {
  // Only add shadow if it's a base color class (not already styled)
  if (color.includes('drop-shadow') || color.includes('text-shadow')) {
    return color;
  }
  
  // Add appropriate shadow based on background
  if (isLightBackground) {
    // Dark text on light background - subtle light shadow
    return `${color} drop-shadow-sm`;
  } else {
    // Light text on dark background - subtle dark shadow  
    return `${color} drop-shadow-sm`;
  }
}

/**
 * Create safe fallback when all else fails
 */
function createSafeTextColorFallback(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  businessContext: BusinessColorContext
): EnhancedTextColors {
  
  console.warn('Using safe text color fallback for background type:', backgroundType);
  
  // Determine if this is likely a light or dark background
  const isDarkBackground = backgroundType === 'primary'; // Assume primary might be dark
  
  const safeColors = isDarkBackground ? 
    getSafeColorFallback(0.2) : // Dark background
    getSafeColorFallback(0.8);  // Light background
  
  // Get accent color
  const accentResult = getSmartAccentColor('#6b7280', businessContext);
  
  return {
    heading: safeColors.heading,
    body: safeColors.body,
    muted: safeColors.muted,
    accent: accentResult.accentColor,
    accentCSS: accentResult.accentCSS,
    validation: {
      headingValid: true,
      bodyValid: true,
      mutedValid: true,
      warnings: ['Using safe fallback colors due to analysis failure'],
      confidence: 0.5
    },
    backgroundAnalysis: {
      type: 'solid',
      dominantColor: { r: 128, g: 128, b: 128 },
      averageColor: { r: 128, g: 128, b: 128 },
      luminance: 0.5,
      isLight: !isDarkBackground,
      isDark: isDarkBackground,
      hasHighContrast: false,
      complexity: 'simple',
      confidence: 0.5,
      fallbackColors: safeColors
    }
  };
}

/**
 * Utility function to replace the old getTextColorForBackground function
 */
export function getTextColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  backgroundSystem: any,
  businessContext: BusinessColorContext = {},
  options: TextColorOptions = {}
): { heading: string; body: string; muted: string } {
  
  // Get the background CSS for this type
  const backgroundCSS = backgroundSystem[backgroundType] || backgroundSystem.neutral || 'bg-white';
  
  // Use the enhanced system
  const enhancedColors = getEnhancedTextColors(
    backgroundType,
    backgroundCSS,
    businessContext,
    options
  );
  
  // Log warnings if in development
  if (process.env.NODE_ENV === 'development' && enhancedColors.validation.warnings.length > 0) {
    console.warn(`Text color warnings for ${backgroundType}:`, enhancedColors.validation.warnings);
  }
  
  return {
    heading: enhancedColors.heading,
    body: enhancedColors.body,
    muted: enhancedColors.muted
  };
}

/**
 * Quick utility for getting just body text color (backward compatibility)
 */
export function getBodyColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  backgroundSystem: any,
  businessContext?: BusinessColorContext
): string {
  const colors = getTextColorForBackground(backgroundType, backgroundSystem, businessContext);
  return colors.body;
}

/**
 * Quick utility for getting just muted text color (backward compatibility)
 */
export function getMutedColorForBackground(
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  backgroundSystem: any,
  businessContext?: BusinessColorContext
): string {
  const colors = getTextColorForBackground(backgroundType, backgroundSystem, businessContext);
  return colors.muted;
}

/**
 * Simple function to get smart text color based on background
 * Main export that replaces old text color functions
 */
export function getSmartTextColor(
  backgroundColor: string,
  textType: 'heading' | 'body' | 'muted' = 'body'
): string {
  // Analyze the background
  const backgroundAnalysis = analyzeBackground(backgroundColor);
  
  // Get appropriate text colors
  const textColors = getTextColorsFromBackground(backgroundAnalysis, {});
  
  // Return the requested text type
  switch (textType) {
    case 'heading':
      return textColors.heading;
    case 'muted':
      return textColors.muted;
    default:
      return textColors.body;
  }
}

/**
 * WCAG validation function
 */
export function validateWCAGContrast(
  foregroundColor: string,
  backgroundColor: string,
  level: 'AA' | 'AAA' = 'AA'
): { ratio: number; meetsAA: boolean; meetsAAA: boolean } {
  try {
    const validation = validateColorAccessibility(foregroundColor, backgroundColor);
    console.log('🔍 WCAG validation result:', {
      foreground: foregroundColor,
      background: backgroundColor,
      contrastRatio: validation.contrastRatio,
      isValid: validation.isValid,
      level: validation.level
    });
    
    return {
      ratio: validation.contrastRatio, // Fixed: use contrastRatio instead of contrast
      meetsAA: validation.contrastRatio >= 4.5,
      meetsAAA: validation.contrastRatio >= 7.0
    };
  } catch (error) {
    console.warn('WCAG validation failed:', error);
    return { ratio: 0, meetsAA: false, meetsAAA: false };
  }
}

/**
 * Get safe text colors for a background
 */
export function getSafeTextColorsForBackground(
  backgroundColor: string,
  requireWCAG: 'AA' | 'AAA' = 'AA',
  businessContext: BusinessColorContext = {}
): { heading: string; body: string; muted: string } {
  const enhancedColors = getEnhancedTextColors('neutral', backgroundColor, businessContext, { requireWCAG });
  
  return {
    heading: enhancedColors.heading,
    body: enhancedColors.body,
    muted: enhancedColors.muted
  };
}

/**
 * Check if background is light
 */
export function isLightBackground(backgroundColor: string): boolean {
  try {
    const analysis = analyzeBackground(backgroundColor);
    return analysis.isLight;
  } catch (error) {
    console.warn('Background analysis failed:', error);
    return true; // Default to light
  }
}

/**
 * Check if two colors have good contrast
 */
export function hasGoodContrast(
  foregroundColor: string,
  backgroundColor: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  return validateWCAGContrast(foregroundColor, backgroundColor, level);
}