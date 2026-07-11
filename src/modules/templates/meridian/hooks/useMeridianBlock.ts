'use client';

// src/modules/templates/meridian/hooks/useMeridianBlock.ts
// Thin Meridian-side parallel to useLayoutComponent / useServiceBlock. Generic;
// renamed clone — skips product theming (color tokens, dynamic text colors,
// background CSS). Meridian blocks consume CSS vars from MeridianThemeInjector
// directly.

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseMeridianBlockProps {
  sectionId: string;
}

export interface UseMeridianBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useMeridianBlock<T = Record<string, any>>({
  sectionId,
}: UseMeridianBlockProps): UseMeridianBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useMeridianBlock');
}
