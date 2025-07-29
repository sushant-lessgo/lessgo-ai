// backgroundAnalysis.ts - Advanced background analysis for proper text color selection
// Replaces fragile string matching with actual color parsing

import { parseColor, calculateLuminance, RGB, analyzeColor, ColorAnalysis } from './colorUtils';

/**
 * Types of background patterns we can analyze
 */
export type BackgroundType = 
  | 'solid'
  | 'linear-gradient' 
  | 'radial-gradient'
  | 'conic-gradient'
  | 'image'
  | 'complex';

/**
 * Gradient direction information
 */
export interface GradientDirection {
  angle?: number;
  direction?: 'to-top' | 'to-bottom' | 'to-left' | 'to-right' | 'to-top-left' | 'to-top-right' | 'to-bottom-left' | 'to-bottom-right';
}

/**
 * Color stop in a gradient
 */
export interface ColorStop {
  color: RGB;
  position?: number; // 0-100
  analysis: ColorAnalysis;
}

/**
 * Comprehensive background analysis result
 */
export interface BackgroundAnalysis {
  type: BackgroundType;
  dominantColor: RGB;
  averageColor: RGB;
  luminance: number;
  isLight: boolean;
  isDark: boolean;
  hasHighContrast: boolean;
  colorStops?: ColorStop[];
  direction?: GradientDirection;
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number; // 0-1, how confident we are in the analysis
  fallbackColors: {
    heading: string;
    body: string;
    muted: string;
  };
}

/**
 * Parse Tailwind color classes to actual color values
 */
const TAILWIND_COLORS: Record<string, string> = {
  // Grays
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  
  // Slates (modern grays)
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  
  // Zinc (neutral grays)
  'zinc-50': '#fafafa',
  'zinc-100': '#f4f4f5',
  'zinc-200': '#e4e4e7',
  'zinc-300': '#d4d4d8',
  'zinc-400': '#a1a1aa',
  'zinc-500': '#71717a',
  'zinc-600': '#52525b',
  'zinc-700': '#3f3f46',
  'zinc-800': '#27272a',
  'zinc-900': '#18181b',
  
  // Stone (warm grays)
  'stone-50': '#fafaf9',
  'stone-100': '#f5f5f4',
  'stone-200': '#e7e5e4',
  'stone-300': '#d6d3d1',
  'stone-400': '#a8a29e',
  'stone-500': '#78716c',
  'stone-600': '#57534e',
  'stone-700': '#44403c',
  'stone-800': '#292524',
  'stone-900': '#1c1917',
  
  // Blues
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-200': '#bfdbfe',
  'blue-300': '#93c5fd',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'blue-800': '#1e40af',
  'blue-900': '#1e3a8a',
  
  // Indigo
  'indigo-50': '#eef2ff',
  'indigo-100': '#e0e7ff',
  'indigo-200': '#c7d2fe',
  'indigo-300': '#a5b4fc',
  'indigo-400': '#818cf8',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  'indigo-800': '#3730a3',
  'indigo-900': '#312e81',
  
  // Purples
  'purple-50': '#faf5ff',
  'purple-100': '#f3e8ff',
  'purple-200': '#e9d5ff',
  'purple-300': '#d8b4fe',
  'purple-400': '#c084fc',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'purple-700': '#7c3aed',
  'purple-800': '#6b21a8',
  'purple-900': '#581c87',
  
  // Violets
  'violet-50': '#f5f3ff',
  'violet-100': '#ede9fe',
  'violet-200': '#ddd6fe',
  'violet-300': '#c4b5fd',
  'violet-400': '#a78bfa',
  'violet-500': '#8b5cf6',
  'violet-600': '#7c3aed',
  'violet-700': '#6d28d9',
  'violet-800': '#5b21b6',
  'violet-900': '#4c1d95',
  
  // Emerald
  'emerald-50': '#ecfdf5',
  'emerald-100': '#d1fae5',
  'emerald-200': '#a7f3d0',
  'emerald-300': '#6ee7b7',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'emerald-700': '#047857',
  'emerald-800': '#065f46',
  'emerald-900': '#064e3b',
  
  // Green
  'green-50': '#f0fdf4',
  'green-100': '#dcfce7',
  'green-200': '#bbf7d0',
  'green-300': '#86efac',
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'green-700': '#15803d',
  'green-800': '#166534',
  'green-900': '#14532d',
  
  // Teal
  'teal-50': '#f0fdfa',
  'teal-100': '#ccfbf1',
  'teal-200': '#99f6e4',
  'teal-300': '#5eead4',
  'teal-400': '#2dd4bf',
  'teal-500': '#14b8a6',
  'teal-600': '#0d9488',
  'teal-700': '#0f766e',
  'teal-800': '#115e59',
  'teal-900': '#134e4a',
  
  // Common colors
  'white': '#ffffff',
  'black': '#000000',
  'transparent': 'transparent'
};

/**
 * Extract colors from Tailwind CSS classes
 */
function extractTailwindColors(cssClass: string): string[] {
  const colors: string[] = [];
  
  // console.log('🔍 extractTailwindColors input:', cssClass);
  
  // Match patterns like bg-blue-500, from-purple-600, to-white, etc.
  const colorMatches = cssClass.match(/(?:bg-|from-|via-|to-)([a-z]+-\d+|[a-z]+)/g);
  
  // console.log('🔍 regex matches:', colorMatches);
  
  if (colorMatches) {
    for (const match of colorMatches) {
      const colorName = match.replace(/^(?:bg-|from-|via-|to-)/, '');
      const colorValue = TAILWIND_COLORS[colorName];
      // console.log('🔍 processing match:', match, '→ colorName:', colorName, '→ colorValue:', colorValue);
      if (colorValue && colorValue !== 'transparent') {
        colors.push(colorValue);
      }
    }
  }
  
  // console.log('🔍 final extracted colors:', colors);
  return colors;
}

/**
 * Parse CSS gradient strings to extract colors
 */
function parseGradientColors(gradientStr: string): { colors: string[], type: BackgroundType } {
  const colors: string[] = [];
  let type: BackgroundType = 'linear-gradient';
  
  // Determine gradient type
  if (gradientStr.includes('radial-gradient')) {
    type = 'radial-gradient';
  } else if (gradientStr.includes('conic-gradient')) {
    type = 'conic-gradient';
  }
  
  // Extract color values - match hex, rgb, rgba, and named colors
  const colorMatches = gradientStr.match(/#[a-f0-9]{3,6}|rgba?\([^)]+\)|[a-z]+(?=\s|,|$)/gi);
  
  if (colorMatches) {
    colors.push(...colorMatches);
  }
  
  return { colors, type };
}

/**
 * Calculate average color from multiple colors
 */
function calculateAverageColor(colors: RGB[]): RGB {
  if (colors.length === 0) {
    return { r: 128, g: 128, b: 128 }; // Gray fallback
  }
  
  const sum = colors.reduce((acc, color) => ({
    r: acc.r + color.r,
    g: acc.g + color.g,
    b: acc.b + color.b
  }), { r: 0, g: 0, b: 0 });
  
  return {
    r: Math.round(sum.r / colors.length),
    g: Math.round(sum.g / colors.length),
    b: Math.round(sum.b / colors.length)
  };
}

/**
 * Find the dominant color (most saturated or most contrasting)
 */
function findDominantColor(colors: RGB[]): RGB {
  if (colors.length === 0) {
    return { r: 128, g: 128, b: 128 };
  }
  
  if (colors.length === 1) {
    return colors[0];
  }
  
  // Find the color with highest saturation or most extreme luminance
  let dominantColor = colors[0];
  let maxScore = 0;
  
  for (const color of colors) {
    const luminance = calculateLuminance(color);
    const analysis = analyzeColor(`rgb(${color.r}, ${color.g}, ${color.b})`);
    
    if (analysis) {
      // Score based on saturation and extremity of luminance
      const saturationScore = analysis.hsl.s / 100;
      const luminanceScore = Math.abs(luminance - 0.5) * 2; // 0 at middle gray, 1 at extremes
      const totalScore = saturationScore * 0.6 + luminanceScore * 0.4;
      
      if (totalScore > maxScore) {
        maxScore = totalScore;
        dominantColor = color;
      }
    }
  }
  
  return dominantColor;
}

/**
 * Analyze background complexity
 */
function analyzeComplexity(
  type: BackgroundType,
  colorCount: number,
  hasEffects: boolean
): { complexity: 'simple' | 'moderate' | 'complex', confidence: number } {
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  let confidence = 1.0;
  
  if (type === 'solid') {
    complexity = 'simple';
    confidence = 1.0;
  } else if (type === 'linear-gradient' && colorCount <= 2) {
    complexity = 'simple';
    confidence = 0.9;
  } else if (type === 'linear-gradient' && colorCount <= 4) {
    complexity = 'moderate';
    confidence = 0.8;
  } else if (type === 'radial-gradient' || type === 'conic-gradient') {
    complexity = 'moderate';
    confidence = 0.7;
  } else {
    complexity = 'complex';
    confidence = 0.6;
  }
  
  // Reduce confidence if there are additional effects
  if (hasEffects) {
    confidence = Math.max(0.3, confidence - 0.2);
  }
  
  return { complexity, confidence };
}

/**
 * Generate safe fallback text colors based on background analysis
 */
function generateFallbackColors(
  averageLuminance: number,
  dominantLuminance: number,
  complexity: 'simple' | 'moderate' | 'complex'
): { heading: string; body: string; muted: string } {
  
  // For complex backgrounds, be more conservative
  const luminanceThreshold = complexity === 'complex' ? 0.6 : 0.5;
  const isLightBackground = averageLuminance > luminanceThreshold;
  
  if (isLightBackground) {
    // Light background - use dark text with proper hierarchy
    return {
      heading: '#111827',  // gray-900 - strongest contrast
      body: '#374151',     // gray-700 - readable body text
      muted: '#6b7280'     // gray-500 - muted text
    };
  } else {
    // Dark background - use light text
    return {
      heading: '#f9fafb',  // gray-50 - brightest
      body: '#e5e7eb',     // gray-200 - readable light text
      muted: '#9ca3af'     // gray-400 - muted light text
    };
  }
}

/**
 * Main function to analyze any background CSS
 */
export function analyzeBackground(cssClass: string): BackgroundAnalysis {
  try {
    // Handle empty or invalid input
    if (!cssClass || typeof cssClass !== 'string') {
      console.warn('🔍 Background analysis: Invalid CSS class:', cssClass);
      return createFallbackAnalysis('Invalid CSS class provided');
    }
    
    const cleanClass = cssClass.trim().toLowerCase();
    // console.log('🔍 Background analysis starting for:', cssClass, '→', cleanClass);
    
    // Check for effects that might affect readability
    const hasBlur = cleanClass.includes('blur-');
    const hasOpacity = cleanClass.includes('opacity-') || cleanClass.includes('/');
    const hasShadow = cleanClass.includes('shadow-');
    const hasEffects = hasBlur || hasOpacity || hasShadow;
    
    let colors: string[] = [];
    let type: BackgroundType = 'solid';
    
    // Extract colors from different sources
    if (cleanClass.includes('gradient')) {
      // Handle CSS gradient syntax
      const gradientResult = parseGradientColors(cleanClass);
      colors = gradientResult.colors;
      type = gradientResult.type;
    } else {
      // Handle Tailwind classes
      colors = extractTailwindColors(cleanClass);
      type = 'solid';
      // console.log('🔍 Extracted Tailwind colors:', colors);
    }
    
    // If no colors found, try to extract from CSS values
    if (colors.length === 0) {
      // console.log('🔍 No Tailwind colors found, trying CSS values...');
      const colorMatches = cleanClass.match(/#[a-f0-9]{3,6}|rgba?\([^)]+\)/g);
      if (colorMatches) {
        colors = colorMatches;
        // console.log('🔍 Found CSS colors:', colorMatches);
      }
    }
    
    // Parse colors to RGB
    const rgbColors: RGB[] = [];
    const colorStops: ColorStop[] = [];
    
    for (let i = 0; i < colors.length; i++) {
      const rgb = parseColor(colors[i]);
      if (rgb) {
        rgbColors.push(rgb);
        const analysis = analyzeColor(colors[i]);
        if (analysis) {
          colorStops.push({
            color: rgb,
            position: colors.length > 1 ? (i / (colors.length - 1)) * 100 : 50,
            analysis
          });
        }
      }
    }
    
    // Handle case where no valid colors were found
    if (rgbColors.length === 0) {
      console.warn('🔍 No valid RGB colors found for:', cssClass, 'extracted colors:', colors);
      return createFallbackAnalysis('No valid colors found in CSS class');
    }
    
    // console.log('🔍 Successfully parsed RGB colors:', rgbColors.length, 'colors');
    
    // Calculate dominant and average colors
    const dominantColor = findDominantColor(rgbColors);
    const averageColor = calculateAverageColor(rgbColors);
    
    // Calculate luminance values
    const dominantLuminance = calculateLuminance(dominantColor);
    const averageLuminance = calculateLuminance(averageColor);
    
    // console.log('🔍 Luminance calculation:', {
    //   dominantColor,
    //   averageColor,
    //   dominantLuminance: dominantLuminance.toFixed(3),
    //   averageLuminance: averageLuminance.toFixed(3),
    //   shouldBeLight: averageLuminance > 0.5
    // });
    
    // Determine if background has high contrast (big difference between colors)
    const luminances = rgbColors.map(calculateLuminance);
    const maxLuminance = Math.max(...luminances);
    const minLuminance = Math.min(...luminances);
    const hasHighContrast = (maxLuminance - minLuminance) > 0.5;
    
    // Analyze complexity
    const { complexity, confidence } = analyzeComplexity(type, rgbColors.length, hasEffects);
    
    // Generate fallback colors
    const fallbackColors = generateFallbackColors(averageLuminance, dominantLuminance, complexity);
    
    return {
      type,
      dominantColor,
      averageColor,
      luminance: averageLuminance,
      isLight: averageLuminance > 0.5,
      isDark: averageLuminance <= 0.5,
      hasHighContrast,
      colorStops,
      complexity,
      confidence,
      fallbackColors
    };
    
  } catch (error) {
    console.warn('Background analysis failed:', error);
    return createFallbackAnalysis('Analysis failed due to error');
  }
}

/**
 * Create a safe fallback analysis when parsing fails
 */
function createFallbackAnalysis(reason: string): BackgroundAnalysis {
  console.warn('⚠️ Using fallback background analysis:', reason);
  
  // Assume a neutral background
  const neutralColor: RGB = { r: 248, g: 250, b: 252 }; // gray-50
  
  return {
    type: 'solid',
    dominantColor: neutralColor,
    averageColor: neutralColor,
    luminance: calculateLuminance(neutralColor),
    isLight: true,
    isDark: false,
    hasHighContrast: false,
    complexity: 'simple',
    confidence: 0.5, // Low confidence since this is a fallback
    fallbackColors: {
      heading: '#111827',  // gray-900
      body: '#374151',     // gray-700
      muted: '#6b7280'     // gray-500
    }
  };
}

/**
 * Get optimal text colors based on background analysis
 */
export function getTextColorsFromBackground(
  analysis: BackgroundAnalysis,
  options: {
    preferHighContrast?: boolean;
    requireWCAG?: 'AA' | 'AAA';
  } = {}
): { heading: string; body: string; muted: string; confidence: number } {
  
  // For complex or low-confidence analysis, use fallbacks
  if (analysis.complexity === 'complex' || analysis.confidence < 0.7) {
    return {
      ...analysis.fallbackColors,
      confidence: analysis.confidence
    };
  }
  
  // For high-contrast backgrounds, be more conservative
  if (analysis.hasHighContrast) {
    return {
      ...analysis.fallbackColors,
      confidence: Math.min(analysis.confidence, 0.8)
    };
  }
  
  // For simple backgrounds, we can be more precise
  const isLight = analysis.luminance > 0.5;
  
  if (isLight) {
    return {
      heading: '#111827',  // gray-900 
      body: '#374151',     // gray-700
      muted: '#6b7280',    // gray-500
      confidence: analysis.confidence
    };
  } else {
    return {
      heading: '#f9fafb',  // gray-50
      body: '#e5e7eb',     // gray-200  
      muted: '#9ca3af',    // gray-400
      confidence: analysis.confidence
    };
  }
}

/**
 * Quick utility to get text colors from CSS class
 */
export function getTextColorsFromCSS(cssClass: string): { heading: string; body: string; muted: string } {
  const analysis = analyzeBackground(cssClass);
  const textColors = getTextColorsFromBackground(analysis);
  return {
    heading: textColors.heading,
    body: textColors.body,
    muted: textColors.muted
  };
}