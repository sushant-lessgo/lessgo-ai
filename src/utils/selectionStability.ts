// Phase 1.2: Selection stability guard - prevents selection handler thrashing
// Tracks attachment/detachment frequency and auto-freezes problematic handlers

interface StabilityState {
  attachmentCount: number;
  detachmentCount: number;
  firstAttachTime: number;
  lastAttachTime: number;
  isFrozen: boolean;
  frozenUntil: number;
  componentOwner: string | null;
  hasSuccessfulAttach: boolean; // Phase B1: Track if we've had at least one successful attach
  autoRetryTimeoutId?: NodeJS.Timeout; // Phase B2: Auto-retry timeout tracking
  lastFreezeWarning?: number; // Fix 3: Prevent repeated freeze warnings
}

// Global tracking per editor ID
const stabilityStates = new Map<string, StabilityState>();

// Fix 3: Dramatically raised thresholds to prevent freezing during normal use
const MAX_ATTACHMENTS_PER_WINDOW = 20; // Raised from 5 to 20
const MAX_ATTACHMENTS_PER_SECOND = 10; // Raised from 2.5 to 10 per second  
const FREEZE_DURATION = 16; // Single frame duration (16ms at 60fps)
const TRACKING_WINDOW = 2000; // Up from 1000ms - 2 second window

/**
 * Track selection handler attachment
 */
export function trackHandlerAttachment(editorId: string, componentOwner?: string): boolean {
  // Fix A: Disable stability guard completely in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ [STABILITY-DEV] Allowing attachment unconditionally in development`, {
      editorId,
      componentOwner,
      mode: 'development-bypass'
    });
    return true; // Always allow in development
  }
  
  // Production logic (kept for safety)
  const now = Date.now();
  
  let state = stabilityStates.get(editorId);
  if (!state) {
    state = {
      attachmentCount: 0,
      detachmentCount: 0,
      firstAttachTime: now,
      lastAttachTime: now,
      isFrozen: false,
      frozenUntil: 0,
      componentOwner: componentOwner || null,
      hasSuccessfulAttach: false
    };
    stabilityStates.set(editorId, state);
  }
  
  // Phase B1: Allow first attach unconditionally - only freeze after successful attach
  if (!state.hasSuccessfulAttach) {
    console.log(`🎯 [STABILITY] First attachment - allowing unconditionally`, {
      editorId,
      componentOwner,
      attachmentCount: state.attachmentCount
    });
    // Skip all checks for first attach - continue to registration
  } else {
    // Check if currently frozen (only after first successful attach)
    if (state.isFrozen && now < state.frozenUntil) {
      // Fix 3: Log freeze warning only once per freeze cycle to prevent spam
      const shouldLogWarning = !state.lastFreezeWarning || (now - state.lastFreezeWarning) > 1000;
      
      if (shouldLogWarning) {
        console.warn(`🚫 [STABILITY] Selection handler attachment blocked - frozen until ${new Date(state.frozenUntil).toISOString()}`, {
          editorId,
          componentOwner,
          attachmentCount: state.attachmentCount,
          timeRemaining: state.frozenUntil - now,
          freezeDuration: FREEZE_DURATION
        });
        state.lastFreezeWarning = now;
      }
      return false; // Block attachment
    }
  }
  
  // Reset tracking window if too much time has passed
  if (now - state.firstAttachTime > TRACKING_WINDOW) {
    state.attachmentCount = 0;
    state.detachmentCount = 0;
    state.firstAttachTime = now;
  }
  
  // Increment attachment count
  state.attachmentCount++;
  state.lastAttachTime = now;
  
  // Phase B1: Only check for thrashing after first successful attach
  if (state.hasSuccessfulAttach) {
    // Check for thrashing
    const timeWindow = now - state.firstAttachTime;
    const attachmentsPerSecond = state.attachmentCount / (timeWindow / 1000);
    
    if (attachmentsPerSecond > MAX_ATTACHMENTS_PER_SECOND) {
      // Thrashing detected - freeze handler
      state.isFrozen = true;
      state.frozenUntil = now + FREEZE_DURATION;
      
      // Phase B2: Schedule auto-retry after freeze period
      const retryDelay = FREEZE_DURATION + Math.random() * 250; // 500-750ms retry
      if (state.autoRetryTimeoutId) {
        clearTimeout(state.autoRetryTimeoutId);
      }
      
      state.autoRetryTimeoutId = setTimeout(() => {
        console.log(`🔄 [STABILITY] Auto-retry scheduled - attempting to unfreeze`, {
          editorId,
          componentOwner: state.componentOwner,
          retryAfterMs: retryDelay
        });
        
        // Clear frozen state and allow next attach
        if (state.isFrozen && Date.now() >= state.frozenUntil) {
          state.isFrozen = false;
          state.frozenUntil = 0;
          console.log(`✅ [STABILITY] Auto-retry completed - handler unfrozen`, {
            editorId,
            componentOwner: state.componentOwner
          });
        }
      }, retryDelay);
      
      console.error(`🚨 [STABILITY] Selection handler thrashing detected - freezing for ${FREEZE_DURATION}ms`, {
        editorId,
        componentOwner: state.componentOwner,
        attachmentCount: state.attachmentCount,
        detachmentCount: state.detachmentCount,
        timeWindow,
        attachmentsPerSecond: attachmentsPerSecond.toFixed(2),
        frozenUntil: new Date(state.frozenUntil).toISOString(),
        autoRetryIn: `${retryDelay}ms`
      });
      
      // Try to get React DevTools owner stack if available
      if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        try {
          const devTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (devTools.getFiberRoots) {
            console.error('🔍 [STABILITY] React DevTools available - check component tree for:', {
              editorId,
              componentOwner,
              hint: 'Look for components that re-render frequently or have unstable keys/props'
            });
          }
        } catch (error) {
          // DevTools not available or error accessing it
        }
      }
      
      return false; // Block this attachment
    }
  }
  
  // Phase B1: Mark first attach as successful
  if (!state.hasSuccessfulAttach) {
    state.hasSuccessfulAttach = true;
    console.log(`✅ [STABILITY] First attachment successful - enabling stability tracking`, {
      editorId,
      componentOwner
    });
  }
  
  // Phase B1: Enhanced positive logging - show successful attachments
  const timeWindow = now - state.firstAttachTime;
  const attachmentsPerSecond = timeWindow > 0 ? (state.attachmentCount / (timeWindow / 1000)).toFixed(2) : '0';
  
  console.log(`✅ [STABILITY] Selection handler attached successfully`, {
    editorId,
    componentOwner,
    attachmentCount: state.attachmentCount,
    attachmentsPerSecond,
    isFirstAttach: state.attachmentCount === 1,
    hasSuccessfulAttach: state.hasSuccessfulAttach
  });
  
  return true; // Allow attachment
}

/**
 * Track selection handler detachment
 */
export function trackHandlerDetachment(editorId: string, componentOwner?: string): void {
  const state = stabilityStates.get(editorId);
  if (!state) return;
  
  state.detachmentCount++;
  
  // Phase B1: Enhanced positive logging - show successful detachments
  console.log(`🧹 [STABILITY] Selection handler detached successfully`, {
    editorId,
    componentOwner,
    detachmentCount: state.detachmentCount,
    attachmentCount: state.attachmentCount,
    hasSuccessfulAttach: state.hasSuccessfulAttach
  });
}

/**
 * Check if handler is currently frozen
 */
export function isHandlerFrozen(editorId: string): boolean {
  const state = stabilityStates.get(editorId);
  if (!state) return false;
  
  const now = Date.now();
  
  // Check if freeze has expired
  if (state.isFrozen && now >= state.frozenUntil) {
    state.isFrozen = false;
    state.frozenUntil = 0;
    
    console.log(`🔓 [STABILITY] Selection handler unfrozen`, {
      editorId,
      componentOwner: state.componentOwner
    });
    
    return false;
  }
  
  return state.isFrozen;
}

/**
 * Manually unfreeze a handler (for testing or emergency reset)
 */
export function unfreezeHandler(editorId: string): void {
  const state = stabilityStates.get(editorId);
  if (!state) return;
  
  // Phase B2: Clear auto-retry timeout if exists
  if (state.autoRetryTimeoutId) {
    clearTimeout(state.autoRetryTimeoutId);
    state.autoRetryTimeoutId = undefined;
  }
  
  state.isFrozen = false;
  state.frozenUntil = 0;
  
  console.log(`🔧 [STABILITY] Selection handler manually unfrozen`, {
    editorId,
    componentOwner: state.componentOwner
  });
}

/**
 * Get stability statistics for debugging
 */
export function getStabilityStats(editorId: string) {
  const state = stabilityStates.get(editorId);
  if (!state) return null;
  
  const now = Date.now();
  const timeWindow = now - state.firstAttachTime;
  
  return {
    editorId,
    componentOwner: state.componentOwner,
    attachmentCount: state.attachmentCount,
    detachmentCount: state.detachmentCount,
    attachmentsPerSecond: timeWindow > 0 ? (state.attachmentCount / (timeWindow / 1000)).toFixed(2) : '0',
    isFrozen: state.isFrozen,
    frozenUntil: state.isFrozen ? new Date(state.frozenUntil).toISOString() : null,
    timeRemainingMs: state.isFrozen ? Math.max(0, state.frozenUntil - now) : 0
  };
}

/**
 * Reset all stability tracking (for testing)
 */
export function resetStabilityTracking(): void {
  // Phase B2: Clear all auto-retry timeouts before reset
  for (const state of stabilityStates.values()) {
    if (state.autoRetryTimeoutId) {
      clearTimeout(state.autoRetryTimeoutId);
    }
  }
  
  stabilityStates.clear();
  console.log('🔄 [STABILITY] All stability tracking reset');
}

/**
 * Get all stability states (for debugging)
 */
export function getAllStabilityStates() {
  const states: Record<string, any> = {};
  
  for (const [editorId, state] of stabilityStates.entries()) {
    states[editorId] = getStabilityStats(editorId);
  }
  
  return states;
}