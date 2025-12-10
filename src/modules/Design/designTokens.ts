import type { UIBlockTheme } from './ColorSystem/selectUIBlockThemeFromTags';

/**
 * Unified Design Tokens for UIBlock Visual Polish
 *
 * These tokens provide consistent shadows, hover states, and transitions
 * across all UIBlocks, adapting to the detected theme (warm/cool/neutral).
 *
 * Theme is detected via tags system (reuses existing shortlistTags).
 */

export const shadows = {
  card: {
    warm: 'shadow-[0_4px_20px_rgba(249,115,22,0.15)]',      // Orange glow
    cool: 'shadow-[0_4px_20px_rgba(37,99,235,0.15)]',       // Blue glow
    neutral: 'shadow-[0_4px_20px_rgba(100,116,139,0.15)]',  // Slate glow
  },
  cardHover: {
    warm: 'hover:shadow-[0_8px_30px_rgba(249,115,22,0.25)]',
    cool: 'hover:shadow-[0_8px_30px_rgba(37,99,235,0.25)]',
    neutral: 'hover:shadow-[0_8px_30px_rgba(100,116,139,0.25)]',
  },
  cta: {
    warm: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    cool: 'shadow-[0_8px_20px_rgba(37,99,235,0.35)]',
    neutral: 'shadow-[0_8px_20px_rgba(100,116,139,0.35)]',
  },
  ctaHover: {
    warm: 'hover:shadow-[0_12px_28px_rgba(249,115,22,0.45)]',
    cool: 'hover:shadow-[0_12px_28px_rgba(37,99,235,0.45)]',
    neutral: 'hover:shadow-[0_12px_28px_rgba(100,116,139,0.45)]',
  }
};

export const cardEnhancements = {
  hoverLift: 'hover:-translate-y-1',
  transition: 'transition-all duration-300',
  borderRadius: 'rounded-2xl',
};
