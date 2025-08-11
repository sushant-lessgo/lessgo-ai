// Format registry system to ensure single execution path and prevent handler duplication
// Tracks active format handlers and validates system state

interface FormatHandler {
  name: string;
  type: 'pointer' | 'keyboard' | 'legacy';
  registeredAt: number;
  component: string;
}

class FormatRegistry {
  private handlers: Map<string, FormatHandler> = new Map();
  private expectedHandlers = {
    pointer: 1, // Only one pointer-based handler per format type
    keyboard: 1, // Only one keyboard handler 
    legacy: 0,  // Should be zero - all legacy handlers removed
  };

  /**
   * Register a format handler
   * @param id - Unique handler ID
   * @param handler - Handler details
   */
  register(id: string, handler: Omit<FormatHandler, 'registeredAt'>): void {
    if (this.handlers.has(id)) {
      console.warn(`🔄 Handler already registered: ${id}. Replacing...`);
    }

    this.handlers.set(id, {
      ...handler,
      registeredAt: Date.now(),
    });

    console.log(`📝 Registered format handler: ${id} (${handler.type}) from ${handler.component}`);
    this.validateHandlerCounts();
  }

  /**
   * Unregister a format handler
   * @param id - Handler ID to remove
   */
  unregister(id: string): void {
    if (this.handlers.delete(id)) {
      console.log(`🗑️ Unregistered format handler: ${id}`);
    } else {
      console.warn(`⚠️ Attempted to unregister non-existent handler: ${id}`);
    }
    this.validateHandlerCounts();
  }

  /**
   * Get count of handlers by type
   * @param type - Handler type to count
   */
  getHandlerCount(type: FormatHandler['type']): number {
    return Array.from(this.handlers.values())
      .filter(handler => handler.type === type).length;
  }

  /**
   * Get all active handlers
   */
  getActiveHandlers(): FormatHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Validate handler counts match expectations
   */
  validateHandlerCounts(): void {
    const counts = {
      pointer: this.getHandlerCount('pointer'),
      keyboard: this.getHandlerCount('keyboard'),
      legacy: this.getHandlerCount('legacy'),
    };

    console.log(`📊 Handler counts:`, counts);

    if (process.env.NODE_ENV !== 'production') {
      // Check for legacy handlers (should be zero)
      if (counts.legacy > this.expectedHandlers.legacy) {
        console.error(`🚫 Legacy handlers detected: ${counts.legacy}. Should be ${this.expectedHandlers.legacy}`);
        console.assert(false, `Legacy format handlers still active`);
      }

      // Check for excessive pointer handlers  
      if (counts.pointer > this.expectedHandlers.pointer) {
        console.warn(`⚠️ Multiple pointer handlers: ${counts.pointer}. Expected: ${this.expectedHandlers.pointer}`);
        this.logDuplicateHandlers('pointer');
      }

      // Check for excessive keyboard handlers
      if (counts.keyboard > this.expectedHandlers.keyboard) {
        console.warn(`⚠️ Multiple keyboard handlers: ${counts.keyboard}. Expected: ${this.expectedHandlers.keyboard}`);
        this.logDuplicateHandlers('keyboard');
      }
    }
  }

  /**
   * Log duplicate handlers for debugging
   * @param type - Handler type to check for duplicates
   */
  private logDuplicateHandlers(type: FormatHandler['type']): void {
    const handlersOfType = Array.from(this.handlers.entries())
      .filter(([, handler]) => handler.type === type);

    console.table(handlersOfType.map(([id, handler]) => ({
      id,
      name: handler.name,
      component: handler.component,
      registeredAt: new Date(handler.registeredAt).toISOString(),
    })));
  }

  /**
   * Assert system is in expected state
   */
  assertExpectedState(): void {
    if (process.env.NODE_ENV !== 'production') {
      const counts = {
        pointer: this.getHandlerCount('pointer'),
        keyboard: this.getHandlerCount('keyboard'),
        legacy: this.getHandlerCount('legacy'),
      };

      // Critical assertion: no legacy handlers
      console.assert(
        counts.legacy === this.expectedHandlers.legacy,
        `Legacy handlers found: ${counts.legacy}. All legacy handlers should be removed.`
      );

      // Log state for visibility
      console.log(`✅ Format registry state validated:`, {
        totalHandlers: this.handlers.size,
        ...counts,
      });
    }
  }

  /**
   * Emergency cleanup - clear all handlers
   * @param reason - Reason for cleanup
   */
  emergencyCleanup(reason: string): void {
    console.warn(`🚨 Emergency format registry cleanup: ${reason}`, {
      handlerCount: this.handlers.size,
      handlers: Array.from(this.handlers.keys()),
    });

    this.handlers.clear();
  }

  /**
   * Get registry state for debugging
   */
  getState() {
    const handlers = Array.from(this.handlers.entries()).map(([id, handler]) => ({
      id,
      ...handler,
      registeredAt: new Date(handler.registeredAt).toISOString(),
    }));

    return {
      totalHandlers: this.handlers.size,
      handlersByType: {
        pointer: this.getHandlerCount('pointer'),
        keyboard: this.getHandlerCount('keyboard'),
        legacy: this.getHandlerCount('legacy'),
      },
      expectedCounts: this.expectedHandlers,
      handlers,
    };
  }
}

// Export singleton instance
export const formatRegistry = new FormatRegistry();

// Export convenience functions
export const registerFormatHandler = (id: string, handler: Omit<FormatHandler, 'registeredAt'>) =>
  formatRegistry.register(id, handler);
export const unregisterFormatHandler = (id: string) => formatRegistry.unregister(id);
export const getFormatHandlerCount = (type: FormatHandler['type']) => formatRegistry.getHandlerCount(type);
export const validateFormatHandlers = () => formatRegistry.validateHandlerCounts();
export const assertExpectedFormatState = () => formatRegistry.assertExpectedState();
export const emergencyCleanupRegistry = (reason: string) => formatRegistry.emergencyCleanup(reason);
export const getFormatRegistryState = () => formatRegistry.getState();