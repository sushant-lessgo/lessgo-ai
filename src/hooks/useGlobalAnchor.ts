// src/hooks/useGlobalAnchor.ts - Step 3: Global Anchor Management
// Centralized DOM anchor tracking for consistent toolbar positioning

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ToolbarType } from '@/utils/selectionPriority';

export interface AnchorInfo {
  // DOM reference
  element: HTMLElement;
  rect: DOMRect;
  
  // Identification
  sectionId: string;
  elementKey?: string;
  toolbarType: ToolbarType;
  
  // Metadata
  registeredAt: number;
  lastUpdated: number;
  isStale: boolean;
}

export interface ToolbarPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
  arrow?: {
    x: number;
    y: number;
    direction: 'up' | 'down' | 'left' | 'right';
  };
}

interface AnchorRegistry {
  [key: string]: AnchorInfo;
}

interface GlobalAnchorConfig {
  // How often to update positions (ms)
  updateInterval: number;
  // How long anchors stay valid (ms)
  staleTimeout: number;
  // Toolbar spacing from anchor
  toolbarSpacing: number;
  // Enable debug logging
  debug: boolean;
}

const DEFAULT_CONFIG: GlobalAnchorConfig = {
  updateInterval: 100,    // Update positions every 100ms
  staleTimeout: 5000,     // Anchors expire after 5s
  toolbarSpacing: 8,      // 8px space between toolbar and element
  debug: true,
};

/**
 * Global anchor management system
 * Single source of truth for all toolbar positioning
 */
export function useGlobalAnchor(config: Partial<GlobalAnchorConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [anchors, setAnchors] = useState<AnchorRegistry>({});
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<ResizeObserver>();
  
  // Generate unique key for anchor
  const getAnchorKey = useCallback((
    toolbarType: ToolbarType, 
    sectionId: string, 
    elementKey?: string
  ): string => {
    if (elementKey) {
      return `${toolbarType}:${sectionId}.${elementKey}`;
    }
    return `${toolbarType}:${sectionId}`;
  }, []);
  
  // Register an anchor element
  const registerAnchor = useCallback((
    element: HTMLElement,
    toolbarType: ToolbarType,
    sectionId: string,
    elementKey?: string
  ): string => {
    const key = getAnchorKey(toolbarType, sectionId, elementKey);
    const now = Date.now();
    
    
    setAnchors(prev => ({
      ...prev,
      [key]: {
        element,
        rect: element.getBoundingClientRect(),
        sectionId,
        elementKey,
        toolbarType,
        registeredAt: now,
        lastUpdated: now,
        isStale: false,
      }
    }));
    
    return key;
  }, [finalConfig.debug, getAnchorKey]);
  
  // Unregister an anchor
  const unregisterAnchor = useCallback((key: string) => {
    if (finalConfig.debug) {
    }
    
    setAnchors(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, [finalConfig.debug]);
  
  // Update anchor position
  const updateAnchor = useCallback((key: string) => {
    setAnchors(prev => {
      const anchor = prev[key];
      if (!anchor || !document.contains(anchor.element)) {
        // Element no longer in DOM, mark as stale
        if (anchor) {
          return {
            ...prev,
            [key]: { ...anchor, isStale: true }
          };
        }
        return prev;
      }
      
      const newRect = anchor.element.getBoundingClientRect();
      return {
        ...prev,
        [key]: {
          ...anchor,
          rect: newRect,
          lastUpdated: Date.now(),
          isStale: false,
        }
      };
    });
  }, []);
  
  // Calculate optimal toolbar position for anchor
  const calculateToolbarPosition = useCallback((
    anchorKey: string,
    toolbarSize: { width: number; height: number }
  ): ToolbarPosition | null => {
    const anchor = anchors[anchorKey];
    if (!anchor || anchor.isStale) {
      if (finalConfig.debug) {
      }
      return null;
    }
    
    const { rect } = anchor;
    const spacing = finalConfig.toolbarSpacing;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Try to place toolbar above the element (preferred)
    let x = rect.left + rect.width / 2 - toolbarSize.width / 2;
    let y = rect.top - toolbarSize.height - spacing;
    let placement: ToolbarPosition['placement'] = 'top';
    
    // Constrain to viewport horizontally
    if (x < 10) {
      x = 10;
    } else if (x + toolbarSize.width > viewportWidth - 10) {
      x = viewportWidth - toolbarSize.width - 10;
    }
    
    // If toolbar would be cut off at top, place below
    if (y < 10) {
      y = rect.bottom + spacing;
      placement = 'bottom';
    }
    
    // If still cut off at bottom, try sides
    if (y + toolbarSize.height > viewportHeight - 10) {
      // Try left side
      x = rect.left - toolbarSize.width - spacing;
      y = rect.top + rect.height / 2 - toolbarSize.height / 2;
      placement = 'left';
      
      // If cut off on left, try right side
      if (x < 10) {
        x = rect.right + spacing;
        placement = 'right';
      }
      
      // If still cut off, place wherever fits best
      if (x + toolbarSize.width > viewportWidth - 10) {
        x = Math.max(10, viewportWidth - toolbarSize.width - 10);
        y = Math.max(10, Math.min(y, viewportHeight - toolbarSize.height - 10));
        placement = 'top'; // Default fallback
      }
    }
    
    // Calculate arrow position
    const arrow = {
      x: rect.left + rect.width / 2 - x,
      y: rect.top + rect.height / 2 - y,
      direction: placement === 'top' ? 'down' as const : 
                placement === 'bottom' ? 'up' as const :
                placement === 'left' ? 'right' as const : 'left' as const
    };
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: toolbarSize.width,
      height: toolbarSize.height,
      placement,
      arrow,
    };
  }, [anchors, finalConfig.toolbarSpacing, finalConfig.debug]);
  
  // Get anchor info by key
  const getAnchor = useCallback((key: string): AnchorInfo | null => {
    return anchors[key] || null;
  }, [anchors]);
  
  // Get anchor by selection info
  const getAnchorBySelection = useCallback((
    toolbarType: ToolbarType,
    sectionId: string,
    elementKey?: string
  ): AnchorInfo | null => {
    const key = getAnchorKey(toolbarType, sectionId, elementKey);
    return getAnchor(key);
  }, [getAnchor, getAnchorKey]);
  
  // Clean up stale anchors
  const cleanupStaleAnchors = useCallback(() => {
    const now = Date.now();
    const staleThreshold = finalConfig.staleTimeout;
    
    setAnchors(prev => {
      const cleaned: AnchorRegistry = {};
      let removedCount = 0;
      
      Object.entries(prev).forEach(([key, anchor]) => {
        if (
          anchor.isStale || 
          (now - anchor.lastUpdated > staleThreshold) ||
          !document.contains(anchor.element)
        ) {
          removedCount++;
          if (finalConfig.debug) {
          }
        } else {
          cleaned[key] = anchor;
        }
      });
      
      
      return cleaned;
    });
  }, [finalConfig.staleTimeout, finalConfig.debug]);
  
  // Setup periodic updates and cleanup
  useEffect(() => {
    // Update all anchor positions periodically
    updateIntervalRef.current = setInterval(() => {
      Object.keys(anchors).forEach(key => {
        updateAnchor(key);
      });
      
      // Also cleanup stale anchors
      cleanupStaleAnchors();
    }, finalConfig.updateInterval);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [anchors, updateAnchor, cleanupStaleAnchors, finalConfig.updateInterval]);
  
  // Setup ResizeObserver for responsive updates
  useEffect(() => {
    observerRef.current = new ResizeObserver((entries) => {
      entries.forEach(() => {
        // Update all anchors when viewport changes
        Object.keys(anchors).forEach(key => {
          updateAnchor(key);
        });
      });
    });
    
    observerRef.current.observe(document.body);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [anchors, updateAnchor]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return {
    // Registration
    registerAnchor,
    unregisterAnchor,
    
    // Queries
    getAnchor,
    getAnchorBySelection,
    calculateToolbarPosition,
    
    // Maintenance
    updateAnchor,
    cleanupStaleAnchors,
    
    // State
    anchors: Object.values(anchors),
    anchorCount: Object.keys(anchors).length,
    
    // Debug
    getAllAnchors: () => anchors,
  };
}

/**
 * Hook for components that need to register themselves as toolbar anchors
 */
export function useAnchorRegistration(
  toolbarType: ToolbarType,
  sectionId: string,
  elementKey?: string,
  enabled: boolean = true
) {
  const elementRef = useRef<HTMLElement>(null);
  const anchorKeyRef = useRef<string | null>(null);
  const globalAnchor = useGlobalAnchor();
  
  // Register/unregister based on enabled state
  useEffect(() => {
    if (!enabled || !elementRef.current) return;
    
    // Register anchor
    const key = globalAnchor.registerAnchor(
      elementRef.current,
      toolbarType,
      sectionId,
      elementKey
    );
    anchorKeyRef.current = key;
    
    return () => {
      // Unregister on cleanup
      if (anchorKeyRef.current) {
        globalAnchor.unregisterAnchor(anchorKeyRef.current);
        anchorKeyRef.current = null;
      }
    };
  }, [enabled, toolbarType, sectionId, elementKey, globalAnchor]);
  
  return {
    elementRef,
    anchorKey: anchorKeyRef.current,
    isRegistered: anchorKeyRef.current !== null,
  };
}

/**
 * Hook for toolbar components to get positioning info
 */
export function useToolbarPositioning(
  toolbarType: ToolbarType,
  sectionId?: string,
  elementKey?: string,
  toolbarSize: { width: number; height: number } = { width: 300, height: 48 }
): {
  position: ToolbarPosition | null;
  anchor: AnchorInfo | null;
  isReady: boolean;
} {
  const globalAnchor = useGlobalAnchor();
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  
  // Get anchor info
  const anchor = sectionId ? 
    globalAnchor.getAnchorBySelection(toolbarType, sectionId, elementKey) : 
    null;
  
  // Calculate position when anchor changes
  useEffect(() => {
    if (!anchor) {
      setPosition(null);
      return;
    }
    
    const anchorKey = anchor.sectionId + (anchor.elementKey ? `.${anchor.elementKey}` : '');
    const calculatedPosition = globalAnchor.calculateToolbarPosition(
      `${toolbarType}:${anchorKey}`,
      toolbarSize
    );
    
    setPosition(calculatedPosition);
  }, [anchor, toolbarType, toolbarSize, globalAnchor]);
  
  return {
    position,
    anchor,
    isReady: position !== null,
  };
}