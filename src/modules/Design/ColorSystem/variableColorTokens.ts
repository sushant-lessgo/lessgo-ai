// Variable Color Token Generator - Enhanced version of colorTokens.ts
// Generates comprehensive color token systems using CSS variables

import { 
  getSmartTextColor,
  validateWCAGContrast,
  getSafeTextColorsForBackground,
  isLightBackground,
  hasGoodContrast
} from '@/utils/improvedTextColors';
import { generateAccentCandidates } from '@/utils/colorHarmony';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { calculateLuminance, parseColor } from '@/utils/colorUtils';
import type { BackgroundSystem } from './colorTokens';
import type { BusinessContext } from '@/types/core';

// Enhanced types for variable-based color system
export interface VariableColorSystem {
  backgrounds: {
    primary: CSSVariableSet;
    secondary: CSSVariableSet;
    neutral: CSSVariableSet;
    divider: CSSVariableSet;
  };
  accents: {
    primary: CSSVariableSet;
    secondary: CSSVariableSet;
  };
  text: {
    onLight: TextColorSet;
    onDark: TextColorSet;
    onAccent: TextColorSet;
  };
  semantic: {
    success: CSSVariableSet;
    warning: CSSVariableSet;
    error: CSSVariableSet;
    info: CSSVariableSet;
  };
  effects: {
    blur: Record<string, string>;
    opacity: Record<string, string>;
  };
}

export interface CSSVariableSet {
  base: string;
  hover?: string;
  active?: string;
  border?: string;
  text?: string;
  variables: Record<string, string>;
}

export interface TextColorSet {
  primary: string;
  secondary: string;
  muted: string;
  variables: Record<string, string>;
}

export interface VariableColorTokens {
  // CSS Variable names (for className usage)
  ctaBg: string;
  ctaHover: string;
  ctaActive: string;
  ctaText: string;
  ctaBorder: string;
  
  // Text colors (adaptive)
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Links & interactive
  link: string;
  linkHover: string;
  
  // Form elements
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  inputText: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Background references
  sectionBgPrimary: string;
  sectionBgSecondary: string;
  sectionBgNeutral: string;
  sectionBgDivider: string;
  
  // CSS Variables object (for injection)
  cssVariables: Record<string, string>;
}

/**
 * Generate variable-based color system from background system
 */
export function generateVariableColorSystem(
  backgroundSystem: BackgroundSystem | Record<string, string>,
  businessContext?: BusinessContext
): VariableColorSystem {
  // Handle both old and new background system formats
  const normalizedBg = normalizeBackgroundSystem(backgroundSystem);
  
  // Extract dominant colors from backgrounds
  const extractedColors = extractColorsFromBackgroundSystem(normalizedBg);
  
  // Generate smart accent system
  const accentSystem = generateSmartAccentSystem(
    extractedColors.dominantColor,
    businessContext || { industry: 'tech', tone: 'professional' }
  );
  
  // Generate adaptive text system
  const textSystem = generateAdaptiveTextSystem(extractedColors, accentSystem);
  
  // Generate semantic colors
  const semanticSystem = generateSemanticColorSystem(accentSystem.primary.base);
  
  return {
    backgrounds: {
      primary: createVariableSet(extractedColors.primary, 'bg-primary'),
      secondary: createVariableSet(extractedColors.secondary, 'bg-secondary'),
      neutral: createVariableSet(extractedColors.neutral, 'bg-neutral'),
      divider: createVariableSet(extractedColors.divider, 'bg-divider'),
    },
    accents: {
      primary: accentSystem.primary,
      secondary: accentSystem.secondary,
    },
    text: textSystem,
    semantic: semanticSystem,
    effects: {
      blur: {
        '--blur-subtle': '2px',
        '--blur-medium': '8px',
        '--blur-strong': '16px',
        '--blur-extreme': '160px',
      },
      opacity: {
        '--opacity-10': '0.1',
        '--opacity-20': '0.2',
        '--opacity-30': '0.3',
        '--opacity-50': '0.5',
        '--opacity-70': '0.7',
        '--opacity-80': '0.8',
        '--opacity-90': '0.9',
      },
    },
  };
}

/**
 * Generate variable-based color tokens for components
 */
export function generateVariableColorTokens(
  variableSystem: VariableColorSystem,
  sectionBackground?: string
): VariableColorTokens {
  // Determine appropriate text colors based on section background
  const textColors = determineAdaptiveTextColors(variableSystem, sectionBackground);
  
  const cssVariables: Record<string, string> = {
    // Collect all CSS variables from the system
    ...variableSystem.backgrounds.primary.variables,
    ...variableSystem.backgrounds.secondary.variables,
    ...variableSystem.backgrounds.neutral.variables,
    ...variableSystem.backgrounds.divider.variables,
    ...variableSystem.accents.primary.variables,
    ...variableSystem.accents.secondary.variables,
    ...textColors.onLight.variables,
    ...textColors.onDark.variables,
    ...textColors.onAccent.variables,
    ...variableSystem.semantic.success.variables,
    ...variableSystem.semantic.warning.variables,
    ...variableSystem.semantic.error.variables,
    ...variableSystem.semantic.info.variables,
    ...variableSystem.effects.blur,
    ...variableSystem.effects.opacity,
  };
  
  return {
    // Interactive elements
    ctaBg: 'var(--accent-primary)',
    ctaHover: 'var(--accent-primary-hover)',
    ctaActive: 'var(--accent-primary-active)',
    ctaText: 'var(--accent-primary-text)',
    ctaBorder: 'var(--accent-primary-border)',
    
    // Adaptive text colors
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    
    // Links
    link: 'var(--accent-primary)',
    linkHover: 'var(--accent-primary-hover)',
    
    // Forms
    inputBg: 'var(--bg-neutral-base)',
    inputBorder: 'var(--text-muted)',
    inputFocus: 'var(--accent-primary)',
    inputText: 'var(--text-primary)',
    
    // Status
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    
    // Backgrounds
    sectionBgPrimary: 'var(--bg-primary-pattern)',
    sectionBgSecondary: 'var(--bg-secondary-pattern)',
    sectionBgNeutral: 'var(--bg-neutral-pattern)',
    sectionBgDivider: 'var(--bg-divider-pattern)',
    
    cssVariables,
  };
}

/**
 * Legacy compatibility function - converts old colorTokens to variable-based
 */
export function generateVariableColorTokensFromLegacy({
  baseColor = "gray",
  accentColor = "purple",
  accentCSS,
  sectionBackgrounds = {},
  storedTextColors,
  businessContext
}: {
  baseColor?: string;
  accentColor?: string;
  accentCSS?: string;
  sectionBackgrounds?: any;
  storedTextColors?: any;
  businessContext?: BusinessContext;
}): VariableColorTokens {
  // Convert legacy parameters to variable system
  const mockBackgroundSystem = {
    primary: `bg-gradient-to-r from-${baseColor}-500 to-${baseColor}-600`,
    secondary: `bg-${baseColor}-50`,
    neutral: 'bg-white',
    divider: 'bg-gray-100/50',
    baseColor,
    accentColor,
    accentCSS: accentCSS || `bg-${accentColor}-600`
  };
  
  const variableSystem = generateVariableColorSystem(mockBackgroundSystem, businessContext);
  return generateVariableColorTokens(variableSystem);
}

/**
 * Apply custom color overrides to variable system
 */
export function applyCustomColorOverrides(
  variableSystem: VariableColorSystem,
  customColors: Record<string, string>
): VariableColorSystem {
  const updatedSystem = JSON.parse(JSON.stringify(variableSystem)); // Deep clone
  
  // Apply custom overrides to appropriate sections
  Object.entries(customColors).forEach(([variableName, colorValue]) => {
    if (variableName.startsWith('--bg-primary')) {
      updatedSystem.backgrounds.primary.variables[variableName] = colorValue;
    } else if (variableName.startsWith('--bg-secondary')) {
      updatedSystem.backgrounds.secondary.variables[variableName] = colorValue;
    } else if (variableName.startsWith('--accent-primary')) {
      updatedSystem.accents.primary.variables[variableName] = colorValue;
      updatedSystem.accents.primary.base = colorValue;
    } else if (variableName.startsWith('--text-')) {
      // Update text colors
      if (updatedSystem.text.onLight.variables[variableName]) {
        updatedSystem.text.onLight.variables[variableName] = colorValue;
      }
    }
    // Add to all variables for CSS injection
    Object.values(updatedSystem.backgrounds).forEach(bg => {
      if (bg.variables[variableName] !== undefined) {
        bg.variables[variableName] = colorValue;
      }
    });
  });
  
  return updatedSystem;
}

/**
 * Get CSS variable definitions as string
 */
export function getCSSVariableDefinitions(variableSystem: VariableColorSystem): string {
  const allVariables: Record<string, string> = {};
  
  // Collect all variables
  Object.values(variableSystem.backgrounds).forEach(bg => {
    Object.assign(allVariables, bg.variables);
  });
  Object.values(variableSystem.accents).forEach(accent => {
    Object.assign(allVariables, accent.variables);
  });
  Object.values(variableSystem.text).forEach(text => {
    Object.assign(allVariables, text.variables);
  });
  Object.values(variableSystem.semantic).forEach(semantic => {
    Object.assign(allVariables, semantic.variables);
  });
  Object.assign(allVariables, variableSystem.effects.blur);
  Object.assign(allVariables, variableSystem.effects.opacity);
  
  return Object.entries(allVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

// Private helper functions

function normalizeBackgroundSystem(backgroundSystem: any): {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
} {
  if (backgroundSystem.sectionBackgrounds) {
    return backgroundSystem.sectionBackgrounds;
  }
  
  return {
    primary: backgroundSystem.primary || 'bg-blue-500',
    secondary: backgroundSystem.secondary || 'bg-blue-50',
    neutral: backgroundSystem.neutral || 'bg-white',
    divider: backgroundSystem.divider || 'bg-gray-100'
  };
}

function extractColorsFromBackgroundSystem(backgrounds: any): {
  dominantColor: string;
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
} {
  // Extract actual color values from Tailwind classes or CSS
  const extractColor = (bgClass: string): string => {
    // Handle hex colors
    const hexMatch = bgClass.match(/#([0-9A-Fa-f]{6})/);
    if (hexMatch) return hexMatch[0];
    
    // Handle Tailwind colors - convert to approximate hex
    const tailwindMatch = bgClass.match(/(?:from|bg)-([a-z]+)-(\d+)/);
    if (tailwindMatch) {
      const [, family, shade] = tailwindMatch;
      return tailwindColorToHex(`${family}-${shade}`);
    }
    
    // Default colors
    return '#3b82f6'; // blue-500
  };
  
  const primaryColor = extractColor(backgrounds.primary);
  
  return {
    dominantColor: primaryColor,
    primary: primaryColor,
    secondary: extractColor(backgrounds.secondary),
    neutral: extractColor(backgrounds.neutral),
    divider: extractColor(backgrounds.divider),
  };
}

function generateSmartAccentSystem(
  dominantColor: string,
  businessContext: BusinessContext
): {
  primary: CSSVariableSet;
  secondary: CSSVariableSet;
} {
  // Use existing color harmony system
  const accentCandidates = generateAccentCandidates(dominantColor, businessContext);
  const primaryAccent = accentCandidates[0]?.hex || dominantColor;
  const secondaryAccent = accentCandidates[1]?.hex || adjustColorBrightness(primaryAccent, 30);
  
  return {
    primary: {
      base: primaryAccent,
      hover: adjustColorBrightness(primaryAccent, -10),
      active: adjustColorBrightness(primaryAccent, -20),
      border: primaryAccent,
      text: getContrastingColor(primaryAccent),
      variables: {
        '--accent-primary': primaryAccent,
        '--accent-primary-hover': adjustColorBrightness(primaryAccent, -10),
        '--accent-primary-active': adjustColorBrightness(primaryAccent, -20),
        '--accent-primary-border': primaryAccent,
        '--accent-primary-text': getContrastingColor(primaryAccent),
      }
    },
    secondary: {
      base: secondaryAccent,
      hover: adjustColorBrightness(secondaryAccent, -10),
      active: adjustColorBrightness(secondaryAccent, -20),
      border: secondaryAccent,
      text: getContrastingColor(secondaryAccent),
      variables: {
        '--accent-secondary': secondaryAccent,
        '--accent-secondary-hover': adjustColorBrightness(secondaryAccent, -10),
        '--accent-secondary-active': adjustColorBrightness(secondaryAccent, -20),
        '--accent-secondary-border': secondaryAccent,
        '--accent-secondary-text': getContrastingColor(secondaryAccent),
      }
    }
  };
}

function generateAdaptiveTextSystem(
  extractedColors: any,
  accentSystem: any
): {
  onLight: TextColorSet;
  onDark: TextColorSet;
  onAccent: TextColorSet;
} {
  return {
    onLight: {
      primary: '#1f2937',
      secondary: '#6b7280',
      muted: '#9ca3af',
      variables: {
        '--text-primary': '#1f2937',
        '--text-secondary': '#6b7280',
        '--text-muted': '#9ca3af',
      }
    },
    onDark: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      muted: '#9ca3af',
      variables: {
        '--text-primary-dark': '#f9fafb',
        '--text-secondary-dark': '#d1d5db',
        '--text-muted-dark': '#9ca3af',
      }
    },
    onAccent: {
      primary: getContrastingColor(accentSystem.primary.base),
      secondary: adjustOpacity(getContrastingColor(accentSystem.primary.base), 0.8),
      muted: adjustOpacity(getContrastingColor(accentSystem.primary.base), 0.6),
      variables: {
        '--text-on-accent': getContrastingColor(accentSystem.primary.base),
        '--text-on-accent-muted': adjustOpacity(getContrastingColor(accentSystem.primary.base), 0.8),
      }
    }
  };
}

function generateSemanticColorSystem(primaryAccent: string): {
  success: CSSVariableSet;
  warning: CSSVariableSet;
  error: CSSVariableSet;
  info: CSSVariableSet;
} {
  return {
    success: {
      base: '#10b981',
      hover: '#059669',
      text: '#065f46',
      variables: {
        '--color-success': '#10b981',
        '--color-success-hover': '#059669',
        '--color-success-bg': '#d1fae5',
        '--color-success-text': '#065f46',
      }
    },
    warning: {
      base: '#f59e0b',
      hover: '#d97706',
      text: '#92400e',
      variables: {
        '--color-warning': '#f59e0b',
        '--color-warning-hover': '#d97706',
        '--color-warning-bg': '#fef3c7',
        '--color-warning-text': '#92400e',
      }
    },
    error: {
      base: '#ef4444',
      hover: '#dc2626',
      text: '#991b1b',
      variables: {
        '--color-error': '#ef4444',
        '--color-error-hover': '#dc2626',
        '--color-error-bg': '#fee2e2',
        '--color-error-text': '#991b1b',
      }
    },
    info: {
      base: primaryAccent,
      hover: adjustColorBrightness(primaryAccent, -10),
      text: getContrastingColor(primaryAccent),
      variables: {
        '--color-info': primaryAccent,
        '--color-info-hover': adjustColorBrightness(primaryAccent, -10),
        '--color-info-bg': adjustOpacity(primaryAccent, 0.1),
        '--color-info-text': getContrastingColor(primaryAccent),
      }
    }
  };
}

function createVariableSet(color: string, prefix: string): CSSVariableSet {
  const base = color;
  const hover = adjustColorBrightness(color, -5);
  const text = getContrastingColor(color);
  
  return {
    base,
    hover,
    text,
    variables: {
      [`--${prefix}-base`]: base,
      [`--${prefix}-hover`]: hover,
      [`--${prefix}-text`]: text,
    }
  };
}

function determineAdaptiveTextColors(
  variableSystem: VariableColorSystem,
  sectionBackground?: string
): {
  onLight: TextColorSet;
  onDark: TextColorSet;
  onAccent: TextColorSet;
} {
  // For now, return the existing text system
  // In the future, this could analyze the section background and return appropriate text colors
  return variableSystem.text;
}

// Utility functions
function tailwindColorToHex(tailwindColor: string): string {
  const colorMap: Record<string, string> = {
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'green-500': '#22c55e',
    'red-500': '#ef4444',
    'gray-500': '#6b7280',
    'gray-100': '#f3f4f6',
  };
  
  return colorMap[tailwindColor] || '#3b82f6';
}

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

function getContrastingColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function adjustOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}