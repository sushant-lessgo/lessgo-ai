// colorHarmony.ts - Color theory algorithms for accent color selection
// Replaces tag-based matching with mathematical color relationships

import { RGB, HSL, rgbToHsl, analyzeColor, parseColor, calculateContrastRatio } from './colorUtils';

/**
 * Color harmony types based on color theory
 */
export type HarmonyType = 
  | 'complementary'     // Opposite on color wheel (180°)
  | 'analogous'         // Adjacent colors (±30°)
  | 'triadic'          // Three colors equally spaced (120°)
  | 'split-complementary' // Base + two adjacent to complement
  | 'tetradic'         // Four colors in rectangle
  | 'monochromatic';   // Same hue, different saturation/lightness

/**
 * Business context for accent selection
 */
export interface BusinessContext {
  industry?: string;
  tone?: 'professional' | 'playful' | 'luxury' | 'minimal' | 'bold';
  audience?: 'enterprise' | 'consumer' | 'creative' | 'technical';
  goal?: 'trust' | 'action' | 'luxury' | 'energy' | 'calm';
}

/**
 * Accent color candidate with scoring
 */
export interface AccentCandidate {
  color: RGB;
  hex: string;
  hsl: HSL;
  harmonyType: HarmonyType;
  score: number;
  reasoning: string;
  contrastRatio: number;
  isAccessible: boolean;
}

/**
 * Industry-specific color psychology mapping
 */
const INDUSTRY_COLOR_PREFERENCES: Record<string, { preferred: number[], avoid: number[] }> = {
  // Hue values (0-360)
  finance: { 
    preferred: [220, 240, 260], // Blues, trust colors
    avoid: [0, 60, 300] // Avoid red, yellow, magenta (risky feeling)
  },
  healthcare: {
    preferred: [200, 240, 120], // Blue, green (trust, health)
    avoid: [0, 30] // Avoid red, orange (danger, warning)
  },
  technology: {
    preferred: [240, 200, 280], // Blue, cyan, purple (innovation)
    avoid: [60, 30] // Avoid yellow, orange (dated feeling)
  },
  creative: {
    preferred: [280, 300, 320, 340], // Purples, magentas (creativity)
    avoid: [] // Creative industries can use any color
  },
  legal: {
    preferred: [240, 220], // Deep blues (authority, trust)
    avoid: [0, 60, 300] // Avoid bright, playful colors
  },
  education: {
    preferred: [120, 200, 240], // Green, blue (growth, knowledge)
    avoid: [0] // Avoid red (negative associations)
  }
};

/**
 * Convert HSL to RGB
 */
function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  };
}

/**
 * Generate complementary colors (opposite on color wheel)
 */
function generateComplementary(baseHsl: HSL): HSL[] {
  const complementHue = (baseHsl.h + 180) % 360;
  
  return [{
    h: complementHue,
    s: Math.min(100, baseHsl.s + 10), // Slightly more saturated
    l: baseHsl.l > 50 ? baseHsl.l - 20 : baseHsl.l + 20 // Adjust lightness for contrast
  }];
}

/**
 * Generate analogous colors (adjacent on color wheel)
 */
function generateAnalogous(baseHsl: HSL): HSL[] {
  return [
    {
      h: (baseHsl.h + 30) % 360,
      s: baseHsl.s,
      l: baseHsl.l
    },
    {
      h: (baseHsl.h - 30 + 360) % 360,
      s: baseHsl.s,
      l: baseHsl.l
    }
  ];
}

/**
 * Generate triadic colors (120° apart)
 */
function generateTriadic(baseHsl: HSL): HSL[] {
  return [
    {
      h: (baseHsl.h + 120) % 360,
      s: baseHsl.s,
      l: baseHsl.l
    },
    {
      h: (baseHsl.h + 240) % 360,
      s: baseHsl.s,
      l: baseHsl.l
    }
  ];
}

/**
 * Generate split-complementary colors
 */
function generateSplitComplementary(baseHsl: HSL): HSL[] {
  const complement = (baseHsl.h + 180) % 360;
  return [
    {
      h: (complement + 30) % 360,
      s: baseHsl.s,
      l: baseHsl.l
    },
    {
      h: (complement - 30 + 360) % 360,
      s: baseHsl.s,
      l: baseHsl.l
    }
  ];
}

/**
 * Generate monochromatic variations
 */
function generateMonochromatic(baseHsl: HSL): HSL[] {
  return [
    {
      h: baseHsl.h,
      s: Math.min(100, baseHsl.s + 20),
      l: baseHsl.l > 50 ? baseHsl.l - 30 : baseHsl.l + 30
    },
    {
      h: baseHsl.h,
      s: Math.max(0, baseHsl.s - 20),
      l: baseHsl.l > 50 ? baseHsl.l + 20 : baseHsl.l - 20
    }
  ];
}

/**
 * Score accent color based on business context
 */
function scoreAccentColor(
  accent: HSL,
  baseColor: RGB,
  context: BusinessContext,
  harmonyType: HarmonyType
): { score: number; reasoning: string } {
  let score = 50; // Base score
  const reasons: string[] = [];
  
  // Score based on harmony type (color theory strength)
  const harmonyScores = {
    complementary: 90,      // Strongest contrast
    'split-complementary': 80, // Good contrast, more subtle
    triadic: 70,           // Balanced, versatile
    analogous: 60,         // Harmonious, low contrast
    tetradic: 50,          // Complex, needs careful handling
    monochromatic: 40      // Safe but potentially boring
  };
  
  score = harmonyScores[harmonyType];
  reasons.push(`${harmonyType} harmony (${harmonyScores[harmonyType]} base)`);
  
  // Industry preferences
  if (context.industry && INDUSTRY_COLOR_PREFERENCES[context.industry]) {
    const prefs = INDUSTRY_COLOR_PREFERENCES[context.industry];
    
    // Check preferred hues
    const isPreferred = prefs.preferred.some(prefHue => 
      Math.abs(accent.h - prefHue) < 30 || Math.abs(accent.h - prefHue) > 330
    );
    if (isPreferred) {
      score += 15;
      reasons.push('industry-preferred hue');
    }
    
    // Check avoided hues
    const isAvoided = prefs.avoid.some(avoidHue => 
      Math.abs(accent.h - avoidHue) < 20
    );
    if (isAvoided) {
      score -= 25;
      reasons.push('industry-avoided hue');
    }
  }
  
  // Tone-based adjustments
  if (context.tone) {
    switch (context.tone) {
      case 'professional':
        // Prefer muted, authoritative colors
        if (accent.s < 60) score += 10;
        if (accent.l > 30 && accent.l < 70) score += 10;
        reasons.push('professional tone adjustment');
        break;
        
      case 'playful':
        // Prefer bright, saturated colors
        if (accent.s > 70) score += 15;
        if (accent.l > 50) score += 5;
        reasons.push('playful tone adjustment');
        break;
        
      case 'luxury':
        // Prefer deep, rich colors or high contrast
        if ((accent.l < 40 && accent.s > 50) || accent.l > 80) score += 20;
        reasons.push('luxury tone adjustment');
        break;
        
      case 'minimal':
        // Prefer subtle, understated colors
        if (accent.s < 50 && Math.abs(accent.l - 50) < 30) score += 10;
        reasons.push('minimal tone adjustment');
        break;
        
      case 'bold':
        // Prefer high contrast, saturated colors
        if (accent.s > 80 && (accent.l < 30 || accent.l > 70)) score += 20;
        reasons.push('bold tone adjustment');
        break;
    }
  }
  
  // Goal-based adjustments
  if (context.goal) {
    switch (context.goal) {
      case 'trust':
        // Blues and greens score higher
        if ((accent.h > 200 && accent.h < 260) || (accent.h > 100 && accent.h < 160)) {
          score += 15;
          reasons.push('trust-building color');
        }
        break;
        
      case 'action':
        // Oranges score higher (call-to-action) - red excluded
        if (accent.h > 15 && accent.h < 60) { // Only orange range, not red
          score += 20;
          reasons.push('action-driving color');
        }
        break;
        
      case 'energy':
        // Bright, warm colors
        if (accent.s > 70 && accent.l > 40 && accent.h < 180) {
          score += 15;
          reasons.push('energetic color');
        }
        break;
        
      case 'calm':
        // Cool, muted colors
        if (accent.h > 180 && accent.s < 60) {
          score += 15;
          reasons.push('calming color');
        }
        break;
    }
  }
  
  // Saturation and lightness balance
  if (accent.s > 30 && accent.s < 80) {
    score += 5; // Good saturation range
    reasons.push('balanced saturation');
  }
  
  if (accent.l > 25 && accent.l < 75) {
    score += 5; // Good lightness range
    reasons.push('balanced lightness');
  }
  
  return {
    score: Math.min(100, Math.max(0, score)),
    reasoning: reasons.join(', ')
  };
}

/**
 * Generate accent color candidates using color harmony
 */
export function generateAccentCandidates(
  baseColorStr: string,
  context: BusinessContext = {}
): AccentCandidate[] {
  const baseRgb = parseColor(baseColorStr);
  if (!baseRgb) {
    console.warn('Could not parse base color:', baseColorStr);
    return [];
  }
  
  const baseHsl = rgbToHsl(baseRgb);
  const candidates: AccentCandidate[] = [];
  
  // Generate candidates for each harmony type
  const generators: Array<{ type: HarmonyType; fn: (hsl: HSL) => HSL[] }> = [
    { type: 'complementary', fn: generateComplementary },
    { type: 'analogous', fn: generateAnalogous },
    { type: 'triadic', fn: generateTriadic },
    { type: 'split-complementary', fn: generateSplitComplementary },
    { type: 'monochromatic', fn: generateMonochromatic }
  ];
  
  for (const { type, fn } of generators) {
    const harmonies = fn(baseHsl);
    
    for (const harmonyHsl of harmonies) {
      const accentRgb = hslToRgb(harmonyHsl);
      const contrastRatio = calculateContrastRatio(baseRgb, accentRgb);
      const { score, reasoning } = scoreAccentColor(harmonyHsl, baseRgb, context, type);
      
      candidates.push({
        color: accentRgb,
        hex: `#${accentRgb.r.toString(16).padStart(2, '0')}${accentRgb.g.toString(16).padStart(2, '0')}${accentRgb.b.toString(16).padStart(2, '0')}`,
        hsl: harmonyHsl,
        harmonyType: type,
        score,
        reasoning,
        contrastRatio,
        isAccessible: contrastRatio >= 4.5 // WCAG AA standard
      });
    }
  }
  
  // Sort by score (descending)
  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Select the best accent color based on context
 */
export function selectBestAccent(
  baseColorStr: string,
  context: BusinessContext = {},
  options: {
    requireAccessible?: boolean;
    preferredHarmony?: HarmonyType;
    minContrast?: number;
  } = {}
): AccentCandidate | null {
  const candidates = generateAccentCandidates(baseColorStr, context);
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Filter candidates based on requirements
  let filteredCandidates = candidates;
  
  if (options.requireAccessible) {
    filteredCandidates = filteredCandidates.filter(c => c.isAccessible);
  }
  
  if (options.minContrast) {
    filteredCandidates = filteredCandidates.filter(c => c.contrastRatio >= options.minContrast!);
  }
  
  if (options.preferredHarmony) {
    const preferred = filteredCandidates.filter(c => c.harmonyType === options.preferredHarmony);
    if (preferred.length > 0) {
      filteredCandidates = preferred;
    }
  }
  
  // Return the highest scoring candidate
  return filteredCandidates.length > 0 ? filteredCandidates[0] : candidates[0];
}

/**
 * Generate multiple accent colors for a complete palette
 */
export function generateAccentPalette(
  baseColorStr: string,
  context: BusinessContext = {},
  count: number = 3
): AccentCandidate[] {
  const candidates = generateAccentCandidates(baseColorStr, context);
  
  // Select diverse candidates (different harmony types)
  const selected: AccentCandidate[] = [];
  const usedHarmonyTypes = new Set<HarmonyType>();
  
  for (const candidate of candidates) {
    if (selected.length >= count) break;
    
    // Prefer diversity in harmony types
    if (!usedHarmonyTypes.has(candidate.harmonyType) || selected.length === 0) {
      selected.push(candidate);
      usedHarmonyTypes.add(candidate.harmonyType);
    }
  }
  
  // Fill remaining slots with highest scoring candidates
  for (const candidate of candidates) {
    if (selected.length >= count) break;
    if (!selected.includes(candidate)) {
      selected.push(candidate);
    }
  }
  
  return selected.slice(0, count);
}

/**
 * Helper function to get HSL values from color name
 */
function getColorHslFromName(colorName: string): HSL | null {
  const colorHues: Record<string, number> = {
    red: 0,
    orange: 30,
    amber: 45,
    yellow: 60,
    lime: 75,
    green: 120,
    emerald: 160,
    teal: 180,
    cyan: 190,
    sky: 200,
    blue: 220,
    indigo: 240,
    purple: 280,
    pink: 330,
    rose: 345,
    gray: 0,
    slate: 220,
    zinc: 240,
  };
  
  const hue = colorHues[colorName.toLowerCase()];
  if (hue === undefined) return null;
  
  // Return typical saturation/lightness for Tailwind colors
  return {
    h: hue,
    s: colorName === 'gray' || colorName === 'slate' || colorName === 'zinc' ? 10 : 70,
    l: 50
  };
}

/**
 * Helper function to map business context
 */
function mapBusinessContext(businessContext: {
  marketCategory?: string;
  targetAudience?: string;
  landingPageGoals?: string;
  toneProfile?: string;
}): BusinessContext {
  const context: BusinessContext = {};
  
  // Map market category to industry
  if (businessContext.marketCategory) {
    const categoryMap: Record<string, string> = {
      'finance': 'finance',
      'healthcare': 'healthcare',
      'technology': 'technology',
      'creative': 'creative',
      'legal': 'legal',
      'education': 'education'
    };
    
    const category = businessContext.marketCategory.toLowerCase();
    for (const [key, industry] of Object.entries(categoryMap)) {
      if (category.includes(key)) {
        context.industry = industry;
        break;
      }
    }
  }
  
  // Map tone profile to tone
  if (businessContext.toneProfile) {
    const toneMap: Record<string, BusinessContext['tone']> = {
      'professional': 'professional',
      'minimal': 'minimal',
      'bold': 'bold',
      'luxury': 'luxury',
      'playful': 'playful'
    };
    
    context.tone = toneMap[businessContext.toneProfile] || 'professional';
  }
  
  // Map landing goals to goals
  if (businessContext.landingPageGoals) {
    const goalMap: Record<string, BusinessContext['goal']> = {
      'signup': 'action',
      'purchase': 'action',
      'trust': 'trust',
      'contact': 'trust',
      'download': 'action'
    };
    
    context.goal = goalMap[businessContext.landingPageGoals] || 'action';
  }
  
  // Map audience to audience
  if (businessContext.targetAudience) {
    const audienceMap: Record<string, BusinessContext['audience']> = {
      'enterprise': 'enterprise',
      'business': 'enterprise',
      'consumer': 'consumer',
      'creative': 'creative',
      'developer': 'technical',
      'technical': 'technical'
    };
    
    const audience = businessContext.targetAudience.toLowerCase();
    for (const [key, audienceType] of Object.entries(audienceMap)) {
      if (audience.includes(key)) {
        context.audience = audienceType;
        break;
      }
    }
  }
  
  return context;
}

/**
 * Quick utility function for the existing system
 * Now uses curated accentOptions when available, falls back to dynamic generation
 */
export function getSmartAccentColor(
  baseColorStr: string,
  businessContext: {
    marketCategory?: string;
    targetAudience?: string;
    landingPageGoals?: string;
    toneProfile?: string;
  } = {}
): { accentColor: string; accentCSS: string; confidence: number } {
  
  // ✅ FIRST: Try to use curated accent options
  try {
    const { accentOptions } = require('../modules/Design/ColorSystem/accentOptions');
    
    // Check if we have curated options for this base color
    const curatedOptions = accentOptions.filter((opt: any) => 
      opt.baseColor === baseColorStr || 
      opt.baseColor === baseColorStr.toLowerCase()
    );
    
    if (curatedOptions.length > 0) {
      // Score each curated option using our harmony intelligence
      const scoredOptions = curatedOptions.map((option: any) => {
        // Parse the accent color to get HSL for scoring
        const accentHsl = getColorHslFromName(option.accentColor);
        const baseRgb = parseColor(baseColorStr);
        
        if (!accentHsl || !baseRgb) {
          return { ...option, score: 50 };
        }
        
        // Determine harmony type from tags
        let harmonyType: HarmonyType = 'analogous';
        if (option.tags.includes('complementary')) harmonyType = 'complementary';
        else if (option.tags.includes('triadic')) harmonyType = 'triadic';
        else if (option.tags.includes('split-complementary')) harmonyType = 'split-complementary';
        else if (option.tags.includes('monochromatic')) harmonyType = 'monochromatic';
        
        // Score using our intelligent system
        const { score } = scoreAccentColor(accentHsl, baseRgb, mapBusinessContext(businessContext), harmonyType);
        
        return { ...option, score };
      });
      
      // Sort by score and select the best
      scoredOptions.sort((a: any, b: any) => b.score - a.score);
      const bestOption = scoredOptions[0];
      
      console.log('✅ Using curated accent option:', {
        baseColor: baseColorStr,
        selectedAccent: bestOption.accentColor,
        score: bestOption.score,
        tailwind: bestOption.tailwind
      });
      
      return {
        accentColor: bestOption.accentColor,
        accentCSS: bestOption.tailwind, // Use the optimized tailwind class from accentOptions
        confidence: bestOption.score / 100
      };
    }
  } catch (error) {
    console.warn('Could not load accent options, falling back to dynamic generation');
  }
  
  // ✅ FALLBACK: Dynamic generation for unknown base colors
  console.log('⚠️ No curated options for base color:', baseColorStr, '- using dynamic generation');
  
  const context = mapBusinessContext(businessContext);
  
  // Select best accent
  const bestAccent = selectBestAccent(baseColorStr, context, {
    requireAccessible: true,
    minContrast: 3.0
  });
  
  if (bestAccent) {
    // Extract color name for Tailwind CSS (approximate)
    const hue = bestAccent.hsl.h;
    let colorName = 'purple'; // Default fallback
    
    // ✅ Red removed for CTA use - use orange instead
    if (hue >= 345 || hue < 15) colorName = 'orange'; // Red hues → Orange for CTAs
    else if (hue < 45) colorName = 'orange';
    else if (hue < 75) colorName = 'yellow';
    else if (hue < 165) colorName = 'green';
    else if (hue < 195) colorName = 'cyan';
    else if (hue < 255) colorName = 'blue';
    else if (hue < 285) colorName = 'indigo';
    else if (hue < 315) colorName = 'purple';
    else colorName = 'pink';
    
    return {
      accentColor: colorName,
      accentCSS: `bg-${colorName}-500`, // ✅ Use 500 shade for CTAs
      confidence: bestAccent.score / 100
    };
  }
  
  // Fallback to safe default
  return {
    accentColor: 'purple',
    accentCSS: 'bg-purple-500', // ✅ Use 500 shade for fallback
    confidence: 0.3
  };
}