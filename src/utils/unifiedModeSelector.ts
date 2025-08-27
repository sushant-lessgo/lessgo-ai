// Fix 4: Unified mode selector - single source of truth for editor mode
// Prevents MainContent vs FloatingToolbars mode discrepancies

import type { EditStore } from '@/types/store';

import { logger } from '@/lib/logger';
export type EditorMode = 'preview' | 'edit' | 'loading';

/**
 * Single mode selector function used by all components
 * This ensures MainContent and FloatingToolbars always see the same mode
 */
export function selectEditorMode(state: EditStore | undefined | null): EditorMode {
  // Guard against undefined/null state
  if (!state || typeof state !== 'object') {
    logger.warn('⚠️ [MODE-SELECTOR] Invalid state passed to selectEditorMode:', state);
    return 'loading';
  }
  
  // Guard against missing mode property
  if (!('mode' in state) || typeof state.mode !== 'string') {
    logger.warn('⚠️ [MODE-SELECTOR] State missing mode property:', { state, hasMode: 'mode' in state });
    return 'loading';
  }
  
  // Primary mode determination logic
  if (state.mode === 'edit') {
    return 'edit';
  } else if (state.mode === 'preview') {
    return 'preview';
  } else {
    // Fallback for loading/initialization states
    return 'loading';
  }
}

/**
 * Hook version for components that need reactive mode updates
 */
export function useUnifiedMode(storeSelector: () => EditStore | undefined | null): EditorMode {
  const state = storeSelector();
  return selectEditorMode(state);
}

/**
 * Debug function to log mode from different sources and detect mismatches
 */
export function debugModeConsistency(
  modeFromMainContent: EditorMode,
  modeFromFloatingToolbars: EditorMode,
  componentName: string
): void {
  if (process.env.NODE_ENV === 'development') {
    const mismatch = modeFromMainContent !== modeFromFloatingToolbars;
    
    if (mismatch) {
      logger.warn(`⚠️ [MODE-MISMATCH] Detected mode inconsistency in ${componentName}:`, {
        modeFromMainContent,
        modeFromFloatingToolbars,
        component: componentName,
        impact: 'Components may behave differently',
        solution: 'Use selectEditorMode() consistently'
      });
    } else if (Math.random() < 0.1) { // 10% sampling to avoid spam
      logger.debug(`✅ [MODE-UNIFIED] Mode consistent across components:`, {
        mode: modeFromMainContent,
        component: componentName,
        verified: true
      });
    }
  }
}

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__unifiedModeSelector = {
    selectEditorMode,
    debugModeConsistency
  };
  
  logger.debug('🔧 Unified Mode Selector debug utilities available at window.__unifiedModeSelector');
}