/**
 * Default theme and color tokens for UIBlock isolated testing
 */

import type { Theme } from '@/types/core/index';

export const defaultTheme: Theme = {
  typography: {
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    scale: 'comfortable',
    lineHeight: 1.5,
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  colors: {
    baseColor: 'gray',
    accentColor: 'blue',
    accentCSS: 'bg-blue-600',
    sectionBackgrounds: {
      primary: 'bg-gradient-to-br from-gray-900 to-gray-800',
      secondary: 'bg-gray-50',
      neutral: 'bg-white',
      divider: 'bg-gray-100/50',
    },
    semantic: {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      neutral: 'bg-gray-500',
    },
    states: {
      hover: {},
      focus: {},
      active: {},
      disabled: {},
    },
  },
  spacing: {
    unit: 8,
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
    presets: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem',
    },
  },
  corners: {
    radius: 8,
    scale: {
      small: 4,
      medium: 8,
      large: 16,
      full: 9999,
    },
  },
  animations: {
    enabled: true,
    duration: {
      fast: 150,
      medium: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    reducedMotion: false,
  },
};

export const defaultColorTokens = {
  // Base colors
  baseColor: 'gray',
  accentColor: 'blue',

  // Accent variants
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  accentLight: '#dbeafe',
  accentDark: '#1e40af',
  accentBorder: 'border-blue-500',

  // Text colors
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textMuted: 'text-gray-500',
  textOnLight: 'text-gray-900',
  textOnDark: 'text-white',

  // CTA colors
  ctaBg: 'bg-blue-600',
  ctaHover: 'bg-blue-700',
  ctaText: 'text-white',

  // Border colors
  borderFocus: 'focus:ring-blue-500',

  // Dynamic text (for background-aware components)
  dynamicHeading: 'text-gray-900',
  dynamicBody: 'text-gray-700',
  dynamicMuted: 'text-gray-500',
};
