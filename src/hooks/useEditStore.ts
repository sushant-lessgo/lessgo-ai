/**
 * Reactive editor-store hook (THE hook — ~100+ call sites).
 *
 * Reads the token-scoped store instance from `EditProvider` context so
 * components need no tokenId. `useEditStore.getState()` gives static
 * (non-reactive) access to the last-mounted store. Must run inside an
 * `<EditProvider>` — throws otherwise.
 */

import { useStore } from 'zustand';
import { useEditStoreContext } from '@/components/EditProvider';
import type { EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';

// Global store reference for static access pattern
let globalStoreRef: EditStoreInstance | null = null;

/**
 * Reactive useEditStore hook.
 * This should be used within an EditProvider context.
 *
 * Two forms (TypeScript overloads):
 *   useEditStore()            -> whole EditStore (all ~103 existing callers)
 *   useEditStore(selector)    -> narrow slice T (pair with useShallow for objects)
 *
 * The overloads (not a lone optional-param signature) keep zero-arg callers
 * inferring EditStore, so their property access still type-checks.
 */
export function useEditStore(): EditStore;
export function useEditStore<T>(selector: (state: EditStore) => T): T;
export function useEditStore<T>(selector?: (state: EditStore) => T): EditStore | T {
  // Try to get from new context first
  const editContext = useEditStoreContext();

  // Guard first, so the useStore hook below runs unconditionally on every render
  // (react-hooks/rules-of-hooks). Within an EditProvider the store is always set;
  // absence is an invariant violation, hence the throw.
  if (!editContext.store) {
    throw new Error(
      'useEditStore must be used within an EditProvider context. ' +
      'Please wrap your component with <EditProvider tokenId={tokenId}>'
    );
  }

  // Update global reference for static access
  globalStoreRef = editContext.store;

  // Use useStore hook to get reactive state and actions. A missing selector maps
  // to an identity selector → the whole EditStore, matching the zero-arg overload.
  const resolvedSelector = (selector ?? ((state: EditStore) => state)) as (state: EditStore) => T;
  return useStore(editContext.store, resolvedSelector);
}

/**
 * Non-reactive access to the current token-scoped store INSTANCE from context.
 * Use in event handlers: `const store = useEditStoreApi(); ... store.getState()`.
 * Prefer this over the static `useEditStore.getState()` (which targets the
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
useEditStore.getState = () => {
  if (!globalStoreRef) {
    throw new Error(
      'Store not initialized. Make sure useEditStore has been called at least once within an EditProvider context.'
    );
  }
  return globalStoreRef.getState();
};

// Export types for consumer components
export type { EditStore, EditStoreInstance };
