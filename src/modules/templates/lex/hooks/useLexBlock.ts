'use client';

// src/modules/templates/lex/hooks/useLexBlock.ts
// COPY of useServiceBlock (Phase 11a / A2 — copy-first). LOGIC-IDENTICAL.
// Reads section content from the edit store, resolves the schema by the stored
// layout name, and hands blocks their content. Lex projects store the same
// audience-level layout names (A1 keeps the field) and reuse the same element
// keys (A3), so schema resolution works unchanged.

import { useTemplateBlock } from '@/modules/templates/shared/useTemplateBlock';

export interface UseLexBlockProps {
  sectionId: string;
}

export interface UseLexBlockReturn<T> {
  sectionId: string;
  mode: 'edit' | 'preview' | 'published';
  blockContent: T;
  handleContentUpdate: (elementKey: string, value: any) => void;
  handleCollectionUpdate: <C>(collectionKey: string, value: C) => void;
}

export function useLexBlock<T = Record<string, any>>({
  sectionId,
}: UseLexBlockProps): UseLexBlockReturn<T> {
  return useTemplateBlock<T>(sectionId, 'useLexBlock');
}
