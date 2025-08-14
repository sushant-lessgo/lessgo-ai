/**
 * Store Manager - Singleton pattern for managing multiple EditStore instances
 * Handles creation, caching, and cleanup of token-scoped stores
 */

import { type EditStore } from '@/types/store';
import { switchToken, cleanupOldProjects, trackProjectAccess, isStorageAvailable } from '@/utils/storage';
import { storageManager } from '@/utils/storageManager';
import { createEditStore, type EditStoreInstance } from './editStore';

// Store instance cache
interface StoreCache {
  [tokenId: string]: {
    store: EditStoreInstance;
    lastAccessed: number;
    isInitialized: boolean;
  };
}

class EditStoreManager {
  private static instance: EditStoreManager;
  private storeCache: StoreCache = {};
  private currentTokenId: string | null = null;
  private maxCachedStores = 3; // Keep only 3 stores in memory
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start memory cleanup interval (every 5 minutes)
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupMemoryCache();
        
        // Trigger storage cleanup check
        storageManager.performMaintenanceCleanup().catch(error => {
          console.warn('Storage cleanup failed:', error);
        });
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Get singleton instance of store manager
   */
  public static getInstance(): EditStoreManager {
    if (!EditStoreManager.instance) {
      EditStoreManager.instance = new EditStoreManager();
    }
    return EditStoreManager.instance;
  }

  /**
   * Get or create store for a specific token
   */
  public getEditStore(tokenId: string): EditStoreInstance {
    if (!tokenId || typeof tokenId !== 'string') {
      throw new Error('Invalid tokenId provided to getEditStore');
    }

    // Update current token tracking
    const previousTokenId = this.currentTokenId;
    if (this.currentTokenId !== tokenId) {
      // console.log(`📝 Store Manager: Switching from ${previousTokenId || 'none'} to ${tokenId}`);
      this.currentTokenId = tokenId;
      
      // Handle storage cleanup and tracking
      if (isStorageAvailable()) {
        switchToken(tokenId, previousTokenId || undefined);
        
        // Trigger maintenance cleanup on token switch
        storageManager.performMaintenanceCleanup().catch(error => {
          console.warn('Maintenance cleanup failed on token switch:', error);
        });
      }
    }

    // Check if store already exists in cache
    if (this.storeCache[tokenId]) {
      const cacheEntry = this.storeCache[tokenId];
      cacheEntry.lastAccessed = Date.now();
      
      // Track access for storage cleanup
      if (isStorageAvailable()) {
        trackProjectAccess(tokenId);
      }
      
      // console.log(`♻️ Store Manager: Using cached store for token ${tokenId}`);
      return cacheEntry.store;
    }

    // Create new store instance
    // console.log(`🏗️ Store Manager: Creating new store for token ${tokenId}`);
    
    try {
      const store = createEditStore(tokenId);
      
      // Cache the store
      this.storeCache[tokenId] = {
        store,
        lastAccessed: Date.now(),
        isInitialized: false, // Will be set to true after hydration
      };

      // Clean up memory cache if needed
      this.cleanupMemoryCache();

      // Track access for storage cleanup
      if (isStorageAvailable()) {
        trackProjectAccess(tokenId);
      }

      return store;

    } catch (error) {
      console.error(`❌ Store Manager: Failed to create store for token ${tokenId}:`, error);
      throw new Error(`Failed to create store for token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove store from memory cache (but keep in localStorage)
   */
  public removeFromCache(tokenId: string): void {
    if (this.storeCache[tokenId]) {
      console.log(`🗑️ Store Manager: Removing ${tokenId} from memory cache`);
      delete this.storeCache[tokenId];
    }

    if (this.currentTokenId === tokenId) {
      this.currentTokenId = null;
    }
  }

  /**
   * Completely destroy a store (remove from memory and localStorage)
   */
  public destroyStore(tokenId: string): void {
    console.log(`💥 Store Manager: Destroying store ${tokenId}`);
    
    // Remove from cache
    this.removeFromCache(tokenId);
    
    // Trigger storage cleanup for this specific token
    if (isStorageAvailable()) {
      cleanupOldProjects(this.currentTokenId || '', true);
    }
  }

  /**
   * Clean up memory cache to prevent memory leaks
   */
  private cleanupMemoryCache(): void {
    const cacheEntries = Object.entries(this.storeCache);
    
    if (cacheEntries.length <= this.maxCachedStores) {
      return; // No cleanup needed
    }

    console.log(`🧹 Store Manager: Memory cache cleanup (${cacheEntries.length} stores cached)`);

    // Sort by last accessed time (oldest first)
    const sortedEntries = cacheEntries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Keep the most recent stores and current store
    const storesToRemove = sortedEntries.slice(0, -this.maxCachedStores);
    
    for (const [tokenId] of storesToRemove) {
      // Don't remove current store from cache
      if (tokenId !== this.currentTokenId) {
        this.removeFromCache(tokenId);
      }
    }

    console.log(`✅ Store Manager: Removed ${storesToRemove.length} stores from memory cache`);
  }

  /**
   * Get current active token ID
   */
  public getCurrentTokenId(): string | null {
    return this.currentTokenId;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    cachedStores: number;
    currentToken: string | null;
    oldestStore?: string;
    newestStore?: string;
    memoryUsage: string[];
  } {
    const entries = Object.entries(this.storeCache);
    const sortedByAccess = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    return {
      cachedStores: entries.length,
      currentToken: this.currentTokenId,
      oldestStore: sortedByAccess[0]?.[0],
      newestStore: sortedByAccess[sortedByAccess.length - 1]?.[0],
      memoryUsage: entries.map(([tokenId, cache]) => 
        `${tokenId}: ${new Date(cache.lastAccessed).toLocaleTimeString()}`
      ),
    };
  }

  /**
   * Mark a store as initialized (after hydration)
   */
  public markStoreInitialized(tokenId: string): void {
    if (this.storeCache[tokenId]) {
      this.storeCache[tokenId].isInitialized = true;
      // console.log(`✅ Store Manager: Store ${tokenId} marked as initialized`);
    }
  }

  /**
   * Check if a store is initialized
   */
  public isStoreInitialized(tokenId: string): boolean {
    return this.storeCache[tokenId]?.isInitialized || false;
  }

  /**
   * Switch to a different token (useful for navigation)
   */
  public switchToToken(newTokenId: string, oldTokenId?: string): EditStoreInstance {
    // console.log(`🔄 Store Manager: Switch requested from ${oldTokenId || 'unknown'} to ${newTokenId}`);
    
    // Update previous token tracking
    if (oldTokenId && this.storeCache[oldTokenId]) {
      this.storeCache[oldTokenId].lastAccessed = Date.now() - 1000; // Mark as slightly older
    }

    // Get or create the new store
    return this.getEditStore(newTokenId);
  }

  /**
   * Preload a store (useful for prefetching)
   */
  public preloadStore(tokenId: string): Promise<EditStoreInstance> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getEditStore(tokenId);
        
        // Wait for store to be ready (basic check)
        const checkReady = () => {
          if (this.isStoreInitialized(tokenId)) {
            resolve(store);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        
        // Start checking, but timeout after 5 seconds
        checkReady();
        setTimeout(() => {
          if (!this.isStoreInitialized(tokenId)) {
            console.warn(`⚠️ Store Manager: Preload timeout for ${tokenId}`);
            resolve(store); // Resolve anyway
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Cleanup when manager is destroyed
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear cache
    this.storeCache = {};
    this.currentTokenId = null;
    
    // console.log('🛑 Store Manager destroyed');
  }
}

// Export singleton instance
export const storeManager = EditStoreManager.getInstance();

// Export types and utilities
export type { EditStoreInstance };
export { EditStoreManager };

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__storeManagerDebug = {
    getInstance: () => EditStoreManager.getInstance(),
    getCacheStats: () => storeManager.getCacheStats(),
    cleanupCache: () => storeManager['cleanupMemoryCache'](),
    switchToToken: (tokenId: string) => storeManager.switchToToken(tokenId),
    destroyStore: (tokenId: string) => storeManager.destroyStore(tokenId),
    getCurrentToken: () => storeManager.getCurrentTokenId(),
  };
  
  // console.log('🔧 Store Manager debug utilities available at window.__storeManagerDebug');
}