import { logger } from '@/lib/logger';

// CSS Variable Performance Monitoring
// Tracks performance metrics for the CSS variable migration system

export interface PerformanceMetrics {
  variableGenerationTime: number;
  injectionTime: number;
  renderTime: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  cssSize: {
    variables: number;
    estimated: number; // in bytes
  };
  timestamp: number;
}

export interface PerformanceThresholds {
  variableGenerationTime: number; // ms
  injectionTime: number; // ms
  renderTime: number; // ms
  maxCSSSize: number; // bytes
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  variableGenerationTime: 50, // 50ms
  injectionTime: 20, // 20ms
  renderTime: 100, // 100ms
  maxCSSSize: 10240, // 10KB
};

class CSSVariablePerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                    process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGGING === 'true';
  }

  /**
   * Start timing a specific operation
   */
  startTiming(operation: string): () => number {
    if (!this.isEnabled) {
      return () => 0;
    }

    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      
      return duration;
    };
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    if (!this.isEnabled) return;

    const fullMetrics: PerformanceMetrics = {
      variableGenerationTime: 0,
      injectionTime: 0,
      renderTime: 0,
      cssSize: { variables: 0, estimated: 0 },
      timestamp: Date.now(),
      ...metrics,
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      fullMetrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    this.metrics.push(fullMetrics);

    // Keep only last 100 metrics to prevent memory leak
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check thresholds
    this.checkThresholds(fullMetrics);
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const warnings: string[] = [];

    if (metrics.variableGenerationTime > this.thresholds.variableGenerationTime) {
      warnings.push(`Variable generation took ${metrics.variableGenerationTime.toFixed(2)}ms (threshold: ${this.thresholds.variableGenerationTime}ms)`);
    }

    if (metrics.injectionTime > this.thresholds.injectionTime) {
      warnings.push(`CSS injection took ${metrics.injectionTime.toFixed(2)}ms (threshold: ${this.thresholds.injectionTime}ms)`);
    }

    if (metrics.renderTime > this.thresholds.renderTime) {
      warnings.push(`Render time was ${metrics.renderTime.toFixed(2)}ms (threshold: ${this.thresholds.renderTime}ms)`);
    }

    if (metrics.cssSize.estimated > this.thresholds.maxCSSSize) {
      warnings.push(`CSS size is ${(metrics.cssSize.estimated / 1024).toFixed(1)}KB (threshold: ${(this.thresholds.maxCSSSize / 1024).toFixed(1)}KB)`);
    }

  }

  /**
   * Get performance statistics
   */
  getStats(): {
    averages: PerformanceMetrics;
    recent: PerformanceMetrics | null;
    trends: {
      improving: boolean;
      degrading: boolean;
    };
  } {
    if (this.metrics.length === 0) {
      return {
        averages: {
          variableGenerationTime: 0,
          injectionTime: 0,
          renderTime: 0,
          cssSize: { variables: 0, estimated: 0 },
          timestamp: Date.now(),
        },
        recent: null,
        trends: { improving: false, degrading: false },
      };
    }

    // Calculate averages
    const averages: PerformanceMetrics = {
      variableGenerationTime: this.metrics.reduce((sum, m) => sum + m.variableGenerationTime, 0) / this.metrics.length,
      injectionTime: this.metrics.reduce((sum, m) => sum + m.injectionTime, 0) / this.metrics.length,
      renderTime: this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length,
      cssSize: {
        variables: Math.round(this.metrics.reduce((sum, m) => sum + m.cssSize.variables, 0) / this.metrics.length),
        estimated: Math.round(this.metrics.reduce((sum, m) => sum + m.cssSize.estimated, 0) / this.metrics.length),
      },
      timestamp: Date.now(),
    };

    // Check trends (last 10 vs previous 10)
    const trends = { improving: false, degrading: false };
    if (this.metrics.length >= 20) {
      const recent10 = this.metrics.slice(-10);
      const previous10 = this.metrics.slice(-20, -10);
      
      const recentAvg = recent10.reduce((sum, m) => sum + m.renderTime, 0) / 10;
      const previousAvg = previous10.reduce((sum, m) => sum + m.renderTime, 0) / 10;
      
      if (recentAvg < previousAvg * 0.9) {
        trends.improving = true;
      } else if (recentAvg > previousAvg * 1.1) {
        trends.degrading = true;
      }
    }

    return {
      averages,
      recent: this.metrics[this.metrics.length - 1] || null,
      trends,
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * Update thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.isEnabled || this.metrics.length === 0) return;

    const stats = this.getStats();
    
    console.group('📊 CSS Variable Performance Summary');
    logger.debug('Total measurements:', this.metrics.length);
    logger.debug('Average generation time:', `${stats.averages.variableGenerationTime.toFixed(2)}ms`);
    logger.debug('Average injection time:', `${stats.averages.injectionTime.toFixed(2)}ms`);
    logger.debug('Average render time:', `${stats.averages.renderTime.toFixed(2)}ms`);
    logger.debug('Average CSS variables:', stats.averages.cssSize.variables);
    logger.debug('Average CSS size:', `${(stats.averages.cssSize.estimated / 1024).toFixed(1)}KB`);
    
    if (stats.trends.improving) {
      logger.debug('📈 Performance is improving');
    } else if (stats.trends.degrading) {
      logger.debug('📉 Performance is degrading');
    }
    
    if (stats.recent?.memoryUsage) {
      logger.debug('Memory usage:', `${(stats.recent.memoryUsage.used / 1024 / 1024).toFixed(1)}MB (${stats.recent.memoryUsage.percentage.toFixed(1)}%)`);
    }
    
    console.groupEnd();
  }
}

// Global instance
export const cssVariablePerformanceMonitor = new CSSVariablePerformanceMonitor();

/**
 * Performance monitoring decorator for CSS variable operations
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    const endTiming = cssVariablePerformanceMonitor.startTiming(operationName);
    
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          endTiming();
        });
      }
      
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  }) as T;
}

/**
 * React hook for performance monitoring
 */
export function useCSSVariablePerformance() {
  return {
    startTiming: cssVariablePerformanceMonitor.startTiming.bind(cssVariablePerformanceMonitor),
    recordMetrics: cssVariablePerformanceMonitor.recordMetrics.bind(cssVariablePerformanceMonitor),
    getStats: cssVariablePerformanceMonitor.getStats.bind(cssVariablePerformanceMonitor),
    logSummary: cssVariablePerformanceMonitor.logSummary.bind(cssVariablePerformanceMonitor),
  };
}