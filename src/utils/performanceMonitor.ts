// utils/performanceMonitor.ts - Performance monitoring for store operations

import React from 'react';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  payload?: any;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  slowOperations: PerformanceMetric[];
  recentOperations: PerformanceMetric[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly slowThreshold = 100; // ms

  startOperation(operation: string, payload?: any): string {
    const operationId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    // Store start time temporarily
    this.metrics.push({
      operation: operationId,
      startTime,
      endTime: 0,
      duration: 0,
      payload,
    });
    
    return operationId;
  }

  endOperation(operationId: string): PerformanceMetric | null {
    const metricIndex = this.metrics.findIndex(m => m.operation === operationId);
    if (metricIndex === -1) return null;
    
    const metric = this.metrics[metricIndex];
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    // Update metric
    metric.endTime = endTime;
    metric.duration = duration;
    metric.operation = operationId.split('-')[0]; // Remove ID suffix
    
    // Log slow operations
    if (duration > this.slowThreshold) {
      console.warn(`⚠️ Slow operation detected: ${metric.operation} took ${duration.toFixed(2)}ms`);
    }
    
    // Trim metrics if too many
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    return metric;
  }

  getStats(): PerformanceStats {
    const completedMetrics = this.metrics.filter(m => m.endTime > 0);
    
    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: [],
        recentOperations: [],
      };
    }
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / completedMetrics.length;
    const slowOperations = completedMetrics.filter(m => m.duration > this.slowThreshold);
    const recentOperations = completedMetrics.slice(-10);
    
    return {
      totalOperations: completedMetrics.length,
      averageDuration,
      slowOperations,
      recentOperations,
    };
  }

  clear(): void {
    this.metrics = [];
  }

  logStats(): void {
    const stats = this.getStats();
    console.group('📊 Performance Stats');
    console.log('Total operations:', stats.totalOperations);
    console.log('Average duration:', `${stats.averageDuration.toFixed(2)}ms`);
    console.log('Slow operations:', stats.slowOperations.length);
    
    if (stats.slowOperations.length > 0) {
      console.group('🐌 Slow Operations');
      stats.slowOperations.forEach(op => {
        console.log(`${op.operation}: ${op.duration.toFixed(2)}ms`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for store actions
 */
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  operation: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const operationId = performanceMonitor.startOperation(operation, args);
    
    try {
      const result = fn(...args);
      
      // Handle async operations
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          performanceMonitor.endOperation(operationId);
        });
      }
      
      // Handle sync operations
      performanceMonitor.endOperation(operationId);
      return result;
    } catch (error) {
      performanceMonitor.endOperation(operationId);
      throw error;
    }
  }) as T;
}

/**
 * React hook for monitoring component re-renders
 */
export function useRenderTracking(componentName: string, props?: any) {
  if (process.env.NODE_ENV === 'development') {
    const renderCount = React.useRef(0);
    const lastProps = React.useRef(props);
    
    renderCount.current++;
    
    React.useEffect(() => {
      if (renderCount.current > 1) {
        console.log(`🔄 ${componentName} re-rendered (${renderCount.current} times)`);
        
        if (props && lastProps.current) {
          const changedProps = Object.keys(props).filter(
            key => props[key] !== lastProps.current[key]
          );
          
          if (changedProps.length > 0) {
            console.log(`📝 Changed props in ${componentName}:`, changedProps);
          }
        }
      }
      
      lastProps.current = props;
    });
  }
}

/**
 * Memory usage monitoring
 */
export function logMemoryUsage(label: string = 'Memory Usage') {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`🧠 ${label}:`, {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
}

/**
 * Store operation profiler
 */
export class StoreProfiler {
  private operationCounts: Map<string, number> = new Map();
  private operationTimes: Map<string, number[]> = new Map();
  
  track(operation: string, duration: number) {
    // Update counts
    const currentCount = this.operationCounts.get(operation) || 0;
    this.operationCounts.set(operation, currentCount + 1);
    
    // Update times
    const currentTimes = this.operationTimes.get(operation) || [];
    currentTimes.push(duration);
    
    // Keep only last 100 measurements
    if (currentTimes.length > 100) {
      currentTimes.shift();
    }
    
    this.operationTimes.set(operation, currentTimes);
  }
  
  getReport() {
    const report: Record<string, any> = {};
    
    for (const [operation, count] of this.operationCounts) {
      const times = this.operationTimes.get(operation) || [];
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const maxTime = times.length > 0 ? Math.max(...times) : 0;
      const minTime = times.length > 0 ? Math.min(...times) : 0;
      
      report[operation] = {
        count,
        avgTime: parseFloat(avgTime.toFixed(2)),
        maxTime: parseFloat(maxTime.toFixed(2)),
        minTime: parseFloat(minTime.toFixed(2)),
      };
    }
    
    return report;
  }
  
  clear() {
    this.operationCounts.clear();
    this.operationTimes.clear();
  }
}

export const storeProfiler = new StoreProfiler();

// Development-only global access
if (process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = performanceMonitor;
  (window as any).__storeProfiler = storeProfiler;
}