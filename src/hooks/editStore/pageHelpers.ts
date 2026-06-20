// hooks/editStore/pageHelpers.ts — boundary helpers for the multi-page mirror.
//
// The top-level `sections|sectionLayouts|sectionSpacing|content` are the live
// working copy of the active page. These helpers reconcile that working copy
// with the `pages` map at the two boundaries (page switch + export). Deep-clone
// at every boundary so the top-level working copy and the stored page entry are
// never the same object (avoids Immer draft aliasing and stale-shared mutation).

import type { EditStore, PageSlice, ProjectPageEntry } from '@/types/store';

export const HOME_PAGE_ID = 'home';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

/** Read the live top-level working set as a plain slice. */
export function activeSliceFromState(state: any): PageSlice {
  return {
    sections: state.sections ?? [],
    sectionLayouts: state.sectionLayouts ?? {},
    sectionSpacing: state.sectionSpacing ?? {},
    content: state.content ?? {},
  };
}

/** Find the home page id (the page whose pathSlug is '/'), if any. */
export function findHomeId(pages: Record<string, ProjectPageEntry> | undefined): string | undefined {
  if (!pages) return undefined;
  return Object.values(pages).find((p) => p.pathSlug === '/')?.id;
}

/**
 * Immer-draft helper: write the live working copy into pages[currentPageId].
 * Call before switching pages or before any read of the full pages map.
 */
export function commitActivePage(state: any): void {
  const id = state.currentPageId;
  if (!id || !state.pages?.[id]) return;
  Object.assign(state.pages[id], clone(activeSliceFromState(state)));
}

/** Immer-draft helper: load a page entry's slice into the top-level working copy. */
export function loadPageIntoActive(state: any, entry: ProjectPageEntry): void {
  const slice = clone<PageSlice>({
    sections: entry.sections ?? [],
    sectionLayouts: entry.sectionLayouts ?? {},
    sectionSpacing: entry.sectionSpacing ?? {},
    content: entry.content ?? {},
  });
  state.currentPageId = entry.id;
  state.sections = slice.sections;
  state.sectionLayouts = slice.sectionLayouts;
  state.sectionSpacing = slice.sectionSpacing;
  state.content = slice.content;
}

/**
 * Pure (non-Immer) builder used by export(): returns a plain pages map with the
 * active page committed and a guaranteed home entry. Never mutates `state`.
 */
export function buildPagesForExport(state: any): {
  pages: Record<string, ProjectPageEntry>;
  currentPageId: string;
  homeId: string;
} {
  const slice = activeSliceFromState(state);
  const pages: Record<string, ProjectPageEntry> = clone(state.pages || {});

  let homeId = findHomeId(pages);
  if (!homeId) {
    homeId = HOME_PAGE_ID;
    pages[homeId] = {
      id: homeId,
      archetypeKey: 'home',
      pathSlug: '/',
      title: state.title || 'Home',
      order: 0,
      ...clone(slice),
    };
  }

  const currentPageId = state.currentPageId && pages[state.currentPageId] ? state.currentPageId : homeId;
  // Commit the live working copy into the active page entry.
  pages[currentPageId] = { ...pages[currentPageId], ...clone(slice) };
  return { pages, currentPageId, homeId };
}
