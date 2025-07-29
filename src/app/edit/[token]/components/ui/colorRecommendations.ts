// colorRecommendations.ts - Smart color recommendations based on background
import { parseColor, calculateLuminance } from '@/utils/colorUtils';
import { validateWCAGContrast } from '@/utils/improvedTextColors';
import type { ColorOption } from './ColorSystemModalMVP';

interface ColorRecommendation extends ColorOption {
  score: number;
  reason: string;
}

// Extended color palette with multiple weights
const COLOR_PALETTE = {
  // Cool colors
  blue: {
    300: { hex: '#93c5fd', name: 'Sky Blue' },
    400: { hex: '#60a5fa', name: 'Bright Blue' },
    500: { hex: '#3b82f6', name: 'Blue' },
    600: { hex: '#2563eb', name: 'Deep Blue' },
  },
  cyan: {
    300: { hex: '#67e8f9', name: 'Light Cyan' },
    400: { hex: '#22d3ee', name: 'Cyan' },
    500: { hex: '#06b6d4', name: 'Teal Cyan' },
  },
  teal: {
    300: { hex: '#5eead4', name: 'Mint' },
    400: { hex: '#2dd4bf', name: 'Bright Teal' },
    500: { hex: '#14b8a6', name: 'Teal' },
    600: { hex: '#0d9488', name: 'Deep Teal' },
  },
  // Warm colors
  green: {
    300: { hex: '#86efac', name: 'Light Green' },
    400: { hex: '#4ade80', name: 'Bright Green' },
    500: { hex: '#22c55e', name: 'Green' },
    600: { hex: '#16a34a', name: 'Forest Green' },
  },
  lime: {
    300: { hex: '#bef264', name: 'Light Lime' },
    400: { hex: '#a3e635', name: 'Lime' },
    500: { hex: '#84cc16', name: 'Bright Lime' },
  },
  yellow: {
    300: { hex: '#fde047', name: 'Light Yellow' },
    400: { hex: '#facc15', name: 'Gold' },
    500: { hex: '#eab308', name: 'Amber' },
  },
  orange: {
    400: { hex: '#fb923c', name: 'Light Orange' },
    500: { hex: '#f97316', name: 'Orange' },
    600: { hex: '#ea580c', name: 'Deep Orange' },
  },
  red: {
    400: { hex: '#f87171', name: 'Light Red' },
    500: { hex: '#ef4444', name: 'Red' },
    600: { hex: '#dc2626', name: 'Deep Red' },
  },
  pink: {
    400: { hex: '#f472b6', name: 'Light Pink' },
    500: { hex: '#ec4899', name: 'Pink' },
    600: { hex: '#db2777', name: 'Hot Pink' },
  },
  purple: {
    400: { hex: '#c084fc', name: 'Light Purple' },
    500: { hex: '#a855f7', name: 'Purple' },
    600: { hex: '#9333ea', name: 'Deep Purple' },
  },
  indigo: {
    400: { hex: '#818cf8', name: 'Light Indigo' },
    500: { hex: '#6366f1', name: 'Indigo' },
    600: { hex: '#4f46e5', name: 'Deep Indigo' },
  },
};

/**
 * Determine if a background is dark or light
 */
export function isBackgroundDark(backgroundColor: string): boolean {
  const rgb = parseColor(backgroundColor);
  if (!rgb) return false;
  
  const luminance = calculateLuminance(rgb);
  return luminance < 0.3; // Dark if luminance is less than 30%
}

/**
 * Calculate stand-out score for a color on a background
 */
function calculateScore(colorHex: string, backgroundColor: string): number {
  try {
    const { ratio } = validateWCAGContrast(colorHex, backgroundColor);
    
    // Convert ratio to 0-100 score
    if (ratio >= 15) return 95 + Math.min(5, (ratio - 15) * 0.5);
    if (ratio >= 7) return 70 + ((ratio - 7) / 8) * 25;
    if (ratio >= 4.5) return 50 + ((ratio - 4.5) / 2.5) * 20;
    return Math.max(0, (ratio / 4.5) * 50);
  } catch {
    return 0;
  }
}

/**
 * Get color recommendations based on background
 */
export function getColorRecommendations(
  backgroundColor: string,
  currentColor?: string
): {
  recommended: ColorRecommendation[];
  allColors: ColorOption[];
} {
  const isDark = isBackgroundDark(backgroundColor);
  const recommendations: ColorRecommendation[] = [];
  const allColors: ColorOption[] = [];
  
  // Determine which weights to prioritize
  const priorityWeights = isDark ? [300, 400, 500] : [600, 700, 800];
  const secondaryWeights = isDark ? [500, 600] : [400, 500];
  
  // Process all colors
  Object.entries(COLOR_PALETTE).forEach(([colorName, weights]) => {
    // Check priority weights first
    priorityWeights.forEach(weight => {
      const colorData = weights[weight as keyof typeof weights];
      if (!colorData) return;
      
      const tailwindClass = `bg-${colorName}-${weight}`;
      const score = calculateScore(colorData.hex, backgroundColor);
      
      const colorOption: ColorOption = {
        name: colorData.name,
        value: colorName,
        tailwindClass,
        hex: colorData.hex,
      };
      
      allColors.push(colorOption);
      
      // Add to recommendations if score is high
      if (score >= 85) {
        recommendations.push({
          ...colorOption,
          score,
          reason: score >= 95 ? 'Perfect contrast' : 'Excellent visibility',
        });
      }
    });
    
    // Add secondary weights to all colors
    secondaryWeights.forEach(weight => {
      const colorData = weights[weight as keyof typeof weights];
      if (!colorData || priorityWeights.includes(weight)) return;
      
      const tailwindClass = `bg-${colorName}-${weight}`;
      
      allColors.push({
        name: colorData.name,
        value: colorName,
        tailwindClass,
        hex: colorData.hex,
      });
    });
  });
  
  // Sort recommendations by score
  recommendations.sort((a, b) => b.score - a.score);
  
  // Limit to top 6 recommendations
  const topRecommendations = recommendations.slice(0, 6);
  
  // If we don't have enough high-scoring options, add some good ones
  if (topRecommendations.length < 4) {
    const goodColors = allColors
      .map(color => ({
        ...color,
        score: calculateScore(color.hex, backgroundColor),
        reason: 'Good visibility',
      }))
      .filter(c => c.score >= 70 && c.score < 85)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4 - topRecommendations.length);
    
    topRecommendations.push(...goodColors);
  }
  
  return {
    recommended: topRecommendations,
    allColors: allColors.slice(0, 16), // Limit to manageable number
  };
}

/**
 * Get standard preset colors (the original 8)
 */
export function getStandardPresets(): ColorOption[] {
  return [
    { name: 'Purple', value: 'purple', tailwindClass: 'bg-purple-600', hex: '#9333ea' },
    { name: 'Blue', value: 'blue', tailwindClass: 'bg-blue-600', hex: '#2563eb' },
    { name: 'Green', value: 'green', tailwindClass: 'bg-green-600', hex: '#16a34a' },
    { name: 'Red', value: 'red', tailwindClass: 'bg-red-600', hex: '#dc2626' },
    { name: 'Orange', value: 'orange', tailwindClass: 'bg-orange-600', hex: '#ea580c' },
    { name: 'Pink', value: 'pink', tailwindClass: 'bg-pink-600', hex: '#db2777' },
    { name: 'Indigo', value: 'indigo', tailwindClass: 'bg-indigo-600', hex: '#4f46e5' },
    { name: 'Teal', value: 'teal', tailwindClass: 'bg-teal-600', hex: '#0d9488' },
  ];
}