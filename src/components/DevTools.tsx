/**
 * DevTools - Comprehensive development tools for multi-project store system
 * Combines all debugging utilities into a single, easy-to-use interface
 */

'use client';

import React from 'react';
import DebugPanel from './DebugPanel';
import StorageMonitor from './StorageMonitor';
import usePerformanceMonitor from '@/hooks/usePerformanceMonitor';

interface DevToolsProps {
  enabled?: boolean;
  showDebugPanel?: boolean;
  showStorageMonitor?: boolean;
  showPerformanceMonitor?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function DevTools({
  enabled = process.env.NODE_ENV === 'development',
  showDebugPanel = true,
  showStorageMonitor = true,
  showPerformanceMonitor = true,
  position = 'top-right',
}: DevToolsProps) {
  // Initialize performance monitoring
  const performanceMonitor = usePerformanceMonitor({
    enabled: enabled && showPerformanceMonitor,
  });

  // Don't render anything if disabled or not in development
  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Debug Panel */}
      {showDebugPanel && (
        <DebugPanel position={position} />
      )}

      {/* Storage Monitor */}
      {showStorageMonitor && (
        <StorageMonitor 
          position={position === 'top-right' ? 'bottom-right' : 'bottom-left'} 
          collapsed={true} 
        />
      )}

      {/* Global Performance Monitor */}
      {showPerformanceMonitor && (
        <PerformanceIndicator performanceMonitor={performanceMonitor} />
      )}
    </>
  );
}

/**
 * Performance indicator component
 */
function PerformanceIndicator({ performanceMonitor }: { performanceMonitor: any }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const { stats, getSlowOperations } = performanceMonitor;

  if (stats.totalEntries === 0) {
    return null;
  }

  const slowOps = getSlowOperations();
  const hasSlowOps = slowOps.length > 0;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]">
      <div
        className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer transition-colors ${
          hasSlowOps 
            ? 'bg-red-100 text-red-800 border border-red-300' 
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {hasSlowOps ? '🐌' : '⚡'} {Math.round(stats.averageDuration)}ms avg
        {hasSlowOps && ` (${slowOps.length} slow)`}
      </div>

      {showDetails && (
        <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          <div className="text-xs space-y-2">
            <div>
              <strong>Performance Summary</strong>
              <div className="bg-gray-50 p-2 rounded mt-1">
                <div>Total Operations: {stats.totalEntries}</div>
                <div>Average Duration: {Math.round(stats.averageDuration)}ms</div>
                <div>Slowest: {stats.slowestOperation ? `${stats.slowestOperation.name} (${Math.round(stats.slowestOperation.duration)}ms)` : 'None'}</div>
              </div>
            </div>

            {hasSlowOps && (
              <div>
                <strong className="text-red-600">Slow Operations</strong>
                <div className="bg-red-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                  {slowOps.slice(-5).map((op: any, index: number) => (
                    <div key={index} className="text-red-800">
                      {op.name}: {Math.round(op.duration)}ms
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetails(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to easily add DevTools to any component
 */
export function useDevTools(options?: Omit<DevToolsProps, 'children'>) {
  const devToolsProps = {
    enabled: process.env.NODE_ENV === 'development',
    ...options,
  };

  const DevToolsComponent = React.useMemo(
    () => () => <DevTools {...devToolsProps} />,
    [devToolsProps]
  );

  return DevToolsComponent;
}

/**
 * HOC to automatically add DevTools to a page/component
 */
export function withDevTools<P extends object>(
  Component: React.ComponentType<P>,
  devToolsOptions?: DevToolsProps
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <>
        <Component {...props} />
        <DevTools {...devToolsOptions} />
      </>
    );
  };

  WrappedComponent.displayName = `withDevTools(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Development-only console utilities
 */
if (process.env.NODE_ENV === 'development') {
  // Enhanced global utilities
  (window as any).__devTools = {
    // Performance utilities
    performance: {
      startTiming: (name: string) => {
        const start = performance.now();
        return () => {
          const end = performance.now();
          console.log(`⏱️ ${name}: ${Math.round(end - start)}ms`);
        };
      },
      measureRender: (componentName: string) => {
        const start = performance.now();
        setTimeout(() => {
          const end = performance.now();
          console.log(`🎨 ${componentName} render: ${Math.round(end - start)}ms`);
        }, 0);
      },
    },

    // Store utilities
    store: {
      inspect: (tokenId: string) => {
        try {
          const manager = (window as any).__storeManagerDebug;
          if (manager) {
            const store = manager.getCurrentStore(tokenId);
            console.log('🏪 Store inspection:', store?.getState());
          }
        } catch (error) {
          console.error('Store inspection failed:', error);
        }
      },
      export: (tokenId: string) => {
        try {
          const manager = (window as any).__storeManagerDebug;
          if (manager) {
            const store = manager.getCurrentStore(tokenId);
            const exported = store?.getState().export();
            console.log('📤 Store export:', exported);
            return exported;
          }
        } catch (error) {
          console.error('Store export failed:', error);
        }
      },
    },

    // Storage utilities
    storage: {
      inspect: () => {
        const debug = (window as any).__storageDebug;
        if (debug) {
          console.log('💾 Storage inspection:', debug.getStorageStats());
        }
      },
      cleanup: () => {
        const debug = (window as any).__storageManagerDebug;
        if (debug) {
          debug.forceCleanup();
          console.log('🧹 Storage cleanup initiated');
        }
      },
      health: () => {
        const debug = (window as any).__storageManagerDebug;
        if (debug) {
          console.log('🏥 Storage health:', debug.getHealthReport());
        }
      },
    },

    // General utilities
    help: () => {
      console.log(`
🔧 DevTools Console Utilities:

Performance:
  __devTools.performance.startTiming('operation') - Returns stop function
  __devTools.performance.measureRender('ComponentName') - Measure render time

Store:
  __devTools.store.inspect(tokenId) - Inspect store state
  __devTools.store.export(tokenId) - Export store data

Storage:
  __devTools.storage.inspect() - View storage stats
  __devTools.storage.cleanup() - Force storage cleanup
  __devTools.storage.health() - Check storage health

Global Debug Objects:
  window.__editStoreDebug - Edit store utilities
  window.__storeManagerDebug - Store manager utilities
  window.__storageDebug - Storage utilities
  window.__storageManagerDebug - Storage manager utilities
      `);
    },
  };

  console.log('🔧 DevTools console utilities loaded. Type __devTools.help() for usage info.');
}

export default DevTools;