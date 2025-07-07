// /app/edit/[token]/components/ui/backgroundValidation.ts

import type {
  BackgroundSystem,
  BackgroundVariation,
  BrandColors,
  BackgroundSelectorMode,
  BackgroundValidationResult,
  BackgroundValidationWarning,
  BackgroundValidationError,
  BackgroundValidationSuggestion,
  BackgroundAccessibilityCheck,
  BackgroundAccessibilityIssue,
  BackgroundPerformanceCheck,
  BackgroundPerformanceIssue,
  BackgroundBrandAlignmentCheck,
  BackgroundBrandIssue,
  BackgroundValidationContext,
  ColorHarmonyInfo,
} from '@/types/core';

/**
 * Main validation function for background systems
 */
export function validateBackgroundSystem(
  background: BackgroundSystem,
  brandColors?: BrandColors | null,
  context?: BackgroundValidationContext
): BackgroundValidationResult {
  const warnings: BackgroundValidationWarning[] = [];
  const errors: BackgroundValidationError[] = [];
  const suggestions: BackgroundValidationSuggestion[] = [];

  try {
    // Accessibility validation
    const accessibility = validateAccessibility(background);
    if (accessibility.wcagLevel === 'fail') {
      errors.push({
        id: 'accessibility-fail',
        type: 'accessibility',
        message: 'Background fails WCAG accessibility standards',
        details: `Contrast ratio of ${accessibility.contrastRatio} is below minimum requirements`,
        fix: 'Choose a background with higher contrast or adjust text colors',
        blocking: true,
      });
    } else if (accessibility.wcagLevel === 'AA') {
      warnings.push({
        id: 'accessibility-warning',
        type: 'accessibility',
        severity: 'medium',
        message: 'Background meets AA but not AAA standards',
        details: 'Consider improving contrast for better accessibility',
        fix: 'Use darker text or lighter background',
        autoFixable: false,
      });
    }

    // Performance validation
    const performance = validatePerformance(background);
    if (performance.complexity === 'high') {
      warnings.push({
        id: 'performance-complexity',
        type: 'performance',
        severity: 'medium',
        message: 'Complex background may impact performance',
        details: 'Gradient or complex patterns can slow rendering',
        fix: 'Consider simpler background options',
        autoFixable: false,
      });
    }

    // Brand alignment validation
    let brandAlignment: BackgroundBrandAlignmentCheck = {
      alignmentScore: 100,
      colorHarmony: 100,
      consistencyScore: 100,
      issues: [],
    };

    if (brandColors) {
      brandAlignment = validateBrandAlignment(background, brandColors);
      if (brandAlignment.alignmentScore < 60) {
        warnings.push({
          id: 'brand-mismatch',
          type: 'brand',
          severity: 'high',
          message: 'Background may not align with brand colors',
          details: `Brand alignment score: ${brandAlignment.alignmentScore}%`,
          fix: 'Choose background that complements your brand colors',
          autoFixable: false,
        });
      }
    }

    // Generate suggestions
    if (accessibility.contrastRatio < 7) {
      suggestions.push({
        id: 'improve-contrast',
        type: 'improvement',
        message: 'Increase contrast for better readability',
        action: 'adjust-contrast',
        value: 7,
      });
    }

    if (performance.complexity === 'high') {
      suggestions.push({
        id: 'simplify-background',
        type: 'alternative',
        message: 'Use a simpler background for better performance',
        action: 'suggest-alternatives',
      });
    }

    // Calculate overall validation score
    let score = 100;
    score -= errors.length * 25;
    score -= warnings.filter(w => w.severity === 'high').length * 15;
    score -= warnings.filter(w => w.severity === 'medium').length * 10;
    score -= warnings.filter(w => w.severity === 'low').length * 5;
    score = Math.max(0, score);

    return {
      isValid: errors.length === 0,
      score,
      warnings,
      errors,
      suggestions,
      accessibility,
      performance,
      brandAlignment,
    };

  } catch (error) {
    console.error('Background validation error:', error);
    
    return {
      isValid: false,
      score: 0,
      warnings: [],
      errors: [{
        id: 'validation-error',
        type: 'format',
        message: 'Failed to validate background',
        details: 'An error occurred during validation',
        fix: 'Please try again or select a different background',
        blocking: true,
      }],
      suggestions: [],
      accessibility: {
        contrastRatio: 0,
        wcagLevel: 'fail',
        colorBlindSafe: false,
        readabilityScore: 0,
        issues: [],
      },
      performance: {
        complexity: 'high',
        renderCost: 100,
        optimizations: [],
        issues: [],
      },
      brandAlignment: {
        alignmentScore: 0,
        colorHarmony: 0,
        consistencyScore: 0,
        issues: [],
      },
    };
  }
}

/**
 * Validate accessibility aspects of background
 */
function validateAccessibility(background: BackgroundSystem): BackgroundAccessibilityCheck {
  const issues: BackgroundAccessibilityIssue[] = [];
  
  // Calculate contrast ratio (simplified - would use actual color analysis)
  const contrastRatio = calculateContrastRatio(background.primary);
  
  let wcagLevel: 'AA' | 'AAA' | 'fail' = 'fail';
  if (contrastRatio >= 7) wcagLevel = 'AAA';
  else if (contrastRatio >= 4.5) wcagLevel = 'AA';

  // Check color blindness compatibility
  const colorBlindSafe = checkColorBlindCompatibility(background);
  if (!colorBlindSafe) {
    issues.push({
      type: 'color-blind',
      severity: 'warning',
      message: 'Background may be difficult for color-blind users',
      fix: 'Ensure sufficient contrast and avoid problematic color combinations',
    });
  }

  // Calculate readability score
  const readabilityScore = calculateReadabilityScore(background);
  if (readabilityScore < 70) {
    issues.push({
      type: 'readability',
      severity: readabilityScore < 50 ? 'error' : 'warning',
      message: 'Text may be difficult to read on this background',
      fix: 'Increase contrast or use different text colors',
    });
  }

  return {
    contrastRatio,
    wcagLevel,
    colorBlindSafe,
    readabilityScore,
    issues,
  };
}

/**
 * Validate performance aspects of background
 */
function validatePerformance(background: BackgroundSystem): BackgroundPerformanceCheck {
  const issues: BackgroundPerformanceIssue[] = [];
  const optimizations: string[] = [];
  
  // Analyze complexity
  let complexity: 'low' | 'medium' | 'high' = 'low';
  let renderCost = 10;

  if (background.primary.includes('gradient')) {
    complexity = 'medium';
    renderCost += 20;
    optimizations.push('Consider solid colors for better performance');
  }

  if (background.primary.includes('radial-gradient') || background.primary.includes('blur')) {
    complexity = 'high';
    renderCost += 40;
    issues.push({
      type: 'complexity',
      message: 'Complex gradients and effects impact performance',
      impact: 'medium',
      fix: 'Use simpler background patterns',
    });
  }

  if (background.primary.includes('backdrop-blur')) {
    renderCost += 30;
    issues.push({
      type: 'compatibility',
      message: 'Backdrop blur may not be supported in all browsers',
      impact: 'low',
      fix: 'Provide fallback backgrounds',
    });
  }

  return {
    complexity,
    renderCost,
    optimizations,
    issues,
  };
}

/**
 * Validate brand alignment
 */
function validateBrandAlignment(background: BackgroundSystem, brandColors: BrandColors): BackgroundBrandAlignmentCheck {
  const issues: BackgroundBrandIssue[] = [];
  
  // Extract colors and calculate alignment
  const brandPrimaryColor = extractColorInfo(brandColors.primary);
  const backgroundBaseColor = background.baseColor;
  
  // Color harmony score
  const colorHarmony = calculateColorHarmony(brandPrimaryColor.family, backgroundBaseColor);
  
  // Consistency score
  const consistencyScore = calculateConsistencyScore(background, brandColors);
  
  // Overall alignment score
  const alignmentScore = Math.round((colorHarmony + consistencyScore) / 2);

  if (colorHarmony < 60) {
    issues.push({
      type: 'harmony',
      message: 'Background color does not harmonize well with brand colors',
      severity: 'medium',
      suggestion: 'Choose backgrounds with complementary or analogous colors',
    });
  }

  if (consistencyScore < 50) {
    issues.push({
      type: 'consistency',
      message: 'Background is inconsistent with brand identity',
      severity: 'high',
      suggestion: 'Select backgrounds that reflect your brand personality',
    });
  }

  return {
    alignmentScore,
    colorHarmony,
    consistencyScore,
    issues,
  };
}

/**
 * Calculate contrast ratio (simplified implementation)
 */
function calculateContrastRatio(backgroundClass: string): number {
  // Simplified contrast calculation based on background class
  if (backgroundClass.includes('gradient')) {
    if (backgroundClass.includes('from-blue-500')) return 4.8;
    if (backgroundClass.includes('from-purple-500')) return 5.2;
    if (backgroundClass.includes('from-green-500')) return 4.9;
    return 4.5;
  }
  
  if (backgroundClass.includes('bg-white')) return 12;
  if (backgroundClass.includes('bg-gray-50')) return 10;
  if (backgroundClass.includes('bg-gray-100')) return 8;
  
  // Default for unknown backgrounds
  return 4.5;
}

/**
 * Check color blind compatibility
 */
function checkColorBlindCompatibility(background: BackgroundSystem): boolean {
  // Simplified check - avoid problematic red/green combinations
  const problematicCombinations = [
    ['red', 'green'],
    ['orange', 'green'],
  ];
  
  return !problematicCombinations.some(([color1, color2]) => 
    (background.baseColor === color1 && background.accentColor === color2) ||
    (background.baseColor === color2 && background.accentColor === color1)
  );
}

/**
 * Calculate readability score
 */
function calculateReadabilityScore(background: BackgroundSystem): number {
  let score = 70; // Base score
  
  // Bonus for high contrast backgrounds
  if (background.primary.includes('white') || background.primary.includes('50')) {
    score += 20;
  }
  
  // Penalty for complex gradients
  if (background.primary.includes('gradient') && background.primary.includes('blur')) {
    score -= 30;
  }
  
  // Bonus for neutral backgrounds
  if (['gray', 'slate', 'zinc'].includes(background.baseColor)) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Extract color information from hex
 */
function extractColorInfo(hex: string): { family: string; lightness: number } {
  try {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    const [h, s, l] = rgbToHsl(r, g, b);
    
    let family = 'blue'; // default
    if (h >= 345 || h < 15) family = 'red';
    else if (h >= 15 && h < 45) family = 'orange';
    else if (h >= 45 && h < 75) family = 'yellow';
    else if (h >= 75 && h < 105) family = 'green';
    else if (h >= 195 && h < 255) family = 'blue';
    else if (h >= 255 && h < 315) family = 'purple';
    
    return { family, lightness: l };
  } catch {
    return { family: 'blue', lightness: 0.5 };
  }
}

/**
 * Calculate color harmony between brand and background
 */
function calculateColorHarmony(brandFamily: string, backgroundFamily: string): number {
  const harmonies: Record<string, string[]> = {
    red: ['orange', 'pink', 'purple'],
    orange: ['red', 'yellow', 'amber'],
    yellow: ['orange', 'green', 'amber'],
    green: ['yellow', 'teal', 'emerald'],
    blue: ['teal', 'purple', 'indigo'],
    purple: ['blue', 'pink', 'red'],
    pink: ['purple', 'red', 'rose'],
  };
  
  if (brandFamily === backgroundFamily) return 100;
  if (harmonies[brandFamily]?.includes(backgroundFamily)) return 85;
  if (['gray', 'slate', 'zinc'].includes(backgroundFamily)) return 75; // Neutrals
  
  return 40; // Poor harmony
}

/**
 * Calculate consistency score
 */
function calculateConsistencyScore(background: BackgroundSystem, brandColors: BrandColors): number {
  let score = 50; // Base score
  
  // Bonus for matching base colors
  const brandFamily = extractColorInfo(brandColors.primary).family;
  if (background.baseColor === brandFamily) {
    score += 30;
  }
  
  // Bonus for professional archetype selection (inferred from class names)
  if (background.primary.includes('gradient-to') && !background.primary.includes('radical')) {
    score += 20;
  }
  
  return Math.min(100, score);
}

/**
 * RGB to HSL conversion utility
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }

    h /= 6;
  }

  return [h * 360, s, l];
}

export interface ValidationContext {
  mode?: 'generated' | 'brand' | 'custom';
  targetAudience?: string;
  sectionTypes?: string[];
  performanceRequirements?: 'low' | 'medium' | 'high';
}

/**
 * Validate a specific background variation
 */
export function validateBackgroundVariation(
  variation: BackgroundVariation,
  brandColors?: BrandColors | null,
  context?: BackgroundValidationContext
): BackgroundValidationResult {
  // Convert variation to background system for validation
  const background: BackgroundSystem = {
    primary: variation.tailwindClass,
    secondary: `bg-${variation.baseColor}-50`,
    neutral: 'bg-white',
    divider: `bg-${variation.baseColor}-100/50`,
    baseColor: variation.baseColor,
    accentColor: variation.baseColor,
    accentCSS: `bg-${variation.baseColor}-600`,
  };

  return validateBackgroundSystem(background, brandColors, context);
}