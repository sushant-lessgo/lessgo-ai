// /app/edit/[token]/components/ui/colorCompatibilityLogic.ts
import type { ColorTokens, BackgroundSystem } from '@/types/core';

/**
 * Color compatibility validation result
 */
export interface ColorCompatibilityResult {
  isValid: boolean;
  score: number; // 0-100 compatibility score
  warnings: ColorCompatibilityWarning[];
  errors: ColorCompatibilityError[];
  suggestions: ColorCompatibilitySuggestion[];
  accessibility: AccessibilityCheck;
  performance: PerformanceCheck;
  brandAlignment: BrandAlignmentCheck;
}

/**
 * Color compatibility warning
 */
export interface ColorCompatibilityWarning {
  id: string;
  type: 'contrast' | 'harmony' | 'accessibility' | 'brand' | 'performance';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: string;
  fix?: string;
  autoFixable: boolean;
}

/**
 * Color compatibility error
 */
export interface ColorCompatibilityError {
  id: string;
  type: 'contrast' | 'accessibility' | 'format' | 'compatibility';
  message: string;
  details: string;
  fix: string;
  blocking: boolean;
}

/**
 * Color compatibility suggestion
 */
export interface ColorCompatibilitySuggestion {
  id: string;
  type: 'improvement' | 'alternative' | 'optimization';
  message: string;
  action?: string;
  value?: any;
}

/**
 * Accessibility analysis
 */
export interface AccessibilityCheck {
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA' | 'fail';
  colorBlindSafe: boolean;
  readabilityScore: number;
  issues: AccessibilityIssue[];
}

/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
  type: 'contrast' | 'color-blind' | 'readability';
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

/**
 * Performance analysis
 */
export interface PerformanceCheck {
  complexity: 'low' | 'medium' | 'high';
  renderCost: number;
  optimizations: string[];
  issues: PerformanceIssue[];
}

/**
 * Performance issue
 */
export interface PerformanceIssue {
  type: 'complexity' | 'size' | 'compatibility';
  message: string;
  impact: 'low' | 'medium' | 'high';
  fix?: string;
}

/**
 * Brand alignment analysis
 */
export interface BrandAlignmentCheck {
  alignmentScore: number;
  colorHarmony: number;
  consistencyScore: number;
  issues: BrandAlignmentIssue[];
}

/**
 * Brand alignment issue
 */
export interface BrandAlignmentIssue {
  type: 'color-mismatch' | 'harmony' | 'consistency';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

/**
 * Validate color tokens against background system
 */
export function validateColorCompatibility(
  colorTokens: ColorTokens,
  backgroundSystem: BackgroundSystem
): ColorCompatibilityResult {
  const warnings: ColorCompatibilityWarning[] = [];
  const errors: ColorCompatibilityError[] = [];
  const suggestions: ColorCompatibilitySuggestion[] = [];
  
  let score = 100;

  // Basic validation
  if (!colorTokens.ctaBg) {
    errors.push({
      id: 'missing-cta-bg',
      type: 'format',
      message: 'Primary CTA background color is required',
      details: 'The ctaBg property is missing or empty',
      fix: 'Set a valid background color for primary CTAs',
      blocking: true,
    });
    score -= 30;
  }

  if (!backgroundSystem) {
    errors.push({
      id: 'missing-background-system',
      type: 'compatibility',
      message: 'Background system is required for validation',
      details: 'Color validation requires a background system context',
      fix: 'Select a background system first',
      blocking: true,
    });
    score -= 40;
  }

  // Accessibility checks
  const accessibilityCheck = validateAccessibility(colorTokens, backgroundSystem);
  if (accessibilityCheck.wcagLevel === 'fail') {
    errors.push({
      id: 'accessibility-fail',
      type: 'accessibility',
      message: 'Fails WCAG accessibility standards',
      details: `Contrast ratio: ${accessibilityCheck.contrastRatio.toFixed(2)}`,
      fix: 'Increase color contrast or choose different colors',
      blocking: false,
    });
    score -= 25;
  } else if (accessibilityCheck.wcagLevel === 'AA') {
    suggestions.push({
      id: 'improve-accessibility',
      type: 'improvement',
      message: 'Consider AAA compliance for better accessibility',
      action: 'Increase contrast slightly',
    });
  }

  // Color harmony validation
  const harmonyCheck = validateColorHarmony(colorTokens, backgroundSystem);
  if (harmonyCheck.score < 60) {
    warnings.push({
      id: 'poor-harmony',
      type: 'harmony',
      severity: 'medium',
      message: 'Colors may not harmonize well together',
      details: `Harmony score: ${harmonyCheck.score}%`,
      fix: 'Choose colors closer to the base color family',
      autoFixable: true,
    });
    score -= 15;
  }

  // Brand consistency validation
  const brandCheck = validateBrandConsistency(colorTokens, backgroundSystem);
  if (brandCheck.consistencyScore < 70) {
    warnings.push({
      id: 'brand-inconsistency',
      type: 'brand',
      severity: 'low',
      message: 'Colors deviate from brand consistency',
      details: `Consistency score: ${brandCheck.consistencyScore}%`,
      fix: 'Align accent colors with brand colors',
      autoFixable: false,
    });
    score -= 10;
  }

  // Performance impact validation
  const performanceCheck = validatePerformance(colorTokens);
  if (performanceCheck.complexity === 'high') {
    warnings.push({
      id: 'high-complexity',
      type: 'performance',
      severity: 'low',
      message: 'Color complexity may impact rendering performance',
      details: 'Multiple gradients and complex color calculations detected',
      fix: 'Simplify color gradients or use solid colors',
      autoFixable: false,
    });
    score -= 5;
  }

  // Generate suggestions
  if (score > 80) {
    suggestions.push({
      id: 'excellent-colors',
      type: 'improvement',
      message: 'Excellent color choices! Consider minor optimizations',
      action: 'Fine-tune contrast for AAA compliance',
    });
  } else if (score > 60) {
    suggestions.push({
      id: 'good-colors',
      type: 'improvement',
      message: 'Good color selection with room for improvement',
      action: 'Address accessibility and harmony issues',
    });
  } else {
    suggestions.push({
      id: 'needs-improvement',
      type: 'alternative',
      message: 'Consider alternative color combinations',
      action: 'Try colors suggested by the compatibility checker',
    });
  }

  return {
    isValid: errors.length === 0,
    score: Math.max(0, Math.min(100, score)),
    warnings,
    errors,
    suggestions,
    accessibility: accessibilityCheck,
    performance: performanceCheck,
    brandAlignment: brandCheck,
  };
}

/**
 * Validate accessibility compliance
 */
function validateAccessibility(
  colorTokens: ColorTokens,
  backgroundSystem: BackgroundSystem | null
): AccessibilityCheck {
  const issues: AccessibilityIssue[] = [];
  
  // Mock contrast ratio calculation (would use actual color parsing in production)
  const contrastRatio = calculateMockContrastRatio(colorTokens.ctaBg, colorTokens.ctaText);
  
  let wcagLevel: 'AA' | 'AAA' | 'fail' = 'fail';
  if (contrastRatio >= 7) {
    wcagLevel = 'AAA';
  } else if (contrastRatio >= 4.5) {
    wcagLevel = 'AA';
  } else {
    issues.push({
      type: 'contrast',
      severity: 'error',
      message: 'Insufficient color contrast for accessibility',
      fix: 'Increase contrast between text and background colors',
    });
  }

  // Color blind safety check
  const colorBlindSafe = checkColorBlindSafety(colorTokens);
  if (!colorBlindSafe) {
    issues.push({
      type: 'color-blind',
      severity: 'warning',
      message: 'Colors may be difficult to distinguish for color-blind users',
      fix: 'Add visual patterns or adjust color choices',
    });
  }

  // Readability score
  const readabilityScore = calculateReadabilityScore(colorTokens, backgroundSystem);

  return {
    contrastRatio,
    wcagLevel,
    colorBlindSafe,
    readabilityScore,
    issues,
  };
}

/**
 * Validate color harmony
 */
function validateColorHarmony(
  colorTokens: ColorTokens,
  backgroundSystem: BackgroundSystem
): { score: number; relationship: string } {
  const accentColor = extractColorFromClass(colorTokens.accent);
  const baseColor = backgroundSystem.baseColor;
  
  // Mock harmony calculation based on color relationships
  const colorDistance = calculateColorDistance(accentColor, baseColor);
  
  let relationship = 'neutral';
  let score = 70; // Base score
  
  if (accentColor === baseColor) {
    relationship = 'monochromatic';
    score = 90;
  } else if (colorDistance < 2) {
    relationship = 'analogous';
    score = 85;
  } else if (colorDistance > 4) {
    relationship = 'complementary';
    score = 75;
  } else {
    relationship = 'triadic';
    score = 65;
  }
  
  return { score, relationship };
}

/**
 * Validate brand consistency
 */
function validateBrandConsistency(
  colorTokens: ColorTokens,
  backgroundSystem: BackgroundSystem
): BrandAlignmentCheck {
  const issues: BrandAlignmentIssue[] = [];
  
  // Check if accent color aligns with brand colors
  const accentColor = extractColorFromClass(colorTokens.accent);
  const brandColor = backgroundSystem.accentColor;
  
  let alignmentScore = 100;
  let colorHarmony = 90;
  let consistencyScore = 85;
  
  if (accentColor !== brandColor) {
    alignmentScore -= 20;
    issues.push({
      type: 'color-mismatch',
      message: 'Accent color differs from brand color',
      severity: 'medium',
      suggestion: `Consider using ${brandColor} for better brand alignment`,
    });
  }
  
  // Check consistency across different CTA types
  const primaryAccent = extractColorFromClass(colorTokens.ctaBg);
  const linkAccent = extractColorFromClass(colorTokens.link);
  
  if (primaryAccent !== linkAccent) {
    consistencyScore -= 15;
    issues.push({
      type: 'consistency',
      message: 'Interactive elements use different accent colors',
      severity: 'low',
      suggestion: 'Use consistent accent color for all interactive elements',
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
 * Validate performance impact
 */
function validatePerformance(colorTokens: ColorTokens): PerformanceCheck {
  const issues: PerformanceIssue[] = [];
  const optimizations: string[] = [];
  
  let complexity: 'low' | 'medium' | 'high' = 'low';
  let renderCost = 10; // Base cost
  
  // Check for gradient usage
  const hasGradients = Object.values(colorTokens).some(color => 
    typeof color === 'string' && color.includes('gradient')
  );
  
  if (hasGradients) {
    complexity = 'medium';
    renderCost += 20;
    optimizations.push('Consider using solid colors for better performance');
  }
  
  // Check for complex color calculations
  const complexColors = Object.values(colorTokens).filter(color => 
    typeof color === 'string' && (color.includes('/') || color.includes('rgba'))
  ).length;
  
  if (complexColors > 5) {
    complexity = 'high';
    renderCost += 30;
    issues.push({
      type: 'complexity',
      message: 'Many semi-transparent colors may impact performance',
      impact: 'medium',
      fix: 'Use solid colors where possible',
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
 * Helper functions
 */
function calculateMockContrastRatio(bgColor: string, textColor: string): number {
  // Mock calculation - in production would parse actual colors
  if (textColor.includes('white') && bgColor.includes('600')) return 5.2;
  if (textColor.includes('white') && bgColor.includes('700')) return 6.1;
  if (textColor.includes('900') && bgColor.includes('50')) return 8.3;
  return 4.6; // Default safe ratio
}

function checkColorBlindSafety(colorTokens: ColorTokens): boolean {
  // Mock check - would implement actual color blind simulation
  const redColors = Object.values(colorTokens).filter(color => 
    typeof color === 'string' && color.includes('red')
  ).length;
  const greenColors = Object.values(colorTokens).filter(color => 
    typeof color === 'string' && color.includes('green')
  ).length;
  
  // If both red and green are heavily used, may be problematic
  return !(redColors > 2 && greenColors > 2);
}

function calculateReadabilityScore(
  colorTokens: ColorTokens,
  backgroundSystem: BackgroundSystem | null
): number {
  // Mock calculation based on contrast and color choices
  let score = 75;
  
  if (backgroundSystem) {
    // Bonus for good background integration
    score += 15;
  }
  
  // Check text hierarchy contrast
  const hasGoodHierarchy = colorTokens.textPrimary !== colorTokens.textSecondary;
  if (hasGoodHierarchy) {
    score += 10;
  }
  
  return Math.min(100, score);
}

function extractColorFromClass(cssClass: string): string {
  if (!cssClass) return '';
  const match = cssClass.match(/(?:bg-|text-|border-)(\w+)-\d+/);
  return match ? match[1] : '';
}

function calculateColorDistance(color1: string, color2: string): number {
  // Mock color distance calculation
  const colorMap: Record<string, number> = {
    red: 0, orange: 1, yellow: 2, green: 3, 
    blue: 4, purple: 5, pink: 6, gray: 7
  };
  
  const pos1 = colorMap[color1] || 0;
  const pos2 = colorMap[color2] || 0;
  
  return Math.abs(pos1 - pos2);
}

/**
 * Get color suggestions based on compatibility analysis
 */
export function getColorSuggestions(
  currentTokens: ColorTokens,
  backgroundSystem: BackgroundSystem,
  validationResult: ColorCompatibilityResult
): Array<{
  accentColor: string;
  reason: string;
  preview: ColorTokens;
  improvement: string;
}> {
  const baseColor = backgroundSystem.baseColor;
  const suggestions = [];
  
  // If current colors are poor, suggest better alternatives
  if (validationResult.score < 70) {
    suggestions.push({
      accentColor: baseColor,
      reason: 'Monochromatic harmony with background',
      preview: { ...currentTokens, accent: `bg-${baseColor}-600` },
      improvement: 'Better brand consistency',
    });
    
    suggestions.push({
      accentColor: 'blue',
      reason: 'High contrast and accessibility',
      preview: { ...currentTokens, accent: 'bg-blue-600' },
      improvement: 'Improved readability',
    });
  }
  
  return suggestions;
}