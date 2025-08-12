// CSS Variable Store State and Actions
// Extends EditStore with CSS variable functionality

import type { MigrationFeatureFlags } from '@/utils/featureFlags';

/**
 * CSS Variable Migration Phases
 */
export type CSSVariablePhase = 'legacy' | 'hybrid' | 'variable';

/**
 * CSS Variable State Interface
 */
export interface CSSVariableState {
  // Current migration phase
  phase: CSSVariablePhase;
  
  // Feature flags for CSS variables
  featureFlags: MigrationFeatureFlags;
  
  // Custom color variables (scoped to token)
  customColors: Record<string, string>;
  
  // Generated CSS variables (computed from theme)
  generatedVariables: Record<string, string>;
  
  // Browser compatibility info
  browserSupport: {
    cssVariables: boolean;
    customProperties: boolean;
    fallbackRequired: boolean;
  };
  
  // Performance metrics
  metrics: {
    cssSize: number; // KB
    variableCount: number;
    renderTime: number; // ms
    lastUpdated: number; // timestamp
  };
  
  // Debug mode for development
  debugMode: boolean;
}

/**
 * CSS Variable Actions Interface
 */
export interface CSSVariableActions {
  // Phase management
  setCSSVariablePhase: (phase: CSSVariablePhase) => void;
  enableCSSVariables: () => void;
  disableCSSVariables: () => void;
  
  // Feature flag management
  updateFeatureFlags: (flags: Partial<MigrationFeatureFlags>) => void;
  toggleFeature: (feature: keyof MigrationFeatureFlags) => void;
  
  // Color management
  updateCustomColors: (colors: Record<string, string>) => void;
  setCustomColor: (key: string, value: string) => void;
  removeCustomColor: (key: string) => void;
  clearCustomColors: () => void;
  
  // Generated variables (computed from theme)
  regenerateVariables: () => void;
  syncVariablesFromTheme: () => void;
  
  // Browser detection
  detectBrowserSupport: () => void;
  
  // Performance tracking
  updateMetrics: (metrics: Partial<CSSVariableState['metrics']>) => void;
  trackVariableUsage: () => void;
  
  // Debug utilities
  toggleDebugMode: () => void;
  logVariableState: () => void;
  exportVariables: () => string;
  
  // Migration utilities
  migrateToVariables: () => Promise<void>;
  rollbackToLegacy: () => Promise<void>;
  validateMigration: () => Promise<boolean>;
}

/**
 * Default CSS Variable State
 */
export const defaultCSSVariableState: CSSVariableState = {
  phase: 'legacy',
  featureFlags: {
    enableVariableMode: false,
    enableHybridMode: false,
    enableLegacyFallbacks: true,
    enableCustomColorPicker: false,
    enableBackgroundCustomization: false,
    enableMigrationDebug: false,
    enablePerformanceLogging: false,
    enableVisualDiff: false,
    enableMigrationAnalytics: false,
    rolloutPercentage: 0,
    staffAccess: false,
    betaAccess: false,
  },
  customColors: {},
  generatedVariables: {},
  browserSupport: {
    cssVariables: false,
    customProperties: false,
    fallbackRequired: true,
  },
  metrics: {
    cssSize: 0,
    variableCount: 0,
    renderTime: 0,
    lastUpdated: Date.now(),
  },
  debugMode: false,
};

/**
 * CSS Variable Slice Interface
 * Combines state and actions for the store
 */
export interface CSSVariableSlice extends CSSVariableState, CSSVariableActions {
  // Slice metadata
  _cssVariableSlice: {
    version: '1.0.0';
    initialized: boolean;
    lastMigration: number;
  };
}

/**
 * CSS Variable Action Creator Type
 */
export type CSSVariableActionCreator = (
  set: (updater: (state: any) => void) => void,
  get: () => any
) => CSSVariableActions;