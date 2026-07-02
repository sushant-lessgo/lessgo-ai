'use client';

// src/modules/templates/lumen/hooks/useLumenBlock.ts
// Thin Lumen-side parallel to useLayoutComponent. Lumen blocks consume CSS vars
// from LumenThemeInjector / LumenSSRTokens directly. Also surfaces the
// Lumen-scoped edit-language flag (EN/NL) so blocks + LumenEditable can route
// twin `_nl` fields (bilingual is Lumen-contained — no shared store change).

import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';
import { useLumenEditLang, type LumenEditLang } from '../editLang';

export interface UseLumenBlockProps {
  sectionId: string;
}

export interface UseLumenBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  /** Stored layout name — for blocks that dispatch by layout. */
  layout: string | undefined;
  blockContent: T;
  /** Active edit-language ('en' | 'nl') — drives which twin key LumenEditable writes. */
  editLang: LumenEditLang;
  /** True when the element was toggled off — gate optional containers in edit. */
  isExcluded: (elementKey: string) => boolean;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useLumenBlock<T = Record<string, any>>({
  sectionId,
}: UseLumenBlockProps): UseLumenBlockReturn<T> {
  const { content, mode, updateElementContent } = useEditStore();
  const { editLang } = useLumenEditLang();

  const sectionContent = content[sectionId];
  const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
  const layout = sectionContent?.layout;

  const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
  const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

  const schema = layout ? getSchemaDefaults(layout) : null;

  let blockContent: T;
  if (!schema) {
    logger.warn(`[useLumenBlock] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
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
    editLang,
    isExcluded,
    handleContentUpdate,
    handleCollectionUpdate,
  };
}
