// utils/backgroundUtils.ts - Background CSS generation and utilities
import { SectionBackground, BackgroundCSS, GradientConfig } from '@/types/core';

/**
 * Generate CSS properties for a section background
 */
export function generateBackgroundCSS(background: SectionBackground): BackgroundCSS {
  if (background.type === 'custom' && background.custom) {
    if (background.custom.style === 'solid' && background.custom.solid) {
      return {
        className: '',
        inlineStyles: {
          backgroundColor: background.custom.solid.color,
        },
        cssText: `background-color: ${background.custom.solid.color};`,
      };
    } else if (background.custom.style === 'gradient' && background.custom.gradient) {
      const gradientCSS = generateGradientCSS(background.custom.gradient);
      return {
        className: '',
        inlineStyles: {
          background: gradientCSS,
        },
        cssText: `background: ${gradientCSS};`,
      };
    }
  }
  
  // Fallback to preset background class
  return {
    className: `bg-${background.type}`,
    cssText: '',
  };
}

/**
 * Generate CSS gradient string from gradient configuration
 */
export function generateGradientCSS(gradient: GradientConfig): string {
  const sortedStops = gradient.stops.sort((a, b) => a.position - b.position);
  const stopStrings = sortedStops.map(stop => `${stop.color} ${stop.position}%`);
  
  if (gradient.type === 'linear') {
    return `linear-gradient(${gradient.direction}deg, ${stopStrings.join(', ')})`;
  } else {
    const radialGradient = gradient;
    const centerX = radialGradient.centerX || 50;
    const centerY = radialGradient.centerY || 50;
    const shape = radialGradient.shape || 'ellipse';
    
    return `radial-gradient(${shape} at ${centerX}% ${centerY}%, ${stopStrings.join(', ')})`;
  }
}

/**
 * Check if a background is a custom background
 */
export function isCustomBackground(background: SectionBackground): boolean {
  return background.type === 'custom' && !!background.custom;
}

/**
 * Check if a background is a solid color
 */
export function isSolidBackground(background: SectionBackground): boolean {
  return isCustomBackground(background) && background.custom?.style === 'solid';
}

/**
 * Check if a background is a gradient
 */
export function isGradientBackground(background: SectionBackground): boolean {
  return isCustomBackground(background) && background.custom?.style === 'gradient';
}

/**
 * Extract dominant color from a background for contrast calculations
 */
export function extractDominantColor(background: SectionBackground): string {
  if (isSolidBackground(background) && background.custom?.solid) {
    return background.custom.solid.color;
  } else if (isGradientBackground(background) && background.custom?.gradient) {
    // Return the first stop color as the dominant color
    const firstStop = background.custom.gradient.stops.find(stop => stop.position === 0);
    return firstStop?.color || background.custom.gradient.stops[0]?.color || '#000000';
  }
  
  // Fallback colors for preset backgrounds
  const presetColors = {
    primary: '#3B82F6',
    secondary: '#F8FAFC',
    neutral: '#FFFFFF',
    divider: '#F3F4F6',
  };
  
  return presetColors[background.type as keyof typeof presetColors] || '#000000';
}

/**
 * Convert hex color to RGB values for calculations
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate luminance of a color for contrast ratio calculations
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG standard)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determine WCAG compliance level based on contrast ratio
 */
export function getWCAGLevel(contrastRatio: number): 'AAA' | 'AA' | 'fail' {
  if (contrastRatio >= 7) return 'AAA';
  if (contrastRatio >= 4.5) return 'AA';
  return 'fail';
}

/**
 * Check if a background provides sufficient contrast with white text
 */
export function hasGoodContrastWithWhite(background: SectionBackground): boolean {
  const dominantColor = extractDominantColor(background);
  const contrastRatio = calculateContrastRatio(dominantColor, '#FFFFFF');
  return contrastRatio >= 4.5;
}

/**
 * Check if a background provides sufficient contrast with black text
 */
export function hasGoodContrastWithBlack(background: SectionBackground): boolean {
  const dominantColor = extractDominantColor(background);
  const contrastRatio = calculateContrastRatio(dominantColor, '#000000');
  return contrastRatio >= 4.5;
}

/**
 * Suggest optimal text color for a background
 */
export function suggestTextColor(background: SectionBackground): 'white' | 'black' {
  const whiteContrast = hasGoodContrastWithWhite(background);
  const blackContrast = hasGoodContrastWithBlack(background);
  
  if (whiteContrast && blackContrast) {
    // Both work, prefer black for better readability
    return 'black';
  } else if (whiteContrast) {
    return 'white';
  } else {
    return 'black';
  }
}

/**
 * Generate CSS custom properties for a section background
 */
export function generateBackgroundCustomProperties(
  sectionId: string,
  background: SectionBackground
): Record<string, string> {
  const cssResult = generateBackgroundCSS(background);
  const properties: Record<string, string> = {};
  
  if (cssResult.inlineStyles?.backgroundColor) {
    properties[`--section-${sectionId}-bg-color`] = cssResult.inlineStyles.backgroundColor as string;
  }
  
  if (cssResult.inlineStyles?.background) {
    properties[`--section-${sectionId}-bg`] = cssResult.inlineStyles.background as string;
  }
  
  return properties;
}