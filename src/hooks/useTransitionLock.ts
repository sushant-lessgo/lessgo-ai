// src/hooks/useTransitionLock.ts - Step 2: Transition Locks System
// Prevents toolbar flickering during selection state transitions

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ToolbarType } from '@/utils/selectionPriority';

import { logger } from '@/lib/logger';
interface TransitionState {
  isLocked: boolean;
  lockReason: string;
  lockedToolbar: ToolbarType;
  lockExpiry: number;
}

interface TransitionLockConfig {
  // How long to lock transitions (ms)
  lockDuration: number;
  // Minimum time between state changes (debounce)
  debounceTime: number;
  // Maximum lock time (safety)
  maxLockTime: number;
  // Enable debug logging
  debug: boolean;
}

const DEFAULT_CONFIG: TransitionLockConfig = {
  lockDuration: 300,    // 300ms lock during transitions
  debounceTime: 100,    // 100ms debounce between changes
  maxLockTime: 2000,    // 2s maximum lock (safety)
  debug: true,
};

/**
 * Hook to manage toolbar transition locks
 * Prevents rapid toolbar switching that causes flicker
 */
export function useTransitionLock(config: Partial<TransitionLockConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isLocked: false,
    lockReason: '',
    lockedToolbar: null,
    lockExpiry: 0,
  });
  
  // Timers for managing locks
  const lockTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastStateChangeRef = useRef<number>(0);
  
  // Clear any existing timers
  const clearTimers = useCallback(() => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = undefined;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = undefined;
    }
  }, []);
  
  // Unlock transition
  const unlock = useCallback((reason: string = 'manual') => {
    if (finalConfig.debug) {
      logger.debug('🔓 Transition unlocked:', reason);
    }
    
    clearTimers();
    setTransitionState({
      isLocked: false,
      lockReason: '',
      lockedToolbar: null,
      lockExpiry: 0,
    });
  }, [finalConfig.debug, clearTimers]);
  
  // Lock transition to specific toolbar
  const lockTransition = useCallback((
    toolbarType: ToolbarType, 
    reason: string,
    duration: number = finalConfig.lockDuration
  ) => {
    const now = Date.now();
    const lockUntil = now + Math.min(duration, finalConfig.maxLockTime);
    
    if (finalConfig.debug) {
      // console.log('🔒 Transition locked:', {
      //   toolbarType,
      //   reason,
      //   duration,
      //   lockUntil: new Date(lockUntil).toISOString(),
      // });
    }
    
    clearTimers();
    
    setTransitionState({
      isLocked: true,
      lockReason: reason,
      lockedToolbar: toolbarType,
      lockExpiry: lockUntil,
    });
    
    // Auto-unlock after duration
    lockTimeoutRef.current = setTimeout(() => {
      unlock('timeout');
    }, duration);
    
  }, [finalConfig.lockDuration, finalConfig.maxLockTime, finalConfig.debug, unlock]);
  
  // Check if a toolbar change should be allowed
  const shouldAllowTransition = useCallback((
    fromToolbar: ToolbarType,
    toToolbar: ToolbarType,
    reason: string = 'state change'
  ): boolean => {
    const now = Date.now();
    
    // Check if currently locked
    if (transitionState.isLocked && now < transitionState.lockExpiry) {
      // Allow if transitioning to the same toolbar that's locked
      if (toToolbar === transitionState.lockedToolbar) {
        if (finalConfig.debug) {
          logger.debug('✅ Transition allowed (same as locked):', { fromToolbar, toToolbar, reason });
        }
        return true;
      }
      
      // Block other transitions during lock
      if (finalConfig.debug) {
        logger.debug('❌ Transition blocked (locked):', { 
          fromToolbar, 
          toToolbar, 
          reason,
          lockReason: transitionState.lockReason,
          lockedToolbar: transitionState.lockedToolbar,
          timeRemaining: transitionState.lockExpiry - now
        });
      }
      return false;
    }
    
    // Check debounce - prevent rapid changes
    const timeSinceLastChange = now - lastStateChangeRef.current;
    if (timeSinceLastChange < finalConfig.debounceTime) {
      if (finalConfig.debug) {
        logger.debug('❌ Transition blocked (debounce):', { 
          fromToolbar, 
          toToolbar, 
          timeSinceLastChange,
          debounceTime: finalConfig.debounceTime 
        });
      }
      return false;
    }
    
    if (finalConfig.debug) {
      logger.debug('✅ Transition allowed:', { fromToolbar, toToolbar, reason });
    }
    
    lastStateChangeRef.current = now;
    return true;
    
  }, [transitionState, finalConfig.debounceTime, finalConfig.debug]);
  
  // Lock during text editing start/stop
  const lockForTextEditing = useCallback((isStarting: boolean, elementInfo?: { sectionId: string; elementKey: string }) => {
    if (isStarting) {
      lockTransition('text', `text editing started: ${elementInfo?.elementKey}`, finalConfig.lockDuration);
    } else {
      lockTransition(null, `text editing stopped: ${elementInfo?.elementKey}`, finalConfig.lockDuration / 2);
    }
  }, [lockTransition, finalConfig.lockDuration]);
  
  // Lock during element selection changes
  const lockForElementChange = useCallback((elementInfo: { sectionId: string; elementKey: string }, toolbarType: ToolbarType = 'element') => {
    lockTransition(toolbarType, `element selected: ${elementInfo.elementKey}`, finalConfig.lockDuration);
  }, [lockTransition, finalConfig.lockDuration]);
  
  // Lock during section selection changes
  const lockForSectionChange = useCallback((sectionId: string) => {
    lockTransition('section', `section selected: ${sectionId}`, finalConfig.lockDuration);
  }, [lockTransition, finalConfig.lockDuration]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);
  
  // Auto-unlock expired locks
  useEffect(() => {
    const now = Date.now();
    if (transitionState.isLocked && now >= transitionState.lockExpiry) {
      unlock('expired');
    }
  }, [transitionState.isLocked, transitionState.lockExpiry, unlock]);
  
  return {
    // State
    isLocked: transitionState.isLocked,
    lockReason: transitionState.lockReason,
    lockedToolbar: transitionState.lockedToolbar,
    timeRemaining: Math.max(0, transitionState.lockExpiry - Date.now()),
    
    // Control functions
    lockTransition,
    unlock,
    shouldAllowTransition,
    
    // Convenience functions for common scenarios
    lockForTextEditing,
    lockForElementChange,
    lockForSectionChange,
    
    // State checks
    isTextLocked: transitionState.lockedToolbar === 'text',
    isElementLocked: transitionState.lockedToolbar === 'element',
    isSectionLocked: transitionState.lockedToolbar === 'section',
  };
}

/**
 * Hook for components that need to respect transition locks
 * Returns whether the component should render based on lock state
 */
export function useTransitionAwareVisibility(
  toolbarType: ToolbarType,
  naturalVisibility: boolean,
  transitionLock: ReturnType<typeof useTransitionLock>
): { shouldRender: boolean; reason: string } {
  const { isLocked, lockedToolbar, lockReason } = transitionLock;
  
  // If not locked, use natural visibility
  if (!isLocked) {
    return {
      shouldRender: naturalVisibility,
      reason: naturalVisibility ? 'naturally visible' : 'naturally hidden'
    };
  }
  
  // If locked, only show the locked toolbar
  const shouldRender = toolbarType === lockedToolbar;
  
  return {
    shouldRender,
    reason: shouldRender 
      ? `locked visible (${lockReason})` 
      : `locked hidden (${lockedToolbar} is locked)`
  };
}

/**
 * Development helper to show lock status
 */
export function useLockStatusDebugger(transitionLock: ReturnType<typeof useTransitionLock>) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const { isLocked, lockReason, lockedToolbar, timeRemaining } = transitionLock;
      
      if (isLocked && timeRemaining > 0) {
        logger.debug(`🔒 Lock Status: ${lockReason} (${lockedToolbar}) - ${timeRemaining}ms remaining`);
      }
    }
  }, [transitionLock.isLocked, transitionLock.lockReason, transitionLock.lockedToolbar]);
}