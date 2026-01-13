/**
 * Font Detection Utility
 *
 * Analyzes page themes to determine which fonts are used and categorizes them
 * as either core (self-hosted) or google (fallback to Google Fonts).
 *
 * Core fonts: Inter, Sora, DM Sans, Playfair Display
 * Used to generate preload links and conditional Google Fonts loading.
 */

export type FontCategory = 'core' | 'google';

export interface DetectedFont {
  name: string;           // e.g., "Inter", "Sora"
  category: FontCategory; // 'core' (self-hosted) or 'google' (external)
  weights: number[];      // e.g., [400, 500, 600, 700]
}

export interface FontPreloadConfig {
  selfHosted: DetectedFont[];  // Fonts to load from /fonts/
  googleFonts: DetectedFont[];  // Fonts to load from Google Fonts
}

// Core fonts that are self-hosted (from SecondOpinion.md)
const CORE_FONTS = new Set([
  'Inter',
  'Sora',
  'DM Sans',
  'Playfair Display'
]);

// Weight mappings based on typography usage patterns
const HEADING_WEIGHTS = [500, 600, 700]; // h1-h6, buttons, labels
const BODY_WEIGHTS = [400];               // body text, captions
const ALL_WEIGHTS = [400, 500, 600, 700];

/**
 * Extract font name from CSS font-family string
 *
 * Examples:
 * - "'Inter', sans-serif" → "Inter"
 * - "Sora, sans-serif" → "Sora"
 * - "'DM Sans'" → "DM Sans"
 */
function extractFontName(fontFamily: string): string {
  return fontFamily
    .split(',')[0]
    .trim()
    .replace(/['"]/g, '');
}

/**
 * Determine which weights a font needs based on its usage
 *
 * @param fontName - Font family name
 * @param isHeadingFont - True if used for headings
 * @param isBodyFont - True if used for body text
 * @returns Array of required font weights
 */
function determineWeights(fontName: string, isHeadingFont: boolean, isBodyFont: boolean): number[] {
  // Playfair Display is headings-only, doesn't have 400 weight
  if (fontName === 'Playfair Display') {
    return [500, 600, 700];
  }

  // If same font used for both heading and body, need all weights
  if (isHeadingFont && isBodyFont) {
    return ALL_WEIGHTS;
  }

  // Heading-only fonts need heading weights
  if (isHeadingFont) {
    return HEADING_WEIGHTS;
  }

  // Body-only fonts need body weights
  return BODY_WEIGHTS;
}

/**
 * Detect fonts used by a published page and categorize them
 *
 * Analyzes theme.typography to determine:
 * - Which fonts are used (heading vs body)
 * - Which are core (self-hosted) vs google (external)
 * - Which weights each font requires
 *
 * @param theme - Page theme object with typography settings
 * @returns Font preload configuration with categorized fonts
 *
 * @example
 * ```typescript
 * const theme = {
 *   typography: {
 *     headingFont: "'Sora', sans-serif",
 *     bodyFont: "'Inter', sans-serif"
 *   }
 * };
 * const config = detectPageFonts(theme);
 * // Returns:
 * // {
 * //   selfHosted: [
 * //     { name: 'Sora', category: 'core', weights: [500, 600, 700] },
 * //     { name: 'Inter', category: 'core', weights: [400] }
 * //   ],
 * //   googleFonts: []
 * // }
 * ```
 */
export function detectPageFonts(theme: any): FontPreloadConfig {
  const headingFontRaw = theme?.typography?.headingFont || "'Inter', sans-serif";
  const bodyFontRaw = theme?.typography?.bodyFont || "'Inter', sans-serif";

  const headingFontName = extractFontName(headingFontRaw);
  const bodyFontName = extractFontName(bodyFontRaw);

  const selfHosted: DetectedFont[] = [];
  const googleFonts: DetectedFont[] = [];

  const isSameFont = headingFontName === bodyFontName;

  // Process heading font
  const headingWeights = determineWeights(headingFontName, true, isSameFont);
  const headingFont: DetectedFont = {
    name: headingFontName,
    category: CORE_FONTS.has(headingFontName) ? 'core' : 'google',
    weights: headingWeights
  };

  if (headingFont.category === 'core') {
    selfHosted.push(headingFont);
  } else {
    googleFonts.push(headingFont);
  }

  // Process body font (if different from heading)
  if (!isSameFont) {
    const bodyWeights = determineWeights(bodyFontName, false, true);
    const bodyFont: DetectedFont = {
      name: bodyFontName,
      category: CORE_FONTS.has(bodyFontName) ? 'core' : 'google',
      weights: bodyWeights
    };

    if (bodyFont.category === 'core') {
      selfHosted.push(bodyFont);
    } else {
      googleFonts.push(bodyFont);
    }
  }

  return { selfHosted, googleFonts };
}

/**
 * Generate font file path for self-hosted fonts
 *
 * Used for preload link generation and font-face src URLs.
 * Matches the actual Google Fonts Helper naming convention.
 *
 * @param fontName - Font family name (e.g., "Inter", "DM Sans")
 * @param weight - Font weight (400, 500, 600, 700)
 * @returns Path to font file in /public/fonts/
 *
 * @example
 * ```typescript
 * getFontFilePath('Inter', 700)
 * // Returns: "/fonts/inter/inter-v20-latin-700.woff2"
 *
 * getFontFilePath('DM Sans', 400)
 * // Returns: "/fonts/dm-sans/dm-sans-v17-latin-regular.woff2"
 * ```
 */
export function getFontFilePath(fontName: string, weight: number): string {
  const folderName = fontName.toLowerCase().replace(/\s+/g, '-');

  // Font version mapping (from Google Fonts Helper)
  const versions: Record<string, string> = {
    'inter': 'v20',
    'sora': 'v17',
    'dm-sans': 'v17',
    'playfair-display': 'v40'
  };

  const version = versions[folderName] || 'v1';

  // Weight 400 uses "regular" instead of "400"
  const weightSuffix = weight === 400 ? 'regular' : weight.toString();

  return `/fonts/${folderName}/${folderName}-${version}-latin-${weightSuffix}.woff2`;
}

/**
 * Generate Google Fonts URL for non-core fonts
 *
 * Creates Google Fonts API URL with specified font families and weights.
 * Maintains same format as current LandingPageRenderer.tsx.
 *
 * @param fonts - Array of fonts to load from Google Fonts
 * @returns Google Fonts CSS URL or empty string if no fonts
 *
 * @example
 * ```typescript
 * const fonts = [
 *   { name: 'Rubik', weights: [400, 600, 700] },
 *   { name: 'Poppins', weights: [400, 500, 600] }
 * ];
 * getGoogleFontsUrl(fonts);
 * // Returns: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700&family=Poppins:wght@400;500;600&display=swap"
 * ```
 */
export function getGoogleFontsUrl(fonts: DetectedFont[]): string {
  if (fonts.length === 0) return '';

  const families = fonts.map(font => {
    const name = font.name.replace(/\s+/g, '+');
    const weights = font.weights.join(';');
    return `family=${name}:wght@${weights}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}
