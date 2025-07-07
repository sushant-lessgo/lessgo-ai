// /app/edit/[token]/components/ui/colorAccessibilityUtils.ts
import type { ColorTokens, BackgroundSystem } from '@/types/core';

export interface ContrastCheck {
  ratio: number;
  wcagLevel: 'AAA' | 'AA' | 'fail';
  isValid: boolean;
  recommendation?: string;
}

export interface AccessibilityAnalysis {
  overall: {
    score: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'F';
    passesWCAG: boolean;
  };
  issues: AccessibilityIssue[];
  recommendations: string[];
  contrastChecks: ContrastCheckResult[];
}

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'contrast' | 'color-blind' | 'readability' | 'consistency';
  message: string;
  element: string;
  fix?: string;
}

export interface ContrastCheckResult {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  wcagLevel: 'AAA' | 'AA' | 'fail';
  required: number;
  passes: boolean;
}

/**
 * Convert CSS color class to hex approximation for contrast calculation
 */
function cssClassToHex(cssClass: string): string {
  const colorMap: Record<string, string> = {
    // Grays
    'text-gray-900': '#111827',
    'text-gray-800': '#1f2937',
    'text-gray-700': '#374151',
    'text-gray-600': '#4b5563',
    'text-gray-500': '#6b7280',
    'text-gray-400': '#9ca3af',
    'text-gray-300': '#d1d5db',
    'text-white': '#ffffff',
    'text-black': '#000000',
    
    // Blues
    'bg-blue-50': '#eff6ff',
    'bg-blue-100': '#dbeafe',
    'bg-blue-200': '#bfdbfe',
    'bg-blue-300': '#93c5fd',
    'bg-blue-400': '#60a5fa',
    'bg-blue-500': '#3b82f6',
    'bg-blue-600': '#2563eb',
    'bg-blue-700': '#1d4ed8',
    'bg-blue-800': '#1e40af',
    'bg-blue-900': '#1e3a8a',
    'text-blue-600': '#2563eb',
    'text-blue-700': '#1d4ed8',
    
    // Purples
    'bg-purple-600': '#9333ea',
    'bg-purple-700': '#7c3aed',
    'text-purple-600': '#9333ea',
    
    // Greens
    'bg-green-600': '#16a34a',
    'bg-green-700': '#15803d',
    'text-green-600': '#16a34a',
    
    // Oranges
    'bg-orange-600': '#ea580c',
    'bg-orange-700': '#c2410c',
    'text-orange-600': '#ea580c',
    
    // Reds
    'bg-red-600': '#dc2626',
    'bg-red-700': '#b91c1c',
    'text-red-600': '#dc2626',
    
    // Common backgrounds
    'bg-white': '#ffffff',
    'bg-gray-50': '#f9fafb',
    'bg-gray-100': '#f3f4f6',
    'bg-gray-200': '#e5e7eb',
  };

  return colorMap[cssClass] || '#6b7280'; // Default to gray-500
}

/**
 * Calculate relative luminance for a hex color
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fgHex = cssClassToHex(foreground);
  const bgHex = cssClassToHex(background);
  
  const fgLum = getLuminance(fgHex);
  const bgLum = getLuminance(bgHex);
  
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG compliance for a contrast ratio
 */
export function checkWCAGCompliance(ratio: number, isLargeText = false): ContrastCheck {
  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;
  
  let wcagLevel: 'AAA' | 'AA' | 'fail';
  let recommendation: string | undefined;
  
  if (ratio >= aaaThreshold) {
    wcagLevel = 'AAA';
  } else if (ratio >= aaThreshold) {
    wcagLevel = 'AA';
  } else {
    wcagLevel = 'fail';
    recommendation = `Increase contrast ratio to at least ${aaThreshold}:1 for WCAG AA compliance`;
  }
  
  return {
    ratio,
    wcagLevel,
    isValid: wcagLevel !== 'fail',
    recommendation,
  };
}

/**
 * Analyze accessibility of entire color token system
 */
export function analyzeColorAccessibility(
  tokens: ColorTokens,
  backgroundSystem: BackgroundSystem | null
): AccessibilityAnalysis {
  const issues: AccessibilityIssue[] = [];
  const recommendations: string[] = [];
  const contrastChecks: ContrastCheckResult[] = [];

  if (!backgroundSystem) {
    return {
      overall: { score: 0, grade: 'F', passesWCAG: false },
      issues: [{ severity: 'error', type: 'consistency', message: 'Background system required', element: 'system' }],
      recommendations: ['Select a background system first'],
      contrastChecks: [],
    };
  }

  // Key contrast checks to perform
  const checks = [
    {
      element: 'Primary Text',
      foreground: tokens.textPrimary,
      background: 'bg-white', // Assuming white background for primary text
      isLargeText: false,
    },
    {
      element: 'Secondary Text',
      foreground: tokens.textSecondary,
      background: 'bg-white',
      isLargeText: false,
    },
    {
      element: 'Primary CTA',
      foreground: tokens.ctaText,
      background: tokens.ctaBg,
      isLargeText: false,
    },
    {
      element: 'Links',
      foreground: tokens.link,
      background: 'bg-white',
      isLargeText: false,
    },
    {
      element: 'Text on Dark',
      foreground: tokens.textOnDark,
      background: backgroundSystem.primary,
      isLargeText: false,
    },
  ];

  let totalScore = 0;
  let validChecks = 0;

  checks.forEach(check => {
    const ratio = calculateContrastRatio(check.foreground, check.background);
    const compliance = checkWCAGCompliance(ratio, check.isLargeText);
    
    contrastChecks.push({
      element: check.element,
      foreground: check.foreground,
      background: check.background,
      ratio: compliance.ratio,
      wcagLevel: compliance.wcagLevel,
      required: check.isLargeText ? 3 : 4.5,
      passes: compliance.isValid,
    });

    if (compliance.isValid) {
      totalScore += compliance.wcagLevel === 'AAA' ? 100 : 85;
      validChecks++;
    } else {
      issues.push({
        severity: 'error',
        type: 'contrast',
        message: `${check.element} fails WCAG contrast requirements (${ratio.toFixed(2)}:1)`,
        element: check.element,
        fix: compliance.recommendation,
      });
    }
  });

  // Additional consistency checks
  if (tokens.ctaBg === tokens.ctaSecondary) {
    issues.push({
      severity: 'warning',
      type: 'consistency',
      message: 'Primary and secondary CTAs use the same color',
      element: 'CTA Buttons',
      fix: 'Use different colors for visual hierarchy',
    });
  }

  // Color blindness considerations
  const linkContrast = calculateContrastRatio(tokens.link, 'bg-white');
  if (linkContrast < 3) {
    issues.push({
      severity: 'warning',
      type: 'color-blind',
      message: 'Links may be difficult to distinguish for color-blind users',
      element: 'Links',
      fix: 'Consider adding underlines or increasing contrast',
    });
  }

  // Generate recommendations
  if (issues.length === 0) {
    recommendations.push('Excellent accessibility! All contrast requirements met.');
  } else {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical contrast issue${errorCount > 1 ? 's' : ''}`);
    }
    
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    if (warningCount > 0) {
      recommendations.push(`Consider addressing ${warningCount} accessibility warning${warningCount > 1 ? 's' : ''}`);
    }
  }

  // Calculate overall score
  const averageScore = validChecks > 0 ? totalScore / checks.length : 0;
  const grade = averageScore >= 95 ? 'A+' : averageScore >= 85 ? 'A' : averageScore >= 70 ? 'B' : averageScore >= 60 ? 'C' : 'F';
  const passesWCAG = issues.filter(i => i.severity === 'error').length === 0;

  return {
    overall: {
      score: Math.round(averageScore),
      grade,
      passesWCAG,
    },
    issues,
    recommendations,
    contrastChecks,
  };
}

/**
 * Get accessibility badge info for quick display
 */
export function getAccessibilityBadge(analysis: AccessibilityAnalysis): {
  color: string;
  label: string;
  icon: '✓' | '⚠' | '✗';
} {
  if (analysis.overall.passesWCAG) {
    return {
      color: 'bg-green-100 text-green-800',
      label: `WCAG ${analysis.overall.grade}`,
      icon: '✓',
    };
  }
  
  const errorCount = analysis.issues.filter(i => i.severity === 'error').length;
  if (errorCount > 0) {
    return {
      color: 'bg-red-100 text-red-800',
      label: `${errorCount} Error${errorCount > 1 ? 's' : ''}`,
      icon: '✗',
    };
  }
  
  return {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Warnings',
    icon: '⚠',
  };
}

/**
 * Suggest color improvements for accessibility
 */
export function suggestAccessibilityImprovements(
  tokens: ColorTokens,
  backgroundSystem: BackgroundSystem
): Array<{ element: string; current: string; suggested: string; reason: string }> {
  const suggestions: Array<{ element: string; current: string; suggested: string; reason: string }> = [];
  
  // Check text contrast and suggest improvements
  const textContrast = calculateContrastRatio(tokens.textPrimary, 'bg-white');
  if (textContrast < 4.5) {
    const baseColor = backgroundSystem.baseColor;
    suggestions.push({
      element: 'Primary Text',
      current: tokens.textPrimary,
      suggested: `text-${baseColor}-900`,
      reason: 'Increase contrast for WCAG AA compliance',
    });
  }
  
  const linkContrast = calculateContrastRatio(tokens.link, 'bg-white');
  if (linkContrast < 4.5) {
    suggestions.push({
      element: 'Links',
      current: tokens.link,
      suggested: tokens.link.replace(/\d+/, '700'),
      reason: 'Darker shade for better readability',
    });
  }
  
  return suggestions;
}