// hooks/editStore/pageActions.ts — multi-page axis actions (Phase 1).
//
// See multiPagePlan.md. Phase 1 "Add page" clones the home slice so the new page
// is immediately valid and renderable (no blank-canvas problem, no drag-drop).
// Real template archetypes replace the clone in Phase 4.

import type { EditStore, ProjectPageEntry, PageSlice } from '@/types/store';
import { commitActivePage, loadPageIntoActive, findHomeId, splitChrome, HOME_PAGE_ID } from './pageHelpers';
import { logger } from '@/lib/logger';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

function genPageId(): string {
  return `page-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPageActions(set: any, get: any) {
  return {
    setCurrentPage: (pageId: string) =>
      set((state: EditStore) => {
        if (!pageId || pageId === state.currentPageId) return;
        const target = state.pages?.[pageId];
        if (!target) {
          logger.warn(`setCurrentPage: unknown page ${pageId}`);
          return;
        }
        commitActivePage(state); // persist the page we're leaving
        loadPageIntoActive(state, target as ProjectPageEntry);
        // Clear transient per-page UI selection so toolbars don't point at a stale section.
        state.selectedSection = undefined;
        state.selectedElement = undefined;
      }),

    addPage: (opts: { archetypeKey?: string; title?: string; pathSlug?: string } = {}) => {
      const newId = genPageId();
      set((state: EditStore) => {
        commitActivePage(state);
        if (!state.pages) state.pages = {};
        // Clone the home slice as the starting point (Phase 1 throwaway archetype).
        const homeId = findHomeId(state.pages);
        const source = (homeId && state.pages[homeId]) || null;
        // Body-only clone. splitChrome() guarantees no header/footer leak even if
        // the source is the (chrome-injected) working copy (PO must-fix #1, site 4).
        const slice = splitChrome(
          clone({
            sections: source ? source.sections : state.sections,
            sectionLayouts: source ? source.sectionLayouts : state.sectionLayouts,
            sectionSpacing: (source ? source.sectionSpacing : state.sectionSpacing) || {},
            content: source ? source.content : state.content,
          }) as PageSlice,
        ).body;
        const order = Object.keys(state.pages).length;
        const entry: ProjectPageEntry = {
          id: newId,
          archetypeKey: opts.archetypeKey || 'basic',
          pathSlug: opts.pathSlug || `/page-${order}`,
          title: opts.title || `Page ${order}`,
          order,
          ...slice,
        };
        state.pages[newId] = entry;
        // Switch to the new page (load a fresh clone so it doesn't alias the entry).
        loadPageIntoActive(state, clone(entry));
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      });
      return newId;
    },

    deletePage: (pageId: string) =>
      set((state: EditStore) => {
        const target = state.pages?.[pageId];
        if (!target) return;
        if (target.pathSlug === '/') {
          logger.warn('deletePage: the home page cannot be deleted');
          return;
        }
        delete state.pages[pageId];
        if (state.currentPageId === pageId) {
          const homeId = findHomeId(state.pages);
          const fallback = (homeId && state.pages[homeId]) || Object.values(state.pages)[0];
          if (fallback) loadPageIntoActive(state, clone(fallback as ProjectPageEntry));
        }
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    renamePage: (pageId: string, title: string, pathSlug?: string) =>
      set((state: EditStore) => {
        const target = state.pages?.[pageId];
        if (!target) return;
        target.title = title;
        if (pathSlug && target.pathSlug !== '/') target.pathSlug = pathSlug;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    getPagesList: (): ProjectPageEntry[] => {
      const state = get();
      const entries = Object.values((state.pages || {}) as Record<string, ProjectPageEntry>);
      return entries.sort((a, b) => {
        if (a.pathSlug === '/') return -1;
        if (b.pathSlug === '/') return 1;
        return a.order - b.order;
      });
    },
  };
}
