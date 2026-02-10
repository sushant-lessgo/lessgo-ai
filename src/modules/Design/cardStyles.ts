// cardStyles.ts - Adaptive card styling based on section background luminance
// Cards adapt structure (bg, border, shadow, text) to luminance
// Icons and hover effects are theme-driven for brand consistency

import { analyzeBackground } from '@/utils/backgroundAnalysis';

export interface CardStylesInput {
  sectionBackgroundCSS: string;
  theme: 'warm' | 'cool' | 'neutral';
  highlighted?: boolean;  // For pricing card featured tier
}

export interface CardStyles {
  // Card container
  bg: string;           // Tailwind bg class
  blur: string;         // backdrop-blur class or ''
  border: string;       // Tailwind border class
  shadow: string;       // Tailwind shadow class

  // Text colors
  textHeading: string;  // Tailwind text class
  textBody: string;
  textMuted: string;

  // Icon styling
  iconBg: string;       // Tailwind bg class
  iconColor: string;    // Tailwind text class

  // Hover
  hoverEffect: string;  // Tailwind hover classes
}

// Luminance-based card structure (no dynamic class building - Tailwind safe)
function getCardStylesForLuminance(luminance: number, highlighted?: boolean): Omit<CardStyles, 'iconBg' | 'iconColor' | 'hoverEffect'> {
  // Very dark (0 - 0.25)
  if (luminance <= 0.25) {
    return {
      bg: highlighted ? 'bg-white/20' : 'bg-white/15',
      blur: 'backdrop-blur-lg',
      border: 'border border-white/10',
      shadow: 'shadow-xl',
      textHeading: 'text-white',
      textBody: 'text-gray-200',
      textMuted: 'text-gray-300',
    };
  }

  // Dark (0.25 - 0.45)
  if (luminance <= 0.45) {
    return {
      bg: highlighted ? 'bg-white/15' : 'bg-white/10',
      blur: 'backdrop-blur-md',
      border: 'border border-white/10',
      shadow: 'shadow-lg',
      textHeading: 'text-white',
      textBody: 'text-gray-200',
      textMuted: 'text-gray-300',
    };
  }

  // Medium (0.45 - 0.55)
  if (luminance <= 0.55) {
    return {
      bg: highlighted ? 'bg-white' : 'bg-gray-50/80',
      blur: '',
      border: 'border border-gray-200',
      shadow: 'shadow-md',
      textHeading: 'text-gray-900',
      textBody: 'text-gray-700',
      textMuted: 'text-gray-500',
    };
  }

  // Light (0.55 - 0.75)
  if (luminance <= 0.75) {
    return {
      bg: highlighted ? 'bg-white' : 'bg-white/95',
      blur: '',
      border: 'border border-gray-100',
      shadow: highlighted ? 'shadow-md' : 'shadow-sm',
      textHeading: 'text-gray-900',
      textBody: 'text-gray-700',
      textMuted: 'text-gray-500',
    };
  }

  // Very light (0.75 - 1.0)
  return {
    bg: 'bg-white',
    blur: '',
    border: 'border border-gray-200',
    shadow: 'shadow-md',
    textHeading: 'text-gray-900',
    textBody: 'text-gray-700',
    textMuted: 'text-gray-500',
  };
}

// Static icon style maps (Tailwind purges dynamic classes)
// Dark backgrounds: white icons on semi-transparent white bg for visibility
const iconStyles = {
  warm: {
    dark: { bg: 'bg-white/40', color: 'text-white' },
    light: { bg: 'bg-orange-100', color: 'text-orange-600' }
  },
  cool: {
    dark: { bg: 'bg-white/40', color: 'text-white' },
    light: { bg: 'bg-blue-100', color: 'text-blue-600' }
  },
  neutral: {
    dark: { bg: 'bg-white/40', color: 'text-white' },
    light: { bg: 'bg-gray-100', color: 'text-gray-600' }
  }
} as const;

// Static hover style maps
const hoverStyles = {
  warm: {
    dark: 'hover:shadow-orange-400/20 hover:shadow-2xl',
    light: 'hover:shadow-orange-500/10 hover:shadow-lg'
  },
  cool: {
    dark: 'hover:shadow-blue-400/20 hover:shadow-2xl',
    light: 'hover:shadow-blue-500/10 hover:shadow-lg'
  },
  neutral: {
    dark: 'hover:shadow-white/20 hover:shadow-2xl',
    light: 'hover:shadow-gray-500/10 hover:shadow-lg'
  }
} as const;

// Highlighted card backgrounds (pricing featured tier)
const highlightedBgStyles = {
  warm: {
    dark: 'bg-orange-500/20 backdrop-blur',
    light: 'bg-orange-50'
  },
  cool: {
    dark: 'bg-blue-500/20 backdrop-blur',
    light: 'bg-blue-50'
  },
  neutral: {
    dark: 'bg-white/20 backdrop-blur',
    light: 'bg-gray-50'
  }
} as const;

function getThemedStyles(theme: 'warm' | 'cool' | 'neutral', luminance: number, highlighted?: boolean) {
  const isDark = luminance <= 0.45;
  const mode = isDark ? 'dark' : 'light';

  return {
    iconBg: iconStyles[theme][mode].bg,
    iconColor: iconStyles[theme][mode].color,
    hoverEffect: hoverStyles[theme][mode],
    // Override bg for highlighted cards
    ...(highlighted ? { highlightedBg: highlightedBgStyles[theme][mode] } : {})
  };
}

/**
 * Get adaptive card styles based on section background luminance and theme
 */
export function getCardStyles({ sectionBackgroundCSS, theme, highlighted }: CardStylesInput): CardStyles {
  const analysis = analyzeBackground(sectionBackgroundCSS);
  const luminance = analysis.luminance;

  // Get base styles from luminance
  const base = getCardStylesForLuminance(luminance, highlighted);

  // Get theme-specific styles
  const themed = getThemedStyles(theme, luminance, highlighted);

  // For highlighted cards, use themed bg override
  const finalBg = highlighted && themed.highlightedBg ? themed.highlightedBg : base.bg;

  return {
    ...base,
    bg: finalBg,
    iconBg: themed.iconBg,
    iconColor: themed.iconColor,
    hoverEffect: themed.hoverEffect,
  };
}

/**
 * Get just the luminance value from a background CSS string
 * Useful when you need luminance for other calculations
 */
export function getBackgroundLuminance(sectionBackgroundCSS: string): number {
  return analyzeBackground(sectionBackgroundCSS).luminance;
}
