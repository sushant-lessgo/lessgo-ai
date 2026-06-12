'use client';

// src/modules/templates/meridian/hooks/useMeridianBlock.ts
// Thin Meridian-side parallel to useLayoutComponent / useServiceBlock. Generic;
// renamed clone — skips product theming (color tokens, dynamic text colors,
// background CSS). Meridian blocks consume CSS vars from MeridianThemeInjector
// directly.

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

export interface UseMeridianBlockProps {
  sectionId: string;
}

export interface UseMeridianBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useMeridianBlock<T = Record<string, any>>({
  sectionId,
}: UseMeridianBlockProps): UseMeridianBlockReturn<T> {
  const { content, mode, updateElementContent } = useEditStore();

  const sectionContent = content[sectionId];
  const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
  const layout = sectionContent?.layout;

  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

  const schema = layout ? getSchemaDefaults(layout) : null;

  let blockContent: T;
  if (!schema) {
    logger.warn(`[useMeridianBlock] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
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
