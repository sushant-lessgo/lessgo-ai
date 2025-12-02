// textContrastUtils.ts - Simple contrast checking utilities for text-background combinations
// MVP implementation for fixing purple-on-purple and similar visibility issues

/**
 * Determines if a text color would be readable on a given background
 * Uses simple heuristics for common Tailwind color combinations
 */
export function getReadableTextColor(backgroundColor: string, baseColor: string): string {
  // Extract color family from background
  const bgColorFamily = extractColorFamily(backgroundColor);
  
  if (bgColorFamily === baseColor) {
    // Same color family - use neutral high contrast
    return 'text-gray-900';
  }
  
  // Different color families - safe to use base color
  return `text-${baseColor}-900`;
}

/**
 * Gets appropriate editing indicator colors based on background type and actual background
 * Uses background-aware color selection for optimal contrast
 */
export function getEditingIndicatorColors(backgroundType: string, colorTokens: any, sectionBackground?: string) {
  const colors = {
    outline: '',
    glow: '',
    background: '',
    hover: ''
  };

  // Check if the actual background contains blue colors
  const hasBlueBackground = sectionBackground && (
    sectionBackground.includes('blue') || 
    sectionBackground.includes('sky') || 
    sectionBackground.includes('indigo') ||
    sectionBackground.includes('cyan')
  );

  // If we have a blue background, use orange indicators regardless of backgroundType
  if (hasBlueBackground) {
    colors.outline = '#f59e0b'; // amber-500
    colors.glow = 'rgba(245, 158, 11, 0.2)';
    colors.background = 'rgba(245, 158, 11, 0.1)';
    colors.hover = 'rgba(245, 158, 11, 0.05)';
    return colors;
  }

  switch (backgroundType) {
    case 'primary':
      // Light backgrounds - use blue indicators
      colors.outline = '#3b82f6'; // blue-500
      colors.glow = 'rgba(59, 130, 246, 0.1)';
      colors.background = 'rgba(59, 130, 246, 0.05)';
      colors.hover = 'rgba(59, 130, 246, 0.05)';
      break;
      
    case 'secondary':
      // Dark backgrounds - use light indicators
      colors.outline = '#f8fafc'; // slate-50
      colors.glow = 'rgba(248, 250, 252, 0.2)';
      colors.background = 'rgba(248, 250, 252, 0.1)';
      colors.hover = 'rgba(248, 250, 252, 0.05)';
      break;
      
    case 'neutral':
      // Blue/colored backgrounds - use orange indicators for contrast
      colors.outline = '#f59e0b'; // amber-500
      colors.glow = 'rgba(245, 158, 11, 0.2)';
      colors.background = 'rgba(245, 158, 11, 0.1)';
      colors.hover = 'rgba(245, 158, 11, 0.05)';
      break;
      
    default:
      // Fallback to blue
      colors.outline = '#3b82f6';
      colors.glow = 'rgba(59, 130, 246, 0.1)';
      colors.background = 'rgba(59, 130, 246, 0.05)';
      colors.hover = 'rgba(59, 130, 246, 0.05)';
  }

  return colors;
}

/**
 * Validates that text and background colors have good contrast
 * Returns false for problematic combinations like purple-on-purple
 */
export function validateTextBackgroundContrast(textColor: string, backgroundColor: string): boolean {
  const textFamily = extractColorFamily(textColor);
  const bgFamily = extractColorFamily(backgroundColor);
  
  // Same color family combinations are usually problematic
  if (textFamily && bgFamily && textFamily === bgFamily) {
    return false;
  }
  
  // Check for specific problematic combinations
  const problematicCombinations = [
    { text: 'purple', bg: 'purple' },
    { text: 'blue', bg: 'blue' },
    { text: 'green', bg: 'green' },
    { text: 'red', bg: 'red' },
    { text: 'amber', bg: 'amber' },
    { text: 'sky', bg: 'sky' },
    { text: 'cyan', bg: 'cyan' },
    { text: 'teal', bg: 'teal' },
    { text: 'indigo', bg: 'indigo' },
    { text: 'pink', bg: 'pink' },
    { text: 'rose', bg: 'rose' },
    { text: 'orange', bg: 'orange' },
    { text: 'lime', bg: 'lime' },
    { text: 'emerald', bg: 'emerald' },
    { text: 'violet', bg: 'violet' },
    { text: 'fuchsia', bg: 'fuchsia' }
  ];
  
  return !problematicCombinations.some(combo => 
    textColor.includes(combo.text) && backgroundColor.includes(combo.bg)
  );
}

/**
 * Extracts color family from Tailwind class string
 * E.g., "text-purple-900" -> "purple", "bg-blue-50" -> "blue"
 */
export function extractColorFamily(colorClass: string): string | null {
  const colorFamilies = [
    'purple', 'blue', 'green', 'red', 'amber', 'sky', 'cyan', 'teal', 
    'indigo', 'pink', 'rose', 'orange', 'lime', 'emerald', 'violet', 
    'fuchsia', 'yellow', 'slate', 'gray', 'zinc', 'neutral', 'stone'
  ];
  
  for (const family of colorFamilies) {
    if (colorClass.includes(family)) {
      return family;
    }
  }
  
  return null;
}

/**
 * Gets appropriate text colors for different background types
 * Provides safe, high-contrast alternatives
 */
export function getSafeTextColorsForBackground(backgroundType: string): {
  heading: string;
  body: string;
  muted: string;
} {
  const safeTextColors = {
    primary: {
      heading: 'text-white',
      body: 'text-gray-100', 
      muted: 'text-gray-300'
    },
    secondary: {
      heading: 'text-gray-900',  // Always high contrast
      body: 'text-gray-700',     // Always readable
      muted: 'text-gray-500'
    },
    neutral: {
      heading: 'text-gray-900',
      body: 'text-gray-700',
      muted: 'text-gray-500'
    },
    divider: {
      heading: 'text-gray-900',
      body: 'text-gray-700',
      muted: 'text-gray-500'
    }
  };
  
  return safeTextColors[backgroundType as keyof typeof safeTextColors] || safeTextColors.secondary;
}

/**
 * Checks if a background color is light or dark
 * Used for determining appropriate text colors
 */
export function isLightBackground(backgroundColor: string): boolean {
  const lightBackgrounds = [
    'white', 'gray-50', 'gray-100', 'slate-50', 'slate-100',
    'blue-50', 'blue-100', 'purple-50', 'purple-100',
    'green-50', 'green-100', 'red-50', 'red-100',
    'amber-50', 'amber-100', 'yellow-50', 'yellow-100',
    'sky-50', 'sky-100', 'cyan-50', 'cyan-100',
    'teal-50', 'teal-100', 'indigo-50', 'indigo-100',
    'pink-50', 'pink-100', 'rose-50', 'rose-100',
    'orange-50', 'orange-100', 'lime-50', 'lime-100',
    'emerald-50', 'emerald-100', 'violet-50', 'violet-100',
    'fuchsia-50', 'fuchsia-100'
  ];
  
  return lightBackgrounds.some(light => backgroundColor.includes(light));
}

/**
 * Generates accessible badge colors that contrast well with any background
 * Replaces problematic accent-based generation
 */
export function generateAccessibleBadgeColors(accentColor: string): string {
  // Premium badge colors with darker backgrounds and white text
  const premiumBadgeColors = {
    blue: 'bg-blue-600 text-white shadow-md',
    purple: 'bg-purple-600 text-white shadow-md',
    green: 'bg-green-600 text-white shadow-md',
    red: 'bg-red-600 text-white shadow-md',
    amber: 'bg-amber-600 text-white shadow-md',
    yellow: 'bg-yellow-600 text-white shadow-md',
    sky: 'bg-sky-600 text-white shadow-md',
    cyan: 'bg-cyan-600 text-white shadow-md',
    teal: 'bg-teal-600 text-white shadow-md',
    indigo: 'bg-indigo-600 text-white shadow-md',
    pink: 'bg-pink-600 text-white shadow-md',
    rose: 'bg-rose-600 text-white shadow-md',
    orange: 'bg-orange-600 text-white shadow-md',
    lime: 'bg-lime-600 text-white shadow-md',
    emerald: 'bg-emerald-600 text-white shadow-md',
    violet: 'bg-violet-600 text-white shadow-md',
    fuchsia: 'bg-fuchsia-600 text-white shadow-md'
  };

  return premiumBadgeColors[accentColor as keyof typeof premiumBadgeColors] || 'bg-slate-600 text-white shadow-md';
}

/**
 * Simple contrast ratio approximation for common Tailwind colors
 * Not as precise as full WCAG calculations but sufficient for MVP
 */
export function getSimpleContrastRatio(color1: string, color2: string): number {
  // Simplified luminance values for common Tailwind colors
  const colorLuminance = {
    'white': 1.0,
    'gray-50': 0.95,
    'gray-100': 0.85,
    'gray-200': 0.75,
    'gray-300': 0.65,
    'gray-400': 0.55,
    'gray-500': 0.45,
    'gray-600': 0.35,
    'gray-700': 0.25,
    'gray-800': 0.15,
    'gray-900': 0.05,
    'black': 0.0
  };
  
  // Extract luminance values
  const lum1 = getLuminanceFromColor(color1, colorLuminance);
  const lum2 = getLuminanceFromColor(color2, colorLuminance);
  
  // Calculate contrast ratio
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Helper function to get luminance from color string
 */
function getLuminanceFromColor(colorString: string, luminanceMap: Record<string, number>): number {
  // Look for exact matches first
  for (const [color, luminance] of Object.entries(luminanceMap)) {
    if (colorString.includes(color)) {
      return luminance;
    }
  }
  
  // Estimate based on color intensity
  if (colorString.includes('-50') || colorString.includes('-100')) return 0.9;
  if (colorString.includes('-200') || colorString.includes('-300')) return 0.7;
  if (colorString.includes('-400') || colorString.includes('-500')) return 0.5;
  if (colorString.includes('-600') || colorString.includes('-700')) return 0.3;
  if (colorString.includes('-800') || colorString.includes('-900')) return 0.1;
  
  // Default to medium luminance
  return 0.5;
}

/**
 * Checks if two colors have good contrast (>= 4.5:1 for WCAG AA)
 */
export function hasGoodContrast(color1: string, color2: string): boolean {
  return getSimpleContrastRatio(color1, color2) >= 4.5;
}