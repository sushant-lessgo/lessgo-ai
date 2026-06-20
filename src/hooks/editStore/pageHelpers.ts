// hooks/editStore/pageHelpers.ts — boundary helpers for the multi-page mirror
// + shared chrome (Phase 2).
//
// The top-level `sections|sectionLayouts|sectionSpacing|content` are the live
// working copy of the active page, WITH shared chrome (header/footer) injected.
// Stored `pages[id]` are body-only; the canonical chrome lives in `state.chrome`.
// Reconcile at the boundaries (switch + export): splitChrome on the way out,
// withChrome on the way in. Deep-clone at every boundary to avoid Immer aliasing.
//
// PO must-fix: chrome is identified BY TYPE (`extractSectionType(id)`), never by
// exact id — objectionFlowEngine emits bare-literal 'header'/'footer' ids.

import type { EditStore, PageSlice, ProjectPageEntry, ChromeEntry, ChromeState } from '@/types/store';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { syncCollection, materializeIntoPages, collectionKeysInPages } from './collectionHelpers';

export const HOME_PAGE_ID = 'home';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

/** True if a section id is shared chrome (header/footer), by type. */
export function isChromeId(id: string): boolean {
  const t = extractSectionType(id);
  return t === 'header' || t === 'footer';
}

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
 * Split a working slice into a body-only slice + the chrome entries it contains.
 * Header/footer are detected by type and pulled out.
 */
export function splitChrome(slice: PageSlice): { body: PageSlice; chrome: ChromeState } {
  const body: PageSlice = { sections: [], sectionLayouts: {}, sectionSpacing: {}, content: {} };
  let header: ChromeEntry | null = null;
  let footer: ChromeEntry | null = null;

  for (const id of slice.sections ?? []) {
    const type = extractSectionType(id);
    const entry: ChromeEntry = {
      id,
      layout: slice.sectionLayouts?.[id] ?? 'default',
      spacing: slice.sectionSpacing?.[id],
      data: slice.content?.[id],
    };
    if (type === 'header') { header = entry; continue; }
    if (type === 'footer') { footer = entry; continue; }
    body.sections.push(id);
    if (slice.sectionLayouts?.[id] !== undefined) body.sectionLayouts[id] = slice.sectionLayouts[id];
    if (slice.sectionSpacing?.[id] !== undefined) body.sectionSpacing[id] = slice.sectionSpacing[id] as any;
    if (slice.content?.[id] !== undefined) body.content[id] = slice.content[id];
  }
  return { body, chrome: { header, footer } };
}

/** Compose a working slice from a body-only slice + shared chrome. */
export function withChrome(body: PageSlice, chrome: ChromeState | undefined | null): PageSlice {
  // No shared chrome → passthrough (don't strip; supports legacy/no-chrome pages).
  if (!chrome || (!chrome.header && !chrome.footer)) {
    return {
      sections: [...(body.sections ?? [])],
      sectionLayouts: { ...(body.sectionLayouts ?? {}) },
      sectionSpacing: { ...(body.sectionSpacing ?? {}) },
      content: { ...(body.content ?? {}) },
    };
  }

  const out: PageSlice = { sections: [], sectionLayouts: {}, sectionSpacing: {}, content: {} };
  const put = (entry: ChromeEntry | null) => {
    if (!entry) return;
    out.sections.push(entry.id);
    out.sectionLayouts[entry.id] = entry.layout;
    if (entry.spacing) out.sectionSpacing[entry.id] = entry.spacing;
    out.content[entry.id] = entry.data;
  };

  put(chrome.header);
  for (const id of body.sections ?? []) {
    if (isChromeId(id)) continue; // defensive: never double-inject
    out.sections.push(id);
    if (body.sectionLayouts?.[id] !== undefined) out.sectionLayouts[id] = body.sectionLayouts[id];
    if (body.sectionSpacing?.[id] !== undefined) out.sectionSpacing[id] = body.sectionSpacing[id] as any;
    if (body.content?.[id] !== undefined) out.content[id] = body.content[id];
  }
  put(chrome.footer);
  return out;
}

/**
 * Immer-draft helper: commit the live working copy. Stored page is body-only;
 * any chrome edits sync back into state.chrome.
 */
export function commitActivePage(state: any): void {
  const id = state.currentPageId;
  if (!id || !state.pages?.[id]) return;
  const { body, chrome } = splitChrome(activeSliceFromState(state));
  Object.assign(state.pages[id], clone(body));
  if (!state.chrome) state.chrome = { header: null, footer: null };
  if (chrome.header) state.chrome.header = clone(chrome.header);
  if (chrome.footer) state.chrome.footer = clone(chrome.footer);

  // Phase 3: the page we just flushed is now final in `pages` — re-materialize
  // its collection (catalog items + sibling related) so a record edit on this
  // page propagates to the catalog card. Only when this page belongs to one.
  const collectionKey = state.pages[id].collectionKey;
  if (collectionKey) syncCollection(state, collectionKey);
}

/** Immer-draft helper: load a body-only page entry + inject chrome into the working copy. */
export function loadPageIntoActive(state: any, entry: ProjectPageEntry): void {
  const body: PageSlice = {
    sections: entry.sections ?? [],
    sectionLayouts: entry.sectionLayouts ?? {},
    sectionSpacing: entry.sectionSpacing ?? {},
    content: entry.content ?? {},
  };
  const working = clone(withChrome(body, state.chrome));
  state.currentPageId = entry.id;
  state.sections = working.sections;
  state.sectionLayouts = working.sectionLayouts;
  state.sectionSpacing = working.sectionSpacing;
  state.content = working.content;
}

/**
 * Pure (non-Immer) builder used by export(): returns body-only pages, the
 * committed active page, a guaranteed home entry, and the canonical chrome.
 * Never mutates `state`.
 */
export function buildPagesForExport(state: any): {
  pages: Record<string, ProjectPageEntry>;
  currentPageId: string;
  homeId: string;
  chrome: ChromeState;
} {
  const { body: activeBody, chrome: activeChrome } = splitChrome(activeSliceFromState(state));
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
      ...clone(activeBody),
    };
  }

  const currentPageId = state.currentPageId && pages[state.currentPageId] ? state.currentPageId : homeId;
  pages[currentPageId] = { ...pages[currentPageId], ...clone(activeBody) };

  // Phase 3: export-boundary materialize — idempotent safety net so the frozen
  // publish/save always ships a fresh catalog even if a live trigger was missed.
  // Operates on the plain clone (no active mirror here).
  for (const key of collectionKeysInPages(pages)) materializeIntoPages(pages, key);

  // The active working copy carries the latest chrome edits; fall back to state.chrome.
  const chrome: ChromeState =
    activeChrome.header || activeChrome.footer
      ? clone(activeChrome)
      : clone(state.chrome || { header: null, footer: null });

  return { pages, currentPageId, homeId, chrome };
}
