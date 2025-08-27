import { logger } from '@/lib/logger';

// Phase 2.3: One-shot ready-but-hidden watchdog
// Detects when toolbar should be visible but isn't

interface WatchdogState {
  timeoutId: number | null;
  isActive: boolean;
  interactionId: string | null;
}

// Global watchdog state (single instance across all components)
let globalWatchdogState: WatchdogState = {
  timeoutId: null,
  isActive: false,
  interactionId: null
};

interface ToolbarWatchdogOptions {
  anchorCount: number;
  hasCaret: boolean;
  hasElementClick: boolean;
  activeToolbar: string | null;
  mode: string;
  elementTargetKey?: string | null;
  textTargetKey?: string | null;
}

/**
 * Phase 2.3: One-shot watchdog that monitors for toolbar visibility issues
 * Only triggers once per interaction, cleared on decision
 */
export function startToolbarWatchdog(options: ToolbarWatchdogOptions): void {
  const {
    anchorCount,
    hasCaret,
    hasElementClick,
    activeToolbar,
    mode,
    elementTargetKey,
    textTargetKey
  } = options;

  // Generate unique interaction ID
  const interactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Clear any existing watchdog
  clearToolbarWatchdog();

  // Only start watchdog if conditions suggest toolbar should be visible
  const shouldBeVisible = anchorCount > 0 && (hasCaret || hasElementClick) && activeToolbar === null;
  
  if (!shouldBeVisible) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🐕 [WATCHDOG] Conditions not met, skipping:', {
        anchorCount,
        hasCaret,
        hasElementClick,
        activeToolbar,
        mode
      });
    }
    return;
  }

  // Set up 500ms one-shot timer
  globalWatchdogState.timeoutId = window.setTimeout(() => {
    if (globalWatchdogState.interactionId === interactionId && globalWatchdogState.isActive) {
      // Log the issue
      logger.warn('🚨 [WATCHDOG] Toolbar should be visible but is hidden:', {
        interactionId,
        anchorCount,
        hasCaret,
        hasElementClick,
        activeToolbar,
        mode,
        elementTargetKey,
        textTargetKey,
        timestamp: new Date().toISOString()
      });

      // Additional debugging info
      const selection = window.getSelection();
      const selectionInfo = selection ? {
        rangeCount: selection.rangeCount,
        isCollapsed: selection.isCollapsed,
        type: selection.type,
        anchorNode: selection.anchorNode?.nodeName,
        focusNode: selection.focusNode?.nodeName,
        selectedText: selection.toString().slice(0, 50)
      } : null;

      logger.warn('🚨 [WATCHDOG] Current selection state:', selectionInfo);

      // Auto-clear after logging
      globalWatchdogState.isActive = false;
      globalWatchdogState.interactionId = null;
    }
  }, 500);

  globalWatchdogState.isActive = true;
  globalWatchdogState.interactionId = interactionId;

  if (process.env.NODE_ENV === 'development') {
    logger.debug('🐕 [WATCHDOG] Started monitoring for interaction:', {
      interactionId,
      anchorCount,
      hasCaret,
      hasElementClick,
      mode
    });
  }
}

/**
 * Clear the watchdog (called when toolbar decision is made)
 */
export function clearToolbarWatchdog(): void {
  if (globalWatchdogState.timeoutId !== null) {
    clearTimeout(globalWatchdogState.timeoutId);
    globalWatchdogState.timeoutId = null;

    if (process.env.NODE_ENV === 'development' && globalWatchdogState.isActive) {
      logger.debug('🐕 [WATCHDOG] Cleared for interaction:', globalWatchdogState.interactionId);
    }
  }

  globalWatchdogState.isActive = false;
  globalWatchdogState.interactionId = null;
}

/**
 * Get current watchdog status (for debugging)
 */
export function getWatchdogStatus() {
  return {
    isActive: globalWatchdogState.isActive,
    interactionId: globalWatchdogState.interactionId,
    hasTimeout: globalWatchdogState.timeoutId !== null
  };
}

/**
 * Reset watchdog state (for testing/cleanup)
 */
export function resetWatchdog(): void {
  clearToolbarWatchdog();
  logger.debug('🐕 [WATCHDOG] State reset');
}