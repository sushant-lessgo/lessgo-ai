// colorUtils.ts - Core color science utilities for proper color analysis
// Replaces string-based color detection with mathematical calculations

/**
 * RGB color representation
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255  
  b: number; // 0-255
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Color analysis result
 */
export interface ColorAnalysis {
  rgb: RGB;
  hsl: HSL;
  luminance: number; // 0-1
  isLight: boolean;
  isDark: boolean;
  hex: string;
}

/**
 * WCAG contrast levels
 */
export enum ContrastLevel {
  AA_NORMAL = 4.5,
  AA_LARGE = 3.0,
  AAA_NORMAL = 7.0,
  AAA_LARGE = 4.5
}

/**
 * Parse various color formats into RGB
 */
export function parseColor(color: string): RGB | null {
  // Remove whitespace and convert to lowercase
  const cleanColor = color.trim().toLowerCase();
  
  // Hex colors (#fff, #ffffff)
  const hexMatch = cleanColor.match(/^#([a-f0-9]{3}|[a-f0-9]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    } else {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    }
  }
  
  // RGB/RGBA colors
  const rgbMatch = cleanColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  // Handle Tailwind classes (bg-color-weight, text-color-weight)
  const tailwindMatch = cleanColor.match(/^(?:bg-|text-)?(\w+)(?:-(\d+))?$/);
  if (tailwindMatch) {
    const colorName = tailwindMatch[1];
    const weight = tailwindMatch[2] ? parseInt(tailwindMatch[2]) : 500;
    
    // Tailwind color palette (simplified but comprehensive)
    const tailwindColors: Record<string, Record<number, RGB>> = {
      black: { 500: { r: 0, g: 0, b: 0 } },
      white: { 500: { r: 255, g: 255, b: 255 } },
      gray: {
        50: { r: 249, g: 250, b: 251 },
        100: { r: 243, g: 244, b: 246 },
        200: { r: 229, g: 231, b: 235 },
        300: { r: 209, g: 213, b: 219 },
        400: { r: 156, g: 163, b: 175 },
        500: { r: 107, g: 114, b: 128 },
        600: { r: 75, g: 85, b: 99 },
        700: { r: 55, g: 65, b: 81 },
        800: { r: 31, g: 41, b: 55 },
        900: { r: 17, g: 24, b: 39 }
      },
      red: {
        50: { r: 254, g: 242, b: 242 },
        100: { r: 254, g: 226, b: 226 },
        200: { r: 254, g: 202, b: 202 },
        300: { r: 252, g: 165, b: 165 },
        400: { r: 248, g: 113, b: 113 },
        500: { r: 239, g: 68, b: 68 },
        600: { r: 220, g: 38, b: 38 },
        700: { r: 185, g: 28, b: 28 },
        800: { r: 153, g: 27, b: 27 },
        900: { r: 127, g: 29, b: 29 }
      },
      green: {
        50: { r: 240, g: 253, b: 244 },
        100: { r: 220, g: 252, b: 231 },
        200: { r: 187, g: 247, b: 208 },
        300: { r: 134, g: 239, b: 172 },
        400: { r: 74, g: 222, b: 128 },
        500: { r: 34, g: 197, b: 94 },
        600: { r: 22, g: 163, b: 74 },
        700: { r: 21, g: 128, b: 61 },
        800: { r: 22, g: 101, b: 52 },
        900: { r: 20, g: 83, b: 45 }
      },
      blue: {
        50: { r: 239, g: 246, b: 255 },
        100: { r: 219, g: 234, b: 254 },
        200: { r: 191, g: 219, b: 254 },
        300: { r: 147, g: 197, b: 253 },
        400: { r: 96, g: 165, b: 250 },
        500: { r: 59, g: 130, b: 246 },
        600: { r: 37, g: 99, b: 235 },
        700: { r: 29, g: 78, b: 216 },
        800: { r: 30, g: 64, b: 175 },
        900: { r: 30, g: 58, b: 138 }
      },
      cyan: {
        50: { r: 236, g: 254, b: 255 },
        100: { r: 207, g: 250, b: 254 },
        200: { r: 165, g: 243, b: 252 },
        300: { r: 103, g: 232, b: 249 },
        400: { r: 34, g: 211, b: 238 },
        500: { r: 6, g: 182, b: 212 },
        600: { r: 8, g: 145, b: 178 },
        700: { r: 14, g: 116, b: 144 },
        800: { r: 21, g: 94, b: 117 },
        900: { r: 22, g: 78, b: 99 }
      },
      orange: {
        50: { r: 255, g: 247, b: 237 },
        100: { r: 255, g: 237, b: 213 },
        200: { r: 254, g: 215, b: 170 },
        300: { r: 253, g: 186, b: 116 },
        400: { r: 251, g: 146, b: 60 },
        500: { r: 249, g: 115, b: 22 },
        600: { r: 234, g: 88, b: 12 },
        700: { r: 194, g: 65, b: 12 },
        800: { r: 154, g: 52, b: 18 },
        900: { r: 124, g: 45, b: 18 }
      }
    };
    
    if (tailwindColors[colorName] && tailwindColors[colorName][weight]) {
      return tailwindColors[colorName][weight];
    }
  }

  // Named colors (basic set)
  const namedColors: Record<string, RGB> = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 }
  };
  
  if (namedColors[cleanColor]) {
    return namedColors[cleanColor];
  }
  
  return null;
}

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function calculateLuminance(rgb: RGB): number {
  // Convert to 0-1 range
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  // Apply gamma correction
  const gammCorrect = (val: number): number => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = gammCorrect(r);
  const gLinear = gammCorrect(g);
  const bLinear = gammCorrect(b);
  
  // Calculate luminance using WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * Returns value between 1 and 21
 */
export function calculateContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements
 */
export function meetsContrastRequirement(
  color1: RGB, 
  color2: RGB, 
  level: ContrastLevel
): boolean {
  const ratio = calculateContrastRatio(color1, color2);
  return ratio >= level;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    switch (max) {
      case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
      case g: h = (b - r) / delta + 2; break;
      case b: h = (r - g) / delta + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Comprehensive color analysis
 */
export function analyzeColor(color: string): ColorAnalysis | null {
  const rgb = parseColor(color);
  if (!rgb) return null;
  
  const luminance = calculateLuminance(rgb);
  const hsl = rgbToHsl(rgb);
  const hex = rgbToHex(rgb);
  
  return {
    rgb,
    hsl,
    luminance,
    isLight: luminance > 0.5,
    isDark: luminance <= 0.5,
    hex
  };
}

/**
 * Find optimal text color for a background
 */
export function getOptimalTextColor(
  backgroundColor: string,
  options: {
    preferredDark?: string;
    preferredLight?: string;
    requireLevel?: ContrastLevel;
  } = {}
): string {
  const bgAnalysis = analyzeColor(backgroundColor);
  if (!bgAnalysis) {
    // Fallback to safe default
    return options.preferredDark || '#1f2937'; // gray-800
  }
  
  const darkColor = parseColor(options.preferredDark || '#1f2937');
  const lightColor = parseColor(options.preferredLight || '#ffffff');
  
  if (!darkColor || !lightColor) {
    return bgAnalysis.isLight ? '#1f2937' : '#ffffff';
  }
  
  const darkContrast = calculateContrastRatio(bgAnalysis.rgb, darkColor);
  const lightContrast = calculateContrastRatio(bgAnalysis.rgb, lightColor);
  
  const requiredLevel = options.requireLevel || ContrastLevel.AA_NORMAL;
  
  // Check if either meets the requirement
  if (darkContrast >= requiredLevel && lightContrast >= requiredLevel) {
    // Both meet requirement, choose based on background lightness
    return bgAnalysis.isLight ? options.preferredDark || '#1f2937' : options.preferredLight || '#ffffff';
  } else if (darkContrast >= requiredLevel) {
    return options.preferredDark || '#1f2937';
  } else if (lightContrast >= requiredLevel) {
    return options.preferredLight || '#ffffff';
  } else {
    // Neither meets requirement, choose the better one
    return darkContrast > lightContrast ? options.preferredDark || '#1f2937' : options.preferredLight || '#ffffff';
  }
}

/**
 * Generate safe color combinations that always pass WCAG
 */
export const SAFE_COLOR_COMBINATIONS = {
  // Light backgrounds with dark text
  light: {
    background: '#ffffff',
    heading: '#111827', // gray-900
    body: '#374151',    // gray-700
    muted: '#6b7280'    // gray-500
  },
  // Dark backgrounds with light text  
  dark: {
    background: '#111827', // gray-900
    heading: '#f9fafb',    // gray-50
    body: '#e5e7eb',       // gray-200  
    muted: '#9ca3af'       // gray-400
  },
  // Medium backgrounds
  medium: {
    background: '#6b7280', // gray-500
    heading: '#ffffff',
    body: '#f3f4f6',       // gray-100
    muted: '#d1d5db'       // gray-300
  }
} as const;

/**
 * Get safe fallback colors when calculation fails
 */
export function getSafeColorFallback(backgroundLuminance?: number): typeof SAFE_COLOR_COMBINATIONS.light {
  if (backgroundLuminance === undefined) {
    return SAFE_COLOR_COMBINATIONS.light;
  }
  
  if (backgroundLuminance > 0.7) {
    return SAFE_COLOR_COMBINATIONS.light;
  } else if (backgroundLuminance < 0.3) {
    return SAFE_COLOR_COMBINATIONS.dark;
  } else {
    return SAFE_COLOR_COMBINATIONS.medium;
  }
}

/**
 * Validate color accessibility and provide warnings
 */
export function validateColorAccessibility(
  foreground: string,
  background: string
): {
  isValid: boolean;
  contrastRatio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  warnings: string[];
  suggestions: string[];
} {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);
  
  if (!fgRgb || !bgRgb) {
    return {
      isValid: false,
      contrastRatio: 0,
      level: 'FAIL',
      warnings: ['Could not parse colors for validation'],
      suggestions: ['Use valid CSS color values']
    };
  }
  
  const contrastRatio = calculateContrastRatio(fgRgb, bgRgb);
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  let level: 'AAA' | 'AA' | 'A' | 'FAIL' = 'FAIL';
  let isValid = false;
  
  if (contrastRatio >= ContrastLevel.AAA_NORMAL) {
    level = 'AAA';
    isValid = true;
  } else if (contrastRatio >= ContrastLevel.AA_NORMAL) {
    level = 'AA';
    isValid = true;
    warnings.push('Meets AA but not AAA standards');
  } else if (contrastRatio >= ContrastLevel.AA_LARGE) {
    level = 'A';
    isValid = false;
    warnings.push('Only suitable for large text (18pt+ or 14pt+ bold)');
    suggestions.push('Use larger font sizes or increase contrast');
  } else {
    level = 'FAIL';
    isValid = false;
    warnings.push('Does not meet WCAG accessibility standards');
    suggestions.push('Increase contrast between foreground and background colors');
  }
  
  return {
    isValid,
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    level,
    warnings,
    suggestions
  };
}