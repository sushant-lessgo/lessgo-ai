// /app/edit/[token]/components/ui/backgroundCompatibility.ts
import { palettes, getPalettesByMode, type Palette } from '@/modules/Design/background/palettes';

interface BackgroundSystem {
  primary: string;
  secondary: string;
  neutral: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}

export interface BrandColors {
  primary: string;
  secondary?: string;
}

export interface BackgroundVariation {
  id: string;
  label: string;
  css: string;          // Primary CSS value
  baseColor: string;
  category: 'technical' | 'professional' | 'friendly';
}

type CompatibilityMode = 'recommended' | 'custom';

// Map palette temperature/energy to legacy category
function paletteToCategory(p: Palette): 'technical' | 'professional' | 'friendly' {
  if (p.temperature === 'cool' && p.energy === 'bold') return 'technical';
  if (p.temperature === 'warm') return 'friendly';
  return 'professional';
}

// Convert palette to BackgroundVariation for downstream compat
function paletteToVariation(p: Palette): BackgroundVariation {
  return {
    id: p.id,
    label: p.label,
    css: p.primary,
    baseColor: p.baseColor,
    category: paletteToCategory(p),
  };
}

/**
 * Get compatible background variations based on mode and constraints
 */
export function getCompatibleBackgrounds(
  mode: CompatibilityMode,
  brandColors: BrandColors | null,
  currentBackground: BackgroundSystem
): BackgroundVariation[] {
  try {
    switch (mode) {
      case 'recommended':
        return getGeneratedVariations(currentBackground);

      case 'custom':
        return [];

      default:
        return [];
    }
  } catch (error) {
    return [];
  }
}

/**
 * Get variations using palette-based filtering
 */
function getGeneratedVariations(currentBackground: BackgroundSystem): BackgroundVariation[] {
  const { baseColor } = currentBackground;

  // Find palettes matching current base color
  let matches = palettes.filter(p => p.baseColor === baseColor);

  // If no exact matches, try harmonious colors
  if (matches.length === 0) {
    const harmonious = getHarmoniousColors(baseColor);
    matches = palettes.filter(p => harmonious.includes(p.baseColor));
  }

  // Fallback to all palettes
  if (matches.length === 0) {
    matches = palettes.slice(0, 8);
  }

  return matches.slice(0, 8).map(paletteToVariation);
}

/**
 * Get backgrounds compatible with brand colors
 */
function getBrandCompatibleBackgrounds(
  brandColors: BrandColors | null,
  currentBackground: BackgroundSystem
): BackgroundVariation[] {
  if (!brandColors?.primary) return [];

  try {
    const brandBaseColor = extractBaseColorFromHex(brandColors.primary);

    let compatible = palettes.filter(p => {
      if (p.baseColor === brandBaseColor) return true;
      const harmonious = getHarmoniousColors(brandBaseColor);
      if (harmonious.includes(p.baseColor)) return true;
      const neutralColors = ['gray', 'slate', 'zinc'];
      if (neutralColors.includes(p.baseColor)) return true;
      return false;
    });

    compatible.sort((a, b) => {
      const aScore = calculateBrandCompatibilityScore(paletteToVariation(a), brandColors);
      const bScore = calculateBrandCompatibilityScore(paletteToVariation(b), brandColors);
      return bScore - aScore;
    });

    return compatible.slice(0, 12).map(paletteToVariation);
  } catch (error) {
    return [];
  }
}

/**
 * Get all custom background options (show all palettes)
 */
function getCustomBackgroundOptions(): BackgroundVariation[] {
  const variations = palettes.map(paletteToVariation);
  const categoryOrder = { friendly: 1, professional: 2, technical: 3 };
  variations.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);
  return variations.slice(0, 20);
}

/**
 * Extract base color family from hex color
 */
function extractBaseColorFromHex(hexColor: string): string {
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const [h, s, l] = rgbToHsl(r, g, b);

    if (s < 0.1) return 'gray';
    if (l > 0.9) return 'unknown';
    if (l < 0.1) return 'unknown';

    if (h >= 345 || h < 15) return 'red';
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 75) return 'amber';
    if (h >= 75 && h < 105) return 'green';
    if (h >= 105 && h < 135) return 'emerald';
    if (h >= 135 && h < 165) return 'teal';
    if (h >= 165 && h < 195) return 'cyan';
    if (h >= 195 && h < 225) return 'sky';
    if (h >= 225 && h < 255) return 'blue';
    if (h >= 255 && h < 285) return 'indigo';
    if (h >= 285 && h < 315) return 'purple';
    if (h >= 315 && h < 345) return 'pink';

    return 'blue';
  } catch (error) {
    return 'blue';
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;
  l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function getHarmoniousColors(baseColor: string): string[] {
  const colorHarmonies: Record<string, string[]> = {
    blue: ['indigo', 'cyan', 'sky', 'teal', 'purple'],
    red: ['orange', 'pink', 'rose', 'amber'],
    green: ['emerald', 'teal', 'lime', 'mint'],
    purple: ['indigo', 'blue', 'pink', 'rose'],
    orange: ['red', 'amber', 'yellow'],
    teal: ['cyan', 'green', 'emerald', 'blue'],
    indigo: ['blue', 'purple', 'sky'],
    cyan: ['teal', 'sky', 'blue'],
    sky: ['blue', 'cyan', 'indigo'],
    emerald: ['green', 'teal', 'mint'],
    amber: ['orange', 'yellow', 'red'],
    rose: ['pink', 'red', 'purple'],
    pink: ['rose', 'purple', 'red'],
    gray: ['slate', 'zinc', 'neutral', 'stone'],
    slate: ['gray', 'zinc', 'blue'],
    zinc: ['gray', 'slate', 'neutral'],
  };
  return colorHarmonies[baseColor] || [];
}

function calculateBrandCompatibilityScore(
  variation: BackgroundVariation,
  brandColors: BrandColors
): number {
  let score = 0;
  const brandBaseColor = extractBaseColorFromHex(brandColors.primary);

  if (variation.baseColor === brandBaseColor) score += 10;
  const harmonious = getHarmoniousColors(brandBaseColor);
  if (harmonious.includes(variation.baseColor)) score += 7;
  const neutrals = ['gray', 'slate', 'zinc'];
  if (neutrals.includes(variation.baseColor)) score += 5;
  if (variation.category === 'professional') score += 3;
  else if (variation.category === 'friendly') score += 2;

  if (brandColors.secondary) {
    const secondaryBaseColor = extractBaseColorFromHex(brandColors.secondary);
    if (variation.baseColor === secondaryBaseColor) score += 3;
  }

  return score;
}

export function validateBrandColor(color: string): { isValid: boolean; error?: string } {
  try {
    const hexPattern = /^#[0-9A-F]{6}$/i;
    if (!hexPattern.test(color)) {
      return { isValid: false, error: 'Color must be in hex format (e.g., #3B82F6)' };
    }

    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const [, , lightness] = rgbToHsl(r, g, b);

    if (lightness > 0.95) return { isValid: false, error: 'Color is too light for background generation' };
    if (lightness < 0.05) return { isValid: false, error: 'Color is too dark for background generation' };

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid color format' };
  }
}

/**
 * Get background preview data for a variation (returns CSS values)
 */
export function getBackgroundPreview(variation: BackgroundVariation): {
  primaryCSS: string;
  secondaryCSS: string;
  neutralCSS: string;
} {
  // Find matching palette for full trio
  const palette = palettes.find(p => p.id === variation.id);

  if (palette) {
    return {
      primaryCSS: palette.primary,
      secondaryCSS: palette.secondary,
      neutralCSS: palette.neutral,
    };
  }

  // Fallback for variations not from palettes
  const secondaryColorMap: Record<string, string> = {
    blue: 'rgba(239, 246, 255, 0.7)',
    sky: 'rgba(240, 249, 255, 0.7)',
    indigo: 'rgba(238, 242, 255, 0.7)',
    purple: 'rgba(250, 245, 255, 0.7)',
    pink: 'rgba(253, 242, 248, 0.7)',
    red: 'rgba(254, 242, 242, 0.7)',
    orange: 'rgba(255, 247, 237, 0.7)',
    amber: 'rgba(255, 251, 235, 0.7)',
    gray: 'rgba(249, 250, 251, 0.7)',
    slate: 'rgba(248, 250, 252, 0.7)',
  };

  return {
    primaryCSS: variation.css,
    secondaryCSS: secondaryColorMap[variation.baseColor] || 'rgba(249, 250, 251, 0.7)',
    neutralCSS: '#ffffff',
  };
}
