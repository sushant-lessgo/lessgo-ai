import { logger } from '@/lib/logger';

// src/utils/readinessDetection.ts - Enhanced readiness detection with reversibility
// Phase 1: Event-driven readiness system with watchdog and accessibility

interface ReadinessState {
  // Core hydration tracking (legacy compatibility)
  isHydrating: boolean;
  mountCount: number;
  anchorCountStable: boolean;
  lastAnchorCount: number;
  stabilityCheckFrame: number | null;
  
  // Enhanced Phase 1: Interactive readiness
  isInteractive: boolean;
  providerMounted: boolean;
  dataLoaded: boolean;
  currentAnchorCount: number;
  
  // Watchdog system
  watchdogTimer: NodeJS.Timeout | null;
  watchdogStartTime: number;
  hasShownZeroAnchorsWarning: boolean;
  
  // State change tracking for invariant logging
  lastStateChange: number;
  stateTransitions: Array<{
    timestamp: number;
    from: boolean;
    to: boolean;
    reason: string;
  }>;
}

const WATCHDOG_TIMEOUT = 2000; // 2 seconds
const readinessStates = new Map<string, ReadinessState>();
const interactiveCallbacks = new Map<string, Set<(isInteractive: boolean) => void>>();

/**
 * Initialize readiness tracking for an editor instance
 */
export function initializeReadinessTracking(editorId: string = 'default'): void {
  if (!readinessStates.has(editorId)) {
    const state: ReadinessState = {
      // Legacy hydration tracking
      isHydrating: true,
      mountCount: 0,
      anchorCountStable: false,
      lastAnchorCount: 0,
      stabilityCheckFrame: null,
      
      // Enhanced readiness
      isInteractive: false,
      providerMounted: false,
      dataLoaded: false,
      currentAnchorCount: 0,
      
      // Watchdog
      watchdogTimer: null,
      watchdogStartTime: Date.now(),
      hasShownZeroAnchorsWarning: false,
      
      // State tracking
      lastStateChange: Date.now(),
      stateTransitions: [],
    };
    
    readinessStates.set(editorId, state);
    
    // Start watchdog timer
    startWatchdog(editorId);
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🚀 Enhanced readiness tracking started for editor: ${editorId}`);
    }
  }
}

/**
 * Enhanced: Record provider mount status
 */
export function setProviderMounted(editorId: string = 'default', mounted: boolean): void {
  const state = readinessStates.get(editorId);
  if (!state) {
    initializeReadinessTracking(editorId);
    return setProviderMounted(editorId, mounted);
  }

  if (state.providerMounted !== mounted) {
    state.providerMounted = mounted;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🏗️ Provider ${mounted ? 'mounted' : 'unmounted'} for editor: ${editorId}`);
    }
    
    checkInteractiveReadiness(editorId, 'provider-mount');
  }
}

/**
 * Enhanced: Record data load status
 */
export function setDataLoaded(editorId: string = 'default', loaded: boolean): void {
  const state = readinessStates.get(editorId);
  if (!state) {
    initializeReadinessTracking(editorId);
    return setDataLoaded(editorId, loaded);
  }

  if (state.dataLoaded !== loaded) {
    state.dataLoaded = loaded;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`📊 Data ${loaded ? 'loaded' : 'unloaded'} for editor: ${editorId}`);
    }
    
    checkInteractiveReadiness(editorId, 'data-load');
  }
}

/**
 * Legacy compatibility: Record editor mount
 */
export function recordEditorMount(editorId: string = 'default'): void {
  const state = readinessStates.get(editorId);
  if (!state) {
    initializeReadinessTracking(editorId);
    return recordEditorMount(editorId);
  }

  state.mountCount++;
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🔄 Editor mount recorded: ${editorId} (count: ${state.mountCount})`);
  }
  
  // Consider provider mounted after first mount
  if (state.mountCount >= 1) {
    setProviderMounted(editorId, true);
  }
}

/**
 * Enhanced: Update anchor count with immediate readiness check
 */
export function updateAnchorCount(editorId: string = 'default', currentCount: number): void {
  const state = readinessStates.get(editorId);
  if (!state) {
    initializeReadinessTracking(editorId);
    return updateAnchorCount(editorId, currentCount);
  }

  const previousCount = state.currentAnchorCount;
  state.currentAnchorCount = currentCount;
  
  // Legacy hydration tracking (for diagnostics)
  if (currentCount === state.lastAnchorCount) {
    if (state.stabilityCheckFrame === null) {
      state.stabilityCheckFrame = requestAnimationFrame(() => {
        const currentState = readinessStates.get(editorId);
        if (currentState && currentState.stabilityCheckFrame !== null) {
          currentState.anchorCountStable = true;
          currentState.stabilityCheckFrame = null;
        }
      });
    }
  } else {
    if (state.stabilityCheckFrame !== null) {
      cancelAnimationFrame(state.stabilityCheckFrame);
      state.stabilityCheckFrame = null;
    }
    state.lastAnchorCount = currentCount;
    state.anchorCountStable = false;
  }
  
  // Enhanced: Check readiness immediately on anchor changes
  if (previousCount !== currentCount) {
    checkInteractiveReadiness(editorId, 'anchor-update');
  }
}

/**
 * Enhanced: Check if editor should be interactive
 */
function checkInteractiveReadiness(editorId: string, reason: string): void {
  const state = readinessStates.get(editorId);
  if (!state) return;

  // Phase 3.1: Enhanced conservative readiness criteria
  const shouldBeInteractive = 
    state.providerMounted && 
    state.currentAnchorCount > 0 && 
    state.dataLoaded;

  const wasInteractive = state.isInteractive;
  
  if (shouldBeInteractive !== wasInteractive) {
    state.isInteractive = shouldBeInteractive;
    state.lastStateChange = Date.now();
    
    // Track state transition for invariant logging
    state.stateTransitions.push({
      timestamp: Date.now(),
      from: wasInteractive,
      to: shouldBeInteractive,
      reason
    });
    
    // Invariant log: Always print readiness state changes
    logger.debug(`🎯 [CONSERVATIVE] READINESS ${shouldBeInteractive ? 'GAINED' : 'LOST'} → INTERACTIVE: ${shouldBeInteractive}`, {
      editorId,
      reason,
      criteria: {
        providerMounted: state.providerMounted,
        anchorCount: state.currentAnchorCount,
        dataLoaded: state.dataLoaded
      },
      timestamp: new Date().toISOString()
    });
    
    // Phase 3.1: Conservative hydration flag management
    // Only fall back to loading if BOTH provider unmounted AND anchorCount === 0 for >1 frame
    if (shouldBeInteractive && state.isHydrating) {
      // Gaining interactivity - always stop hydrating
      state.isHydrating = false;
      logger.debug(`🎯 [CONSERVATIVE] Mode: edit (gained interactivity)`);
    } else if (!shouldBeInteractive && !state.isHydrating) {
      // Losing interactivity - be conservative about falling back to loading
      const providerUnmounted = !state.providerMounted;
      const noAnchors = state.currentAnchorCount === 0;
      
      // Only revert to loading if both conditions are met
      if (providerUnmounted && noAnchors) {
        // Wait one frame to ensure it's not a temporary state
        requestAnimationFrame(() => {
          const currentState = readinessStates.get(editorId);
          if (currentState && 
              !currentState.providerMounted && 
              currentState.currentAnchorCount === 0 &&
              !currentState.isInteractive) {
            currentState.isHydrating = true;
            logger.debug(`🎯 [CONSERVATIVE] Mode: loading (both provider unmounted and anchorCount === 0)`);
          } else {
            logger.debug(`🎯 [CONSERVATIVE] Mode: edit (kept - temporary state or conditions changed)`, {
              providerMounted: currentState?.providerMounted,
              anchorCount: currentState?.currentAnchorCount,
              isInteractive: currentState?.isInteractive
            });
          }
        });
      } else {
        logger.debug(`🎯 [CONSERVATIVE] Mode: edit (kept - not both conditions met)`, {
          providerUnmounted,
          noAnchors,
          reason: providerUnmounted ? 'provider-unmounted' : noAnchors ? 'no-anchors' : 'neither'
        });
      }
    }
    
    // Stop watchdog if we become interactive
    if (shouldBeInteractive && state.watchdogTimer) {
      clearTimeout(state.watchdogTimer);
      state.watchdogTimer = null;
    } else if (!shouldBeInteractive && !state.watchdogTimer) {
      // Restart watchdog if we lose interactivity
      startWatchdog(editorId);
    }
    
    // Notify subscribers
    notifyInteractiveChange(editorId, shouldBeInteractive);
  }
}

/**
 * Enhanced: Start watchdog timer for zero anchors
 */
function startWatchdog(editorId: string): void {
  const state = readinessStates.get(editorId);
  if (!state) return;

  state.watchdogTimer = setTimeout(() => {
    const currentState = readinessStates.get(editorId);
    if (!currentState) return;
    
    if (currentState.currentAnchorCount === 0 && !currentState.hasShownZeroAnchorsWarning) {
      currentState.hasShownZeroAnchorsWarning = true;
      
      logger.warn('⏰ WATCHDOG: No anchors registered after 2 seconds — editor not ready', {
        editorId,
        elapsedTime: Date.now() - currentState.watchdogStartTime,
        criteria: {
          providerMounted: currentState.providerMounted,
          anchorCount: currentState.currentAnchorCount,
          dataLoaded: currentState.dataLoaded
        }
      });
      
      // CRITICAL FIX: If provider is mounted but we're stuck waiting for dataLoaded,
      // force it to true after the watchdog timeout
      if (currentState.providerMounted && !currentState.dataLoaded) {
        logger.warn('⚠️ WATCHDOG INTERVENTION: Provider mounted but data never loaded - forcing dataLoaded: true');
        currentState.dataLoaded = true;
        checkInteractiveReadiness(editorId, 'watchdog-forced-data-loaded');
      }
      
      // Show inline warning in UI (if we have access to it)
      if (typeof window !== 'undefined') {
        // Create temporary warning banner
        const banner = document.createElement('div');
        banner.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #fbbf24;
          color: #92400e;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        banner.textContent = 'No anchors registered yet — editor not ready';
        document.body.appendChild(banner);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (banner.parentNode) {
            banner.parentNode.removeChild(banner);
          }
        }, 5000);
      }
    }
    
    currentState.watchdogTimer = null;
  }, WATCHDOG_TIMEOUT);
}

/**
 * Enhanced: Primary API - Check if editor is interactive
 */
export function isEditorInteractive(editorId: string = 'default'): boolean {
  const state = readinessStates.get(editorId);
  return state ? state.isInteractive : false;
}

/**
 * Legacy compatibility: Check if editor is hydrating
 */
export function isEditorHydrating(editorId: string = 'default'): boolean {
  const state = readinessStates.get(editorId);
  return state ? state.isHydrating : true;
}

/**
 * Get current readiness state for debugging
 */
export function getReadinessState(editorId: string = 'default') {
  return readinessStates.get(editorId) || null;
}

/**
 * Subscribe to interactive state changes
 */
export function onInteractiveChange(
  editorId: string = 'default', 
  callback: (isInteractive: boolean) => void
): () => void {
  if (!interactiveCallbacks.has(editorId)) {
    interactiveCallbacks.set(editorId, new Set());
  }
  
  interactiveCallbacks.get(editorId)!.add(callback);
  
  // Call immediately with current state
  const state = readinessStates.get(editorId);
  if (state) {
    callback(state.isInteractive);
  }
  
  return () => {
    interactiveCallbacks.get(editorId)?.delete(callback);
  };
}

/**
 * Notify interactive state change subscribers
 */
function notifyInteractiveChange(editorId: string, isInteractive: boolean): void {
  const callbacks = interactiveCallbacks.get(editorId);
  if (callbacks) {
    callbacks.forEach(callback => {
      try {
        callback(isInteractive);
      } catch (error) {
        logger.error('Error in interactive change callback:', error);
      }
    });
  }
}

/**
 * Legacy compatibility: Subscribe to hydration completion
 */
export function onHydrationComplete(editorId: string = 'default', callback: () => void): () => void {
  return onInteractiveChange(editorId, (isInteractive) => {
    if (isInteractive) {
      callback();
    }
  });
}

/**
 * Cleanup readiness tracking
 */
export function cleanupReadinessTracking(editorId: string = 'default'): void {
  const state = readinessStates.get(editorId);
  if (state) {
    if (state.stabilityCheckFrame) {
      cancelAnimationFrame(state.stabilityCheckFrame);
    }
    if (state.watchdogTimer) {
      clearTimeout(state.watchdogTimer);
    }
  }
  
  readinessStates.delete(editorId);
  interactiveCallbacks.delete(editorId);

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🧹 Readiness tracking cleaned up for editor: ${editorId}`);
  }
}

/**
 * Force interactive state (emergency escape hatch)
 */
export function forceInteractive(editorId: string = 'default', interactive: boolean = true): void {
  const state = readinessStates.get(editorId);
  if (state && state.isInteractive !== interactive) {
    state.isInteractive = interactive;
    state.isHydrating = !interactive;
    
    logger.warn(`⚠️ Interactive state force-set to ${interactive} for editor: ${editorId}`);
    notifyInteractiveChange(editorId, interactive);
  }
}