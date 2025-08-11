// Comprehensive emergency cleanup system
// Coordinates cleanup across all subsystems when things go wrong

import { emergencyCleanupSuppression } from './bulletproofSuppression';
import { emergencyCleanupReEntrancy } from './reEntrancyGuard';
import { emergencyCleanupRegistry } from './formatRegistry';
import { emergencyCleanupListeners } from './strictModeSafeListeners';
import { clearInteractionSource } from './interactionTracking';
import { pointerTracker } from './pointerTracking';
import { logInteractionTimeline } from './interactionTracking';
import { 
  shouldRunEmergencyCleanup, 
  getDetailedActivityState,
  resetActivityState 
} from './editorActivityState';
import { 
  isEditorHydrating,
  getHydrationState 
} from './hydrationDetection';

export type CleanupReason = 
  | 'component-unmount'
  | 'visibility-change'
  | 'pointer-cancel'
  | 'manual-cleanup'
  | 'error-recovery'
  | 'timeout'
  | 'before-unload'
  | 'dev-hot-reload';

interface CleanupStats {
  reason: CleanupReason;
  timestamp: number;
  systemStates: {
    suppression: any;
    reEntrancy: any;
    registry: any;
    listeners: any;
    interaction: any;
    pointer: any;
  };
}

class EmergencyCleanupSystem {
  private cleanupHistory: CleanupStats[] = [];
  private maxHistoryLength = 10;

  /**
   * Execute comprehensive emergency cleanup
   * @param reason - Why cleanup is being triggered
   * @param details - Additional details for debugging
   * @param editorId - Editor instance ID
   */
  executeEmergencyCleanup(reason: CleanupReason, details?: any, editorId: string = 'default'): void {
    const timestamp = Date.now();
    
    // PHASE 1: Gate emergency cleanup based on activity state and hydration
    const cleanupDecision = shouldRunEmergencyCleanup(editorId, reason);
    const isHydrating = isEditorHydrating(editorId);
    const activityState = getDetailedActivityState(editorId);
    const hydrationState = getHydrationState(editorId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Emergency cleanup evaluation: ${reason}`, {
        shouldRun: cleanupDecision.shouldRun,
        reasoning: cleanupDecision.reasoning,
        isHydrating,
        activityState,
        hydrationState,
        editorId
      });
    }
    
    // Skip cleanup during hydration or when not actively editing
    if (!cleanupDecision.shouldRun) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏭️ Emergency cleanup skipped: ${reason}`, {
          reasoning: cleanupDecision.reasoning,
          editorId
        });
      }
      
      logInteractionTimeline('emergency-cleanup-skipped', { 
        reason, 
        reasoning: cleanupDecision.reasoning, 
        editorId,
        timestamp 
      });
      
      return;
    }
    
    console.warn(`🚨 EMERGENCY CLEANUP INITIATED: ${reason}`, {
      details,
      editorId,
      activityState,
      isHydrating
    });
    logInteractionTimeline('emergency-cleanup-start', { reason, details, editorId, timestamp });

    // Capture system states before cleanup for debugging
    const systemStatesBefore = this.captureSystemStates();

    try {
      // Clean up all subsystems in order
      this.cleanupSubsystems(reason, editorId);

      // Reset activity state after cleanup
      resetActivityState(editorId);

      // Record cleanup stats
      this.recordCleanup(reason, timestamp, systemStatesBefore, editorId);

      console.warn(`✅ Emergency cleanup completed: ${reason}`, { editorId });
      logInteractionTimeline('emergency-cleanup-complete', { reason, editorId, timestamp });

    } catch (error) {
      console.error(`❌ Emergency cleanup failed: ${reason}`, error);
      logInteractionTimeline('emergency-cleanup-failed', { 
        reason, 
        editorId, 
        error: error instanceof Error ? error.message : String(error), 
        timestamp 
      });
      
      // Last resort - try to clear critical state
      this.lastResortCleanup(editorId);
    }
  }

  /**
   * Clean up all subsystems in proper order
   * @param reason - Cleanup reason
   * @param editorId - Editor instance ID
   */
  private cleanupSubsystems(reason: string, editorId: string): void {
    // 1. Stop any active pointer tracking first
    try {
      pointerTracker.cleanup();
      console.log(`✅ Pointer tracker cleaned`);
    } catch (error) {
      console.error(`❌ Pointer tracker cleanup failed:`, error);
    }

    // 2. Clear interaction source
    try {
      clearInteractionSource();
      console.log(`✅ Interaction source cleared`);
    } catch (error) {
      console.error(`❌ Interaction source cleanup failed:`, error);
    }

    // 3. Emergency cleanup listeners
    try {
      emergencyCleanupListeners(reason);
      console.log(`✅ Listeners cleaned`);
    } catch (error) {
      console.error(`❌ Listener cleanup failed:`, error);
    }

    // 4. Clear suppression state
    try {
      emergencyCleanupSuppression(reason);
      console.log(`✅ Suppression state cleaned`);
    } catch (error) {
      console.error(`❌ Suppression cleanup failed:`, error);
    }

    // 5. Clear re-entrancy guard
    try {
      emergencyCleanupReEntrancy(reason);
      console.log(`✅ Re-entrancy guard cleaned`);
    } catch (error) {
      console.error(`❌ Re-entrancy cleanup failed:`, error);
    }

    // 6. Clean format registry
    try {
      emergencyCleanupRegistry(reason);
      console.log(`✅ Format registry cleaned`);
    } catch (error) {
      console.error(`❌ Format registry cleanup failed:`, error);
    }
  }

  /**
   * Last resort cleanup when normal cleanup fails
   * @param editorId - Editor instance ID
   */
  private lastResortCleanup(editorId: string): void {
    console.error(`🆘 LAST RESORT CLEANUP - Normal cleanup failed`);
    
    try {
      // Try to clear any global state that might be stuck
      // This is a nuclear option - clear everything we can
      (window as any).__textFormattingCleanup?.();
      
      // Force clear any remaining timeouts
      const highestTimeoutId = setTimeout(() => {}, 0) as unknown as number;
      for (let i = 0; i <= highestTimeoutId; i++) {
        clearTimeout(i);
      }
      
      console.warn(`🆘 Last resort cleanup attempted`);
    } catch (error) {
      console.error(`❌ Last resort cleanup also failed:`, error);
    }
  }

  /**
   * Capture current state of all subsystems for debugging
   */
  private captureSystemStates() {
    try {
      return {
        suppression: this.safeCapture(() => (window as any).__suppressionState || {}),
        reEntrancy: this.safeCapture(() => (window as any).__reEntrancyState || {}),
        registry: this.safeCapture(() => (window as any).__registryState || {}),
        listeners: this.safeCapture(() => (window as any).__listenerState || {}),
        interaction: this.safeCapture(() => (window as any).__interactionState || {}),
        pointer: this.safeCapture(() => pointerTracker.getState()),
      };
    } catch (error) {
      console.error(`Failed to capture system states:`, error);
      return {
        suppression: 'capture-failed',
        reEntrancy: 'capture-failed',
        registry: 'capture-failed',
        listeners: 'capture-failed',
        interaction: 'capture-failed',
        pointer: 'capture-failed',
      };
    }
  }

  /**
   * Safely capture state with error handling
   * @param captureFunc - Function to capture state
   */
  private safeCapture(captureFunc: () => any): any {
    try {
      return captureFunc();
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Record cleanup event for debugging
   * @param reason - Cleanup reason
   * @param timestamp - When cleanup occurred
   * @param systemStates - State before cleanup
   * @param editorId - Editor instance ID
   */
  private recordCleanup(reason: CleanupReason, timestamp: number, systemStates: any, editorId: string): void {
    const stats: CleanupStats = {
      reason,
      timestamp,
      systemStates,
    };

    this.cleanupHistory.unshift(stats);

    // Keep only recent cleanup events
    if (this.cleanupHistory.length > this.maxHistoryLength) {
      this.cleanupHistory.splice(this.maxHistoryLength);
    }
  }

  /**
   * Get cleanup history for debugging
   */
  getCleanupHistory(): CleanupStats[] {
    return [...this.cleanupHistory];
  }

  /**
   * Get recent cleanup events
   * @param count - Number of recent events to return
   */
  getRecentCleanups(count: number = 5): CleanupStats[] {
    return this.cleanupHistory.slice(0, count);
  }

  /**
   * Check if cleanup was recently executed
   * @param withinMs - Time window in milliseconds
   */
  wasRecentlyExecuted(withinMs: number = 1000): boolean {
    const recent = this.cleanupHistory[0];
    if (!recent) return false;
    
    return (Date.now() - recent.timestamp) < withinMs;
  }

  /**
   * Clear cleanup history
   */
  clearHistory(): void {
    this.cleanupHistory = [];
  }
}

// Export singleton instance
export const emergencyCleanupSystem = new EmergencyCleanupSystem();

// Export convenience functions
export const executeEmergencyCleanup = (reason: CleanupReason, details?: any, editorId?: string) =>
  emergencyCleanupSystem.executeEmergencyCleanup(reason, details, editorId);

export const getCleanupHistory = () => emergencyCleanupSystem.getCleanupHistory();

export const wasCleanupRecentlyExecuted = (withinMs?: number) =>
  emergencyCleanupSystem.wasRecentlyExecuted(withinMs);

// Hook for React components
export function useEmergencyCleanup(editorId: string = 'default') {
  const { useEffect } = require('react');

  useEffect(() => {
    // Cleanup on component unmount - but now gated by activity state
    return () => {
      executeEmergencyCleanup('component-unmount', undefined, editorId);
    };
  }, [editorId]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        executeEmergencyCleanup('visibility-change', undefined, editorId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [editorId]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      executeEmergencyCleanup('before-unload', undefined, editorId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editorId]);

  return {
    executeCleanup: executeEmergencyCleanup,
    getHistory: getCleanupHistory,
    wasRecentlyExecuted: wasCleanupRecentlyExecuted,
  };
}