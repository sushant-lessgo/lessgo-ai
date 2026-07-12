'use client';

// src/modules/templates/atelier/hooks/useAtelierBlock.ts
// Thin Atelier-side parallel to useVestriaBlock. Atelier blocks consume CSS vars
// from AtelierThemeInjector / AtelierSSRTokens directly.

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseAtelierBlockProps {
  sectionId: string;
}

export interface UseAtelierBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  layout: string | undefined;
  blockContent: T;
  isExcluded: (elementKey: string) => boolean;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useAtelierBlock<T = Record<string, any>>({
  sectionId,
}: UseAtelierBlockProps): UseAtelierBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useAtelierBlock');
}
