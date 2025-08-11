// Stable anchor provider - stays mounted throughout edit session
// SSR-safe with StrictMode protection and per-editor keying

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  initializeReadinessTracking, 
  recordEditorMount, 
  updateAnchorCount,
  setProviderMounted,
  onInteractiveChange 
} from '@/utils/readinessDetection';

interface StableAnchorProviderProps {
  children: React.ReactNode;
  editorId?: string; // Key by editor ID for multi-editor support
}

// PHASE 2: Stable DOM container nodes (module-scope singletons)
// React can flip instances while DOM nodes remain constant
const globalAnchorContainerNodes = new Map<string, HTMLElement>();
const globalAnchorRefCounts = new Map<string, number>();
const globalProviderInstances = new Map<string, number>();

// Version-stable provider identity tracking
let globalProviderVersion = 0;

/**
 * Get or create a stable DOM container node for an editor
 * This node persists across React re-mounts and StrictMode double-mounting
 */
function getOrCreateStableContainerNode(editorId: string): HTMLElement {
  let container = globalAnchorContainerNodes.get(editorId);
  
  if (!container) {
    // Create stable DOM node at module scope
    container = document.createElement('div');
    container.id = `stable-anchor-container-${editorId}`;
    container.setAttribute('data-stable-anchor', 'true');
    container.setAttribute('data-editor-id', editorId);
    container.setAttribute('data-created-at', Date.now().toString());
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
    `;
    
    // Mount to body immediately for maximum stability
    document.body.appendChild(container);
    globalAnchorContainerNodes.set(editorId, container);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏗️ Created stable DOM container node for editor: ${editorId}`);
    }
  }
  
  return container;
}

export function StableAnchorProvider({ children, editorId = 'default' }: StableAnchorProviderProps) {
  const [anchorReady, setAnchorReady] = useState(false);
  
  // PHASE 2: Version-stable provider identity
  const [providerVersion] = useState(() => ++globalProviderVersion);
  const providerInstanceId = useRef(() => {
    const instanceCount = globalProviderInstances.get(editorId) || 0;
    globalProviderInstances.set(editorId, instanceCount + 1);
    return instanceCount + 1;
  });
  
  const isInitializedRef = useRef(false);
  const stableContainerRef = useRef<HTMLElement | null>(null);

  // SSR-safe initialization with useLayoutEffect (client-side only)
  useLayoutEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // ENHANCED PHASE 1: Initialize readiness tracking
    initializeReadinessTracking(editorId);
    
    // ENHANCED PHASE 1: Record editor mount for StrictMode detection
    recordEditorMount(editorId);
    
    // ENHANCED PHASE 2: Report provider mounted status
    setProviderMounted(editorId, true);

    // PHASE 2: Get stable DOM container node (persists across React mounts)
    const container = getOrCreateStableContainerNode(editorId);
    stableContainerRef.current = container;
    
    // Increment reference count (StrictMode protection)
    let refCount = globalAnchorRefCounts.get(editorId) || 0;
    refCount++;
    globalAnchorRefCounts.set(editorId, refCount);
    
    // Fire ready signal once container is stable
    setAnchorReady(true);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚓ [PROVIDER] Stable anchor mounted (editor: ${editorId}, refCount: ${refCount}, version: ${providerVersion}, instance: ${providerInstanceId.current})`);
      
      // Phase A2: Log provider instance ID and map size every 500ms for 2s after mount
      const diagnosticInterval = setInterval(() => {
        const currentRefCount = globalAnchorRefCounts.get(editorId) || 0;
        const containerExists = !!globalAnchorContainerNodes.get(editorId);
        
        console.log(`📊 [PROVIDER-DIAG] Instance ${providerInstanceId.current}:`, {
          editorId,
          refCount: currentRefCount,
          containerExists,
          containerInDOM: containerExists ? document.contains(globalAnchorContainerNodes.get(editorId)!) : false,
          providerVersion,
          timestamp: new Date().toISOString()
        });
      }, 500);
      
      // Stop diagnostics after 2 seconds
      setTimeout(() => {
        clearInterval(diagnosticInterval);
        console.log(`🏁 [PROVIDER-DIAG] Diagnostics complete for provider ${providerInstanceId.current}`);
      }, 2000);
    }

    return () => {
      // ENHANCED PHASE 2: Report provider unmounted
      setProviderMounted(editorId, false);
      
      // Decrement reference count
      const currentRefCount = globalAnchorRefCounts.get(editorId) || 0;
      const newRefCount = Math.max(0, currentRefCount - 1);
      globalAnchorRefCounts.set(editorId, newRefCount);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 Stable anchor unmounted (editor: ${editorId}, refCount: ${newRefCount})`);
      }

      // CRITICAL FIX: Never remove container when refCount hits 0
      // This prevents anchor pool from being wiped during normal interactions
      if (newRefCount <= 0) {
        // Just clear the refCount entry, but keep container alive for the session
        globalAnchorRefCounts.delete(editorId);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📌 RefCount 0 but keeping container alive for editor: ${editorId}`);
        }
        
        // Keep the container in DOM - never remove it
        // This prevents the "anchor unmount during interaction" issue
      }
    };
  }, [editorId]);

  // Don't render until container is ready (no RAF retries needed)
  if (!stableContainerRef.current || !anchorReady) {
    return null;
  }

  return createPortal(children, stableContainerRef.current);
}

// Hook to get stable anchor container reference
export function useStableAnchor(editorId: string = 'default'): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Get stable DOM container node
    const element = globalAnchorContainerNodes.get(editorId);
    if (element) {
      setContainer(element);
    } else {
      // Wait for container to be created with hydration-aware timing
      const checkContainer = () => {
        const element = globalAnchorContainerNodes.get(editorId) || 
                       document.getElementById(`stable-anchor-container-${editorId}`);
        if (element) {
          setContainer(element);
        } else {
          // Use RAF instead of setTimeout for better timing
          requestAnimationFrame(checkContainer);
        }
      };
      checkContainer();
    }
  }, [editorId]);

  return container;
}

// Export anchor utilities with per-editor support
export function getStableAnchorCount(editorId: string = 'default'): number {
  return globalAnchorRefCounts.get(editorId) || 0;
}

export function getStableAnchorContainer(editorId: string = 'default'): HTMLElement | null {
  return globalAnchorContainerNodes.get(editorId) || null;
}

// Get total count across all editors
export function getTotalAnchorCount(): number {
  const total = Array.from(globalAnchorRefCounts.values()).reduce((sum, count) => sum + count, 0);
  
  // REMOVED: Risky shim that masked real anchor registration issues
  // Now the system properly reports actual anchor counts
  return total;
}