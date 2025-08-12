// Hybrid Mode Compatibility Layer - Seamless transition between legacy and variable modes
// Provides automatic fallbacks, progressive enhancement, and smooth mode switching

'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useVariableTheme } from './VariableThemeInjector';
import { migrationAdapter } from './migrationAdapter';
import { backgroundPatternAnalyzer } from './BackgroundPatternAnalyzer';
import type { BackgroundSystem } from './colorTokens';
import type { MigrationPhase } from '@/utils/featureFlags';
import type { VariableBackgroundVariation, LegacyBackgroundVariation } from './migrationAdapter';

// Compatibility context
interface HybridCompatibilityContext {
  mode: MigrationPhase;
  isCompatibilityMode: boolean;
  hasVariableSupport: boolean;
  compatibilityScore: number;
  
  // Conversion utilities
  convertBackground: (background: string) => {
    legacy: string;
    variable?: string;
    cssVariables?: Record<string, string>;
    fallbackStrategy: 'legacy' | 'variable' | 'hybrid';
  };
  
  // Rendering utilities
  getOptimalRenderStrategy: (background: string) => 'legacy' | 'variable' | 'hybrid';
  shouldUseVariables: (background: string) => boolean;
  
  // Migration utilities
  getMigrationRecommendation: () => {
    canMigrate: boolean;
    strategy: 'immediate' | 'gradual' | 'postpone';
    reasons: string[];
  };
  
  // Error handling
  handleCompatibilityError: (error: Error, context: string) => void;
}

const HybridCompatibilityContext = createContext<HybridCompatibilityContext | null>(null);

interface HybridModeCompatibilityProps {
  tokenId: string;
  children: ReactNode;
  fallbackStrategy?: 'legacy' | 'variable' | 'auto';
  enableProgressiveEnhancement?: boolean;
  debugMode?: boolean;
}

/**
 * Hybrid Mode Compatibility Provider
 * 
 * Provides seamless compatibility between legacy and variable modes:
 * - Automatic fallback detection
 * - Progressive enhancement
 * - Error recovery
 * - Performance optimization
 */
export function HybridModeCompatibility({
  tokenId,
  children,
  fallbackStrategy = 'auto',
  enableProgressiveEnhancement = true,
  debugMode = false
}: HybridModeCompatibilityProps) {
  const { phase, flags } = useVariableTheme(tokenId);
  const [compatibilityScore, setCompatibilityScore] = useState(0);
  const [browserSupport, setBrowserSupport] = useState({ 
    cssVariables: true, 
    backdropFilter: true, 
    gridLayout: true 
  });
  const [errorLog, setErrorLog] = useState<Array<{ error: Error; context: string; timestamp: number }>>([]);

  // Check browser compatibility on mount
  useEffect(() => {
    const checkBrowserSupport = () => {
      if (typeof window === 'undefined') return;

      const cssVariables = window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--test)');
      const backdropFilter = window.CSS && window.CSS.supports && window.CSS.supports('backdrop-filter', 'blur(1px)');
      const gridLayout = window.CSS && window.CSS.supports && window.CSS.supports('display', 'grid');

      setBrowserSupport({ cssVariables, backdropFilter, gridLayout });
      
      // Calculate compatibility score based on browser support
      let score = 0;
      if (cssVariables) score += 60; // Most important
      if (backdropFilter) score += 20;
      if (gridLayout) score += 20;
      
      setCompatibilityScore(score);
    };

    checkBrowserSupport();
  }, []);

  // Determine if we're in compatibility mode
  const isCompatibilityMode = useMemo(() => {
    if (fallbackStrategy === 'legacy') return false;
    if (fallbackStrategy === 'variable') return false;
    
    // Auto mode - check if we need compatibility
    return phase === 'hybrid' || compatibilityScore < 100 || !browserSupport.cssVariables;
  }, [phase, compatibilityScore, browserSupport, fallbackStrategy]);

  // Background conversion utility
  const convertBackground = useMemo(() => {
    return (background: string) => {
      try {
        const converted = migrationAdapter.convertToVariableBackground(background, 'primary');
        const hasVariableSupport = Object.keys(converted.cssVariables).length > 0;
        
        let fallbackStrategy: 'legacy' | 'variable' | 'hybrid' = 'legacy';
        
        if (phase === 'variable' && hasVariableSupport && browserSupport.cssVariables) {
          fallbackStrategy = 'variable';
        } else if (phase === 'hybrid' && hasVariableSupport) {
          fallbackStrategy = 'hybrid';
        }
        
        return {
          legacy: background,
          variable: hasVariableSupport ? converted.structuralClass : undefined,
          cssVariables: hasVariableSupport ? converted.cssVariables : undefined,
          fallbackStrategy
        };
      } catch (error) {
        console.warn('Background conversion failed:', error);
        return {
          legacy: background,
          fallbackStrategy: 'legacy' as const
        };
      }
    };
  }, [phase, browserSupport]);

  // Optimal render strategy
  const getOptimalRenderStrategy = useMemo(() => {
    return (background: string): 'legacy' | 'variable' | 'hybrid' => {
      const converted = convertBackground(background);
      
      // If forced to legacy mode
      if (fallbackStrategy === 'legacy' || !browserSupport.cssVariables) {
        return 'legacy';
      }
      
      // If forced to variable mode
      if (fallbackStrategy === 'variable' && converted.variable) {
        return 'variable';
      }
      
      // Auto mode - choose optimal strategy
      if (phase === 'variable' && converted.variable && compatibilityScore >= 80) {
        return 'variable';
      }
      
      if (phase === 'hybrid' && converted.variable) {
        return 'hybrid';
      }
      
      return 'legacy';
    };
  }, [convertBackground, fallbackStrategy, browserSupport, phase, compatibilityScore]);

  // Should use variables check
  const shouldUseVariables = useMemo(() => {
    return (background: string): boolean => {
      const strategy = getOptimalRenderStrategy(background);
      return strategy === 'variable' || strategy === 'hybrid';
    };
  }, [getOptimalRenderStrategy]);

  // Migration recommendation
  const getMigrationRecommendation = useMemo(() => {
    return () => {
      const reasons: string[] = [];
      let canMigrate = true;
      let strategy: 'immediate' | 'gradual' | 'postpone' = 'gradual';
      
      // Check browser support
      if (!browserSupport.cssVariables) {
        canMigrate = false;
        reasons.push('Browser does not support CSS variables');
        strategy = 'postpone';
      }
      
      // Check compatibility score
      if (compatibilityScore < 50) {
        reasons.push(`Low compatibility score: ${compatibilityScore}%`);
        strategy = 'postpone';
      } else if (compatibilityScore >= 80) {
        reasons.push('High compatibility score');
        strategy = 'immediate';
      }
      
      // Check error rate
      const recentErrors = errorLog.filter(log => Date.now() - log.timestamp < 300000); // 5 minutes
      if (recentErrors.length > 5) {
        reasons.push('High error rate detected');
        strategy = 'postpone';
      }
      
      // Check feature flags
      if (!flags.enableVariableMode && !flags.enableHybridMode) {
        canMigrate = false;
        reasons.push('Variable mode disabled by feature flags');
        strategy = 'postpone';
      }
      
      if (reasons.length === 0) {
        reasons.push('All compatibility checks passed');
      }
      
      return { canMigrate, strategy, reasons };
    };
  }, [browserSupport, compatibilityScore, errorLog, flags]);

  // Error handling
  const handleCompatibilityError = useMemo(() => {
    return (error: Error, context: string) => {
      console.error(`Hybrid compatibility error in ${context}:`, error);
      
      setErrorLog(prev => [...prev.slice(-9), { // Keep last 10 errors
        error,
        context,
        timestamp: Date.now()
      }]);
      
      // Auto-fallback to legacy mode if too many errors
      const recentErrors = errorLog.filter(log => Date.now() - log.timestamp < 300000); // 5 minutes
      if (recentErrors.length > 3) {
        console.warn('Too many compatibility errors, considering fallback to legacy mode');
        // Could trigger automatic mode switch here
      }
    };
  }, [errorLog]);

  const contextValue: HybridCompatibilityContext = {
    mode: phase,
    isCompatibilityMode,
    hasVariableSupport: browserSupport.cssVariables,
    compatibilityScore,
    convertBackground,
    getOptimalRenderStrategy,
    shouldUseVariables,
    getMigrationRecommendation,
    handleCompatibilityError,
  };

  // Debug overlay for development
  const debugOverlay = useMemo(() => {
    if (!debugMode || process.env.NODE_ENV !== 'development') {
      return null;
    }

    const recommendation = getMigrationRecommendation();
    const recentErrors = errorLog.filter(log => Date.now() - log.timestamp < 300000);

    return (
      <div className="fixed bottom-16 left-4 bg-black/90 text-white p-3 rounded text-xs font-mono z-50 max-w-sm">
        <div className="font-bold mb-2">Hybrid Compatibility Debug</div>
        <div className="space-y-1">
          <div>Mode: {phase}</div>
          <div>Compatibility: {isCompatibilityMode ? 'ON' : 'OFF'}</div>
          <div>Score: {compatibilityScore}%</div>
          <div>CSS Variables: {browserSupport.cssVariables ? '✅' : '❌'}</div>
          <div>Backdrop Filter: {browserSupport.backdropFilter ? '✅' : '❌'}</div>
          <div>Strategy: {fallbackStrategy}</div>
          <div>Migration: {recommendation.strategy}</div>
          <div>Errors (5min): {recentErrors.length}</div>
          {recentErrors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-400">Recent Errors</summary>
              <div className="mt-1 text-xs text-red-300 max-h-20 overflow-y-auto">
                {recentErrors.map((log, index) => (
                  <div key={index}>{log.context}: {log.error.message}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }, [debugMode, phase, isCompatibilityMode, compatibilityScore, browserSupport, fallbackStrategy, getMigrationRecommendation, errorLog]);

  return (
    <HybridCompatibilityContext.Provider value={contextValue}>
      {children}
      {debugOverlay}
    </HybridCompatibilityContext.Provider>
  );
}

/**
 * Hook to use hybrid compatibility context
 */
export function useHybridCompatibility() {
  const context = useContext(HybridCompatibilityContext);
  
  if (!context) {
    throw new Error('useHybridCompatibility must be used within HybridModeCompatibility provider');
  }
  
  return context;
}

/**
 * Higher-order component for automatic compatibility handling
 */
export function withHybridCompatibility<T extends { background?: string }>(
  WrappedComponent: React.ComponentType<T>,
  options: {
    enableAutoFallback?: boolean;
    logErrors?: boolean;
  } = {}
) {
  const WithHybridCompatibilityComponent = (props: T) => {
    const compatibility = useHybridCompatibility();
    
    // Automatically convert background if provided
    const enhancedProps = useMemo(() => {
      if (!props.background || !compatibility.isCompatibilityMode) {
        return props;
      }
      
      try {
        const converted = compatibility.convertBackground(props.background);
        const strategy = compatibility.getOptimalRenderStrategy(props.background);
        
        return {
          ...props,
          background: strategy === 'variable' && converted.variable ? converted.variable : converted.legacy,
          cssVariables: strategy !== 'legacy' ? converted.cssVariables : undefined,
          renderStrategy: strategy,
        } as T;
      } catch (error) {
        if (options.logErrors) {
          compatibility.handleCompatibilityError(error as Error, 'withHybridCompatibility');
        }
        
        return props;
      }
    }, [props, compatibility]);
    
    return <WrappedComponent {...enhancedProps} />;
  };
  
  WithHybridCompatibilityComponent.displayName = `withHybridCompatibility(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithHybridCompatibilityComponent;
}

/**
 * Utility component for testing compatibility
 */
export function CompatibilityTest({ backgrounds }: { backgrounds: string[] }) {
  const compatibility = useHybridCompatibility();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <h3 className="font-bold mb-2">Compatibility Test</h3>
      <div className="space-y-2">
        {backgrounds.map((bg, index) => {
          const converted = compatibility.convertBackground(bg);
          const strategy = compatibility.getOptimalRenderStrategy(bg);
          
          return (
            <div key={index} className="text-sm">
              <div className="font-medium">{bg.slice(0, 30)}...</div>
              <div className="text-xs text-gray-600 ml-2">
                Strategy: {strategy} | Variables: {converted.cssVariables ? Object.keys(converted.cssVariables).length : 0}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}