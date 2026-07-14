// Dual-renderer CONTENT parity for ATELIER — the #1 architectural trap (CLAUDE.md).
// registration/dispatch tests prove each section RESOLVES a block pair; this test
// proves the pair RENDERS the same copy: every visible fixture field must appear
// in BOTH the edit `.tsx` output and the `.published.tsx` output for the same
// content. Catches "field shows in the editor, missing when published" (and vice-
// versa) without a browser — jsdom, `renderToStaticMarkup`.
//
// Co-located with the atelier module (per the renderParity.<t>.test.tsx pattern;
// meridian's lives under templates/__tests__/ — same shape, atelier-scoped here).
//
// The edit `.tsx` blocks read the store via useAtelierBlock (→ useTemplateBlock,
// useEditStore) + useIsElementExcluded (→ useEditStoreContext), so BOTH
// store entry points are mocked onto one vanilla zustand store seeded from the
// shared BLOCK_MOCKS.atelier fixtures (the same the /dev/blocks/atelier gallery +
// screenshot-parity harness use). Store mode is 'preview' so the AtelierEditable
// wrappers render the static, marker-emitting path — the same edit block + same
// extractLayoutContent path, minus the contentEditable machinery jsdom can't drive.
//
// NOTE — chrome-key schema-backing (phase 11b): the edit render reads content via
// extractLayoutContent (serviceElementSchema-gated); the published render takes
// flat props directly. A chrome key present in props but DROPPED by the schema
// would render its mock value on published but the DESIGN PLACEHOLDER in edit →
// this test catches that divergence (unless the placeholder happens to equal the
// mock's visible text). Phase 11b added all atelier chrome keys to the Atelier*
// layouts, so parity should hold.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

import { createHarnessStore } from '@/modules/templates/blockMocks/harness';
import { BLOCK_MOCKS, type BlockMockSection } from '@/modules/templates/blockMocks';
import { resolveAtelierBlock } from '@/modules/templates/atelier/resolveAtelierBlock';

const h = vi.hoisted(() => ({ store: null as any }));

vi.mock('@/hooks/useEditStore', () => ({
  // Honor the selector arg (block hooks subscribe via selectors, not a whole-store
  // destructure) — otherwise the whole state is handed where a section slice is
  // expected and blockContent comes back empty.
  useEditStore: (selector?: (s: any) => any) =>
    selector ? selector(h.store.getState()) : h.store.getState(),
}));

// useIsElementExcluded subscribes via useEditStoreContext().store directly.
vi.mock('@/components/EditProvider', () => ({
  useEditStoreContext: () => ({ store: h.store, isReady: true, isInitialized: true, error: null }),
}));

const SECTIONS: BlockMockSection[] = BLOCK_MOCKS.atelier ?? [];

h.store = createHarnessStore(SECTIONS);

/** Visible text of an HTML string: strips tags, aria-hidden subtrees, collapses whitespace. */
function visibleText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[aria-hidden="true"], script, style').forEach((n) => n.remove());
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

// Fixture keys that are NOT visible copy (attributes, media, icon names, flags).
const NON_VISIBLE_KEY =
  /(^id$|icon|href|image|video|placeholder|^featured$|is_featured|form_id|number$|^mode$|^platform$)/i;

/** Collect { key, text } pairs of visible copy from a fixture content object. */
function visibleFields(obj: Record<string, any>, prefix = ''): Array<{ key: string; text: string }> {
  const out: Array<{ key: string; text: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    if (NON_VISIBLE_KEY.test(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      const text = visibleText(value); // fixtures may embed <em>/<br>
      if (text) out.push({ key: path, text });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'string') {
          const text = visibleText(item);
          if (text) out.push({ key: `${path}[${i}]`, text });
        } else if (item && typeof item === 'object') {
          out.push(...visibleFields(item, `${path}[${i}]`));
        }
      });
    }
  }
  return out;
}

describe('atelier fixtures are enrolled', () => {
  it('BLOCK_MOCKS.atelier is non-empty (parity is not vacuous)', () => {
    expect(SECTIONS.length).toBeGreaterThan(0);
  });
});

describe.each(SECTIONS)('atelier $sectionType ($layout) [$sectionId] content parity', (s) => {
  const Edit = resolveAtelierBlock(s.sectionType, 'edit')!;
  const Published = resolveAtelierBlock(s.sectionType, 'published')!;
  const fields = visibleFields(s.content);

  it('has visible fixture fields to compare', () => {
    expect(fields.length).toBeGreaterThan(0);
  });

  it('no field renders in one mode but not the other', () => {
    const editText = visibleText(renderToStaticMarkup(<Edit sectionId={s.sectionId} />));
    const publishedText = visibleText(
      renderToStaticMarkup(<Published sectionId={s.sectionId} {...s.content} />),
    );
    // Parity = symmetric. A field missing from BOTH is consistent behavior; a field
    // present in exactly ONE mode is the dual-renderer bug.
    const diverged: string[] = [];
    for (const f of fields) {
      const inEdit = editText.includes(f.text);
      const inPublished = publishedText.includes(f.text);
      if (inEdit !== inPublished) {
        diverged.push(
          `${f.key} "${f.text}" — edit: ${inEdit ? 'yes' : 'MISSING'}, published: ${inPublished ? 'yes' : 'MISSING'}`,
        );
      }
    }
    expect(diverged, diverged.join('\n')).toEqual([]);
  });

  it('most fixture fields actually render (fixture is not dead)', () => {
    const publishedText = visibleText(
      renderToStaticMarkup(<Published sectionId={s.sectionId} {...s.content} />),
    );
    const rendered = fields.filter((f) => publishedText.includes(f.text));
    // Guards against the parity test passing vacuously because nothing renders.
    expect(rendered.length).toBeGreaterThanOrEqual(Math.ceil(fields.length * 0.5));
  });
});
