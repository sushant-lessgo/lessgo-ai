// hooks/useContentSerializer.ts - Basic content serialization/deserialization for MVP
import { useCallback, useMemo } from 'react';
import { useEditStore } from './useEditStore';
import { validateContentStructure } from '@/utils/contentSerialization';

export interface SerializedContent {
  version: number;
  timestamp: number;
  sections: string[];
  sectionLayouts: Record<string, string>;
  content: Record<string, any>;
  theme: any;
  globalSettings: any;
  metadata: {
    title: string;
    tokenId: string;
    lastUpdated: number;
  };
}

export interface ContentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UseContentSerializerReturn {
  serialize: () => SerializedContent;
  deserialize: (data: SerializedContent) => void;
  validate: (data: any) => ContentValidationResult;
  getSerializedSize: () => number;
  canDeserialize: (data: any) => boolean;
}

export const useContentSerializer = (): UseContentSerializerReturn => {
  const store = useEditStore();

  const serialize = useCallback((): SerializedContent => {
    const state = store;
    
    return {
      version: 1,
      timestamp: Date.now(),
      sections: state.sections,
      sectionLayouts: state.sectionLayouts,
      content: state.content,
      theme: state.theme,
      globalSettings: state.globalSettings,
      metadata: {
        title: state.title,
        tokenId: state.tokenId,
        lastUpdated: state.lastUpdated,
      },
    };
  }, [store]);

  const deserialize = useCallback((data: SerializedContent) => {
    const validation = validateContentStructure(data);
    
    if (!validation.isValid) {
      console.error('Content validation failed:', validation.errors);
      throw new Error(`Invalid content structure: ${validation.errors.join(', ')}`);
    }

    store.setSections(data.sections);
    store.setSectionLayouts(data.sectionLayouts);
    store.setContent(data.content);
    store.setTheme(data.theme);
    store.setGlobalSettings(data.globalSettings);
    store.updateMeta({
      title: data.metadata.title,
      tokenId: data.metadata.tokenId,
      lastUpdated: data.metadata.lastUpdated,
    });
  }, [store]);

  const validate = useCallback((data: any): ContentValidationResult => {
    return validateContentStructure(data);
  }, []);

  const getSerializedSize = useCallback((): number => {
    const serialized = serialize();
    return new Blob([JSON.stringify(serialized)]).size;
  }, [serialize]);

  const canDeserialize = useCallback((data: any): boolean => {
    const validation = validateContentStructure(data);
    return validation.isValid;
  }, []);

  return {
    serialize,
    deserialize,
    validate,
    getSerializedSize,
    canDeserialize,
  };
};