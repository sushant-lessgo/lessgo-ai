// src/utils/pageLinks.ts
// Build "link to another page" options from the project's pages (Phase 2,
// cross-page linking). Value is the target page's pathSlug ('/contact'), which
// works natively in published HTML — middleware routes it; no rewriting needed.

import type { ProjectPageEntry } from '@/types/store';

export interface PageLinkOption {
  value: string; // pathSlug, e.g. '/contact'
  label: string; // page title, e.g. 'Contact'
}

export function buildPageLinkOptions(
  pages: Record<string, ProjectPageEntry> | undefined,
): PageLinkOption[] {
  if (!pages) return [];
  return Object.values(pages)
    .filter((p) => p && p.pathSlug)
    .sort((a, b) => {
      if (a.pathSlug === '/') return -1;
      if (b.pathSlug === '/') return 1;
      return a.order - b.order;
    })
    .map((p) => ({
      value: p.pathSlug,
      label: p.pathSlug === '/' ? p.title || 'Home' : p.title || p.pathSlug,
    }));
}
