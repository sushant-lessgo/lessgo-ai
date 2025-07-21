/**
 * DebugPanel - Comprehensive debugging utilities for multi-project store system
 * Shows store state, performance metrics, storage health, and provides debugging tools
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useEditStoreContext } from './EditProvider';
import { storeManager } from '@/stores/storeManager';
import { storageManager } from '@/utils/storageManager';
import { getStorageStats } from '@/utils/storage';
import StorageMonitor from './StorageMonitor';

interface DebugPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  defaultTab?: 'store' | 'performance' | 'storage' | 'actions';
}

interface PerformanceMetrics {
  storeCreationTime: number;
  hydrationTime: number;
  lastActionTime: number;
  actionCount: number;
  memoryUsage?: number;
  renderCount: number;
}

export function DebugPanel({ 
  position = 'top-right',
  defaultTab = 'store' 
}: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    storeCreationTime: 0,
    hydrationTime: 0,
    lastActionTime: 0,
    actionCount: 0,
    renderCount: 0,
  });
  
  const { store, tokenId, isInitialized, isHydrating } = useEditStoreContext();
  const storeState = store?.getState();
  
  // Track renders
  useEffect(() => {
    setMetrics(prev => ({ ...prev, renderCount: prev.renderCount + 1 }));
  });

  // Update performance metrics
  useEffect(() => {
    if (!store || !isInitialized) return;

    const updateMetrics = () => {
      const now = performance.now();
      const storeInstance = store as any;
      
      setMetrics(prev => ({
        ...prev,
        storeCreationTime: storeInstance.__createdAt ? now - storeInstance.__createdAt : 0,
        hydrationTime: isHydrating ? 0 : now - (storeInstance.__createdAt || now),
        lastActionTime: now,
        actionCount: prev.actionCount + 1,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || undefined,
      }));
    };

    // Subscribe to store changes to track actions
    const unsubscribe = store.subscribe(updateMetrics);
    
    return unsubscribe;
  }, [store, isInitialized, isHydrating]);

  if (!isInitialized) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] font-mono`}>
      {/* Toggle Button */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-semibold"
        >
          🔧 Debug
        </button>
      )}

      {/* Debug Panel */}
      {isVisible && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl max-w-lg w-80">
          {/* Header */}
          <div className="bg-purple-600 text-white px-4 py-3 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">🔧 Debug Panel</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-purple-200 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="text-purple-200 text-xs mt-1">
              Token: {tokenId.slice(0, 12)}...
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'store', label: '🏪 Store', color: 'blue' },
                { key: 'performance', label: '⚡ Performance', color: 'green' },
                { key: 'storage', label: '💾 Storage', color: 'yellow' },
                { key: 'actions', label: '🎯 Actions', color: 'red' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? `text-${tab.color}-600 border-${tab.color}-500`
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-96 overflow-y-auto text-xs">
            {activeTab === 'store' && <StoreTab storeState={storeState} />}
            {activeTab === 'performance' && <PerformanceTab metrics={metrics} />}
            {activeTab === 'storage' && <StorageTab />}
            {activeTab === 'actions' && <ActionsTab store={store} tokenId={tokenId} />}
          </div>
        </div>
      )}

      {/* Storage Monitor */}
      <StorageMonitor position="bottom-right" collapsed={true} />
    </div>
  );
}

/**
 * Store state tab
 */
function StoreTab({ storeState }: { storeState: any }) {
  if (!storeState) return <div>No store state available</div>;

  return (
    <div className="space-y-3">
      <div>
        <strong className="text-blue-600">Sections ({storeState.sections.length})</strong>
        <div className="bg-gray-50 p-2 rounded mt-1">
          {storeState.sections.length > 0 ? (
            <ul className="space-y-1">
              {storeState.sections.map((section: string, index: number) => (
                <li key={index} className="flex justify-between">
                  <span>{section}</span>
                  <span className="text-gray-500">
                    {storeState.sectionLayouts[section] || 'no layout'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500">No sections</span>
          )}
        </div>
      </div>

      <div>
        <strong className="text-green-600">Content</strong>
        <div className="bg-gray-50 p-2 rounded mt-1">
          {Object.keys(storeState.content).length} sections with content
          {Object.keys(storeState.content).map(key => (
            <div key={key} className="text-gray-600">
              {key}: {Object.keys(storeState.content[key]?.elements || {}).length} elements
            </div>
          ))}
        </div>
      </div>

      <div>
        <strong className="text-purple-600">UI State</strong>
        <div className="bg-gray-50 p-2 rounded mt-1 space-y-1">
          <div>Mode: <span className="font-mono">{storeState.mode}</span></div>
          <div>Edit Mode: <span className="font-mono">{storeState.editMode}</span></div>
          <div>Selected Section: <span className="font-mono">{storeState.selectedSection || 'none'}</span></div>
          <div>Loading: <span className="font-mono">{storeState.isLoading ? 'yes' : 'no'}</span></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Performance metrics tab
 */
function PerformanceTab({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="space-y-3">
      <div>
        <strong className="text-green-600">Performance Metrics</strong>
        <div className="bg-gray-50 p-2 rounded mt-1 space-y-1">
          <div>Store Creation: <span className="font-mono">{Math.round(metrics.storeCreationTime)}ms</span></div>
          <div>Hydration Time: <span className="font-mono">{Math.round(metrics.hydrationTime)}ms</span></div>
          <div>Render Count: <span className="font-mono">{metrics.renderCount}</span></div>
          <div>Actions Executed: <span className="font-mono">{metrics.actionCount}</span></div>
          {metrics.memoryUsage && (
            <div>Memory Usage: <span className="font-mono">{Math.round(metrics.memoryUsage / 1024 / 1024)}MB</span></div>
          )}
        </div>
      </div>

      <div>
        <strong className="text-orange-600">Store Manager Stats</strong>
        <div className="bg-gray-50 p-2 rounded mt-1">
          {(() => {
            const stats = storeManager.getCacheStats();
            return (
              <div className="space-y-1">
                <div>Cached Stores: <span className="font-mono">{stats.cachedStores}</span></div>
                <div>Current Token: <span className="font-mono">{stats.currentToken?.slice(0, 8) || 'none'}</span></div>
                {stats.oldestStore && (
                  <div>Oldest Store: <span className="font-mono">{stats.oldestStore.slice(0, 8)}</span></div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/**
 * Storage information tab
 */
function StorageTab() {
  const [stats, setStats] = useState<ReturnType<typeof getStorageStats>>();
  const [healthReport, setHealthReport] = useState<ReturnType<typeof storageManager.getHealthReport>>();

  useEffect(() => {
    const updateStats = () => {
      setStats(getStorageStats());
      setHealthReport(storageManager.getHealthReport());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || !healthReport) return <div>Loading storage info...</div>;

  return (
    <div className="space-y-3">
      <div>
        <strong className="text-yellow-600">Storage Stats</strong>
        <div className="bg-gray-50 p-2 rounded mt-1 space-y-1">
          <div>Total Projects: <span className="font-mono">{stats.totalProjects}/10</span></div>
          <div>Storage Size: <span className="font-mono">{stats.currentSizeKB}KB</span></div>
          <div>Available Slots: <span className="font-mono">{stats.availableSlots}</span></div>
        </div>
      </div>

      <div>
        <strong className="text-red-600">Health Status</strong>
        <div className={`p-2 rounded mt-1 ${
          healthReport.status === 'healthy' ? 'bg-green-50 text-green-800' :
          healthReport.status === 'warning' ? 'bg-yellow-50 text-yellow-800' :
          'bg-red-50 text-red-800'
        }`}>
          <div className="font-semibold">{healthReport.status.toUpperCase()}</div>
          {healthReport.recommendations.length > 0 && (
            <ul className="list-disc list-inside mt-1">
              {healthReport.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Actions and utilities tab
 */
function ActionsTab({ store, tokenId }: { store: any; tokenId: string }) {
  const [actionResult, setActionResult] = useState<string>('');

  const executeAction = async (action: string) => {
    try {
      let result = '';
      
      switch (action) {
        case 'export':
          result = JSON.stringify(store.getState().export(), null, 2);
          break;
        case 'clear':
          store.getState().reset();
          result = 'Store reset successfully';
          break;
        case 'cleanup':
          await storageManager.forceCleanup();
          result = 'Storage cleanup completed';
          break;
        case 'validate':
          const state = store.getState();
          const validation = {
            sectionsValid: state.sections.length > 0,
            contentValid: Object.keys(state.content).length > 0,
            tokenIdMatches: state.tokenId === tokenId,
          };
          result = JSON.stringify(validation, null, 2);
          break;
        default:
          result = 'Unknown action';
      }
      
      setActionResult(result);
    } catch (error) {
      setActionResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <strong className="text-red-600">Debug Actions</strong>
        <div className="space-y-2 mt-2">
          {[
            { key: 'export', label: '📤 Export Store', desc: 'Export current store state' },
            { key: 'validate', label: '✅ Validate Store', desc: 'Check store integrity' },
            { key: 'cleanup', label: '🧹 Clean Storage', desc: 'Force storage cleanup' },
            { key: 'clear', label: '🗑️ Reset Store', desc: 'Clear all store data' },
          ].map(action => (
            <button
              key={action.key}
              onClick={() => executeAction(action.key)}
              className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
              title={action.desc}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {actionResult && (
        <div>
          <strong className="text-purple-600">Action Result</strong>
          <pre className="bg-gray-900 text-green-400 p-2 rounded mt-1 text-xs overflow-x-auto max-h-32">
            {actionResult}
          </pre>
          <button
            onClick={() => setActionResult('')}
            className="mt-1 text-gray-500 hover:text-gray-700 text-xs"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;