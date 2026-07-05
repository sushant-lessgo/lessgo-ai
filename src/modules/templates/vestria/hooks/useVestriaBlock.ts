'use client';

// src/modules/templates/vestria/hooks/useVestriaBlock.ts
// Thin Vestria-side parallel to useGranthBlock. Vestria blocks consume CSS vars
// from VestriaThemeInjector / VestriaSSRTokens directly.

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

export interface UseVestriaBlockProps {
  sectionId: string;
}

export interface UseVestriaBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  /** Stored layout name — for blocks that dispatch by layout. */
  layout: string | undefined;
  blockContent: T;
  /** True when the element was toggled off — gate optional containers in edit. */
  isExcluded: (elementKey: string) => boolean;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useVestriaBlock<T = Record<string, any>>({
  sectionId,
}: UseVestriaBlockProps): UseVestriaBlockReturn<T> {
  const { content, mode, updateElementContent } = useEditStore();

  const sectionContent = content[sectionId];
  const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
  const layout = sectionContent?.layout;

  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

  const schema = layout ? getSchemaDefaults(layout) : null;

  let blockContent: T;
  if (!schema) {
    logger.warn(`[useVestriaBlock] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
    blockContent = {} as T;
  } else {
    blockContent = extractLayoutContent(elements, schema as any, layout, excludedElements) as T;
  }

  const handleContentUpdate = (elementKey: string, value: any) => {
    updateElementContent(sectionId, elementKey, value);
  };

  const handleCollectionUpdate = <C,>(collectionKey: string, value: C) => {
    updateElementContent(sectionId, collectionKey, value as any);
  };

  const isExcluded = (elementKey: string) => excludedElements.includes(elementKey);

  return {
    sectionId,
    mode: mode as 'edit' | 'preview' | 'published',
    layout,
    blockContent,
    isExcluded,
    handleContentUpdate,
    handleCollectionUpdate,
  };
}
