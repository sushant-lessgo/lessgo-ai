// Variable Background Renderer - Renders backgrounds using CSS variables for variable mode
// Supports hybrid mode with fallback to legacy Tailwind classes

'use client';

import { useMemo, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { getMigrationFeatureFlags, determineMigrationPhase, type FeatureFlagContext } from '@/utils/featureFlags';
import { migrationAdapter } from './migrationAdapter';
import type { BackgroundSystem } from '../background/colorTokens';
import type { LegacyBackgroundVariation, VariableBackgroundVariation } from './migrationAdapter';

interface VariableBackgroundRendererProps {
  tokenId: string;
  background: string | BackgroundSystem;
  customColors?: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
  sectionId?: string;
  fallbackToLegacy?: boolean;
  debugMode?: boolean;
}

interface BackgroundRenderResult {
  className: string;
  style?: CSSProperties;
  'data-background-mode'?: string;
  'data-background-variation'?: string;
}

/**
 * Variable Background Renderer Component
 * 
 * This component:
 * 1. Detects migration phase (legacy/hybrid/variable)
 * 2. Converts background strings/systems to appropriate format
 * 3. Applies CSS variables or legacy classes based on mode
 * 4. Provides smooth fallback for unsupported patterns
 */
export function VariableBackgroundRenderer({
  tokenId,
  background,
  customColors = {},
  className,
  children,
  sectionId,
  fallbackToLegacy = true,
  debugMode = false
}: VariableBackgroundRendererProps) {
  // Get feature flags directly to avoid circular dependency
  const variableState = useMemo(() => {
    const context: FeatureFlagContext = { tokenId };
    const flags = getMigrationFeatureFlags(context);
    const phase = determineMigrationPhase(flags, context);
    
    return {
      phase,
      isVariableMode: phase === 'variable',
      isHybridMode: phase === 'hybrid',
      isLegacyMode: phase === 'legacy',
    };
  }, [tokenId]);
  
  const { phase, isVariableMode, isHybridMode } = variableState;
  
  // Process background based on current phase
  const backgroundProps = useMemo<BackgroundRenderResult>(() => {
    // Handle different background input types
    const bgClass = typeof background === 'string' 
      ? background 
      : background?.primary || 'bg-white';
    
    // Legacy mode - use original classes
    if (phase === 'legacy') {
      return {
        className: cn(bgClass, className),
        'data-background-mode': 'legacy'
      };
    }
    
    // Variable or hybrid mode - attempt conversion
    try {
      // Check if this is a bgVariation ID or a Tailwind class
      const isVariationId = bgClass.includes('variation-') || bgClass.includes('archetype-');
      
      if (isVariationId) {
        // This is a variation ID, need to look up actual classes
        // For now, treat as legacy
        if (fallbackToLegacy) {
          return {
            className: cn(bgClass, className),
            'data-background-mode': 'legacy-variation',
            'data-background-variation': bgClass
          };
        }
      }
      
      // Convert Tailwind class to variable format
      const converted = migrationAdapter.convertToVariableBackground(bgClass, 'primary');
      
      if (phase === 'variable' && converted.structuralClass) {
        // Full variable mode - use structural class with CSS variables
        const variables = { ...converted.cssVariables, ...customColors };
        
        return {
          className: cn(converted.structuralClass, className),
          style: convertToStyleObject(variables),
          'data-background-mode': 'variable',
          'data-background-variation': bgClass
        };
      }
      
      if (phase === 'hybrid') {
        // Hybrid mode - use both for smooth transition
        const variables = { ...converted.cssVariables, ...customColors };
        const hasVariableSupport = Object.keys(variables).length > 0;
        
        if (hasVariableSupport) {
          return {
            className: cn(converted.structuralClass, converted.fallback, className),
            style: convertToStyleObject(variables),
            'data-background-mode': 'hybrid',
            'data-background-variation': bgClass
          };
        }
        
        // No variable support, fall back to legacy
        return {
          className: cn(bgClass, className),
          'data-background-mode': 'hybrid-legacy',
          'data-background-variation': bgClass
        };
      }
      
      // Fallback to legacy
      return {
        className: cn(bgClass, className),
        'data-background-mode': 'fallback'
      };
      
    } catch (error) {
      console.warn('VariableBackgroundRenderer: Failed to convert background:', error);
      
      // Error fallback - use original class
      if (fallbackToLegacy) {
        return {
          className: cn(bgClass, className),
          'data-background-mode': 'error-fallback'
        };
      }
      
      // No fallback - use neutral background
      return {
        className: cn('bg-gray-50', className),
        'data-background-mode': 'error-neutral'
      };
    }
  }, [background, phase, className, customColors, fallbackToLegacy]);
  
  // Debug overlay for development
  const debugOverlay = useMemo(() => {
    if (!debugMode || process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    const bgClass = typeof background === 'string' ? background : background?.primary;
    const mode = backgroundProps['data-background-mode'];
    const hasVariables = backgroundProps.style && Object.keys(backgroundProps.style).length > 0;
    
    return (
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded z-50 max-w-xs">
        <div className="font-bold mb-1">Background Debug</div>
        <div>Mode: {mode}</div>
        <div>Phase: {phase}</div>
        <div>Class: {bgClass?.slice(0, 30)}...</div>
        <div>Variables: {hasVariables ? 'Yes' : 'No'}</div>
        {customColors && Object.keys(customColors).length > 0 && (
          <div>Custom: {Object.keys(customColors).length}</div>
        )}
      </div>
    );
  }, [debugMode, background, phase, backgroundProps, customColors]);
  
  return (
    <div 
      {...backgroundProps}
      data-section-id={sectionId}
      data-token-id={tokenId}
    >
      {debugOverlay}
      {children}
    </div>
  );
}

/**
 * Hook for using variable background rendering
 */
export function useVariableBackground(
  tokenId: string,
  background: string | BackgroundSystem,
  customColors?: Record<string, string>
) {
  const { phase, isVariableMode, isHybridMode } = useVariableTheme(tokenId);
  
  return useMemo(() => {
    const bgClass = typeof background === 'string' 
      ? background 
      : background?.primary || 'bg-white';
    
    // Legacy mode
    if (phase === 'legacy') {
      return {
        className: bgClass,
        style: undefined,
        isVariable: false,
        mode: 'legacy' as const
      };
    }
    
    try {
      // Convert to variable format
      const converted = migrationAdapter.convertToVariableBackground(bgClass, 'primary');
      const variables = { ...converted.cssVariables, ...customColors };
      
      if (phase === 'variable' && converted.structuralClass) {
        return {
          className: converted.structuralClass,
          style: convertToStyleObject(variables),
          isVariable: true,
          mode: 'variable' as const
        };
      }
      
      if (phase === 'hybrid') {
        return {
          className: `${converted.structuralClass} ${converted.fallback}`,
          style: convertToStyleObject(variables),
          isVariable: true,
          mode: 'hybrid' as const
        };
      }
      
      // Fallback
      return {
        className: bgClass,
        style: undefined,
        isVariable: false,
        mode: 'fallback' as const
      };
      
    } catch {
      return {
        className: bgClass,
        style: undefined,
        isVariable: false,
        mode: 'error' as const
      };
    }
  }, [phase, background, customColors]);
}

/**
 * Component for rendering background variations with variable support
 */
export function VariableBackgroundVariation({
  variation,
  tokenId,
  customColors,
  className,
  children,
  onClick,
  selected = false
}: {
  variation: LegacyBackgroundVariation | VariableBackgroundVariation;
  tokenId: string;
  customColors?: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const { phase } = useVariableTheme(tokenId);
  
  const backgroundProps = useMemo(() => {
    // Check if this is already a variable variation
    const isVariable = 'structuralClass' in variation;
    
    if (phase === 'legacy' || !isVariable) {
      // Use legacy tailwind class
      return {
        className: cn(
          variation.tailwindClass,
          selected && 'ring-2 ring-blue-500',
          className
        )
      };
    }
    
    const varVariation = variation as VariableBackgroundVariation;
    
    if (phase === 'variable') {
      // Full variable mode
      const variables = { ...varVariation.cssVariables, ...customColors };
      
      return {
        className: cn(
          varVariation.structuralClass,
          selected && 'ring-2 ring-blue-500',
          className
        ),
        style: convertToStyleObject(variables)
      };
    }
    
    // Hybrid mode
    const variables = { ...varVariation.cssVariables, ...customColors };
    
    return {
      className: cn(
        varVariation.structuralClass,
        varVariation.fallbackClass,
        selected && 'ring-2 ring-blue-500',
        className
      ),
      style: convertToStyleObject(variables)
    };
  }, [variation, phase, customColors, selected, className]);
  
  return (
    <div
      {...backgroundProps}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-variation-id={variation.variationId}
      data-archetype={variation.archetypeId}
      data-selected={selected}
    >
      {children}
    </div>
  );
}

/**
 * Batch renderer for multiple background sections
 */
export function VariableBackgroundSections({
  tokenId,
  sections,
  customColors,
  debugMode = false
}: {
  tokenId: string;
  sections: Array<{
    id: string;
    background: string | BackgroundSystem;
    className?: string;
    children: React.ReactNode;
  }>;
  customColors?: Record<string, string>;
  debugMode?: boolean;
}) {
  return (
    <>
      {sections.map(section => (
        <VariableBackgroundRenderer
          key={section.id}
          tokenId={tokenId}
          background={section.background}
          customColors={customColors}
          className={section.className}
          sectionId={section.id}
          debugMode={debugMode}
        >
          {section.children}
        </VariableBackgroundRenderer>
      ))}
    </>
  );
}

// Utility functions

function convertToStyleObject(variables: Record<string, string>): CSSProperties {
  const style: CSSProperties = {};
  
  Object.entries(variables).forEach(([key, value]) => {
    // Convert CSS variable names to React style properties
    // CSS variables stay as-is
    if (key.startsWith('--')) {
      (style as any)[key] = value;
    } else {
      // Convert kebab-case to camelCase for non-variable properties
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      (style as any)[camelKey] = value;
    }
  });
  
  return style;
}

/**
 * Utility to check if a background supports variables
 */
export function supportsVariables(background: string): boolean {
  try {
    const converted = migrationAdapter.convertToVariableBackground(background, 'test');
    return Object.keys(converted.cssVariables).length > 0;
  } catch {
    return false;
  }
}

/**
 * Utility to get variable compatibility score
 */
export function getVariableCompatibilityScore(backgrounds: string[]): number {
  const supportedCount = backgrounds.filter(bg => supportsVariables(bg)).length;
  return (supportedCount / backgrounds.length) * 100;
}