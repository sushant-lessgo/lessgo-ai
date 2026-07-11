'use client';

// src/modules/templates/vestria/hooks/useVestriaBlock.ts
// Thin Vestria-side parallel to useGranthBlock. Vestria blocks consume CSS vars
// from VestriaThemeInjector / VestriaSSRTokens directly.

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

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
  return useTemplateBlock<T>(sectionId, 'useVestriaBlock');
}
