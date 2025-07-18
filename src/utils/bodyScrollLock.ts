// utils/bodyScrollLock.ts - Safe body scroll lock management
let scrollLockCount = 0;
let originalBodyOverflow: string | null = null;

export const bodyScrollLock = {
  /**
   * Lock body scroll - safe to call multiple times
   */
  lock(): void {
    if (scrollLockCount === 0) {
      // Store original overflow value
      originalBodyOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount++;
  },

  /**
   * Unlock body scroll - only unlocks when all locks are released
   */
  unlock(): void {
    if (scrollLockCount > 0) {
      scrollLockCount--;
    }
    
    if (scrollLockCount === 0) {
      // Restore original overflow value
      document.body.style.overflow = originalBodyOverflow || '';
      originalBodyOverflow = null;
    }
  },

  /**
   * Force unlock all body scroll locks (emergency reset)
   */
  forceUnlock(): void {
    scrollLockCount = 0;
    document.body.style.overflow = originalBodyOverflow || '';
    originalBodyOverflow = null;
  },

  /**
   * Get current lock count (for debugging)
   */
  getLockCount(): number {
    return scrollLockCount;
  }
};

// Add global emergency reset function
if (typeof window !== 'undefined') {
  (window as any).__resetBodyScrollLock = bodyScrollLock.forceUnlock;
}