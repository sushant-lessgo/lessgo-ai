'use client';

// src/modules/templates/granth/hooks/useGranthBlock.ts
// Thin Granth-side parallel to useLumenBlock. Granth blocks consume CSS vars from
// GranthThemeInjector / GranthSSRTokens directly. Hindi-only — no edit-language
// flag (the Lumen bilingual routing is dropped).

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseGranthBlockProps {
  sectionId: string;
}

export interface UseGranthBlockReturn<T> {
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

export function useGranthBlock<T = Record<string, any>>({
  sectionId,
}: UseGranthBlockProps): UseGranthBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useGranthBlock');
}
