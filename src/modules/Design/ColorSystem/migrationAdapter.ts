// Migration Adapter System for CSS Variable Migration
// Converts legacy bgVariations to variable-based system with fallbacks

import { backgroundPatternAnalyzer, BackgroundPatternAnalyzer } from './BackgroundPatternAnalyzer';
import type { BackgroundSystem } from './colorTokens';

// Type definitions for migration
export interface LegacyBackgroundVariation {
  variationId: string;
  variationLabel: string;
  archetypeId: string;
  themeId: string;
  tailwindClass: string;
  baseColor: string;
}

export interface VariableBackgroundVariation {
  variationId: string;
  variationLabel: string;
  archetypeId: string;
  themeId: string;
  baseColor: string;
  
  // New variable-based fields
  structuralClass: string;
  cssVariables: Record<string, string>;
  colorMapping: Record<string, string>;
  fallbackClass: string;
  
  // Migration metadata
  requiresLegacyFallback?: boolean;
  legacyOnly?: boolean;
  migrationWarnings?: string[];
  migrationError?: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface ConversionResult {
  success: boolean;
  variation?: VariableBackgroundVariation;
  warnings: string[];
  errors: string[];
}

export type MigrationMode = 'legacy' | 'variable' | 'hybrid';

export class BackgroundSystemAdapter {
  private analyzer: BackgroundPatternAnalyzer;

  constructor(
    private legacyMode: boolean = false,
    private variableMode: boolean = true
  ) {
    this.analyzer = backgroundPatternAnalyzer;
  }

  /**
   * Convert legacy bgVariation to variable-based system
   */
  convertLegacyVariation(variation: LegacyBackgroundVariation): VariableBackgroundVariation {
    try {
      // Analyze the Tailwind class
      const parsedPattern = this.analyzer.parseTailwindBackground(variation.tailwindClass);
      
      // Extract structural pattern
      const structuralClass = this.analyzer.extractStructuralPattern(parsedPattern);
      
      // Extract color values and variables
      const colorValues = this.analyzer.extractColorValues(parsedPattern);
      
      // Validate migration
      const validation = this.analyzer.validateMigration(variation.tailwindClass);

      return {
        variationId: variation.variationId,
        variationLabel: variation.variationLabel,
        archetypeId: variation.archetypeId,
        themeId: variation.themeId,
        baseColor: variation.baseColor,
        
        // Variable-based fields
        structuralClass,
        cssVariables: colorValues.variables,
        colorMapping: colorValues.mapping,
        fallbackClass: variation.tailwindClass,
        
        // Migration metadata
        requiresLegacyFallback: !validation.canMigrate,
        migrationWarnings: validation.warnings,
        complexity: validation.complexity,
      };

    } catch (error) {
      console.error(`Failed to convert variation ${variation.variationId}:`, error);
      
      // Return legacy-only variation
      return {
        variationId: variation.variationId,
        variationLabel: variation.variationLabel,
        archetypeId: variation.archetypeId,
        themeId: variation.themeId,
        baseColor: variation.baseColor,
        
        structuralClass: 'bg-pattern-neutral', // Safe fallback
        cssVariables: {},
        colorMapping: {},
        fallbackClass: variation.tailwindClass,
        
        legacyOnly: true,
        migrationError: error instanceof Error ? error.message : 'Unknown error',
        complexity: 'high',
      };
    }
  }

  /**
   * Convert multiple variations with progress tracking
   */
  async convertVariationsBatch(
    variations: LegacyBackgroundVariation[],
    onProgress?: (progress: number, current: string) => void
  ): Promise<VariableBackgroundVariation[]> {
    const results: VariableBackgroundVariation[] = [];
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      
      if (onProgress) {
        onProgress((i / variations.length) * 100, variation.variationId);
      }
      
      const converted = this.convertLegacyVariation(variation);
      results.push(converted);
      
      // Small delay to prevent blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    if (onProgress) {
      onProgress(100, 'Complete');
    }
    
    return results;
  }

  /**
   * Generate CSS for both legacy and variable modes
   */
  generateBackgroundCSS(
    variation: VariableBackgroundVariation,
    customColors?: Record<string, string>,
    mode: MigrationMode = 'hybrid'
  ): { variableCSS: string; legacyCSS: string; inlineStyle?: string } {
    const legacyCSS = variation.fallbackClass;
    
    if (mode === 'legacy' || variation.legacyOnly) {
      return { variableCSS: '', legacyCSS };
    }
    
    const variableCSS = this.generateVariableCSS(variation, customColors);
    const inlineStyle = this.generateInlineStyle(variation, customColors);
    
    return { variableCSS, legacyCSS, inlineStyle };
  }

  /**
   * Convert background system to variable-based
   */
  convertBackgroundSystemToVariables(
    backgroundSystem: BackgroundSystem,
    customOverrides?: Record<string, string>
  ): {
    cssVariables: Record<string, string>;
    structuralClasses: Record<string, string>;
  } {
    const cssVariables: Record<string, string> = {};
    const structuralClasses: Record<string, string> = {};

    // Convert each background type
    Object.entries(backgroundSystem).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('bg-')) {
        // Analyze the background class
        try {
          const parsed = this.analyzer.parseTailwindBackground(value);
          const structural = this.analyzer.extractStructuralPattern(parsed);
          const colorValues = this.analyzer.extractColorValues(parsed);

          structuralClasses[key] = structural;
          
          // Merge color variables with prefixed keys
          Object.entries(colorValues.variables).forEach(([varKey, varValue]) => {
            const prefixedKey = `--${key}-${varKey.replace('--', '')}`;
            cssVariables[prefixedKey] = customOverrides?.[prefixedKey] || varValue;
          });

        } catch (error) {
          console.warn(`Could not convert ${key}:`, error);
          structuralClasses[key] = value; // Keep original as fallback
        }
      }
    });

    return { cssVariables, structuralClasses };
  }

  /**
   * Convert individual background to variable format
   */
  convertToVariableBackground(
    backgroundClass: string,
    backgroundType: string
  ): {
    structuralClass: string;
    cssVariables: Record<string, string>;
    fallback: string;
  } {
    try {
      const parsed = this.analyzer.parseTailwindBackground(backgroundClass);
      const structuralClass = this.analyzer.extractStructuralPattern(parsed);
      const colorValues = this.analyzer.extractColorValues(parsed);

      return {
        structuralClass,
        cssVariables: colorValues.variables,
        fallback: backgroundClass
      };

    } catch (error) {
      console.warn(`Failed to convert background ${backgroundType}:`, error);
      
      return {
        structuralClass: 'bg-pattern-neutral',
        cssVariables: {},
        fallback: backgroundClass
      };
    }
  }

  /**
   * Apply custom colors to a variation
   */
  applyCustomColors(
    variation: VariableBackgroundVariation,
    customColors: Record<string, string>
  ): VariableBackgroundVariation {
    return {
      ...variation,
      cssVariables: {
        ...variation.cssVariables,
        ...customColors
      },
      colorMapping: {
        ...variation.colorMapping,
        ...customColors
      }
    };
  }

  /**
   * Get migration statistics
   */
  getMigrationStats(variations: VariableBackgroundVariation[]): {
    total: number;
    migrated: number;
    legacyOnly: number;
    withWarnings: number;
    complexityBreakdown: Record<string, number>;
  } {
    const stats = {
      total: variations.length,
      migrated: 0,
      legacyOnly: 0,
      withWarnings: 0,
      complexityBreakdown: { low: 0, medium: 0, high: 0 }
    };

    variations.forEach(variation => {
      if (variation.legacyOnly) {
        stats.legacyOnly++;
      } else {
        stats.migrated++;
      }

      if (variation.migrationWarnings?.length) {
        stats.withWarnings++;
      }

      stats.complexityBreakdown[variation.complexity]++;
    });

    return stats;
  }

  // Private helper methods

  private generateVariableCSS(
    variation: VariableBackgroundVariation,
    customColors?: Record<string, string>
  ): string {
    if (variation.legacyOnly) {
      return variation.fallbackClass;
    }

    return variation.structuralClass;
  }

  private generateInlineStyle(
    variation: VariableBackgroundVariation,
    customColors?: Record<string, string>
  ): string {
    if (variation.legacyOnly || Object.keys(variation.cssVariables).length === 0) {
      return '';
    }

    const variables = { ...variation.cssVariables, ...customColors };
    
    return Object.entries(variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  /**
   * Generate preview styles for testing
   */
  generatePreviewStyles(
    variation: VariableBackgroundVariation,
    customColors?: Record<string, string>
  ): {
    className: string;
    style: Record<string, string>;
    fallbackClassName: string;
  } {
    const variables = { ...variation.cssVariables, ...customColors };
    const style: Record<string, string> = {};

    // Convert CSS variables to React style object
    Object.entries(variables).forEach(([key, value]) => {
      // Remove -- prefix for React styles
      const reactKey = key.startsWith('--') ? key.slice(2) : key;
      style[reactKey] = value;
    });

    return {
      className: variation.structuralClass,
      style,
      fallbackClassName: variation.fallbackClass
    };
  }
}

// Export singleton instance
export const migrationAdapter = new BackgroundSystemAdapter();