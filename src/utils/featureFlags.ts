// Feature Flag System for CSS Variable Migration
// Controls gradual rollout and testing of variable-based color system

export interface MigrationFeatureFlags {
  // Core migration toggles
  enableVariableMode: boolean;
  enableHybridMode: boolean;
  enableLegacyFallbacks: boolean;
  
  // Feature-specific toggles
  enableCustomColorPicker: boolean;
  enableBackgroundCustomization: boolean;
  
  // Development & testing
  enableMigrationDebug: boolean;
  enableVisualDiff: boolean;
  enablePerformanceLogging: boolean;
  enableMigrationAnalytics: boolean;
  
  // Rollout controls
  rolloutPercentage: number;
  staffAccess: boolean;
  betaAccess: boolean;
}

export type MigrationPhase = 'legacy' | 'hybrid' | 'variable';

export interface FeatureFlagContext {
  tokenId: string;
  userType?: 'staff' | 'beta' | 'regular';
  browser?: string;
  environment?: 'development' | 'production' | 'staging';
}

/**
 * Get migration feature flags from environment and context
 */
export function getMigrationFeatureFlags(context?: FeatureFlagContext): MigrationFeatureFlags {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
  
  return {
    // Core migration toggles
    enableVariableMode: getEnvBoolean('NEXT_PUBLIC_ENABLE_VARIABLE_MODE', isDevelopment), // Enable in dev by default
    enableHybridMode: getEnvBoolean('NEXT_PUBLIC_ENABLE_HYBRID_MODE', true), // Default enabled for gradual migration
    enableLegacyFallbacks: getEnvBoolean('NEXT_PUBLIC_ENABLE_LEGACY_FALLBACKS', true),
    
    // Feature-specific toggles
    enableCustomColorPicker: getEnvBoolean('NEXT_PUBLIC_ENABLE_CUSTOM_COLOR_PICKER', isDevelopment),
    enableBackgroundCustomization: getEnvBoolean('NEXT_PUBLIC_ENABLE_BACKGROUND_CUSTOMIZATION', true),
    
    // Development & testing
    enableMigrationDebug: getEnvBoolean('NEXT_PUBLIC_ENABLE_MIGRATION_DEBUG', isDevelopment),
    enableVisualDiff: getEnvBoolean('NEXT_PUBLIC_ENABLE_VISUAL_DIFF', isDevelopment),
    enablePerformanceLogging: getEnvBoolean('NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGGING', isDevelopment || isStaging),
    enableMigrationAnalytics: getEnvBoolean('NEXT_PUBLIC_ENABLE_MIGRATION_ANALYTICS', true),
    
    // Rollout controls
    rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_VARIABLE_ROLLOUT_PERCENTAGE || (isDevelopment ? '100' : '0')),
    staffAccess: getEnvBoolean('NEXT_PUBLIC_STAFF_ACCESS', true),
    betaAccess: getEnvBoolean('NEXT_PUBLIC_BETA_ACCESS', true),
  };
}

/**
 * React hook for using feature flags
 */
export function useFeatureFlags(tokenId: string): MigrationFeatureFlags {
  const context: FeatureFlagContext = {
    tokenId,
    environment: process.env.NODE_ENV as 'development' | 'production' | 'staging',
    browser: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
  };
  
  return getMigrationFeatureFlags(context);
}

/**
 * Determine migration phase based on flags and context
 */
export function determineMigrationPhase(
  flags: MigrationFeatureFlags,
  context: FeatureFlagContext
): MigrationPhase {
  // Staff users get early access to variable mode
  if (context.userType === 'staff' && flags.staffAccess) {
    return flags.enableVariableMode ? 'variable' : 'hybrid';
  }
  
  // Beta users get hybrid mode
  if (context.userType === 'beta' && flags.betaAccess) {
    return flags.enableHybridMode ? 'hybrid' : 'legacy';
  }
  
  // Regular users: percentage-based rollout
  if (flags.rolloutPercentage > 0) {
    const userHash = hashString(context.tokenId);
    const userPercentile = userHash % 100;
    
    if (userPercentile < flags.rolloutPercentage) {
      return flags.enableHybridMode ? 'hybrid' : 'legacy';
    }
  }
  
  // Default to legacy mode
  return 'legacy';
}

/**
 * Check if a specific feature is enabled for the context
 */
export function isFeatureEnabled(
  feature: keyof MigrationFeatureFlags,
  flags: MigrationFeatureFlags,
  context: FeatureFlagContext
): boolean {
  const baseEnabled = flags[feature];
  
  if (typeof baseEnabled !== 'boolean') {
    return false;
  }
  
  // Override for staff users (enable all features)
  if (context.userType === 'staff' && flags.staffAccess) {
    return true;
  }
  
  // Environment-specific overrides
  if (context.environment === 'development') {
    // Enable most features in development
    const devEnabledFeatures: (keyof MigrationFeatureFlags)[] = [
      'enableMigrationDebug',
      'enableVisualDiff',
      'enablePerformanceLogging',
      'enableBackgroundCustomization',
      'enableCustomColorPicker'
    ];
    
    if (devEnabledFeatures.includes(feature)) {
      return true;
    }
  }
  
  return baseEnabled;
}

/**
 * Get migration configuration for a user
 */
export function getMigrationConfig(context: FeatureFlagContext): {
  phase: MigrationPhase;
  flags: MigrationFeatureFlags;
  capabilities: {
    canCustomizeColors: boolean;
    canSelectBackgrounds: boolean;
    hasAdvancedControls: boolean;
    hasDebugMode: boolean;
  };
} {
  const flags = getMigrationFeatureFlags(context);
  const phase = determineMigrationPhase(flags, context);
  
  const capabilities = {
    canCustomizeColors: isFeatureEnabled('enableCustomColorPicker', flags, context) && phase !== 'legacy',
    canSelectBackgrounds: isFeatureEnabled('enableBackgroundCustomization', flags, context),
    hasAdvancedControls: phase === 'variable' || context.userType === 'staff',
    hasDebugMode: isFeatureEnabled('enableMigrationDebug', flags, context),
  };
  
  return { phase, flags, capabilities };
}

/**
 * Check browser compatibility for variable features
 */
export function checkBrowserCompatibility(): {
  supportsCSSVariables: boolean;
  supportsBackdropFilter: boolean;
  supportsGridLayout: boolean;
  recommendsLegacyMode: boolean;
} {
  if (typeof window === 'undefined') {
    // SSR - assume modern browser
    return {
      supportsCSSVariables: true,
      supportsBackdropFilter: true,
      supportsGridLayout: true,
      recommendsLegacyMode: false,
    };
  }
  
  const supportsCSSVariables = window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--test)');
  const supportsBackdropFilter = window.CSS && window.CSS.supports && window.CSS.supports('backdrop-filter', 'blur(1px)');
  const supportsGridLayout = window.CSS && window.CSS.supports && window.CSS.supports('display', 'grid');
  
  // Recommend legacy mode for very old browsers
  const recommendsLegacyMode = !supportsCSSVariables;
  
  return {
    supportsCSSVariables,
    supportsBackdropFilter,
    supportsGridLayout,
    recommendsLegacyMode,
  };
}

/**
 * Track feature flag usage for analytics
 */
export function trackFeatureFlagUsage(
  feature: keyof MigrationFeatureFlags,
  enabled: boolean,
  context: FeatureFlagContext
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feature_flag_usage', {
      feature_name: feature,
      enabled,
      user_type: context.userType || 'regular',
      environment: context.environment || 'unknown',
      token_id: context.tokenId,
    });
  }
}

/**
 * Get environment-specific feature overrides
 */
export function getEnvironmentOverrides(): Partial<MigrationFeatureFlags> {
  const env = process.env.NODE_ENV;
  const publicEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
  
  switch (publicEnv) {
    case 'development':
      return {
        enableMigrationDebug: true,
        enableVisualDiff: true,
        enablePerformanceLogging: true,
        enableVariableMode: true,
        rolloutPercentage: 100,
      };
      
    case 'staging':
      return {
        enableMigrationDebug: true,
        enablePerformanceLogging: true,
        rolloutPercentage: 50,
        enableHybridMode: true,
      };
      
    case 'production':
      return {
        enableMigrationDebug: false,
        enableVisualDiff: false,
        rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_VARIABLE_ROLLOUT_PERCENTAGE || '0'),
      };
      
    default:
      return {};
  }
}

/**
 * Validate feature flag configuration
 */
export function validateFeatureFlagConfig(flags: MigrationFeatureFlags): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validation rules
  if (flags.enableVariableMode && !flags.enableHybridMode && !flags.enableLegacyFallbacks) {
    errors.push('Variable mode requires either hybrid mode or legacy fallbacks for safety');
  }
  
  if (flags.rolloutPercentage > 100 || flags.rolloutPercentage < 0) {
    errors.push('Rollout percentage must be between 0 and 100');
  }
  
  if (flags.enableCustomColorPicker && !flags.enableVariableMode && !flags.enableHybridMode) {
    warnings.push('Custom color picker is most effective with variable or hybrid mode');
  }
  
  if (flags.rolloutPercentage > 50 && !flags.enableMigrationAnalytics) {
    warnings.push('Consider enabling analytics for rollouts above 50%');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// Utility functions

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Type guards
export function isStaffUser(tokenId: string): boolean {
  // Implementation would check against staff user list
  // For now, check for specific patterns or environment variables
  const staffTokens = process.env.NEXT_PUBLIC_STAFF_TOKENS?.split(',') || [];
  return staffTokens.includes(tokenId) || tokenId.startsWith('staff-');
}

export function isBetaUser(tokenId: string): boolean {
  // Implementation would check against beta user list
  const betaTokens = process.env.NEXT_PUBLIC_BETA_TOKENS?.split(',') || [];
  return betaTokens.includes(tokenId) || tokenId.startsWith('beta-');
}

// Export default configuration for testing
export const defaultMigrationFlags: MigrationFeatureFlags = {
  enableVariableMode: false,
  enableHybridMode: true,
  enableLegacyFallbacks: true,
  enableCustomColorPicker: false,
  enableBackgroundCustomization: true,
  enableMigrationDebug: process.env.NODE_ENV === 'development',
  enableVisualDiff: false,
  enablePerformanceLogging: false,
  enableMigrationAnalytics: true,
  rolloutPercentage: 0,
  staffAccess: true,
  betaAccess: true,
};