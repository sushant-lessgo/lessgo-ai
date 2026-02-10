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
      'neutral': 'neutral',
      'primary': 'primary',
      'secondary': 'secondary',
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

// ============================================================
// Card Styles for Published Pages
// ============================================================

export interface PublishedCardStyles {
  // Card container
  bg: string;              // rgba/hex value
  backdropFilter: string;  // 'blur(16px)' or 'none'
  borderColor: string;     // rgba/hex value
  borderWidth: string;     // '1px'
  borderStyle: string;     // 'solid'
  boxShadow: string;       // CSS shadow value

  // Text colors
  textHeading: string;     // hex
  textBody: string;        // hex
  textMuted: string;       // hex

  // Icon styling
  iconBg: string;          // rgba/hex
  iconColor: string;       // hex
}

// Theme-based icon colors (CSS values)
// Dark backgrounds: white icons on semi-transparent white bg for visibility
const publishedIconColors = {
  warm: {
    bgDark: 'rgba(255,255,255,0.4)', bgLight: '#ffedd5',
    colorDark: '#ffffff', colorLight: '#ea580c'
  },
  cool: {
    bgDark: 'rgba(255,255,255,0.4)', bgLight: '#dbeafe',
    colorDark: '#ffffff', colorLight: '#2563eb'
  },
  neutral: {
    bgDark: 'rgba(255,255,255,0.4)', bgLight: '#f3f4f6',
    colorDark: '#ffffff', colorLight: '#4b5563'
  }
} as const;

// Highlighted card backgrounds for published pages
const publishedHighlightedBg = {
  warm: {
    dark: 'rgba(249,115,22,0.2)',
    light: '#fff7ed'
  },
  cool: {
    dark: 'rgba(59,130,246,0.2)',
    light: '#eff6ff'
  },
  neutral: {
    dark: 'rgba(255,255,255,0.2)',
    light: '#f9fafb'
  }
} as const;

/**
 * Get card styles for published pages (inline CSS values, not Tailwind classes)
 *
 * @param luminance - Background luminance value (0-1)
 * @param theme - UIBlock theme ('warm' | 'cool' | 'neutral')
 * @param highlighted - Whether this is a highlighted/featured card
 * @returns CSS-ready values for card styling
 */
export function getPublishedCardStyles(
  luminance: number,
  theme: 'warm' | 'cool' | 'neutral',
  highlighted?: boolean
): PublishedCardStyles {
  const isDark = luminance <= 0.45;

  // Luminance-based structure
  let base: Omit<PublishedCardStyles, 'iconBg' | 'iconColor'>;

  if (luminance <= 0.25) {
    // Very dark
    base = {
      bg: highlighted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(16px)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      textHeading: '#ffffff',
      textBody: '#e5e7eb',
      textMuted: '#d1d5db',
    };
  } else if (luminance <= 0.45) {
    // Dark
    base = {
      bg: highlighted ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      textHeading: '#ffffff',
      textBody: '#e5e7eb',
      textMuted: '#d1d5db',
    };
  } else if (luminance <= 0.55) {
    // Medium
    base = {
      bg: highlighted ? '#ffffff' : 'rgba(249,250,251,0.8)',
      backdropFilter: 'none',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      textHeading: '#111827',
      textBody: '#374151',
      textMuted: '#6b7280',
    };
  } else if (luminance <= 0.75) {
    // Light
    base = {
      bg: highlighted ? '#ffffff' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'none',
      borderColor: '#f3f4f6',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: highlighted ? '0 4px 6px -1px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
      textHeading: '#111827',
      textBody: '#374151',
      textMuted: '#6b7280',
    };
  } else {
    // Very light
    base = {
      bg: '#ffffff',
      backdropFilter: 'none',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderStyle: 'solid',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      textHeading: '#111827',
      textBody: '#374151',
      textMuted: '#6b7280',
    };
  }

  // Override bg for highlighted cards with theme color
  if (highlighted) {
    base.bg = isDark
      ? publishedHighlightedBg[theme].dark
      : publishedHighlightedBg[theme].light;
    if (isDark) {
      base.backdropFilter = 'blur(12px)';
    }
  }

  // Theme-based icon colors
  const ic = publishedIconColors[theme];

  return {
    ...base,
    iconBg: isDark ? ic.bgDark : ic.bgLight,
    iconColor: isDark ? ic.colorDark : ic.colorLight,
  };
}
