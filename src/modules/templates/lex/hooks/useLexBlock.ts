'use client';

// src/modules/templates/lex/hooks/useLexBlock.ts
// COPY of useServiceBlock (Phase 11a / A2 — copy-first). LOGIC-IDENTICAL.
// Reads section content from the edit store, resolves the schema by the stored
// layout name, and hands blocks their content. Lex projects store the same
// audience-level layout names (A1 keeps the field) and reuse the same element
// keys (A3), so schema resolution works unchanged.

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

export interface UseLexBlockProps {
  sectionId: string;
}

export interface UseLexBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useLexBlock<T = Record<string, any>>({
  sectionId,
}: UseLexBlockProps): UseLexBlockReturn<T> {
  const { content, mode, updateElementContent } = useEditStore();

  const sectionContent = content[sectionId];
  const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
  const layout = sectionContent?.layout;

  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

  const schema = layout ? getSchemaDefaults(layout) : null;

  let blockContent: T;
  if (!schema) {
    logger.warn(`[useLexBlock] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
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
