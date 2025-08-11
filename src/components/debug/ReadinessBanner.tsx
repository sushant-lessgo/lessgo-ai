// src/components/debug/ReadinessBanner.tsx - Debug banner showing readiness state
// Enhanced Phase 5: Temporary banner for verifying readiness criteria

import React, { useState, useEffect } from 'react';
import { getReadinessState, isEditorInteractive } from '@/utils/readinessDetection';
import { useGlobalAnchor } from '@/hooks/useGlobalAnchor';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface ReadinessBannerProps {
  editorId?: string;
  autoHide?: boolean;
  hideAfterSeconds?: number;
}

interface ReadinessInfo {
  isInteractive: boolean;
  anchorCount: number;
  dataLoaded: boolean;
  providerMounted: boolean;
}

export function ReadinessBanner({ 
  editorId = 'default', 
  autoHide = true,
  hideAfterSeconds = 10 
}: ReadinessBannerProps) {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [info, setInfo] = useState<ReadinessInfo>({
    isInteractive: false,
    anchorCount: 0,
    dataLoaded: false,
    providerMounted: false
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenInteractive, setHasBeenInteractive] = useState(false);
  
  const globalAnchor = useGlobalAnchor();
  const { sections, content } = useEditStore();

  // Update readiness info
  useEffect(() => {
    const updateInfo = () => {
      const state = getReadinessState(editorId);
      const interactive = isEditorInteractive(editorId);
      const anchorCount = globalAnchor.anchorCount;
      const dataLoaded = sections.length > 0 || Object.keys(content).length > 0;
      
      const newInfo = {
        isInteractive: interactive,
        anchorCount,
        dataLoaded: state?.dataLoaded || dataLoaded,
        providerMounted: state?.providerMounted || false
      };
      
      setInfo(newInfo);
      
      // Track if we ever became interactive
      if (interactive && !hasBeenInteractive) {
        setHasBeenInteractive(true);
      }
    };
    
    updateInfo();
    
    // Update every 100ms until interactive
    const interval = !info.isInteractive ? setInterval(updateInfo, 100) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [editorId, globalAnchor, sections, content, info.isInteractive, hasBeenInteractive]);
  
  // Auto-hide after becoming interactive
  useEffect(() => {
    if (autoHide && hasBeenInteractive && hideAfterSeconds > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideAfterSeconds * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, hasBeenInteractive, hideAfterSeconds]);
  
  if (!isVisible) return null;

  const getStatusColor = (condition: boolean) => 
    condition ? 'bg-green-500' : 'bg-red-500';
  
  const getBannerColor = () => {
    if (info.isInteractive) return 'bg-green-600';
    if (info.anchorCount > 0 && info.dataLoaded && info.providerMounted) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[10000] ${getBannerColor()} text-white px-4 py-2 text-sm font-mono`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">
            {info.isInteractive ? '✅ INTERACTIVE' : '⏳ LOADING'}
          </span>
          
          <div className="flex items-center space-x-2">
            <span>Provider:</span>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(info.providerMounted)}`} />
            <span>{info.providerMounted ? 'ON' : 'OFF'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Anchors:</span>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(info.anchorCount > 0)}`} />
            <span>{info.anchorCount}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Data:</span>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(info.dataLoaded)}`} />
            <span>{info.dataLoaded ? 'LOADED' : 'LOADING'}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasBeenInteractive && (
            <span className="text-green-200">
              🎉 Became interactive!
            </span>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/70 hover:text-white px-2 py-1 rounded"
            aria-label="Hide readiness banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReadinessBanner;