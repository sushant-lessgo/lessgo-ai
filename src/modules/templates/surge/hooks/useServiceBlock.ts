'use client';

// src/modules/templates/surge/hooks/useServiceBlock.ts
// Thin Surge-side parallel to useLayoutComponent. Skips product theming
// (color tokens, dynamic text colors, background CSS) — Surge blocks
// consume CSS vars from SurgeThemeInjector / SurgeSSRTokens directly.

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

export interface UseServiceBlockProps {
  sectionId: string;
}

export interface UseServiceBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useServiceBlock<T = Record<string, any>>({
  sectionId,
}: UseServiceBlockProps): UseServiceBlockReturn<T> {
  const { content, mode, updateElementContent } = useEditStore();

  const sectionContent = content[sectionId];
  const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
  const layout = sectionContent?.layout;

  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

  const schema = layout ? getSchemaDefaults(layout) : null;

  let blockContent: T;
  if (!schema) {
    logger.warn(`[useServiceBlock] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
    blockContent = {} as T;
  } else {
    blockContent = extractLayoutContent(elements, schema as any, layout, excludedElements) as T;
  }

  const handleContentUpdate = (elementKey: string, value: any) => {
    updateElementContent(sectionId, elementKey, value);
  };

  // Collections (services[], packages[], nav_items[], social_links[]) are
  // stored under the same elements map; the store treats arrays as values.
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
