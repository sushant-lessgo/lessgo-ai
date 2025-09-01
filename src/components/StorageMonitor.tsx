/**
 * Storage Monitor Component - Development tool for monitoring storage health
 * Shows storage usage, cleanup status, and provides manual controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { storageManager } from '@/utils/storageManager';
import { getStorageStats, STORAGE_CONFIG } from '@/utils/storage';

interface StorageMonitorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  collapsed?: boolean;
}

export function StorageMonitor({ 
  position = 'bottom-left',
  collapsed: initialCollapsed = true 
}: StorageMonitorProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [healthReport, setHealthReport] = useState<ReturnType<typeof storageManager.getHealthReport> | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Update health report periodically
  useEffect(() => {
    const updateHealthReport = () => {
      try {
        const report = storageManager.getHealthReport();
        setHealthReport(report);
      } catch (error) {
      }
    };

    // Initial update
    updateHealthReport();

    // Update every 10 seconds
    const interval = setInterval(updateHealthReport, 10000);

    return () => clearInterval(interval);
  }, []);

  // Manual cleanup handler
  const handleForceCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await storageManager.forceCleanup();
    } catch (error) {
      console.error('❌ Manual cleanup failed:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (!healthReport) return null;

  const { status, stats, recommendations, cleanupStatus } = healthReport;

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Status colors
  const statusColors = {
    healthy: 'bg-green-100 border-green-300 text-green-800',
    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    critical: 'bg-red-100 border-red-300 text-red-800',
  };

  const statusIcons = {
    healthy: '✅',
    warning: '⚠️',
    critical: '🚨',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] font-mono text-xs`}>
      {/* Collapsed view */}
      {collapsed && (
        <div 
          className={`${statusColors[status]} border rounded-lg px-3 py-2 cursor-pointer shadow-lg`}
          onClick={() => setCollapsed(false)}
        >
          <div className="flex items-center gap-2">
            <span>{statusIcons[status]}</span>
            <span>Storage: {stats.totalProjects}/{STORAGE_CONFIG.MAX_STORED_PROJECTS}</span>
            <span>({Math.round(stats.currentSizeKB)}KB)</span>
            {cleanupStatus.isRunning && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      )}

      {/* Expanded view */}
      {!collapsed && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{statusIcons[status]}</span>
              <span className="font-semibold">Storage Monitor</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ×
            </button>
          </div>

          {/* Status */}
          <div className={`${statusColors[status]} border rounded px-2 py-1 mb-3`}>
            Status: {status.toUpperCase()}
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-3">
            <div>
              <strong>Projects:</strong> {stats.totalProjects}/{STORAGE_CONFIG.MAX_STORED_PROJECTS}
              {stats.availableSlots === 0 && (
                <span className="text-red-500 ml-1">FULL</span>
              )}
            </div>
            <div>
              <strong>Storage Size:</strong> {Math.round(stats.currentSizeKB)}KB
            </div>
            {stats.oldestProject && (
              <div>
                <strong>Oldest:</strong> {stats.oldestProject.slice(0, 8)}...
              </div>
            )}
            {stats.newestProject && (
              <div>
                <strong>Newest:</strong> {stats.newestProject.slice(0, 8)}...
              </div>
            )}
          </div>

          {/* Cleanup Status */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <strong>Cleanup:</strong>
              {cleanupStatus.isRunning ? (
                <span className="text-blue-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Running
                </span>
              ) : (
                <span className="text-gray-600">Idle</span>
              )}
            </div>
            <div className="text-gray-600">
              Last: {new Date(cleanupStatus.lastCleanupTime).toLocaleTimeString()}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-3">
              <strong className="text-orange-600">Recommendations:</strong>
              <ul className="list-disc list-inside text-gray-700">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleForceCleanup}
              disabled={isCleaningUp}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors"
            >
              {isCleaningUp ? 'Cleaning...' : 'Force Cleanup'}
            </button>
            <button
              onClick={() => {
                const report = storageManager.getHealthReport();
                setHealthReport(report);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Debug info (only in dev) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 pt-2 border-t border-gray-200 text-gray-500">
              <div>Memory Cache: {Object.keys((window as any).__storeManagerDebug?.getCacheStats?.() || {}).length || 0} stores</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for programmatic storage monitoring
export function useStorageMonitor(interval: number = 30000) {
  const [report, setReport] = useState<ReturnType<typeof storageManager.getHealthReport> | null>(null);

  useEffect(() => {
    const updateReport = () => {
      try {
        const newReport = storageManager.getHealthReport();
        setReport(newReport);
      } catch (error) {
      }
    };

    updateReport();
    const intervalId = setInterval(updateReport, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return {
    report,
    forceCleanup: () => storageManager.forceCleanup(),
    isHealthy: report?.status === 'healthy',
    hasWarnings: report?.status === 'warning',
    isCritical: report?.status === 'critical',
  };
}

export default StorageMonitor;