// colorSystemMigration.ts - Migration helper for transitioning to the improved color system
// Provides feature flags, A/B testing support, and gradual rollout capabilities

import { getEnhancedTextColors, BusinessColorContext } from './improvedTextColors';
import { getSmartAccentColor } from './colorHarmony';
import { validateBrandColors, BrandColors, BrandIntegrationOptions } from './brandColorSystem';
import { logger } from '@/lib/logger';

/**
 * Feature flags for color system components
 */
export interface ColorSystemFlags {
  useEnhancedTextColors?: boolean;
  useSmartAccentColors?: boolean;
  useBrandColorSystem?: boolean;
  useAccessibilityValidation?: boolean;
  enableColorDebugging?: boolean;
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  flags: ColorSystemFlags;
  rolloutPercentage?: number; // 0-100, for gradual rollout
  debugMode?: boolean;
  fallbackToLegacy?: boolean;
}

/**
 * Legacy color system interface (for backward compatibility)
 */
interface LegacyColorSystem {
  getTextColorForBackground: (
    backgroundType: string,
    colorTokens: any
  ) => { heading: string; body: string; muted: string };
  getAccentColor: (baseColor: string, context: any) => { accentColor: string; accentCSS: string };
}

/**
 * Enhanced color system with migration support
 */
export class ColorSystemManager {
  private config: MigrationConfig;
  private legacySystem?: LegacyColorSystem;
  
  constructor(config: MigrationConfig, legacySystem?: LegacyColorSystem) {
    this.config = config;
    this.legacySystem = legacySystem;
  }

  /**
   * Get text colors with migration support
   */
  getTextColors(
    backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
    backgroundCSS: string,
    businessContext: BusinessColorContext = {},
    brandColors?: BrandColors
  ): { 
    heading: string; 
    body: string; 
    muted: string; 
    source: 'enhanced' | 'legacy';
    confidence?: number;
  } {
    
    // Check if user is in the rollout group
    if (!this.shouldUseEnhancedSystem()) {
      return this.getLegacyTextColors(backgroundType, backgroundCSS, businessContext);
    }

    try {
      // Use enhanced system
      if (this.config.flags.useEnhancedTextColors) {
        const enhancedResult = getEnhancedTextColors(
          backgroundType,
          backgroundCSS,
          businessContext,
          {
            requireWCAG: this.config.flags.useAccessibilityValidation ? 'AA' : undefined,
            brandColors: brandColors?.text,
            fallbackStrategy: this.config.fallbackToLegacy ? 'safe' : 'adaptive'
          }
        );

        // Log debug info if enabled
        if (this.config.flags.enableColorDebugging) {
          logger.dev('🎨 Enhanced Color System Result:', () => ({
            backgroundType,
            backgroundCSS,
            textColors: {
              heading: enhancedResult.heading,
              body: enhancedResult.body,
              muted: enhancedResult.muted
            },
            validation: enhancedResult.validation,
            confidence: enhancedResult.validation.confidence
          }));
        }

        // Check if result meets quality threshold
        if (enhancedResult.validation.confidence > 0.7) {
          return {
            heading: enhancedResult.heading,
            body: enhancedResult.body,
            muted: enhancedResult.muted,
            source: 'enhanced',
            confidence: enhancedResult.validation.confidence
          };
        } else if (this.config.fallbackToLegacy) {
          logger.warn('Enhanced system low confidence, falling back to legacy');
          return this.getLegacyTextColors(backgroundType, backgroundCSS, businessContext);
        }
      }
    } catch (error) {
      logger.error('Enhanced color system failed:', () => error);
      
      if (this.config.fallbackToLegacy) {
        return this.getLegacyTextColors(backgroundType, backgroundCSS, businessContext);
      }
    }

    // Fallback to legacy system
    return this.getLegacyTextColors(backgroundType, backgroundCSS, businessContext);
  }

  /**
   * Get accent colors with migration support
   */
  getAccentColor(
    baseColor: string,
    businessContext: BusinessColorContext = {},
    brandColors?: BrandColors
  ): {
    accentColor: string;
    accentCSS: string;
    source: 'smart' | 'legacy';
    confidence?: number;
  } {
    
    // If brand accent is provided and valid, use it
    if (brandColors?.accent && this.config.flags.useBrandColorSystem) {
      try {
        const validation = validateBrandColors(brandColors, {}, {
          requireWCAG: 'AA',
          adaptForAccessibility: true
        });
        
        if (validation.isValid && validation.adaptedColors.accent) {
          return {
            accentColor: 'brand-accent',
            accentCSS: `bg-[${validation.adaptedColors.accent}]`,
            source: 'smart',
            confidence: validation.confidence
          };
        }
      } catch (error) {
        logger.warn('Brand color validation failed:', () => error);
      }
    }

    // Check if user is in the rollout group for smart accents
    if (!this.shouldUseEnhancedSystem()) {
      return this.getLegacyAccentColor(baseColor, businessContext);
    }

    try {
      if (this.config.flags.useSmartAccentColors) {
        const smartAccent = getSmartAccentColor(baseColor, businessContext);
        
        if (this.config.flags.enableColorDebugging) {
          logger.dev('🎨 Smart Accent Color Result:', () => ({
            baseColor,
            businessContext,
            result: smartAccent
          }));
        }

        if (smartAccent.confidence > 0.5) {
          return {
            accentColor: smartAccent.accentColor,
            accentCSS: smartAccent.accentCSS,
            source: 'smart',
            confidence: smartAccent.confidence
          };
        }
      }
    } catch (error) {
      logger.error('Smart accent color system failed:', () => error);
    }

    // Fallback to legacy
    return this.getLegacyAccentColor(baseColor, businessContext);
  }

  /**
   * Validate brand colors if brand system is enabled
   */
  validateBrandColors(
    brandColors: BrandColors,
    backgroundSystem: any,
    options: BrandIntegrationOptions = {}
  ) {
    if (!this.config.flags.useBrandColorSystem) {
      return null;
    }

    try {
      return validateBrandColors(brandColors, backgroundSystem, {
        ...options,
        requireWCAG: this.config.flags.useAccessibilityValidation ? 'AA' : undefined
      });
    } catch (error) {
      logger.error('Brand color validation failed:', () => error);
      return null;
    }
  }

  /**
   * Compare enhanced vs legacy results for A/B testing
   */
  compareResults(
    backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
    backgroundCSS: string,
    businessContext: BusinessColorContext = {}
  ): {
    enhanced: any;
    legacy: any;
    differences: string[];
    recommendation: 'enhanced' | 'legacy' | 'neutral';
  } {
    
    const enhanced = this.getEnhancedColors(backgroundType, backgroundCSS, businessContext);
    const legacy = this.getLegacyTextColors(backgroundType, backgroundCSS, businessContext);
    
    const differences: string[] = [];
    
    if (enhanced.heading !== legacy.heading) {
      differences.push(`Heading color: enhanced(${enhanced.heading}) vs legacy(${legacy.heading})`);
    }
    
    if (enhanced.body !== legacy.body) {
      differences.push(`Body color: enhanced(${enhanced.body}) vs legacy(${legacy.body})`);
    }
    
    if (enhanced.muted !== legacy.muted) {
      differences.push(`Muted color: enhanced(${enhanced.muted}) vs legacy(${legacy.muted})`);
    }

    // Determine recommendation based on confidence and validation
    let recommendation: 'enhanced' | 'legacy' | 'neutral' = 'neutral';
    
    if (enhanced.confidence && enhanced.confidence > 0.8) {
      recommendation = 'enhanced';
    } else if (enhanced.confidence && enhanced.confidence < 0.5) {
      recommendation = 'legacy';
    }

    return {
      enhanced,
      legacy,
      differences,
      recommendation
    };
  }

  // Private helper methods
  private shouldUseEnhancedSystem(): boolean {
    if (!this.config.rolloutPercentage) return true;
    
    // Simple hash-based rollout (in production, use proper A/B testing)
    const hash = Math.abs(this.simpleHash(Date.now().toString())) % 100;
    return hash < this.config.rolloutPercentage;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private getEnhancedColors(
    backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
    backgroundCSS: string,
    businessContext: BusinessColorContext
  ) {
    try {
      const result = getEnhancedTextColors(
        backgroundType,
        backgroundCSS,
        businessContext,
        { requireWCAG: 'AA' }
      );
      
      return {
        heading: result.heading,
        body: result.body,
        muted: result.muted,
        confidence: result.validation.confidence,
        source: 'enhanced'
      };
    } catch (error) {
      return {
        heading: '#1f2937',
        body: '#374151',
        muted: '#6b7280',
        confidence: 0.3,
        source: 'enhanced-fallback'
      };
    }
  }

  private getLegacyTextColors(
    backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
    backgroundCSS: string,
    businessContext: BusinessColorContext
  ): { heading: string; body: string; muted: string; source: 'legacy' } {
    
    if (this.legacySystem) {
      try {
        const result = this.legacySystem.getTextColorForBackground(backgroundType, { bgPrimary: backgroundCSS });
        return { ...result, source: 'legacy' };
      } catch (error) {
        logger.warn('Legacy system failed:', () => error);
      }
    }

    // Safe fallback
    const isLightBackground = backgroundType !== 'primary'; // Simple heuristic
    
    return {
      heading: isLightBackground ? '#1f2937' : '#f9fafb',
      body: isLightBackground ? '#374151' : '#e5e7eb',
      muted: isLightBackground ? '#6b7280' : '#9ca3af',
      source: 'legacy'
    };
  }

  private getLegacyAccentColor(
    baseColor: string,
    businessContext: BusinessColorContext
  ): { accentColor: string; accentCSS: string; source: 'legacy' } {
    
    if (this.legacySystem) {
      try {
        const result = this.legacySystem.getAccentColor(baseColor, businessContext);
        return { ...result, source: 'legacy' };
      } catch (error) {
        logger.warn('Legacy accent system failed:', () => error);
      }
    }

    // Safe fallback
    return {
      accentColor: 'purple',
      accentCSS: 'bg-purple-600',
      source: 'legacy'
    };
  }
}

/**
 * Create a color system manager with default configuration
 */
export function createColorSystemManager(
  overrides: Partial<MigrationConfig> = {}
): ColorSystemManager {
  
  const defaultConfig: MigrationConfig = {
    flags: {
      useEnhancedTextColors: true,
      useSmartAccentColors: true,
      useBrandColorSystem: true,
      useAccessibilityValidation: true,
      enableColorDebugging: process.env.NODE_ENV === 'development'
    },
    rolloutPercentage: 100, // Full rollout by default
    debugMode: process.env.NODE_ENV === 'development',
    fallbackToLegacy: true
  };

  const config = { ...defaultConfig, ...overrides };
  
  return new ColorSystemManager(config);
}

/**
 * Feature detection for color system capabilities
 */
export function detectColorSystemCapabilities(): {
  hasEnhancedTextColors: boolean;
  hasSmartAccentColors: boolean;
  hasBrandColorSystem: boolean;
  hasAccessibilityValidation: boolean;
  browserSupport: {
    css3Colors: boolean;
    customProperties: boolean;
    gradients: boolean;
  };
} {
  
  return {
    hasEnhancedTextColors: true, // Always available
    hasSmartAccentColors: true,  // Always available
    hasBrandColorSystem: true,   // Always available
    hasAccessibilityValidation: true, // Always available
    browserSupport: {
      css3Colors: true, // Assume modern browser
      customProperties: typeof CSS !== 'undefined' && CSS.supports && CSS.supports('--custom-property', 'value'),
      gradients: typeof CSS !== 'undefined' && CSS.supports && CSS.supports('background', 'linear-gradient(red, blue)')
    }
  };
}

/**
 * Performance monitoring for color system operations
 */
export class ColorSystemPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTiming(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      
      this.metrics.get(operation)!.push(duration);
    };
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      result[operation] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length
      };
    }
    
    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const colorSystemMonitor = new ColorSystemPerformanceMonitor();