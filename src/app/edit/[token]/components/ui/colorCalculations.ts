// Color calculation utilities for custom background colors
"use client";

export interface CustomColors {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
  isSecondaryAuto: boolean;
  isNeutralAuto: boolean;
  isDividerAuto: boolean;
}

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate secondary color based on primary
 * Strategy: Use a lighter, more subdued version of the primary
 */
export function calculateSecondaryColor(primary: string): string {
  try {
    const [h, s, l] = hexToHsl(primary);
    
    // Make it lighter and less saturated
    const newLightness = Math.min(0.95, l + 0.3); // Much lighter
    const newSaturation = Math.max(0.1, s * 0.3); // Less saturated
    
    return hslToHex(h, newSaturation, newLightness);
  } catch (error) {
    return '#F8FAFC'; // Light gray fallback
  }
}

/**
 * Calculate neutral color that works well with primary
 * Strategy: Use warm or cool grays based on primary's temperature
 */
export function calculateNeutralColor(primary: string): string {
  try {
    const [h, s, l] = hexToHsl(primary);
    
    // Determine if primary is warm or cool
    const isWarm = (h >= 30 && h <= 90) || (h >= 300 && h <= 360) || (h >= 0 && h <= 30);
    
    // Use slightly tinted neutral
    let neutralHue = h;
    if (isWarm) {
      neutralHue = 35; // Warm gray (slightly orange-tinted)
    } else {
      neutralHue = 210; // Cool gray (slightly blue-tinted)
    }
    
    return hslToHex(neutralHue, 0.05, 0.97); // Very light, barely tinted
  } catch (error) {
    return '#FFFFFF'; // White fallback
  }
}

/**
 * Calculate divider color based on primary and neutral
 * Strategy: Semi-transparent version of primary over neutral
 */
export function calculateDividerColor(primary: string, neutral: string): string {
  try {
    const [primaryH, primaryS, primaryL] = hexToHsl(primary);
    
    // Create a very light version of the primary color
    const dividerLightness = Math.max(0.85, primaryL * 1.5);
    const dividerSaturation = Math.max(0.1, primaryS * 0.2);
    
    return hslToHex(primaryH, dividerSaturation, dividerLightness);
  } catch (error) {
    return '#E5E7EB'; // Light gray fallback
  }
}

/**
 * Validate that a color provides sufficient contrast
 */
export function validateColorContrast(foreground: string, background: string): boolean {
  try {
    // Simple lightness-based contrast check
    const [, , fgL] = hexToHsl(foreground);
    const [, , bgL] = hexToHsl(background);
    
    const contrast = Math.abs(fgL - bgL);
    return contrast > 0.3; // Minimum contrast threshold
  } catch (error) {
    return true; // Assume valid if calculation fails
  }
}

/**
 * Generate a complete custom color scheme from a primary color
 */
export function generateCustomColorScheme(primary: string): CustomColors {
  const secondary = calculateSecondaryColor(primary);
  const neutral = calculateNeutralColor(primary);
  const divider = calculateDividerColor(primary, neutral);

  return {
    primary,
    secondary,
    neutral,
    divider,
    isSecondaryAuto: true,
    isNeutralAuto: true,
    isDividerAuto: true,
  };
}

/**
 * Update specific color in scheme while maintaining auto-calculated relationships
 */
export function updateColorScheme(
  currentScheme: CustomColors,
  colorType: 'primary' | 'secondary' | 'neutral' | 'divider',
  newColor: string,
  isManual: boolean = true
): CustomColors {
  const updatedScheme = { ...currentScheme };
  
  // Update the specified color
  updatedScheme[colorType] = newColor;
  
  // Mark as manual if user changed it directly
  if (colorType === 'secondary') updatedScheme.isSecondaryAuto = !isManual;
  if (colorType === 'neutral') updatedScheme.isNeutralAuto = !isManual;
  if (colorType === 'divider') updatedScheme.isDividerAuto = !isManual;

  // If primary changed, recalculate auto colors
  if (colorType === 'primary') {
    if (updatedScheme.isSecondaryAuto) {
      updatedScheme.secondary = calculateSecondaryColor(newColor);
    }
    if (updatedScheme.isNeutralAuto) {
      updatedScheme.neutral = calculateNeutralColor(newColor);
    }
    if (updatedScheme.isDividerAuto) {
      updatedScheme.divider = calculateDividerColor(newColor, updatedScheme.neutral);
    }
  }

  // If neutral changed and divider is auto, recalculate divider
  if (colorType === 'neutral' && updatedScheme.isDividerAuto) {
    updatedScheme.divider = calculateDividerColor(updatedScheme.primary, newColor);
  }

  return updatedScheme;
}

/**
 * Get popular brand color presets
 */
export function getPopularBrandColors(): Array<{ name: string; color: string; category: string }> {
  return [
    // Technology
    { name: 'Twitter Blue', color: '#1DA1F2', category: 'Tech' },
    { name: 'Facebook Blue', color: '#4267B2', category: 'Tech' },
    { name: 'LinkedIn Blue', color: '#0077B5', category: 'Tech' },
    { name: 'Slack Purple', color: '#4A154B', category: 'Tech' },
    
    // Creative
    { name: 'Dribbble Pink', color: '#EA4C89', category: 'Creative' },
    { name: 'Behance Blue', color: '#1769FF', category: 'Creative' },
    { name: 'Adobe Red', color: '#FF0000', category: 'Creative' },
    
    // Business
    { name: 'Professional Blue', color: '#2563EB', category: 'Business' },
    { name: 'Success Green', color: '#059669', category: 'Business' },
    { name: 'Premium Purple', color: '#7C3AED', category: 'Business' },
    
    // E-commerce
    { name: 'Shopify Green', color: '#7AB55C', category: 'E-commerce' },
    { name: 'Stripe Purple', color: '#635BFF', category: 'E-commerce' },
    { name: 'PayPal Blue', color: '#003087', category: 'E-commerce' },
  ];
}