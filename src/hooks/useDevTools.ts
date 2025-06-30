// hooks/useDevTools.ts - React Hook for Dev Tools Integration
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditStore } from './useEditStore';
import { getDevTools, measurePerformance, withErrorTracking } from '@/utils/devTools';
import type { DevToolsManager, ActionHistoryEntry, PerformanceEntry } from '@/utils/devTools';

/**
 * ===== HOOK TYPES =====
 */

interface DevToolsHookConfig {
  enabled?: boolean;
  trackActions?: boolean;
  trackPerformance?: boolean;
  componentName?: string;
  autoInit?: boolean;
}

interface DevToolsHookReturn {
  // State
  isEnabled: boolean;
  actionHistory: ActionHistoryEntry[];
  slowRenders: PerformanceEntry[];
  errorCount: number;
  
  // Actions  
  trackAction: (actionName: string, payload?: any) => void;
  trackError: (error: Error, context?: string) => void;
  measureRender: <T extends (...args: any[]) => any>(fn: T) => T;
  
  // Analysis
  analyzeStore: () => any;
  validateStore: () => string[];
  getPerformanceStats: () => {
    totalRenders: number;
    slowRenders: number;
    averageRenderTime: number;
  };
  
  // Controls
  clearLogs: () => void;
  exportLogs: () => any;
  
  // Dev tools instance (for advanced usage)
  devTools: DevToolsManager;
}

/**
 * ===== MAIN HOOK =====
 */

const useDevToolsHook = (config: DevToolsHookConfig = {}): DevToolsHookReturn => {
  const finalConfig = {
    enabled: process.env.NODE_ENV === 'development',
    trackActions: true,
    trackPerformance: true,
    componentName: 'UnknownComponent',
    autoInit: true,
    ...config,
  };

  const store = useEditStore();
  const devToolsRef = useRef<DevToolsManager | null>(null);
  const renderCountRef = useRef(0);

  // Initialize dev tools
  useEffect(() => {
    if (!finalConfig.enabled || !finalConfig.autoInit) return;

    if (!devToolsRef.current) {
      devToolsRef.current = getDevTools();
      devToolsRef.current.init(store);
    }

    return () => {
      // Cleanup on unmount - don't destroy singleton, just clear reference
      devToolsRef.current = null;
    };
  }, [finalConfig.enabled, finalConfig.autoInit, store]);

  // Track component renders
  useEffect(() => {
    if (!finalConfig.trackPerformance || !devToolsRef.current) return;

    renderCountRef.current += 1;
    
    // Track this render performance
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      devToolsRef.current?.trackPerformance(
        finalConfig.componentName || 'Hook',
        'render',
        duration
      );
    };
  });

  /**
   * ===== MEMOIZED VALUES =====
   */

  const devToolsState = useMemo(() => {
    if (!devToolsRef.current) {
      return {
        actionHistory: [],
        slowRenders: [],
        errorCount: 0,
      };
    }

    // Access the internal state - in real implementation, this would be exposed via methods
    const state = (devToolsRef.current as any).state;
    return {
      actionHistory: state?.actionHistory || [],
      slowRenders: state?.slowRenders || [],
      errorCount: state?.errorLog?.length || 0,
    };
  }, [devToolsRef.current]);

  const performanceStats = useMemo(() => {
    const slowRenders = devToolsState.slowRenders;
    const allRenders = devToolsState.slowRenders; // In full implementation, would track all renders
    
    return {
      totalRenders: renderCountRef.current,
      slowRenders: slowRenders.length,
      averageRenderTime: allRenders.length > 0 
        ? allRenders.reduce((sum: number, entry: PerformanceEntry) => sum + entry.duration, 0) / allRenders.length 
        : 0,
    };
  }, [devToolsState.slowRenders, renderCountRef.current]);

  /**
   * ===== CALLBACK FUNCTIONS =====
   */

  const trackAction = useCallback((actionName: string, payload?: any) => {
    if (!finalConfig.trackActions || !devToolsRef.current) return;

    // Create a manual action entry
    const actionEntry = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionName,
      payload: payload || {},
      timestamp: Date.now(),
      stateBefore: null, // Would capture state in real implementation
      stateAfter: null,
      duration: 0,
      source: 'user' as const,
    };

    // Add to history (accessing internal state)
    const state = (devToolsRef.current as any).state;
    if (state?.actionHistory) {
      state.actionHistory.push(actionEntry);
      
      // Limit history size
      if (state.actionHistory.length > 100) {
        state.actionHistory = state.actionHistory.slice(-100);
      }
    }

    console.log('🔍 Manual action tracked:', actionName, payload);
  }, [finalConfig.trackActions]);

  const trackError = useCallback((error: Error, context: string = 'useDevTools') => {
    if (!devToolsRef.current) return;

    devToolsRef.current.trackError(error, context);
  }, []);

  const measureRender = useCallback(<T extends (...args: any[]) => any>(fn: T): T => {
    if (!finalConfig.trackPerformance) return fn;

    return measurePerformance(fn, finalConfig.componentName || 'Hook', 'render');
  }, [finalConfig.trackPerformance, finalConfig.componentName]);

  const analyzeStore = useCallback(() => {
    if (!devToolsRef.current) return null;
    return devToolsRef.current.analyzeStoreState();
  }, []);

  const validateStore = useCallback((): string[] => {
    if (!devToolsRef.current) return [];
    return devToolsRef.current.validateStoreState();
  }, []);

  const clearLogs = useCallback(() => {
    if (!devToolsRef.current) return;

    // Access internal methods (in real implementation, these would be public)
    const devTools = devToolsRef.current as any;
    devTools.clearActionHistory?.();
    devTools.clearPerformanceLog?.();
    devTools.clearErrorLog?.();

    console.log('🧹 Dev tools logs cleared');
  }, []);

  const exportLogs = useCallback(() => {
    if (!devToolsRef.current) return null;

    const state = (devToolsRef.current as any).state;
    
    return {
      timestamp: Date.now(),
      config: finalConfig,
      actionHistory: state?.actionHistory || [],
      performanceLog: state?.performanceLog || [],
      slowRenders: state?.slowRenders || [],
      errorLog: state?.errorLog || [],
      storeAnalysis: analyzeStore(),
      validationIssues: validateStore(),
    };
  }, [finalConfig, analyzeStore, validateStore]);

  /**
   * ===== RETURN OBJECT =====
   */

  return {
    // State
    isEnabled: finalConfig.enabled,
    actionHistory: devToolsState.actionHistory,
    slowRenders: devToolsState.slowRenders,
    errorCount: devToolsState.errorCount,
    
    // Actions
    trackAction,
    trackError,
    measureRender,
    
    // Analysis
    analyzeStore,
    validateStore,
    getPerformanceStats: () => performanceStats,
    
    // Controls
    clearLogs,
    exportLogs,
    
    // Dev tools instance
    devTools: devToolsRef.current || getDevTools(),
  };
};

/**
 * ===== SPECIALIZED HOOKS =====
 */

// Hook for performance tracking only
const usePerformanceTrackingHook = (componentName: string) => {
  const { measureRender, getPerformanceStats, slowRenders } = useDevToolsHook({
    componentName,
    trackActions: false,
    trackPerformance: true,
  });

  return {
    measureRender,
    getPerformanceStats,
    slowRenders,
  };
};

// Hook for action tracking only
const useActionTrackingHook = () => {
  const { trackAction, actionHistory, clearLogs } = useDevToolsHook({
    trackPerformance: false,
    trackActions: true,
  });

  return {
    trackAction,
    actionHistory,
    clearLogs,
  };
};

// Hook for error tracking
const useErrorTrackingHook = (context: string = 'component') => {
  const { trackError, errorCount } = useDevToolsHook({
    trackActions: false,
    trackPerformance: false,
  });

  const withErrorHandling = useCallback(<T extends (...args: any[]) => any>(fn: T): T => {
    return withErrorTracking(fn, context);
  }, [context]);

  return {
    trackError,
    errorCount,
    withErrorHandling,
  };
};

/**
 * ===== COMPONENT WRAPPER UTILITIES =====
 */

// HOC for automatic dev tools integration
const withDevToolsHOC = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  const WrappedComponent = (props: P) => {
    const { measureRender, trackError } = useDevToolsHook({
      componentName: componentName || Component.displayName || Component.name,
    });

    const renderWithTracking = measureRender(() => {
      try {
        return React.createElement(Component, props);
      } catch (error) {
        trackError(error as Error, `${componentName}-render`);
        throw error;
      }
    });

    return renderWithTracking();
  };

  WrappedComponent.displayName = `withDevTools(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * ===== PERFORMANCE MEASUREMENT UTILITIES =====
 */

const useMeasuredCallbackHook = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  operationName: string = 'callback'
): T => {
  const { measureRender } = useDevToolsHook({
    trackActions: false,
    trackPerformance: true,
  });

  return React.useCallback(
    measureRender(callback),
    [measureRender, ...deps]
  ) as T;
};

const useMeasuredMemoHook = <T>(
  factory: () => T,
  deps: React.DependencyList,
  operationName: string = 'memo'
): T => {
  const { measureRender } = useDevToolsHook({
    trackActions: false,
    trackPerformance: true,
  });

  return React.useMemo(
    measureRender(factory),
    [measureRender, ...deps]
  );
};

/**
 * ===== DEBUGGING UTILITIES =====
 */

const useStoreWatcherHook = (
  selector: (state: any) => any,
  watchName: string = 'unknown'
) => {
  const store = useEditStore();
  const { trackAction } = useDevToolsHook();
  const previousValueRef = useRef<any>();

  const currentValue = selector(store);

  useEffect(() => {
    if (previousValueRef.current !== undefined && previousValueRef.current !== currentValue) {
      trackAction(`store_watch_${watchName}`, {
        previousValue: previousValueRef.current,
        currentValue,
        watchName,
      });
    }
    previousValueRef.current = currentValue;
  }, [currentValue, trackAction, watchName]);

  return currentValue;
};

const useDebugRendersHook = (componentName: string, props?: Record<string, any>) => {
  const renderCount = useRef(0);
  const previousProps = useRef<Record<string, any>>();
  const { trackAction } = useDevToolsHook();

  renderCount.current += 1;

  useEffect(() => {
    if (renderCount.current > 1) {
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      if (props && previousProps.current) {
        Object.keys({ ...props, ...previousProps.current }).forEach(key => {
          if (props[key] !== previousProps.current![key]) {
            changedProps[key] = {
              from: previousProps.current![key],
              to: props[key],
            };
          }
        });
      }

      trackAction(`debug_render_${componentName}`, {
        renderCount: renderCount.current,
        changedProps: Object.keys(changedProps).length > 0 ? changedProps : undefined,
        hasPropsChange: Object.keys(changedProps).length > 0,
      });
    }

    previousProps.current = props;
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 ${componentName} render #${renderCount.current}`, {
      props,
      renderCount: renderCount.current,
    });
  }

  return renderCount.current;
};

/**
 * ===== DEVELOPMENT CONSOLE COMMANDS =====
 */

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Add helpful console commands
  (window as any).__devToolsCommands = {
    // Quick access functions
    analyze: () => {
      const devTools = getDevTools();
      return devTools.analyzeStoreState();
    },
    
    validate: () => {
      const devTools = getDevTools();
      return devTools.validateStoreState();
    },
    
    history: (count: number = 10) => {
      const debug = (window as any).__editStoreDebug;
      return debug?.getLastActions?.(count) || [];
    },
    
    performance: () => {
      const debug = (window as any).__editStoreDebug;
      return debug?.getSlowRenders?.() || [];
    },
    
    clear: () => {
      const debug = (window as any).__editStoreDebug;
      debug?.clearActionHistory?.();
      debug?.clearPerformanceLog?.();
      debug?.clearErrorLog?.();
      console.clear();
      console.log('🧹 All dev tools logs cleared');
    },
    
    export: () => {
      const debug = (window as any).__editStoreDebug;
      const data = {
        timestamp: Date.now(),
        store: debug?.getState?.(),
        actions: debug?.getActionHistory?.(),
        performance: debug?.getPerformanceLog?.(),
        errors: debug?.getErrorLog?.(),
      };
      
      console.log('📦 Exported dev data:', data);
      
      // Copy to clipboard if possible
      if (navigator.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        console.log('📋 Data copied to clipboard');
      }
      
      return data;
    },
    
    help: () => {
      console.log(`
🔧 Dev Tools Commands:
  __devToolsCommands.analyze()     - Analyze store state
  __devToolsCommands.validate()    - Validate store consistency  
  __devToolsCommands.history(n)    - Show last n actions
  __devToolsCommands.performance() - Show slow renders
  __devToolsCommands.clear()       - Clear all logs
  __devToolsCommands.export()      - Export all dev data
  __devToolsCommands.help()        - Show this help
  
🏪 Store Debug (window.__editStoreDebug):
  getState()           - Get current store state
  getActionHistory()   - Get all actions
  getSlowRenders()     - Get performance issues
  analyzeStore()       - Run store analysis
  validateStore()      - Run store validation
  triggerAutoSave()    - Force auto-save
  exportState()        - Export store state
      `);
    },
  };

  console.log('🛠️ Dev tools commands available at window.__devToolsCommands');
  console.log('   Type __devToolsCommands.help() for help');
}

/**
 * ===== EXPORTS =====
 */

export type {
  DevToolsHookConfig,
  DevToolsHookReturn,
};

export {
  useDevToolsHook as useDevTools,
  usePerformanceTrackingHook as usePerformanceTracking,
  useActionTrackingHook as useActionTracking,
  useErrorTrackingHook as useErrorTracking,
  withDevToolsHOC as withDevTools,
  useMeasuredCallbackHook as useMeasuredCallback,
  useMeasuredMemoHook as useMeasuredMemo,
  useStoreWatcherHook as useStoreWatcher,
  useDebugRendersHook as useDebugRenders,
};