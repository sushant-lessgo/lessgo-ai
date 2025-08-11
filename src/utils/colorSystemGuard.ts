// Centralized color system guard - single entry point for all getColorTokens calls
// Prevents render storms during formatting operations

import type { ColorTokens } from '@/types/core';

// Global formatting state - accessible without circular imports
let globalFormattingInProgress = false;
let cachedColorTokens: ColorTokens | null = null;

// Set formatting state from anywhere
export function setGlobalFormattingState(inProgress: boolean) {
  globalFormattingInProgress = inProgress;
  if (process.env.NODE_ENV === 'development') {
    console.log(`🛡️ Global formatting state: ${inProgress}`);
  }
}

// Check if formatting is in progress
export function isFormattingInProgress(): boolean {
  return globalFormattingInProgress;
}

// Safe fallback color tokens
const FALLBACK_COLOR_TOKENS: ColorTokens = {
  accent: 'bg-blue-600',
  accentHover: 'bg-blue-700', 
  accentBorder: 'border-blue-600',
  ctaBg: 'bg-blue-600',
  ctaHover: 'bg-blue-700',
  ctaText: 'text-white',
  ctaSecondary: 'bg-gray-100',
  ctaSecondaryHover: 'bg-gray-200', 
  ctaSecondaryText: 'text-gray-700',
  ctaGhost: 'text-blue-600',
  ctaGhostHover: 'hover:text-blue-700',
  link: 'text-blue-600',
  linkHover: 'text-blue-700',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600', 
  textMuted: 'text-gray-500',
  textOnLight: 'text-gray-900',
  textOnDark: 'text-white',
  textOnAccent: 'text-white',
  textInverse: 'text-white',
  bgPrimary: 'bg-white',
  bgSecondary: 'bg-gray-50',
  bgTertiary: 'bg-gray-100',
  bgNeutral: 'bg-white',
  bgMuted: 'bg-gray-50',
  bgAccent: 'bg-blue-600',
  bgInverse: 'bg-gray-900',
  borderPrimary: 'border-gray-200',
  borderSecondary: 'border-gray-300',
  borderAccent: 'border-blue-600', 
  borderFocus: 'border-blue-500',
  shadowSm: 'shadow-sm',
  shadowMd: 'shadow-md',
  shadowLg: 'shadow-lg'
};

// Centralized getColorTokens wrapper with global guard
export function guardedGetColorTokens(originalGetColorTokens: () => ColorTokens | null): ColorTokens {
  // QUARANTINE: Block during formatting
  if (globalFormattingInProgress) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚫 getColorTokens blocked - formatting in progress');
    }
    // Return cached tokens if available, otherwise fallback
    return cachedColorTokens || FALLBACK_COLOR_TOKENS;
  }

  try {
    const tokens = originalGetColorTokens();
    if (tokens) {
      // Cache successful result
      cachedColorTokens = tokens;
      return tokens;
    } else {
      // Handle null from quarantined original function
      return cachedColorTokens || FALLBACK_COLOR_TOKENS;
    }
  } catch (error) {
    console.error('Color tokens generation failed:', error);
    return cachedColorTokens || FALLBACK_COLOR_TOKENS;
  }
}

// Export for monkey-patching if needed
export { FALLBACK_COLOR_TOKENS };