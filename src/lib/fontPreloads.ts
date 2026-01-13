/**
 * Font Preload Generation
 *
 * Generates preload links for ONLY critical hero weights (700, 400) instead of all weights.
 * This optimization reduces preload overhead while maintaining LCP performance.
 *
 * Strategy:
 * - Preload weight 700 (h1, hero, display) - critical for above-the-fold headings
 * - Preload weight 400 (body text) - critical for above-the-fold body content
 * - Other weights (500, 600) load progressively as needed
 *
 * Result: 2 preloads per font instead of 4, faster initial page load
 */

import { detectPageFonts, getFontFilePath, type DetectedFont } from './fontDetection';

// Critical weights for LCP optimization
const HERO_WEIGHTS = {
  heading: 700,  // h1, hero, display - largest text above fold
  body: 400      // body text - main content above fold
};

export interface FontPreloadLink {
  href: string;
  as: string;
  type: string;
  crossOrigin: string;
}

export interface FontPreloadResult {
  preloads: FontPreloadLink[];
  googleFonts: DetectedFont[];
}

/**
 * Generate font preload links for hero weights only
 *
 * Analyzes theme to determine which fonts are used, then generates
 * preload links ONLY for critical hero weights (700, 400).
 *
 * Performance rationale:
 * - LCP element is typically h1 (weight 700) or body text (weight 400)
 * - Preloading these 2 weights eliminates render blocking
 * - Other weights (500, 600) used for secondary elements can load progressively
 * - Reduces critical path from 4 fonts to 2 per font family
 *
 * @param theme - Page theme object with typography settings
 * @returns Preload links for hero weights + Google Fonts config
 *
 * @example
 * ```typescript
 * const theme = {
 *   typography: {
 *     headingFont: "'Sora', sans-serif",  // Core font
 *     bodyFont: "'Inter', sans-serif"     // Core font
 *   }
 * };
 *
 * const { preloads, googleFonts } = generateFontPreloads(theme);
 * // Returns:
 * // preloads: [
 * //   { href: '/fonts/sora/sora-700-latin.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
 * //   { href: '/fonts/inter/inter-400-latin.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
 * // ]
 * // googleFonts: []
 * ```
 */
export function generateFontPreloads(theme: any): FontPreloadResult {
  const { selfHosted, googleFonts } = detectPageFonts(theme);

  const preloads: FontPreloadLink[] = [];

  // Generate preloads for self-hosted fonts (only hero weights)
  selfHosted.forEach(font => {
    // Always preload heading weight 700 if font is used for headings
    if (font.weights.includes(HERO_WEIGHTS.heading)) {
      preloads.push({
        href: getFontFilePath(font.name, HERO_WEIGHTS.heading),
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous'
      });
    }

    // Preload body weight 400 if font is used for body text
    // Only add if not already added (avoid duplicate if same font for heading + body)
    if (font.weights.includes(HERO_WEIGHTS.body)) {
      const alreadyPreloaded = preloads.some(p =>
        p.href === getFontFilePath(font.name, HERO_WEIGHTS.body)
      );

      if (!alreadyPreloaded) {
        preloads.push({
          href: getFontFilePath(font.name, HERO_WEIGHTS.body),
          as: 'font',
          type: 'font/woff2',
          crossOrigin: 'anonymous'
        });
      }
    }
  });

  return { preloads, googleFonts };
}
