/**
 * Server-safe text color and typography utilities for published pages.
 * No hooks, no client state - pure functions only.
 */

import { getSmartTextColor } from '@/utils/improvedTextColors';
import { landingTypography } from '@/modules/Design/fontSystem/landingTypography';
import type { TypographyVariant } from '@/modules/Design/fontSystem/landingTypography';

interface TextColorResult {
  heading: string;  // Hex color
  body: string;     // Hex color
  muted: string;    // Hex color
}

/**
 * Calculate text colors for a background type.
 * Uses theme.colors.textColors if available, falls back to smart calculation.
 *
 * @param backgroundType - The section background type (primary, secondary, etc.)
 * @param theme - Theme object with colors and textColors
 * @param sectionBackground - Optional section background CSS for fallback calculation
 * @returns Object with heading, body, and muted text colors (hex values)
 */
export function getPublishedTextColors(
  backgroundType: string,
  theme: any,
  sectionBackground?: string
): TextColorResult {

  // Priority 1: Use pre-calculated textColors from theme
  if (theme?.colors?.textColors && backgroundType && backgroundType !== 'custom') {
    // Map background types to storage keys
    const mapping: Record<string, string> = {
      'primary-highlight': 'primary',
      'secondary-highlight': 'secondary',
      'divider-zone': 'divider',
      'neutral': 'neutral',
      'primary': 'primary',
      'secondary': 'secondary',
      'divider': 'divider'
    };

    const storageKey = mapping[backgroundType] || backgroundType;
    const storedTextColors = theme.colors.textColors[storageKey];

    if (storedTextColors && storedTextColors.heading) {
      return {
        heading: storedTextColors.heading || '#111827',
        body: storedTextColors.body || '#374151',
        muted: storedTextColors.muted || '#6B7280'
      };
    }
  }

  // Priority 2: Calculate from sectionBackground
  const bg = sectionBackground ||
             theme?.colors?.sectionBackgrounds?.primary ||
             '#FFFFFF';

  return {
    heading: getSmartTextColor(bg, 'heading'),
    body: getSmartTextColor(bg, 'body'),
    muted: getSmartTextColor(bg, 'muted')
  };
}

/**
 * Get typography styles for a heading level or text variant.
 * Server-safe alternative to useTypography() hook.
 *
 * @param variant - Typography variant (h1, h2, h3, h4, body, etc.)
 * @param theme - Theme object with typography.headingFont and typography.bodyFont
 * @returns React.CSSProperties with fontSize, lineHeight, fontWeight, fontFamily, letterSpacing
 */
export function getPublishedTypographyStyles(
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'hero' | 'display' | 'body' | 'body-lg' | 'body-sm' | 'button' | 'label',
  theme: any
): React.CSSProperties {

  // Get base styles from landingTypography (static config)
  const baseStyle = landingTypography[variant as TypographyVariant];

  if (!baseStyle) {
    // Fallback if variant not found
    console.warn(`Typography variant "${variant}" not found, using default`);
    return {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '400',
      fontFamily: 'Inter, sans-serif'
    };
  }

  // Determine if this is a heading or body variant
  const isHeading = variant.startsWith('h') ||
                    variant === 'display' ||
                    variant === 'hero' ||
                    variant === 'button' ||
                    variant === 'label';

  // Get font family from theme
  const fontFamily = isHeading
    ? `${theme?.typography?.headingFont || 'Inter'}, sans-serif`
    : `${theme?.typography?.bodyFont || 'Inter'}, sans-serif`;

  return {
    fontSize: baseStyle.fontSize,
    lineHeight: baseStyle.lineHeight,
    fontWeight: baseStyle.fontWeight,
    letterSpacing: baseStyle.letterSpacing,
    fontFamily
  };
}
