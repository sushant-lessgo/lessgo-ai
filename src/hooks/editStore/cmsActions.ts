// src/hooks/editStore/cmsActions.ts
//
// CMS collections — editor store slice (cms-collections plan phase 3, step 2).
//
// TWO KINDS OF STATE, DELIBERATELY DIFFERENT LIFECYCLES:
//
//  1. `cmsData` — a RUNTIME-ONLY cache of the Collection tables (fetched from
//     /api/collections). NOT in `partialize`, NOT in `finalContent`, NOT in the
//     save or publish payloads. The tables are the source of truth; publish reads
//     them server-side (materializePublish.ts), never this cache.
//
//  2. PLACEMENT — which collection a section shows — lives in
//     `content[sectionId].elements.collectionId`, i.e. ordinary section content.
//     It therefore persists, autosaves and publishes for free, and survives load
//     because `applySnapshot` assigns `content` wholesale.
//
// ⚠️ THE DUAL PIN (the reason this file exists rather than a one-liner):
// `addCmsSection` MUST write BOTH
//     sectionLayouts[sectionId] = CMS_COLLECTION_LAYOUT
//     content[sectionId]        = { id, layout: CMS_COLLECTION_LAYOUT, elements }
// The publish payload carries NO `sectionLayouts` map, and
// LandingPagePublishedRenderer rebuilds layouts EXCLUSIVELY from
// `content[sid].layout`, silently `return null`ing a section without one. The
// EDIT renderer is forgiving (`sectionLayouts[id] || content[id]?.layout`), so
// pinning only the map looks perfect in the canvas and the section VANISHES on
// the published page — the asymmetric dual-renderer failure. Precedent:
// `injectGoalSections.ts` (sets both). No `sectionSpacing` entry: renderer
// defaults apply.

import type { EditStore } from '@/types/store';
import type { CmsCollectionBundle } from '@/modules/cms/types';
// ⚠️ Import from `sectionKeys` (pure), NEVER from `materializePublish` — that
// module imports `@/lib/prisma`, whose top-level side effect webpack cannot
// tree-shake, so it would ship ~73 kB of Prisma browser runtime in this (client)
// editor bundle. See the header of `@/modules/cms/sectionKeys`.
import { CMS_COLLECTION_LAYOUT, CMS_SECTION_TYPE } from '@/modules/cms/sectionKeys';
import { logger } from '@/lib/logger';

/** `cmscollection-<short id>` — the type prefix is what shared-block dispatch keys off. */
function newCmsSectionId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${CMS_SECTION_TYPE}-${rand}`;
}

/**
 * Fetch every collection for a token, with groups + items.
 * Plain fetch (no store access) so it can be awaited outside the Immer producer.
 */
async function fetchBundles(tokenId: string): Promise<Record<string, CmsCollectionBundle>> {
  const listRes = await fetch(`/api/collections?tokenId=${encodeURIComponent(tokenId)}`);
  if (!listRes.ok) throw new Error(`collections list failed (${listRes.status})`);
  const { collections } = (await listRes.json()) as { collections?: Array<{ id: string }> };

  const bundles: Record<string, CmsCollectionBundle> = {};
  for (const c of collections || []) {
    const res = await fetch(
      `/api/collections/${encodeURIComponent(c.id)}?tokenId=${encodeURIComponent(tokenId)}`
    );
    if (!res.ok) continue; // one bad collection must not blank the whole cache
    const data = (await res.json()) as {
      collection?: any;
      groups?: any[];
      items?: any[];
    };
    if (!data?.collection) continue;
    bundles[c.id] = {
      collection: data.collection,
      groups: data.groups || [],
      items: data.items || [],
    };
  }
  return bundles;
}

// `set` is typed `any` to match every other creator in this folder (the zustand
// immer+persist+devtools set signature does not narrow to a plain updater fn).
export const createCmsActions = (set: any, get: () => EditStore) => ({
  setCmsData: (bundles: Record<string, CmsCollectionBundle>) =>
    set((state: EditStore) => {
      state.cmsData = { bundles, status: 'loaded', loadedAt: Date.now() };
    }),

  refreshCmsData: async () => {
    const tokenId = get().tokenId;
    if (!tokenId) return;
    set((state: EditStore) => {
      state.cmsData = {
        bundles: state.cmsData?.bundles || {},
        status: 'loading',
        loadedAt: state.cmsData?.loadedAt,
      };
    });
    try {
      const bundles = await fetchBundles(tokenId);
      set((state: EditStore) => {
        state.cmsData = { bundles, status: 'loaded', loadedAt: Date.now() };
      });
    } catch (err: any) {
      logger.warn('[cms] refreshCmsData failed:', () => err);
      set((state: EditStore) => {
        state.cmsData = {
          bundles: state.cmsData?.bundles || {},
          status: 'error',
          loadedAt: state.cmsData?.loadedAt,
          error: err?.message || 'Failed to load collections',
        };
      });
    }
  },

  addCmsSection: (
    collectionId: string,
    opts?: { layoutHint?: string; position?: number }
  ): string => {
    const sectionId = newCmsSectionId();
    set((state: EditStore) => {
      const at =
        typeof opts?.position === 'number'
          ? Math.max(0, Math.min(opts.position, state.sections.length))
          : state.sections.length;
      state.sections.splice(at, 0, sectionId);

      // DUAL PIN — half of this is not enough. See the header note.
      state.sectionLayouts[sectionId] = CMS_COLLECTION_LAYOUT;
      state.content[sectionId] = {
        id: sectionId,
        layout: CMS_COLLECTION_LAYOUT,
        elements: {
          collectionId,
          ...(opts?.layoutHint ? { layoutHint: opts.layoutHint } : {}),
        },
      } as any;

      state.persistence.isDirty = true;
      state.lastUpdated = Date.now();
    });
    return sectionId;
  },

  removeCmsSection: (sectionId: string) =>
    set((state: EditStore) => {
      const idx = state.sections.indexOf(sectionId);
      if (idx === -1 && !state.content[sectionId]) return;
      state.sections = state.sections.filter((id) => id !== sectionId);
      delete state.sectionLayouts[sectionId];
      delete state.content[sectionId];
      if (state.selectedSection === sectionId) state.selectedSection = undefined;
      state.multiSelection = state.multiSelection.filter((id) => id !== sectionId);
      state.persistence.isDirty = true;
      state.lastUpdated = Date.now();
    }),

  /**
   * Deleting a collection cascades server-side (Collection → groups → items), but
   * the PLACEMENT lives in section content, which the server never touches. Without
   * this sweep the page keeps a `cmscollection` section pointing at a row that no
   * longer exists — it would publish as an empty block forever.
   *
   * Sweeps the ACTIVE working set AND every stored page slice: `addCmsSection`
   * writes to the active page only, but the user can place a section, switch pages
   * (which commits that slice into `state.pages[id]`), then delete the collection.
   * A top-level-only sweep would leave the stale placement on the other page.
   *
   * @returns how many sections were removed (0 = nothing referenced it).
   */
  removeCmsSectionsForCollection: (collectionId: string): number => {
    let removed = 0;
    set((state: EditStore) => {
      const sweep = (slice: {
        sections: string[];
        sectionLayouts: Record<string, string>;
        content: Record<string, any>;
      }) => {
        const doomed = (slice.sections || []).filter((sid) => {
          if (!sid.startsWith(`${CMS_SECTION_TYPE}-`)) return false;
          return slice.content?.[sid]?.elements?.collectionId === collectionId;
        });
        for (const sid of doomed) {
          slice.sections = slice.sections.filter((id) => id !== sid);
          delete slice.sectionLayouts[sid];
          delete slice.content[sid];
          removed++;
          if (state.selectedSection === sid) state.selectedSection = undefined;
          state.multiSelection = state.multiSelection.filter((id) => id !== sid);
        }
      };

      sweep(state as any);
      for (const page of Object.values(state.pages || {})) {
        // Older drafts can carry page entries without a full slice.
        if (!page || !Array.isArray((page as any).sections)) continue;
        sweep(page as any);
      }

      if (removed > 0) {
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }
    });
    return removed;
  },
});
