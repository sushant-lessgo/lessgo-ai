'use client';

// src/modules/templates/surge/hooks/useServiceBlock.ts
// Thin Surge-side parallel to useLayoutComponent. Skips product theming
// (color tokens, dynamic text colors, background CSS) — Surge blocks
// consume CSS vars from SurgeThemeInjector / SurgeSSRTokens directly.

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseServiceBlockProps {
  sectionId: string;
}

export interface UseServiceBlockReturn<T> {
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

export function useServiceBlock<T = Record<string, any>>({
  sectionId,
}: UseServiceBlockProps): UseServiceBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useServiceBlock');
}
