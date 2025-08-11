// src/utils/editorActivityState.ts - Narrow activity state definition
// Prevents skipping legitimate cleanups while avoiding false positives

interface EditorActivity {
  hasLiveSelection: boolean;
  isComposing: boolean;
  pointerCaptureActive: boolean;
  lastPointerDownTime: number;
  isActivelyEditing: boolean;
}

// Global activity state per editor instance
const activityStates = new Map<string, EditorActivity>();

const POINTER_DOWN_TIMEOUT = 300; // ms - consider pointer activity for 300ms

/**
 * Initialize activity tracking for an editor instance
 */
export function initializeActivityTracking(editorId: string = 'default'): EditorActivity {
  const activity: EditorActivity = {
    hasLiveSelection: false,
    isComposing: false,
    pointerCaptureActive: false,
    lastPointerDownTime: 0,
    isActivelyEditing: false,
  };

  activityStates.set(editorId, activity);
  return activity;
}

/**
 * Get current activity state for an editor
 */
export function getActivityState(editorId: string = 'default'): EditorActivity {
  let state = activityStates.get(editorId);
  if (!state) {
    state = initializeActivityTracking(editorId);
  }
  
  // Update computed isActivelyEditing based on current state
  const now = Date.now();
  const recentPointerActivity = (now - state.lastPointerDownTime) < POINTER_DOWN_TIMEOUT;
  
  state.isActivelyEditing = 
    state.hasLiveSelection || 
    state.isComposing || 
    state.pointerCaptureActive || 
    recentPointerActivity;

  return state;
}

/**
 * Update selection state
 */
export function updateSelectionState(editorId: string = 'default', hasSelection: boolean): void {
  const state = getActivityState(editorId);
  const wasActive = state.isActivelyEditing;
  
  state.hasLiveSelection = hasSelection;
  
  const isActive = getActivityState(editorId).isActivelyEditing;
  
  if (process.env.NODE_ENV === 'development' && wasActive !== isActive) {
    console.log(`📝 Editor activity changed: ${editorId}`, {
      wasActive,
      isActive,
      reason: 'selection',
      hasLiveSelection: hasSelection
    });
  }
}

/**
 * Update composition state (IME input)
 */
export function updateCompositionState(editorId: string = 'default', isComposing: boolean): void {
  const state = getActivityState(editorId);
  const wasActive = state.isActivelyEditing;
  
  state.isComposing = isComposing;
  
  const isActive = getActivityState(editorId).isActivelyEditing;
  
  if (process.env.NODE_ENV === 'development' && wasActive !== isActive) {
    console.log(`🎌 Editor activity changed: ${editorId}`, {
      wasActive,
      isActive,
      reason: 'composition',
      isComposing
    });
  }
}

/**
 * Update pointer capture state
 */
export function updatePointerCaptureState(editorId: string = 'default', captureActive: boolean): void {
  const state = getActivityState(editorId);
  const wasActive = state.isActivelyEditing;
  
  state.pointerCaptureActive = captureActive;
  
  const isActive = getActivityState(editorId).isActivelyEditing;
  
  if (process.env.NODE_ENV === 'development' && wasActive !== isActive) {
    console.log(`👆 Editor activity changed: ${editorId}`, {
      wasActive,
      isActive,
      reason: 'pointer_capture',
      captureActive
    });
  }
}

/**
 * Record pointer down event
 */
export function recordPointerDown(editorId: string = 'default'): void {
  const state = getActivityState(editorId);
  const wasActive = state.isActivelyEditing;
  
  state.lastPointerDownTime = Date.now();
  
  const isActive = getActivityState(editorId).isActivelyEditing;
  
  if (process.env.NODE_ENV === 'development' && !wasActive && isActive) {
    console.log(`🖱️ Editor activity started: ${editorId}`, {
      reason: 'pointer_down',
      timestamp: state.lastPointerDownTime
    });
  }
}

/**
 * Check if editor is currently actively being edited
 */
export function isEditorActivelyEditing(editorId: string = 'default'): boolean {
  return getActivityState(editorId).isActivelyEditing;
}

/**
 * Get detailed activity state for debugging
 */
export function getDetailedActivityState(editorId: string = 'default') {
  const state = getActivityState(editorId);
  const now = Date.now();
  
  return {
    ...state,
    pointerDownAge: now - state.lastPointerDownTime,
    recentPointerActivity: (now - state.lastPointerDownTime) < POINTER_DOWN_TIMEOUT,
  };
}

/**
 * Clean up activity tracking
 */
export function cleanupActivityTracking(editorId: string = 'default'): void {
  activityStates.delete(editorId);

  if (process.env.NODE_ENV === 'development') {
    console.log(`🧹 Activity tracking cleaned up for editor: ${editorId}`);
  }
}

/**
 * Reset activity state (for emergency cleanup)
 */
export function resetActivityState(editorId: string = 'default'): void {
  const state = activityStates.get(editorId);
  if (state) {
    state.hasLiveSelection = false;
    state.isComposing = false;
    state.pointerCaptureActive = false;
    state.lastPointerDownTime = 0;
    state.isActivelyEditing = false;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Activity state reset for editor: ${editorId}`);
    }
  }
}

/**
 * Known development lifecycle events that should not trigger cleanup
 */
export const DEV_LIFECYCLE_REASONS = [
  'component-unmount',
  'strict-mode-remount', 
  'hydration-swap',
  'hot-reload',
  'dev-refresh'
] as const;

export type DevLifecycleReason = typeof DEV_LIFECYCLE_REASONS[number];

/**
 * Check if cleanup reason is a known dev lifecycle event
 */
export function isDevLifecycleReason(reason: string): boolean {
  return DEV_LIFECYCLE_REASONS.includes(reason as DevLifecycleReason);
}

/**
 * Determine if emergency cleanup should run based on activity and reason
 */
export function shouldRunEmergencyCleanup(
  editorId: string = 'default', 
  reason: string
): {
  shouldRun: boolean;
  reasoning: string;
} {
  const isActive = isEditorActivelyEditing(editorId);
  const isDevLifecycle = isDevLifecycleReason(reason);

  // Only run emergency cleanup if actively editing AND not a dev lifecycle event
  if (isActive && !isDevLifecycle) {
    return {
      shouldRun: true,
      reasoning: `Editor actively editing (${getDetailedActivityState(editorId)}) and reason is not dev lifecycle`
    };
  }

  if (!isActive) {
    return {
      shouldRun: false,
      reasoning: `Editor not actively editing`
    };
  }

  if (isDevLifecycle) {
    return {
      shouldRun: false,
      reasoning: `Reason '${reason}' is known dev lifecycle event`
    };
  }

  return {
    shouldRun: false,
    reasoning: `Unknown state combination`
  };
}