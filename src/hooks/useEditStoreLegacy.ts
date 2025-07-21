/**
 * Legacy compatibility layer for useEditStore
 * Provides backward compatibility while transitioning to token-scoped stores
 */

import { useContext, createContext } from 'react';
import { useEditStoreContext } from '@/components/EditProvider';
import type { EditStoreInstance } from '@/stores/editStore';

// Legacy context for providing store without token parameter
const LegacyEditStoreContext = createContext<EditStoreInstance | null>(null);

// Global store reference for static access pattern
let globalStoreRef: EditStoreInstance | null = null;

/**
 * Legacy useEditStore hook - maintains backward compatibility
 * This should be used within an EditProvider context
 */
export function useEditStoreLegacy() {
  // Try to get from new context first
  const editContext = useEditStoreContext();
  
  if (editContext.store) {
    // Return the store state and actions in the old format
    const store = editContext.store;
    const state = store.getState();
    
    // Update global reference for static access
    globalStoreRef = store;
    
    // Return all store properties and methods as before
    return state;
  }
  
  // Fallback error
  throw new Error(
    'useEditStore must be used within an EditProvider context. ' +
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