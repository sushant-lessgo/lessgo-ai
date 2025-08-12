// CSS Variable Store Actions
// Implements CSS variable management for EditStore

import type { 
  CSSVariableActions, 
  CSSVariablePhase,
  CSSVariableActionCreator 
} from '@/types/store/cssVariables';
import type { MigrationFeatureFlags } from '@/utils/featureFlags';
import { generateVariableColorTokens } from '@/modules/Design/ColorSystem/variableColorTokens';
import { migrationAdapter } from '@/modules/Design/ColorSystem/migrationAdapter';

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
      
      console.log(`🎨 CSS Variable phase changed to: ${phase}`);
    });
  },

  enableCSSVariables: () => {
    set((state) => {
      state.cssVariables.phase = 'variable';
      state.cssVariables.featureFlags.enableVariableMode = true;
      state.cssVariables.metrics.lastUpdated = Date.now();
      console.log('✅ CSS Variables enabled');
    });
  },

  disableCSSVariables: () => {
    set((state) => {
      state.cssVariables.phase = 'legacy';
      state.cssVariables.featureFlags.enableVariableMode = false;
      state.cssVariables.featureFlags.enableHybridMode = false;
      state.cssVariables.metrics.lastUpdated = Date.now();
      console.log('❌ CSS Variables disabled');
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
      console.log('🚩 Feature flags updated:', flags);
    });
  },

  toggleFeature: (feature: keyof MigrationFeatureFlags) => {
    set((state) => {
      const currentValue = state.cssVariables.featureFlags[feature];
      state.cssVariables.featureFlags[feature] = !currentValue;
      state.cssVariables.metrics.lastUpdated = Date.now();
      console.log(`🔄 Feature ${feature} toggled to:`, !currentValue);
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
      
      console.log('🎨 Custom colors updated:', Object.keys(colors));
    });
  },

  setCustomColor: (key: string, value: string) => {
    set((state) => {
      state.cssVariables.customColors[key] = value;
      state.cssVariables.metrics.variableCount = Object.keys(state.cssVariables.customColors).length;
      state.cssVariables.metrics.lastUpdated = Date.now();
      console.log(`🎨 Custom color set: ${key} = ${value}`);
    });
  },

  removeCustomColor: (key: string) => {
    set((state) => {
      delete state.cssVariables.customColors[key];
      state.cssVariables.metrics.variableCount = Object.keys(state.cssVariables.customColors).length;
      state.cssVariables.metrics.lastUpdated = Date.now();
      console.log(`🗑️ Custom color removed: ${key}`);
    });
  },

  clearCustomColors: () => {
    set((state) => {
      state.cssVariables.customColors = {};
      state.cssVariables.metrics.variableCount = 0;
      state.cssVariables.metrics.lastUpdated = Date.now();
      console.log('🧹 All custom colors cleared');
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
          
          console.log('🔄 Variables regenerated from theme:', Object.keys(generatedTokens).length, 'variables');
        }
      } catch (error) {
        console.error('❌ Failed to regenerate variables:', error);
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
          
          console.log('🔄 Variables synced from theme');
        }
      } catch (error) {
        console.error('❌ Failed to sync variables from theme:', error);
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
        
        console.log('🔍 Browser support detected:', state.cssVariables.browserSupport);
        
        // Auto-adjust phase based on support
        if (!cssVariables && state.cssVariables.phase === 'variable') {
          state.cssVariables.phase = 'legacy';
          console.log('⚠️ Falling back to legacy mode due to browser limitations');
        }
      } catch (error) {
        console.error('❌ Failed to detect browser support:', error);
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
        
        console.log('📊 Variable usage tracked:', {
          total: totalVariables,
          custom: Object.keys(draft.cssVariables.customColors).length,
          generated: Object.keys(draft.cssVariables.generatedVariables).length,
          estimatedSize: `${estimatedSize.toFixed(1)}KB`
        });
      } catch (error) {
        console.error('❌ Failed to track variable usage:', error);
      }
    });
  },

  // Debug utilities
  toggleDebugMode: () => {
    set((state) => {
      state.cssVariables.debugMode = !state.cssVariables.debugMode;
      console.log(`🐛 Debug mode ${state.cssVariables.debugMode ? 'enabled' : 'disabled'}`);
    });
  },

  logVariableState: () => {
    const state = get();
    console.group('🎨 CSS Variable State');
    console.log('Phase:', state.cssVariables.phase);
    console.log('Feature Flags:', state.cssVariables.featureFlags);
    console.log('Custom Colors:', state.cssVariables.customColors);
    console.log('Generated Variables:', state.cssVariables.generatedVariables);
    console.log('Browser Support:', state.cssVariables.browserSupport);
    console.log('Metrics:', state.cssVariables.metrics);
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
    
    console.log('📤 CSS Variables exported:', fullCSS);
    return fullCSS;
  },

  // Migration utilities
  migrateToVariables: async () => {
    const state = get();
    
    try {
      console.log('🚀 Starting migration to CSS variables...');
      
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
      
      console.log('✅ Migration to CSS variables completed');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
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
      console.log('🔄 Rolling back to legacy mode...');
      
      set((draft) => {
        draft.cssVariables.phase = 'legacy';
        draft.cssVariables.featureFlags.enableVariableMode = false;
        draft.cssVariables.featureFlags.enableHybridMode = false;
        draft.cssVariables.customColors = {};
        draft.cssVariables.generatedVariables = {};
      });
      
      console.log('✅ Rollback to legacy mode completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  },

  validateMigration: async () => {
    const state = get();
    
    try {
      console.log('🔍 Validating CSS variable migration...');
      
      // Check if browser supports CSS variables
      if (!state.cssVariables.browserSupport.cssVariables) {
        console.warn('⚠️ Browser does not support CSS variables');
        return false;
      }
      
      // Check if we have variables to use
      const hasVariables = Object.keys(state.cssVariables.generatedVariables).length > 0 ||
                          Object.keys(state.cssVariables.customColors).length > 0;
      
      if (!hasVariables) {
        console.warn('⚠️ No CSS variables available');
        return false;
      }
      
      // Check if theme is compatible
      if (!state.theme?.colors?.sectionBackgrounds) {
        console.warn('⚠️ Theme not compatible with CSS variables');
        return false;
      }
      
      console.log('✅ Migration validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error);
      return false;
    }
  },
});