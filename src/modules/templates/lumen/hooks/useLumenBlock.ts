'use client';

// src/modules/templates/lumen/hooks/useLumenBlock.ts
// Thin Lumen-side parallel to useLayoutComponent. Lumen blocks consume CSS vars
// from LumenThemeInjector / LumenSSRTokens directly. Also surfaces the
// Lumen-scoped edit-language flag (EN/NL) so blocks + LumenEditable can route
// twin `_nl` fields (bilingual is Lumen-contained — no shared store change).

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';
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
  const base = useTemplateBlock<T>(sectionId, 'useLumenBlock');
  const { editLang } = useLumenEditLang();

  return {
    ...base,
    editLang,
  };
}
