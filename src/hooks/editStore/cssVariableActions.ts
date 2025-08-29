// CSS Variable Store Actions
// Implements CSS variable management for EditStore

import type { 
  CSSVariableActions, 
  CSSVariablePhase,
  CSSVariableActionCreator 
} from '@/types/store/cssVariables';
import type { MigrationFeatureFlags } from '@/utils/featureFlags';
// import { generateVariableColorTokens } from '@/modules/Design/ColorSystem/variableColorTokens'; // File disabled
const generateVariableColorTokens = (colors: any) => ({ /* stub */ });
import { migrationAdapter } from '@/modules/Design/ColorSystem/migrationAdapter';

import { logger } from '@/lib/logger';
/**
 * Creates CSS Variable Actions for EditStore
 */
export const createCSSVariableActions: CSSVariableActionCreator = (set, get) => ({
  // Phase management
  setCSSVariablePhase: (phase: CSSVariablePhase) => {
    set((state) => {
      state.cssVariables.phase = phase;
      state.cssVariables.metrics.lastUpdated = Date.now();
      
      // Auto-enable features based on phase
      if (phase === 'variable') {
        state.cssVariables.featureFlags.enableVariableMode = true;
        state.cssVariables.featureFlags.enableHybridMode = false;
      } else if (phase === 'hybrid') {
        state.cssVariables.featureFlags.enableHybridMode = true;
        state.cssVariables.featureFlags.enableLegacyFallbacks = true;
      } else {
        state.cssVariables.featureFlags.enableVariableMode = false;
        state.cssVariables.featureFlags.enableHybridMode = false;
      }
      
      logger.debug(`🎨 CSS Variable phase changed to: ${phase}`);
    });
  },

  enableCSSVariables: () => {
    set((state) => {
      state.cssVariables.phase = 'variable';
      state.cssVariables.featureFlags.enableVariableMode = true;
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug('✅ CSS Variables enabled');
    });
  },

  disableCSSVariables: () => {
    set((state) => {
      state.cssVariables.phase = 'legacy';
      state.cssVariables.featureFlags.enableVariableMode = false;
      state.cssVariables.featureFlags.enableHybridMode = false;
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug('❌ CSS Variables disabled');
    });
  },

  // Feature flag management
  updateFeatureFlags: (flags: Partial<MigrationFeatureFlags>) => {
    set((state) => {
      state.cssVariables.featureFlags = {
        ...state.cssVariables.featureFlags,
        ...flags
      };
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug('🚩 Feature flags updated:', flags);
    });
  },

  toggleFeature: (feature: keyof MigrationFeatureFlags) => {
    set((state) => {
      const currentValue = state.cssVariables.featureFlags[feature];
      state.cssVariables.featureFlags[feature] = !currentValue;
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug(`🔄 Feature ${feature} toggled to:`, !currentValue);
    });
  },

  // Color management
  updateCustomColors: (colors: Record<string, string>) => {
    set((state) => {
      state.cssVariables.customColors = {
        ...state.cssVariables.customColors,
        ...colors
      };
      
      // Update metrics
      state.cssVariables.metrics.variableCount = Object.keys(state.cssVariables.customColors).length;
      state.cssVariables.metrics.lastUpdated = Date.now();
      
      logger.debug('🎨 Custom colors updated:', Object.keys(colors));
    });
  },

  setCustomColor: (key: string, value: string) => {
    set((state) => {
      state.cssVariables.customColors[key] = value;
      state.cssVariables.metrics.variableCount = Object.keys(state.cssVariables.customColors).length;
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug(`🎨 Custom color set: ${key} = ${value}`);
    });
  },

  removeCustomColor: (key: string) => {
    set((state) => {
      delete state.cssVariables.customColors[key];
      state.cssVariables.metrics.variableCount = Object.keys(state.cssVariables.customColors).length;
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug(`🗑️ Custom color removed: ${key}`);
    });
  },

  clearCustomColors: () => {
    set((state) => {
      state.cssVariables.customColors = {};
      state.cssVariables.metrics.variableCount = 0;
      state.cssVariables.metrics.lastUpdated = Date.now();
      logger.debug('🧹 All custom colors cleared');
    });
  },

  // Generated variables (computed from theme)
  regenerateVariables: () => {
    const state = get();
    
    set((draft) => {
      try {
        // Generate variables from current theme
        if (state.theme?.colors) {
          const generatedTokens = generateVariableColorTokens(state.theme.colors);
          draft.cssVariables.generatedVariables = generatedTokens;
          
          // Update metrics
          draft.cssVariables.metrics.variableCount = Object.keys(generatedTokens).length;
          draft.cssVariables.metrics.lastUpdated = Date.now();
          
          logger.debug('🔄 Variables regenerated from theme:', { count: Object.keys(generatedTokens).length, type: 'variables' });
        }
      } catch (error) {
        logger.error('❌ Failed to regenerate variables:', error);
      }
    });
  },

  syncVariablesFromTheme: () => {
    const state = get();
    
    set((draft) => {
      try {
        if (state.theme?.colors?.sectionBackgrounds) {
          const backgroundSystem = state.theme.colors.sectionBackgrounds;
          
          // Convert backgrounds to variables
          const variableBackgrounds: Record<string, string> = {};
          Object.entries(backgroundSystem).forEach(([key, value]) => {
            if (typeof value === 'string') {
              variableBackgrounds[`--bg-${key}`] = value;
            }
          });
          
          draft.cssVariables.generatedVariables = {
            ...draft.cssVariables.generatedVariables,
            ...variableBackgrounds
          };
          
          logger.debug('🔄 Variables synced from theme');
        }
      } catch (error) {
        logger.error('❌ Failed to sync variables from theme:', error);
      }
    });
  },

  // Browser detection
  detectBrowserSupport: () => {
    set((state) => {
      try {
        // Check CSS Variables support
        const cssVariables = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('--test', 'red');
        
        // Check custom properties support
        const customProperties = typeof window !== 'undefined' && 
          'CSS' in window && 
          'supports' in (window as any).CSS &&
          (window as any).CSS.supports('color', 'var(--test)');
        
        state.cssVariables.browserSupport = {
          cssVariables: cssVariables || false,
          customProperties: customProperties || false,
          fallbackRequired: !cssVariables || !customProperties,
        };
        
        logger.debug('🔍 Browser support detected:', state.cssVariables.browserSupport);
        
        // Auto-adjust phase based on support
        if (!cssVariables && state.cssVariables.phase === 'variable') {
          state.cssVariables.phase = 'legacy';
          logger.debug('⚠️ Falling back to legacy mode due to browser limitations');
        }
      } catch (error) {
        logger.error('❌ Failed to detect browser support:', error);
        // Assume no support on error
        state.cssVariables.browserSupport = {
          cssVariables: false,
          customProperties: false,
          fallbackRequired: true,
        };
      }
    });
  },

  // Performance tracking
  updateMetrics: (metrics: Partial<{
    lastUpdated: number;
    variableCount: number;
    cssSize: number;
    performanceScore: number;
  }>) => {
    set((state) => {
      state.cssVariables.metrics = {
        ...state.cssVariables.metrics,
        ...metrics,
        lastUpdated: Date.now(),
      };
    });
  },

  trackVariableUsage: () => {
    const state = get();
    
    set((draft) => {
      try {
        const totalVariables = Object.keys(draft.cssVariables.customColors).length + 
                             Object.keys(draft.cssVariables.generatedVariables).length;
        
        draft.cssVariables.metrics.variableCount = totalVariables;
        
        // Estimate CSS size (rough calculation)
        const estimatedSize = totalVariables * 0.1; // ~100 bytes per variable
        draft.cssVariables.metrics.cssSize = estimatedSize;
        
        logger.debug('📊 Variable usage tracked:', {
          total: totalVariables,
          custom: Object.keys(draft.cssVariables.customColors).length,
          generated: Object.keys(draft.cssVariables.generatedVariables).length,
          estimatedSize: `${estimatedSize.toFixed(1)}KB`
        });
      } catch (error) {
        logger.error('❌ Failed to track variable usage:', error);
      }
    });
  },

  // Debug utilities
  toggleDebugMode: () => {
    set((state) => {
      state.cssVariables.debugMode = !state.cssVariables.debugMode;
      logger.debug(`🐛 Debug mode ${state.cssVariables.debugMode ? 'enabled' : 'disabled'}`);
    });
  },

  logVariableState: () => {
    const state = get();
    console.group('🎨 CSS Variable State');
    logger.debug('Phase:', state.cssVariables.phase);
    logger.debug('Feature Flags:', state.cssVariables.featureFlags);
    logger.debug('Custom Colors:', state.cssVariables.customColors);
    logger.debug('Generated Variables:', state.cssVariables.generatedVariables);
    logger.debug('Browser Support:', state.cssVariables.browserSupport);
    logger.debug('Metrics:', state.cssVariables.metrics);
    console.groupEnd();
  },

  exportVariables: () => {
    const state = get();
    
    const allVariables = {
      ...state.cssVariables.generatedVariables,
      ...state.cssVariables.customColors,
    };
    
    // Generate CSS text
    const cssText = Object.entries(allVariables)
      .map(([key, value]) => `  ${key.startsWith('--') ? key : `--${key}`}: ${value};`)
      .join('\n');
    
    const fullCSS = `:root {\n${cssText}\n}`;
    
    logger.debug('📤 CSS Variables exported:', fullCSS);
    return fullCSS;
  },

  // Migration utilities
  migrateToVariables: async () => {
    const state = get();
    
    try {
      logger.debug('🚀 Starting migration to CSS variables...');
      
      set((draft) => {
        draft.cssVariables.phase = 'hybrid'; // Start with hybrid mode
        draft.cssVariables.featureFlags.enableHybridMode = true;
        draft.cssVariables.featureFlags.enableLegacyFallbacks = true;
      });
      
      // Regenerate variables from current theme
      get().regenerateVariables?.();
      
      // Wait a bit for variables to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set((draft) => {
        draft.cssVariables.phase = 'variable'; // Complete migration
        draft.cssVariables.featureFlags.enableVariableMode = true;
        draft.cssVariables._cssVariableSlice.lastMigration = Date.now();
      });
      
      logger.debug('✅ Migration to CSS variables completed');
      
    } catch (error) {
      logger.error('❌ Migration failed:', error);
      // Rollback on error
      set((draft) => {
        draft.cssVariables.phase = 'legacy';
        draft.cssVariables.featureFlags.enableVariableMode = false;
        draft.cssVariables.featureFlags.enableHybridMode = false;
      });
      throw error;
    }
  },

  rollbackToLegacy: async () => {
    try {
      logger.debug('🔄 Rolling back to legacy mode...');
      
      set((draft) => {
        draft.cssVariables.phase = 'legacy';
        draft.cssVariables.featureFlags.enableVariableMode = false;
        draft.cssVariables.featureFlags.enableHybridMode = false;
        draft.cssVariables.customColors = {};
        draft.cssVariables.generatedVariables = {};
      });
      
      logger.debug('✅ Rollback to legacy mode completed');
    } catch (error) {
      logger.error('❌ Rollback failed:', error);
      throw error;
    }
  },

  validateMigration: async () => {
    const state = get();
    
    try {
      logger.debug('🔍 Validating CSS variable migration...');
      
      // Check if browser supports CSS variables
      if (!state.cssVariables.browserSupport.cssVariables) {
        logger.warn('⚠️ Browser does not support CSS variables');
        return false;
      }
      
      // Check if we have variables to use
      const hasVariables = Object.keys(state.cssVariables.generatedVariables).length > 0 ||
                          Object.keys(state.cssVariables.customColors).length > 0;
      
      if (!hasVariables) {
        logger.warn('⚠️ No CSS variables available');
        return false;
      }
      
      // Check if theme is compatible
      if (!state.theme?.colors?.sectionBackgrounds) {
        logger.warn('⚠️ Theme not compatible with CSS variables');
        return false;
      }
      
      logger.debug('✅ Migration validation passed');
      return true;
      
    } catch (error) {
      logger.error('❌ Migration validation failed:', error);
      return false;
    }
  },
});