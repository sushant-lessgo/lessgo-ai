// Server-side theme utilities for published pages
// Copied from useThemeStore.ts color logic

export function darken(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

export function lighten(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

export function isLight(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

/**
 * Generate theme CSS variables from base colors
 * This will be embedded as inline <style> in published htmlContent
 */
export function generateThemeCSS(baseColors: {
  primary: string;
  background: string;
  muted: string;
}): string {
  const cssVars = {
    '--landing-primary': baseColors.primary,
    '--landing-primary-hover': darken(baseColors.primary, 10),
    '--landing-accent': lighten(baseColors.primary, 10),
    '--landing-muted-bg': baseColors.background,
    '--landing-border': isLight(baseColors.background)
      ? darken(baseColors.background, 10)
      : lighten(baseColors.background, 10),
    '--landing-text-primary': isLight(baseColors.background) ? '#111827' : '#F9FAFB',
    '--landing-text-secondary': isLight(baseColors.background) ? '#6B7280' : '#D1D5DB',
    '--landing-text-muted': baseColors.muted,
  };

  return `<style>:root{${Object.entries(cssVars).map(([k, v]) => `${k}:${v};`).join('')}}</style>`;
}

/**
 * Generate inline styles object for published components
 * Used by published primitives for dynamic theme values
 *
 * @param theme - Full theme object
 * @returns CSS custom properties object
 *
 * @example
 * ```typescript
 * const styles = generateInlineStyles(theme);
 * // { '--landing-primary': '#3B82F6', ... }
 * ```
 */
export function generateInlineStyles(theme: any): Record<string, string> {
  const accentColor = theme?.colors?.accentColor || '#3B82F6';
  const bgPrimary = theme?.colors?.sectionBackgrounds?.primary || '#FFFFFF';
  const textSecondary = theme?.colors?.textSecondary || '#6B7280';

  return {
    '--landing-primary': accentColor,
    '--landing-primary-hover': darken(accentColor, 10),
    '--landing-accent': lighten(accentColor, 10),
    '--landing-muted-bg': bgPrimary,
    '--landing-border': isLight(bgPrimary)
      ? darken(bgPrimary, 10)
      : lighten(bgPrimary, 10),
    '--landing-text-primary': isLight(bgPrimary) ? '#111827' : '#F9FAFB',
    '--landing-text-secondary': isLight(bgPrimary) ? '#6B7280' : '#D1D5DB',
    '--landing-text-muted': textSecondary,
  };
}

/**
 * Convert Tailwind color class to hex value
 * Adapted from BackgroundPatternAnalyzer.ts
 * Used for published pages where inline styles require hex colors
 *
 * @param tailwindClass - Tailwind class like 'bg-pink-600' or 'pink-600'
 * @returns Hex color value like '#DB2777'
 *
 * @example
 * ```typescript
 * tailwindToHex('bg-pink-600') // '#DB2777'
 * tailwindToHex('purple-500')  // '#A855F7'
 * ```
 */
export function tailwindToHex(tailwindClass: string): string {
  // Strip 'bg-' or 'from-' or 'to-' prefix if present
  const colorName = tailwindClass.replace(/^(bg-|from-|to-)/, '');

  const colorMap: Record<string, string> = {
    // Pink (needed for accentCSS)
    'pink-500': '#EC4899',
    'pink-600': '#DB2777',
    'pink-700': '#BE185D',
    'pink-800': '#9F1239',

    // Rose
    'rose-500': '#F43F5E',
    'rose-600': '#E11D48',
    'rose-700': '#BE123C',

    // Purple (from BackgroundPatternAnalyzer)
    'purple-500': '#A855F7',
    'purple-600': '#9333EA',
    'purple-700': '#7C3AED',
    'purple-800': '#6B21A8',

    // Blue (from BackgroundPatternAnalyzer)
    'blue-500': '#3B82F6',
    'blue-600': '#2563EB',
    'blue-700': '#1D4ED8',
    'blue-800': '#1E40AF',

    // Indigo
    'indigo-500': '#6366F1',
    'indigo-600': '#4F46E5',
    'indigo-700': '#4338CA',
    'indigo-800': '#3730A3',

    // Violet
    'violet-500': '#8B5CF6',
    'violet-600': '#7C3AED',
    'violet-700': '#6D28D9',

    // Teal
    'teal-500': '#14B8A6',
    'teal-600': '#0D9488',
    'teal-700': '#0F766E',

    // Cyan
    'cyan-500': '#06B6D4',
    'cyan-600': '#0891B2',
    'cyan-700': '#0E7490',

    // Emerald
    'emerald-500': '#10B981',
    'emerald-600': '#059669',
    'emerald-700': '#047857',

    // Green
    'green-500': '#22C55E',
    'green-600': '#16A34A',
    'green-700': '#15803D',

    // Amber
    'amber-500': '#F59E0B',
    'amber-600': '#D97706',
    'amber-700': '#B45309',

    // Orange
    'orange-500': '#F97316',
    'orange-600': '#EA580C',
    'orange-700': '#C2410C',

    // Red
    'red-500': '#EF4444',
    'red-600': '#DC2626',
    'red-700': '#B91C1C',

    // Gray
    'gray-500': '#6B7280',
    'gray-600': '#4B5563',
    'gray-700': '#374151',
    'gray-800': '#1F2937',
    'gray-900': '#111827',
  };

  return colorMap[colorName] || '#DB2777'; // Default to pink-600
}
