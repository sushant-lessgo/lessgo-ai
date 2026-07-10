'use client';

// src/modules/templates/shared/useTemplateBlock.ts
// Shared base for the per-template block hooks (useMeridianBlock,
// useTechPremiumBlock, useServiceBlock (hearth/surge), useLexBlock,
// useLumenBlock, useGranthBlock, useVestriaBlock). The clones were
// logic-identical except a log tag and which of the superset fields they
// re-export; this consolidates the store-read + content-extraction logic and
// gives blocks STABLE identities across unrelated edits:
//   - subscribes via narrow SELECTORS (content[sectionId] slice, mode, action)
//     instead of the whole store,
//   - memoizes blockContent on the stable content[sectionId] ref + layout id,
//   - returns useCallback-stable handlers.
// Plain client hook module — does NOT import or get imported by any
// `.published.*` renderer.

import { useMemo, useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractLayoutContent, type StoreElementTypes } from '@/types/storeTypes';
import { getSchemaDefaults } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

export interface UseTemplateBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  /** Stored layout name (e.g. 'PullQuoteWithMark' | 'ReviewGrid') — for blocks that dispatch by layout. */
  layout: string | undefined;
  blockContent: T;
  /** True when the element was toggled off (in aiMetadata.excludedElements) — gate optional containers in edit. */
  isExcluded: (elementKey: string) => boolean;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useTemplateBlock<T = Record<string, any>>(
  sectionId: string,
  logTag: string,
): UseTemplateBlockReturn<T> {
  // Narrow selector subscriptions: the section slice (stable ref unless THIS
  // section changes), the mode primitive, and the (stable-identity) action.
  const sectionContent = useEditStore((s) => s.content[sectionId]);
  const mode = useEditStore((s) => s.mode);
  const updateElementContent = useEditStore((s) => s.updateElementContent);

  const layout = sectionContent?.layout;

  // Keyed on the STABLE content[sectionId] ref (+ layout id). The `|| {}` /
  // `Array.isArray ? : []` fallbacks are computed INSIDE the memo so they don't
  // mint fresh refs every render and invalidate needlessly.
  const blockContent = useMemo<T>(() => {
    const elements = (sectionContent?.elements || {}) as Partial<StoreElementTypes>;
    const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
    const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];

    const schema = layout ? getSchemaDefaults(layout) : null;
    if (!schema) {
      logger.warn(`[${logTag}] No schema for ${sectionId} (layout=${layout}); rendering empty.`);
      return {} as T;
    }
    return extractLayoutContent(elements, schema as any, layout, excludedElements) as T;
  }, [sectionContent, layout, sectionId, logTag]);

  const isExcluded = useCallback(
    (elementKey: string) => {
      const storedExclusions = sectionContent?.aiMetadata?.excludedElements;
      const excludedElements: string[] = Array.isArray(storedExclusions) ? storedExclusions : [];
      return excludedElements.includes(elementKey);
    },
    [sectionContent],
  );

  const handleContentUpdate = useCallback(
    (elementKey: string, value: any) => {
      updateElementContent(sectionId, elementKey, value);
    },
    [sectionId, updateElementContent],
  );

  // Collections (nav_items[], services[], packages[], tiers[], footer_columns[],
  // social_links[], …) are stored under the same elements map; the store treats
  // arrays as values.
  const handleCollectionUpdate = useCallback(
    <C,>(collectionKey: string, value: C) => {
      updateElementContent(sectionId, collectionKey, value as any);
    },
    [sectionId, updateElementContent],
  );

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
