// src/modules/templates/blockMocks/harness.ts
// Shared jsdom store-mock harness for the dual-renderer parity + editor-basics
// suites (template-factory phase 2). Extracted VERBATIM (behavior-preserving)
// from `renderParity.meridian.test.tsx` so BOTH that test and the conformance
// editor-basics group seed ONE vanilla zustand store the same way, then render
// edit blocks with `mode:'preview'` via `renderToStaticMarkup`.
//
// ── Extraction caveat (plan review note) ────────────────────────────────────
// `vi.mock` / `vi.hoisted` are PER-FILE hoisted and CANNOT live here — each test
// file keeps its own tiny `vi.mock('@/hooks/useEditStore', …)` +
// `vi.mock('@/components/EditProvider', …)` shims that read a hoisted store ref.
// This module extracts ONLY the store SHAPE builder (`buildStoreState`) and the
// store factory (`createHarnessStore`) — the parts that are pure and reusable.
//
// Test-only module: never imported by the app bundle or any `.published.*`
// renderer (zustand `createStore` is a runtime dep but this file is only pulled
// in by vitest files).

import { createStore } from 'zustand';

/** One section seeded into the mock store: its id, stored layout, and content. */
export interface HarnessSection {
  sectionId: string;
  layout: string;
  content: Record<string, any>;
}

/**
 * Build the seeded store STATE from a list of sections. Each content field is
 * stored under `content[sectionId].elements[key] = { value, content }` — the
 * shape the block hooks' `extractLayoutContent` reads. `mode:'preview'` makes the
 * Editable wrappers render the static (marker-emitting) path, which is the only
 * path jsdom can drive (no contentEditable). Extra store slices are stubbed so
 * blocks that read `sections`/`pages`/`forms`/etc. via narrow selectors resolve
 * without a real EditProvider.
 */
export function buildStoreState(sections: HarnessSection[]) {
  const content: Record<string, any> = {};
  const sectionIds: string[] = [];
  for (const s of sections) {
    sectionIds.push(s.sectionId);
    const elements: Record<string, any> = {};
    for (const [key, value] of Object.entries(s.content)) {
      elements[key] = { value, content: value };
    }
    content[s.sectionId] = { elements, layout: s.layout, aiMetadata: {} };
  }
  return {
    content,
    sections: sectionIds,
    pages: {},
    mode: 'preview',
    // Token-scoped id read by the work edit ctx (→ MediaPickerModal). Static stub
    // so the media-picker-wired Img primitive resolves a tokenId under jsdom.
    tokenId: 'harness-token',
    forms: [],
    updateElementContent: () => {},
    setSection: () => {},
    addForm: () => 'noop-form',
    deleteForm: () => {},
    getFormById: () => null,
  };
}

/** Create a vanilla zustand store seeded from `sections` (state is static). */
export function createHarnessStore(sections: HarnessSection[]) {
  return createStore(() => buildStoreState(sections));
}
