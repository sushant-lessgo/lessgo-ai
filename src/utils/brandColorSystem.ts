// brandColorSystem.ts - Brand color override and integration system
// Allows users to integrate their brand colors while maintaining accessibility

import { 
  parseColor, 
  analyzeColor, 
  validateColorAccessibility, 
  ContrastLevel,
  RGB,
  ColorAnalysis
} from './colorUtils';
import { 
  generateAccentCandidates, 
  selectBestAccent, 
  BusinessContext 
} from './colorHarmony';
import { analyzeBackground } from './backgroundAnalysis';

/**
 * Brand color configuration
 */
export interface BrandColors {
  primary?: string;        // Main brand color
  secondary?: string;      // Secondary brand color  
  accent?: string;         // Accent/CTA color
  neutral?: string;        // Neutral/background color
  text?: {
    heading?: string;      // Brand heading color
    body?: string;         // Brand body text color
    muted?: string;        // Brand muted text color
  };
}

/**
 * Brand color validation result
 */
export interface BrandColorValidation {
  isValid: boolean;
  issues: Array<{
    color: string;
    field: string;
    issue: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
  }>;
  adaptedColors: BrandColors;
  confidence: number;
}

/**
 * Brand integration options
 */
export interface BrandIntegrationOptions {
  preserveBrandColors?: boolean;    // Try to keep original colors even if accessibility fails
  adaptForAccessibility?: boolean;  // Modify brand colors to meet WCAG requirements
  requireWCAG?: 'AA' | 'AAA';      // Required WCAG level
  generateMissingColors?: boolean;   // Auto-generate missing brand colors
  businessContext?: BusinessContext; // For smart color generation
}

/**
 * Validate and adapt brand colors for accessibility
 */
export function validateBrandColors(
  brandColors: BrandColors,
  backgroundSystem: any,
  options: BrandIntegrationOptions = {}
): BrandColorValidation {
  
  const issues: BrandColorValidation['issues'] = [];
  const adaptedColors: BrandColors = { ...brandColors };
  let totalScore = 0;
  let validationCount = 0;

  // Validate primary brand color
  if (brandColors.primary) {
    const primaryAnalysis = validateBrandColor(
      brandColors.primary,
      'primary',
      backgroundSystem.neutral || '#ffffff',
      options
    );
    
    if (!primaryAnalysis.isValid) {
      issues.push(...primaryAnalysis.issues);
      if (options.adaptForAccessibility && primaryAnalysis.adaptedColor) {
        adaptedColors.primary = primaryAnalysis.adaptedColor;
      }
    }
    
    totalScore += primaryAnalysis.score;
    validationCount++;
  }

  // Validate secondary brand color
  if (brandColors.secondary) {
    const secondaryAnalysis = validateBrandColor(
      brandColors.secondary,
      'secondary',
      backgroundSystem.neutral || '#ffffff',
      options
    );
    
    if (!secondaryAnalysis.isValid) {
      issues.push(...secondaryAnalysis.issues);
      if (options.adaptForAccessibility && secondaryAnalysis.adaptedColor) {
        adaptedColors.secondary = secondaryAnalysis.adaptedColor;
      }
    }
    
    totalScore += secondaryAnalysis.score;
    validationCount++;
  }

  // Validate accent color
  if (brandColors.accent) {
    const accentAnalysis = validateBrandColor(
      brandColors.accent,
      'accent',
      backgroundSystem.neutral || '#ffffff',
      options
    );
    
    if (!accentAnalysis.isValid) {
      issues.push(...accentAnalysis.issues);
      if (options.adaptForAccessibility && accentAnalysis.adaptedColor) {
        adaptedColors.accent = accentAnalysis.adaptedColor;
      }
    }
    
    totalScore += accentAnalysis.score;
    validationCount++;
  }

  // Validate text colors against various backgrounds
  if (brandColors.text) {
    const textValidation = validateBrandTextColors(
      brandColors.text,
      backgroundSystem,
      options
    );
    
    issues.push(...textValidation.issues);
    if (options.adaptForAccessibility) {
      adaptedColors.text = textValidation.adaptedText;
    }
    
    totalScore += textValidation.score;
    validationCount++;
  }

  // Generate missing colors if requested
  if (options.generateMissingColors) {
    const generatedColors = generateMissingBrandColors(
      adaptedColors,
      backgroundSystem,
      options.businessContext
    );
    
    Object.assign(adaptedColors, generatedColors);
    
    if (Object.keys(generatedColors).length > 0) {
      issues.push({
        color: 'generated',
        field: 'missing_colors',
        issue: `Generated ${Object.keys(generatedColors).length} missing brand colors`,
        severity: 'info',
        suggestion: 'Review generated colors to ensure they match your brand'
      });
    }
  }

  const confidence = validationCount > 0 ? totalScore / validationCount : 0.5;
  const isValid = issues.filter(i => i.severity === 'error').length === 0;

  return {
    isValid,
    issues,
    adaptedColors,
    confidence
  };
}

/**
 * Validate a single brand color
 */
function validateBrandColor(
  color: string,
  field: string,
  backgroundColor: string,
  options: BrandIntegrationOptions
): {
  isValid: boolean;
  issues: BrandColorValidation['issues'];
  adaptedColor?: string;
  score: number;
} {
  
  const issues: BrandColorValidation['issues'] = [];
  let score = 0.5;
  let adaptedColor: string | undefined;

  // Parse and analyze the color
  const colorAnalysis = analyzeColor(color);
  if (!colorAnalysis) {
    return {
      isValid: false,
      issues: [{
        color,
        field,
        issue: 'Invalid color format',
        severity: 'error',
        suggestion: 'Use valid CSS color format (hex, rgb, named color)'
      }],
      score: 0
    };
  }

  // Check contrast against background
  const contrastValidation = validateColorAccessibility(color, backgroundColor);
  const requiredLevel = options.requireWCAG === 'AAA' ? ContrastLevel.AAA_NORMAL : ContrastLevel.AA_NORMAL;

  if (contrastValidation.contrastRatio < requiredLevel) {
    const severity = contrastValidation.contrastRatio < ContrastLevel.AA_LARGE ? 'error' : 'warning';
    
    issues.push({
      color,
      field,
      issue: `Insufficient contrast ratio (${contrastValidation.contrastRatio.toFixed(2)}:1, required ${requiredLevel}:1)`,
      severity,
      suggestion: severity === 'error' ? 
        'Increase contrast by making the color darker or lighter' :
        'Consider improving contrast for better accessibility'
    });

    // Attempt to adapt the color if requested
    if (options.adaptForAccessibility) {
      adaptedColor = adaptColorForContrast(colorAnalysis, backgroundColor, requiredLevel);
      if (adaptedColor) {
        score = 0.7; // Partial score for adapted color
      }
    }
  } else {
    score = Math.min(1.0, contrastValidation.contrastRatio / 21); // Normalize to 0-1
  }

  // Check for problematic color characteristics
  if (colorAnalysis.hsl.s < 10) {
    issues.push({
      color,
      field,
      issue: 'Very low saturation - color appears gray',
      severity: 'warning',
      suggestion: 'Consider increasing saturation for better brand recognition'
    });
  }

  if (colorAnalysis.hsl.l < 10 || colorAnalysis.hsl.l > 90) {
    issues.push({
      color,
      field,
      issue: 'Extreme lightness - may be hard to use consistently',
      severity: 'warning',
      suggestion: 'Consider using a more moderate lightness value'
    });
  }

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    adaptedColor,
    score
  };
}

/**
 * Validate brand text colors against different backgrounds
 */
function validateBrandTextColors(
  textColors: NonNullable<BrandColors['text']>,
  backgroundSystem: any,
  options: BrandIntegrationOptions
): {
  issues: BrandColorValidation['issues'];
  adaptedText: NonNullable<BrandColors['text']>;
  score: number;
} {
  
  const issues: BrandColorValidation['issues'] = [];
  const adaptedText: NonNullable<BrandColors['text']> = { ...textColors };
  const backgroundTypes = ['primary', 'secondary', 'neutral', 'divider'];
  let totalScore = 0;
  let testCount = 0;

  // Test each text color against each background type
  for (const bgType of backgroundTypes) {
    const bgColor = backgroundSystem[bgType] || '#ffffff';
    const bgAnalysis = analyzeBackground(bgColor);

    // Test heading color
    if (textColors.heading) {
      const validation = validateColorAccessibility(textColors.heading, bgAnalysis.averageColor ? 
        `rgb(${bgAnalysis.averageColor.r}, ${bgAnalysis.averageColor.g}, ${bgAnalysis.averageColor.b})` : 
        '#ffffff'
      );
      
      if (!validation.isValid) {
        issues.push({
          color: textColors.heading,
          field: `text.heading_on_${bgType}`,
          issue: `Poor contrast on ${bgType} background (${validation.contrastRatio.toFixed(2)}:1)`,
          severity: validation.contrastRatio < 3 ? 'error' : 'warning',
          suggestion: `Adjust heading color for better contrast on ${bgType} backgrounds`
        });
      }
      
      totalScore += Math.min(1, validation.contrastRatio / 21);
      testCount++;
    }

    // Test body color
    if (textColors.body) {
      const validation = validateColorAccessibility(textColors.body, bgAnalysis.averageColor ? 
        `rgb(${bgAnalysis.averageColor.r}, ${bgAnalysis.averageColor.g}, ${bgAnalysis.averageColor.b})` : 
        '#ffffff'
      );
      
      if (!validation.isValid) {
        issues.push({
          color: textColors.body,
          field: `text.body_on_${bgType}`,
          issue: `Poor contrast on ${bgType} background (${validation.contrastRatio.toFixed(2)}:1)`,
          severity: 'warning',
          suggestion: `Adjust body text color for better readability on ${bgType} backgrounds`
        });
      }
      
      totalScore += Math.min(1, validation.contrastRatio / 21);
      testCount++;
    }
  }

  // Adapt colors if needed and requested
  if (options.adaptForAccessibility) {
    // For now, keep original colors but this could be enhanced
    // to actually adapt the colors based on the worst-performing background
  }

  return {
    issues,
    adaptedText,
    score: testCount > 0 ? totalScore / testCount : 0.5
  };
}

/**
 * Generate missing brand colors based on existing ones
 */
function generateMissingBrandColors(
  existingColors: BrandColors,
  backgroundSystem: any,
  businessContext?: BusinessContext
): Partial<BrandColors> {
  
  const generated: Partial<BrandColors> = {};

  // If we have a primary but no accent, generate accent from primary
  if (existingColors.primary && !existingColors.accent) {
    const accentCandidates = generateAccentCandidates(existingColors.primary, businessContext);
    const bestAccent = accentCandidates.find(c => c.isAccessible) || accentCandidates[0];
    
    if (bestAccent) {
      generated.accent = bestAccent.hex;
    }
  }

  // If we have primary but no secondary, generate a lighter/darker variant
  if (existingColors.primary && !existingColors.secondary) {
    const primaryAnalysis = analyzeColor(existingColors.primary);
    if (primaryAnalysis) {
      // Create a lighter version for secondary
      const secondaryHsl = { 
        ...primaryAnalysis.hsl, 
        l: Math.min(90, primaryAnalysis.hsl.l + 30),
        s: Math.max(10, primaryAnalysis.hsl.s - 20)
      };
      
      generated.secondary = hslToCss(secondaryHsl);
    }
  }

  // Generate neutral if missing
  if (!existingColors.neutral) {
    generated.neutral = '#f9fafb'; // Light gray default
  }

  return generated;
}

/**
 * Adapt a color to meet contrast requirements
 */
function adaptColorForContrast(
  colorAnalysis: ColorAnalysis,
  backgroundColor: string,
  requiredRatio: number
): string | undefined {
  
  const bgAnalysis = analyzeColor(backgroundColor);
  if (!bgAnalysis) return undefined;

  // Determine if we need to make the color lighter or darker
  const needsDarker = bgAnalysis.isLight;
  
  // Try adjusting lightness in steps
  for (let adjustment = 10; adjustment <= 80; adjustment += 10) {
    const newLightness = needsDarker ? 
      Math.max(5, colorAnalysis.hsl.l - adjustment) :
      Math.min(95, colorAnalysis.hsl.l + adjustment);
    
    const adaptedHsl = { ...colorAnalysis.hsl, l: newLightness };
    const adaptedCss = hslToCss(adaptedHsl);
    const adaptedAnalysis = analyzeColor(adaptedCss);
    
    if (adaptedAnalysis) {
      const contrastRatio = Math.max(
        bgAnalysis.luminance + 0.05,
        adaptedAnalysis.luminance + 0.05
      ) / Math.min(
        bgAnalysis.luminance + 0.05,
        adaptedAnalysis.luminance + 0.05
      );
      
      if (contrastRatio >= requiredRatio) {
        return adaptedCss;
      }
    }
  }

  return undefined;
}

/**
 * Convert HSL to CSS string
 */
function hslToCss(hsl: { h: number; s: number; l: number }): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Apply brand colors to background system
 */
export function applyBrandColorsToSystem(
  brandColors: BrandColors,
  backgroundSystem: any,
  options: BrandIntegrationOptions = {}
): any {
  
  const validation = validateBrandColors(brandColors, backgroundSystem, options);
  const colorsToUse = validation.adaptedColors;
  
  // Apply brand colors to system while maintaining structure
  const brandedSystem = { ...backgroundSystem };
  
  if (colorsToUse.primary) {
    // Use brand primary for primary backgrounds, but ensure it works
    const primaryAnalysis = analyzeColor(colorsToUse.primary);
    if (primaryAnalysis && primaryAnalysis.hsl.s > 20) {
      brandedSystem.primary = `bg-gradient-to-br from-[${colorsToUse.primary}] to-[${adjustColorLightness(colorsToUse.primary, -10)}]`;
      brandedSystem.baseColor = 'brand-primary';
    }
  }
  
  if (colorsToUse.secondary) {
    brandedSystem.secondary = `bg-[${colorsToUse.secondary}]/70`;
  }
  
  if (colorsToUse.accent) {
    brandedSystem.accentColor = 'brand-accent';
    brandedSystem.accentCSS = `bg-[${colorsToUse.accent}]`;
  }
  
  if (colorsToUse.neutral) {
    brandedSystem.neutral = `bg-[${colorsToUse.neutral}]`;
  }

  return {
    system: brandedSystem,
    validation,
    brandColors: colorsToUse
  };
}

/**
 * Adjust color lightness by a percentage
 */
function adjustColorLightness(color: string, adjustment: number): string {
  const analysis = analyzeColor(color);
  if (!analysis) return color;
  
  const newLightness = Math.min(100, Math.max(0, analysis.hsl.l + adjustment));
  return hslToCss({ ...analysis.hsl, l: newLightness });
}

/**
 * Quick utility to check if brand colors are provided and valid
 */
export function hasBrandColors(brandColors?: BrandColors): boolean {
  if (!brandColors) return false;
  
  const hasColors = !!(
    brandColors.primary || 
    brandColors.secondary || 
    brandColors.accent || 
    brandColors.text?.heading ||
    brandColors.text?.body
  );
  
  return hasColors;
}

/**
 * Get brand color recommendations based on business context
 */
export function getBrandColorRecommendations(
  businessContext: BusinessContext
): {
  recommendations: Array<{
    color: string;
    name: string;
    usage: string;
    reasoning: string;
  }>;
  warnings: string[];
} {
  
  const recommendations: Array<{
    color: string;
    name: string;
    usage: string;
    reasoning: string;
  }> = [];
  
  const warnings: string[] = [];
  
  // Industry-specific recommendations
  if (businessContext.industry) {
    switch (businessContext.industry) {
      case 'finance':
        recommendations.push({
          color: '#1e40af', // Blue-800
          name: 'Trust Blue',
          usage: 'Primary brand color',
          reasoning: 'Blue conveys trust and stability in financial services'
        });
        break;
        
      case 'healthcare':
        recommendations.push({
          color: '#059669', // Emerald-600
          name: 'Health Green',
          usage: 'Primary brand color',
          reasoning: 'Green represents health, growth, and healing'
        });
        break;
        
      case 'technology':
        recommendations.push({
          color: '#7c3aed', // Violet-600
          name: 'Innovation Purple',
          usage: 'Primary brand color',
          reasoning: 'Purple suggests innovation and cutting-edge technology'
        });
        break;
    }
  }
  
  // Tone-specific recommendations
  if (businessContext.tone) {
    switch (businessContext.tone) {
      case 'luxury':
        if (!recommendations.some(r => r.color.includes('black') || r.color.includes('#000'))) {
          recommendations.push({
            color: '#000000',
            name: 'Luxury Black',
            usage: 'Text and accents',
            reasoning: 'Black conveys premium quality and sophistication'
          });
        }
        break;
        
      case 'playful':
        recommendations.push({
          color: '#f59e0b', // Amber-500
          name: 'Playful Orange',
          usage: 'Accent color',
          reasoning: 'Orange is energetic and friendly for playful brands'
        });
        break;
    }
  }
  
  // Add warnings for problematic combinations
  if (businessContext.industry === 'healthcare' && businessContext.tone === 'bold') {
    warnings.push('Bold tone might conflict with healthcare trust requirements - consider balancing boldness with trustworthiness');
  }
  
  return { recommendations, warnings };
}