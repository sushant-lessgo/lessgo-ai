/**
 * Performance Monitor Hook - Track and analyze application performance
 * Monitors store operations, rendering, and user interactions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditStoreContext } from '@/components/EditProvider';

import { logger } from '@/lib/logger';
interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'store' | 'render' | 'user' | 'network';
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalEntries: number;
  averageDuration: number;
  slowestOperation: PerformanceEntry | null;
  fastestOperation: PerformanceEntry | null;
  entriesByType: Record<string, number>;
  recentEntries: PerformanceEntry[];
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  maxEntries?: number;
  slowThreshold?: number;
  trackStore?: boolean;
  trackRender?: boolean;
  trackUser?: boolean;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    maxEntries = 1000,
    slowThreshold = 100,
    trackStore = true,
    trackRender = true,
    trackUser = true,
  } = options;

  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    totalEntries: 0,
    averageDuration: 0,
    slowestOperation: null,
    fastestOperation: null,
    entriesByType: {},
    recentEntries: [],
  });

  const { store, tokenId } = useEditStoreContext();
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  // Track render performance
  useEffect(() => {
    if (!enabled || !trackRender) return;

    const now = performance.now();
    const renderDuration = now - lastRenderTimeRef.current;
    renderCountRef.current += 1;

    if (renderCountRef.current > 1) { // Skip first render
      addEntry({
        name: 'React Render',
        startTime: lastRenderTimeRef.current,
        endTime: now,
        duration: renderDuration,
        type: 'render',
        metadata: {
          renderCount: renderCountRef.current,
          tokenId,
        },
      });
    }

    lastRenderTimeRef.current = now;
  });

  // Track store operations
  useEffect(() => {
    if (!enabled || !trackStore || !store) return;

    // Wrap store methods to track performance
    const originalMethods = new Map();
    const storeState = store.getState();

    // List of methods to track
    const methodsToTrack = [
      'setSectionLayouts',
      'updateContent',
      'addSection',
      'removeSection',
      'setMode',
      'updateTheme',
      'triggerAutoSave',
    ];

    methodsToTrack.forEach(methodName => {
      if (typeof (storeState as any)[methodName] === 'function') {
        const originalMethod = (storeState as any)[methodName];
        originalMethods.set(methodName, originalMethod);

        // Replace with wrapped version
        (storeState as any)[methodName] = function(...args: any[]) {
          const startTime = performance.now();
          
          try {
            const result = originalMethod.apply(this, args);
            const endTime = performance.now();
            
            addEntry({
              name: `Store.${methodName}`,
              startTime,
              endTime,
              duration: endTime - startTime,
              type: 'store',
              metadata: {
                method: methodName,
                argsLength: args.length,
                tokenId,
              },
            });

            return result;
          } catch (error) {
            const endTime = performance.now();
            
            addEntry({
              name: `Store.${methodName}`,
              startTime,
              endTime,
              duration: endTime - startTime,
              type: 'store',
              metadata: {
                method: methodName,
                error: error instanceof Error ? error.message : 'Unknown error',
                tokenId,
              },
            });

            throw error;
          }
        };
      }
    });

    // Cleanup function to restore original methods
    return () => {
      originalMethods.forEach((originalMethod, methodName) => {
        (storeState as any)[methodName] = originalMethod;
      });
    };
  }, [enabled, trackStore, store, tokenId]);

  // Add performance entry
  const addEntry = useCallback((entry: PerformanceEntry) => {
    if (!enabled) return;

    setEntries(prevEntries => {
      const newEntries = [...prevEntries, entry];
      
      // Trim to max entries
      if (newEntries.length > maxEntries) {
        newEntries.splice(0, newEntries.length - maxEntries);
      }

      return newEntries;
    });

    // Log slow operations
    if (entry.duration > slowThreshold) {
      logger.warn(`🐌 Slow operation detected: ${entry.name} took ${Math.round(entry.duration)}ms`, entry);
    }
  }, [enabled, maxEntries, slowThreshold]);

  // Update stats when entries change
  useEffect(() => {
    if (entries.length === 0) return;

    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const averageDuration = totalDuration / entries.length;

    const sortedByDuration = [...entries].sort((a, b) => b.duration - a.duration);
    const slowestOperation = sortedByDuration[0] || null;
    const fastestOperation = sortedByDuration[sortedByDuration.length - 1] || null;

    const entriesByType = entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentEntries = entries.slice(-10); // Last 10 entries

    setStats({
      totalEntries: entries.length,
      averageDuration,
      slowestOperation,
      fastestOperation,
      entriesByType,
      recentEntries,
    });
  }, [entries]);

  // Manual timing functions
  const startTiming = useCallback((name: string, type: PerformanceEntry['type'] = 'user') => {
    if (!enabled) return () => {};

    const startTime = performance.now();

    return (metadata?: Record<string, any>) => {
      const endTime = performance.now();
      addEntry({
        name,
        startTime,
        endTime,
        duration: endTime - startTime,
        type,
        metadata: {
          ...metadata,
          tokenId,
        },
      });
    };
  }, [enabled, addEntry, tokenId]);

  // Time a function execution
  const timeFunction = useCallback(async <T>(
    name: string,
    fn: () => T | Promise<T>,
    type: PerformanceEntry['type'] = 'user'
  ): Promise<T> => {
    if (!enabled) {
      return await fn();
    }

    const stopTiming = startTiming(name, type);
    
    try {
      const result = await fn();
      stopTiming({ success: true });
      return result;
    } catch (error) {
      stopTiming({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [enabled, startTiming]);

  // Clear all entries
  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  // Export performance report
  const exportReport = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      tokenId,
      stats,
      entries: entries.slice(), // Copy of entries
      environment: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        } : undefined,
      },
    };
  }, [entries, stats, tokenId]);

  // Get slow operations
  const getSlowOperations = useCallback((threshold: number = slowThreshold) => {
    return entries.filter(entry => entry.duration > threshold);
  }, [entries, slowThreshold]);

  // Get operations by type
  const getOperationsByType = useCallback((type: PerformanceEntry['type']) => {
    return entries.filter(entry => entry.type === type);
  }, [entries]);

  return {
    // Data
    entries,
    stats,
    enabled,

    // Manual timing functions
    startTiming,
    timeFunction,

    // Analysis functions
    getSlowOperations,
    getOperationsByType,

    // Utility functions
    clearEntries,
    exportReport,

    // Configuration
    slowThreshold,
    maxEntries,
  };
}

// Hook for component-level performance tracking
export function useComponentPerformance(componentName: string) {
  const { timeFunction, startTiming } = usePerformanceMonitor();
  const renderStartRef = useRef<number>();

  // Track component lifecycle
  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    if (renderStartRef.current) {
      const duration = performance.now() - renderStartRef.current;
      // This would be tracked by the main monitor
    }
  });

  // Wrap effect functions for timing
  const timedEffect = useCallback((
    effect: React.EffectCallback,
    deps?: React.DependencyList
  ) => {
    return useEffect(() => {
      return timeFunction(`${componentName}.effect`, effect, 'render') as any;
    }, deps);
  }, [componentName, timeFunction]);

  // Time async operations
  const timedAsync = useCallback(<T>(
    operationName: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    return timeFunction(`${componentName}.${operationName}`, asyncFn, 'user');
  }, [componentName, timeFunction]);

  return {
    timedEffect,
    timedAsync,
    startTiming: (operationName: string) => startTiming(`${componentName}.${operationName}`),
  };
}

export default usePerformanceMonitor;