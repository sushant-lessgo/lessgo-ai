/**
 * Legacy compatibility layer for useEditStore.
 *
 * Despite the "Legacy" name this is the ACTIVE editor-store hook (~100+ call
 * sites): it reads the token-scoped store instance from `EditProvider` context
 * so components need no tokenId. `useEditStoreLegacy.getState()` gives static
 * (non-reactive) access to the last-mounted store. Must run inside an
 * `<EditProvider>` — throws otherwise.
 */

import { useContext, createContext } from 'react';
import { useStore } from 'zustand';
import { useEditStoreContext } from '@/components/EditProvider';
import type { EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';

// Legacy context for providing store without token parameter
const LegacyEditStoreContext = createContext<EditStoreInstance | null>(null);

// Global store reference for static access pattern
let globalStoreRef: EditStoreInstance | null = null;

/**
 * Legacy useEditStore hook - maintains backward compatibility
 * This should be used within an EditProvider context.
 *
 * Two forms (TypeScript overloads):
 *   useEditStoreLegacy()            -> whole EditStore (all ~103 existing callers)
 *   useEditStoreLegacy(selector)    -> narrow slice T (pair with useShallow for objects)
 *
 * The overloads (not a lone optional-param signature) keep zero-arg callers
 * inferring EditStore, so their property access still type-checks.
 */
export function useEditStoreLegacy(): EditStore;
export function useEditStoreLegacy<T>(selector: (state: EditStore) => T): T;
export function useEditStoreLegacy<T>(selector?: (state: EditStore) => T): EditStore | T {
  // Try to get from new context first
  const editContext = useEditStoreContext();

  if (editContext.store) {
    // Update global reference for static access
    globalStoreRef = editContext.store;

    // Use useStore hook to get reactive state and actions
    return selector
      ? useStore(editContext.store, selector)
      : useStore(editContext.store);
  }

  // Fallback error
  throw new Error(
    'useEditStore must be used within an EditProvider context. ' +
    'Please wrap your component with <EditProvider tokenId={tokenId}>'
  );
}

/**
 * Non-reactive access to the current token-scoped store INSTANCE from context.
 * Use in event handlers: `const store = useEditStoreApi(); ... store.getState()`.
 * Prefer this over the static `useEditStoreLegacy.getState()` (which targets the
 * global last-mounted store) so handlers read the correct token-scoped instance.
 */
export function useEditStoreApi(): EditStoreInstance {
  const editContext = useEditStoreContext();
  if (editContext.store) {
    globalStoreRef = editContext.store;
    return editContext.store;
  }
  throw new Error(
    'useEditStoreApi must be used within an EditProvider context. ' +
    'Please wrap your component with <EditProvider tokenId={tokenId}>'
  );
}

// Add getState method to the hook function for static access pattern
useEditStoreLegacy.getState = () => {
  if (!globalStoreRef) {
    throw new Error(
      'Store not initialized. Make sure useEditStore has been called at least once within an EditProvider context.'
    );
  }
  return globalStoreRef.getState();
};

/**
 * For components that need to gradually migrate to the new API
 */
// Export as default to replace the old useEditStore import
export { useEditStoreLegacy as useEditStore };
export default useEditStoreLegacy;