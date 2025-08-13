/**
 * Variable Actions for EditStore - CSS Variable Migration Support
 * Handles variable mode operations, custom colors, and hybrid mode compatibility
 */

import { StateCreator } from 'zustand';
import { EditStore } from '@/types/store';
// import { generateVariableColorSystem, generateVariableColorTokens } from '@/modules/Design/ColorSystem/variableColorTokens'; // Disabled
const generateVariableColorSystem = (bg: any, ctx?: any) => ({ 
  backgrounds: {},
  accents: {},
  text: {}
});
const generateVariableColorTokens = (colors: any) => ({ 
  cssVariables: {},
  classNames: {}
});
import { migrationAdapter } from '@/modules/Design/ColorSystem/migrationAdapter';
import { getMigrationFeatureFlags, determineMigrationPhase, type MigrationPhase } from '@/utils/featureFlags';
import type { BackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
// import type { VariableColorSystem, VariableColorTokens } from '@/modules/Design/ColorSystem/variableColorTokens'; // Disabled
type VariableColorSystem = any;
type VariableColorTokens = any;

// Variable-specific state extension
interface VariableState {
  variableMode: {
    enabled: boolean;
    phase: MigrationPhase;
    customColors: Record<string, string>;
    variableColorSystem?: VariableColorSystem;
    variableColorTokens?: VariableColorTokens;
    migrationStats?: {
      totalVariations: number;
      migratedVariations: number;
      legacyOnlyVariations: number;
      lastMigrationTime?: number;
    };
  };
}

// Variable-specific actions
interface VariableActions {
  // Core variable operations
  enableVariableMode: () => void;
  disableVariableMode: () => void;
  setVariablePhase: (phase: MigrationPhase) => void;
  
  // Custom color management
  updateCustomColors: (colors: Record<string, string>) => void;
  updateCustomColor: (key: string, value: string) => void;
  removeCustomColor: (key: string) => void;
  resetCustomColors: () => void;
  
  // Variable system generation
  generateVariableSystem: () => void;
  updateVariableTokens: () => void;
  
  // Background conversion
  convertBackgroundToVariable: (backgroundClass: string) => { structuralClass: string; cssVariables: Record<string, string> } | null;
  applyVariableBackground: (sectionId: string, structuralClass: string, customColors?: Record<string, string>) => void;
  
  // Migration utilities
  getMigrationCompatibilityScore: () => number;
  validateVariableSupport: () => { supported: boolean; warnings: string[]; errors: string[] };
  
  // Hybrid mode support
  enableHybridMode: () => void;
  disableHybridMode: () => void;
  
  // Development utilities
  exportVariableConfiguration: () => string;
  importVariableConfiguration: (config: string) => boolean;
}

type VariableSlice = VariableState & VariableActions;

export const createVariableActions: StateCreator<
  EditStore & VariableSlice,
  [["zustand/immer", never]],
  [],
  VariableSlice
> = (set, get) => ({
  // Initial state
  variableMode: {
    enabled: false,
    phase: 'legacy',
    customColors: {},
  },

  // Core variable operations
  enableVariableMode: () => {
    set((state) => {
      const tokenId = (state as any).tokenId || 'unknown';
      const flags = getMigrationFeatureFlags({ tokenId });
      
      state.variableMode.enabled = true;
      state.variableMode.phase = determineMigrationPhase(flags, { tokenId });
      
      // Generate initial variable system
      const actions = get();
      setTimeout(() => actions.generateVariableSystem(), 0);
      
      console.log('🎨 Variable mode enabled:', state.variableMode.phase);
    });
  },

  disableVariableMode: () => {
    set((state) => {
      state.variableMode.enabled = false;
      state.variableMode.phase = 'legacy';
      state.variableMode.customColors = {};
      state.variableMode.variableColorSystem = undefined;
      state.variableMode.variableColorTokens = undefined;
      
      console.log('🎨 Variable mode disabled');
    });
  },

  setVariablePhase: (phase: MigrationPhase) => {
    set((state) => {
      state.variableMode.phase = phase;
      
      // Regenerate variable system for new phase
      const actions = get();
      setTimeout(() => actions.generateVariableSystem(), 0);
    });
  },

  // Custom color management
  updateCustomColors: (colors: Record<string, string>) => {
    set((state) => {
      state.variableMode.customColors = { ...colors };
      
      // Update variable tokens
      const actions = get();
      setTimeout(() => actions.updateVariableTokens(), 0);
    });
  },

  updateCustomColor: (key: string, value: string) => {
    set((state) => {
      state.variableMode.customColors[key] = value;
      
      // Update variable tokens
      const actions = get();
      setTimeout(() => actions.updateVariableTokens(), 0);
    });
  },

  removeCustomColor: (key: string) => {
    set((state) => {
      delete state.variableMode.customColors[key];
      
      // Update variable tokens
      const actions = get();
      setTimeout(() => actions.updateVariableTokens(), 0);
    });
  },

  resetCustomColors: () => {
    set((state) => {
      state.variableMode.customColors = {};
      
      // Update variable tokens
      const actions = get();
      setTimeout(() => actions.updateVariableTokens(), 0);
    });
  },

  // Variable system generation
  generateVariableSystem: () => {
    set((state) => {
      try {
        const currentState = get();
        const backgroundSystem = currentState.theme?.colors?.sectionBackgrounds;
        
        if (!backgroundSystem) {
          console.warn('No background system available for variable generation');
          return;
        }

        // Generate variable color system
        const variableSystem = generateVariableColorSystem(
          backgroundSystem as BackgroundSystem,
          (currentState as any).onboardingData
        );
        
        state.variableMode.variableColorSystem = variableSystem;
        
        // Generate variable tokens
        const variableTokens = generateVariableColorTokens(variableSystem);
        state.variableMode.variableColorTokens = variableTokens;
        
        console.log('🎨 Variable system generated:', {
          backgrounds: Object.keys(variableSystem.backgrounds).length,
          accents: Object.keys(variableSystem.accents).length,
          variables: Object.keys(variableTokens.cssVariables).length,
        });
        
      } catch (error) {
        console.error('Failed to generate variable system:', error);
        state.variableMode.variableColorSystem = undefined;
        state.variableMode.variableColorTokens = undefined;
      }
    });
  },

  updateVariableTokens: () => {
    set((state) => {
      try {
        const { variableColorSystem, customColors } = state.variableMode;
        
        if (!variableColorSystem) {
          console.warn('No variable color system available for token update');
          return;
        }

        // Apply custom colors to the variable system
        const updatedSystem = { ...variableColorSystem };
        
        // Merge custom colors into CSS variables
        Object.entries(customColors).forEach(([key, value]) => {
          if (key.startsWith('--gradient-')) {
            // Update gradient variables
            Object.values(updatedSystem.backgrounds).forEach((bg: any) => {
              if (bg?.variables?.[key] !== undefined) {
                bg.variables[key] = value;
              }
            });
          } else if (key.startsWith('--accent-')) {
            // Update accent variables
            Object.values(updatedSystem.accents).forEach((accent: any) => {
              if (accent?.variables?.[key] !== undefined) {
                accent.variables[key] = value;
              }
            });
          } else if (key.startsWith('--text-')) {
            // Update text variables
            Object.values(updatedSystem.text).forEach((text: any) => {
              if (text?.variables?.[key] !== undefined) {
                text.variables[key] = value;
              }
            });
          }
        });
        
        // Regenerate variable tokens
        const variableTokens = generateVariableColorTokens(updatedSystem);
        
        state.variableMode.variableColorSystem = updatedSystem;
        state.variableMode.variableColorTokens = variableTokens;
        
      } catch (error) {
        console.error('Failed to update variable tokens:', error);
      }
    });
  },

  // Background conversion
  convertBackgroundToVariable: (backgroundClass: string) => {
    try {
      const converted = migrationAdapter.convertToVariableBackground(backgroundClass, 'primary');
      
      if (converted.structuralClass && Object.keys(converted.cssVariables).length > 0) {
        return {
          structuralClass: converted.structuralClass,
          cssVariables: converted.cssVariables,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Background conversion failed:', error);
      return null;
    }
  },

  applyVariableBackground: (sectionId: string, structuralClass: string, customColors = {}) => {
    set((state) => {
      const currentState = get();
      
      if (!currentState.variableMode.enabled) {
        console.warn('Variable mode not enabled');
        return;
      }

      // Update the section background with structural class
      if (state.content[sectionId]) {
        // Note: backgroundClass property doesn't exist - this would need to be added to SectionData type
        // state.content[sectionId].backgroundClass = structuralClass;
      }
      
      // Merge custom colors
      Object.assign(state.variableMode.customColors, customColors);
      
      // Update tokens
      const actions = get();
      setTimeout(() => actions.updateVariableTokens(), 0);
    });
  },

  // Migration utilities
  getMigrationCompatibilityScore: () => {
    const currentState = get();
    const backgrounds = currentState.theme?.colors?.sectionBackgrounds;
    
    if (!backgrounds) return 0;
    
    const backgroundArray = Object.values(backgrounds).filter(Boolean);
    let compatibleCount = 0;
    
    backgroundArray.forEach(bg => {
      try {
        const converted = migrationAdapter.convertToVariableBackground(bg, 'test');
        if (Object.keys(converted.cssVariables).length > 0) {
          compatibleCount++;
        }
      } catch {
        // Not compatible
      }
    });
    
    return backgroundArray.length > 0 ? (compatibleCount / backgroundArray.length) * 100 : 0;
  },

  validateVariableSupport: () => {
    const currentState = get();
    const warnings: string[] = [];
    const errors: string[] = [];
    let supported = true;
    
    // Check if browser supports CSS variables
    if (typeof window !== 'undefined') {
      if (!window.CSS || !window.CSS.supports || !window.CSS.supports('color', 'var(--test)')) {
        errors.push('Browser does not support CSS variables');
        supported = false;
      }
    }
    
    // Check background system
    const backgrounds = currentState.theme?.colors?.sectionBackgrounds;
    if (!backgrounds) {
      warnings.push('No background system configured');
    } else {
      const compatibilityScore = get().getMigrationCompatibilityScore();
      if (compatibilityScore < 50) {
        warnings.push(`Low compatibility score: ${compatibilityScore.toFixed(1)}%`);
      }
    }
    
    // Check custom colors format
    Object.entries(currentState.variableMode.customColors).forEach(([key, value]) => {
      if (!key.startsWith('--')) {
        warnings.push(`Custom color key should start with --: ${key}`);
      }
      
      if (!value || typeof value !== 'string') {
        warnings.push(`Invalid color value for ${key}: ${value}`);
      }
    });
    
    return { supported, warnings, errors };
  },

  // Hybrid mode support
  enableHybridMode: () => {
    set((state) => {
      state.variableMode.phase = 'hybrid';
      state.variableMode.enabled = true;
      
      // Generate variable system for hybrid mode
      const actions = get();
      setTimeout(() => actions.generateVariableSystem(), 0);
    });
  },

  disableHybridMode: () => {
    set((state) => {
      if (state.variableMode.phase === 'hybrid') {
        state.variableMode.phase = 'legacy';
        state.variableMode.enabled = false;
      }
    });
  },

  // Development utilities
  exportVariableConfiguration: () => {
    const currentState = get();
    const config = {
      enabled: currentState.variableMode.enabled,
      phase: currentState.variableMode.phase,
      customColors: currentState.variableMode.customColors,
      timestamp: Date.now(),
      version: '1.0',
    };
    
    return JSON.stringify(config, null, 2);
  },

  importVariableConfiguration: (configString: string) => {
    try {
      const config = JSON.parse(configString);
      
      if (config.version !== '1.0') {
        console.warn('Configuration version mismatch');
        return false;
      }
      
      set((state) => {
        state.variableMode.enabled = config.enabled || false;
        state.variableMode.phase = config.phase || 'legacy';
        state.variableMode.customColors = config.customColors || {};
      });
      
      // Regenerate variable system
      const actions = get();
      setTimeout(() => actions.generateVariableSystem(), 0);
      
      return true;
    } catch (error) {
      console.error('Failed to import variable configuration:', error);
      return false;
    }
  },
});

// Type exports for use in other parts of the application
export type { VariableState, VariableActions, VariableSlice };