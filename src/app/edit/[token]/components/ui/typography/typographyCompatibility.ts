// typographyCompatibility.ts — Font combo access + display helpers

import { optimizedFontThemes, googleFontThemes } from '@/modules/Design/fontSystem/fontThemes';
import type { FontTheme } from '@/types/core/index';

export function getOptimizedOptions(): FontTheme[] {
  return optimizedFontThemes;
}

export function getGoogleOptions(): FontTheme[] {
  return googleFontThemes;
}

export function generateFontPairName(theme: FontTheme): string {
  const headingName = extractFontName(theme.headingFont);
  const bodyName = extractFontName(theme.bodyFont);

  if (headingName === bodyName) {
    return headingName;
  }
  return `${headingName} + ${bodyName}`;
}

function extractFontName(fontFamily: string): string {
  const match = fontFamily.match(/^['"]?([^'"]+)['"]?/);
  return match ? match[1] : fontFamily.split(',')[0].trim();
}
