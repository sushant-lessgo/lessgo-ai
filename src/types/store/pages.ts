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

/** A page's role in the multi-page model (Phase 3 collection system). */
export type PageKind = 'singleton' | 'collectionItem';

/** schema.org type for the page's JSON-LD block. 'auto' derives a safe default. */
export type StructuredDataType =
  | 'auto'
  | 'none'
  | 'Organization'
  | 'LocalBusiness'
  | 'Product'
  | 'Service';

/**
 * Per-page SEO overrides (SEO track, Phase 2). Everything optional — an absent
 * field falls back to the auto-derived behavior in buildPageMetadata. The home
 * page's entry doubles as the site-level seo (lifted to content.seo at publish).
 */
export interface PageSeo {
  title?: string; // <=70 chars; <title> + og:title override
  description?: string; // <=200 chars; meta description + og:description override
  ogImage?: string; // absolute https URL; wins over previewImage + auto /api/og
  noIndex?: boolean; // -> <meta name="robots" content="noindex,nofollow">
  faviconUrl?: string; // site-wide; only meaningful on the root (home) entry
  structuredDataType?: StructuredDataType; // default 'auto'
}

/** A page entry = its slice plus identity/route metadata. Maps to a ProjectPage row. */
export interface ProjectPageEntry extends PageSlice {
  id: string;
  archetypeKey: string; // home | basic | contact | gallery | product-catalog | product-detail
  pathSlug: string; // '/', '/contact', '/products/nwc-2000'
  title: string;
  order: number;
  // Collection system (Phase 3). Optional → Phase-1/2 drafts default to 'singleton'.
  kind?: PageKind; // default 'singleton'
  collectionKey?: string; // e.g. 'products' — set on the catalog page AND each item
  seo?: PageSeo;
}

/** A shared chrome entry (header or footer) — one per project, rendered on every page. */
export interface ChromeEntry {
  id: string;
  layout: string;
  spacing?: SectionSpacing;
  data: SectionData;
}

export interface ChromeState {
  header: ChromeEntry | null;
  footer: ChromeEntry | null;
}

export interface PageAxisState {
  pages: Record<string, ProjectPageEntry>;
  currentPageId: string;
  // Shared site chrome (Phase 2). Canonical source of truth; injected into the
  // active page's working copy for editing, extracted on commit, and injected
  // per-page at publish. Stored pages are body-only (no header/footer).
  chrome: ChromeState;
}

export interface PageActions {
  /** Commit the active page, then load `pageId` into the top-level working set. */
  setCurrentPage: (pageId: string) => void;
  /** Create a new page (Phase 1: clones the home slice). Returns its id. */
  addPage: (opts?: { archetypeKey?: string; title?: string; pathSlug?: string }) => string;
  /**
   * Replace the active (home/basic, non-collection) page's BODY with a template
   * archetype (Phase 4b — 'home' = the full naayom layout). Chrome-safe: commits,
   * swaps body-only fields, re-injects chrome. Refuses collection pages.
   */
  applyArchetype: (archetypeKey?: string) => void;
  /**
   * Create a designed standalone page from an archetype in one step (Phase 4c —
   * 'gallery' | 'contact'). Body comes straight from the builder (no home-clone);
   * singleton (refuses a 2nd of the same archetype, switches to it); contact
   * provisions its lead form. Adds a header nav link. Returns the page id.
   */
  addArchetypePage: (archetypeKey: string) => string;
  /** Delete a page. The home page cannot be deleted. */
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, title: string, pathSlug?: string) => void;
  /** Merge a partial seo patch into a page's seo blob (undefined values delete keys). */
  updatePageSeo: (pageId: string, seo: Partial<PageSeo>) => void;
  /** All pages, order-sorted (home first). */
  getPagesList: () => ProjectPageEntry[];

  // ===== Collection system (Phase 3) =====
  /** Idempotently create the catalog singleton page for a collection if absent. Returns its id. */
  ensureCatalogPage: (collectionKey: string) => string;
  /** Create a new collection item (product) page + re-materialize the catalog. Returns its id. */
  addCollectionItem: (collectionKey: string, opts?: { title?: string }) => string;
  /** Reorder the items of a collection by id, then re-materialize. */
  reorderCollection: (collectionKey: string, orderedIds: string[]) => void;
  /** Assign a collection item's category (updates its record + re-materializes). */
  setCollectionItemCategory: (collectionKey: string, pageId: string, categoryId: string) => void;
  /** Replace a collection's category list; rehomes orphaned items to the first remaining category. */
  setCollectionCategories: (collectionKey: string, categories: Array<{ id: string; title: string; label?: string }>) => void;
  /** All item pages of a collection, order-sorted. */
  getCollectionItems: (collectionKey: string) => ProjectPageEntry[];
}
