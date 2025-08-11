// src/components/debug/DebugLED.tsx - Debug LED for interactive state visualization
// Provides real-time visibility into system state

import React, { useState, useEffect } from 'react';
import { isEditorHydrating, getHydrationState } from '@/utils/hydrationDetection';
import { getActivityState } from '@/utils/editorActivityState';
import { exportDiagnostics } from '@/utils/toolbarDiagnostics';
import { useGlobalAnchor } from '@/hooks/useGlobalAnchor';

interface DebugLEDProps {
  editorId?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface DebugState {
  hydrating: boolean;
  anchorsStable: boolean;
  activityState: 'idle' | 'active' | 'composing';
  cleanupSuppressed: boolean;
  listenersDetached: boolean;
  anchorCount: number;
}

export function DebugLED({ 
  editorId = 'default', 
  position = 'bottom-right' 
}: DebugLEDProps) {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [debugState, setDebugState] = useState<DebugState>({
    hydrating: true,
    anchorsStable: false,
    activityState: 'idle',
    cleanupSuppressed: false,
    listenersDetached: false,
    anchorCount: 0,
  });

  const globalAnchor = useGlobalAnchor();

  // Update debug state every 100ms
  useEffect(() => {
    const updateDebugState = () => {
      const hydrating = isEditorHydrating(editorId);
      const hydrationState = getHydrationState(editorId);
      const activityState = getActivityState(editorId);
      const anchorCount = globalAnchor.anchorCount;

      setDebugState({
        hydrating,
        anchorsStable: hydrationState?.anchorCountStable || false,
        activityState: activityState.isComposing ? 'composing' : 
                      activityState.isActivelyEditing ? 'active' : 'idle',
        cleanupSuppressed: false, // TODO: get from emergency cleanup
        listenersDetached: false, // TODO: get from listener state
        anchorCount,
      });
    };

    // Initial update
    updateDebugState();

    // Periodic updates
    const interval = setInterval(updateDebugState, 100);
    return () => clearInterval(interval);
  }, [editorId, globalAnchor]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }[position];

  const getStatusColor = (status: boolean | string): string => {
    if (typeof status === 'boolean') {
      return status ? 'bg-green-500' : 'bg-red-500';
    }
    
    switch (status) {
      case 'idle': return 'bg-gray-400';
      case 'active': return 'bg-blue-500';
      case 'composing': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const exportDiagnosticsData = () => {
    const data = exportDiagnostics();
    console.log('🔍 Exported diagnostics data:', data);
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toolbar-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed ${positionClasses} z-[9999] font-mono text-xs`}>
      {!isExpanded ? (
        // Compact LED indicator
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-1 bg-black/80 text-white px-2 py-1 rounded border border-gray-600 hover:bg-black/90"
          title="Debug LED - Click to expand"
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor(!debugState.hydrating && debugState.anchorsStable)}`} />
          <span>DEBUG</span>
        </button>
      ) : (
        // Expanded debug panel
        <div className="bg-black/90 text-white p-3 rounded-lg border border-gray-600 min-w-64">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Debug LED</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Hydrating:</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(!debugState.hydrating)}`} />
            </div>
            
            <div className="flex items-center justify-between">
              <span>Anchors Stable:</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(debugState.anchorsStable)}`} />
            </div>
            
            <div className="flex items-center justify-between">
              <span>Activity:</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(debugState.activityState)}`} />
              <span className="text-xs text-gray-400">{debugState.activityState}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Anchors:</span>
              <span className={debugState.anchorCount > 0 ? 'text-green-400' : 'text-red-400'}>
                {debugState.anchorCount}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Cleanup Suppressed:</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(debugState.cleanupSuppressed)}`} />
            </div>
            
            <div className="flex items-center justify-between">
              <span>Listeners Detached:</span>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(!debugState.listenersDetached)}`} />
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-600">
            <button
              onClick={exportDiagnosticsData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
            >
              Export Diagnostics
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            Editor: {editorId}
          </div>
        </div>
      )}
    </div>
  );
}