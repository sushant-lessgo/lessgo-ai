// utils/contrastValidator.ts - WCAG accessibility validation for backgrounds
import { SectionBackground, BackgroundValidation } from '@/types/core';
import { 
  extractDominantColor, 
  calculateContrastRatio, 
  getWCAGLevel,
  hasGoodContrastWithWhite,
  hasGoodContrastWithBlack 
} from './backgroundUtils';

/**
 * Validate background accessibility and contrast
 */
export function validateBackgroundAccessibility(
  background: SectionBackground,
  textColor: 'white' | 'black' = 'black'
): BackgroundValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const dominantColor = extractDominantColor(background);
    const targetTextColor = textColor === 'white' ? '#FFFFFF' : '#000000';
    const contrastRatio = calculateContrastRatio(dominantColor, targetTextColor);
    const wcagLevel = getWCAGLevel(contrastRatio);
    
    // Check contrast requirements
    if (wcagLevel === 'fail') {
      errors.push(`Insufficient contrast ratio (${contrastRatio.toFixed(2)}:1). Minimum required is 4.5:1 for WCAG AA compliance.`);
    } else if (wcagLevel === 'AA') {
      warnings.push(`Good contrast ratio (${contrastRatio.toFixed(2)}:1) meets WCAG AA standards. Consider improving to 7:1 for AAA compliance.`);
    }
    
    // Check gradient complexity for readability
    if (background.type === 'custom' && background.custom?.style === 'gradient') {
      const gradient = background.custom.gradient;
      if (gradient && gradient.stops.length > 4) {
        warnings.push('Complex gradients with many color stops may reduce text readability.');
      }
      
      // Check contrast between gradient stops
      if (gradient && gradient.stops.length >= 2) {
        const firstStop = gradient.stops[0];
        const lastStop = gradient.stops[gradient.stops.length - 1];
        const stopContrast = calculateContrastRatio(firstStop.color, lastStop.color);
        
        if (stopContrast < 1.5) {
          warnings.push('Low contrast between gradient colors may create readability issues in some areas.');
        }
      }
    }
    
    // Check for color blindness considerations
    if (background.type === 'custom' && background.custom?.solid) {
      const color = background.custom.solid.color.toLowerCase();
      
      // Check for problematic color combinations
      if (color.includes('red') && textColor === 'black') {
        warnings.push('Red backgrounds may be difficult for users with protanopia (red color blindness).');
      } else if (color.includes('green') && textColor === 'black') {
        warnings.push('Green backgrounds may be difficult for users with deuteranopia (green color blindness).');
      }
    }
    
    return {
      isValid: errors.length === 0,
      contrastRatio,
      wcagLevel,
      warnings,
      errors,
    };
    
  } catch (error) {
    return {
      isValid: false,
      warnings: [],
      errors: ['Unable to validate background accessibility. Please check your color values.'],
    };
  }
}

/**
 * Get accessibility recommendations for a background
 */
export function getAccessibilityRecommendations(background: SectionBackground): string[] {
  const recommendations: string[] = [];
  
  const whiteContrast = hasGoodContrastWithWhite(background);
  const blackContrast = hasGoodContrastWithBlack(background);
  
  if (!whiteContrast && !blackContrast) {
    recommendations.push('Consider using a lighter or darker background color to improve text readability.');
  } else if (whiteContrast && !blackContrast) {
    recommendations.push('Use white or light-colored text on this background for best readability.');
  } else if (!whiteContrast && blackContrast) {
    recommendations.push('Use black or dark-colored text on this background for best readability.');
  }
  
  // Gradient-specific recommendations
  if (background.type === 'custom' && background.custom?.style === 'gradient') {
    recommendations.push('Consider adding a semi-transparent overlay to ensure consistent text readability across the gradient.');
    recommendations.push('Test your content with different text colors to ensure readability in all areas of the gradient.');
  }
  
  // General accessibility recommendations
  recommendations.push('Always test your backgrounds with your actual content to ensure readability.');
  recommendations.push('Consider users with visual impairments and color blindness when choosing colors.');
  
  return recommendations;
}

/**
 * Check if a background is safe for users with color blindness
 */
export function isColorBlindnessSafe(background: SectionBackground): boolean {
  if (background.type === 'custom' && background.custom?.solid) {
    const color = extractDominantColor(background);
    
    // Simple check - avoid pure reds and greens without sufficient contrast
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const [r, g, b] = rgb.map(Number);
      
      // Check for red-green issues (most common color blindness)
      const isProblematicRed = r > 200 && g < 100 && b < 100;
      const isProblematicGreen = g > 200 && r < 100 && b < 100;
      
      return !(isProblematicRed || isProblematicGreen);
    }
  }
  
  // Gradients and preset backgrounds are generally safer
  return true;
}

/**
 * Suggest alternative colors for better accessibility
 */
export function suggestAccessibleAlternatives(background: SectionBackground): string[] {
  const suggestions: string[] = [];
  const validation = validateBackgroundAccessibility(background);
  
  if (!validation.isValid) {
    // Suggest adjustments based on current background
    if (background.type === 'custom' && background.custom?.solid) {
      const currentColor = background.custom.solid.color;
      
      // Suggest lighter and darker versions
      suggestions.push('Try a lighter shade of the same color');
      suggestions.push('Try a darker shade of the same color');
      suggestions.push('Add a semi-transparent overlay to improve contrast');
    } else if (background.type === 'custom' && background.custom?.gradient) {
      suggestions.push('Reduce the number of color stops in your gradient');
      suggestions.push('Increase contrast between gradient colors');
      suggestions.push('Consider using a solid color instead of a gradient');
    }
    
    // General suggestions
    suggestions.push('Use neutral colors (grays, whites) for better contrast');
    suggestions.push('Test with both light and dark text colors');
  }
  
  return suggestions;
}