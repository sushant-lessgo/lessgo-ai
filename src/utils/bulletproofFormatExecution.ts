// Bulletproof format execution system
// Integrates all safety mechanisms for reliable text formatting

// Runtime singleton guard to ensure single instance
const EXECUTOR_ID = Symbol.for('app/bulletproofFormatExecution');
const instanceId = Math.random().toString(36).substr(2, 9);
(globalThis as any)[EXECUTOR_ID] ??= { instanceId, createdAt: Date.now() };
export const singleton = (globalThis as any)[EXECUTOR_ID];

// Module version for debugging duplicate instances
export const MODULE_VERSION = '2.0.0-singleton';

import { 
  generateTxId, 
  withSuppression, 
  withMicroWindow, 
  type TransactionId 
} from './bulletproofSuppression';
import { 
  withReEntrancyProtection, 
  isFormatting 
} from './reEntrancyGuard';
import { 
  attachPointerListeners, 
  detachPointerListeners 
} from './strictModeSafeListeners';
import { 
  registerFormatHandler, 
  unregisterFormatHandler 
} from './formatRegistry';
import { 
  executeEmergencyCleanup 
} from './emergencyCleanup';
import { 
  setInteractionSource, 
  clearInteractionSource,
  logInteractionTimeline 
} from './interactionTracking';
import { pointerTracker } from './pointerTracking';

import { logger } from '@/lib/logger';
// Import store for formatting state management
let storeSetFormattingInProgress: ((isInProgress: boolean, opId?: string) => void) | null = null;

// Initialize store connection lazily to avoid circular imports
function getStoreAction() {
  if (!storeSetFormattingInProgress) {
    try {
      const { useEditStore } = require('@/hooks/useEditStore');
      storeSetFormattingInProgress = useEditStore.getState().setFormattingInProgress;
    } catch (error) {
      logger.error('Failed to connect to store:', error);
    }
  }
  return storeSetFormattingInProgress;
}

export interface FormatOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
}

export interface FormatExecutionConfig {
  formatName: string;
  component: string;
  stableRange: Range | null;
  editorElement: HTMLElement | null;
  formatAction: () => void | Promise<void>;
  // FIXED: Pass store action directly instead of requiring it
  setFormattingInProgress?: (isInProgress: boolean, opId?: string) => void;
  // Enhanced: Add rollback capability and transaction validation
  rollbackFormat?: () => void;
  anchorElement?: HTMLElement | null;
  currentTxId?: string | null;
}

class BulletproofFormatExecutor {
  private activeTransactions = new Set<TransactionId>();

  /**
   * Set formatting state in store with OpId for idempotency
   * This is the single owner of the formatting flag
   * @param isInProgress - Formatting state
   * @param txId - Transaction ID for idempotency
   * @param storeAction - Store action passed from config
   */
  private setFormattingState(
    isInProgress: boolean, 
    txId: TransactionId,
    storeAction?: (isInProgress: boolean, opId?: string) => void
  ): void {
    // FIXED: Use passed store action first, fallback to global
    const action = storeAction || getStoreAction();
    if (action) {
      logInteractionTimeline(`formatting-state:${isInProgress}`, { txId });
      action(isInProgress, txId);
    } else {
      logger.warn('⚠️ Store action not available for formatting state');
      // CRITICAL: Don't continue formatting without store connection
      throw new Error('Cannot proceed with formatting - store not available');
    }
  }

  /**
   * Execute two-phase format operation with all safety mechanisms
   * @param e - Pointer event from pointerDown
   * @param config - Format execution configuration
   */
  executeTwoPhaseFormat(
    e: React.PointerEvent, 
    config: FormatExecutionConfig
  ): void {
    // Phase 1: Guard and setup
    const txId = this.executePhaseOne(e, config);
    if (!txId) return; // Re-entrancy blocked or setup failed
  }

  /**
   * Phase 1: Guard, setup, and listener attachment
   * @param e - Pointer event
   * @param config - Format configuration
   * @returns Transaction ID if successful, null if blocked
   */
  private executePhaseOne(
    e: React.PointerEvent,
    config: FormatExecutionConfig
  ): TransactionId | null {
    // Primary button check
    if (e.button !== 0) {
      logger.debug(`🚫 Non-primary button ignored: ${e.button}`);
      return null;
    }

    // Prevent default browser behavior
    e.preventDefault();
    e.stopPropagation();

    // Use provided TX ID or generate new one - this ensures single TX ID flows through both phases
    const txId = config.currentTxId || generateTxId();
    
    logInteractionTimeline(`${config.formatName}:phase1:start`, { 
      txId, 
      pointerId: e.pointerId,
      component: config.component 
    });

    try {
      // Register format handler
      registerFormatHandler(`${config.formatName}-${txId}`, {
        name: config.formatName,
        type: 'pointer',
        component: config.component,
      });

      // Check for re-entrancy
      if (isFormatting()) {
        logInteractionTimeline(`${config.formatName}:blocked:reentry`, { txId });
        return null;
      }

      // Start pointer tracking
      pointerTracker.start(e.pointerId, e.clientX, e.clientY);

      // Set interaction source and begin suppression
      setInteractionSource('toolbar');

      return withSuppression('format', txId, () => {
        // Track active transaction
        this.activeTransactions.add(txId);

        // Attach window-level listeners for phase 2
        attachPointerListeners(
          txId,
          e.pointerId,
          (upEvent) => this.executePhaseTwo(txId, upEvent, config),
          (cancelEvent) => this.handlePointerCancel(txId, cancelEvent, config)
        );

        logInteractionTimeline(`${config.formatName}:phase1:complete`, { 
          txId,
          hasStableRange: !!config.stableRange,
          pointerId: e.pointerId 
        });

        return txId;
      }) as TransactionId;

    } catch (error) {
      logger.error(`❌ Phase 1 failed for ${config.formatName}:`, error);
      logInteractionTimeline(`${config.formatName}:phase1:error`, { 
        txId, 
        error: error instanceof Error ? error.message : String(error)
      });

      this.cleanupTransaction(txId, config, 'phase1-error');
      return null;
    }
  }

  /**
   * Phase 2: Execute format with restored selection
   * @param txId - Transaction ID
   * @param e - Pointer up event
   * @param config - Format configuration
   */
  private executePhaseTwo(
    txId: TransactionId,
    e: PointerEvent,
    config: FormatExecutionConfig
  ): void {
    const startTime = performance.now();
    
    // Structured logging - Phase 2 START
    logger.debug(`[${config.formatName.toUpperCase()}] tx=${txId} v=${MODULE_VERSION} phase2=START`);

    try {
      // Preflight checks in order with fast-fail
      const preflightResult = this.runPreflightChecks(txId, config);
      if (!preflightResult.success) {
        logger.debug(`[${config.formatName.toUpperCase()}] tx=${txId} phase2=ABORT reason=${preflightResult.reason}`);
        this.rollbackAndExit(txId, config, preflightResult.reason);
        return;
      }

      // Check movement threshold
      if (pointerTracker.movedTooFar(e.clientX, e.clientY)) {
        logger.debug(`[${config.formatName.toUpperCase()}] tx=${txId} phase2=ABORT reason=moved-too-far`);
        this.rollbackAndExit(txId, config, 'moved-too-far');
        return;
      }

      // FIXED: Pass store action from config to ensure it's available
      // Set formatting in progress flag with txId for idempotency
      // This is the single owner of this flag to prevent store cascade loops
      try {
        this.setFormattingState(true, txId, config.setFormattingInProgress);
      } catch (storeError) {
        // CRITICAL: If we can't set formatting state, abort immediately
        logger.error(`❌ Cannot access store - aborting format for ${config.formatName}:`, storeError);
        this.cleanupTransaction(txId, config, 'store-unavailable');
        return;
      }

      // Execute format operation with all protections
      withReEntrancyProtection(txId, config.formatName, async () => {
        await this.executeFormatSequence(txId, config);
      });

    } catch (error) {
      logger.error(`❌ Phase 2 failed for ${config.formatName}:`, error);
      logInteractionTimeline(`${config.formatName}:phase2:error`, { 
        txId, 
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      // Clear global formatting flag immediately
      try {
        const { setGlobalFormattingState } = require('@/utils/colorSystemGuard');
        setGlobalFormattingState(false);
      } catch (error) {
        logger.warn('Could not clear global formatting state:', error);
      }
      
      // Clear formatting state before cleanup
      try {
        this.setFormattingState(false, txId, config.setFormattingInProgress);
      } catch (storeError) {
        logger.warn('Could not clear formatting state:', storeError);
      }
      
      // Structured logging - Phase 2 COMPLETE
      const duration = Math.round(performance.now() - startTime);
      logger.debug(`[${config.formatName.toUpperCase()}] tx=${txId} phase2=COMMIT duration=${duration}ms`);
      
      this.cleanupTransaction(txId, config, 'phase2-complete');
    }
  }

  /**
   * Run preflight checks in correct order with fast-fail
   * @param txId - Transaction ID  
   * @param config - Format configuration
   * @returns Preflight result with success status and reason
   */
  private runPreflightChecks(txId: TransactionId, config: FormatExecutionConfig): {
    success: boolean;
    reason: string;
  } {
    // 1. Check transaction validity (prevent stale commits)
    if (config.currentTxId && config.currentTxId !== txId) {
      // Single-line log that prints both expected and received TX IDs for instant mismatch detection
      logger.debug(`[${config.formatName.toUpperCase()}] TX_MISMATCH expected=${config.currentTxId} received=${txId}`);
      return { success: false, reason: 'stale-transaction' };
    }

    // 2. Check anchor exists and is mounted
    if (config.anchorElement && !document.contains(config.anchorElement)) {
      return { success: false, reason: 'no-anchor' };
    }

    // 2.5. Check anchor count - don't start Phase 2 if anchorCount === 0
    // This prevents formatting when toolbar anchor is unstable
    try {
      const { useSelectionPriority } = require('@/hooks/useSelectionPriority');
      // We can't call the hook here, so let's check DOM for anchors instead
      const anchors = document.querySelectorAll('[data-toolbar-anchor]');
      if (anchors.length === 0) {
        logger.debug(`[${txId}] PREFLIGHT FAIL: anchorCount=0 - no stable toolbar anchors`);
        return { success: false, reason: 'no-toolbar-anchor' };
      }
    } catch (error) {
      // If we can't check anchors, allow the operation to continue
      logger.warn('Could not check anchor count:', error);
    }

    // 3. Check element is editable
    if (config.editorElement && !this.isElementEditable(config.editorElement)) {
      return { success: false, reason: 'not-editable' };
    }

    // 4. Check selection is valid
    if (config.stableRange && !this.isSelectionValid(config.stableRange)) {
      return { success: false, reason: 'bad-selection' };
    }

    // 5. Check store actions are present
    if (!config.setFormattingInProgress || typeof config.setFormattingInProgress !== 'function') {
      return { success: false, reason: 'no-store' };
    }

    return { success: true, reason: 'ok' };
  }

  /**
   * Rollback and exit with cleanup
   * @param txId - Transaction ID
   * @param config - Format configuration  
   * @param reason - Reason for rollback
   */
  private rollbackAndExit(txId: TransactionId, config: FormatExecutionConfig, reason: string): void {
    // Execute rollback if provided
    if (config.rollbackFormat) {
      try {
        config.rollbackFormat();
        logger.debug(`✅ Rollback executed for ${config.formatName}`);
      } catch (error) {
        logger.error(`❌ Rollback failed for ${config.formatName}:`, error);
      }
    }

    // Cleanup transaction
    this.cleanupTransaction(txId, config, reason);
  }

  /**
   * Check if element is editable
   * @param element - Element to check
   * @returns Boolean indicating if editable
   */
  private isElementEditable(element: HTMLElement): boolean {
    return element.isContentEditable || element.getAttribute('contenteditable') === 'true';
  }

  /**
   * Check if selection/range is valid
   * @param range - Range to validate
   * @returns Boolean indicating if valid
   */
  private isSelectionValid(range: Range): boolean {
    return document.contains(range.startContainer) && 
           document.contains(range.endContainer) &&
           range.startContainer.isConnected &&
           range.endContainer.isConnected;
  }

  /**
   * Execute the core format sequence with ultra-precise control
   * @param txId - Transaction ID
   * @param config - Format configuration
   */
  private async executeFormatSequence(
    txId: TransactionId,
    config: FormatExecutionConfig
  ): Promise<void> {
    logInteractionTimeline(`${config.formatName}:format:start`, { txId });

    return withSuppression('format-execution', txId, async () => {
      // Step 1: Restore selection in micro-window
      if (config.stableRange) {
        withMicroWindow('format-execution', txId, () => {
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(config.stableRange!);
            logInteractionTimeline(`${config.formatName}:selection:restored`, { txId });
          }
        });
      }

      // Step 2: Focus editor (while suppressed)
      if (config.editorElement) {
        config.editorElement.focus({ preventScroll: true });
        logInteractionTimeline(`${config.formatName}:editor:focused`, { txId });
      }

      // Step 3: Apply format (while suppressed)
      await config.formatAction();
      logInteractionTimeline(`${config.formatName}:format:applied`, { txId });
    });
  }

  /**
   * Handle pointer cancel events
   * @param txId - Transaction ID
   * @param e - Pointer cancel event
   * @param config - Format configuration
   */
  private handlePointerCancel(
    txId: TransactionId,
    e: PointerEvent,
    config: FormatExecutionConfig
  ): void {
    logInteractionTimeline(`${config.formatName}:cancelled:pointer`, { 
      txId, 
      pointerId: e.pointerId 
    });

    this.cleanupTransaction(txId, config, 'pointer-cancel');
  }

  /**
   * Clean up transaction state and resources
   * @param txId - Transaction ID
   * @param config - Format configuration
   * @param reason - Reason for cleanup
   */
  private cleanupTransaction(
    txId: TransactionId,
    config: FormatExecutionConfig,
    reason: string
  ): void {
    logInteractionTimeline(`${config.formatName}:cleanup:start`, { txId, reason });

    try {
      // Remove from active transactions
      this.activeTransactions.delete(txId);

      // Unregister format handler
      unregisterFormatHandler(`${config.formatName}-${txId}`);

      // Detach listeners
      detachPointerListeners(txId);

      // Clear interaction source
      clearInteractionSource();

      // Stop pointer tracking
      pointerTracker.cleanup();

      logInteractionTimeline(`${config.formatName}:cleanup:complete`, { txId });

    } catch (error) {
      logger.error(`❌ Cleanup failed for ${config.formatName} (${txId}):`, error);
      
      // Emergency cleanup as last resort
      executeEmergencyCleanup('error-recovery', {
        txId,
        formatName: config.formatName,
        cleanupError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get active transaction count
   */
  getActiveTransactionCount(): number {
    return this.activeTransactions.size;
  }

  /**
   * Get active transaction IDs
   */
  getActiveTransactions(): TransactionId[] {
    return Array.from(this.activeTransactions);
  }

  /**
   * Emergency cleanup all active transactions
   * @param reason - Reason for emergency cleanup
   */
  emergencyCleanupAll(reason: string): void {
    logger.warn(`🚨 Emergency cleanup of ${this.activeTransactions.size} active transactions: ${reason}`);

    for (const txId of this.activeTransactions) {
      try {
        this.cleanupTransaction(txId, {
          formatName: 'unknown',
          component: 'unknown',
          stableRange: null,
          editorElement: null,
          formatAction: () => {},
        }, reason);
      } catch (error) {
        logger.error(`Failed to cleanup transaction ${txId}:`, error);
      }
    }

    this.activeTransactions.clear();
  }

  /**
   * Assert clean state (no active transactions)
   */
  assertCleanState(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.assert(
        this.activeTransactions.size === 0,
        `Active transactions remaining: ${this.getActiveTransactions()}`
      );
    }
  }
}

// Export singleton instance
export const bulletproofFormatExecutor = new BulletproofFormatExecutor();

// Export convenience functions
export const executeTwoPhaseFormat = (
  e: React.PointerEvent,
  config: FormatExecutionConfig
) => bulletproofFormatExecutor.executeTwoPhaseFormat(e, config);

export const getActiveFormatTransactions = () => bulletproofFormatExecutor.getActiveTransactions();

export const emergencyCleanupAllTransactions = (reason: string) =>
  bulletproofFormatExecutor.emergencyCleanupAll(reason);

export const assertCleanFormatState = () => bulletproofFormatExecutor.assertCleanState();