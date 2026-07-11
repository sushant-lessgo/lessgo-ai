'use client';

// src/modules/templates/techpremium/hooks/useTechPremiumBlock.ts
// Thin TechPremium-side parallel to useMeridianBlock / useServiceBlock. Generic;
// renamed clone — reads content[sectionId] from the edit store and extracts the
// layout's content via the audience schema defaults. TechPremium blocks consume CSS
// vars from TechPremiumThemeInjector directly (no product theming layer).

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseTechPremiumBlockProps {
  sectionId: string;
}

export interface UseTechPremiumBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useTechPremiumBlock<T = Record<string, any>>({
  sectionId,
}: UseTechPremiumBlockProps): UseTechPremiumBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useTechPremiumBlock');
}
