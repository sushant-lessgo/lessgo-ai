/**
 * Selection Change Guard System
 * 
 * Prevents selection change events from firing during formatting operations
 * Implements Fix #1 from selection.md: Guard SelectionChange Events
 */

// Global flag to suppress selection change events
let suppressSelectionChange = false;
let suppressTimeout: NodeJS.Timeout | null = null;

/**
 * Temporarily suppress selection change events during formatting
 * @param duration - How long to suppress (default: 50ms)
 */
export function suppressSelectionEvents(duration: number = 50): void {
  suppressSelectionChange = true;
  
  // Clear any existing timeout
  if (suppressTimeout) {
    clearTimeout(suppressTimeout);
  }
  
  // Auto-restore after duration
  suppressTimeout = setTimeout(() => {
    suppressSelectionChange = false;
    suppressTimeout = null;
  }, duration);
  
}

/**
 * Check if selection change events should be suppressed
 */
export function isSelectionSuppressed(): boolean {
  return suppressSelectionChange;
}

/**
 * Force restore selection change events (emergency escape)
 */
export function restoreSelectionEvents(): void {
  suppressSelectionChange = false;
  if (suppressTimeout) {
    clearTimeout(suppressTimeout);
    suppressTimeout = null;
  }
}

/**
 * Wrap a formatting function with selection event suppression
 * @param formatFn - The formatting function to wrap
 * @param duration - How long to suppress events after formatting
 */
export function withSelectionGuard<T extends (...args: any[]) => any>(
  formatFn: T,
  duration: number = 50
): T {
  return ((...args: Parameters<T>) => {
    // Suppress selection events
    suppressSelectionEvents(duration);
    
    try {
      // Execute the formatting function
      const result = formatFn(...args);
      
      // If the function returns a promise, handle it
      if (result && typeof result.then === 'function') {
        return result.catch((error: Error) => {
          console.error('🛡️ Error in guarded formatting function:', error);
          restoreSelectionEvents();
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      console.error('🛡️ Error in guarded formatting function:', error);
      restoreSelectionEvents();
      throw error;
    }
  }) as T;
}

/**
 * Create a guarded selection change handler
 * @param handler - The original selection change handler
 */
export function createGuardedSelectionHandler(
  handler: (event: Event) => void
): (event: Event) => void {
  return (event: Event) => {
    if (suppressSelectionChange) {
      return;
    }
    
    handler(event);
  };
}

/**
 * Hook for managing selection guards in React components
 */
export function useSelectionGuard() {
  const withGuard = <T extends (...args: any[]) => any>(
    formatFn: T,
    duration?: number
  ): T => withSelectionGuard(formatFn, duration);

  const createGuardedHandler = (handler: (event: Event) => void) =>
    createGuardedSelectionHandler(handler);

  return {
    suppressSelectionEvents,
    isSelectionSuppressed,
    restoreSelectionEvents,
    withGuard,
    createGuardedHandler,
  };
}

/**
 * Cleanup function for component unmounting
 */
export function cleanupSelectionGuard(): void {
  restoreSelectionEvents();
}

/**
 * Initialize selection guard system (call once at app start)
 */
export function initializeSelectionGuard(): void {
  // Add global error handler to restore selection events if something goes wrong
  if (typeof window !== 'undefined') {
    window.addEventListener('error', () => {
      console.warn('🛡️ Global error detected, restoring selection events');
      restoreSelectionEvents();
    });
    
    window.addEventListener('unhandledrejection', () => {
      console.warn('🛡️ Unhandled rejection detected, restoring selection events');
      restoreSelectionEvents();
    });
  }
}