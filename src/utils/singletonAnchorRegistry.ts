// Fix 1: True singleton anchor registry - module-level, no React context
// This registry is shared across all components and providers

import type { AnchorInfo } from '@/hooks/useGlobalAnchor';

export interface SingletonAnchorRegistry {
  // Registry operations
  register: (key: string, anchor: AnchorInfo) => void;
  unregister: (key: string) => void;
  get: (key: string) => AnchorInfo | undefined;
  has: (key: string) => boolean;
  clear: () => void;
  
  // Queries
  getAll: () => Record<string, AnchorInfo>;
  size: () => number;
  keys: () => string[];
  
  // Debug info
  __id: string;
  __createdAt: number;
}

// Module-level singleton - one instance across entire app
const registryStorage = new Map<string, AnchorInfo>();
const registryId = `anchor-registry-${Math.random().toString(36).substr(2, 9)}`;

export const singletonAnchorRegistry: SingletonAnchorRegistry = {
  register: (key: string, anchor: AnchorInfo) => {
    const normalizedKey = key.toLowerCase();
    const previousSize = registryStorage.size;
    registryStorage.set(normalizedKey, anchor);
    const newSize = registryStorage.size;
    
    console.log(`🏪 [SINGLETON-REGISTRY] Register:`, {
      key: normalizedKey,
      originalKey: key,
      registryId,
      previousSize,
      newSize,
      anchor: {
        sectionId: anchor.sectionId,
        elementKey: anchor.elementKey,
        toolbarType: anchor.toolbarType
      }
    });
  },

  unregister: (key: string) => {
    const normalizedKey = key.toLowerCase();
    const previousSize = registryStorage.size;
    const existed = registryStorage.delete(normalizedKey);
    const newSize = registryStorage.size;
    
    if (existed) {
      console.log(`🗑️ [SINGLETON-REGISTRY] Unregister:`, {
        key: normalizedKey,
        originalKey: key,
        registryId,
        previousSize,
        newSize
      });
    } else {
      console.warn(`⚠️ [SINGLETON-REGISTRY] Unregister failed - key not found:`, {
        key: normalizedKey,
        originalKey: key,
        registryId,
        availableKeys: Array.from(registryStorage.keys()).slice(0, 5) // First 5 keys
      });
    }
  },

  get: (key: string) => {
    const normalizedKey = key.toLowerCase();
    return registryStorage.get(normalizedKey);
  },

  has: (key: string) => {
    const normalizedKey = key.toLowerCase();
    return registryStorage.has(normalizedKey);
  },

  clear: () => {
    const previousSize = registryStorage.size;
    registryStorage.clear();
    console.log(`🧹 [SINGLETON-REGISTRY] Clear:`, {
      registryId,
      clearedCount: previousSize
    });
  },

  getAll: () => {
    const result: Record<string, AnchorInfo> = {};
    for (const [key, anchor] of registryStorage.entries()) {
      result[key] = anchor;
    }
    return result;
  },

  size: () => registryStorage.size,
  
  keys: () => Array.from(registryStorage.keys()),

  __id: registryId,
  __createdAt: Date.now()
};

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__singletonAnchorRegistry = singletonAnchorRegistry;
  
  console.log(`🏪 [SINGLETON-REGISTRY] Created singleton with ID: ${registryId}`);
  console.log('🔧 Debug utilities available at window.__singletonAnchorRegistry');
}

export default singletonAnchorRegistry;