// Re-entrancy guard system with transaction tracking and stack trace debugging
// Prevents infinite loops in format operations

import { logInteractionTimeline } from './interactionTracking';
import { TransactionId } from './bulletproofSuppression';

interface OperationState {
  isFormatting: boolean;
  currentTxId: TransactionId | null;
  operationStack: string[];
}

class ReEntrancyGuard {
  private state: OperationState = {
    isFormatting: false,
    currentTxId: null,
    operationStack: [],
  };

  /**
   * Check if formatting operation is currently in progress
   */
  isFormatting(): boolean {
    return this.state.isFormatting;
  }

  /**
   * Get current transaction ID
   */
  getCurrentTxId(): TransactionId | null {
    return this.state.currentTxId;
  }

  /**
   * Begin formatting operation with re-entrancy protection
   * @param txId - Transaction ID for this operation
   * @param operationName - Name of the operation for debugging
   */
  beginFormatting(txId: TransactionId, operationName: string): boolean {
    // Check for re-entrancy
    if (this.state.isFormatting) {
      console.error(`🚫 Re-entrancy blocked! Current: ${this.state.currentTxId}, Attempted: ${txId}`);
      console.error(`🚫 Current operation: ${operationName}`);
      console.error(`🚫 Operation stack:`, this.state.operationStack);
      console.error(`🚫 Re-entry stack trace:`, new Error().stack);
      
      logInteractionTimeline('reentry-blocked', {
        currentTxId: this.state.currentTxId,
        attemptedTxId: txId,
        operationName,
        operationStack: this.state.operationStack,
      });
      
      return false; // Block re-entrancy
    }

    this.state.isFormatting = true;
    this.state.currentTxId = txId;
    this.state.operationStack.push(operationName);

    logInteractionTimeline('formatting-begin', {
      txId,
      operationName,
      timestamp: Date.now(),
    });

    console.log(`✅ Begin formatting: ${operationName} (${txId})`);
    return true;
  }

  /**
   * End formatting operation
   * @param txId - Transaction ID that should match current operation
   * @param operationName - Name of the operation
   */
  endFormatting(txId: TransactionId, operationName: string): void {
    if (!this.state.isFormatting) {
      console.warn(`⚠️ End formatting called but no operation in progress: ${operationName} (${txId})`);
      return;
    }

    if (this.state.currentTxId !== txId) {
      console.error(`🚫 Transaction ID mismatch! Expected: ${this.state.currentTxId}, Got: ${txId}`);
      console.assert(false, `Transaction ID mismatch in endFormatting`);
    }

    this.state.isFormatting = false;
    this.state.currentTxId = null;
    this.state.operationStack.pop();

    logInteractionTimeline('formatting-end', {
      txId,
      operationName,
      timestamp: Date.now(),
    });

    console.log(`✅ End formatting: ${operationName} (${txId})`);
  }

  /**
   * Execute operation with re-entrancy protection
   * @param txId - Transaction ID
   * @param operationName - Name of the operation
   * @param operation - Function to execute
   */
  withReEntrancyProtection<T>(
    txId: TransactionId,
    operationName: string,
    operation: () => T | Promise<T>
  ): T | Promise<T> | null {
    if (!this.beginFormatting(txId, operationName)) {
      return null; // Re-entrancy blocked
    }

    try {
      const result = operation();

      // Handle both sync and async operations
      if (result instanceof Promise) {
        return result.finally(() => {
          this.endFormatting(txId, operationName);
        }) as Promise<T>;
      } else {
        this.endFormatting(txId, operationName);
        return result;
      }
    } catch (error) {
      console.error(`❌ Operation failed: ${operationName} (${txId})`, error);
      this.endFormatting(txId, operationName);
      throw error;
    }
  }

  /**
   * Emergency cleanup - clear all state
   * @param reason - Reason for emergency cleanup
   */
  emergencyCleanup(reason: string): void {
    console.warn(`🚨 Emergency re-entrancy cleanup: ${reason}`, {
      wasFormatting: this.state.isFormatting,
      currentTxId: this.state.currentTxId,
      operationStack: [...this.state.operationStack],
    });

    this.state.isFormatting = false;
    this.state.currentTxId = null;
    this.state.operationStack = [];

    logInteractionTimeline('emergency-cleanup', { reason });
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      isFormatting: this.state.isFormatting,
      currentTxId: this.state.currentTxId,
      operationStack: [...this.state.operationStack],
    };
  }

  /**
   * Assert clean state (no operations in progress)
   */
  assertCleanState(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.assert(
        !this.state.isFormatting,
        `Re-entrancy guard not clean: ${JSON.stringify(this.getState())}`
      );
    }
  }
}

// Export singleton instance
export const reEntrancyGuard = new ReEntrancyGuard();

// Export convenience functions
export const isFormatting = () => reEntrancyGuard.isFormatting();
export const getCurrentTxId = () => reEntrancyGuard.getCurrentTxId();
export const beginFormatting = (txId: TransactionId, operationName: string) =>
  reEntrancyGuard.beginFormatting(txId, operationName);
export const endFormatting = (txId: TransactionId, operationName: string) =>
  reEntrancyGuard.endFormatting(txId, operationName);
export const withReEntrancyProtection = <T>(
  txId: TransactionId,
  operationName: string,
  operation: () => T | Promise<T>
) => reEntrancyGuard.withReEntrancyProtection(txId, operationName, operation);
export const emergencyCleanupReEntrancy = (reason: string) => reEntrancyGuard.emergencyCleanup(reason);
export const assertCleanReEntrancyState = () => reEntrancyGuard.assertCleanState();