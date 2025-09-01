// Centralized color system guard - single entry point for all getColorTokens calls
// Prevents render storms during formatting operations

import type { ColorTokens } from '@/types/core';
import { logger } from '@/lib/logger';

// Global formatting state - accessible without circular imports
let globalFormattingInProgress = false;
let cachedColorTokens: ColorTokens | null = null;

// Set formatting state from anywhere
export function setGlobalFormattingState(inProgress: boolean) {
  globalFormattingInProgress = inProgress;
  logger.dev(`🛡️ Global formatting state: ${inProgress}`);
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
  bgNeutral: 'bg-white',
  bgDivider: 'bg-gray-200',
  surfaceCard: 'bg-white',
  surfaceElevated: 'bg-white',
  surfaceSection: 'bg-gray-50',
  surfaceOverlay: 'bg-white',
  borderDefault: 'border-gray-200',
  borderSubtle: 'border-gray-100',
  borderFocus: 'border-blue-500'
};

// Centralized getColorTokens wrapper with global guard
export function guardedGetColorTokens(originalGetColorTokens: () => ColorTokens | null): ColorTokens {
  // QUARANTINE: Block during formatting
  if (globalFormattingInProgress) {
    logger.dev('🚫 getColorTokens blocked - formatting in progress');
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
    logger.error('Color tokens generation failed:', error);
    return cachedColorTokens || FALLBACK_COLOR_TOKENS;
  }
}

// Export for monkey-patching if needed
export { FALLBACK_COLOR_TOKENS };