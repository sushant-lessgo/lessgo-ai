'use client';

// src/modules/templates/techpremium/hooks/useTechPremiumBlock.ts
// Thin TechPremium-side parallel to useMeridianBlock / useServiceBlock. Generic;
// renamed clone — reads content[sectionId] from the edit store and extracts the
// layout's content via the audience schema defaults. TechPremium blocks consume CSS
// vars from TechPremiumThemeInjector directly (no product theming layer).

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

export interface UseTechPremiumBlockProps {
  sectionId: string;
}

export interface UseTechPremiumBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useTechPremiumBlock<T = Record<string, any>>({
  sectionId,
}: UseTechPremiumBlockProps): UseTechPremiumBlockReturn<T> {
  const { content, mode, updateElementContent } = useEditStore();

  const sectionContent = content[sectionId];
  const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
  const layout = sectionContent?.layout;

  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

  const schema = layout ? getSchemaDefaults(layout) : null;

  let blockContent: T;
  if (!schema) {
    logger.warn(`[useTechPremiumBlock] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
    blockContent = {} as T;
  } else {
    blockContent = extractLayoutContent(elements, schema as any, layout, excludedElements) as T;
  }

  const handleContentUpdate = (elementKey: string, value: any) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Collections (nav_items[], stats[], features[], tiers[], footer_columns[], …)
  // are stored under the same elements map; the store treats arrays as values.
  const handleCollectionUpdate = <C,>(collectionKey: string, value: C) => {
    updateElementContent(sectionId, collectionKey, value as any);
  };

  return {
    sectionId,
    mode: mode as 'edit' | 'preview' | 'published',
    blockContent,
    handleContentUpdate,
    handleCollectionUpdate,
  };
}
