/**
 * Global useEditStore compatibility layer
 * This file provides backward compatibility for all existing components
 * that use useEditStore() without tokenId parameter
 */

// Re-export the legacy hook as the default useEditStore for global compatibility
export { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';

// Also export the token-aware version for new components
export { useEditStore as useEditStoreWithToken } from './useEditStore';

// Export all other utilities
export type { EditStore } from '@/types/store';
export type { EditStoreInstance } from '@/stores/editStore';