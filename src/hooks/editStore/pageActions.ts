// hooks/editStore/pageActions.ts — multi-page axis actions (Phase 1).
//
// See multiPagePlan.md. Phase 1 "Add page" clones the home slice so the new page
// is immediately valid and renderable (no blank-canvas problem, no drag-drop).
// Real template archetypes replace the clone in Phase 4.

import type { EditStore, ProjectPageEntry, PageSlice, PageSeo } from '@/types/store';
import { commitActivePage, loadPageIntoActive, findHomeId, splitChrome, HOME_PAGE_ID } from './pageHelpers';
import { getCollectionDef } from '@/modules/collections/registry';
import { buildCatalogSlice, buildProductDetailSlice, buildHomeSlice, buildGallerySlice, buildContactSlice } from './archetypes';
import { syncCollection, findCatalogPage, collectionItems } from './collectionHelpers';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { DEFAULT_CONTACT_FIELDS, CONTACT_SUBMIT_TEXT, CONTACT_SUCCESS_MESSAGE } from '@/modules/templates/techpremium/blocks/Contact/contactFields';
import { logger } from '@/lib/logger';
import { isReservedBlogPath } from '@/utils/reservedPaths';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

/** Body-slice builders keyed by archetype (Phase 4b/4c). `contact` is excluded — it
 *  needs a provisioned formId, so it's created only via addArchetypePage (not the
 *  generic applyArchetype path). */
const ARCHETYPE_BUILDERS: Record<string, () => PageSlice> = {
  home: buildHomeSlice,
  gallery: buildGallerySlice,
};

/** Standalone archetype pages (Phase 4c): one-of-a-kind singletons (gallery, contact). */
const ARCHETYPE_PAGE_SPECS: Record<string, { pathSlug: string; title: string }> = {
  gallery: { pathSlug: '/gallery', title: 'Gallery' },
  contact: { pathSlug: '/contact', title: 'Contact' },
};

/** Immer-draft helper: add a link to the shared header nav (idempotent by href).
 *  Mirrors the inline nav-add in ensureCatalogDraft; reflects into the live mirror. */
function addNavLink(state: any, label: string, href: string): void {
  try {
    const header: any = state.chrome?.header;
    const navItems = header?.data?.elements?.nav_items;
    if (Array.isArray(navItems) && !navItems.some((n: any) => n?.href === href)) {
      const navItem = { id: `nav-${Math.random().toString(36).slice(2, 7)}`, label, href };
      navItems.push(navItem);
      const mirror: any = header.id ? (state.content as any)?.[header.id] : undefined;
      if (mirror?.elements && Array.isArray(mirror.elements.nav_items)) {
        mirror.elements.nav_items = [...mirror.elements.nav_items, { ...navItem }];
      }
    }
  } catch {
    /* best-effort */
  }
}

/** Immer-draft helper: ensure a 'Contact' lead form exists in state.forms; returns its id.
 *  Idempotent — reuses an existing 'Contact' form. Seeds readable field ids so the
 *  dashboard columns are meaningful, and a dashboard integration so submissions land. */
function ensureContactForm(state: any): string {
  if (!state.forms) state.forms = {};
  const existing = Object.values(state.forms).find((f: any) => f?.name === 'Contact');
  if (existing) return (existing as any).id;
  const id = `form-${Date.now()}`;
  state.forms[id] = {
    id,
    name: 'Contact',
    fields: clone(DEFAULT_CONTACT_FIELDS),
    submitButtonText: CONTACT_SUBMIT_TEXT,
    successMessage: CONTACT_SUCCESS_MESSAGE,
    integrations: [{ id: 'int-dashboard', type: 'dashboard', name: 'Dashboard', enabled: true }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return id;
}

function genPageId(): string {
  return `page-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** A pathSlug under basePath that collides with no existing page (append -2/-3…). */
function uniqueItemSlug(pages: Record<string, ProjectPageEntry>, basePath: string, title: string): string {
  const base = `${basePath}/${slugify(title) || 'item'}`;
  const taken = new Set(Object.values(pages || {}).map((p) => p.pathSlug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Read the catalog page's first category id (for seeding a new product), if any. */
function firstCategoryId(state: any, collectionKey: string): string | undefined {
  const def = getCollectionDef(collectionKey);
  const catalog = def && findCatalogPage(state.pages || {}, collectionKey);
  if (!catalog || !def) return undefined;
  const sid = (catalog.sections ?? []).find((id: string) => extractSectionType(id) === def.catalogSectionType);
  const cats = sid ? (catalog.content as any)?.[sid]?.elements?.categories : undefined;
  return Array.isArray(cats) && cats[0]?.id ? cats[0].id : undefined;
}

/** Immer-draft helper: ensure the catalog singleton exists; returns its id. */
function ensureCatalogDraft(state: any, collectionKey: string): string {
  const def = getCollectionDef(collectionKey);
  if (!def) return '';
  if (!state.pages) state.pages = {};
  const existing = findCatalogPage(state.pages, collectionKey);
  if (existing) return existing.id;
  const id = genPageId();
  const order = Object.keys(state.pages).length;
  state.pages[id] = {
    id,
    archetypeKey: def.catalogArchetypeKey,
    pathSlug: def.basePath,
    title: def.label,
    order,
    kind: 'singleton',
    collectionKey,
    ...buildCatalogSlice(),
  } as ProjectPageEntry;

  // Best-effort discoverability: add a "Products" link to the shared nav so the
  // catalog is reachable from the published header. No-op if the header has no
  // nav_items collection. (Rich dropdown nav is Phase 4.)
  try {
    const header: any = (state as any).chrome?.header;
    const navItems = header?.data?.elements?.nav_items;
    if (Array.isArray(navItems) && !navItems.some((n: any) => n?.href === def.basePath)) {
      const navItem = { id: `nav-${Math.random().toString(36).slice(2, 7)}`, label: def.label, href: def.basePath };
      navItems.push(navItem);
      // Reflect in the live mirror's header section, if present, for immediate UI.
      const mirror: any = header.id ? (state.content as any)?.[header.id] : undefined;
      if (mirror?.elements && Array.isArray(mirror.elements.nav_items)) {
        mirror.elements.nav_items = [...mirror.elements.nav_items, { ...navItem }];
      }
    }
  } catch {
    /* best-effort */
  }
  return id;
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
      // Blog (Phase 1): /blog* is reserved for the blog pipeline — a page there
      // would collide with blog routes/blobs (server guard: renderPublishedExport).
      if (opts.pathSlug && isReservedBlogPath(opts.pathSlug)) {
        logger.warn(`addPage: '${opts.pathSlug}' is reserved for the blog`);
        return '';
      }
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

    applyArchetype: (archetypeKey: string = 'home') =>
      set((state: EditStore) => {
        const builder = ARCHETYPE_BUILDERS[archetypeKey];
        if (!builder) {
          logger.warn(`applyArchetype: unknown archetype ${archetypeKey}`);
          return;
        }
        const id = state.currentPageId;
        const entry = id ? state.pages?.[id] : undefined;
        if (!entry) {
          logger.warn('applyArchetype: no active page');
          return;
        }
        // Gate: only home/basic (non-collection) pages. Replacing a collection
        // page's body is incoherent — committing it triggers syncCollection.
        if (entry.collectionKey) {
          logger.warn('applyArchetype: refusing to apply onto a collection page');
          return;
        }
        commitActivePage(state); // flush outgoing edits before replacing the body
        // Defensive: builder emits body-only, but splitChrome guarantees no chrome leak.
        const slice = splitChrome(builder()).body;
        // Replace body-only fields (mirror-safe — chrome stays in state.chrome).
        entry.sections = slice.sections;
        entry.sectionLayouts = slice.sectionLayouts;
        entry.sectionSpacing = slice.sectionSpacing;
        entry.content = slice.content as any;
        entry.archetypeKey = archetypeKey;
        loadPageIntoActive(state, clone(entry)); // re-inject chrome into the working copy
        state.selectedSection = undefined;
        state.selectedElement = undefined;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    // Phase 4c: create a designed standalone page (gallery/contact) in one step —
    // body comes from the archetype builder directly (no home-clone). Singleton:
    // refuses a 2nd of the same archetype (switches to the existing one). Contact
    // provisions its lead form first. Returns the page id.
    addArchetypePage: (archetypeKey: string): string => {
      const spec = ARCHETYPE_PAGE_SPECS[archetypeKey];
      if (!spec) {
        logger.warn(`addArchetypePage: unknown archetype ${archetypeKey}`);
        return '';
      }
      let resultId = '';
      set((state: EditStore) => {
        commitActivePage(state); // flush outgoing edits before mutating pages
        if (!state.pages) state.pages = {};
        const existing = Object.values(state.pages).find((p: any) => p.archetypeKey === archetypeKey);
        if (existing) {
          resultId = (existing as ProjectPageEntry).id;
          loadPageIntoActive(state, clone(existing as ProjectPageEntry));
          state.selectedSection = undefined;
          state.selectedElement = undefined;
          return;
        }
        const id = genPageId();
        const order = Object.keys(state.pages).length;
        let body: PageSlice;
        if (archetypeKey === 'contact') {
          const formId = ensureContactForm(state); // form must exist → form.v1.js injects + dashboard
          body = splitChrome(buildContactSlice(formId)).body;
        } else {
          body = splitChrome((ARCHETYPE_BUILDERS[archetypeKey] || buildGallerySlice)()).body;
        }
        const entry: ProjectPageEntry = {
          id,
          archetypeKey,
          pathSlug: spec.pathSlug,
          title: spec.title,
          order,
          kind: 'singleton',
          ...body,
        };
        state.pages[id] = entry;
        addNavLink(state, spec.title, spec.pathSlug); // discoverable from the shared header
        loadPageIntoActive(state, clone(entry)); // switch to it (inject chrome)
        state.selectedSection = undefined;
        state.selectedElement = undefined;
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
        resultId = id;
      });
      return resultId;
    },

    deletePage: (pageId: string) =>
      set((state: EditStore) => {
        const target = state.pages?.[pageId];
        if (!target) return;
        if (target.pathSlug === '/') {
          logger.warn('deletePage: the home page cannot be deleted');
          return;
        }
        const collectionKey = target.collectionKey && target.kind === 'collectionItem' ? target.collectionKey : undefined;
        delete state.pages[pageId];
        if (state.currentPageId === pageId) {
          const homeId = findHomeId(state.pages);
          const fallback = (homeId && state.pages[homeId]) || Object.values(state.pages)[0];
          if (fallback) loadPageIntoActive(state, clone(fallback as ProjectPageEntry));
        }
        // Deleting a product → re-materialize the catalog (after the active page,
        // if any, was reloaded above so the mirror is consistent).
        if (collectionKey) syncCollection(state, collectionKey);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    renamePage: (pageId: string, title: string, pathSlug?: string) =>
      set((state: EditStore) => {
        const target = state.pages?.[pageId];
        if (!target) return;
        target.title = title;
        // Blog (Phase 1): never allow a page to move onto the reserved /blog* space.
        if (pathSlug && isReservedBlogPath(pathSlug)) {
          logger.warn(`renamePage: '${pathSlug}' is reserved for the blog`);
          pathSlug = undefined;
        }
        if (pathSlug && target.pathSlug !== '/') {
          // Collection items live under basePath; keep slugs unique (publish keys
          // subpages by pathSlug, so a collision would silently overwrite a blob).
          if (target.kind === 'collectionItem' && target.collectionKey) {
            const def = getCollectionDef(target.collectionKey);
            const others: Record<string, ProjectPageEntry> = {};
            for (const [pid, p] of Object.entries(state.pages)) if (pid !== pageId) others[pid] = p as ProjectPageEntry;
            const desired = def && !pathSlug.startsWith(def.basePath + '/') ? `${def.basePath}/${slugify(pathSlug)}` : pathSlug;
            target.pathSlug = uniqueItemSlug(others, def ? def.basePath : '', desired.replace(/^.*\//, '') || title);
          } else {
            target.pathSlug = pathSlug;
          }
        }
        // Slug change → catalog card href changes → re-materialize.
        if (target.kind === 'collectionItem' && target.collectionKey) syncCollection(state, target.collectionKey);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    updatePageSeo: (pageId: string, seo: Partial<PageSeo>) =>
      set((state: EditStore) => {
        const target = state.pages?.[pageId];
        if (!target) return;
        const merged: Partial<PageSeo> = { ...(target.seo || {}), ...seo };
        (Object.keys(merged) as (keyof PageSeo)[]).forEach((k) => {
          if (merged[k] === undefined || merged[k] === '') delete merged[k];
        });
        target.seo = Object.keys(merged).length ? (merged as PageSeo) : undefined;
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

    // ===== Collection system (Phase 3) =====

    ensureCatalogPage: (collectionKey: string): string => {
      let id = findCatalogPage(get().pages || {}, collectionKey)?.id || '';
      if (id) return id;
      set((state: EditStore) => {
        id = ensureCatalogDraft(state, collectionKey);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      });
      return id;
    },

    addCollectionItem: (collectionKey: string, opts: { title?: string } = {}): string => {
      const def = getCollectionDef(collectionKey);
      if (!def) {
        logger.warn(`addCollectionItem: unknown collection ${collectionKey}`);
        return '';
      }
      const newId = genPageId();
      set((state: EditStore) => {
        commitActivePage(state); // flush outgoing edits before mutating pages
        if (!state.pages) state.pages = {};
        ensureCatalogDraft(state, collectionKey);
        const title = opts.title?.trim() || 'New product';
        const pathSlug = uniqueItemSlug(state.pages, def.basePath, title);
        const order = Object.keys(state.pages).length;
        const entry: ProjectPageEntry = {
          id: newId,
          archetypeKey: def.itemArchetypeKey,
          pathSlug,
          title,
          order,
          kind: 'collectionItem',
          collectionKey,
          ...buildProductDetailSlice({ title, categoryId: firstCategoryId(state, collectionKey) }),
        };
        state.pages[newId] = entry;
        loadPageIntoActive(state, clone(entry)); // switch to the new product (inject chrome)
        syncCollection(state, collectionKey); // new card appears in the catalog
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      });
      return newId;
    },

    reorderCollection: (collectionKey: string, orderedIds: string[]) =>
      set((state: EditStore) => {
        if (!state.pages) return;
        commitActivePage(state);
        orderedIds.forEach((pid, i) => {
          const p = state.pages[pid];
          if (p && p.kind === 'collectionItem' && p.collectionKey === collectionKey) p.order = i;
        });
        syncCollection(state, collectionKey);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    setCollectionItemCategory: (collectionKey: string, pageId: string, categoryId: string) =>
      set((state: EditStore) => {
        const def = getCollectionDef(collectionKey);
        const entry = state.pages?.[pageId];
        if (!def || !entry || entry.collectionKey !== collectionKey) return;
        commitActivePage(state);
        const writeCat = (page: any, sectionsArr: string[], contentMap: any) => {
          const sid = (sectionsArr ?? []).find((id: string) => extractSectionType(id) === def.itemSectionType);
          if (sid && contentMap?.[sid]) {
            if (!contentMap[sid].elements) contentMap[sid].elements = {};
            contentMap[sid].elements.category = categoryId;
          }
        };
        writeCat(entry, entry.sections, entry.content);
        if (pageId === state.currentPageId) writeCat(state, state.sections as any, state.content);
        syncCollection(state, collectionKey);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    setCollectionCategories: (
      collectionKey: string,
      categories: Array<{ id: string; title: string; label?: string }>,
    ) =>
      set((state: EditStore) => {
        const def = getCollectionDef(collectionKey);
        if (!def || !state.pages) return;
        commitActivePage(state);
        const catalog = findCatalogPage(state.pages, collectionKey);
        if (!catalog) return;

        const cats = (categories || []).filter((c) => c && c.id);
        const validIds = new Set(cats.map((c) => c.id));
        const fallback = cats[0]?.id || '';

        const writeField = (page: any, sectionType: string, field: string, value: any) => {
          const sid = (page.sections ?? []).find((id: string) => extractSectionType(id) === sectionType);
          const sec = sid ? page.content?.[sid] : undefined;
          if (sec) {
            if (!sec.elements) sec.elements = {};
            sec.elements[field] = clone(value);
          }
        };
        // Write to the stored page + active mirror (by type) to hold the invariant.
        const writeBoth = (pageId: string, sectionType: string, field: string, value: any) => {
          const entry = state.pages[pageId];
          if (entry) writeField(entry, sectionType, field, value);
          if (pageId === state.currentPageId) writeField(state, sectionType, field, value);
        };

        // 1. New category list onto the catalog page.
        writeBoth(catalog.id, def.catalogSectionType, 'categories', cats);

        // 2. Rehome orphans: any product whose category id is gone → first remaining.
        if (fallback) {
          for (const p of Object.values(state.pages)) {
            if (p.kind !== 'collectionItem' || p.collectionKey !== collectionKey) continue;
            const sid = (p.sections ?? []).find((id: string) => extractSectionType(id) === def.itemSectionType);
            const cur = sid ? (p.content as any)?.[sid]?.elements?.category : undefined;
            if (!cur || !validIds.has(cur)) writeBoth(p.id, def.itemSectionType, 'category', fallback);
          }
        }

        syncCollection(state, collectionKey);
        state.persistence.isDirty = true;
        state.lastUpdated = Date.now();
      }),

    getCollectionItems: (collectionKey: string): ProjectPageEntry[] =>
      collectionItems(get().pages || {}, collectionKey),
  };
}
