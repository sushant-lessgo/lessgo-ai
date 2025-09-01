// Variable Theme Injector - Injects CSS variables into the page for variable mode
// Supports hybrid mode with legacy fallbacks and feature flag integration

'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { getMigrationFeatureFlags, determineMigrationPhase, type MigrationPhase, type FeatureFlagContext } from '@/utils/featureFlags';
// import { generateVariableColorSystem, getCSSVariableDefinitions } from './variableColorTokens'; // File disabled
const generateVariableColorSystem = (bg: any, ctx?: any) => ({ /* stub */ });
const getCSSVariableDefinitions = (system: any) => ''; // stub returns empty string
import { migrationAdapter } from './migrationAdapter';
import { cssVariablePerformanceMonitor, withPerformanceMonitoring } from '@/utils/cssVariablePerformance';
import type { BackgroundSystem } from './colorTokens';
import { logger } from '@/lib/logger';
// import type { BusinessContext } from '@/types/core'; // Type not available
type BusinessContext = any;

interface VariableThemeInjectorProps {
  tokenId: string;
  backgroundSystem?: BackgroundSystem;
  customColors?: Record<string, string>;
  businessContext?: BusinessContext;
  sectionId?: string;
  children: React.ReactNode;
}

interface InjectorState {
  phase: MigrationPhase;
  cssVariables: Record<string, string>;
  isLoaded: boolean;
  error?: string;
}

/**
 * Variable Theme Injector Component
 * 
 * This component:
 * 1. Determines migration phase based on feature flags
 * 2. Generates CSS variables from background system
 * 3. Injects variables into DOM via style tag
 * 4. Supports hybrid mode with legacy fallbacks
 * 5. Provides hot-reloading of custom colors
 */
export function VariableThemeInjector({
  tokenId,
  backgroundSystem,
  customColors = {},
  businessContext,
  sectionId,
  children
}: VariableThemeInjectorProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get feature flags and determine migration phase
  const context: FeatureFlagContext = useMemo(() => ({ tokenId }), [tokenId]);
  const flags = useMemo(() => getMigrationFeatureFlags(context), [context]);
  const phase = useMemo(() => determineMigrationPhase(flags, context), [flags, context]);
  
  // Optimized CSS variable generation with performance monitoring
  const generateVariables = useCallback(withPerformanceMonitoring(() => {
    if (phase === 'legacy' || !backgroundSystem) {
      return { cssVariables: {}, variableCount: 0 };
    }

    // Generate variable color system from background system
    const variableSystem = generateVariableColorSystem(backgroundSystem, businessContext);
    
    // Convert background system to variables
    const { cssVariables: bgVariables } = migrationAdapter.convertBackgroundSystemToVariables(
      backgroundSystem,
      customColors
    );

    // Get all CSS variable definitions
    const systemVariables = Object.fromEntries(
      getCSSVariableDefinitions(variableSystem)
        .split('\n')
        .map(line => {
          const [key, value] = line.trim().replace(/[;:]$/, '').split(': ');
          return [key?.trim(), value?.trim()];
        })
        .filter(([key, value]) => key && value)
    );

    // Merge all variables
    const allVariables = {
      ...systemVariables,
      ...bgVariables,
      ...customColors
    };

    return {
      cssVariables: allVariables,
      variableCount: Object.keys(allVariables).length,
    };
  }, 'CSS Variable Generation'), [phase, backgroundSystem, businessContext, customColors]);

  // Generate CSS variables based on current background system
  const variableState = useMemo<InjectorState>(() => {
    const endTiming = cssVariablePerformanceMonitor.startTiming('Variable State Generation');
    
    try {
      if (phase === 'legacy' || !backgroundSystem) {
        endTiming();
        return {
          phase,
          cssVariables: {},
          isLoaded: true
        };
      }

      const { cssVariables, variableCount } = generateVariables();

      // Record performance metrics
      const duration = endTiming();
      cssVariablePerformanceMonitor.recordMetrics({
        variableGenerationTime: duration,
        cssSize: {
          variables: variableCount,
          estimated: variableCount * 100, // ~100 bytes per variable
        },
      });

      return {
        phase,
        cssVariables,
        isLoaded: true
      };
      
    } catch (error) {
      logger.error('VariableThemeInjector: Failed to generate variables:', error);
      
      return {
        phase,
        cssVariables: {},
        isLoaded: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [phase, backgroundSystem, customColors, businessContext]);

  // Inject CSS variables into DOM using a deferred effect to avoid render-time side effects
  useEffect(() => {
    if (!variableState.isLoaded || Object.keys(variableState.cssVariables).length === 0) {
      return;
    }

    // Use a timeout to defer DOM manipulation until after the render cycle
    const timeoutId = setTimeout(() => {
      const styleId = sectionId ? `variable-theme-${sectionId}` : `variable-theme-${tokenId}`;
      
      // Remove existing style tag
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create new style tag with CSS variables
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.type = 'text/css';
      
      // Generate CSS with proper scoping
      const cssContent = generateVariableCSS(variableState.cssVariables, sectionId);
      styleElement.innerHTML = cssContent;
      
      // Append to head
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;

      // Performance logging if enabled
      // if (flags.enablePerformanceLogging) {
      // }
    }, 0); // Defer to next tick

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [variableState, tokenId, sectionId, flags.enablePerformanceLogging, phase]);

  // Debug overlay for development
  const debugOverlay = useMemo(() => {
    if (!flags.enableMigrationDebug || process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50 max-w-xs">
        <div className="font-bold mb-1">Variable Theme Debug</div>
        <div>Mode: {phase}</div>
        <div>Variables: {Object.keys(variableState.cssVariables).length}</div>
        <div>Token: {tokenId.slice(0, 8)}...</div>
        {variableState.error && (
          <div className="text-red-400 mt-1">Error: {variableState.error}</div>
        )}
        {Object.keys(customColors).length > 0 && (
          <div className="text-green-400">Custom: {Object.keys(customColors).length}</div>
        )}
      </div>
    );
  }, [flags.enableMigrationDebug, phase, variableState, tokenId, customColors]);

  // Error boundary for variable injection
  if (variableState.error && phase === 'variable') {
    logger.warn('VariableThemeInjector: Falling back to legacy mode due to error:', variableState.error);
    
    return (
      <div ref={containerRef} data-theme-mode="legacy-fallback">
        {children}
        {debugOverlay}
      </div>
    );
  }

  // Main render - wrap children with theme context
  return (
    <div 
      ref={containerRef}
      data-theme-mode={phase}
      data-theme-token={tokenId}
      data-theme-variables={Object.keys(variableState.cssVariables).length}
      style={phase === 'variable' ? variableState.cssVariables : undefined}
    >
      {children}
      {debugOverlay}
    </div>
  );
}

/**
 * Generate CSS content with proper scoping
 */
function generateVariableCSS(variables: Record<string, string>, sectionId?: string): string {
  const variableDeclarations = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  if (sectionId) {
    // Scoped variables for specific section
    return `
[data-section-id="${sectionId}"] {
${variableDeclarations}
}
`;
  } else {
    // Global variables
    return `
:root {
${variableDeclarations}
}

/* Variable-based structural classes */
.bg-gradient-vars-tr { background: linear-gradient(to top right, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-gradient-vars-tl { background: linear-gradient(to top left, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-gradient-vars-br { background: linear-gradient(to bottom right, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-gradient-vars-bl { background: linear-gradient(to bottom left, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-gradient-vars-r { background: linear-gradient(to right, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-gradient-vars-l { background: linear-gradient(to left, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }

.bg-radial-vars-center { background: radial-gradient(ellipse at center, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-radial-vars-top { background: radial-gradient(ellipse at top, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-radial-vars-bottom { background: radial-gradient(ellipse at bottom, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }
.bg-radial-circle-vars { background: radial-gradient(circle at center, var(--gradient-from), var(--gradient-via, var(--gradient-from)), var(--gradient-to, transparent)); }

.bg-pattern-primary { background: var(--bg-primary-base, #3b82f6); }
.bg-pattern-secondary { background: var(--bg-secondary-base, #f3f4f6); }
.bg-pattern-neutral { background: var(--bg-neutral-base, #ffffff); }
.bg-pattern-divider { background: var(--bg-divider-base, #e5e7eb); }

/* Effect utility classes */
.blur-var-subtle { filter: blur(var(--blur-subtle, 2px)); }
.blur-var-medium { filter: blur(var(--blur-medium, 8px)); }
.blur-var-strong { filter: blur(var(--blur-strong, 16px)); }
.blur-var-extreme { filter: blur(var(--blur-extreme, 160px)); }

.backdrop-blur-var-md { backdrop-filter: blur(var(--backdrop-blur, 12px)); }

.opacity-var-10 { opacity: var(--opacity-10, 0.1); }
.opacity-var-20 { opacity: var(--opacity-20, 0.2); }
.opacity-var-30 { opacity: var(--opacity-30, 0.3); }
.opacity-var-50 { opacity: var(--opacity-50, 0.5); }
.opacity-var-70 { opacity: var(--opacity-70, 0.7); }
.opacity-var-80 { opacity: var(--opacity-80, 0.8); }
.opacity-var-90 { opacity: var(--opacity-90, 0.9); }
`;
  }
}

/**
 * Hook for consuming variable theme context
 */
export function useVariableTheme(tokenId: string) {
  const context = useMemo(() => ({ tokenId }), [tokenId]);
  const flags = useMemo(() => getMigrationFeatureFlags(context), [context]);
  const phase = useMemo(() => determineMigrationPhase(flags, context), [flags, context]);
  
  return {
    phase,
    flags,
    isVariableMode: phase === 'variable',
    isHybridMode: phase === 'hybrid',
    isLegacyMode: phase === 'legacy',
    canUseVariables: phase !== 'legacy'
  };
}

/**
 * Higher-order component for wrapping components with variable theme
 */
export function withVariableTheme<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options?: {
    fallbackToLegacy?: boolean;
    debugMode?: boolean;
  }
) {
  const WithVariableThemeComponent = (props: T & { tokenId: string }) => {
    const { tokenId, ...restProps } = props;
    const theme = useVariableTheme(tokenId);
    
    if (options?.fallbackToLegacy && !theme.canUseVariables) {
      return <WrappedComponent {...(restProps as T)} />;
    }
    
    return (
      <div data-variable-theme={theme.phase}>
        <WrappedComponent {...(restProps as T)} />
        {options?.debugMode && process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 left-4 bg-blue-500 text-white px-2 py-1 text-xs rounded">
            Theme: {theme.phase}
          </div>
        )}
      </div>
    );
  };
  
  WithVariableThemeComponent.displayName = `withVariableTheme(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithVariableThemeComponent;
}

/**
 * Utility component for testing variable injection
 */
export function VariableThemeTest({ tokenId }: { tokenId: string }) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <VariableThemeInjector
      tokenId={tokenId}
      backgroundSystem={{
        primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
        secondary: 'bg-blue-50',
        neutral: 'bg-white',
        divider: 'bg-gray-100',
        baseColor: 'blue',
        accentColor: 'purple',
        accentCSS: 'bg-purple-600'
      }}
      customColors={{
        '--test-primary': '#ff0000',
        '--test-secondary': '#00ff00'
      }}
    >
      <div className="p-4 space-y-4">
        <div className="bg-gradient-vars-r h-20 rounded">Variable Gradient</div>
        <div className="bg-pattern-primary h-20 rounded">Variable Primary</div>
        <div className="bg-pattern-secondary h-20 rounded">Variable Secondary</div>
        <div 
          className="h-20 rounded"
          style={{ background: 'var(--test-primary)' }}
        >
          Custom Color Test
        </div>
      </div>
    </VariableThemeInjector>
  );
}