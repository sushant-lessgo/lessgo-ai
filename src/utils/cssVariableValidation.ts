// CSS Variable Validation Utilities
// Used to validate the CSS variable migration integration

import { getMigrationFeatureFlags, determineMigrationPhase, checkBrowserCompatibility } from '@/utils/featureFlags';
import type { FeatureFlagContext, MigrationPhase } from '@/utils/featureFlags';

export interface ValidationResult {
  success: boolean;
  phase: MigrationPhase;
  warnings: string[];
  errors: string[];
  details: {
    featureFlags: any;
    browserSupport: any;
    cssVariables: Record<string, string>;
    recommendations: string[];
  };
}

/**
 * Validate CSS variable system for a given token
 */
export function validateCSSVariableSystem(tokenId: string): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Get feature flags for this token
    const context: FeatureFlagContext = { tokenId };
    const flags = getMigrationFeatureFlags(context);
    const phase = determineMigrationPhase(flags, context);
    
    // Check browser compatibility
    const browserSupport = checkBrowserCompatibility();
    
    // Validate phase configuration
    if (phase === 'variable' && browserSupport.recommendsLegacyMode) {
      warnings.push('Variable mode enabled but browser compatibility is poor');
      recommendations.push('Consider enabling hybrid mode with legacy fallbacks');
    }
    
    if (phase === 'legacy' && flags.rolloutPercentage > 0) {
      warnings.push('Legacy mode active despite rollout percentage being set');
      recommendations.push('Check feature flag configuration');
    }
    
    // Validate feature flag consistency
    if (flags.enableVariableMode && !flags.enableHybridMode && !flags.enableLegacyFallbacks) {
      errors.push('Variable mode enabled without hybrid mode or legacy fallbacks - this could break the application');
      recommendations.push('Enable hybrid mode or legacy fallbacks for safety');
    }
    
    // Check for CSS variable support
    const cssVariables = extractCSSVariablesFromDOM();
    
    if (phase !== 'legacy' && Object.keys(cssVariables).length === 0) {
      warnings.push('CSS variable system enabled but no variables found in DOM');
      recommendations.push('Check VariableThemeInjector integration');
    }
    
    // Development environment checks
    if (process.env.NODE_ENV === 'development') {
      if (!flags.enableMigrationDebug) {
        recommendations.push('Enable migration debug mode for better development experience');
      }
      
      if (flags.rolloutPercentage !== 100) {
        recommendations.push('Consider setting rollout percentage to 100% in development');
      }
    }
    
    return {
      success: errors.length === 0,
      phase,
      warnings,
      errors,
      details: {
        featureFlags: flags,
        browserSupport,
        cssVariables,
        recommendations,
      }
    };
    
  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      success: false,
      phase: 'legacy',
      warnings,
      errors,
      details: {
        featureFlags: null,
        browserSupport: null,
        cssVariables: {},
        recommendations: ['Fix validation errors and retry'],
      }
    };
  }
}

/**
 * Extract CSS variables from DOM
 */
function extractCSSVariablesFromDOM(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const cssVariables: Record<string, string> = {};
  
  try {
    // Get computed styles from root element
    const rootStyles = window.getComputedStyle(document.documentElement);
    
    // Extract CSS custom properties (--variables)
    for (let i = 0; i < rootStyles.length; i++) {
      const property = rootStyles[i];
      if (property.startsWith('--')) {
        const value = rootStyles.getPropertyValue(property).trim();
        if (value) {
          cssVariables[property] = value;
        }
      }
    }
    
    // Also check for variables in style tags
    const styleTags = document.querySelectorAll('style[data-variable-injector]');
    styleTags.forEach(styleTag => {
      const content = styleTag.textContent || '';
      const variableMatches = content.match(/--[\w-]+:\s*[^;]+;/g);
      
      if (variableMatches) {
        variableMatches.forEach(match => {
          const [property, value] = match.split(':');
          if (property && value) {
            cssVariables[property.trim()] = value.replace(';', '').trim();
          }
        });
      }
    });
    
  } catch (error) {
    console.warn('Failed to extract CSS variables from DOM:', error);
  }
  
  return cssVariables;
}

/**
 * Test CSS variable functionality
 */
export function testCSSVariableInjection(tokenId: string): Promise<{
  success: boolean;
  variablesInjected: number;
  testResults: Array<{
    property: string;
    expected: string;
    actual: string;
    matches: boolean;
  }>;
}> {
  return new Promise((resolve) => {
    // Wait for DOM to be ready
    setTimeout(() => {
      const cssVariables = extractCSSVariablesFromDOM();
      const variablesInjected = Object.keys(cssVariables).length;
      
      // Test some common variables
      const testVariables = [
        '--bg-primary',
        '--bg-secondary', 
        '--color-accent',
        '--color-text-primary',
      ];
      
      const testResults = testVariables.map(property => {
        const actual = cssVariables[property] || '';
        const expected = 'any-value'; // We just check if it exists
        const matches = actual.length > 0;
        
        return {
          property,
          expected,
          actual,
          matches,
        };
      });
      
      const success = testResults.some(test => test.matches) || variablesInjected > 0;
      
      resolve({
        success,
        variablesInjected,
        testResults,
      });
    }, 100);
  });
}

/**
 * Log validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  console.group('🎨 CSS Variable System Validation');
  
  console.log(`✅ Phase: ${result.phase}`);
  console.log(`🎯 Success: ${result.success}`);
  
  if (result.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    result.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  if (result.errors.length > 0) {
    console.group('❌ Errors:');
    result.errors.forEach(error => console.error(error));
    console.groupEnd();
  }
  
  if (result.details.recommendations.length > 0) {
    console.group('💡 Recommendations:');
    result.details.recommendations.forEach(rec => console.log(rec));
    console.groupEnd();
  }
  
  console.log('📊 CSS Variables found:', Object.keys(result.details.cssVariables).length);
  console.log('🌐 Browser support:', result.details.browserSupport);
  
  console.groupEnd();
}

/**
 * Run comprehensive validation
 */
export async function runCSSVariableValidation(tokenId: string): Promise<ValidationResult> {
  console.log('🔍 Starting CSS variable validation...');
  
  // Run basic validation
  const result = validateCSSVariableSystem(tokenId);
  
  // Test injection if variables should be active
  if (result.phase !== 'legacy') {
    try {
      const injectionTest = await testCSSVariableInjection(tokenId);
      
      if (!injectionTest.success) {
        result.errors.push('CSS variable injection test failed');
        result.details.recommendations.push('Check VariableThemeInjector integration');
      } else {
        console.log(`✅ CSS variable injection test passed: ${injectionTest.variablesInjected} variables found`);
      }
    } catch (error) {
      result.warnings.push(`CSS variable injection test failed: ${error}`);
    }
  }
  
  // Log results
  logValidationResults(result);
  
  return result;
}