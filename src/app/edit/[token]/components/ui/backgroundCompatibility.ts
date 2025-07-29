// /app/edit/[token]/components/ui/backgroundCompatibility.ts
import { bgVariations } from '@/modules/Design/background/bgVariations';

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

interface BackgroundVariation {
  variationId: string;
  variationLabel: string;
  archetypeId: string;
  themeId: string;
  tailwindClass: string;
  baseColor: string;
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
  // console.log('🔍 Finding compatible backgrounds:', { 
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
        console.warn('Unknown compatibility mode:', mode);
        return [];
    }
  } catch (error) {
    console.error('Error finding compatible backgrounds:', error);
    return [];
  }
}

/**
 * Get variations of the current generated background (same archetype, different intensities)
 */
function getGeneratedVariations(currentBackground: BackgroundSystem): BackgroundVariation[] {
  const { baseColor } = currentBackground;
  
  // Find variations that match the current base color and are suitable for generated mode
  const variations = bgVariations.filter(variation => {
    // Match base color
    if (variation.baseColor !== baseColor) return false;
    
    // Prefer soft, professional archetypes for generated mode
    const preferredArchetypes = [
      'soft-gradient-blur',
      'startup-skybox', 
      'glass-morph-with-pop',
      'zen-calm-wave'
    ];
    
    return preferredArchetypes.includes(variation.archetypeId);
  });

  // Sort by preference - soft gradients first, then others
  variations.sort((a, b) => {
    const archetypeOrder = {
      'soft-gradient-blur': 1,
      'startup-skybox': 2,
      'glass-morph-with-pop': 3,
      'zen-calm-wave': 4,
    };
    
    const aOrder = archetypeOrder[a.archetypeId as keyof typeof archetypeOrder] || 5;
    const bOrder = archetypeOrder[b.archetypeId as keyof typeof archetypeOrder] || 5;
    
    return aOrder - bOrder;
  });

  // console.log(`🎨 Found ${variations.length} generated variations for baseColor: ${baseColor}`);
  
  // If no variations found with preferred archetypes, expand search
  if (variations.length === 0) {
    // console.log(`🔍 No preferred archetypes found for ${baseColor}, expanding search...`);
    
    // Try all variations with the same base color
    const allColorVariations = bgVariations.filter(v => v.baseColor === baseColor);
    
    if (allColorVariations.length > 0) {
      // console.log(`✅ Found ${allColorVariations.length} variations with baseColor: ${baseColor}`);
      return allColorVariations.slice(0, 8);
    }
    
    // If still no matches, try harmonious colors
    const harmoniousColors = getHarmoniousColors(baseColor);
    const harmoniousVariations = bgVariations.filter(v => 
      harmoniousColors.includes(v.baseColor) && 
      ['soft-gradient-blur', 'startup-skybox', 'glass-morph-with-pop'].includes(v.archetypeId)
    );
    
    if (harmoniousVariations.length > 0) {
      // console.log(`🎨 Found ${harmoniousVariations.length} harmonious variations`);
      return harmoniousVariations.slice(0, 8);
    }
    
    // Final fallback: return some default professional variations
    // console.log(`⚠️ Using fallback variations for ${baseColor}`);
    const fallbackVariations = bgVariations.filter(v => 
      ['blue', 'gray', 'slate'].includes(v.baseColor) &&
      ['soft-gradient-blur', 'startup-skybox'].includes(v.archetypeId)
    );
    
    return fallbackVariations.slice(0, 8);
  }
  
  return variations.slice(0, 8); // Limit to 8 options
}

/**
 * Get backgrounds compatible with brand colors
 */
function getBrandCompatibleBackgrounds(
  brandColors: BrandColors | null,
  currentBackground: BackgroundSystem
): BackgroundVariation[] {
  if (!brandColors?.primary) {
    console.warn('No brand colors provided for compatibility check');
    return [];
  }

  try {
    // Extract base color family from brand color
    const brandBaseColor = extractBaseColorFromHex(brandColors.primary);
    // console.log('🎨 Extracted brand base color:', brandBaseColor, 'from', brandColors.primary);

    // Find backgrounds that work well with the brand color
    let compatibleVariations = bgVariations.filter(variation => {
      // Direct base color match
      if (variation.baseColor === brandBaseColor) return true;
      
      // Color harmony matches
      const harmonious = getHarmoniousColors(brandBaseColor);
      if (harmonious.includes(variation.baseColor)) return true;
      
      // Neutral backgrounds work with any brand color
      const neutralColors = ['unknown', 'opacity', 'custom'];
      if (neutralColors.includes(variation.baseColor)) return true;
      
      return false;
    });

    // Prioritize certain archetypes for brand mode
    const brandFriendlyArchetypes = [
      'soft-gradient-blur',
      'frosted-glass-light',
      'startup-skybox',
      'trusty-brick-tone',
      'wireframe-blueprint'
    ];

    compatibleVariations = compatibleVariations.filter(variation => 
      brandFriendlyArchetypes.includes(variation.archetypeId)
    );

    // Sort by brand compatibility score
    compatibleVariations.sort((a, b) => {
      const aScore = calculateBrandCompatibilityScore(a, brandColors);
      const bScore = calculateBrandCompatibilityScore(b, brandColors);
      return bScore - aScore; // Higher score first
    });

    // console.log(`🎨 Found ${compatibleVariations.length} brand-compatible backgrounds`);
    return compatibleVariations.slice(0, 12); // More options for brand mode

  } catch (error) {
    console.error('Error finding brand-compatible backgrounds:', error);
    return [];
  }
}

/**
 * Get all custom background options (curated selection)
 */
function getCustomBackgroundOptions(): BackgroundVariation[] {
  // For custom mode, show a curated selection of diverse archetypes
  const customArchetypes = [
    'soft-gradient-blur',
    'frosted-glass-light', 
    'code-matrix-mesh',
    'editorial-split',
    'luxury-blur',
    'energetic-diagonals',
    'paper-texture-light',
    'noise-fade-dark',
    'high-friction-grid',
    'comic-burst',
    'zen-calm-wave',
    'deep-night-space',
    'vibrant-rings',
    'monochrome-hero-zone',
    'blurred-spotlight'
  ];

  // Get representative variations from each archetype
  const customVariations: BackgroundVariation[] = [];
  
  customArchetypes.forEach(archetype => {
    const archetypeVariations = bgVariations.filter(v => v.archetypeId === archetype);
    
    // Take up to 2 variations per archetype
    customVariations.push(...archetypeVariations.slice(0, 2));
  });

  // Sort by visual appeal and diversity
  customVariations.sort((a, b) => {
    // Prioritize visually distinct archetypes
    const visualAppealOrder = {
      'soft-gradient-blur': 1,
      'luxury-blur': 2,
      'energetic-diagonals': 3,
      'frosted-glass-light': 4,
      'comic-burst': 5,
      'deep-night-space': 6,
      'vibrant-rings': 7,
      'code-matrix-mesh': 8,
      'zen-calm-wave': 9,
      'blurred-spotlight': 10,
    };
    
    const aOrder = visualAppealOrder[a.archetypeId as keyof typeof visualAppealOrder] || 11;
    const bOrder = visualAppealOrder[b.archetypeId as keyof typeof visualAppealOrder] || 11;
    
    return aOrder - bOrder;
  });

  // console.log(`🎨 Found ${customVariations.length} custom background options`);
  return customVariations.slice(0, 20); // More options for custom mode
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
    console.warn('Failed to extract base color from hex:', hexColor, error);
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
 * Calculate brand compatibility score
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
  const neutrals = ['unknown', 'opacity', 'custom', 'gray', 'slate', 'zinc'];
  if (neutrals.includes(variation.baseColor)) {
    score += 5;
  }

  // Archetype bonus for brand-friendly designs
  const brandFriendlyBonus: Record<string, number> = {
    'soft-gradient-blur': 3,
    'startup-skybox': 3,
    'trusty-brick-tone': 4,
    'wireframe-blueprint': 2,
    'frosted-glass-light': 2,
    'glass-morph-with-pop': 1,
  };

  score += brandFriendlyBonus[variation.archetypeId] || 0;

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
 * Get background preview data for a variation
 */
export function getBackgroundPreview(variation: BackgroundVariation): {
  primaryClass: string;
  secondaryClass: string;
  neutralClass: string;
  dividerClass: string;
} {
  const baseColor = variation.baseColor === 'unknown' || variation.baseColor === 'opacity' || variation.baseColor === 'custom'
    ? 'gray'
    : variation.baseColor;

  return {
    primaryClass: variation.tailwindClass,
    secondaryClass: `bg-${baseColor}-50`,
    neutralClass: 'bg-white',
    dividerClass: `bg-${baseColor}-100/50`,
  };
}