// pickFont.ts — Simplified font picker (vibe-based selection via vibeDesignTokens)
// Original tone-based version archived to archive/typography-v1/pickFont.ts

import type { FontTheme } from '@/types/core/index';

/** Default font theme — Sora + Inter (most neutral combo) */
export const DEFAULT_FONT_THEME: FontTheme = {
  headingFont: "'Sora', sans-serif",
  bodyFont: "'Inter', sans-serif",
};

export function pickFontFromOnboarding(): FontTheme {
  return DEFAULT_FONT_THEME;
}
