// /app/edit/[token]/components/ui/backgroundCompatibility.ts
import { primaryBackgrounds } from '@/modules/Design/background/primaryBackgrounds';
import { getCategoryForUser } from '@/modules/Design/background/categoryMapping';

interface BackgroundSystem {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}

interface BrandColors {
  primary: string;
  secondary?: string;
}

// ✅ Updated to match PrimaryBackground structure
interface BackgroundVariation {
  id: string;           // Previously variationId
  label: string;        // Previously variationLabel
  css: string;          // Previously tailwindClass - now CSS values
  baseColor: string;
  category: 'technical' | 'professional' | 'friendly';
}

type CompatibilityMode = 'recommended' | 'custom';

/**
 * Get compatible background variations based on mode and constraints
 */
export function getCompatibleBackgrounds(
  mode: CompatibilityMode,
  brandColors: BrandColors | null,
  currentBackground: BackgroundSystem
): BackgroundVariation[] {
  //   mode, 
  //   brandColors, 
  //   currentBackground: currentBackground ? 'BackgroundSystem' : 'null',
  //   baseColor: currentBackground?.baseColor 
  // });

  try {
    switch (mode) {
      case 'recommended':
        return getGeneratedVariations(currentBackground);
      
      case 'custom':
        // In custom mode, no need to search for compatible backgrounds
        // User is creating their own custom background
        return [];
      
      default:
        return [];
    }
  } catch (error) {
    console.error('Error finding compatible backgrounds:', error);
    return [];
  }
}

/**
 * ✅ SIMPLIFIED: Get variations using category-based filtering
 */
function getGeneratedVariations(currentBackground: BackgroundSystem): BackgroundVariation[] {
  const { baseColor } = currentBackground;

  // Find variations that match the current base color
  let variations = primaryBackgrounds.filter(variation => variation.baseColor === baseColor);

  // If no exact color matches, try harmonious colors
  if (variations.length === 0) {
    const harmoniousColors = getHarmoniousColors(baseColor);
    variations = primaryBackgrounds.filter(v => harmoniousColors.includes(v.baseColor));
  }

  // If still no matches, use all backgrounds as fallback
  if (variations.length === 0) {
    variations = primaryBackgrounds.filter(v =>
      ['blue', 'gray', 'slate'].includes(v.baseColor)
    );
  }

  return variations.slice(0, 8); // Limit to 8 options
}

/**
 * ✅ SIMPLIFIED: Get backgrounds compatible with brand colors
 */
function getBrandCompatibleBackgrounds(
  brandColors: BrandColors | null,
  currentBackground: BackgroundSystem
): BackgroundVariation[] {
  if (!brandColors?.primary) {
    return [];
  }

  try {
    // Extract base color family from brand color
    const brandBaseColor = extractBaseColorFromHex(brandColors.primary);

    // Find backgrounds that work well with the brand color
    let compatibleVariations = primaryBackgrounds.filter(variation => {
      // Direct base color match
      if (variation.baseColor === brandBaseColor) return true;

      // Color harmony matches
      const harmonious = getHarmoniousColors(brandBaseColor);
      if (harmonious.includes(variation.baseColor)) return true;

      // Neutral backgrounds work with any brand color
      const neutralColors = ['gray', 'slate', 'zinc'];
      if (neutralColors.includes(variation.baseColor)) return true;

      return false;
    });

    // Sort by brand compatibility score
    compatibleVariations.sort((a, b) => {
      const aScore = calculateBrandCompatibilityScore(a, brandColors);
      const bScore = calculateBrandCompatibilityScore(b, brandColors);
      return bScore - aScore; // Higher score first
    });

    return compatibleVariations.slice(0, 12); // More options for brand mode

  } catch (error) {
    console.error('Error finding brand-compatible backgrounds:', error);
    return [];
  }
}

/**
 * ✅ SIMPLIFIED: Get all custom background options (show all curated backgrounds)
 */
function getCustomBackgroundOptions(): BackgroundVariation[] {
  // Return all backgrounds, sorted by category
  const sorted = [...primaryBackgrounds].sort((a, b) => {
    const categoryOrder = { friendly: 1, professional: 2, technical: 3 };
    const aOrder = categoryOrder[a.category];
    const bOrder = categoryOrder[b.category];
    return aOrder - bOrder;
  });

  return sorted.slice(0, 20); // Show up to 20 options
}

/**
 * Extract base color family from hex color
 */
function extractBaseColorFromHex(hexColor: string): string {
  try {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Convert to HSL to determine color family
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Map hue to base color families
    if (s < 0.1) return 'gray'; // Low saturation = grayscale
    if (l > 0.9) return 'unknown'; // Very light
    if (l < 0.1) return 'unknown'; // Very dark
    
    // Hue-based color mapping
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
    
    return 'blue'; // Default fallback
    
  } catch (error) {
    return 'blue'; // Safe fallback
  }
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
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

/**
 * Get harmonious colors for a base color
 */
function getHarmoniousColors(baseColor: string): string[] {
  const colorHarmonies: Record<string, string[]> = {
    // Primary colors and their harmonies
    blue: ['indigo', 'cyan', 'sky', 'teal', 'purple'],
    red: ['orange', 'pink', 'rose', 'amber'],
    green: ['emerald', 'teal', 'lime', 'mint'],
    
    // Secondary harmonies
    purple: ['indigo', 'blue', 'pink', 'rose'],
    orange: ['red', 'amber', 'yellow'],
    teal: ['cyan', 'green', 'emerald', 'blue'],
    
    // Extended harmonies
    indigo: ['blue', 'purple', 'sky'],
    cyan: ['teal', 'sky', 'blue'],
    sky: ['blue', 'cyan', 'indigo'],
    emerald: ['green', 'teal', 'mint'],
    amber: ['orange', 'yellow', 'red'],
    rose: ['pink', 'red', 'purple'],
    pink: ['rose', 'purple', 'red'],
    
    // Neutrals work with everything
    gray: ['slate', 'zinc', 'neutral', 'stone'],
    slate: ['gray', 'zinc', 'blue'],
    zinc: ['gray', 'slate', 'neutral'],
  };

  return colorHarmonies[baseColor] || [];
}

/**
 * ✅ SIMPLIFIED: Calculate brand compatibility score
 */
function calculateBrandCompatibilityScore(
  variation: BackgroundVariation,
  brandColors: BrandColors
): number {
  let score = 0;

  // Base color match gets highest score
  const brandBaseColor = extractBaseColorFromHex(brandColors.primary);
  if (variation.baseColor === brandBaseColor) {
    score += 10;
  }

  // Harmonious colors get medium score
  const harmonious = getHarmoniousColors(brandBaseColor);
  if (harmonious.includes(variation.baseColor)) {
    score += 7;
  }

  // Neutral backgrounds get medium score (work with anything)
  const neutrals = ['gray', 'slate', 'zinc'];
  if (neutrals.includes(variation.baseColor)) {
    score += 5;
  }

  // Category bonus: professional/friendly better for brand mode
  if (variation.category === 'professional') {
    score += 3;
  } else if (variation.category === 'friendly') {
    score += 2;
  }

  // Secondary brand color bonus
  if (brandColors.secondary) {
    const secondaryBaseColor = extractBaseColorFromHex(brandColors.secondary);
    if (variation.baseColor === secondaryBaseColor) {
      score += 3;
    }
  }

  return score;
}

/**
 * Validate brand color format
 */
export function validateBrandColor(color: string): { isValid: boolean; error?: string } {
  try {
    // Check hex format
    const hexPattern = /^#[0-9A-F]{6}$/i;
    if (!hexPattern.test(color)) {
      return {
        isValid: false,
        error: 'Color must be in hex format (e.g., #3B82F6)'
      };
    }

    // Check if color is too light or too dark
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const [, , lightness] = rgbToHsl(r, g, b);
    
    if (lightness > 0.95) {
      return {
        isValid: false,
        error: 'Color is too light for background generation'
      };
    }
    
    if (lightness < 0.05) {
      return {
        isValid: false,
        error: 'Color is too dark for background generation'
      };
    }

    return { isValid: true };

  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid color format'
    };
  }
}

/**
 * ✅ Get background preview data for a variation (returns CSS values)
 */
export function getBackgroundPreview(variation: BackgroundVariation): {
  primaryCSS: string;
  secondaryCSS: string;
  neutralCSS: string;
  dividerCSS: string;
} {
  // Map baseColor to actual CSS values
  const secondaryColorMap: Record<string, string> = {
    blue: 'rgba(239, 246, 255, 0.7)',
    sky: 'rgba(240, 249, 255, 0.7)',
    indigo: 'rgba(238, 242, 255, 0.7)',
    purple: 'rgba(250, 245, 255, 0.7)',
    pink: 'rgba(253, 242, 248, 0.7)',
    red: 'rgba(254, 242, 242, 0.7)',
    orange: 'rgba(255, 247, 237, 0.7)',
    amber: 'rgba(255, 251, 235, 0.7)',
    yellow: 'rgba(254, 252, 232, 0.7)',
    lime: 'rgba(247, 254, 231, 0.7)',
    green: 'rgba(240, 253, 244, 0.7)',
    emerald: 'rgba(236, 253, 245, 0.7)',
    teal: 'rgba(240, 253, 250, 0.7)',
    cyan: 'rgba(236, 254, 255, 0.7)',
    gray: 'rgba(249, 250, 251, 0.7)',
    slate: 'rgba(248, 250, 252, 0.7)',
    zinc: 'rgba(250, 250, 250, 0.7)',
  };

  const dividerColorMap: Record<string, string> = {
    blue: 'rgba(219, 234, 254, 0.5)',
    sky: 'rgba(224, 242, 254, 0.5)',
    indigo: 'rgba(224, 231, 255, 0.5)',
    purple: 'rgba(243, 232, 255, 0.5)',
    pink: 'rgba(252, 231, 243, 0.5)',
    red: 'rgba(254, 226, 226, 0.5)',
    orange: 'rgba(255, 237, 213, 0.5)',
    amber: 'rgba(254, 243, 199, 0.5)',
    yellow: 'rgba(254, 249, 195, 0.5)',
    lime: 'rgba(236, 252, 203, 0.5)',
    green: 'rgba(220, 252, 231, 0.5)',
    emerald: 'rgba(209, 250, 229, 0.5)',
    teal: 'rgba(204, 251, 241, 0.5)',
    cyan: 'rgba(207, 250, 254, 0.5)',
    gray: 'rgba(243, 244, 246, 0.5)',
    slate: 'rgba(241, 245, 249, 0.5)',
    zinc: 'rgba(244, 244, 245, 0.5)',
  };

  return {
    primaryCSS: variation.css,
    secondaryCSS: secondaryColorMap[variation.baseColor] || 'rgba(249, 250, 251, 0.7)',
    neutralCSS: '#ffffff',
    dividerCSS: dividerColorMap[variation.baseColor] || 'rgba(243, 244, 246, 0.5)',
  };
}