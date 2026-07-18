'use client';

// src/modules/skeletons/work/hooks/useWorkBlock.ts
// Thin work-skeleton-side parallel to useGranthBlock. Work blocks consume CSS vars
// from the skeleton's ThemeInjector / SSRTokens directly. Delegates to the shared
// `useTemplateBlock` (narrow selectors + memoized blockContent + stable handlers).

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseWorkBlockProps {
  sectionId: string;
}

export interface UseWorkBlockReturn<T> {
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

export function useWorkBlock<T = Record<string, any>>({
  sectionId,
}: UseWorkBlockProps): UseWorkBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useWorkBlock');
}
