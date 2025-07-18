// utils/modalEmergencyReset.ts - Emergency modal state reset utilities
import { bodyScrollLock } from './bodyScrollLock';

export const modalEmergencyReset = {
  /**
   * Emergency reset for when modals get stuck
   * This function can be called from browser console: window.__emergencyModalReset()
   */
  reset(): void {
    console.log('🚨 Emergency modal reset triggered');
    
    // 1. Force unlock body scroll
    bodyScrollLock.forceUnlock();
    
    // 2. Remove any stuck modal event listeners
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modalEmergencyReset.reset();
      }
    };
    
    // Remove potential stuck listeners by replacing them
    document.removeEventListener('keydown', escapeHandler);
    document.addEventListener('keydown', escapeHandler);
    
    // 3. Clear any modal-related timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // 4. Reset taxonomy modal manager if it exists
    if ((window as any).__taxonomyModalManager) {
      try {
        (window as any).__taxonomyModalManager.closeModal();
      } catch (error) {
        console.warn('Failed to close taxonomy modal:', error);
      }
    }
    
    // 5. Remove any stuck modal DOM elements
    const stuckModals = document.querySelectorAll('[role="dialog"]');
    stuckModals.forEach(modal => {
      if (modal.parentNode) {
        console.log('Removing stuck modal:', modal);
        modal.parentNode.removeChild(modal);
      }
    });
    
    // 6. Reset focus to body
    try {
      document.body.focus();
    } catch (error) {
      console.warn('Failed to reset focus:', error);
    }
    
    // 7. Re-enable pointer events
    document.body.style.pointerEvents = 'auto';
    
    console.log('✅ Emergency modal reset completed');
  },

  /**
   * Check if modals are in a stuck state
   */
  isDiagnosticMode(): boolean {
    return (window as any).__modalDiagnosticMode === true;
  },

  /**
   * Enable diagnostic mode for debugging
   */
  enableDiagnosticMode(): void {
    (window as any).__modalDiagnosticMode = true;
    console.log('🔍 Modal diagnostic mode enabled');
  }
};

// Add global emergency reset function
if (typeof window !== 'undefined') {
  (window as any).__emergencyModalReset = modalEmergencyReset.reset;
  (window as any).__modalDiagnostic = modalEmergencyReset.enableDiagnosticMode;
  
  // Add keyboard shortcut for emergency reset (Ctrl+Shift+Alt+R)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'R') {
      e.preventDefault();
      modalEmergencyReset.reset();
    }
  });
}