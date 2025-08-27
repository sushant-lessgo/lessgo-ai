import { logger } from '@/lib/logger';

// src/utils/hydrationDetection.ts - Event-driven hydration detection
// Replaces fixed timeout with criteria-driven approach

interface HydrationState {
  isHydrating: boolean;
  mountCount: number;
  anchorCountStable: boolean;
  lastAnchorCount: number;
  stabilityCheckFrame: number | null;
}

// Global hydration state per editor instance
const hydrationStates = new Map<string, HydrationState>();

/**
 * Initialize hydration tracking for an editor instance
 */
export function initializeHydrationTracking(editorId: string = 'default'): void {
  if (!hydrationStates.has(editorId)) {
    hydrationStates.set(editorId, {
      isHydrating: true,
      mountCount: 0,
      anchorCountStable: false,
      lastAnchorCount: 0,
      stabilityCheckFrame: null,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🚀 Hydration tracking started for editor: ${editorId}`);
    }
  }
}

/**
 * Record an editor mount (for StrictMode double-mount detection)
 */
export function recordEditorMount(editorId: string = 'default'): void {
  const state = hydrationStates.get(editorId);
  if (!state) {
    initializeHydrationTracking(editorId);
    return recordEditorMount(editorId);
  }

  state.mountCount++;
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🔄 Editor mount recorded: ${editorId} (count: ${state.mountCount})`);
    
    // In dev, we expect 2 mounts due to StrictMode
    if (state.mountCount >= 2) {
      logger.debug(`✅ StrictMode double-mount detected for: ${editorId}`);
      checkHydrationComplete(editorId);
    }
  } else {
    // In prod, single mount is sufficient
    if (state.mountCount >= 1) {
      checkHydrationComplete(editorId);
    }
  }
}

/**
 * Update anchor count and check for stability
 */
export function updateAnchorCount(editorId: string = 'default', currentCount: number): void {
  const state = hydrationStates.get(editorId);
  if (!state || !state.isHydrating) return;

  // Check if count is stable (unchanged for one animation frame)
  if (currentCount === state.lastAnchorCount) {
    if (state.stabilityCheckFrame === null) {
      // Start stability check
      state.stabilityCheckFrame = requestAnimationFrame(() => {
        const currentState = hydrationStates.get(editorId);
        if (currentState && currentState.stabilityCheckFrame !== null) {
          currentState.anchorCountStable = true;
          currentState.stabilityCheckFrame = null;
          
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`⚓ Anchor count stable at ${currentCount} for editor: ${editorId}`);
          }
          
          checkHydrationComplete(editorId);
        }
      });
    }
  } else {
    // Count changed, reset stability check
    if (state.stabilityCheckFrame !== null) {
      cancelAnimationFrame(state.stabilityCheckFrame);
      state.stabilityCheckFrame = null;
    }
    state.lastAnchorCount = currentCount;
    state.anchorCountStable = false;
  }
}

/**
 * Check if hydration is complete based on criteria
 */
function checkHydrationComplete(editorId: string): void {
  const state = hydrationStates.get(editorId);
  if (!state || !state.isHydrating) return;

  const expectedMounts = process.env.NODE_ENV === 'development' ? 2 : 1;
  const mountComplete = state.mountCount >= expectedMounts;
  const anchorsStable = state.anchorCountStable;

  if (mountComplete && anchorsStable) {
    state.isHydrating = false;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🎉 Hydration complete for editor: ${editorId}`, {
        mountCount: state.mountCount,
        lastAnchorCount: state.lastAnchorCount,
        timeSinceInit: Date.now()
      });
    }

    // Notify hydration completion
    notifyHydrationComplete(editorId);
  }
}

/**
 * Check if editor is currently hydrating
 */
export function isEditorHydrating(editorId: string = 'default'): boolean {
  const state = hydrationStates.get(editorId);
  return state ? state.isHydrating : true; // Default to hydrating if no state
}

/**
 * Get hydration state for debugging
 */
export function getHydrationState(editorId: string = 'default'): HydrationState | null {
  return hydrationStates.get(editorId) || null;
}

/**
 * Clean up hydration tracking
 */
export function cleanupHydrationTracking(editorId: string = 'default'): void {
  const state = hydrationStates.get(editorId);
  if (state?.stabilityCheckFrame) {
    cancelAnimationFrame(state.stabilityCheckFrame);
  }
  hydrationStates.delete(editorId);

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🧹 Hydration tracking cleaned up for editor: ${editorId}`);
  }
}

// Hydration completion callbacks
const hydrationCallbacks = new Map<string, Set<() => void>>();

/**
 * Subscribe to hydration completion
 */
export function onHydrationComplete(editorId: string = 'default', callback: () => void): () => void {
  if (!hydrationCallbacks.has(editorId)) {
    hydrationCallbacks.set(editorId, new Set());
  }
  
  hydrationCallbacks.get(editorId)!.add(callback);
  
  // If already complete, call immediately
  if (!isEditorHydrating(editorId)) {
    callback();
  }
  
  // Return unsubscribe function
  return () => {
    hydrationCallbacks.get(editorId)?.delete(callback);
  };
}

/**
 * Notify all subscribers that hydration is complete
 */
function notifyHydrationComplete(editorId: string): void {
  const callbacks = hydrationCallbacks.get(editorId);
  if (callbacks) {
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('Error in hydration completion callback:', error);
      }
    });
  }
}

/**
 * Force mark hydration as complete (emergency escape hatch)
 */
export function forceHydrationComplete(editorId: string = 'default'): void {
  const state = hydrationStates.get(editorId);
  if (state) {
    state.isHydrating = false;
    notifyHydrationComplete(editorId);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ Hydration force-completed for editor: ${editorId}`);
    }
  }
}