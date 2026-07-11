'use client';

// src/modules/service/hooks/useServiceBlock.ts
// Thin Hearth-side parallel to useLayoutComponent. Skips product theming
// (color tokens, dynamic text colors, background CSS) — Hearth blocks
// consume CSS vars from HearthThemeInjector directly.

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

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
  return useTemplateBlock<T>(sectionId, 'useServiceBlock');
}
