// fontThemes.ts — Font combo definitions split by loading strategy
// Optimized = self-hosted in /public/fonts/ (Inter, Sora, DM Sans, Playfair Display)
// Google = loaded from Google Fonts API on demand

import type { FontTheme } from '@/types/core/index';

export type { FontTheme };

/** Self-hosted font combos — zero external requests, fastest LCP */
export const optimizedFontThemes: FontTheme[] = [
  { headingFont: "'Sora', sans-serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'DM Sans', sans-serif", bodyFont: "'DM Sans', sans-serif" },
  { headingFont: "'Sora', sans-serif", bodyFont: "'DM Sans', sans-serif" },
  { headingFont: "'Playfair Display', serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'DM Sans', sans-serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'Playfair Display', serif", bodyFont: "'DM Sans', sans-serif" },
];

/** Google Font combos — require external load */
export const googleFontThemes: FontTheme[] = [
  { headingFont: "'Bricolage Grotesque', sans-serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'Space Grotesk', sans-serif", bodyFont: "'DM Sans', sans-serif" },
  { headingFont: "'DM Serif Display', serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'Raleway', sans-serif", bodyFont: "'Open Sans', sans-serif" },
  { headingFont: "'Manrope', sans-serif", bodyFont: "'Inter', sans-serif" },
  { headingFont: "'Rubik', sans-serif", bodyFont: "'Inter', sans-serif" },
];

/** All font themes combined */
export const allFontThemes: FontTheme[] = [...optimizedFontThemes, ...googleFontThemes];
