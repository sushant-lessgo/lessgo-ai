// types/store/pages.ts — Multi-page axis for the edit store.
//
// Mirror strategy (see multiPagePlan.md, Phase 1): the existing top-level
// `sections` / `sectionLayouts` / `sectionSpacing` / `content` fields remain the
// SINGLE live working copy of the *active* page, so the ~200 existing references
// keep working untouched. `pages` is the store of every page's slice; the active
// page's slice is reconciled into `pages[currentPageId]` only at the commit
// boundaries (page switch + export). Nothing reads a non-active page's slice
// outside those boundaries — that is what keeps the mirror from going stale.

import type { SectionData } from '@/types/core/index';

export type SectionSpacing = 'compact' | 'normal' | 'spacious' | 'extra';

/** The per-page working set (mirrors the top-level fields for the active page). */
export interface PageSlice {
  sections: string[];
  sectionLayouts: Record<string, string>;
  sectionSpacing: Record<string, SectionSpacing>;
  content: Record<string, SectionData>;
}

/** A page entry = its slice plus identity/route metadata. Maps to a ProjectPage row. */
export interface ProjectPageEntry extends PageSlice {
  id: string;
  archetypeKey: string; // home | basic | contact | gallery | product-catalog | product-detail
  pathSlug: string; // '/', '/contact', '/products/nwc-2000'
  title: string;
  order: number;
}

export interface PageAxisState {
  pages: Record<string, ProjectPageEntry>;
  currentPageId: string;
}

export interface PageActions {
  /** Commit the active page, then load `pageId` into the top-level working set. */
  setCurrentPage: (pageId: string) => void;
  /** Create a new page (Phase 1: clones the home slice). Returns its id. */
  addPage: (opts?: { archetypeKey?: string; title?: string; pathSlug?: string }) => string;
  /** Delete a page. The home page cannot be deleted. */
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, title: string, pathSlug?: string) => void;
  /** All pages, order-sorted (home first). */
  getPagesList: () => ProjectPageEntry[];
}
