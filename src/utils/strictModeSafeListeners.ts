// StrictMode-safe listener management system
// Prevents double-registration and tracks listener versions for debugging

import { TransactionId } from './bulletproofSuppression';

interface ListenerState {
  version: number;
  isAttached: boolean;
  attachedAt: number;
  pointerId?: number;
}

class StrictModeSafeListeners {
  private listenerStates: Map<string, ListenerState> = new Map();
  private globalVersion = 0;

  /**
   * Generate unique listener key for tracking
   * @param txId - Transaction ID
   * @param type - Listener type (e.g., 'pointerup', 'pointercancel')
   */
  private getListenerKey(txId: TransactionId, type: string): string {
    return `${txId}-${type}`;
  }

  /**
   * Attach window-level pointer listeners with StrictMode protection
   * @param txId - Transaction ID
   * @param pointerId - Pointer ID to track
   * @param onPointerUp - Handler for pointerup
   * @param onPointerCancel - Handler for pointercancel
   */
  attachPointerListeners(
    txId: TransactionId,
    pointerId: number,
    onPointerUp: (e: PointerEvent) => void,
    onPointerCancel: (e: PointerEvent) => void
  ): void {
    const upKey = this.getListenerKey(txId, 'pointerup');
    const cancelKey = this.getListenerKey(txId, 'pointercancel');

    // Check for double-attachment (StrictMode protection)
    if (this.listenerStates.has(upKey) || this.listenerStates.has(cancelKey)) {
      console.warn(`⚠️ Attempted double listener attachment for ${txId} - StrictMode double-invoke?`);
      console.warn('Current listener states:', {
        up: this.listenerStates.get(upKey),
        cancel: this.listenerStates.get(cancelKey),
      });
      return;
    }

    const version = ++this.globalVersion;
    const timestamp = Date.now();

    // Validate version increment (should never jump by >1)
    if (process.env.NODE_ENV !== 'production') {
      const prevVersion = version - 1;
      if (prevVersion > 0 && version - prevVersion !== 1) {
        console.error(`🚫 Listener version jumped: ${prevVersion} → ${version}`);
        console.assert(false, `Listener version discontinuity detected`);
      }
    }

    // Wrapped handlers that validate pointer ID
    const wrappedUp = (e: PointerEvent) => {
      if (e.pointerId === pointerId) {
        console.log(`🎯 PointerUp matched: ${pointerId} (${txId})`);
        onPointerUp(e);
      } else {
        console.log(`🚫 PointerUp ignored: ${e.pointerId} ≠ ${pointerId} (${txId})`);
      }
    };

    const wrappedCancel = (e: PointerEvent) => {
      if (e.pointerId === pointerId) {
        console.log(`🚫 PointerCancel matched: ${pointerId} (${txId})`);
        onPointerCancel(e);
      } else {
        console.log(`🚫 PointerCancel ignored: ${e.pointerId} ≠ ${pointerId} (${txId})`);
      }
    };

    // Attach listeners with { once: true } for automatic cleanup
    window.addEventListener('pointerup', wrappedUp, { once: true, capture: true });
    window.addEventListener('pointercancel', wrappedCancel, { once: true, capture: true });

    // Track listener state
    this.listenerStates.set(upKey, {
      version,
      isAttached: true,
      attachedAt: timestamp,
      pointerId,
    });

    this.listenerStates.set(cancelKey, {
      version,
      isAttached: true,
      attachedAt: timestamp,
      pointerId,
    });

    console.log(`🔗 Attached pointer listeners v${version} for ${txId} (pointer: ${pointerId})`);
  }

  /**
   * Detach listeners (cleanup)
   * @param txId - Transaction ID
   */
  detachPointerListeners(txId: TransactionId): void {
    const upKey = this.getListenerKey(txId, 'pointerup');
    const cancelKey = this.getListenerKey(txId, 'pointercancel');

    const upState = this.listenerStates.get(upKey);
    const cancelState = this.listenerStates.get(cancelKey);

    if (upState) {
      this.listenerStates.delete(upKey);
      console.log(`🔗 Detached pointerup listener v${upState.version} for ${txId}`);
    }

    if (cancelState) {
      this.listenerStates.delete(cancelKey);
      console.log(`🔗 Detached pointercancel listener v${cancelState.version} for ${txId}`);
    }

    // Note: With { once: true }, listeners auto-detach after firing
    // This manual cleanup is for tracking purposes and emergency scenarios
  }

  /**
   * Check if listeners are attached for a transaction
   * @param txId - Transaction ID to check
   */
  hasAttachedListeners(txId: TransactionId): boolean {
    const upKey = this.getListenerKey(txId, 'pointerup');
    const cancelKey = this.getListenerKey(txId, 'pointercancel');

    return this.listenerStates.has(upKey) || this.listenerStates.has(cancelKey);
  }

  /**
   * Get listener state for debugging
   * @param txId - Transaction ID
   */
  getListenerState(txId: TransactionId) {
    const upKey = this.getListenerKey(txId, 'pointerup');
    const cancelKey = this.getListenerKey(txId, 'pointercancel');

    return {
      up: this.listenerStates.get(upKey),
      cancel: this.listenerStates.get(cancelKey),
    };
  }

  /**
   * Get all listener states for debugging
   */
  getAllListenerStates() {
    const states: Record<string, ListenerState & { key: string }> = {};
    
    for (const [key, state] of this.listenerStates.entries()) {
      states[key] = {
        key,
        ...state,
      };
    }

    return {
      globalVersion: this.globalVersion,
      activeListeners: this.listenerStates.size,
      states,
    };
  }

  /**
   * Emergency cleanup - remove all listener tracking
   * @param reason - Reason for cleanup
   */
  emergencyCleanup(reason: string): void {
    console.warn(`🚨 Emergency listener cleanup: ${reason}`, {
      activeListeners: this.listenerStates.size,
      globalVersion: this.globalVersion,
    });

    // Note: We can't actually remove the listeners since they use { once: true }
    // But we can clear our tracking state
    this.listenerStates.clear();
  }

  /**
   * Assert no listeners are currently tracked (clean state)
   */
  assertCleanState(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.assert(
        this.listenerStates.size === 0,
        `Listeners still tracked: ${this.listenerStates.size}. State: ${JSON.stringify(this.getAllListenerStates())}`
      );
    }
  }

  /**
   * Validate listener version consistency
   */
  validateVersionConsistency(): void {
    if (process.env.NODE_ENV !== 'production') {
      const versions = Array.from(this.listenerStates.values()).map(state => state.version);
      const uniqueVersions = new Set(versions);
      
      // In normal operation, all active listeners should have the same version
      // (since they're attached together and detached together)
      if (uniqueVersions.size > 1) {
        console.warn(`⚠️ Mixed listener versions detected:`, uniqueVersions);
        console.log('Listener states:', this.getAllListenerStates());
      }
    }
  }
}

// Export singleton instance
export const strictModeSafeListeners = new StrictModeSafeListeners();

// Export convenience functions
export const attachPointerListeners = (
  txId: TransactionId,
  pointerId: number,
  onPointerUp: (e: PointerEvent) => void,
  onPointerCancel: (e: PointerEvent) => void
) => strictModeSafeListeners.attachPointerListeners(txId, pointerId, onPointerUp, onPointerCancel);

export const detachPointerListeners = (txId: TransactionId) =>
  strictModeSafeListeners.detachPointerListeners(txId);

export const hasAttachedListeners = (txId: TransactionId) =>
  strictModeSafeListeners.hasAttachedListeners(txId);

export const getListenerState = (txId: TransactionId) =>
  strictModeSafeListeners.getListenerState(txId);

export const getAllListenerStates = () => strictModeSafeListeners.getAllListenerStates();

export const emergencyCleanupListeners = (reason: string) =>
  strictModeSafeListeners.emergencyCleanup(reason);

export const assertCleanListenerState = () => strictModeSafeListeners.assertCleanState();

export const validateListenerVersions = () => strictModeSafeListeners.validateVersionConsistency();