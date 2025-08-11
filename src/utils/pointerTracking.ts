// Pointer tracking system for two-phase button interaction
// Handles window-level events, movement threshold, and cleanup

import { logInteractionTimeline } from './interactionTracking';

interface PointerState {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  isActive: boolean;
}

interface PointerTrackingOptions {
  movementThreshold: number; // pixels
  timeoutMs: number; // max time to wait for pointerup
}

const DEFAULT_OPTIONS: PointerTrackingOptions = {
  movementThreshold: 30, // 30px movement threshold
  timeoutMs: 500, // 500ms timeout
};

class PointerTracker {
  private activePointer: PointerState | null = null;
  private windowListeners: Array<() => void> = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private options: PointerTrackingOptions;

  constructor(options: Partial<PointerTrackingOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start tracking a pointer interaction
   */
  start(pointerId: number, startX: number, startY: number): void {
    // Clear any existing tracking
    this.cleanup();

    this.activePointer = {
      pointerId,
      startX,
      startY,
      startTime: Date.now(),
      isActive: true,
    };

    logInteractionTimeline('pointer:start', {
      pointerId,
      startX,
      startY,
    });

    // Set safety timeout
    this.timeoutId = setTimeout(() => {
      logInteractionTimeline('pointer:timeout');
      this.cleanup();
    }, this.options.timeoutMs);
  }

  /**
   * Check if a pointer ID matches the active pointer
   */
  matches(pointerId: number): boolean {
    return this.activePointer?.pointerId === pointerId && this.activePointer.isActive;
  }

  /**
   * Check if the pointer has moved beyond the threshold (should cancel)
   */
  movedTooFar(currentX: number, currentY: number): boolean {
    if (!this.activePointer) return false;

    const deltaX = currentX - this.activePointer.startX;
    const deltaY = currentY - this.activePointer.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    const moved = distance > this.options.movementThreshold;
    
    if (moved) {
      logInteractionTimeline('pointer:moved-too-far', {
        distance,
        threshold: this.options.movementThreshold,
      });
    }

    return moved;
  }

  /**
   * Get tracking info for debugging
   */
  getState(): PointerState | null {
    return this.activePointer;
  }

  /**
   * Attach window-level listeners for pointerup/cancel
   */
  attachWindowListeners(
    onPointerUp: (e: PointerEvent) => void,
    onPointerCancel: (e: PointerEvent) => void
  ): void {
    const handlePointerUp = (e: PointerEvent) => {
      if (this.matches(e.pointerId)) {
        logInteractionTimeline('pointer:window-up', { pointerId: e.pointerId });
        onPointerUp(e);
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (this.matches(e.pointerId)) {
        logInteractionTimeline('pointer:cancel', { pointerId: e.pointerId });
        onPointerCancel(e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && this.activePointer?.isActive) {
        logInteractionTimeline('pointer:visibility-cancel');
        onPointerCancel(new PointerEvent('pointercancel', { pointerId: this.activePointer.pointerId }));
      }
    };

    // Add listeners with capture to ensure we catch them first
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointercancel', handlePointerCancel, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store cleanup functions
    this.windowListeners = [
      () => window.removeEventListener('pointerup', handlePointerUp, { capture: true }),
      () => window.removeEventListener('pointercancel', handlePointerCancel, { capture: true }),
      () => document.removeEventListener('visibilitychange', handleVisibilityChange),
    ];

    logInteractionTimeline('pointer:listeners-attached');
  }

  /**
   * Remove window-level listeners
   */
  detachWindowListeners(): void {
    this.windowListeners.forEach(cleanup => cleanup());
    this.windowListeners = [];
    logInteractionTimeline('pointer:listeners-detached');
  }

  /**
   * Clean up all tracking state
   */
  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.activePointer?.isActive) {
      this.activePointer.isActive = false;
    }

    this.detachWindowListeners();
    
    logInteractionTimeline('pointer:cleanup');
  }

  /**
   * Check if currently tracking any pointer
   */
  isActive(): boolean {
    return this.activePointer?.isActive === true;
  }
}

// Export singleton instance
export const pointerTracker = new PointerTracker();

// Export for custom instances if needed
export { PointerTracker };

// Export hook for React integration
export function usePointerTracking(options?: Partial<PointerTrackingOptions>) {
  const { useEffect } = require('react');
  const tracker = new PointerTracker(options);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => tracker.cleanup();
  }, [tracker]);

  return tracker;
}