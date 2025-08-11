// Bulletproof suppression system with leak detection and transaction tracking
// Prevents re-entrancy loops with comprehensive safety mechanisms

export type SuppressionToken = string;
export type TransactionId = string;

interface SuppressionState {
  counter: number;
  activeTokens: Set<SuppressionToken>;
  activeTransactions: Map<TransactionId, SuppressionToken[]>;
}

class BulletproofSuppression {
  private state: SuppressionState = {
    counter: 0,
    activeTokens: new Set(),
    activeTransactions: new Map(),
  };

  /**
   * Generate unique transaction ID using crypto.randomUUID for better uniqueness
   * Format: tx:<uuid> to avoid underscore/hyphen confusion
   */
  generateTransactionId(): TransactionId {
    try {
      // Use crypto.randomUUID() for robust uniqueness across tabs/workers
      const uuid = crypto.randomUUID();
      return `tx:${uuid}`;
    } catch (error) {
      // Fallback for environments without crypto.randomUUID()
      console.warn('crypto.randomUUID() not available, using fallback TX ID generation');
      return `tx:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Begin suppression with leak protection
   * @param token - Unique token for this suppression scope
   * @param txId - Transaction ID for tracking
   */
  beginSuppression(token: SuppressionToken, txId: TransactionId): void {
    // Guard against double begin with same token
    if (this.state.activeTokens.has(token)) {
      console.warn(`🔒 Double begin suppression blocked for token: ${token} (${txId})`);
      return;
    }

    this.state.activeTokens.add(token);
    this.state.counter++;

    // Track token under transaction
    if (!this.state.activeTransactions.has(txId)) {
      this.state.activeTransactions.set(txId, []);
    }
    this.state.activeTransactions.get(txId)!.push(token);

    console.log(`🔒 Begin suppression: ${token} (${txId}) [counter: ${this.state.counter}]`);
  }

  /**
   * End suppression with validation
   * @param token - Token to end suppression for
   * @param txId - Transaction ID for tracking
   */
  endSuppression(token: SuppressionToken, txId: TransactionId): void {
    if (!this.state.activeTokens.has(token)) {
      console.warn(`🔓 Attempt to end non-existent suppression: ${token} (${txId})`);
      return;
    }

    this.state.activeTokens.delete(token);
    this.state.counter = Math.max(0, this.state.counter - 1);

    // Remove from transaction tracking
    const txTokens = this.state.activeTransactions.get(txId);
    if (txTokens) {
      const tokenIndex = txTokens.indexOf(token);
      if (tokenIndex !== -1) {
        txTokens.splice(tokenIndex, 1);
        if (txTokens.length === 0) {
          this.state.activeTransactions.delete(txId);
        }
      }
    }

    console.log(`🔓 End suppression: ${token} (${txId}) [counter: ${this.state.counter}]`);
  }

  /**
   * Execute function with leak-proof suppression
   * @param token - Suppression token
   * @param txId - Transaction ID
   * @param fn - Function to execute
   */
  withSuppression<T>(
    token: SuppressionToken, 
    txId: TransactionId, 
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    this.beginSuppression(token, txId);
    
    try {
      const result = fn();
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          this.endSuppression(token, txId);
          this.assertNoLeaks(txId);
        }) as Promise<T>;
      } else {
        this.endSuppression(token, txId);
        this.assertNoLeaks(txId);
        return result;
      }
    } catch (error) {
      this.endSuppression(token, txId);
      this.assertNoLeaks(txId);
      throw error;
    }
  }

  /**
   * Create a micro-window where suppression is temporarily lifted
   * @param token - Current suppression token
   * @param txId - Transaction ID
   * @param fn - Function to execute in the micro-window
   */
  withMicroWindow<T>(
    token: SuppressionToken,
    txId: TransactionId,
    fn: () => T
  ): T {
    console.log(`📤 Micro-window open: ${token} (${txId})`);
    
    // Temporarily end suppression
    const wasActive = this.state.activeTokens.has(token);
    if (wasActive) {
      this.endSuppression(token, txId);
    }

    try {
      const result = fn();
      console.log(`📥 Micro-window operation complete: ${token} (${txId})`);
      return result;
    } finally {
      // Immediately restore suppression
      if (wasActive) {
        this.beginSuppression(token, txId);
        console.log(`🔒 Micro-window closed: ${token} (${txId})`);
      }
    }
  }

  /**
   * Check if suppression is currently active
   */
  isSuppressed(): boolean {
    return this.state.counter > 0;
  }

  /**
   * Get current suppression state for debugging
   */
  getState() {
    return {
      counter: this.state.counter,
      activeTokens: Array.from(this.state.activeTokens),
      activeTransactions: Object.fromEntries(this.state.activeTransactions),
    };
  }

  /**
   * Emergency cleanup - clear all suppression state
   * @param reason - Reason for emergency cleanup
   */
  emergencyCleanup(reason: string): void {
    console.warn(`🚨 Emergency suppression cleanup: ${reason}`, this.getState());
    
    this.state.counter = 0;
    this.state.activeTokens.clear();
    this.state.activeTransactions.clear();
  }

  /**
   * Assert no suppression leaks after transaction
   * @param txId - Transaction ID to check
   */
  assertNoLeaks(txId: TransactionId): void {
    if (process.env.NODE_ENV !== 'production') {
      const txTokens = this.state.activeTransactions.get(txId);
      if (txTokens && txTokens.length > 0) {
        console.error(`💧 Suppression leak detected! Transaction ${txId} has unfinished tokens:`, txTokens);
        console.assert(false, `Suppression leak in transaction ${txId}`);
      }

      // Global leak check
      if (this.state.counter < 0) {
        console.error(`💧 Negative suppression counter: ${this.state.counter}`);
        console.assert(false, 'Negative suppression counter detected');
      }
    }
  }

  /**
   * Assert suppression counter is zero (no active suppressions)
   */
  assertCleanState(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.assert(
        this.state.counter === 0, 
        `Suppression counter not zero: ${this.state.counter}. Active tokens: ${Array.from(this.state.activeTokens)}`
      );
    }
  }
}

// Export singleton instance
export const suppressionManager = new BulletproofSuppression();

// Export convenience functions
export const generateTxId = () => suppressionManager.generateTransactionId();
export const beginSuppression = (token: SuppressionToken, txId: TransactionId) => 
  suppressionManager.beginSuppression(token, txId);
export const endSuppression = (token: SuppressionToken, txId: TransactionId) => 
  suppressionManager.endSuppression(token, txId);
export const withSuppression = <T>(token: SuppressionToken, txId: TransactionId, fn: () => T | Promise<T>) =>
  suppressionManager.withSuppression(token, txId, fn);
export const withMicroWindow = <T>(token: SuppressionToken, txId: TransactionId, fn: () => T) =>
  suppressionManager.withMicroWindow(token, txId, fn);
export const isSuppressed = () => suppressionManager.isSuppressed();
export const emergencyCleanupSuppression = (reason: string) => suppressionManager.emergencyCleanup(reason);
export const assertNoSuppressionLeaks = (txId: TransactionId) => suppressionManager.assertNoLeaks(txId);
export const assertCleanSuppressionState = () => suppressionManager.assertCleanState();